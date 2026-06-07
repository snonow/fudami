/**
 * useTts — React hook wrapping TtsService.
 *
 * Usage:
 *   const { speakWord, speak, stop, state, isSpeaking, isLoading } = useTts();
 *
 *   // Best quality (pre-generated VOICEVOX → cloud → system):
 *   speakWord('n5_001', '食べる');
 *
 *   // Any text (cloud → system):
 *   speak('こんにちは');
 */

import { useState, useEffect, useCallback } from 'react';
import { TtsService, type TtsState } from '../../data/audio/TtsService';

export interface UseTtsReturn {
  state:      TtsState;
  isSpeaking: boolean;
  isLoading:  boolean;
  backend:    'pregenerated' | 'cloud' | 'system';
  /** Speak a vocab/sentence word — checks pre-generated VOICEVOX audio first. */
  speakWord:     (wordId: string, fallbackText: string) => Promise<void>;
  /** Speak a sentence — checks pre-generated VOICEVOX audio first. */
  speakSentence: (sentenceId: string, fallbackText: string) => Promise<void>;
  /** Speak any text directly (no pre-generated file lookup). */
  speak:         (text: string) => Promise<void>;
  stop:          () => Promise<void>;
}

export function useTts(): UseTtsReturn {
  const [state, setState] = useState<TtsState>(TtsService.state);

  useEffect(() => TtsService.subscribe(setState), []);

  const speakWord     = useCallback((id: string, text: string) => TtsService.speakWord(id, text), []);
  const speakSentence = useCallback((id: string, text: string) => TtsService.speakSentence(id, text), []);
  const speak         = useCallback((text: string)             => TtsService.speak(text), []);
  const stop          = useCallback(()                         => TtsService.stop(), []);

  return {
    state,
    isSpeaking: state === 'speaking',
    isLoading:  state === 'loading',
    backend:    TtsService.backend,
    speakWord,
    speakSentence,
    speak,
    stop,
  };
}
