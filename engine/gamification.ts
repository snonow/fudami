export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7000, 10000];

const XP_TABLE = { again: 0, hard: 5, good: 10, easy: 15 } as const;

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  // Beyond threshold 10: +3000 per level
  if (xp >= LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]) {
    const extra = xp - LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    level = LEVEL_THRESHOLDS.length + Math.floor(extra / 3000);
  }
  return level;
}

export function getXPForRating(rating: 'again' | 'hard' | 'good' | 'easy', streakDays: number): number {
  const base = XP_TABLE[rating];
  const bonus = streakDays >= 7 ? 1.2 : 1.0;
  return Math.round(base * bonus);
}

export function getXPForNextLevel(currentXP: number): { current: number; next: number; level: number } {
  const level = getLevelFromXP(currentXP);
  const idx = level - 1;
  const current = LEVEL_THRESHOLDS[idx] ?? (10000 + (level - LEVEL_THRESHOLDS.length) * 3000);
  const next = LEVEL_THRESHOLDS[idx + 1] ?? (current + 3000);
  return { current, next, level };
}
