import { create } from 'zustand';
import { Card, ReviewMode, SessionState, UserState } from '../types';

interface AppState {
  session: SessionState;
  user: UserState;
  
  // Actions
  startSession: (cards: Card[], goalType: 'cards' | 'minutes', goalValue: number) => void;
  endSession: () => void;
  nextCard: () => void;
  addXP: (amount: number) => void;
  updateUser: (data: Partial<UserState>) => void;
}

export const useAppStore = create<AppState>((set) => ({
  session: {
    isActive: false,
    cards: [],
    currentIndex: 0,
    mode: 'flip',
    xpEarned: 0,
    goalType: 'cards',
    goalValue: 20,
    progress: 0,
  },
  user: {
    xpTotal: 0,
    level: 1,
    streakDays: 0,
    totalReviews: 0,
    completedLevels: [],
  },

  startSession: (cards, goalType, goalValue) => set((state) => ({
    session: {
      ...state.session,
      isActive: true,
      cards,
      currentIndex: 0,
      xpEarned: 0,
      goalType,
      goalValue,
      progress: 0,
      mode: getRandomMode(),
    }
  })),

  completeLevel: (levelId: string) => set((state) => ({
    user: {
      ...state.user,
      completedLevels: [...state.user.completedLevels, levelId],
    }
  })),

  endSession: () => set((state) => ({
    session: {
      ...state.session,
      isActive: false,
      cards: [],
    }
  })),

  nextCard: () => set((state) => {
    const nextIndex = state.session.currentIndex + 1;
    const isFinished = nextIndex >= state.session.cards.length;
    
    // Calculate progress
    let progress = 0;
    if (state.session.goalType === 'cards') {
      progress = Math.min(nextIndex / state.session.goalValue, 1);
    }

    return {
      session: {
        ...state.session,
        currentIndex: nextIndex,
        isActive: !isFinished,
        progress,
        mode: getRandomMode(),
      }
    };
  }),

  addXP: (amount) => set((state) => ({
    session: {
      ...state.session,
      xpEarned: state.session.xpEarned + amount,
    },
    user: {
      ...state.user,
      xpTotal: state.user.xpTotal + amount,
    }
  })),

  updateUser: (data) => set((state) => ({
    user: {
      ...state.user,
      ...data,
    }
  })),
}));

// Helper to get random mode according to rules
function getRandomMode(): ReviewMode {
  const rand = Math.random();
  if (rand < 0.4) return 'flip';
  if (rand < 0.75) return 'mcq';
  return 'typing';
}
