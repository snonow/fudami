import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

interface FlashcardProps {
  frontContent: string;
  backContent: string;
  isFlipped: boolean;
  onFlip: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ frontContent, backContent, isFlipped, onFlip }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // We sync the prop `isFlipped` to the animation, but we also want to animate when the prop changes
  React.useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isFlipped, animatedValue]);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <Pressable onPress={onFlip} style={styles.container}>
      {/* Front */}
      <Animated.View style={[styles.card, frontAnimatedStyle]}>
        <Text style={styles.cardText}>{frontContent}</Text>
        <Text style={styles.hintText}>Appuyez pour retourner</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
        <Text style={styles.cardText}>{backContent}</Text>
        <Text style={styles.hintText}>Évaluez votre réponse ci-dessous</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden', // Hide the back when flipped
    boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.4)',
    elevation: 8,
  },
  cardBack: {
    backgroundColor: Colors.surfaceLight,
  },
  cardText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  hintText: {
    position: 'absolute',
    bottom: 20,
    color: Colors.textMuted,
    fontSize: 14,
  },
});
