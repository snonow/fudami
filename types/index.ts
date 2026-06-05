export interface Card {
  id: string;
  front: string;
  back: string;
}

export type ReviewMode = 'flip' | 'mcq' | 'typing';

export interface SessionState {
  isActive: boolean;
  cards: Card[];
  currentIndex: number;
  mode: ReviewMode;
  xpEarned: number;
  goalType: 'cards' | 'minutes';
  goalValue: number;
  progress: number;
}

export interface UserState {
  xpTotal: number;
  level: number;
  streakDays: number;
  totalReviews: number;
  completedLevels: string[]; // List of Level IDs
}

export interface PathLevel {
  id: string;
  title: string;
  cardIds: string[];
  isCompleted: boolean;
  isLocked: boolean;
}
