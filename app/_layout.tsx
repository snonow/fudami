import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initDb } from '../db';
import { initContent } from '../data/content/ContentRepository';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/Colors';

import { ThemeProvider } from '../context/ThemeContext';

import { 
  useFonts, 
  MPLUSRounded1c_400Regular, 
  MPLUSRounded1c_700Bold, 
  MPLUSRounded1c_500Medium,
  MPLUSRounded1c_300Light 
} from '@expo-google-fonts/m-plus-rounded-1c';
import * as SplashScreen from 'expo-splash-screen';

import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '../hooks/auth/useTokenCache';

// During static export, environment variables might be missing.
// We provide a fallback to prevent the build from crashing.
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    NotoSansJP_400Regular: MPLUSRounded1c_400Regular,
    NotoSansJP_700Bold: MPLUSRounded1c_700Bold,
    NotoSansJP_500Medium: MPLUSRounded1c_500Medium,
    NotoSansJP_300Light: MPLUSRounded1c_300Light,
    'KanjiStroke': require('../assets/fonts/KanjiStrokeOrders.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const loadUser = useAppStore((s) => s.loadUser);

  useEffect(() => {
    async function init() {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('init timeout: database worker did not respond')), 10_000)
        );
        await Promise.race([
          Promise.all([initDb(), initContent()]),
          timeout,
        ]);
        await loadUser();
        setDbReady(true);
      } catch (error) {
        console.error('[RootLayout] Initialization failed:', error);
        const msg = String(error);
        setInitError(
          msg.includes('SharedArrayBuffer') || msg.includes('crossOriginIsolated')
            ? 'Browser security isolation is missing. Please hard-refresh (Cmd/Ctrl+Shift+R).'
            : msg.includes('worker') || msg.includes('database') || msg.includes('timeout')
              ? 'Database access denied. If you are in Private/Incognito mode, please use a standard window.'
              : 'Initialization failed. Please refresh the page.'
        );
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && (dbReady || initError)) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady, initError]);

  if (!fontsLoaded || (!dbReady && !initError)) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (initError) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <Text style={{ color: Colors.error, fontSize: 18, textAlign: 'center', fontFamily: 'NotoSansJP_700Bold', marginBottom: 20 }}>
          ⚠️ {initError}
        </Text>
        <ActivityIndicator color={Colors.primary} />
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
