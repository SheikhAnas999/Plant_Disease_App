import React, { useState, useRef, useEffect } from 'react';
import { Camera } from 'expo-camera/legacy';
import { Button, Modal, Image, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView, PinchGestureHandler, ScrollView } from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { my_auth, my_database } from '../config/Firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function TakeImageScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [zoom, setZoom] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef(null);
  const pinchRef = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [responseData, setResponseData] = useState(null);
  const [selectedOption, setSelectedOption] = useState('GPT');
  const [selectedModel, setSelectedModel] = useState('select');
  const [selectedLanguage, setSelectedLanguage] = useState('select');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (permission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#6B9D4A" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={() => requestPermission()} title="Grant Permission" />
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current && !isTakingPicture) {
      setIsTakingPicture(true);
      try {
        const photo = await cameraRef.current.takePictureAsync();
        setPhotoUri(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      } finally {
        setIsTakingPicture(false);
      }
    }
  }

  function discardPhoto() {
    setPhotoUri(null);
  }

  function closeCamera() {
    setShowCamera(false);
  }

  function openCamera() {
    setShowCamera(true);
  }

  function toggleCameraType() {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  }

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
    } else {
      Alert.alert("No image selected");
    }
  };

  const uploadImage = async () => {
    if (!photoUri) {
      setResponseData("No image selected. Please select or take a picture first.");
      setModalVisible(true);
      return;
    }

    setIsUploading(true);

    try {
      const blob = await getBlobFromUri(photoUri);
      const formData = new FormData();
      formData.append("file", {
        uri: photoUri,
        name: "image.jpg",
        type: "image/jpeg",
      });
      formData.append("model", selectedModel);
      formData.append("language", selectedLanguage);

      const serverResponse = await fetch(
        `http://192.168.82.171:8000/classify?model_name=${selectedModel}&language=${selectedLanguage}`,
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (serverResponse.ok) {
        const jsonResponse = await serverResponse.json();
        console.log("Response from server:", jsonResponse);
        setResponseData(JSON.stringify(jsonResponse));
        setModalVisible(true);

        const saveToDatabase = async () => {
          const user = my_auth.currentUser;
          const userEmail = user ? user.email : "anonymous";

          await addDoc(collection(my_database, "chats"), {
            email: userEmail,
            response: jsonResponse,
            model: selectedModel,
            language: selectedLanguage,
            timestamp: new Date(),
          });

          console.log("Data saved to database successfully!");
        };

        saveToDatabase();
      } else {
        console.error("Server error:", serverResponse.statusText, serverResponse.status);
        setResponseData("Failed to classify image. Please try again.");
        setModalVisible(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setResponseData("Could not connect to the server. Please try again later.");
      setModalVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  const getBlobFromUri = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return blob;
  };

  const renderResponseDetails = () => {
    try {
      const parsedData = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      
      if (!parsedData) return null;

      return Object.entries(parsedData).map(([key, value], index) => (
        <View key={index} style={styles.detailItem}>
          <Text style={styles.detailLabel}>{key}:</Text>
          <Text style={styles.detailValue}>{value}</Text>
        </View>
      ));
    } catch (error) {
      return (
        <View style={styles.detailItem}>
          <Text style={styles.detailValue}>{responseData}</Text>
        </View>
      );
    }
  };

  const onPinchGestureEvent = event => {
    setZoom(Math.max(0, Math.min(1, zoom + event.nativeEvent.scale - 1)));
  };

  return (
    <View style={styles.mainContainer}>
      {!showCamera && !photoUri && (
        <ScrollView 
          contentContainerStyle={styles.contentContainer}
          style={{ flex: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.gifWrapper}>
            <Image 
              source={require('../../assets/Focus.gif')} 
              style={styles.gifImage} 
              resizeMode="contain"
            />
          </View>

          <View style={styles.instructionsContainer}>
            <View style={styles.dropdownsRow}>
              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Model</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowModelDropdown(!showModelDropdown)}
                >
                  <Text style={styles.dropdownText}>{selectedModel}</Text>
                  <MaterialIcons 
                    name={showModelDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color="#4C6A4B" 
                  />
                </TouchableOpacity>
                {showModelDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedModel('gpt-3.5-turbo');
                        setShowModelDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>gpt-3.5-turbo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedModel('llama2');
                        setShowModelDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>llama2</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.dropdownContainer}>
                <Text style={styles.dropdownLabel}>Language</Text>
                <TouchableOpacity 
                  style={styles.dropdown}
                  onPress={() => setShowLanguageDropdown(!showLanguageDropdown)}
                >
                  <Text style={styles.dropdownText}>{selectedLanguage}</Text>
                  <MaterialIcons 
                    name={showLanguageDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={24} 
                    color="#4C6A4B" 
                  />
                </TouchableOpacity>
                {showLanguageDropdown && (
                  <View style={styles.dropdownList}>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedLanguage('english');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>english</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.dropdownItem}
                      onPress={() => {
                        setSelectedLanguage('Urdu');
                        setShowLanguageDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>Urdu</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images" size={20} color="white" style={styles.icon} />
              <Text style={styles.galleryButtonText}>Select from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accessCameraButton} onPress={openCamera}>
              <Ionicons name="camera" size={20} color="white" style={styles.icon} />
              <Text style={styles.accessCameraButtonText}>Access Camera</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {showCamera && !photoUri && (
        <GestureHandlerRootView style={styles.cameraContainer}>
          <PinchGestureHandler ref={pinchRef} onGestureEvent={onPinchGestureEvent}>
            <Camera
              style={styles.camera}
              ref={cameraRef}
              type={cameraType}
              autoFocus={Camera.Constants.AutoFocus.on}
              zoom={zoom}
            >
              <TouchableOpacity style={styles.closeButton} onPress={closeCamera}>
                <Ionicons name="close" size={30} color="white" />
              </TouchableOpacity>

              <View style={styles.iconContainer}>
                <TouchableOpacity 
                  style={styles.buttonContainer} 
                  onPress={takePicture} 
                  disabled={isTakingPicture}
                >
                  {isTakingPicture ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="camera" size={40} color="white" />
                      <Text style={styles.iconText}>Take Picture</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
                  <Ionicons name="camera-reverse" size={30} color="white" />
                  <Text style={styles.iconText}>Flip Camera</Text>
                </TouchableOpacity>
              </View>
            </Camera>
          </PinchGestureHandler>
        </GestureHandlerRootView>
      )}

      {photoUri && (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Preview</Text>
          <Image source={{ uri: photoUri }} style={styles.previewImage} />
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={discardPhoto}>
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={uploadImage}>
              <Text style={styles.actionText}>Upload</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.reportText}>Diagnosis Report</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {renderResponseDetails()}
            </ScrollView>

            
          </View>
        </View>
      </Modal>

      {isUploading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.uploadingText}>Uploading...</Text>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingBottom: 10
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 10,
  },
  gifWrapper: {
    height: '45%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  gifImage: {
    width: '100%',
    height: '110%',
  },
  instructionsContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 6,
  },
  dropdownsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dropdownContainer: {
    flex: 1,
    marginHorizontal: 10,
    position: 'relative',
    width: '100%',
    marginBottom: 30, 
  },
  dropdownLabel: {
    fontSize: 14,
    color: '#4C6A4B',
    marginBottom: 5,
    fontWeight: '600',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  dropdownText: {
    fontSize: 12,
    color: '#333',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
    width: '100%',
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#333',
  },
  buttonContainer: {
    gap: 10,
    alignItems: 'center',
    marginTop: 22
  },
  galleryButton: {
    flexDirection: 'row',
    backgroundColor: '#4C6A4B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  galleryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 5,
  },
  accessCameraButton: {
    flexDirection: 'row',
    backgroundColor: '#6B9D4A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  accessCameraButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  iconContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  iconText: {
    color: '#FFF',
    fontSize: 12,
  },
  flipButton: {
    alignItems: 'center',
    marginRight: 10,
  },
  previewContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  previewText: {
    fontSize: 18,
    color: '#6B9D4A',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previewImage: {
    width: 300,
    height: 300,
    marginBottom: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#6B9D4A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    padding: 25,
    borderRadius: 12,
    width: '95%', // Increased container width
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
    position: 'relative',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCloseButton: {
    padding: 5,
  },
  closeText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  reportText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
    paddingLeft:20
  },
  modalScrollView: {
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#555', // Muted grey text
    lineHeight: 22,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4C6A4B',
    marginBottom: 5,
    textAlign: 'center',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalDoneButton: {
    backgroundColor: '#4C6A4B',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalDoneButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  }
});