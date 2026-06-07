/**
 * TtsService — Japanese text-to-speech, three backends in priority order.
 *
 * Priority:
 *   1. 'pregenerated' — Pre-generated VOICEVOX WAV (best quality, instant playback)
 *                       Served from local dev server (main.py serve-audio)
 *                       or extracted from content pack (FileSystem.documentDirectory).
 *                       Uses AudioRepository to resolve word/sentence IDs to URIs.
 *   2. 'cloud'        — Google Cloud TTS Chirp 3 HD  (if GOOGLE_TTS_KEY is set)
 *                       High quality, pitch-accent aware, ~0 cost at vocab scale.
 *   3. 'system'       — expo-speech (iOS/Android system TTS)
 *                       Zero setup, works offline, mediocre on Android.
 *
 * Usage:
 *   import { TtsService } from '@/data/audio/TtsService';
 *
 *   // Speak from pre-generated file (word ID) with text fallback:
 *   await TtsService.speakWord('n5_001', '食べる');
 *
 *   // Speak any text (no pre-generated file, uses cloud/system):
 *   await TtsService.speak('食べる');
 *
 * React hook:
 *   import { useTts } from '@/hooks/useTts';
 *   const { speak, speakWord, state } = useTts();
 */

import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { GOOGLE_TTS_KEY } from '../../constants/ttsKey';
import { AudioRepository } from './AudioRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TtsState = 'idle' | 'loading' | 'speaking';
type Listener = (state: TtsState) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const VOICE_NAME     = 'ja-JP-Chirp3-HD-Aoede';
const SPEAKING_RATE  = 0.85;

// ─── Service ──────────────────────────────────────────────────────────────────

class _TtsService {
  private _state: TtsState = 'idle';
  private _listeners = new Set<Listener>();

  /** In-memory cache for Google Cloud TTS responses (text → base64 MP3). */
  private _cloudCache = new Map<string, string>();

  /** Currently playing expo-av Sound. */
  private _sound: Audio.Sound | null = null;

  // ── State management ──────────────────────────────────────────────────────

  get state(): TtsState { return this._state; }

  private _setState(s: TtsState): void {
    this._state = s;
    this._listeners.forEach(l => l(s));
  }

  /** Subscribe to state changes. Returns unsubscribe fn. */
  subscribe(cb: Listener): () => void {
    this._listeners.add(cb);
    cb(this._state);
    return () => this._listeners.delete(cb);
  }

  get backend(): 'pregenerated' | 'cloud' | 'system' {
    // Reported backend doesn't account for pre-generated (checked at runtime).
    return GOOGLE_TTS_KEY ? 'cloud' : 'system';
  }

  get cacheSize(): number { return this._cloudCache.size; }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Speak a vocab word by its ID — checks pre-generated VOICEVOX audio first.
   *
   * @param wordId       JMdict / seed ID (e.g. 'n5_001', '1000010')
   * @param fallbackText Japanese text to speak if no pre-generated file exists
   */
  async speakWord(wordId: string, fallbackText: string): Promise<void> {
    await this.stop();
    this._setState('loading');
    try {
      const uri = await AudioRepository.wordUri(wordId);
      if (uri) {
        return this._playUri(uri);
      }
    } catch { /* fall through */ }
    // No pre-generated file — use live TTS
    this._setState('idle');
    return this._speakLive(fallbackText);
  }

  /**
   * Speak an example sentence by its ID.
   *
   * @param sentenceId   Tatoeba sentence ID
   * @param fallbackText Japanese text to speak if no pre-generated file exists
   */
  async speakSentence(sentenceId: string, fallbackText: string): Promise<void> {
    await this.stop();
    this._setState('loading');
    try {
      const uri = await AudioRepository.sentenceUri(sentenceId);
      if (uri) {
        return this._playUri(uri);
      }
    } catch { /* fall through */ }
    this._setState('idle');
    return this._speakLive(fallbackText);
  }

  /**
   * Speak any Japanese text directly (no pre-generated file lookup).
   * Uses Google Cloud TTS if key is set, otherwise expo-speech.
   */
  async speak(text: string): Promise<void> {
    await this.stop();
    return this._speakLive(text);
  }

  /** Stop current playback immediately. */
  async stop(): Promise<void> {
    if (this._sound) {
      await this._sound.stopAsync().catch(() => {});
      await this._sound.unloadAsync().catch(() => {});
      this._sound = null;
    }
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) Speech.stop();
    this._setState('idle');
  }

  // ── Internal playback ─────────────────────────────────────────────────────

  /** Play a file or HTTP URI with expo-av. */
  private async _playUri(uri: string): Promise<void> {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    this._setState('speaking');
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
      );
      this._sound = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          this._setState('idle');
          sound.unloadAsync().catch(() => {});
          if (this._sound === sound) this._sound = null;
        }
      });
    } catch (e) {
      console.warn('[TtsService] Failed to play pre-generated audio:', e);
      this._setState('idle');
    }
  }

  /** Live TTS: Google Cloud → system fallback. */
  private async _speakLive(text: string): Promise<void> {
    if (GOOGLE_TTS_KEY) return this._speakCloud(text);
    return this._speakSystem(text);
  }

  private async _speakSystem(text: string): Promise<void> {
    this._setState('speaking');
    return new Promise<void>(resolve => {
      Speech.speak(text, {
        language: 'ja-JP',
        rate:      SPEAKING_RATE,
        onDone:    () => { this._setState('idle'); resolve(); },
        onError:   () => { this._setState('idle'); resolve(); },
        onStopped: () => { this._setState('idle'); resolve(); },
      });
    });
  }

  private async _speakCloud(text: string): Promise<void> {
    this._setState('loading');
    try {
      let audioBase64 = this._cloudCache.get(text);
      if (!audioBase64) {
        const res = await fetch(`${GOOGLE_TTS_URL}?key=${GOOGLE_TTS_KEY}`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input:       { text },
            voice:       { languageCode: 'ja-JP', name: VOICE_NAME },
            audioConfig: { audioEncoding: 'MP3', speakingRate: SPEAKING_RATE },
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json() as { audioContent?: string };
        if (!json.audioContent) throw new Error('Empty audioContent');
        audioBase64 = json.audioContent;
        this._cloudCache.set(text, audioBase64);
      }

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      this._setState('speaking');

      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${audioBase64}` },
        { shouldPlay: true },
      );
      this._sound = sound;
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          this._setState('idle');
          sound.unloadAsync().catch(() => {});
          if (this._sound === sound) this._sound = null;
        }
      });
    } catch (e) {
      console.warn('[TtsService] Cloud TTS failed — falling back to system:', e);
      this._setState('idle');
      return this._speakSystem(text);
    }
  }
}

export const TtsService = new _TtsService();
