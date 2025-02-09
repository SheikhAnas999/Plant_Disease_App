import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { my_auth } from '../config/Firebase'; // Import Firebase auth configuration
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import Toast from 'react-native-toast-message'; // Import Toast

const ChangePasswordScreen = () => {
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false); // State to manage the loader visibility
  const [secureTextCurrent, setSecureTextCurrent] = useState(true); // State to toggle current password visibility
  const [secureTextNew, setSecureTextNew] = useState(true); // State to toggle new password visibility

  // Function to handle password change
  const handleChangePassword = async () => {
    const user = my_auth.currentUser;

    if (!user || !currentPassword || !newPassword) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Error',
        text2: 'Please enter both the current and new passwords.',
      });
      return;
    }

    setLoading(true); // Show loader when password change is in progress

    try {
      // Reauthenticate user with the current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
      Toast.show({
        type: 'success',
        position: 'top',
        text1: 'Success',
        text2: 'Password updated successfully!',
      });
     
    } catch (error) {
      Toast.show({
        type: 'error',
        position: 'top',
        text1: 'Password Update Failed',
        text2: error.message,
      });
    } finally {
      setLoading(false); // Hide loader when operation is complete
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#2D452F" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Profile Settings</Text>
      </View>
      <View style={styles.line} />

      {/* Form */}
      <View style={styles.formBox}>
        <Text style={styles.title}>Change Password</Text>

        {/* Current Password */}
        <View style={styles.eyeIconContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Current Password"
            placeholderTextColor="#2D452F"
            secureTextEntry={secureTextCurrent}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
          <TouchableOpacity onPress={() => setSecureTextCurrent(!secureTextCurrent)} style={styles.eyeIcon}>
            <Ionicons
              name={secureTextCurrent ? "eye-off" : "eye"}
              size={24}
              color="#6B9D4A"
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <View style={styles.eyeIconContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter New Password"
            placeholderTextColor="#2D452F"
            secureTextEntry={secureTextNew}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setSecureTextNew(!secureTextNew)} style={styles.eyeIcon}>
            <Ionicons
              name={secureTextNew ? "eye-off" : "eye"}
              size={24}
              color="#6B9D4A"
            />
          </TouchableOpacity>
        </View>

        {/* Save Password Button */}
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Password</Text>
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
    backgroundColor: '#CFE2CE',
    justifyContent: 'flex-start',
    padding: 20,
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
    marginTop: 54, // Adjusted for positioning below header
  },
  formBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginTop: 120, // Space between the header and the form box
  },
  title: {
    fontSize: 22,
    color: '#2D452F',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderColor: '#6B9D4A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#2D452F',
    marginBottom: 10,
    textAlignVertical: 'center',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4C6A4B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#CFE2CE',
    fontWeight: 'bold',
  },
  eyeIconContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
  },
});

export default ChangePasswordScreen;
