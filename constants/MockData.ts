import { Card } from '../types';

export const DUMMY_CARDS: Card[] = [
  { id: '1', front: '猫', back: 'Neko (Chat)' },
  { id: '2', front: '犬', back: 'Inu (Chien)' },
  { id: '3', front: '鳥', back: 'Tori (Oiseau)' },
  { id: '4', front: '水', back: 'Mizu (Eau)' },
  { id: '5', front: '火', back: 'Hi (Feu)' },
];

export const MOCK_USER_STATS = {
  dailyProgress: 0.65,
  cardsRemaining: 12,
  cardsLearned: 15,
  accuracy: '85%',
};
