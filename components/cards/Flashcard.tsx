import React, { useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

interface FlashcardProps {
  frontKanji: string;
  frontKana: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ frontKanji, frontKana, back, isFlipped, onFlip }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isFlipped, animatedValue]);

  const frontRotate = animatedValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = animatedValue.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={!isFlipped ? onFlip : undefined} style={styles.container}>
      {/* Front */}
      <Animated.View style={[styles.card, { transform: [{ rotateY: frontRotate }] }]}>
        <View style={styles.levelTag}>
          <Text style={styles.levelTagText}>N5</Text>
        </View>
        <Text style={styles.kanji}>{frontKanji}</Text>
        <Text style={styles.kana}>{frontKana}</Text>
        <Text style={styles.hint}>Appuyer pour révéler</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, { transform: [{ rotateY: backRotate }] }]}>
        <View style={[styles.levelTag, { backgroundColor: Colors.primary + '33' }]}>
          <Text style={[styles.levelTagText, { color: Colors.primary }]}>Réponse</Text>
        </View>
        <Text style={styles.meaning}>{back}</Text>
        <View style={styles.separator} />
        <Text style={styles.kanaBack}>{frontKana}</Text>
        <Text style={styles.hint}>Évaluez votre réponse</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.5)',
    elevation: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceLight,
  },
  cardBack: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.primary + '33',
  },
  levelTag: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelTagText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kanji: {
    fontSize: 64,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  kana: {
    fontSize: 22,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 2,
  },
  meaning: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  separator: {
    width: 40,
    height: 2,
    backgroundColor: Colors.primary + '66',
    borderRadius: 1,
    marginBottom: 12,
  },
  kanaBack: {
    fontSize: 18,
    color: Colors.textMuted,
    textAlign: 'center',
    letterSpacing: 2,
  },
  hint: {
    position: 'absolute',
    bottom: 22,
    color: Colors.textMuted,
    fontSize: 13,
    opacity: 0.6,
  },
});
