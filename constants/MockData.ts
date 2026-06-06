import { Card } from '../types';
import vocabN5 from '../assets/jmdict/vocab_n5.json';

const now = new Date().toISOString();

export const DUMMY_CARDS: Card[] = vocabN5.map((w) => ({
  ...w,
  level: 'n5' as const,
  created_at: now,
}));

// Kept for stats display — will be replaced by real DB queries
export const MOCK_USER_STATS = {
  dailyProgress: 0,
  cardsRemaining: 0,
  cardsLearned: 0,
  accuracy: '—',
};
