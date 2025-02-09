// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getStorage } from "firebase/storage";
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAIm6iAvmsDgnwhOoT7kAxQbWhB2XKl0Y0",
  authDomain: "final-year-project-9f206.firebaseapp.com",
  projectId: "final-year-project-9f206",
  storageBucket: "final-year-project-9f206.appspot.com",
  messagingSenderId: "533105247588",
  appId: "1:533105247588:web:bb4a2f95d76f074ce9a671"
};
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with persistence
const my_auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) // Use AsyncStorage for persistence
});

// Initialize Firestore (Database)
const my_database = getFirestore(app); // Create Firestore instance

// Initialize Firebase Storage for media uploads
const storage = getStorage(app); // Initialize storage for file handling

// Export all necessary services for use in the app
export { my_auth, my_database, storage };





























