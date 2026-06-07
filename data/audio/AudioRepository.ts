/**
 * AudioRepository — resolves a word/sentence ID to a playable audio URI.
 *
 * Priority:
 *   1. Local cache  (FileSystem.documentDirectory/audio/ — production pack)
 *   2. Dev server   (AUDIO_DEV_URL — localhost:8080 served by main.py serve-audio)
 *   3. null         → caller falls back to live TTS
 *
 * Usage:
 *   const uri = await AudioRepository.wordUri('n5_001');
 *   if (uri) { play(uri); } else { tts('食べる'); }
 */

import * as FileSystem from 'expo-file-system';
import { AUDIO_DEV_URL, AUDIO_PATHS } from '../../constants/audio';

const LOCAL_AUDIO_DIR = `${(FileSystem as any).documentDirectory ?? ''}audio`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Check if a local file exists (FileSystem.documentDirectory). */
async function localExists(path: string): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(path);
    return info.exists;
  } catch {
    return false;
  }
}

/** Check if a URL is reachable with a quick HEAD request. */
async function devServerReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Cache ────────────────────────────────────────────────────────────────────

// Remember whether dev server is up (checked once per session)
let _devServerAvailable: boolean | null = null;
let _devServerCheckedAt = 0;
const DEV_SERVER_CACHE_MS = 10_000; // recheck every 10s

async function isDevServerUp(): Promise<boolean> {
  if (!AUDIO_DEV_URL) return false;

  const now = Date.now();
  if (_devServerAvailable !== null && now - _devServerCheckedAt < DEV_SERVER_CACHE_MS) {
    return _devServerAvailable;
  }

  _devServerAvailable = await devServerReachable(AUDIO_DEV_URL);
  _devServerCheckedAt = now;
  return _devServerAvailable;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const AudioRepository = {
  /**
   * Resolve a word ID to a playable URI.
   * Returns null if no pre-generated file is found.
   */
  async wordUri(id: string): Promise<string | null> {
    const subPath = AUDIO_PATHS.word(id);

    // 1. Local filesystem (production: extracted from pack)
    const localPath = `${LOCAL_AUDIO_DIR}${subPath}`;
    if (await localExists(localPath)) return localPath;

    // 2. Dev server
    if (await isDevServerUp()) {
      return `${AUDIO_DEV_URL}${subPath}`;
    }

    return null;
  },

  /**
   * Resolve a sentence ID to a playable URI.
   * Returns null if no pre-generated file is found.
   */
  async sentenceUri(id: string): Promise<string | null> {
    const subPath = AUDIO_PATHS.sentence(id);

    const localPath = `${LOCAL_AUDIO_DIR}${subPath}`;
    if (await localExists(localPath)) return localPath;

    if (await isDevServerUp()) {
      return `${AUDIO_DEV_URL}${subPath}`;
    }

    return null;
  },

  /** Force re-check of dev server status on next call. */
  resetDevServerCache(): void {
    _devServerAvailable = null;
  },
};
