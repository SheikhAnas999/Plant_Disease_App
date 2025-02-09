
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Modal, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { my_auth, my_database } from '../config/Firebase'; // Ensure this is correct

export default function ChatScreen() {
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State for loading status
  const [modalVisible, setModalVisible] = useState(false); // State for controlling modal visibility
  const [selectedChat, setSelectedChat] = useState(null); // State for the selected chat

  // Fetch data on component mount
  useEffect(() => {
    const unsubscribe = fetchChats();

    // Cleanup function when the component is unmounted
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Function to fetch chats from Firestore based on the current user's email
  const fetchChats = () => {
    const user = my_auth.currentUser;
    if (!user) {
      Alert.alert("No user found", "Please login to view your chats.");
      return;
    }

    const userEmail = user.email;
    console.log("Fetching chats for:", userEmail); // Debugging: log the user email

    const chatsRef = collection(my_database, "chats");
    const q = query(chatsRef, where("email", "==", userEmail));

    // Real-time listener for Firestore collection
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      if (querySnapshot.empty) {
        console.log("No chats found for this user.");
        setChats([]); // Set empty array if no data found
        return;
      }

      // Extract data from Firestore response
      const chatList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched Chats:", chatList); // Debugging: log the fetched chats
      setChats(chatList); // Update state with the fetched data
      setIsLoading(false); // Stop the loading spinner
    });

    // Return the unsubscribe function to clean up when the component is unmounted
    return unsubscribe;
  };

  // Handle click on a chat to show detailed information
  const handleChatPress = (item) => {
    setSelectedChat(item);
    setModalVisible(true); // Open the modal
  };

  // Render a single item in the chat list with numbering
  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => handleChatPress(item)} // Display full chat details when clicked
    >
      <View style={styles.reportContainer}>
        <Text style={styles.reportText}>{`Report ${index + 1}:`}</Text>
        <Text style={styles.diseaseName}>{item.response.disease_name}</Text>
      </View>
    </TouchableOpacity>
  );

  // Function to render content inside the modal
  const renderModalContent = (selectedChat) => {
    const details = [
      { title: 'Disease Name', value: selectedChat.response.disease_name },
      { title: 'Causes', value: selectedChat.response.causes },
      { title: 'Pesticide Recommendations', value: selectedChat.response.pesticide_recommendations },
      { title: 'Recommended Solutions', value: selectedChat.response.recommended_solutions },
      { title: 'Symptoms', value: selectedChat.response.symptoms },
    ];

    return (
      <FlatList
        data={details}
        renderItem={({ item }) => (
          <View style={styles.detailItem}>
            <Text style={styles.subHeading}>{item.title}</Text>
            <Text style={styles.modalText}>{item.value}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    );
  };

  // Return the loading spinner or the list of chats
  return (
    <View style={styles.container}>
      {/* Container for main heading and subheading */}
      <View style={styles.headingContainer}>
        <Text style={styles.mainHeading}>Report History</Text>
       
      </View>

      {/* ScrollView wrapping FlatList */}
      <ScrollView contentContainerStyle={styles.chatContainer}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#CFE2CE" /> // Show loading spinner while fetching
        ) : (
          <FlatList
            data={chats}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // Disable internal scroll for FlatList, controlled by the outer ScrollView
          />
        )}
      </ScrollView>

      {/* Modal for displaying chat details */}
      {selectedChat && (
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Close Button */}
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)} // Close modal on button click
              >
                <Text style={styles.closeText}>X</Text>
              </Pressable>

              {/* Report Heading centered */}
              <Text style={styles.reportText}>Report</Text>

              {/* Modal Content - Disease Details */}
              {renderModalContent(selectedChat)}

            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    padding: 5,
  },
  headingContainer: {
    backgroundColor: '#CFE2CE',
    borderBottomEndRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  mainHeading: {
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2D452F',
  },
  subHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50', // Updated to match subheading theme
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  chatContainer: {
    paddingHorizontal: 10,
  },
  chatItem: {
    backgroundColor: '#CFE2CE',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
  },
  reportContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 5,
  },
  diseaseName: {
    fontSize: 16,
    color: '#2D452F',
  },
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
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
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
});
