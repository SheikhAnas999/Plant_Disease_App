import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';

export default function FirstScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container1}>
        {/* Find Your Pest section */}
        <View style={styles.textContainer}>
          {/* The light green square behind the "F" */}
          <View style={styles.squareFind} />
          <Text style={styles.text}>
            <Text style={styles.highlightLetter}>F</Text>ind Your 
            <Text style={styles.highlightLetter}> P</Text>est
          </Text>
        </View>
        <Text style={styles.subtitle}> Pesticide Detection AI</Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signupButton}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupButtonText}>Signup</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container2}></View>

      {/* Adding the animation */}
      <LottieView
        source={require('../../assets/newREADY.json')} // Replace with your animation JSON path
        autoPlay
        loop
        style={styles.animation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#2D452F',
    
  },
  container1: {
    flex: 2,
    backgroundColor: '#4C6A4B',
    borderTopLeftRadius: 30,
    marginTop: 320,
    marginLeft: 50,
    padding: 20,
    alignItems: 'center',
  },
  container2: {
    flex: 0,
    backgroundColor: '#CFE2CE',
  },
  textContainer: {
    position: 'relative',
    marginBottom: 10,
    marginTop: 0,
  },
  text: {
    color: '#fff',
    fontSize: 25,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'relative',
  },
  subtitle: {
    color: '#CFE2CE',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    
  },
  squareFind: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: '#6B9D4A',
    top: 5,
    left: -10,
    zIndex: -1,
  },
  loginButton: {
    backgroundColor: '#6B9D4A',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    width: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop:50
  },
  loginButtonText: {
    color: '#CFE2CE',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  signupButton: {
    backgroundColor: '#CFE2CE',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 30,
    width: 150,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  signupButtonText: {
    color: '#2D452F',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  animation: {
    position: 'absolute',
    top: '6.8%',
    left: '11%',
    width: '100%',
    height: '50%',
  },
});
