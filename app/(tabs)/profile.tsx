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
import type { LevelId, SkillId, UserState } from '../../types';

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
          {/* Highest level with any mastery is the "current" level shown beside the name. */}
          <Text style={[styles.lvl, { color: colors.teal }]}>{currentLevelLabel(user)}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Streak</Text>
        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <StatCard label="Streak" value={`${user.streak.days} d`} icon="flame" iconColor="#FF5252" />
            <StatCard label="Mastered" value={totalMastered(user)} icon="ribbon" iconColor={colors.success} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Progress by skill</Text>
        <View style={{ gap: 8, marginBottom: 30 }}>
          {SKILL_ORDER.map(skill => (
            <SkillRow key={skill} skill={skill} user={user} accent={colors.teal} text={colors.text} muted={colors.textMuted} />
          ))}
          {user.progress.length === 0 && (
            <Text style={[styles.sub, { color: colors.textMuted, padding: 8 }]}>
              Sync with the gateway to see your progress matrix.
            </Text>
          )}
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
        <View style={[styles.card, { backgroundColor: colors.surface, marginBottom: 30 }]}>
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Daily Goal</Text>
              <Text style={[styles.sub, { color: colors.textMuted }]}>{session.goalValue} cards</Text>
            </View>
            <Switch value={true} trackColor={{ false: colors.surfaceLight, true: colors.teal }} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Sources & Credits</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <CreditItem label="Hanabira.org" sub="Grammar points and patterns (CC BY-SA)" />
          <CreditItem label="JMdict / EDRDG" sub="Dictionary and vocabulary data" />
          <CreditItem label="Tatoeba" sub="Example sentences and translations" />
          <CreditItem label="VOICEVOX" sub="Japanese neural text-to-speech" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Progress helpers (see /SEMANTIC_MODEL.md) ───────────────────────────────

const SKILL_ORDER: SkillId[] = ['vocab', 'kanji', 'grammar', 'reading', 'listening', 'writing', 'speaking'];
const LEVEL_ORDER: LevelId[] = ['n5', 'n4', 'n3', 'n2', 'n1'];
const SKILL_LABEL: Record<SkillId, string> = {
  vocab:     'Vocabulary',
  kanji:     'Kanji',
  grammar:   'Grammar',
  reading:   'Reading',
  listening: 'Listening',
  writing:   'Writing',
  speaking:  'Speaking',
};
const LEVEL_LABEL: Record<LevelId, string> = {
  n5: 'Beginner (N5)',
  n4: 'Elementary (N4)',
  n3: 'Intermediate (N3)',
  n2: 'Upper-Int. (N2)',
  n1: 'Advanced (N1)',
};

function totalMastered(user: UserState): number {
  return user.progress.reduce((acc, p) => acc + p.mastered_units, 0);
}

function currentLevelLabel(user: UserState): string {
  // Highest level with any non-zero mastery.
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    const lvl = LEVEL_ORDER[i];
    if (user.progress.some(p => p.level_id === lvl && p.mastered_units > 0)) {
      return LEVEL_LABEL[lvl];
    }
  }
  return LEVEL_LABEL.n5;
}

function SkillRow({ skill, user, accent, text, muted }: {
  skill: SkillId; user: UserState; accent: string; text: string; muted: string;
}) {
  // Per-skill mastery summed across all levels — what you see on the profile.
  let mastered = 0, total = 0, lastReview: string | null = null;
  for (const p of user.progress) {
    if (p.skill_id !== skill) continue;
    mastered += p.mastered_units;
    total    += p.total_units;
    if (p.last_review_at && (!lastReview || p.last_review_at > lastReview)) {
      lastReview = p.last_review_at;
    }
  }
  const ratio = total > 0 ? mastered / total : 0;
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(128,128,128,0.06)' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: text, fontWeight: '600' }}>{SKILL_LABEL[skill]}</Text>
        <Text style={{ color: muted, fontSize: 12 }}>{mastered} / {total || '—'}</Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.18)', overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(ratio * 100)}%`, height: '100%', backgroundColor: accent }} />
      </View>
    </View>
  );
}

const CreditItem = ({ label, sub }: { label: string; sub: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[styles.label, { color: colors.text, fontSize: 14 }]}>{label}</Text>
      <Text style={[styles.sub, { color: colors.textMuted, fontSize: 12 }]}>{sub}</Text>
    </View>
  );
};

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
