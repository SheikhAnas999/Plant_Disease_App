import React, { useState } from 'react'; 
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native'; 
import { my_database } from '../config/Firebase'; // Import my_database
import { getAuth } from 'firebase/auth'; // Import getAuth to access the current user
import { collection, addDoc } from 'firebase/firestore'; // Import necessary Firestore functions
import Toast from 'react-native-toast-message'; // Import Toast

const FeedbackScreen = () => {
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false); // State for loader
  const navigation = useNavigation(); 

  const handleRating = (star) => {
    setRating(star);
  };

  const handleSubmitFeedback = async () => {
    if (!comment || rating === 0) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please provide a comment and a rating.',
      });
      return;
    }

    const user = getAuth().currentUser; // Get the current user
    const email = user ? user.email : null; // Get the email of the logged-in user

    setLoading(true); // Start loading

    try {
      await addDoc(collection(my_database, 'feedback'), { // Use addDoc with collection
        comment: comment,
        rating: rating,
        email: email, // Add email to the feedback data
        createdAt: new Date(),
      });
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Success',
        text2: 'Thank you for your feedback!',
      });
      setComment('');
      setRating(0);
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Failed to submit feedback. Please try again later.',
      });
      console.log(error);
    } finally {
      setLoading(false); // Stop loading
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#2D452F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Settings</Text>
      </View>
  
      <View style={styles.line} />
  
      {/* Box model */}
      <View style={styles.box}>
        <View style={styles.feedbackContainer}>
          <Text style={styles.title}>Feedback</Text>
        </View>
  
        <Text style={styles.subtitle}>Help us improve</Text>
  
        <TextInput
          style={styles.commentBox}
          placeholder="Share your thoughts..."
          placeholderTextColor="grey"
          value={comment}
          onChangeText={setComment}
          multiline={true}
        />
        <Text style={styles.rateText}>Rate us</Text>
        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => handleRating(star)}>
              <Ionicons
                name={rating >= star ? 'star' : 'star-outline'}
                size={40}
                color={rating >= star ? '#FFD700' : '#FFD700'}
                style={styles.starIcon}
              />
            </TouchableOpacity>
          ))}
        </View>
  
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitFeedback} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
  
      {/* Toast component */}
      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#CFE2CE',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: 40,
    left: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D452F',
    marginLeft: 20,
  },
  line: {
    borderBottomWidth: 3,
    borderBottomColor: '#2D452F',
    marginTop: 54, // Adjust margin to make sure it's right below the header
  },
  feedbackContainer: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2D452F',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#2D452F',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'left',
    fontWeight: '500',
  },
  commentBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6B9D4A',
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
    fontSize: 16,
    color: '#2D452F',
  },
  rateText: {
    fontSize: 16,
    color: '#2D452F',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  starIcon: {
    marginHorizontal: 5,
  },
  submitButton: {
    backgroundColor: '#4C6A4B',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center', // Centers the content (text and loader)
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#CFE2CE',
    fontSize: 16,
    fontWeight: 'bold',
  },
  box: {
    backgroundColor: '#FFFFFF', // White background for the box
    borderRadius: 15, // Rounded corners
    padding: 20, // Padding inside the box
    shadowColor: '#000', // Shadow color
    shadowOffset: { width: 0, height: 2 }, // Shadow offset
    shadowOpacity: 0.1, // Shadow opacity
    shadowRadius: 5, // Shadow blur radius
    elevation: 5, // Shadow for Android
    marginTop: 80, // Space between the header and the box
    marginBottom: 20, // Space at the bottom
  },
});

export default FeedbackScreen;
