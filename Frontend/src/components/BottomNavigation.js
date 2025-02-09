// BottomNavigation.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import HomeScreen from '../screens/HomeScreen';
import TakeImageScreen from '../screens/TakeImageScreen'; // Ensure this is the correct import for your Take Image screen
import ChatsScreen from '../screens/ChatsScreen'; // Import your Chats screen
import ProfileScreen from '../screens/ProfileScreen';
import { LinearGradient } from 'expo-linear-gradient';

const Tab = createBottomTabNavigator();

const BottomNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          // Determine the icon name based on the route
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Take Image') {
            iconName = focused ? 'camera' : 'camera-outline'; // Camera icon for Take Image
          } else if (route.name === 'Reports') {
            iconName = focused ? 'document-text' : 'document-text-outline'; 
          }
            else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4C6A4B',
        tabBarInactiveTintColor: 'gray',
         headerStyle: {
          backgroundColor: 'transparent',
          elevation: 0,  // Remove shadow if needed
          shadowOpacity: 0,
          borderBottomWidth: 0,
          height: 100,  // Set a fixed height if needed
          
        },
        headerBackground: () => (
          <LinearGradient
            colors={['white', '#CFE2CE']}
            style={{ flex: 1, height: '100%' }}
          />
        ),
        headerTitleStyle: { color: '#2D452F' },  // Change text color to black
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Take Image" component={TakeImageScreen} /> 
      <Tab.Screen name="Reports" component={ChatsScreen} /> 
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default BottomNavigation;
