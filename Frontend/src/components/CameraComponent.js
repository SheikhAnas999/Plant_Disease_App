import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'expo-camera'; // Correctly import Camera from expo-camera
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function CameraComponent() {
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setHasCameraPermission(status === 'granted');
    })();
  }, []);

  if (hasCameraPermission === null) {
    return <View />;
  }
  if (hasCameraPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera
        style={{ flex: 1, justifyContent: 'space-between' }}
        type={cameraType}
      >
        <View style={styles.topBar}>
          <Ionicons name="md-camera" size={24} color="white" />
          <TouchableOpacity
            onPress={() => {
              setCameraType(
                cameraType === Camera.Constants.Type.back
                  ? Camera.Constants.Type.front
                  : Camera.Constants.Type.back
              );
            }}
          >
            <Ionicons name="ios-reverse-camera" size={30} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          <Ionicons name="ios-map" size={36} color="white" />
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="circle-outline" // This icon will be used to take a picture
              size={100}
              color="white"
            />
          </TouchableOpacity>
          <Ionicons name="ios-images" size={36} color="white" />
        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    marginBottom: 15,
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
});
