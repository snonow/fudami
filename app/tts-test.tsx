/**
 * TTS Test Screen — /tts-test
 *
 * Demonstrates TTS on the 50-word bundled N5 seed vocab.
 * No content pack needed — works offline with the system TTS backend.
 * Add a GOOGLE_TTS_KEY to constants/ttsKey.ts to test the cloud backend.
 *
 * Navigate here in dev: add a link from the home screen or visit directly
 * via expo-router <Link href="/tts-test">.
 */

import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SpeakButton } from '../components/ui/SpeakButton';
import { useTts } from '../hooks/useTts';
import { TtsService } from '../data/audio/TtsService';

// ── Seed data (bundled, no network needed) ───────────────────────────────────

import seedRaw from '../assets/jmdict/vocab_n5.json';
type SeedEntry = { id: string; front_kanji: string; front_kana: string; back: string };
const SEED = seedRaw as SeedEntry[];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TtsTestScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { speak, speakWord, state: ttsState } = useTts();
  const [lastSpoken, setLastSpoken] = useState<string | null>(null);

  const handleSpeak = (entry: SeedEntry) => {
    const text = entry.front_kanji || entry.front_kana;
    setLastSpoken(text);
    speakWord(entry.id, text);   // pre-generated VOICEVOX first, TTS fallback
  };

  const handleSpeakSentence = () => {
    const sentence = '私は毎日日本語を勉強しています。';
    setLastSpoken(sentence);
    speak(sentence);
  };

  const backendLabel =
    TtsService.backend === 'cloud'   ? 'Google Cloud TTS · Chirp 3 HD' :
    /* default */                      'System TTS · expo-speech';
  // Pre-generated audio is checked at runtime — badge shows live TTS fallback only

  const backendColor = TtsService.backend === 'cloud' ? colors.success : colors.warning;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.text }]}>TTS Test</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {SEED.length} seed words · N5
          </Text>
        </View>
      </View>

      {/* Backend badge */}
      <View style={[styles.badge, { backgroundColor: backendColor + '20', borderColor: backendColor + '55' }]}>
        <Ionicons
          name={TtsService.backend === 'cloud' ? 'cloud-outline' : 'phone-portrait-outline'}
          size={14}
          color={backendColor}
        />
        <Text style={[styles.badgeText, { color: backendColor }]}>{backendLabel}</Text>
        {TtsService.backend === 'system' && (
          <Text style={[styles.badgeHint, { color: colors.textMuted }]}>
            · Add GOOGLE_TTS_KEY for high quality
          </Text>
        )}
      </View>

      {/* Currently speaking banner */}
      {lastSpoken && (
        <View style={[styles.nowPlaying, { backgroundColor: colors.surface }]}>
          <SpeakButton
            onPress={() => speak(lastSpoken)}
            state={ttsState}
            color={colors.teal}
            size={36}
          />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.nowPlayingLabel, { color: colors.textMuted }]}>Last spoken</Text>
            <Text style={[styles.nowPlayingText, { color: colors.text }]}>{lastSpoken}</Text>
          </View>
        </View>
      )}

      {/* Sentence demo */}
      <Pressable
        style={[styles.sentenceRow, { backgroundColor: colors.surface }]}
        onPress={handleSpeakSentence}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.sentenceJp, { color: colors.text }]}>
            私は毎日日本語を勉強しています。
          </Text>
          <Text style={[styles.sentenceEn, { color: colors.textMuted }]}>
            I study Japanese every day.  (sentence test)
          </Text>
        </View>
        <SpeakButton
          onPress={handleSpeakSentence}
          state={ttsState}
          color={colors.teal}
          size={40}
        />
      </Pressable>

      {/* Vocab list */}
      <FlatList
        data={SEED}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => (
          <View style={[styles.sep, { backgroundColor: colors.surface }]} />
        )}
        renderItem={({ item }) => (
          <VocabRow
            entry={item}
            ttsState={ttsState}
            onSpeak={() => handleSpeak(item)}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
}

// ── VocabRow ──────────────────────────────────────────────────────────────────

const VocabRow = ({
  entry,
  ttsState,
  onSpeak,
  colors,
}: {
  entry: SeedEntry;
  ttsState: ReturnType<typeof useTts>['state'];
  onSpeak: () => void;
  colors: any;
}) => (
  <View style={[styles.row, { backgroundColor: colors.surface + 'cc' }]}>
    <View style={{ flex: 1 }}>
      {entry.front_kanji ? (
        <>
          <Text style={[styles.kanji, { color: colors.text }]}>{entry.front_kanji}</Text>
          <Text style={[styles.kana,  { color: colors.textMuted }]}>{entry.front_kana}</Text>
        </>
      ) : (
        <Text style={[styles.kanji, { color: colors.text }]}>{entry.front_kana}</Text>
      )}
      <Text style={[styles.meaning, { color: colors.textMuted }]}>{entry.back}</Text>
    </View>
    <SpeakButton
      onPress={onSpeak}
      state={ttsState}
      color={colors.teal}
      size={40}
    />
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 8 },
  backBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)', marginRight: 12 },
  title:           { fontSize: 22, fontWeight: '700' },
  subtitle:        { fontSize: 13, marginTop: 2 },
  badge:           { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1 },
  badgeText:       { fontSize: 12, fontWeight: '700' },
  badgeHint:       { fontSize: 11 },
  nowPlaying:      { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 16 },
  nowPlayingLabel: { fontSize: 11, marginBottom: 2 },
  nowPlayingText:  { fontSize: 18, fontWeight: '700' },
  sentenceRow:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 16, gap: 12 },
  sentenceJp:      { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  sentenceEn:      { fontSize: 12 },
  list:            { paddingHorizontal: 16, paddingBottom: 40 },
  sep:             { height: 1, marginHorizontal: 8 },
  row:             { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginVertical: 3 },
  kanji:           { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  kana:            { fontSize: 14, marginBottom: 4 },
  meaning:         { fontSize: 13 },
});
