// Runs before babel transforms test files. babel-preset-expo inlines
// EXPO_PUBLIC_* env vars at transform time, so they must be set here
// (not inside the test file) to take effect.
process.env.EXPO_PUBLIC_GOOGLE_TTS_KEY = 'mock-key';
