import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { signOut, getAuth } from 'firebase/auth'; // Firebase Authentication imports
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Firebase Storage imports
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Firestore import
import { my_firestore } from '../config/Firebase'; // Firestore setup import

const ProfileScreen = () => {
  const [profileImage, setProfileImage] = useState(null); // State for selected image
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);
  const navigation = useNavigation(); // Hook to access navigation
  const auth = getAuth();
  const user = auth.currentUser;

  // Function to handle image selection from the gallery
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'You need to allow access to your photos to change your profile picture.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri; // Get the image URI
      setProfileImage(imageUri); // Update state with the selected image
      uploadImageToFirebase(imageUri); // Upload the image to Firebase
    }
  };

  // Function to convert image URI to Blob
  const getBlobFromUri = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
    return blob;
  };

  // Function to sanitize email (remove the domain part like '@gmail.com' and replace invalid characters for file name)
  const sanitizeEmailForFileName = (email) => {
    const emailWithoutDomain = email.split('@')[0]; // Remove everything after '@'
    return emailWithoutDomain.replace(/[^a-zA-Z0-9]/g, '_'); // Replace invalid characters with '_'
  };

  // Function to upload image to Firebase Storage and update the user's profile
  const uploadImageToFirebase = async (imageUri) => {
    setLoading(true); // Show loading indicator while uploading
    try {
      const storage = getStorage(); // Get Firebase storage instance
      const blob = await getBlobFromUri(imageUri); // Convert image URI to Blob

      const userId = user?.uid; // Get the current user's ID
      if (!userId) throw new Error('User not authenticated');

      const userEmail = user.email || 'unknown'; // Get the user's email
      const fileName = `${sanitizeEmailForFileName(userEmail)}`; // Sanitize the email to create a valid file name

      // Reference for storing the image in the 'profileImages' folder in Firebase Storage
      const storageRef = ref(storage, `profileImages/${fileName}`);
      
      // Metadata for the uploaded file
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          userEmail: user.email || 'unknown', // Pass user's email as metadata
        },
      };

      // Upload the image blob to Firebase Storage
      const uploadTask = uploadBytesResumable(storageRef, blob, metadata);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // You can add progress tracking here if needed
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% done`);
        },
        (error) => {
          // Handle unsuccessful uploads
          Alert.alert('Upload Failed', 'An error occurred while uploading your profile image.');
          console.log('Error:', error);
        },
        async () => {
          // Handle successful uploads on complete
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Update the user's profile image URL in Firestore
          const userDocRef = doc(my_firestore, 'users', userId); // Firestore document reference
          await updateDoc(userDocRef, {
            profileImageUrl: downloadURL, // Store the URL in Firestore
          });
          console.log(downloadURL);
          setProfileImage(downloadURL); // Update the local state to display the new image
          
          Alert.alert('Profile Updated', 'Your profile image has been updated.');
        }
      );
    } catch (error) {
      Alert.alert('Upload Failed', 'An error occurred while uploading your profile image.');
      console.log('Error:', error);
    } finally {
      setLoading(false); // Hide loading indicator after uploading
    }
  };

  // Function to fetch profile image URL from Firebase Storage
const fetchProfileImage = async () => {
  try {
    const storage = getStorage(); // Get Firebase storage instance
    const userId = user?.uid;
    if (!userId) return;

    const userEmail = user.email || 'unknown'; // Get the user's email
    const fileName = `${sanitizeEmailForFileName(userEmail)}`; // Create the sanitized file name

    const storageRef = ref(storage, `profileImages/${fileName}`); // Reference to the profile image in Firebase Storage
    const downloadURL = await getDownloadURL(storageRef); // Get the download URL of the image

    if (downloadURL) {
      setProfileImage(downloadURL); // Set the fetched profile image URL in state
    }
  } catch (error) {
    console.log('Error fetching profile image from Firebase Storage:', error);
  }
};

  // useEffect hook to fetch the profile image when the component mounts
  useEffect(() => {
    fetchProfileImage();
  }, []);

  // Function to handle logout with a confirmation alert
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await signOut(auth); // Sign out the user from Firebase
              navigation.replace('Login'); // Navigate to the login screen
            } catch (error) {
              Alert.alert('Logout Failed', 'An error occurred while logging out.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const sanitizedEmail = sanitizeEmailForFileName(user?.email || 'unknown');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsImageViewOpen(true)}>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <Image
              source={profileImage ? { uri: profileImage } : require('../../assets/defaultProfilePic.png')}
              style={styles.profileImage}
            />
          )}
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.name}>{sanitizedEmail}</Text>
          <Text style={styles.subtext}>{user?.email || 'User'}</Text>
        </View>
        
      </View>

      {/* Enlarged Profile Image View Modal */}
      <Modal
        visible={isImageViewOpen}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={profileImage ? { uri: profileImage } : require('../../assets/defaultProfilePic.png')}
              style={styles.enlargedProfileImage}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={pickImage} style={styles.editButton}>
                <Ionicons name="create" size={24} color="black" />
                <Text style={styles.editText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setIsImageViewOpen(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="red" />
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        
 
      {/* Section for Change Password, Feedback, and Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ChangePassword')}>
          <Ionicons name="lock-closed" size={24} color="blue" />
          <Text style={styles.rowText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={24} color="#2D452F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Feedback')}>
          <Ionicons name="chatbox-ellipses" size={24} color="green" />
          <Text style={styles.rowText}>Feedback</Text>
          <Ionicons name="chevron-forward" size={24} color="#2D452F" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="red" />
          <Text style={styles.rowText}>Logout</Text>
          <Ionicons name="chevron-forward" size={24} color="#2D452F" />
        </TouchableOpacity>
      </View>

      {/* Full-Screen Loader Overlay */}
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#CFE2CE" />
        </View>
      )}

      {/* Modal for Profile Image */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(!modalVisible)}
      >
        <View style={styles.modalView}>
          <Pressable
            style={styles.modalButton}
            onPress={pickImage}
          >
            <Text style={styles.modalText}>Select Image</Text>
          </Pressable>
          <Pressable
            style={styles.modalButton}
            onPress={() => setModalVisible(!modalVisible)}
          >
            <Text style={styles.modalText}>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#CFE2CE',
    borderRadius:20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10, 

  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    
  },
  name: {
    fontWeight: '600',
    fontSize: 18,
    color:'#2D452F'
  },
  subtext: {
    color: 'gray',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f4',
    
  },
  rowText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color:'#2D452F'
  },
  section: {
    marginTop: 16,
    backgroundColor: '#fff',
    
  },
  
  enlargedProfileImage: {
    width: 250,
    height: 250,
    borderRadius: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
  },
  editButton: {
    backgroundColor: 'white',
    padding: 10,
    paddingRight: 50,
    borderRadius: 5,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,          // Added borderWidth
    borderColor: 'black',    // Set borderColor to black
  },
  editText: {
    color: 'black',
    marginLeft: 5,
  },
  closeText: {
    color: 'red',
    marginLeft: 5,
  },
  closeButton: {
    backgroundColor: 'white',
    padding: 10,
    paddingRight: 50,
    borderRadius: 5,
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,          // Added borderWidth
    borderColor: 'red',    // Set borderColor to black
  },
});

export default ProfileScreen;
  