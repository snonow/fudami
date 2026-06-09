# iOS Deployment Assets & Metadata

This folder contains assets and documentation required specifically for the **Apple App Store**.

## Store Listing Checklist
- [ ] **App Name**: Fudami (ふだみ)
- [ ] **Subtitle**: Immersive Japanese Mastery
- [ ] **Keywords**: japanese, language, learning, kanji, srs, fsrs, anki
- [ ] **Support URL**: https://github.com/snonow/fudami-front (Public Demo)
- [ ] **Marketing URL**: https://github.com/snonow/fudami-front

## Visual Assets (Standard Sizes)
- **App Icon**: 1024x1024px (PNG, no transparency)
- **Screenshots**: 
  - 6.5" iPhone (1242x2688px)
  - 5.5" iPhone (1242x2208px)
  - 12.9" iPad (2048x2732px)

## Deployment Note
Use `eas build --platform ios` to generate the production `.ipa`.
Check `fudami-front/app.json` for the `bundleIdentifier` (`com.snonow.fudami`).
