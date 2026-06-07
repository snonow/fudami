# Fudami Universal Architecture Strategy

This document outlines how Fudami is designed to work across **Web**, **iOS**, and **Android** using a single, unified codebase and backend.

## 1. The Unified Core (Expo & React Native)
We use **Expo** as our primary framework. This allows us to write code once in TypeScript and deploy it to three platforms:
- **Web:** Compiles to standard HTML/JS/CSS (hosted on GitHub Pages).
- **iOS/Android:** Compiles to native binary code (using the Expo SDK).

## 2. Universal Communication Layer
The app communicates with the Cloudflare backend using a platform-agnostic pattern:

### A. Authentication (Clerk)
- **Web:** Uses browser-native session handling.
- **Mobile:** Uses `expo-secure-store` to persist the JWT token in the phone's hardware-encrypted storage.
- **Backend:** The Cloudflare Worker verifies the token using RSA public keys (JWKS), regardless of which device sent it.

### B. Data Persistence (Local-First)
- **SQLite (Universal):** We use `expo-sqlite`. 
    - On **Web**, it utilizes a high-performance WASM (WebAssembly) build of SQLite.
    - On **Mobile**, it uses the native SQLite engine built into the OS.
- **The Sync Bridge:** Both platforms use the same `backgroundSync` logic in the Zustand store (`useAppStore.ts`). It detects changes in the local DB and pushes them to the Cloudflare D1 database.

### C. Media & Assets
- **Audio:** We transitioned to `expo-audio`. This ensures that Japanese pronunciations work identically in a web browser and on a mobile device.
- **Content Packs:** Encrypted `.pack` files are downloaded from Cloudflare R2. The decryption logic (AES-256-GCM) uses the **Web Crypto API**, which is natively supported and hardware-accelerated on both modern browsers and mobile chips.

## 3. Future-Proofing for Native Launch
- **Deep Linking:** Configured via `app.json` (`scheme: "fudami"`). This enables the mobile app to handle login redirects and custom URL triggers (e.g., clicking a link in an email to open a specific deck).
- **Responsive UI:** The layout uses Flexbox and `useWindowDimensions` to ensure the interface looks great on a 27-inch monitor and a 6-inch phone screen.

## 4. Current Status
- [x] Universal Auth (Clerk)
- [x] Universal Database (SQLite + WASM)
- [x] Universal Sync (Cloudflare D1)
- [x] Universal Media (Expo Audio)
- [ ] Native Mobile Build (EAS) — *Planned for Phase 4*
