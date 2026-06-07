# Clerk Authentication for Fudami

## Overview
Fudami uses **Clerk** for user management and authentication. Clerk provides a secure, lightweight, and scalable solution for handling user identities across mobile and web.

## Setup & Implementation

### 1. SDK
We use `@clerk/clerk-expo` which is optimized for React Native and Expo.

### 2. Session Persistence
To ensure users stay logged in between app restarts, we use `expo-secure-store` as the token cache.
- **Implementation:** `fudami-front/hooks/useTokenCache.ts`

### 3. Global Provider
The `ClerkProvider` is wrapped around the root layout in `fudami-front/app/_layout.tsx`. It uses the `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` from the environment.

### 4. Authentication Flow
- **Landing Page:** `app/index.tsx` uses `<SignedIn>` and `<SignedOut>` components to toggle UI.
- **OAuth:** Google Sign-In is implemented in `components/SignInWithOAuth.tsx` using `useOAuth`.

## Multi-Environment Strategy (Dev vs. Prod)

Clerk provides separate instances for Development and Production.

### Development (Current)
- Uses the `test` publishable key.
- Tokens and users are separate from production.
- Configured via `.env.local` (pulled using `clerk env pull`).

### Production
- Requires a separate `pk_live_...` key.
- Must be configured in the Clerk Dashboard.
- When deploying to production, ensure `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` is set to the live key in your CI/CD environment (GitHub Actions).

## Key Commands

- **Pull Environment Variables:** `clerk env pull`
- **Check Diagnostics:** `clerk doctor`
- **Login to CLI:** `clerk auth login`
