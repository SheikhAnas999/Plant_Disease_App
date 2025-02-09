import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity } from 'react-native';
import { LongPressGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons'; // Importing Expo Vector Icons

const HomeScreen = () => {
  const [displayedText, setDisplayedText] = useState('');
  const [tipIndex, setTipIndex] = useState(0); // State for managing the current tip index
  const subtitle = 'Identify pests and get treatment suggestions ';
  const textIndex = useRef(0);
  const colorAnim = useRef(new Animated.Value(0)).current;

  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  const scaleAnim3 = useRef(new Animated.Value(1)).current;
  const scaleAnim4 = useRef(new Animated.Value(1)).current;
  const scaleAnim5 = useRef(new Animated.Value(1)).current;

  const tips = [ // Array of 10 general plant tips
    "Ensure regular monitoring to detect pests early.",
    "Water plants in the early morning or late evening.",
    "Fertilize plants appropriately based on their needs.",
    "Avoid overwatering, as it can lead to root rot.",
    "Prune plants regularly to maintain healthy growth.",
    "Use natural enemies to combat pests.",
    "Keep the garden clean and remove weeds.",
    "Check plants for disease signs frequently.",
    "Use organic pesticides if chemical options are not ideal.",
    "Provide proper spacing for plants to avoid overcrowding."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (textIndex.current < subtitle.length) {
        setDisplayedText((prev) => prev + subtitle[textIndex.current]);
        textIndex.current += 1;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const colorLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(colorAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
        Animated.timing(colorAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ])
    );
    colorLoop.start();
    return () => colorLoop.stop();
  }, []);

  const animatedTextColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['grey', 'green'],
  });

  const handleLongPress = (scaleAnim) => ({ nativeEvent }) => {
    if (nativeEvent.state === State.ACTIVE) {
      Animated.spring(scaleAnim, { toValue: 1.2, useNativeDriver: true }).start();
    } else {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  };

  // Function to handle the "Next" button click
  const handleNextTip = () => {
    setTipIndex((prevIndex) => (prevIndex + 1) % tips.length); // Loop back to the first tip when reaching the end
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.squareFind} />
        <Text style={styles.title}>Find Your Pest</Text>
        <Animated.Text style={[styles.subtitle, { color: animatedTextColor }]}>
          {displayedText}
        </Animated.Text>
      </View>

      <View style={styles.howItWorks}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.cardsContainer}>
          <LongPressGestureHandler
            onHandlerStateChange={handleLongPress(scaleAnim1)}
            minDurationMs={800}
          >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim1 }] }]}>
              <Ionicons name="scan" size={40} color="#6B9D4A" />
              <Text style={styles.cardText}>Step One: Scan your plant</Text>
            </Animated.View>
          </LongPressGestureHandler>

          <LongPressGestureHandler
            onHandlerStateChange={handleLongPress(scaleAnim2)}
            minDurationMs={800}
          >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim2 }] }]}>
              <Ionicons name="cloud-upload-outline" size={40} color="#6B9D4A" />
              <Text style={styles.cardText}>Step Two: Upload a picture</Text>
            </Animated.View>
          </LongPressGestureHandler>

          <LongPressGestureHandler
            onHandlerStateChange={handleLongPress(scaleAnim3)}
            minDurationMs={800}
          >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim3 }] }]}>
              <Ionicons name="analytics-outline" size={40} color="#6B9D4A" />
              <Text style={styles.cardText}>Step Three: Get Diagnosis</Text>
            </Animated.View>
          </LongPressGestureHandler>

          <LongPressGestureHandler
            onHandlerStateChange={handleLongPress(scaleAnim4)}
            minDurationMs={800}
          >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim4 }] }]}>
              <Ionicons name="leaf-outline" size={40} color="#6B9D4A" />
              <Text style={styles.cardText}>Step Four: Pesticide Advice</Text>
            </Animated.View>
          </LongPressGestureHandler>

          <LongPressGestureHandler
            onHandlerStateChange={handleLongPress(scaleAnim5)}
            minDurationMs={400}
          >
            <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim5 }] }]}>
              <Ionicons name="shield-checkmark-outline" size={40} color="#6B9D4A" />
              <Text style={styles.cardText}>Step Five: Prevent Infestations</Text>
            </Animated.View>
          </LongPressGestureHandler>
        </View>
      </View>

      <View style={styles.tipSection}>
        <Text style={styles.sectionTitle}>Tips and Tricks</Text>
        <View style={styles.tipCard}>
          <Ionicons name="bulb-outline" size={30} color="yellow" style={styles.tipIcon} />
          <Text style={styles.tipText}>{tips[tipIndex]}</Text>
          <TouchableOpacity onPress={handleNextTip} style={styles.nextButton}>
            <Ionicons name="arrow-forward-circle-outline" size={25} color="#6B9D4A" />
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4', padding: 5 },
  header: { padding: 20, backgroundColor: '#CFE2CE', alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, elevation: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D452F' },
  squareFind: { position: 'absolute', width: 15, height: 15, backgroundColor: '#6B9D4A', top: 25, left: 70 },
  subtitle: { fontSize: 16, marginTop: 5 },
  howItWorks: { paddingHorizontal: 20, marginVertical: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2D452F', marginBottom: 10 },
  cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, alignItems: 'center', width: '48%', marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  cardText: { marginTop: 5, fontSize: 14, color: '#2D452F', textAlign: 'center' },
  tipSection: { paddingHorizontal: 20, marginBottom: 50 },
  tipCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  tipIcon: { marginRight: 10 },
  tipText: { fontSize: 16, color: 'gray', flex: 1 },
  nextButton: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  nextButtonText: { marginLeft: 5, color: '#6B9D4A', fontSize: 16 }
});

export default HomeScreen;
