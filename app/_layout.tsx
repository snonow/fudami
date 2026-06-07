import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDb } from '../db';
import { initContent } from '../data/content/ContentRepository';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/Colors';

import { ThemeProvider } from '../context/ThemeContext';

import { 
  useFonts, 
  NotoSansJP_400Regular, 
  NotoSansJP_700Bold, 
  NotoSansJP_500Medium,
  NotoSansJP_300Light 
} from '@expo-google-fonts/noto-sans-jp';
import * as SplashScreen from 'expo-splash-screen';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../hooks/auth/useTokenCache';

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error(
    'Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env',
  );
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansJP_400Regular,
    NotoSansJP_700Bold,
    NotoSansJP_500Medium,
    NotoSansJP_300Light,
    'KanjiStroke': require('../assets/fonts/KanjiStrokeOrders.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);
  const loadUser = useAppStore((s) => s.loadUser);

  useEffect(() => {
    async function init() {
      try {
        await Promise.all([
          initDb(),
          initContent()
        ]);
        await loadUser();
        setDbReady(true);
      } catch (error) {
        console.error('[RootLayout] Initialization failed:', error);
        // On ne bloque pas dbReady indéfiniment en cas d'erreur mineure
        // ou on laisse l'utilisateur voir que ça a planté ? 
        // Pour l'instant on log juste.
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  if (!fontsLoaded || !dbReady) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.navy, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.teal} />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
