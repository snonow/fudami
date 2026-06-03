# CLAUDE.md — Manabi (学び)

> Working title. Japanese for "learning". Mobile SRS app that fixes Anki's motivation problem without losing its SRS depth.

---

## What is this?

A mobile Japanese spaced repetition app for iOS (React Native + Expo).

**The gap:** Anki = great algo, terrible UX. Duolingo = great UX, no real SRS. This lives between the two.

**Core insight:** Anki's problem isn't the algorithm — it's that it shows you debt (353 cards remaining) instead of progress. And every card interaction is identical. This app fixes both.

---

## Target user

Japanese learners (N5 → N3) who want serious SRS but feel crushed by Anki's card pile. Commuter-friendly sessions (15–20 min).

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React Native + Expo (TypeScript) | Cross-platform, best AI codegen support, Expo handles native complexity |
| SRS algo | ts-fsrs | Open source FSRS v5 implementation in npm |
| Local DB | expo-sqlite | No backend, fully offline, self-contained |
| Navigation | expo-router | File-based, standard for Expo |
| State | Zustand | Simple, minimal boilerplate |
| Animations | react-native-reanimated | Needed for flip cards and XP animations |

**Platform:** iOS first (iPhone). No backend. No account. Works offline.

---

## Architecture

```
┌─────────────────────────────────────────┐
│  UI · React Native + Expo               │
│  Accueil │ Révision │ Stats │ Réglages  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Moteur                                 │
│  FSRS Engine │ Session │ Gamification   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Données · SQLite local                 │
│  Cartes │ Progression │ JMdict bundlé   │
└─────────────────────────────────────────┘
```

All local. No network calls. No auth.

---

## MVP Scope — v1 (1 month target)

### ✅ In
- Built-in Japanese vocab deck (JMdict subset, CC BY — ok commercially)
- N5 + N4 + N3 levels, ~3000 words to start
- 3 review modes: Flip card / MCQ 4 choices / Kana typing
- FSRS scheduling (ts-fsrs)
- XP per review + daily streak
- Level system with visible progress bar
- Home: session goal (cards or time) — **never show raw card count**
- Stats: learned cards over time, streak, XP history

### ❌ Out (v2+)
- Anki .apkg import
- Audio / pitch accent
- Mini-games
- Android
- Backend / cloud sync
- Kanji writing
- Grammar integration

---

## File Structure

```
manabi/
├── CLAUDE.md                    ← this file
├── app/
│   ├── _layout.tsx              ← root layout, navigation setup
│   ├── (tabs)/
│   │   ├── _layout.tsx          ← tab bar config
│   │   ├── index.tsx            ← Home screen (streak, XP, session start)
│   │   ├── stats.tsx            ← Progress charts, streak history
│   │   └── settings.tsx         ← Level filter, session goal
│   └── review.tsx               ← Full-screen review session (no tab bar)
├── components/
│   ├── cards/
│   │   ├── FlipCard.tsx         ← Classic front/back flip with animation
│   │   ├── MultipleChoice.tsx   ← 4-choice MCQ
│   │   └── TypingCard.tsx       ← Kana input answer
│   ├── gamification/
│   │   ├── XPBar.tsx            ← Animated XP progress bar
│   │   ├── StreakBadge.tsx      ← Streak day counter
│   │   └── LevelBadge.tsx       ← Current level display
│   └── ui/
│       └── SessionGoal.tsx      ← "20 cards" or "15 min" picker
├── db/
│   ├── schema.ts                ← CREATE TABLE statements
│   ├── seed.ts                  ← Load JMdict JSON into SQLite on first launch
│   ├── cards.ts                 ← Card queries (getDueCards, updateCard...)
│   └── progress.ts              ← XP, streak, session queries
├── engine/
│   ├── fsrs.ts                  ← ts-fsrs wrapper (schedule, rate)
│   ├── session.ts               ← Pick cards for session, handle mode rotation
│   └── gamification.ts          ← XP rules, level thresholds, streak logic
├── store/
│   └── useAppStore.ts           ← Zustand store (session state, user progress)
└── assets/
    └── jmdict/
        ├── vocab_n5.json        ← Pre-processed JMdict (N5 subset)
        ├── vocab_n4.json
        └── vocab_n3.json
```

---

## Database Schema

### `cards`
```sql
CREATE TABLE cards (
  id          TEXT PRIMARY KEY,   -- JMdict entry ID
  type        TEXT NOT NULL,      -- 'vocab' | 'kanji' | 'phrase'
  front_kanji TEXT NOT NULL,      -- e.g. "食べる"
  front_kana  TEXT NOT NULL,      -- e.g. "たべる"
  back        TEXT NOT NULL,      -- meaning in FR/EN
  level       TEXT NOT NULL,      -- 'n5' | 'n4' | 'n3'
  fsrs_state  TEXT,               -- JSON: ts-fsrs Card object
  due_date    TEXT,               -- ISO 8601
  created_at  TEXT NOT NULL       -- ISO 8601
);
```

### `reviews`
```sql
CREATE TABLE reviews (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id     TEXT NOT NULL REFERENCES cards(id),
  rating      INTEGER NOT NULL,   -- 1=Again 2=Hard 3=Good 4=Easy
  mode        TEXT NOT NULL,      -- 'flip' | 'mcq' | 'typing'
  xp_earned   INTEGER NOT NULL,
  reviewed_at TEXT NOT NULL       -- ISO 8601
);
```

### `user_progress`
```sql
CREATE TABLE user_progress (
  id               INTEGER PRIMARY KEY DEFAULT 1,
  xp_total         INTEGER NOT NULL DEFAULT 0,
  level            INTEGER NOT NULL DEFAULT 1,
  streak_days      INTEGER NOT NULL DEFAULT 0,
  streak_last_date TEXT,          -- ISO date (YYYY-MM-DD)
  total_reviews    INTEGER NOT NULL DEFAULT 0
);
```

---

## Gamification Rules

```
XP per card:   Again=0  Hard=5  Good=10  Easy=15
Streak bonus:  +20% XP if streak ≥ 7 days

Level thresholds (XP):
  1:    0      2:  100    3:   250    4:   500
  5:  1000     6: 2000    7:  3500    8:  5000
  9:  7000    10: 10000   (then +3000 per level)

Session goal (user picks one):
  - 20 cards
  - 15 minutes
  → Show progress toward goal, never raw remaining count
```

---

## Card Mode Rotation

Each review session rotates modes so the same card never feels identical:

```
Session start → shuffle due cards
For each card:
  → pick mode based on card history + randomness
  → flip (40%) | mcq (35%) | typing (25%)
  → never same mode twice in a row for same card
```

---

## Design Principles

1. **Never show card debt** — show what you've done, not what remains
2. **Vary every interaction** — same card, different mode
3. **Sessions are short** — 15–20 min, optimized for commute
4. **Fully offline** — no spinner, no auth, no backend
5. **FSRS is sacred** — trust the algorithm, don't override intervals

---

## Key Dependencies

```bash
npx expo install expo-sqlite expo-router react-native-reanimated
npm install ts-fsrs zustand
```

---

## Current Status

🟡 **Architecture defined. Not yet scaffolded.**

**Next steps:**
1. `npx create-expo-app manabi --template blank-typescript`
2. Set up SQLite schema (`db/schema.ts`)
3. Seed N5 JMdict data
4. Build FSRS engine wrapper
5. Build Home screen + Review screen

---

## Dev Environment

- macOS + iPhone
- Expo Go app on iPhone for live preview
- Run: `npx expo start` → scan QR with iPhone camera
