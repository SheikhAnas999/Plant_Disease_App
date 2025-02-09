import json
from langchain_core.documents import Document
from langchain_ollama import OllamaEmbeddings
from langchain_text_splitters import RecursiveJsonSplitter
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field
from langchain_chroma import Chroma
from langchain.schema import Document
import chromadb
import uuid



def read_plant_disease_data(file_path, encoding="utf-8"):
  try:
    with open(file_path, "r", encoding=encoding) as file:
      return json.load(file)
  except FileNotFoundError:
    raise FileNotFoundError(f"File not found: {file_path}")

def convert_to_langchain_documents(data_list):
    langchain_documents = {}
    for plant_info in data_list:
        # Iterate through all diseases within the plant information
        for plant_name, plant_diseases in plant_info.items():
            for disease_name, disease_content in plant_diseases.items():
                # Extract content and create document
                content = disease_content.get("Content", None)
                if content is not None:
                    metadata = {"plant": plant_name, "disease_name": disease_name}
                    document = Document(page_content=content, metadata=metadata)
                    langchain_documents[disease_name] = document
    return langchain_documents
plant_data = read_plant_disease_data("Plant Disease Management Dataset .json")  
langchain_docs = convert_to_langchain_documents(plant_data)
        
class Document(BaseModel):
    """Interface for interacting with a document."""

    metadata: dict = Field(default_factory=dict)
    page_content: str

    def __json__(self):
        return {
            "metadata": self.metadata,
            "page_content": self.page_content
        }
    
json_data = {}

# Iterate through langchain_docs, where each value is a Document object
for key, document in langchain_docs.items():
    # Access the 'Disease Name' from the 'metadata' of the Document object
    disease_name = document.metadata.get('disease_name')
    
    if disease_name:  # Only add if 'disease_name' exists
        json_data[disease_name] = jsonable_encoder({
            "metadata": document.metadata,
            "page_content": document.page_content
        })

# Print the JSON data
json_Plant_data = json.dumps(json_data, indent=4)
print(json_Plant_data)
loaded_json_data = json.loads(json_Plant_data)
splitter = RecursiveJsonSplitter(max_chunk_size=500)
json_chunks = splitter.split_json(json_data=loaded_json_data)

from langchain.docstore.document import Document
import uuid

documents = []

# Iterate over the elements in json_chunks (which is a list)
for index, chunk in enumerate(json_chunks):
    if isinstance(chunk, dict):
        # Each chunk is a dictionary, so iterate through its keys and values
        for disease_name, disease_data in chunk.items():
            if "metadata" in disease_data and "page_content" in disease_data:
                try:
                    # Generate a unique ID and add it to the metadata
                    unique_id = str(uuid.uuid4())
                    metadata = disease_data["metadata"]
                    metadata["id"] = unique_id  # Add the unique ID to the metadata

                    # Create and append the Document object using the disease data
                    documents.append(
                        Document(
                            page_content=disease_data["page_content"], 
                            metadata=metadata  # Metadata now includes the unique ID
                        )
                    )
                except KeyError as e:
                    print(f"KeyError: {e} in item at index {index}: {disease_data}")
            else:
                print(f"Missing keys in item at index {index}: {disease_data}")
    else:
        print(f"Expected dictionary in json_chunks at index {index}, but got {type(chunk)}.")

# Check the length of documents
print(f"Length of documents: {len(documents)}")

# Check the metadata of the first document (for example)
if documents:
    print(f"Metadata of first document: {documents[0].metadata}")

# print(documents)

embedding_function = OllamaEmbeddings(
    model="llama2",
)
persistent_client = chromadb.PersistentClient(path="/Plant Disease App/plant_disease_data")

# Initialize the collection
vector_store = Chroma(
    client=persistent_client,
    collection_name="plant_disease_documents",
    embedding_function=embedding_function
)

# Inserting documents into ChromaDB one at a time
for idx, doc in enumerate(documents):
    print(f"Inserting document {idx+1}/{len(documents)}...")
    vector_store.add_documents([doc])  # Insert one document at a time
    print(f"Document {idx+1} inserted.")

print("Documents inserted into ChromaDB successfully!")







