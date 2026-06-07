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
      await Promise.all([
        initDb(),
        initContent()
      ]);
      await loadUser();
      setDbReady(true);
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
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
