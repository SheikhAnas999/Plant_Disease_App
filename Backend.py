from fastapi import FastAPI, File, UploadFile, Query
from pydantic import BaseModel
from transformers import ViTForImageClassification
from torchvision import transforms
from PIL import Image
from fastapi.middleware.cors import CORSMiddleware

import torch
import chromadb
import json
import re
import io

from langchain.vectorstores import Chroma
import replicate
from typing import List
import openai


app = FastAPI()

# CORS configuration to allow requests from any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins during development; change for production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)


class ReplicateLlama2Embeddings:
    """
    A simple embedding class for Llama2 embeddings via Replicate.

    model_version: The specific model version on replicate, e.g.
       "andreasjansson/llama-2-7b-embeddings:xxxx..."
    """
    def __init__(self, replicate_api_token: str, 
                 model_version: str = "andreasjansson/llama-2-7b-embeddings:65c48f4d3e526a873d03ab973ca05989bbcdbdf9aca65fdee7ad2a9757e5b8fa"):
        self.client = replicate.Client(api_token=replicate_api_token)
        self.model_version = model_version

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            result = self.client.run(
                self.model_version,
                input={"text": text}
            )
            embeddings.append(result)  
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        result = self.client.run(
            self.model_version,
            input={"text": text}
        )
        return result


class ReplicateLlama2LLM:
    """
    A simple LLM class that wraps Llama2 (Chat) via Replicate.

    model_version: The specific model version on replicate, e.g.
       "meta/llama-2-7b-chat:xxxx..."
    """
    def __init__(self, replicate_api_token: str,
                 model_version: str = "meta/llama-2-70b-chat"):
        self.client = replicate.Client(api_token=replicate_api_token)
        self.model_version = model_version

    def invoke(self, prompt: str) -> str:
        output = self.client.run(
            self.model_version,
            input={"prompt": prompt, "max_new_tokens": 512}
        )
        if isinstance(output, str):
            return output
        elif isinstance(output, list):
            return "".join(output)
        else:
            return str(output)


class OpenAIEmbeddings:
    """
    A simple embedding class for OpenAI embeddings (e.g. text-embedding-ada-002).
    """
    def __init__(self, openai_api_key: str, model: str = "text-embedding-ada-002"):
        # Set your OpenAI key
        openai.api_key = openai_api_key
        self.model = model

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        response = openai.Embedding.create(model=self.model, input=texts)
        embeddings = [d["embedding"] for d in response["data"]]
        return embeddings

    def embed_query(self, text: str) -> List[float]:
        response = openai.Embedding.create(model=self.model, input=[text])
        return response["data"][0]["embedding"]


class OpenAILLM:
    """
    A simple LLM class that uses OpenAI GPT for generating text (GPT-3.5-turbo by default).
    """
    def __init__(self, openai_api_key: str, model_name: str = "gpt-3.5-turbo"):
        openai.api_key = openai_api_key
        self.model_name = model_name

    def invoke(self, prompt: str) -> str:
        response = openai.ChatCompletion.create(
            model=self.model_name,
            messages=[
                {"role": "system", "content": "You are an expert plant disease management assistant."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        return response["choices"][0]["message"]["content"]


REPLICATE_API_KEY = "Place Your API Token Here"
embedding_function_llama2 = ReplicateLlama2Embeddings(replicate_api_token=REPLICATE_API_KEY)
llm_llama2 = ReplicateLlama2LLM(replicate_api_token=REPLICATE_API_KEY)

OPENAI_API_KEY = "Place Your API Token Here"
embedding_function_openai = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
llm_openai = OpenAILLM(openai_api_key=OPENAI_API_KEY, model_name="gpt-3.5-turbo")

# Create two separate persistent Chroma clients/collections
persistent_client = chromadb.PersistentClient(path="/Plant Disease App/plant_disease_data")

vector_store_llama2 = Chroma(
    client=persistent_client,
    collection_name="plant_disease_documents",
    embedding_function=embedding_function_llama2
)

vector_store_openai = Chroma(
    client=persistent_client,
    collection_name="plant_disease_documents",
    embedding_function=embedding_function_openai
)

# Pydantic model for structured response
class DiseaseResponse(BaseModel):
    disease_name: str
    symptoms: str
    causes: str
    recommended_solutions: str
    pesticide_recommendations: str

# Paths for model and label mapping
model_path = "L:/Plant Disease App/Classification_Model/saved_models/final_model.pt"
with open("L:/Plant Disease App/Classification_Model/saved_models/label_mapping.json", "r") as f:
    label_mapping = json.load(f)

index_to_label_mapping = {v: k for k, v in label_mapping.items()}

# Image transformation
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])


def classify_disease(image: Image.Image):
    """Classify the disease using a ViT model."""
    input_tensor = transform(image).unsqueeze(0)

    model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224-in21k", num_labels=65
    )
    model.load_state_dict(torch.load(model_path, weights_only=True))
    model.eval()

    with torch.no_grad():
        outputs = model(input_tensor)
        logits = outputs.logits
        predicted_label = logits.argmax(dim=1).item()

    disease_name = index_to_label_mapping.get(predicted_label, "Unknown Disease")
    return disease_name

def search_documents_by_disease(vector_store: Chroma, disease_name: str):
    """
    Search documents from the appropriate vector store by disease name.
    """
    results = vector_store._collection.get(where={"disease_name": disease_name})
    if not results['documents']:
        return None

    retrieved_info = []
    for i, doc in enumerate(results['documents']):
        disease_info = (
            f"Result {i + 1}:\n"
            f"Metadata: {results['metadatas'][i]}\n"
            f"Page Content: {doc}\n"
        )
        retrieved_info.append(disease_info)

    return "\n".join(retrieved_info)

