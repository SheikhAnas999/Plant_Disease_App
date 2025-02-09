import os
from PIL import Image, UnidentifiedImageError
import torch
from torchvision import transforms
from sklearn.model_selection import train_test_split
from torch import nn, optim
from transformers import ViTForImageClassification
from torch.utils.data import Dataset, DataLoader
import random

# Define the root folder where all plant disease folders are stored
root_folder = "L:\\Plant Disease App\\Classification_Model\\Images Dataset of plants"  # Ensure the path is correct

# Define the basic image transformations (resize and normalization)
basic_transform = transforms.Compose([
    transforms.Resize((224, 224)),  # Resize images to 224x224 for ViT
    transforms.ToTensor(),  # Convert images to PyTorch tensors
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])  # Normalize with ImageNet stats
])

# Define additional augmentations for 30% of images
augmented_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.RandomRotation(degrees=30),  # Random rotation by 30 degrees
    transforms.RandomHorizontalFlip(p=0.5),  # Random horizontal flip
    transforms.RandomVerticalFlip(p=0.5),  # Random vertical flip
    transforms.ColorJitter(brightness=0.4, contrast=0.4, saturation=0.4, hue=0.2),  # Color jitter
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Lists to hold image file paths and corresponding labels
image_paths = []
labels = []
skipped_images = 0  # To count the number of skipped images

# Loop through the root folder to find plant disease folders
for plant in os.listdir(root_folder):
    plant_folder = os.path.join(root_folder, plant)
    
    if os.path.isdir(plant_folder):  # Check if it's a directory
        for disease in os.listdir(plant_folder):
            disease_folder = os.path.join(plant_folder, disease)
            
            if os.path.isdir(disease_folder):  # Check if it's a directory
                for image_file in os.listdir(disease_folder):
                    if image_file.endswith(('.jpg', '.png','.JPG','.jpeg')):  # Check for image files
                        image_path = os.path.join(disease_folder, image_file)
                        try:
                            # Open image to ensure it's valid
                            img = Image.open(image_path)
                            img.verify()  # Verify the image to check for corruption
                            image_paths.append(image_path)
                            labels.append(disease)  # Disease name as label
                        except (UnidentifiedImageError, OSError):
                            skipped_images += 1  # Increment skipped images count
                            print(f"Skipped corrupted image: {image_path}")

# Print the number of images, unique labels, and skipped images
print(f"Number of images: {len(image_paths)}")
print(f"Unique disease labels: {len(set(labels))}")
print(f"Skipped images: {skipped_images}")

# Custom dataset for loading plant disease images
class PlantDiseaseDataset(Dataset):
    def __init__(self, image_paths, labels, basic_transform, augmented_transform, augment_ratio=0.4):
        self.image_paths = image_paths
        self.labels = labels
        self.basic_transform = basic_transform
        self.augmented_transform = augmented_transform
        self.augment_ratio = augment_ratio
        self.label2idx = {label: idx for idx, label in enumerate(sorted(set(labels)))}

        # Duplicate 40% of the images for augmentation
        num_augmented = int(len(self.image_paths) * self.augment_ratio)
        augmented_image_paths = random.sample(self.image_paths, num_augmented)
        augmented_labels = [self.labels[self.image_paths.index(path)] for path in augmented_image_paths]
        
        # Append augmented images and labels to the original lists
        self.image_paths += augmented_image_paths
        self.labels += augmented_labels

    def __len__(self):
        return len(self.image_paths)

    def __getitem__(self, idx):
        image_path = self.image_paths[idx]
        label = self.labels[idx]
        
        try:
            image = Image.open(image_path).convert("RGB")  # Load image as RGB
        except (UnidentifiedImageError, OSError):
            print(f"Skipping invalid image during dataset loading: {image_path}")
            return None, None, False  # Skip invalid image
        
        # Apply transformations: use augmented transformation only for duplicates
        is_augmented = idx >= len(self.image_paths) - int(len(self.image_paths) * self.augment_ratio)
        if is_augmented:
            image = self.augmented_transform(image)  # Apply augmentation to duplicates
        else:
            image = self.basic_transform(image)  # Apply basic transformation to originals
        
        return image, self.label2idx[label], is_augmented  # Return the augmentation flag


# Split dataset into 70% train, 20% validation, and 10% test
train_paths, test_paths, train_labels, test_labels = train_test_split(
    image_paths, labels, test_size=0.1, random_state=42, stratify=labels
)
train_paths, val_paths, train_labels, val_labels = train_test_split(
    train_paths, train_labels, test_size=0.2222, random_state=42, stratify=train_labels  # 0.2222 because 0.2222 * 0.9 ≈ 0.2
)

