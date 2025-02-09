import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Toast from 'react-native-toast-message';
import { my_auth } from '../config/Firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(my_auth, (user) => {
      if (user) {
        // Navigate to Home screen if user is authenticated
        navigation.replace('MainTabs');
      }
    });

    // Clean up the listener on unmount
    return () => unsubscribe();
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter both email and password',
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(my_auth, email, password);

      if (userCredential.user) {
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
          position: 'top',
          visibilityTime: 1500,
          topOffset: 50,
        });
        // Navigation handled by onAuthStateChanged
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message,
        position: 'top',
        visibilityTime: 3000,
        topOffset: 50,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Please enter your email address first.');
      return;
    }

    sendPasswordResetEmail(my_auth, email)
      .then(() => {
        Alert.alert('Password reset email sent!', 'Check your inbox to reset your password.');
      })
      .catch((error) => {
        alert(error.message);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#2D452F"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.inputWithIcon}
            placeholder="Password"
            placeholderTextColor="#2D452F"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.icon}>
            <Ionicons
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color="#6B9D4A"
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#CFE2CE" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupPrompt}>
            Don't have an account? <Text style={styles.signupLink}>Click here</Text>
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
  buttonDisabled: {
    backgroundColor: '#8BA18A',
  },
  buttonText: {
    fontSize: 18,
    color: '#CFE2CE',
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    fontSize: 16,
    color: 'red',
    marginTop: 15,
    textDecorationLine: 'underline',
  },
  signupPrompt: {
    marginTop: 20,
    fontSize: 16,
    color: '#2D452F',
  },
  signupLink: {
    color: '#6B9D4A',
    fontWeight: 'bold',
  },
});
