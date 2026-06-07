import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Platform, Image } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../context/ThemeContext';
import { SpeakButton } from '../ui/SpeakButton';
import { useTts } from '../../hooks/useTts';

interface FlashcardProps {
  frontKanji: string;
  frontKana: string;
  back: string;
  isFlipped: boolean;
  onFlip: () => void;
  /** Word ID for pre-generated VOICEVOX audio lookup (optional). */
  wordId?: string;
}

const MEDIA_DIR = `${FileSystem.documentDirectory}media/`;

export const Flashcard: React.FC<FlashcardProps> = ({ frontKanji, frontKana, back, isFlipped, onFlip, wordId }) => {
  const { colors } = useTheme();
  const { speak, speakWord, state: ttsState } = useTts();
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [audio, setAudio] = useState<Audio.Sound | null>(null);

  // Text to speak = kanji if available, otherwise kana
  const readingText = frontKanji || frontKana;

  // Use pre-generated VOICEVOX audio if wordId is provided, otherwise live TTS
  const handleSpeak = () => wordId
    ? speakWord(wordId, readingText)
    : speak(readingText);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isFlipped ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();

    if (isFlipped) {
      // Play legacy Anki audio if present, else speak via VOICEVOX / TTS
      if (back.includes('[sound:')) {
        playAudio(back);
      } else {
        handleSpeak();
      }
    }
  }, [isFlipped, animatedValue, back]);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.unloadAsync();
      }
    };
  }, [audio]);

  const playAudio = async (text: string) => {
    const match = text.match(/\[sound:(.*?)\]/);
    if (!match) return;

    const filename = match[1];
    const uri = MEDIA_DIR + filename;

    try {
      if (audio) await audio.unloadAsync();
      const { sound } = await Audio.Sound.createAsync({ uri });
      setAudio(sound);
      await sound.playAsync();
    } catch (e) {
      console.warn('Failed to play card audio:', e);
    }
  };

  const renderContent = (content: string) => {
    const imgMatch = content.match(/<img src="(.*?)"/);
    if (imgMatch) {
      const uri = MEDIA_DIR + imgMatch[1];
      return <Image source={{ uri }} style={styles.cardImage} resizeMode="contain" />;
    }

    const cleanText = content
      .replace(/\[sound:.*?\]/g, '')
      .replace(/<[^>]*>?/gm, '')
      .trim();

    return <Text style={[content.length > 20 ? styles.smallText : styles.largeText, { color: colors.text }]}>{cleanText}</Text>;
  };

  const frontRotate = animatedValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = animatedValue.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  return (
    <Pressable onPress={!isFlipped ? onFlip : undefined} style={styles.container}>
      {/* Front */}
      <Animated.View style={[styles.card, { backgroundColor: colors.surface, transform: [{ rotateY: frontRotate }] }]}>
        <View style={[styles.levelTag, { backgroundColor: colors.surfaceLight + '33' }]}>
          <Text style={[styles.levelTagText, { color: colors.skyBlue }]}>JLPT N5</Text>
        </View>
        {/* TTS button — top-right, stops flip propagation */}
        <Pressable
          style={styles.ttsTopRight}
          onPress={e => { e.stopPropagation?.(); handleSpeak(); }}
        >
          <SpeakButton
            onPress={handleSpeak}
            state={ttsState}
            color={colors.skyBlue}
            size={38}
          />
        </Pressable>
        <Text style={[styles.kanji, { color: colors.white, fontFamily: 'KanjiStroke' }]}>{frontKanji}</Text>
        <Text style={[styles.kana, { color: colors.textMuted }]}>{frontKana}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>Tap to reveal</Text>
      </Animated.View>

      {/* Back */}
      <Animated.View style={[styles.card, styles.cardBack, { backgroundColor: colors.surface, transform: [{ rotateY: backRotate }] }]}>
        <View style={[styles.levelTag, { backgroundColor: colors.teal + '33' }]}>
          <Text style={[styles.levelTagText, { color: colors.teal }]}>Meaning</Text>
        </View>
        {/* TTS button — top-right on back face */}
        <View style={styles.ttsTopRight}>
          <SpeakButton
            onPress={handleSpeak}
            state={ttsState}
            color={colors.teal}
            size={38}
          />
        </View>
        <View style={styles.contentWrapper}>
          {renderContent(back)}
        </View>
        <View style={[styles.separator, { backgroundColor: colors.teal + '66' }]} />
        <Text style={[styles.kanaBack, { color: colors.textMuted }]}>{frontKana}</Text>
        <Text style={[styles.hint, { color: colors.textMuted }]}>Grade your answer</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', height: 440, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute', width: '100%', height: '100%', borderRadius: 32, padding: 24, alignItems: 'center', justifyContent: 'center',
    backfaceVisibility: 'hidden', boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.3)', elevation: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  cardBack: { },
  contentWrapper: { alignItems: 'center', justifyContent: 'center', width: '100%', flex: 1 },
  levelTag: { position: 'absolute', top: 24, left: 24, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  levelTagText: { fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  kanji: { fontSize: 100, textAlign: 'center', marginBottom: 12 },
  kana: { fontSize: 24, textAlign: 'center', letterSpacing: 2 },
  largeText: { fontSize: 32, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  smallText: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  cardImage: { width: '100%', height: 200, marginBottom: 12 },
  separator: { width: 40, height: 3, borderRadius: 2, marginBottom: 12 },
  kanaBack: { fontSize: 18, textAlign: 'center', letterSpacing: 2 },
  hint: { position: 'absolute', bottom: 24, fontSize: 13, opacity: 0.6 },
  ttsTopRight: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
});
