export interface Card {
  id: string;
  front_kanji: string;
  front_kana: string;
  back: string;
  level: 'n5' | 'n4' | 'n3';
  fsrs_state?: string;
  due_date?: string;
  created_at: string;
}

export type ReviewMode = 'flip' | 'mcq' | 'typing';

export interface SessionState {
  isActive: boolean;
  cards: Card[];
  currentIndex: number;
  mode: ReviewMode;
  reviewedCount: number;
  goalValue: number;
  goalType: 'cards' | 'minutes';
  progress: number;
  lastModeByCardId: Record<string, ReviewMode>;
}

export interface UserState {
  streakDays: number;
  totalReviews: number;
  completedLevels: string[];
}

export interface PathLevel {
  id: string;
  title: string;
  cardIds: string[];
  isCompleted: boolean;
  isLocked: boolean;
}