def generate_llm_response(llm, disease_name: str, retrieved_info: str, language: str = "english"):
    """
    Generates a structured response using whichever LLM we pass in.
    If language == 'urdu', we instruct the LLM to craft a clear, accessible, and accurate response in Urdu.
    """

    # We'll insert a note for how to handle missing data and the language:
    if language.lower() == "urdu":
        language_note = (
            "Very IMPORTANT: Provide your entire response in easy-to-understand Urdu. "
            "Use simple, clear sentences so the user can understand without difficulty. "
        )
    else:
        language_note = (
            "IMPORTANT: Provide the response in clear, concise, and easy-to-understand English. "
            "If any section lacks data, write 'No relevant information found'."
        )

    prompt = f"""
    You are an expert in plant diseases and management. The user has queried about '{disease_name}'.
    Combine the retrieved information below with your own expert knowledge of plant science and 
    plant disease management to craft a comprehensive yet user-friendly explanation. 
    You must address each of the following sections thoroughly:

    1. Symptoms: List known symptoms for the {disease_name}, supplementing the retrieved data 
       with any additional signs or variations.
    2. Causes: Describe the causes for the {disease_name}, using both the retrieved information 
       and your expertise.
    3. Recommended Solutions: Provide actionable solutions, combining best practices from the 
       retrieved data with additional strategies that a farmer could realistically implement.
    4. Pesticide Recommendations: Suggest appropriate pesticides with usage instructions and 
       safety precautions.

    If you do not have enough details for a given section, clearly say 'No relevant information found' 
    (or use 'کوئی متعلقہ معلومات دستیاب نہیں' if responding in Urdu).

    Retrieved Information:
    {retrieved_info}

    {language_note}

    Note: You must provide a direct answer for each section: 
    'Symptoms:', 'Causes:', 'Recommended Solutions:', and 'Pesticide Recommendations:'.
    Do not leave any section empty or missing.Make clear statements or lines for all the above sections.make sure to not use \n,\t,\\n,*,\n1,\n2,\\,\n3 for any section in your response. 
    """

    response_text = llm.invoke(prompt)

    # Extract with regex
    symptoms = re.search(
        r"Symptoms:\s*(.*?)(?=Causes:|Recommended Solutions:|Pesticide Recommendations:|$)",
        response_text,
        re.DOTALL
    )
    causes = re.search(
        r"Causes:\s*(.*?)(?=Symptoms:|Recommended Solutions:|Pesticide Recommendations:|$)",
        response_text,
        re.DOTALL
    )
    recommended_solutions = re.search(
        r"Recommended Solutions:\s*(.*?)(?=Symptoms:|Causes:|Pesticide Recommendations:|$)",
        response_text,
        re.DOTALL
    )
    pesticide_recommendations = re.search(
        r"Pesticide Recommendations:\s*(.*?)(?=Symptoms:|Causes:|Recommended Solutions:|$)",
        response_text,
        re.DOTALL
    )

    # Provide fallback text if any section is not found
    missing_english = "No relevant information found"
    missing_urdu = "کوئی متعلقہ معلومات دستیاب نہیں"

    if language.lower() == "urdu":
        default_missing = missing_urdu
    else:
        default_missing = missing_english

    response_data = DiseaseResponse(
        disease_name=disease_name,
        symptoms=symptoms.group(1).strip() if symptoms else default_missing,
        causes=causes.group(1).strip() if causes else default_missing,
        recommended_solutions=recommended_solutions.group(1).strip() if recommended_solutions else default_missing,
        pesticide_recommendations=pesticide_recommendations.group(1).strip() if pesticide_recommendations else default_missing
    )

    return response_data.json()



@app.post("/classify")
async def classify_image(
    file: UploadFile = File(...),
    model_name: str = Query(..., description="Choose 'llama2' or 'gpt-3.5-turbo'"),
    language: str = Query("english", description="Choose 'english' or 'urdu'"),
):
    """
    Classify the plant disease from an uploaded image and get a response from 
    either Llama2 via Replicate OR GPT-3.5 via OpenAI, depending on `model_name`.
    Additionally, select the language ('english' or 'urdu') for the final answer.
    """
    try:
        # Read image data
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data)).convert("RGB")

        # Step 1: Classify disease
        disease_name = classify_disease(image)

        # Step 2: Choose the correct embedding & LLM based on model_name
        if model_name.lower() == "llama2":
            vector_store = vector_store_llama2
            llm = llm_llama2
        elif model_name.lower() == "gpt-3.5-turbo":
            vector_store = vector_store_openai
            llm = llm_openai
        else:
            return {"error": "Invalid model_name. Choose 'llama2' or 'gpt-3.5-turbo'."}

        # Step 3: Search for information about this disease in the chosen vector store
        retrieved_info = search_documents_by_disease(vector_store, disease_name)
        if not retrieved_info:
            return {"error": f"No information found for disease: {disease_name}"}

        # Step 4: Generate response using the selected LLM, in the chosen language
        llm_response_json = generate_llm_response(llm, disease_name, retrieved_info, language=language)
        return json.loads(llm_response_json)

    except Exception as e:
        return {"error": f"An error occurred while processing the image: {str(e)}"}

# --------------------- MAIN ENTRY POINT ---------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

