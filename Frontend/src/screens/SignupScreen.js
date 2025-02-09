import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import Toast from 'react-native-toast-message';
import { my_auth } from '../config/Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = () => {
    if (!email || !password || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'All fields are required.',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match.',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    createUserWithEmailAndPassword(my_auth, email, password)
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Signup Successful',
          text2: 'You can now log in.',
          position: 'top',
          visibilityTime: 2000,
          topOffset: 50,
        });
        setTimeout(() => {
          navigation.navigate('Login', { fromSignup: true });
        }, 2000); // Delay navigation to show the toast
      })
      .catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Signup Failed',
          text2: error.message,
          position: 'top',
          visibilityTime: 3000,
          topOffset: 50,
        });
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.title}>Signup</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#2D452F"
          value={email}
          onChangeText={setEmail}
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Password"
            placeholderTextColor="#2D452F"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.icon}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#6B9D4A"
            />
          </TouchableOpacity>
        </View>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Confirm Password"
            placeholderTextColor="#2D452F"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.icon}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#6B9D4A"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>Signup</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginPrompt}>
            Already have an account? <Text style={styles.loginLink}>Click here</Text>
          </Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#CFE2CE',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formBox: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    color: '#2D452F',
    marginBottom: 40,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#f0f0f0',
    borderColor: '#6B9D4A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#2D452F',
    marginBottom: 20,
  },
  passwordContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  inputWithIcon: {
    flex: 1,
    height: 50,
    backgroundColor: '#f0f0f0',
    borderColor: '#6B9D4A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 18,
    color: '#2D452F',
  },
  icon: {
    position: 'absolute',
    right: 15,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#4C6A4B',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    color: '#CFE2CE',
    fontWeight: 'bold',
  },
  loginPrompt: {
    marginTop: 20,
    fontSize: 16,
    color: '#2D452F',
  },
  loginLink: {
    color: '#6B9D4A',
    fontWeight: 'bold',
  },
});
