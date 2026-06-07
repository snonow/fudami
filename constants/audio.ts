/**
 * Audio constants — pre-generated TTS file locations.
 *
 * Dev workflow:
 *   1. Generate audio:  uv run python main.py audio --seed
 *   2. Start server:    uv run python main.py serve-audio
 *   3. Set AUDIO_DEV_URL to point to that server (already done below).
 *   4. npx expo start
 *
 * The app will fetch pre-generated .wav files from the local server
 * and fall back to live TTS (expo-speech / Google Cloud) if not found.
 *
 * Production: set AUDIO_DEV_URL to null — audio is extracted from the
 * content pack and read from FileSystem.documentDirectory.
 */

/** Base URL of the local audio dev server (python main.py serve-audio). */
export const AUDIO_DEV_URL: string | null = __DEV__
  ? 'http://localhost:8080'
  : null;

/** Sub-paths within the audio server / local filesystem. */
export const AUDIO_PATHS = {
  word:     (id: string) => `/words/${id}.wav`,
  sentence: (id: string) => `/sentences/${id}.wav`,
} as const;
