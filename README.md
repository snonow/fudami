# fudami (ふだみ)

fudami is a modern, cross-platform language learning application built with React Native and Expo. It leverages the FSRS (Free Spaced Repetition Scheduler) algorithm to optimize memory retention, currently focusing on Japanese vocabulary.

## Architecture & Open Core

This repository contains the **Open Core** client for the Fudami platform. It is a specialized Japanese learning "Player" designed to be highly interactive and offline-first.

**Important Note:** To protect business intellectual property, this client does not bundle proprietary language content. It is designed to fetch encrypted content packs from the Fudami backend.

For a complete overview of the Fudami business infrastructure and how to deploy this client, please refer to the:
👉 **[Fudami Master Deployment & Architecture Documentation](../DEPLOYMENT_MASTER.md)**

## Features
- **Cross-Platform:** Runs on iOS, Android, and Web (Cloudflare Pages).
- **3D Interactive Learning:** Immersive flashcards with Daruma mascot feedback.
- **FSRS-Powered:** Advanced memory retention logic (open implementation).

## Tech Stack

- **Framework:** [Expo](https://expo.dev/) (React Native)
- **Routing:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Spaced Repetition:** [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
- **Testing:** Jest & React Native Testing Library

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v18+) installed.

### Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open the app:
   - Press `i` to open in iOS Simulator.
   - Press `a` to open in Android Emulator.
   - Press `w` to open in your web browser.
   - Or scan the QR code with the **Expo Go** app on your physical device.

## Project Structure

- `/app`: Contains the Expo Router file-based navigation (screens like `index`, `review`, `profile`).
- `/components`: Reusable UI elements (`Button`, `StatCard`, `Flashcard`, `ProgressBar`).
- `/constants`: Global constants like the `Colors` palette.
- `/store`: Zustand state management logic (`useAppStore.ts`).
- `/__tests__`: Jest test suites.

## Testing

This project uses Jest and React Native Testing Library.

To run the test suite once:
```bash
npm test
```

To run tests in watch mode (useful during active development):
```bash
npm run test:watch
```

## Deployment

Detailed instructions for deploying Fudami to **Web**, **iOS**, and **Android** are available in the [Deployment Guide](./DEPLOYMENT.md).

### Quick Links
- [Developer Documentation](./DOCS_DEVELOPER.md)
- [SRS Algorithm Specs](../DOCS_SRS.md)
- [Platform Roadmap](../PLATFORM.md)

## Contributing

When adding new UI components, please refer to `constants/Colors.ts` to maintain the existing dark theme aesthetic. All new state logic should be accompanied by a corresponding unit test in the `__tests__/store/` directory.
