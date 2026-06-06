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

  const onGrade = async (r: 'again' | 'hard' | 'good' | 'easy') => {
    if (grading) return;
    setGrading(true);
    r === 'again' ? feedback.playError() : r === 'hard' ? feedback.playWarning() : feedback.playSuccess();
    await gradeCard(r);
    setGrading(false);
  };

  const card = session.cards[session.currentIndex];
  if (!session.isActive || !card) return (
    <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
      <Text style={{ fontSize: 50 }}>🎉</Text>
      <Text style={[styles.doneText, { color: colors.text }]}>Session complete!</Text>
      <Text style={[styles.xpText, { color: colors.warning }]}>+{session.xpEarned} XP</Text>
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
        <Flashcard frontKanji={card.front_kanji} frontKana={card.front_kana} back={card.back} isFlipped={flipped} onFlip={() => { setFlipped(true); feedback.playFlip(); }} />
      </View>
      <View style={styles.actionBar}>
        {flipped ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradeBtn label="Again" xp="+0" color={colors.error} onPress={() => onGrade('again')} />
              <GradeBtn label="Hard" xp="+5" color={colors.warning} onPress={() => onGrade('hard')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradeBtn label="Good" xp="+10" color={colors.teal} onPress={() => onGrade('good')} />
              <GradeBtn label="Easy" xp="+15" color={colors.success} onPress={() => onGrade('easy')} />
            </View>
          </View>
        ) : <Button title="Show answer" onPress={() => { setFlipped(true); feedback.playFlip(); }} style={styles.revealBtn} />}
      </View>
    </SafeAreaView>
  );
}

const GradeBtn = ({ label, xp, color, onPress }: any) => (
  <View style={[styles.gradeBtn, { borderColor: color + '55' }]}>
    <Button title={label} onPress={onPress} style={{ backgroundColor: color + '22', flex: 1 }} />
    <Text style={{ fontSize: 10, color, fontWeight: 'bold', paddingBottom: 4 }}>{xp} XP</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(128,128,128,0.1)' },
  label: { fontSize: 12, fontWeight: '700' },
  cardContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  actionBar: { padding: 20, paddingBottom: 40, minHeight: 140, justifyContent: 'flex-end' },
  revealBtn: { width: '100%', paddingVertical: 18 },
  gradeBtn: { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  doneText: { fontSize: 24, fontWeight: 'bold' },
  xpText: { fontSize: 18, fontWeight: 'bold' },
});
