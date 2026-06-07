import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Switch, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { StatCard } from '../../components/cards/StatCard';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { ankiImporter } from '../../engine/AnkiImporter';

import { getPackManifest, refreshPack } from '../../data/content/ContentRepository';
import { PackManifest, contentErrorMessage } from '../../data/content/types';

export default function ProfileScreen() {
  const { user, session } = useAppStore();
  const { colors } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [manifest, setManifest] = useState<PackManifest | null>(null);

  React.useEffect(() => {
    getPackManifest().then(setManifest);
  }, []);

  const onUpdatePack = async () => {
    setLoading(true);
    const result = await refreshPack();
    if (result.ok) {
      setManifest(result.data);
      Alert.alert('Success', `Pack updated to version ${result.data.version}`);
    } else {
      Alert.alert('Error', contentErrorMessage(result.error));
    }
    setLoading(false);
  };

  const onImport = async () => {
    setLoading(true);
    try {
      const res = await ankiImporter.importDeck();
      if (res) Alert.alert('Success', `Deck "${res.deckName}" imported (${res.cardCount} cards).`);
    } catch (e) { Alert.alert('Error', 'Import failed.'); }
    finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceLight + '33', borderColor: colors.teal }]}>
            <Text style={[styles.avatarT, { color: colors.teal }]}>U</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>User</Text>
          <Text style={[styles.lvl, { color: colors.teal }]}>Level {user.level}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Statistics</Text>
        <View style={{ gap: 12, marginBottom: 30 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard label="Total XP" value={user.xpTotal} icon="star" iconColor="#FFD54F" />
            <StatCard label="Streak" value={`${user.streakDays} d`} icon="flame" iconColor="#FF5252" />
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard label="Reviews" value={user.totalReviews} icon="albums-outline" iconColor={colors.teal} />
            <StatCard label="Level" value={user.level} icon="trending-up" iconColor={colors.success} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Content Pack</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { marginBottom: 15 }]}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>
                {manifest ? `Version ${manifest.version}` : 'No pack installed'}
              </Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>
                {manifest ? `${manifest.counts.words} words, ${manifest.counts.kanji} kanji` : 'Using bundled seed data'}
              </Text>
            </View>
            <Ionicons name="cloud-download-outline" size={24} color={colors.teal} />
          </View>
          <Button 
            title={manifest ? "Update Pack" : "Download Pack"} 
            variant="outline" 
            onPress={onUpdatePack} 
            loading={loading}
          />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Actions</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {loading ? <ActivityIndicator color={colors.teal} /> : (
            <Button title="Import Anki Deck (.apkg)" variant="outline" onPress={onImport} />
          )}
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Daily Goal</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>{session.goalValue} cards</Text>
            </View>
            <Switch value={true} trackColor={{ false: colors.surfaceLight, true: colors.teal }} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  header: { alignItems: 'center', marginVertical: 30 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 2, marginBottom: 10 },
  avatarT: { fontSize: 32, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold' },
  lvl: { fontSize: 14, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 10 },
  card: { borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
});
