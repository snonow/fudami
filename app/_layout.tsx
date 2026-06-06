import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { getDatabase, migrateDbIfNeeded } from '../db/schema';
import { seedIfNeeded } from '../db/seed';
import { useAppStore } from '../store/useAppStore';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const loadUser = useAppStore((s) => s.loadUser);

  useEffect(() => {
    async function init() {
      const db = await getDatabase();
      await migrateDbIfNeeded(db);
      await seedIfNeeded();
      await loadUser();
      setDbReady(true);
    }
    init();
  }, []);

  if (!dbReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
