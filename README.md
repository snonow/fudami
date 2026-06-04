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

## Deployment

This project includes a GitHub Actions workflow for automated web deployment to a custom LXC host via Tailscale.

### TODO / Improvements
- [ ] **Migrate Tailscale Auth:** Replace the legacy `TAILSCALE_AUTHKEY` with an **OAuth client**. Tailscale now recommends OAuth clients for long-lived CI/CD integrations as they are more secure and easier to manage.
  - See: [Tailscale OAuth Clients Documentation](https://tailscale.com/s/oauth-clients)

### Automated Workflow

The workflow in `.github/workflows/deploy.yml` triggers on every push to the `main` branch. It:
1. Builds the web application using `npx expo export -p web`.
2. Connects to your private network via **Tailscale**.
3. Deploys the generated files to your LXC container using **SCP**.

### Required GitHub Secrets

To enable the deployment, you must add the following secrets to your GitHub repository:

| Secret | Description |
| --- | --- |
| `TAILSCALE_AUTHKEY` | A reusable auth key from your [Tailscale Admin Console](https://login.tailscale.com/admin/settings/keys). |
| `LXC_IP` | The Tailscale IP address of your destination LXC container (e.g., `100.x.x.x`). |
| `SSH_PRIVATE_KEY` | The **private** part of an SSH key pair authorized to access your LXC. |

### Generating the SSH Key

For security, you should generate a dedicated SSH key pair for this deployment:

1. **Generate the pair on your local machine:**
   ```bash
   ssh-keygen -t ed25519 -f ./fudami_deploy_key
   ```
2. **Add the public key to your LXC:**
   Copy the contents of `./fudami_deploy_key.pub` and append it to the `/root/.ssh/authorized_keys` file on your LXC container.
3. **Add the private key to GitHub:**
   Copy the contents of `./fudami_deploy_key` and paste it as the value for the `SSH_PRIVATE_KEY` secret in your GitHub repository settings.

## Contributing

When adding new UI components, please refer to `constants/Colors.ts` to maintain the existing dark theme aesthetic. All new state logic should be accompanied by a corresponding unit test in the `__tests__/store/` directory.
