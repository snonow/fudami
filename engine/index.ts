import { FSRS, Card as FSRSCard, Rating, createEmptyCard, generatorParameters } from 'ts-fsrs';
import * as Haptics from 'expo-haptics';
import { Card, PathLevel } from '../types';

const params = generatorParameters({ request_retention: 0.9, maximum_interval: 36500, w: [0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61] });
const fsrs = new FSRS(params);

export const createNewCard = () => createEmptyCard(new Date());
export const serializeCard = (c: FSRSCard) => JSON.stringify(c);
export const deserializeCard = (json: string): FSRSCard => { const d = JSON.parse(json); return { ...d, due: new Date(d.due), last_review: d.last_review ? new Date(d.last_review) : undefined }; };
export const getFsrsRating = (r: 'again' | 'good'): Rating => r === 'again' ? Rating.Again : Rating.Good;
export const scheduleReview = (card: FSRSCard, rating: Rating) => { const res = (fsrs.repeat(card, new Date()) as any)[rating]; return { card: res.card, log: res.log }; };

export const feedback = {
  playFlip: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  playSuccess: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  playWarning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  playError: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

export const generatePath = (deck: string, cards: { id: string }[], completedIds: string[]): PathLevel[] => {
  const size = 15; return Array.from({ length: Math.ceil(cards.length / size) }, (_, i) => {
    const id = `${deck}_level_${i + 1}`;
    return { id, title: `Level ${i + 1}`, cardIds: cards.slice(i * size, (i + 1) * size).map(c => c.id), isCompleted: completedIds.includes(id), isLocked: i > 0 && !completedIds.includes(`${deck}_level_${i}`) };
  });
};
