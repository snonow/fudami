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
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { AudioRepository } from './AudioRepository';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TtsState = 'idle' | 'loading' | 'speaking';
type Listener = (state: TtsState) => void;

// ─── Constants ───────────────────────────────────────────────────────────────

const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const VOICE_NAME     = 'ja-JP-Chirp3-HD-Aoede';
const SPEAKING_RATE  = 0.85;

// Use environment variable for the Google TTS Key with a safe fallback
const GOOGLE_TTS_KEY = process.env.EXPO_PUBLIC_GOOGLE_TTS_KEY || null;

// ─── Service ──────────────────────────────────────────────────────────────────

class _TtsService {
  private _state: TtsState = 'idle';
  private _listeners = new Set<Listener>();

  /** In-memory cache for Google Cloud TTS responses (text → base64 MP3). */
  private _cloudCache = new Map<string, string>();

  /** Currently playing expo-audio Player. */
  private _player: AudioPlayer | null = null;

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
    return GOOGLE_TTS_KEY ? 'cloud' : 'system';
  }

  get cacheSize(): number { return this._cloudCache.size; }

  // ── Public API ────────────────────────────────────────────────────────────

  async speakWord(wordId: string, fallbackText: string): Promise<void> {
    await this.stop();
    this._setState('loading');
    try {
      const uri = await AudioRepository.wordUri(wordId);
      if (uri) {
        return this._playUri(uri);
      }
    } catch { /* fall through */ }
    this._setState('idle');
    return this._speakLive(fallbackText);
  }

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

  async speak(text: string): Promise<void> {
    await this.stop();
    return this._speakLive(text);
  }

  async stop(): Promise<void> {
    if (this._player) {
      this._player.pause();
      this._player.release();
      this._player = null;
    }
    const speaking = await Speech.isSpeakingAsync().catch(() => false);
    if (speaking) Speech.stop();
    this._setState('idle');
  }

  // ── Internal playback ─────────────────────────────────────────────────────

  private async _playUri(uri: string): Promise<void> {
    this._setState('speaking');
    try {
      const player = createAudioPlayer(uri);
      this._player = player;
      
      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          this._setState('idle');
          player.release();
          if (this._player === player) this._player = null;
        }
      });

      player.play();
    } catch (e) {
      console.warn('[TtsService] Failed to play pre-generated audio:', e);
      this._setState('idle');
    }
  }

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

      this._setState('speaking');
      const uri = `data:audio/mp3;base64,${audioBase64}`;
      const player = createAudioPlayer(uri);
      this._player = player;

      player.addListener('playbackStatusUpdate', (status) => {
        if (status.didJustFinish) {
          this._setState('idle');
          player.release();
          if (this._player === player) this._player = null;
        }
      });

      player.play();
    } catch (e) {
      console.warn('[TtsService] Cloud TTS failed — falling back to system:', e);
      this._setState('idle');
      return this._speakSystem(text);
    }
  }
}

export const TtsService = new _TtsService();
