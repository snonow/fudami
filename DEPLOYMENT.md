# Fudami Deployment Guide

This document outlines the professional deployment workflows for Web, iOS, and Android versions of Fudami.

---

## 1. Web Deployment: Cloudflare Pages (Primary)

**Cloudflare Pages** is our chosen platform for hosting the Fudami Web App. It is **free** (unlimited bandwidth, 500 builds/month) and serves as a public demonstration of the Fudami interface and core logic.

### Why Cloudflare Pages?
- **Synergy**: Managed via the same dashboard as `fudami-cloud`.
- **SPA Native**: Uses `public/_redirects` to handle client-side routing.
- **Security**: Environment variables (secrets) are managed in the Cloudflare Dashboard, never in the source code.

### Deployment Source
- **Repository**: `fudami-front` (Main branch).
- **Build Command**: `npx expo export --platform web`
- **Output Directory**: `dist`
- **SPA Routing Fix**: The `public/_redirects` file automatically serves `index.html` for all paths, preventing infinite loops.

---

## 2. Management Platform: Expo & EAS

For unified management of all deployment sources, we use the **[Expo Dashboard](https://expo.dev/dashboard)**.

### Features:
- **Build History**: Track every iOS and Android build.
- **EAS Submit**: Monitor the status of App Store and Play Store submissions.
- **EAS Update**: Manage over-the-air (OTA) deployments to all devices simultaneously.
- **Orbit**: A macOS/Windows menu bar app to quickly install and launch builds on simulators or physical devices.

---

## 3. Mobile Deployment (iOS & Android)

Mobile deployment assets and metadata are organized in the `deploy/` directory:
- **iOS**: See `deploy/ios/README.md` for App Store Connect requirements.
- **Android**: See `deploy/android/README.md` for Google Play Console requirements.

### Workflow Summary:
1.  **Build**: `eas build --platform all` (Runs in the cloud).
2.  **Verify**: Test the generated builds via the Expo Dashboard.
3.  **Submit**: `eas submit --platform all` (Sends to Apple/Google).

---

## 4. Security & Open-Source Philosophy

The `fudami-front` repository is an **Open-Source Demo**. It showcases the UI, the 3D mascot, and the SRS engine.

### Critical Security Rules:
1.  **Zero Secrets in VCS**: Never commit real keys. `constants/packKey.ts` and `.env.local` are strictly gitignored.
2.  **Demo Mode**: When deploying to the web, the app should be configured to use a "Public Demo" content pack.
3.  **Credential Management**: Real business secrets (API keys for voice services, production DB credentials) live exclusively in **GitHub Secrets**, **Cloudflare Environment Variables**, or **EAS Secrets**.

---

## Summary Table

| Platform | Host / Manager | Tooling | Cost |
| --- | --- | --- | --- |
| **Web** | Cloudflare Pages | `npx expo export` | **Free Tier** |
| **iOS** | Apple App Store | EAS Build/Submit | $99/year |
| **Android** | Google Play Store | EAS Build/Submit | $25 (Once) |
| **Unified** | **Expo Dashboard** | EAS CLI | Free/Usage based |
