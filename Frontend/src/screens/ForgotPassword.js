import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { my_auth } from '../config/Firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Toast from 'react-native-toast-message';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');

  const handlePasswordReset = () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter your email address.',
        position: 'top',
        visibilityTime: 3000,
        style: {
          width: '90%',
          padding: 10,
        },
        textStyle: {
          fontSize: 16,
          textAlign: 'center',
        },
      });
      return;
    }

    sendPasswordResetEmail(my_auth, email)
      .then(() => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Password reset email sent! Check your inbox for instructions.',
          position: 'top',
          visibilityTime: 3000,
          style: {
            width: '90%',
            padding: 10,
          },
          textStyle: {
            fontSize: 16,
            textAlign: 'center',
          },
        });
      })
      .catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.message,
          position: 'top',
          visibilityTime: 4000,
          style: {
            width: '90%',
            padding: 10,
          },
          textStyle: {
            fontSize: 16,
            textAlign: 'center',
          },
        });
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.formBox}>
        <Text style={styles.title}>Reset Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handlePasswordReset}>
          <Text style={styles.buttonText}>Send Reset Email</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.forgotPasswordPrompt}>
            Wanna go back to Login page?
            <Text style={styles.forgotPasswordLink}> Click here</Text>
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
    fontSize: 28,
    color: '#2D452F',
    fontWeight: 'bold',
    marginBottom: 20,
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
  forgotPasswordPrompt: {
    marginTop: 20,
    fontSize: 16,
    color: '#2D452F',
  },
  forgotPasswordLink: {
    color: '#6B9D4A',
    fontWeight: 'bold',
  },
});
