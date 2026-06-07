import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SignInWithOAuth } from '../components/auth/SignInWithOAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { DarumaMascot } from '../components/ui/DarumaMascot';
import * as Localization from 'expo-localization';
import { Ionicons } from '@expo/vector-icons';

type Language = 'en' | 'fr' | 'jp';

const STRINGS: Record<Language, any> = {
  en: {
    welcome: 'Welcome to',
    tagline: 'Immersive Japanese Learning',
    principle_title: 'The Fudami Way',
    principle_desc: 'No card debt. No stress. Spaced repetition with a game-like heart.',
    cta_start: 'Get Started',
    cta_enter: 'Enter Dashboard',
  },
  fr: {
    welcome: 'Bienvenue sur',
    tagline: 'Apprentissage Immersif du Japonais',
    principle_title: 'La Méthode Fudami',
    principle_desc: 'Pas de dette de cartes. Pas de stress. De la répétition espacée avec un cœur de jeu.',
    cta_start: 'Commencer',
    cta_enter: 'Accéder au Tableau de Bord',
  },
  jp: {
    welcome: 'へようこそ',
    tagline: '没入型日本語学習',
    principle_title: 'ふだみの仕組み',
    principle_desc: 'カードの借金なし。ストレスなし。ゲームのような感覚で記憶。',
    cta_start: 'はじめる',
    cta_enter: 'ダッシュボードへ',
  }
};

export default function LandingPage() {
  const router = useRouter();
  const dimensions = useWindowDimensions();
  const height = dimensions.height || 800;
  const width = dimensions.width || 400;

  const [step, setStep] = useState<'welcome' | 'intro' | 'auth'>('welcome');
  const [lang, setLang] = useState<Language>('en');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  // Very small mascot size to guarantee everything fits vertically
  const isDesktop = width > 768;
  const mascotSize = isDesktop ? 220 : 140;

  useEffect(() => {
    // Detect language
    const locale = Localization.getLocales()[0]?.languageCode || 'en';
    if (locale.startsWith('fr')) setLang('fr');
    else if (locale.startsWith('ja')) setLang('jp');
    else setLang('en');

    triggerAnim();
  }, []);

  const triggerAnim = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  };

  const nextStep = () => {
    if (step === 'welcome') setStep('intro');
    else if (step === 'intro') setStep('auth');
    triggerAnim();
  };

  const t = STRINGS[lang];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.topBar}>
        <Pressable style={styles.langToggle} onPress={() => setLang(l => l === 'en' ? 'fr' : l === 'fr' ? 'jp' : 'en')}>
          <Ionicons name="language" size={16} color={Colors.textMuted} />
          <Text style={styles.langText}>{lang.toUpperCase()}</Text>
        </Pressable>
      </View>

      <Animated.View style={[
        styles.content, 
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }], 
          paddingTop: height * 0.05 
        }
      ]}>
        
        <View style={styles.mascotPodium}>
          <DarumaMascot 
            mood="happy"
            size={mascotSize}
          />
        </View>

        {step === 'welcome' && (
          <View style={styles.uiStack}>
            <Text style={styles.welcomeText}>{t.welcome}</Text>
            <View style={styles.logoRow}>
              <Text style={styles.kanjiLogo}>ふだみ</Text>
              <Text style={styles.title}>fudami</Text>
            </View>
            <Text style={styles.subtitle}>{t.tagline}</Text>
            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>{t.cta_start}</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </Pressable>
          </View>
        )}

        {step === 'intro' && (
          <View style={styles.uiStack}>
            <Text style={styles.principleTitle}>{t.principle_title}</Text>
            <Text style={styles.principleDesc}>{t.principle_desc}</Text>
            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>{t.cta_start}</Text>
              <Ionicons name="arrow-forward" size={18} color={Colors.white} />
            </Pressable>
          </View>
        )}

        {step === 'auth' && (
          <View style={styles.uiStack}>
            <SignedIn>
              <Text style={styles.principleTitle}>Ready to continue?</Text>
              <Pressable 
                style={styles.primaryBtn} 
                onPress={() => router.replace('/(tabs)')}
              >
                <Text style={styles.primaryBtnText}>{t.cta_enter}</Text>
              </Pressable>
            </SignedIn>

            <SignedOut>
              <Text style={styles.principleTitle}>Join the journey</Text>
              <View style={{ marginTop: 10 }}>
                <SignInWithOAuth />
              </View>
            </SignedOut>
          </View>
        )}

      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  topBar: { position: 'absolute', top: 40, right: 20, zIndex: 10 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  langText: { color: Colors.textMuted, fontSize: 11, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 40 },
  mascotPodium: { marginBottom: 10 },
  uiStack: { alignItems: 'center', width: '100%', gap: 6 },
  welcomeText: { color: Colors.textMuted, fontSize: 14, fontFamily: 'NotoSansJP_500Medium' },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4 },
  kanjiLogo: { fontSize: 60, color: Colors.text, fontFamily: 'NotoSansJP_400Regular' },
  title: { fontSize: 20, color: Colors.secondary, fontFamily: 'NotoSansJP_300Light', letterSpacing: 6, textTransform: 'lowercase' },
  subtitle: { fontSize: 14, color: Colors.primary, fontFamily: 'NotoSansJP_700Bold', letterSpacing: 1, marginBottom: 15, textAlign: 'center' },
  principleTitle: { fontSize: 22, color: Colors.text, fontFamily: 'NotoSansJP_700Bold', marginBottom: 4, textAlign: 'center' },
  principleDesc: { fontSize: 13, color: Colors.textMuted, fontFamily: 'NotoSansJP_400Regular', textAlign: 'center', lineHeight: 18, marginBottom: 15, maxWidth: 280 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 30, gap: 10, minWidth: 180, elevation: 8, boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)' },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
