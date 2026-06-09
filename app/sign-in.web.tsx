import React from 'react';
import { Image } from 'react-native';
import { Redirect } from 'expo-router';
import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import { SignInWithOAuth } from '../components/auth/SignInWithOAuth';

const MASCOT_HAPPY = Image.resolveAssetSource(
  require('../assets/daruma-no-bg/daruma-happy-no-bg.png')
).uri;

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-washi-paper via-surface to-aizome-indigo-light/20 relative overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Subtle background glow */}
      <div className="absolute inset-0 opacity-50" style={{ background: 'radial-gradient(ellipse at top right, #FCEAE9 0%, transparent 55%)' }}></div>

      {/* Card */}
      <div className="relative z-10 glass-panel rounded-[2.5rem] p-10 w-full max-w-sm mx-5 text-center" style={{ boxShadow: '0 24px 48px rgba(0,0,0,0.06)' }}>
        {/* Logo */}
        <a href="/" className="flex items-center justify-center gap-2 mb-8 text-hanko-red text-2xl font-bold no-underline">
          <span className="material-symbols-outlined">water_drop</span>
          fudami
        </a>

        {/* Mascot */}
        <img
          src={MASCOT_HAPPY}
          alt="fudami mascot"
          className="w-32 h-32 object-contain mx-auto mb-6"
        />

        <h1 className="text-2xl font-semibold text-sumi-ink mb-2">Welcome back</h1>
        <p className="text-base text-sumi-ink-muted mb-8 leading-6">Sign in to continue your Japanese journey.</p>

        {/* Clerk sign-in */}
        <SignedIn>
          {/* Auto-redirect if already signed in */}
          <Redirect href="/(tabs)" />
        </SignedIn>
        <SignedOut>
          <SignInWithOAuth />
        </SignedOut>

        {/* Back link */}
        <a
          href="/"
          className="mt-6 inline-flex items-center gap-1 text-[12px] font-bold uppercase tracking-[0.1em] text-sumi-ink-muted hover:text-hanko-red transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Back to home
        </a>
      </div>
    </div>
  );
}
