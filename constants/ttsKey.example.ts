/**
 * SETUP INSTRUCTIONS — Google Cloud TTS
 * ──────────────────────────────────────
 * 1. Copy this file to  constants/ttsKey.ts  (gitignored).
 * 2. Create a Google Cloud project, enable the "Cloud Text-to-Speech API".
 * 3. Create an API key (restrict it to Text-to-Speech API only).
 * 4. Paste the key below.
 *
 * Free tier: 1 million characters / month (Neural2 / Chirp voices).
 * At ~6 chars/word average, that's ~160 000 Japanese words — far more than needed.
 *
 * Without a key, the app falls back to the device system TTS (expo-speech).
 * System TTS works fine on iOS (Kyoko/Otoya voices) but is mediocre on Android.
 *
 * NEVER commit constants/ttsKey.ts to git.
 */
export const GOOGLE_TTS_KEY: string | null = null;
