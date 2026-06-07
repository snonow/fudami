import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SignInWithOAuth } from '../components/auth/SignInWithOAuth';
import { LinearGradient } from 'expo-linear-gradient';

export default function LandingPage() {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: Platform.OS !== 'web' }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.navy, '#1A2A3A']}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.kanjiLogo}>ふだみ</Text>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>BETA</Text>
          </View>
        </View>
        
        <Text style={styles.title}>fudami</Text>
        <Text style={styles.subtitle}>Immersive Japanese Learning</Text>
        
        <View style={styles.actions}>
          <SignedIn>
            <Pressable 
              style={({ pressed }) => [styles.button, styles.primaryButton, pressed && styles.buttonPressed]} 
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.buttonText}>Enter Dashboard</Text>
            </Pressable>
          </SignedIn>

          <SignedOut>
            <SignInWithOAuth />
          </SignedOut>
        </View>
      </Animated.View>

      <Text style={styles.strokeBg}>学習</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: -10,
  },
  kanjiLogo: {
    fontSize: 90,
    color: Colors.white,
    fontFamily: 'NotoSansJP_400Regular',
  },
  logoBadge: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 20,
    marginLeft: 4,
  },
  logoBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    color: Colors.skyBlue,
    fontFamily: 'NotoSansJP_300Light',
    letterSpacing: 12,
    textTransform: 'lowercase',
    marginBottom: 12,
    marginLeft: 12, // Offset for letter spacing centering
  },
  subtitle: {
    fontSize: 16,
    color: Colors.teal,
    fontFamily: 'NotoSansJP_700Bold',
    letterSpacing: 1.5,
    marginBottom: 80,
    textAlign: 'center',
  },
  actions: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 35,
    minWidth: 260,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButton: {
    backgroundColor: Colors.teal,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  strokeBg: {
    position: 'absolute',
    bottom: -60,
    right: -30,
    fontSize: 350,
    fontFamily: 'KanjiStroke', 
    color: 'rgba(200, 217, 230, 0.04)',
    zIndex: 0,
  },
});
