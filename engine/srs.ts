import { FSRS, Card as FSRSCard, Rating, createEmptyCard, generatorParameters, State } from 'ts-fsrs';
import { Card, PathLevel } from '../types';

const params = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 36500,
  w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61]
});
const fsrs = new FSRS(params);

// --- Core SRS Functions ---
export const createNewCard = () => createEmptyCard(new Date());
export const serializeCard = (c: FSRSCard) => JSON.stringify(c);
export const deserializeCard = (json: string): FSRSCard => {
  const d = JSON.parse(json);
  return { ...d, due: new Date(d.due), last_review: d.last_review ? new Date(d.last_review) : undefined };
};
export const getFsrsRating = (r: number): Rating => [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy][r - 1] || Rating.Good;

export const scheduleReview = (card: FSRSCard, rating: Rating) => {
  const res = (fsrs.repeat(card, new Date()) as any)[rating];
  return { card: res.card, log: res.log };
};

// --- Gamification Logic ---
export const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7000, 10000];
const XP_TABLE = { again: 0, hard: 5, good: 10, easy: 15 } as const;

export const getLevelFromXP = (xp: number) => {
  let l = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) l = i + 1; else break;
  }
  return xp >= 10000 ? 10 + Math.floor((xp - 10000) / 3000) : l;
};

export const getXPForRating = (r: 'again' | 'hard' | 'good' | 'easy', streak: number) => 
  Math.round(XP_TABLE[r] * (streak >= 7 ? 1.2 : 1.0));

export const getXPForNextLevel = (xp: number) => {
  const l = getLevelFromXP(xp);
  const cur = LEVEL_THRESHOLDS[l - 1] ?? (10000 + (l - 10) * 3000);
  const nxt = LEVEL_THRESHOLDS[l] ?? (cur + 3000);
  return { current: cur, next: nxt, level: l };
};

// --- Path Management ---
export const generatePath = (deck: string, cards: Card[], completedIds: string[]): PathLevel[] => {
  const size = 15;
  return Array.from({ length: Math.ceil(cards.length / size) }, (_, i) => {
    const id = `${deck}_level_${i + 1}`;
    return {
      id,
      title: `Niveau ${i + 1}`,
      cardIds: cards.slice(i * size, (i + 1) * size).map(c => c.id),
      isCompleted: completedIds.includes(id),
      isLocked: i > 0 && !completedIds.includes(`${deck}_level_${i}`),
    };
  });
};
