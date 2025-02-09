# 🌱 Plant Disease Detection App

## 📌 Overview
The **Plant Disease Detection App** is a React Native application designed to identify plant diseases using a **Retrieval-Augmented Generation (RAG) model** and a **classification model**. The app scans images of plants, detects diseases, and provides recommended solutions to help farmers and gardeners take corrective action.

## ⚡ Features
- 📸 **Image-Based Disease Detection**: Upload or capture plant images to analyze diseases.
- 🧠 **AI-Powered Analysis**: Uses a **classification model** to identify diseases.
- 📚 **RAG-Based Recommendations**: Provides solutions and insights using a retrieval-based AI model.
- 🌍 **Cross-Platform**: Built with React Native for both Android and iOS.

## 🛠 Requirements
Before running the app, ensure that you have the following installed:
- **Node.js** (Version 20+)
- **React Native CLI** & dependencies
- **Python** (for backend model processing)
- **Requirements file** included (`requirements.txt`)

## 🚀 Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/your-username/Plant_Disease_App.git
cd Plant_Disease_App
```

### 2️⃣ Install Dependencies
```sh
npm install
```
For backend requirements:
```sh
pip install -r requirements.txt
```

### 3️⃣ Download the Classification Model
The classification model required for plant disease detection is **not included** in the repository due to size constraints.

📥 **Download the model from Google Drive:** [https://drive.google.com/file/d/151YOR5qO7wtaafeSUzcmdQNKN56DcXs5/view?usp=sharing]

📌 **After downloading, place the model in the following directory:**
```
Plant_Disease_App/Classification_Model/saved_models
```

### 4️⃣ Start the App
For Android:
```sh
npx react-native run-android
```
For iOS:
```sh
npx react-native run-ios
```

### 5️⃣ Run the Backend
```sh
python Backend.py
```

## 🏗 Project Structure
```
Plant_Disease_App/
│-- Backend.py                                   # Python backend with AI models
│-- data_cleaning_and_vector_database_storage.py # Creating DataBase 
│-- plant_disease_data                           # Vector Databse      
│-- Frontend/                                    # React Native frontend
│-- requirements.txt                             # Backend dependencies
│-- Classification_Model/saved_models            # Downloaded classification model (place it here)
│-- README.md                                    # Project documentation
```

## 🤝 Contributing
Contributions are welcome! Feel free to submit issues and pull requests.

## 📜 License
This project is licensed under the **MIT License**.

## 📬 Contact
For any questions, feel free to reach out via GitHub or email.

---

🚀 **Happy Coding & Healthy Plants! 🌿**

