# Fudami Client App Deployment (fudami-front)

This document provides technical instructions for deploying the **Open Core** client application. For a high-level overview of the entire Fudami business infrastructure, see the **[Master Deployment Documentation](../DEPLOYMENT_MASTER.md)**.

---

## 🚀 Deployment Workflow: Preview First

To maintain a professional and stable production environment, Fudami follows a **Preview-then-Production** sequence.

### 1. Deploy to Preview (Staging)
All new features must be verified in the **Preview Environment**.
- **URL**: `https://dev.fudami.pages.dev`
- **Trigger**: Automatic push to `develop`.

### 2. Ship to Production (The Gateway)
Production is protected and **never** deploys automatically from Git pushes. It uses a **GitHub Action Gateway** to ensure only verified code is shipped.
- **URL**: `https://fudami.pages.dev`
- **Trigger**: Push/Merge into `main`.
- **Safety Gate**: The workflow automatically runs **tests** and **builds** the app. If any step fails, the production site is NOT updated.

---

## 1. Web Deployment: Cloudflare Pages

The web version of the app is hosted on **Cloudflare Pages**.

### Configuration:
- **Project Type**: Static Site
- **Build Command**: `npx expo export --platform web`
- **Output Directory**: `dist`
- **SPA Routing**: The `public/_redirects` file is automatically used to handle client-side routing.

### Environment Variables (Required in Cloudflare Dashboard):
- `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk Public Key.
- `FUDAMI_PACK_KEY`: (Injected via CI) AES-256 key for content packs.

---

## 2. Mobile Deployment (iOS & Android)

Mobile deployment assets and metadata are organized in the `deploy/` directory:
- **iOS**: See `deploy/ios/README.md` for App Store Connect requirements.
- **Android**: See `deploy/android/README.md` for Google Play Console requirements.

### Workflow Summary:
1.  **Build**: `eas build --platform all` (Runs in the cloud).
2.  **Verify**: Test the generated builds via the Expo Dashboard.
3.  **Submit**: `eas submit --platform all` (Sends to Apple/Google).

---

## 3. Management Platform: Expo & EAS

For unified management of all deployment sources, we use the **[Expo Dashboard](https://expo.dev/dashboard)**.

### Features:
- **Build History**: Track every iOS and Android build.
- **EAS Submit**: Monitor the status of App Store and Play Store submissions.
- **EAS Update**: Manage over-the-air (OTA) deployments to all devices simultaneously.
- **Orbit**: A macOS/Windows menu bar app to quickly install and launch builds on simulators or physical devices.

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
