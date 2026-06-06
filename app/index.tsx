import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { 
  useFonts, 
  NotoSansJP_400Regular, 
  NotoSansJP_700Bold, 
  NotoSansJP_300Light 
} from '@expo-google-fonts/noto-sans-jp';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function LandingPage() {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.kanjiLogo}>ふだみ</Text>
        <Text style={styles.title}>fudami</Text>
        <Text style={styles.subtitle}>Immersive Japanese Learning</Text>
        
        <Pressable 
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Enter</Text>
        </Pressable>
      </Animated.View>

      <Text style={styles.strokeBg}>学習</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  kanjiLogo: {
    fontSize: 80,
    color: Colors.white,
    fontFamily: 'NotoSansJP_400Regular',
    marginBottom: -10,
  },
  title: {
    fontSize: 24,
    color: Colors.skyBlue,
    fontFamily: 'NotoSansJP_300Light',
    letterSpacing: 8,
    textTransform: 'lowercase',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.teal,
    fontFamily: 'NotoSansJP_700Bold',
    letterSpacing: 1,
    marginBottom: 60,
  },
  button: {
    backgroundColor: Colors.teal,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.3)',
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  strokeBg: {
    position: 'absolute',
    bottom: -50,
    right: -20,
    fontSize: 300,
    fontFamily: 'KanjiStroke',
    color: 'rgba(200, 217, 230, 0.05)',
    zIndex: 0,
  },
});