# Create train, validation, and test datasets
train_dataset = PlantDiseaseDataset(train_paths, train_labels, basic_transform, augmented_transform)
val_dataset = PlantDiseaseDataset(val_paths, val_labels, basic_transform, augmented_transform)
test_dataset = PlantDiseaseDataset(test_paths, test_labels, basic_transform, augmented_transform)

# Create data loaders
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False)
test_loader = DataLoader(test_dataset, batch_size=32, shuffle=False)

# Load pre-trained ViT model for image classification
model = ViTForImageClassification.from_pretrained(
    'google/vit-base-patch16-224-in21k', 
    num_labels=len(set(train_labels))  # Set the number of classes
)

# Move model to the GPU (if available)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model.to(device)

# Define optimizer and loss function
optimizer = optim.AdamW(model.parameters(), lr=5e-5)
loss_fn = nn.CrossEntropyLoss()

# Directory to save the model
save_dir = "L:/Plant Disease App/Classification_Model/saved_models"
os.makedirs(save_dir, exist_ok=True)

# Training loop
num_epochs = 3

for epoch in range(num_epochs):
    model.train()  # Set the model to training mode
    running_loss = 0.0
    correct_predictions = 0
    total_samples_epoch = 0
    total_samples = 0
    total_augmented = 0  # Track total augmented images in the epoch

    for i, batch in enumerate(train_loader):
        # Get the inputs and labels, and the augmented flags
        pixel_values, labels, augmented_flags = batch

        # Skip if a batch contains None values
        if pixel_values is None or labels is None:
            continue
        
        pixel_values, labels = pixel_values.to(device), labels.to(device)
        
        # Zero the parameter gradients
        optimizer.zero_grad()

        # Forward pass
        outputs = model(pixel_values)
        logits = outputs.logits
        loss = loss_fn(logits, labels)

        # Backward pass and optimization
        loss.backward()
        optimizer.step()

        # Track metrics
        running_loss += loss.item() * pixel_values.size(0)
        _, predicted = torch.max(logits, 1)
        correct_predictions += (predicted == labels).sum().item()
        total_samples += labels.size(0)
        total_samples_epoch += labels.size(0)  # Count the total number of images

        # Add the number of augmented images for the batch
        total_augmented += augmented_flags.sum().item()  # Count augmented images

        # Print output for each batch
        print(f"Batch {i+1}/{len(train_loader)}, Loss: {loss.item():.4f}, Accuracy: {(correct_predictions / total_samples):.4f}")

    epoch_loss = running_loss / total_samples
    epoch_accuracy = correct_predictions / total_samples

    print(f"Epoch {epoch+1}/{num_epochs}, Loss: {epoch_loss:.4f}, Accuracy: {epoch_accuracy:.4f}")
    print(f"Total images processed in this epoch: {total_samples}")
    print(f"Total augmented images in this epoch: {total_augmented} ({(total_augmented / total_samples_epoch) * 100:.2f}% of total images)")
    print(f"Total number of images used for training in this epoch: {total_samples_epoch}")

    # Save the model at the end of each epoch
    torch.save(model.state_dict(), os.path.join(save_dir, f"model_epoch_{epoch+1}.pt"))

    # Validation loop 
    model.eval()
    val_loss = 0.0
    val_correct = 0
    val_total = 0

    with torch.no_grad():
        for val_batch in val_loader:
            val_pixel_values, val_labels, _ = val_batch
            val_pixel_values, val_labels = val_pixel_values.to(device), val_labels.to(device)

            val_outputs = model(val_pixel_values)
            val_logits = val_outputs.logits
            val_loss += loss_fn(val_logits, val_labels).item() * val_pixel_values.size(0)

            _, val_predicted = torch.max(val_logits, 1)
            val_correct += (val_predicted == val_labels).sum().item()
            val_total += val_labels.size(0)

    val_loss /= val_total
    val_accuracy = val_correct / val_total
    print(f"Validation Loss: {val_loss:.4f}, Validation Accuracy: {val_accuracy:.4f}")

# Testing loop 
model.eval()
test_loss = 0.0
test_correct = 0
test_total = 0

with torch.no_grad():
    for test_batch in test_loader:
        test_pixel_values, test_labels, _ = test_batch
        test_pixel_values, test_labels = test_pixel_values.to(device), test_labels.to(device)

        test_outputs = model(test_pixel_values)
        test_logits = test_outputs.logits
        test_loss += loss_fn(test_logits, test_labels).item() * test_pixel_values.size(0)

        _, test_predicted = torch.max(test_logits, 1)
        test_correct += (test_predicted == test_labels).sum().item()
        test_total += test_labels.size(0)

test_loss /= test_total
test_accuracy = test_correct / test_total
print(f"Test Loss: {test_loss:.4f}, Test Accuracy: {test_accuracy:.4f}")

# Save the final model
torch.save(model.state_dict(), os.path.join(save_dir, "final_model.pt"))

print("Model training and testing complete. Model saved.")
