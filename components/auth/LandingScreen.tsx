import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SignInWithOAuth } from './SignInWithOAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { DarumaMascot } from '../ui/DarumaMascot';
import { Ionicons } from '@expo/vector-icons';

export const LandingScreen = () => {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const [step, setStep] = React.useState<'welcome' | 'auth'>('welcome');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const mascotAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(mascotAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, [step]);

  const mascotScale = mascotAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0B1E', '#000000']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Animated.View style={{ transform: [{ scale: mascotScale }] }}>
          <DarumaMascot mood="happy" size={width > 768 ? 240 : 180} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={styles.kanjiLogo}>ふだみ</Text>
          <Text style={styles.title}>FUDAMI</Text>
          <Text style={styles.subtitle}>Immersive Japanese Mastery</Text>
        </View>

        <View style={styles.actionContainer}>
          {step === 'welcome' ? (
            <Pressable 
              style={styles.primaryBtn} 
              onPress={() => setStep('auth')}
            >
              <Text style={styles.primaryBtnText}>BEGIN JOURNEY</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </Pressable>
          ) : (
            <View style={styles.authWrapper}>
              <SignedOut>
                <Text style={styles.authTitle}>Sign in to continue</Text>
                <SignInWithOAuth />
              </SignedOut>
              <SignedIn>
                <Pressable 
                  style={styles.primaryBtn} 
                  onPress={() => router.replace('/(tabs)')}
                >
                  <Text style={styles.primaryBtnText}>ENTER DASHBOARD</Text>
                </Pressable>
              </SignedIn>
            </View>
          )}
        </View>

        <Text style={styles.footerText}>
          Spaced Repetition · Graph Learning · Immersive Core
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  kanjiLogo: {
    fontSize: 72,
    color: Colors.white,
    fontFamily: 'NotoSansJP_400Regular',
    lineHeight: 80,
  },
  title: {
    fontSize: 24,
    color: Colors.primary,
    fontFamily: 'NotoSansJP_300Light',
    letterSpacing: 8,
    marginTop: -10,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 10,
    letterSpacing: 1,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    minHeight: 180,
  },
  authWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  authTitle: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'NotoSansJP_700Bold',
    marginBottom: 20,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 40,
    gap: 12,
    boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
    elevation: 8,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footerText: {
    position: 'absolute',
    bottom: 40,
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  }
});
