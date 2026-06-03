import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Flashcard } from '../../components/cards/Flashcard';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../store/useAppStore';
import { DUMMY_CARDS } from '../../constants/MockData';

export default function ReviewScreen() {
  const { session, nextCard, addXP, startSession } = useAppStore();
  const [isFlipped, setIsFlipped] = useState(false);

  // Initialize session with dummy data if not active
  React.useEffect(() => {
    if (!session.isActive) {
      startSession(DUMMY_CARDS, 'cards', DUMMY_CARDS.length);
    }
  }, [session.isActive, startSession]);

  const currentCard = session.cards[session.currentIndex];

  const handleGrade = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    // In a real app, we'd pass this to FSRS engine. For now, just grant XP and move on.
    const xpMap = { again: 0, hard: 5, good: 10, easy: 15 };
    addXP(xpMap[rating]);
    
    // Reset flip state before next card
    setIsFlipped(false);
    
    // Delay slightly to let the flip animation finish hiding the back before content changes
    setTimeout(() => {
      nextCard();
    }, 150);
  };

  if (!session.isActive || !currentCard) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.doneText}>Session Terminée !</Text>
          <Text style={styles.xpText}>+{session.xpEarned} XP gagnés</Text>
          <Button 
            title="Nouvelle Session" 
            onPress={() => startSession(DUMMY_CARDS, 'cards', DUMMY_CARDS.length)} 
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Carte {session.currentIndex + 1} / {session.cards.length}
        </Text>
      </View>

      <View style={styles.cardContainer}>
        <Flashcard 
          frontContent={currentCard.front} 
          backContent={currentCard.back}
          isFlipped={isFlipped}
          onFlip={() => setIsFlipped(true)}
        />
      </View>

      <View style={styles.actionBar}>
        {isFlipped ? (
          <View style={styles.gradingRow}>
            <Button title="À revoir" variant="outline" style={styles.gradeBtn} onPress={() => handleGrade('again')} />
            <Button title="Difficile" variant="outline" style={styles.gradeBtn} onPress={() => handleGrade('hard')} />
            <Button title="Correct" variant="primary" style={styles.gradeBtn} onPress={() => handleGrade('good')} />
            <Button title="Facile" variant="secondary" style={styles.gradeBtn} onPress={() => handleGrade('easy')} />
          </View>
        ) : (
          <Button 
            title="Afficher la réponse" 
            onPress={() => setIsFlipped(true)} 
            style={styles.revealBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    color: Colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  actionBar: {
    padding: 20,
    paddingBottom: 40,
    minHeight: 120, // Keep space consistent whether grading or revealing
    justifyContent: 'flex-end',
  },
  revealBtn: {
    width: '100%',
    paddingVertical: 18,
  },
  gradingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  gradeBtn: {
    flex: 1,
    paddingHorizontal: 0, // Let flex handle width
    paddingVertical: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneText: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  xpText: {
    color: Colors.warning,
    fontSize: 20,
    fontWeight: '600',
  },
});
