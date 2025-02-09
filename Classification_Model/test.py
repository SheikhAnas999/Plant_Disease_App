import torch
from transformers import ViTForImageClassification
from torchvision import transforms
from PIL import Image
import json

# Paths to the saved model file, test image, and label mapping JSON file
model_path = "L:/Plant Disease App/Classification_Model/saved_models/final_model.pt"
image_path = "L:\Plant Disease App\Classification_Model\Images Dataset of plants\Corn\Common_Rust_Corn\Corn_Common_Rust (1).jpg"  # Update with your test image path
label_mapping_path = "L:/Plant Disease App/Classification_Model/saved_models/label_mapping.json"

# Define the model architecture with the same number of labels as used during training
model = ViTForImageClassification.from_pretrained("google/vit-base-patch16-224-in21k", num_labels=65)
model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')), strict=False)
model.eval()  # Set the model to evaluation mode

# Define the transformations applied to test images
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Load label mapping from JSON file
with open(label_mapping_path, "r") as f:
    label_mapping = json.load(f)

# Reverse the mapping to create a dictionary mapping index to disease name
index_to_label_mapping = {v: k for k, v in label_mapping.items()}

# Function to classify the disease from an image
def classify_disease(image_path: str):
    # Load and preprocess the image
    image = Image.open(image_path).convert("RGB")
    input_tensor = transform(image).unsqueeze(0)  # Add batch dimension

    # Run inference
    with torch.no_grad():
        outputs = model(input_tensor)
        logits = outputs.logits
        predicted_label = logits.argmax(dim=1).item()  # Get the predicted label index
        print(f"Predicted label index: {predicted_label}")  # Debugging line

    # Check if the predicted label exists in the reversed mapping
    disease_name = index_to_label_mapping.get(predicted_label, "Unknown Disease")

    return disease_name

# Call the classify_disease function and print the result
if __name__ == "__main__":
    disease_name = classify_disease(image_path)
    print(f"Predicted disease: {disease_name}")
