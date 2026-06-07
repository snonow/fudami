import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, useWindowDimensions } from 'react-native';
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
    principle_desc: 'No card debt. No stress. Just pure spaced repetition with a game-like heart.',
    cta_start: 'Get Started',
    cta_enter: 'Enter Dashboard',
    lang_label: 'Language',
  },
  fr: {
    welcome: 'Bienvenue sur',
    tagline: 'Apprentissage Immersif du Japonais',
    principle_title: 'La Méthode Fudami',
    principle_desc: 'Pas de dette de cartes. Pas de stress. Juste de la répétition espacée avec un cœur de jeu.',
    cta_start: 'Commencer',
    cta_enter: 'Accéder au Tableau de Bord',
    lang_label: 'Langue',
  },
  jp: {
    welcome: 'へようこそ',
    tagline: '没入型日本語学習',
    principle_title: 'ふだみの仕組み',
    principle_desc: 'カードの借金なし。ストレスなし。ゲームのような感覚で、効率的に記憶。',
    cta_start: 'はじめる',
    cta_enter: 'ダッシュボードへ',
    lang_label: '言語',
  }
};

export default function LandingPage() {
  const router = useRouter();
  const { height, width } = useWindowDimensions();
  const [step, setStep] = useState<'welcome' | 'intro' | 'auth'>('welcome');
  const [lang, setLang] = useState<Language>('en');

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;

  // Responsive mascot size - BIG on desktop, SMALLER on mobile
  const isDesktop = width > 768;
  const mascotSize = isDesktop ? Math.min(height * 0.55, 600) : Math.min(height * 0.4, width * 0.85);

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

      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        
        {/* Mascot takes center stage - Larger and Responsive */}
        <View style={styles.mascotPodium}>
          <DarumaMascot 
            mood={step === 'welcome' ? 'bored' : step === 'intro' ? 'happy' : 'bored'} 
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
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
            </Pressable>
          </View>
        )}

        {step === 'intro' && (
          <View style={styles.uiStack}>
            <Text style={styles.principleTitle}>{t.principle_title}</Text>
            <Text style={styles.principleDesc}>{t.principle_desc}</Text>
            <Pressable style={styles.primaryBtn} onPress={nextStep}>
              <Text style={styles.primaryBtnText}>{t.cta_start}</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.white} />
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
              <View style={{ marginTop: 20 }}>
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
  topBar: { position: 'absolute', top: 60, right: 30, zIndex: 10 },
  langToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  langText: { color: Colors.textMuted, fontSize: 12, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 40, paddingTop: height * 0.05 },
  mascotPodium: { marginBottom: -10 },
  uiStack: { alignItems: 'center', width: '100%', gap: 10 },
  welcomeText: { color: Colors.textMuted, fontSize: 16, fontFamily: 'NotoSansJP_500Medium', marginBottom: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 8 },
  kanjiLogo: { fontSize: 72, color: Colors.text, fontFamily: 'NotoSansJP_400Regular' },
  title: { fontSize: 24, color: Colors.secondary, fontFamily: 'NotoSansJP_300Light', letterSpacing: 8, textTransform: 'lowercase' },
  subtitle: { fontSize: 16, color: Colors.primary, fontFamily: 'NotoSansJP_700Bold', letterSpacing: 1, marginBottom: 30, textAlign: 'center' },
  principleTitle: { fontSize: 28, color: Colors.text, fontFamily: 'NotoSansJP_700Bold', marginBottom: 12, textAlign: 'center' },
  principleDesc: { fontSize: 16, color: Colors.textMuted, fontFamily: 'NotoSansJP_400Regular', textAlign: 'center', lineHeight: 24, marginBottom: 30, maxWidth: 300 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primary, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 35, gap: 12, minWidth: 240, elevation: 8, boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)' },
  primaryBtnText: { color: Colors.white, fontSize: 18, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
});
