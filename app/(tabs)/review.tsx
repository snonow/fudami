import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Flashcard } from '../../components/cards/Flashcard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { feedbackService } from '../../engine/FeedbackService';

export default function ReviewScreen() {
  const { session, loadSession, gradeCard } = useAppStore();
  const [flipped, setFlipped] = useState(false);
  const [grading, setGrading] = useState(false);

  useEffect(() => { if (!session.isActive) loadSession(); }, []);
  useEffect(() => setFlipped(false), [session.currentIndex]);

  const onGrade = async (r: 'again' | 'hard' | 'good' | 'easy') => {
    if (grading) return;
    setGrading(true);
    r === 'again' ? feedbackService.playError() : r === 'hard' ? feedbackService.playWarning() : feedbackService.playSuccess();
    await gradeCard(r);
    setGrading(false);
  };

  const card = session.cards[session.currentIndex];
  if (!session.isActive || !card) return (
    <SafeAreaView style={[styles.container, styles.centered]}>
      <Text style={{ fontSize: 50 }}>🎉</Text>
      <Text style={styles.doneText}>Session complete!</Text>
      <Text style={styles.xpText}>+{session.xpEarned} XP</Text>
      <Button title="New session" onPress={() => loadSession()} style={{ marginTop: 20 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 20 }}>
        <ProgressBar progress={session.progress} height={6} />
        <Text style={styles.label}>{session.reviewedCount} / {session.goalValue} cards</Text>
      </View>
      <View style={styles.cardContainer}>
        <Flashcard frontKanji={card.front_kanji} frontKana={card.front_kana} back={card.back} isFlipped={flipped} onFlip={() => { setFlipped(true); feedbackService.playFlip(); }} />
      </View>
      <View style={styles.actionBar}>
        {flipped ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradeBtn label="Again" xp="+0" color={Colors.error} onPress={() => onGrade('again')} />
              <GradeBtn label="Hard" xp="+5" color={Colors.warning} onPress={() => onGrade('hard')} />
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <GradeBtn label="Good" xp="+10" color={Colors.primary} onPress={() => onGrade('good')} />
              <GradeBtn label="Easy" xp="+15" color={Colors.success} onPress={() => onGrade('easy')} />
            </View>
          </View>
        ) : <Button title="Show answer" onPress={() => { setFlipped(true); feedbackService.playFlip(); }} style={styles.revealBtn} />}
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
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  label: { color: Colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 4 },
  cardContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  actionBar: { padding: 20, paddingBottom: 40, minHeight: 140, justifyContent: 'flex-end' },
  revealBtn: { width: '100%', paddingVertical: 18 },
  gradeBtn: { flex: 1, borderRadius: 12, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  doneText: { color: Colors.text, fontSize: 24, fontWeight: 'bold' },
  xpText: { color: Colors.warning, fontSize: 18, fontWeight: 'bold' },
});
