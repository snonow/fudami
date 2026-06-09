# Android Deployment Assets & Metadata

This folder contains assets and documentation required specifically for the **Google Play Store**.

## Store Listing Checklist
- [ ] **App Name**: Fudami (ふだみ)
- [ ] **Short Description**: Modern Japanese Spaced Repetition Learning.
- [ ] **Full Description**: (See content in `AGENTS.md` and `PLATFORM.md`)
- [ ] **Category**: Education

## Visual Assets (Standard Sizes)
- **App Icon**: 512x512px (PNG, up to 1MB)
- **Feature Graphic**: 1024x500px (PNG or JPEG)
- **Phone Screenshots**: Min. 2, Max. 8.

## Deployment Note
Use `eas build --platform android` to generate the production `.aab`.
Check `fudami-front/app.json` for the `package` name (`com.snonow.fudami`).
The `android.adaptiveIcon` settings are already configured for a professional look.
