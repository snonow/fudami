# Fudami Frontend — Developer Documentation

This document provides a detailed overview of the frontend architecture and key internal modules.

## Architectural Principles

- **Content vs. State Separation**: All Japanese content (vocab, grammar, sentences) is stored in a read-only `content.db` (Content Pack). All user-specific progress (FSRS state, XP, reviews) is stored in `fudami.db` (User DB).
- **Offline-First**: The app is designed to work fully offline. Content packs are downloaded and installed locally.
- **Resource Management**: Large binary data (databases, Anki decks) is handled using chunked processing to prevent memory spikes on mobile and web.

## Key Modules

### 1. `PackLoader` (`data/content/PackLoader.ts`)
Handles the lifecycle of encrypted content packs:
- **Download**: Fetches `.pack` (binary) and `-manifest.json` (metadata).
- **Decryption**: Uses Web Crypto API (AES-256-GCM).
- **Installation**: Decompresses (zlib) and writes the SQLite database to the app's internal storage.
- **Memory Safety**: Uses chunked base64 conversion for large file writes.

### 2. `TtsService` (`data/audio/TtsService.ts`)
A multi-backend text-to-speech engine with priority fallback:
1. **Pregenerated**: High-quality VOICEVOX audio files extracted from content packs.
2. **Cloud**: Google Cloud TTS (Chirp 3 HD) for high-quality live generation.
3. **System**: Native `expo-speech` for basic offline fallback.

### 3. `DarumaMascot` (`components/ui/DarumaMascot.tsx`)
A 3D interactive mascot built with `@react-three/fiber`:
- **Optimization**: Wrapped in `React.memo` and uses memoized materials to prevent WebGL context leaks and high CPU/RAM usage during animations.
- **Interaction**: Features random blinking and subtle float animations.

### 4. `AnkiImporter` (`engine/AnkiImporter.ts`)
Allows users to import their own `.apkg` decks:
- **Extraction**: Unzips the package and processes the Anki SQLite collection.
- **Mapping**: Maps Anki scheduling state to the FSRS model.
- **Media**: Extracts and relocates images and audio to the app's local media folder.

## Deployment

### GitHub Pages (Web Showroom)

The app is deployed to GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy-pages.yml`).

**Mandatory GitHub Secrets:**
For the production build to work, you MUST configure the following Secrets in your GitHub Repository settings:
1.  **`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`**: Your Clerk production publishable key.
2.  **`FUDAMI_PACK_KEY`**: The AES-256 hex key used to decrypt the content packs.

**Authentication Setup:**
- In the **Clerk Dashboard**, ensure you have added your production URL (e.g., `https://snonow.github.io/fudami-front/`) to the **Allowed Redirect URLs** and **Allowed Origins**.
- The `SignInWithOAuth` component uses `expo-linking` to generate redirect URLs, which are compatible with both mobile schemes and web domains.

## Performance & Memory

- **Binary Blobs**: Always use `chunked` conversion when moving data between JS and Native layers via `base64`.
- **3D Rendering**: Limit `Canvas` re-renders. Avoid re-creating `Geometry`, `Material`, or `Texture` objects within the render loop.

## Browser Limitations

- **Private / Incognito Mode**: On the web, `expo-sqlite` relies on IndexedDB via a web worker. Many browsers (like Safari and Firefox) restrict IndexedDB access in Private mode. The app includes a specialized error handler in `RootLayout` to notify users to switch to a standard window if initialization fails due to storage restrictions.
