# Fudami Deployment Guide

This document outlines the professional deployment workflows for Web, iOS, and Android versions of Fudami.

---

## 1. Web Deployment (Recommended: Cloudflare Pages)

While GitHub Pages is a viable free option, **Cloudflare Pages** is the recommended "better way" for Fudami. It offers superior synergy with our Cloudflare Workers backend and handles Single Page Application (SPA) routing loops natively without complex hacks.

### Why Cloudflare Pages?
- **Synergy**: Use the same dashboard/CLI (Wrangler) as your `fudami-cloud` backend.
- **SPA Native**: Handles internal routing via a simple `_redirects` file.
- **Preview Deployments**: Automatic staging URLs for every branch/PR.
- **Global CDN**: Faster loading times globally.

### Setup Steps
1.  **Create Project**: Go to the Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git.
2.  **Build Settings**:
    - **Framework Preset**: None (or React if prompted).
    - **Build Command**: `npx expo export --platform web` (ensure `fudami-front` is the root).
    - **Output Directory**: `dist`.
3.  **Environment Variables**: Add `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the Cloudflare dashboard.
4.  **Fix SPA Routing**: To prevent the 404 infinite loop mentioned in our docs, create a file at `fudami-front/public/_redirects` (or ensure it's copied to `dist`) with this content:
    ```text
    /* /index.html 200
    ```
    This tells Cloudflare to serve `index.html` for any path, allowing Expo Router to handle the URL on the client side.

---

## 2. iOS Deployment (EAS)

iOS deployment requires an **Apple Developer Program** membership and a macOS machine (or use Expo's cloud builders).

### Workflow: EAS Build & Submit
Expo Application Services (EAS) is the standard way to build and submit Expo apps.

1.  **Install EAS CLI**:
    ```bash
    npm install -g eas-cli
    ```
2.  **Configure Project**:
    ```bash
    eas build:configure
    ```
3.  **Run Production Build**:
    ```bash
    eas build --platform ios --profile production
    ```
    *This will generate a `.ipa` file in the Expo cloud.*
4.  **Submit to App Store**:
    ```bash
    eas submit --platform ios
    ```
    *This uploads your build to TestFlight for internal testing or final App Store Review.*

### Key iOS Specifics:
- **Bundle Identifier**: Ensure `com.snonow.fudami` is registered in your Apple Developer portal.
- **Provisioning**: EAS handles automatic provisioning (creating certificates and profiles) for you.

---

## 3. Android Deployment (EAS)

Android deployment requires a **Google Play Console** account (one-time $25 fee).

### Workflow: EAS Build & Submit
1.  **Run Production Build**:
    ```bash
    eas build --platform android --profile production
    ```
    *This generates an `.aab` (Android App Bundle), which is the optimized format for Google Play.*
2.  **Submit to Play Store**:
    ```bash
    eas submit --platform android
    ```

### For Direct APK Distribution:
If you want to send a test file directly to someone without using the Play Store:
1.  Create a `preview` profile in `eas.json` with `"buildType": "apk"`.
2.  Run:
    ```bash
    eas build --platform android --profile preview
    ```

---

## 4. Over-the-Air (OTA) Updates

Fudami supports OTA updates using **EAS Update**. This allows you to push bug fixes and UI changes directly to users without them having to download a new version from the App Store or Play Store.

### Setup:
1.  **Install the library**: `npx expo install expo-updates`.
2.  **Publish an Update**:
    ```bash
    eas update --branch production --message "Fixing redirect loop"
    ```
    *The app will automatically check for and download this update the next time it starts.*

---

## Summary Table

| Platform | Recommended Host | Tooling | Auth Requirement |
| --- | --- | --- | --- |
| **Web** | Cloudflare Pages | `npx expo export` | None (Public) |
| **iOS** | Apple App Store | EAS Build/Submit | Apple Developer ($99/yr) |
| **Android** | Google Play Store | EAS Build/Submit | Google Play Console ($25) |
