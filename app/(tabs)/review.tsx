import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Flashcard } from '../../components/cards/Flashcard';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { useAppStore } from '../../store/useAppStore';
import { feedbackService } from '../../engine/FeedbackService';

type Rating = 'again' | 'hard' | 'good' | 'easy';

export default function ReviewScreen() {
  const { session, loadSession, gradeCard, endSession } = useAppStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [grading, setGrading] = useState(false);

  useEffect(() => {
    if (!session.isActive) {
      loadSession();
    }
  }, []);

  // Reset flip state when card advances
  useEffect(() => {
    setIsFlipped(false);
  }, [session.currentIndex]);

  const handleReveal = () => {
    setIsFlipped(true);
    feedbackService.playFlip();
  };

  const handleGrade = async (rating: Rating) => {
    if (grading) return;
    setGrading(true);

    if (rating === 'good' || rating === 'easy') {
      feedbackService.playSuccess();
    } else if (rating === 'hard') {
      feedbackService.playWarning();
    } else {
      feedbackService.playError();
    }

    await gradeCard(rating);
    setGrading(false);
  };

  const currentCard = session.cards[session.currentIndex];

  if (!session.isActive || !currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneText}>Session terminée !</Text>
          <Text style={styles.xpText}>+{session.xpEarned} XP</Text>
          <Button
            title="Nouvelle session"
            onPress={() => loadSession()}
            style={{ marginTop: 24 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const progressLabel = `${session.reviewedCount} / ${session.goalValue}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar — no card count */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={session.progress} height={6} />
        <Text style={styles.progressLabel}>{progressLabel} cartes</Text>
      </View>

      <View style={styles.cardContainer}>
        <Flashcard
          frontKanji={currentCard.front_kanji}
          frontKana={currentCard.front_kana}
          back={currentCard.back}
          isFlipped={isFlipped}
          onFlip={handleReveal}
        />
      </View>

      <View style={styles.actionBar}>
        {isFlipped ? (
          <View style={styles.gradingGrid}>
            <View style={styles.gradingRow}>
              <GradeButton label="À revoir" sub="+0 XP" color={Colors.error} onPress={() => handleGrade('again')} />
              <GradeButton label="Difficile" sub="+5 XP" color={Colors.warning} onPress={() => handleGrade('hard')} />
            </View>
            <View style={styles.gradingRow}>
              <GradeButton label="Correct" sub="+10 XP" color={Colors.primary} onPress={() => handleGrade('good')} />
              <GradeButton label="Facile" sub="+15 XP" color={Colors.success} onPress={() => handleGrade('easy')} />
            </View>
          </View>
        ) : (
          <Button
            title="Afficher la réponse"
            onPress={handleReveal}
            style={styles.revealBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

function GradeButton({
  label, sub, color, onPress,
}: {
  label: string; sub: string; color: string; onPress: () => void;
}) {
  return (
    <View style={[styles.gradeBtn, { borderColor: color + '55' }]}>
      <Button
        title={label}
        onPress={onPress}
        style={{ backgroundColor: color + '22', flex: 1 }}
      />
      <Text style={[styles.gradeSub, { color }]}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 6,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  actionBar: {
    padding: 20,
    paddingBottom: 36,
    minHeight: 140,
    justifyContent: 'flex-end',
  },
  revealBtn: {
    width: '100%',
    paddingVertical: 18,
  },
  gradingGrid: {
    gap: 10,
  },
  gradingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gradeBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
  },
  gradeSub: {
    fontSize: 11,
    fontWeight: '600',
    paddingBottom: 6,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  doneEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  doneText: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  xpText: {
    color: Colors.warning,
    fontSize: 20,
    fontWeight: '700',
  },
});
