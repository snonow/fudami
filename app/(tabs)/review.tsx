import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Flashcard } from '../../components/cards/Flashcard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { feedback } from '../../engine';

export default function ReviewScreen() {
  const { session, loadSession, gradeCard } = useAppStore();
  const { colors } = useTheme();
  const router = useRouter();
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);

  useEffect(() => { if (!session.isActive) loadSession(); }, []);
  useEffect(() => setFlipped(false), [session.currentIndex]);

  const onGrade = async (r: 'again' | 'good') => {
    if (grading) return;
    setGrading(true);
    r === 'again' ? feedback.playError() : feedback.playSuccess();
    await gradeCard(r);
    setGrading(false);
  };

  const card = session.cards[session.currentIndex];
  if (!session.isActive || !card) return (
    <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 50 }}>🎉</Text>
      <Text style={[styles.doneText, { color: colors.text }]}>Session complete!</Text>
      <Button title="Return to Hub" onPress={() => router.back()} style={{ marginTop: 20 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, paddingHorizontal: 20 }}>
          <ProgressBar progress={session.progress} height={6} />
        </View>
        <Text style={[styles.label, { color: colors.textMuted }]}>{session.reviewedCount} / {session.goalValue}</Text>
      </View>

      <View style={styles.cardContainer}>
        <Flashcard 
          frontKanji={card.content.kanji || ''} 
          frontKana={card.content.kana} 
          back={card.content.meanings.join(', ')} 
          isFlipped={flipped} 
          onFlip={() => { setFlipped(true); feedback.playFlip(); }} 
        />
      </View>
      <View style={styles.actionBar}>
        {flipped ? (
          <View style={styles.gradeContainer}>
            <Pressable 
              style={[styles.gradeBtn, { backgroundColor: colors.palette.softHankoRed }]} 
              onPress={() => onGrade('again')}
            >
              <Ionicons name="close-circle" size={24} color={colors.white} />
              <Text style={styles.gradeText}>Forgot</Text>
            </Pressable>
            <Pressable 
              style={[styles.gradeBtn, { backgroundColor: colors.palette.softMatchaGreen }]} 
              onPress={() => onGrade('good')}
            >
              <Ionicons name="checkmark-circle" size={24} color={colors.white} />
              <Text style={styles.gradeText}>Got it</Text>
            </Pressable>
          </View>
        ) : <Button title="Show answer" onPress={() => { setFlipped(true); feedback.playFlip(); }} style={styles.revealBtn} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)' },
  label: { fontSize: 12, fontWeight: '700' },
  cardContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  actionBar: { padding: 20, paddingBottom: 40, minHeight: 140, justifyContent: 'flex-end' },
  revealBtn: { width: '100%', paddingVertical: 18 },
  gradeContainer: { flexDirection: 'row', gap: 16, width: '100%' },
  gradeBtn: { flex: 1, height: 60, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, elevation: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
  gradeText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  doneText: { fontSize: 24, fontWeight: 'bold' },
});
