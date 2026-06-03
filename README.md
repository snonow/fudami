# fudami (ふだみ)

fudami is a modern, cross-platform language learning application built with React Native and Expo. It leverages the FSRS (Free Spaced Repetition Scheduler) algorithm to optimize memory retention, currently focusing on Japanese vocabulary.

## Features

- **Cross-Platform:** Runs on iOS, Android, and the Web using Expo Router.
- **Smart Reviews:** Uses `ts-fsrs` for advanced spaced repetition scheduling.
- **Interactive UI:** Smooth 3D flashcard flip animations and a clean, dark-themed dashboard.
- **Progress Tracking:** Gamified elements including XP, streaks, and daily goals.

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

## Contributing

When adding new UI components, please refer to `constants/Colors.ts` to maintain the existing dark theme aesthetic. All new state logic should be accompanied by a corresponding unit test in the `__tests__/store/` directory.
