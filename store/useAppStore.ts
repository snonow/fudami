import { create } from 'zustand';
import { Card, ReviewMode, SessionState, UserState } from '../types';
import { getDueCards, updateCardFsrs, insertReview } from '../db/cards';
import { getUserProgress, addXPAndReview, updateStreak } from '../db/progress';
import { scheduleReview, getFsrsRating, deserializeCard, serializeCard, createNewCard } from '../engine/fsrs';
import { getXPForRating } from '../engine/gamification';

interface AppState {
  session: SessionState;
  user: UserState;
  isLoading: boolean;

  loadUser: () => Promise<void>;
  loadSession: (level?: string) => Promise<void>;
  gradeCard: (rating: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  endSession: () => void;
  startSession: (cards: Card[], goalType: 'cards' | 'minutes', goalValue: number) => void;
}

const DEFAULT_SESSION: SessionState = {
  isActive: false,
  cards: [],
  currentIndex: 0,
  mode: 'flip',
  xpEarned: 0,
  reviewedCount: 0,
  goalType: 'cards',
  goalValue: 0,
  progress: 0,
  lastModeByCardId: {},
};

const DEFAULT_USER: UserState = {
  xpTotal: 0,
  level: 1,
  streakDays: 0,
  totalReviews: 0,
  completedLevels: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  session: DEFAULT_SESSION,
  user: DEFAULT_USER,
  isLoading: false,

  loadUser: async () => {
    const user = await getUserProgress();
    set({ user });
  },

  loadSession: async (level?: string) => {
    set({ isLoading: true });
    const cards = await getDueCards(20, 10, level);
    const streak = await updateStreak();

    if (cards.length === 0) {
      set((s) => ({ isLoading: false, user: { ...s.user, streakDays: streak } }));
      return;
    }

    const firstMode = pickMode(undefined);
    set((s) => ({
      isLoading: false,
      user: { ...s.user, streakDays: streak },
      session: {
        ...DEFAULT_SESSION,
        isActive: true,
        cards,
        goalType: 'cards',
        goalValue: cards.length,
        mode: firstMode,
        lastModeByCardId: { [cards[0].id]: firstMode },
      },
    }));
  },

  gradeCard: async (rating) => {
    const { session, user } = get();
    const card = session.cards[session.currentIndex];
    if (!card) return;

    // Run FSRS scheduling
    const fsrsRating = getFsrsRating(ratingToNumber(rating));
    const fsrsCard = card.fsrs_state ? deserializeCard(card.fsrs_state) : createNewCard();
    const result = scheduleReview(fsrsCard, fsrsRating);

    const newFsrsState = serializeCard(result.card);
    const newDueDate = result.card.due.toISOString();

    await updateCardFsrs(card.id, newFsrsState, newDueDate);

    const xp = getXPForRating(rating, user.streakDays);
    await insertReview(card.id, ratingToNumber(rating), session.mode, xp);
    const newUser = await addXPAndReview(xp);

    // Re-queue "Again" cards back into the session 3 positions ahead
    let newCards = [...session.cards];
    if (rating === 'again') {
      const updatedCard = { ...card, fsrs_state: newFsrsState, due_date: newDueDate };
      const reinsertAt = Math.min(session.currentIndex + 4, newCards.length);
      newCards.splice(reinsertAt, 0, updatedCard);
    }

    const nextIndex = session.currentIndex + 1;
    const reviewedCount = session.reviewedCount + 1;
    // goal is the original card count — re-queued cards don't inflate the goal
    const isFinished = nextIndex >= newCards.length;
    const progress = Math.min(reviewedCount / session.goalValue, 1);

    const nextCard = newCards[nextIndex];
    const nextMode = nextCard
      ? pickMode(session.lastModeByCardId[nextCard.id])
      : session.mode;

    set({
      user: { ...newUser, completedLevels: user.completedLevels },
      session: {
        ...session,
        cards: newCards,
        currentIndex: nextIndex,
        reviewedCount,
        isActive: !isFinished,
        progress,
        xpEarned: session.xpEarned + xp,
        mode: nextMode,
        lastModeByCardId: nextCard
          ? { ...session.lastModeByCardId, [nextCard.id]: nextMode }
          : session.lastModeByCardId,
      },
    });
  },

  endSession: () => set({ session: DEFAULT_SESSION }),

  startSession: (cards, goalType, goalValue) => {
    const firstMode = cards.length > 0 ? pickMode(undefined) : 'flip';
    set(() => ({
      session: {
        ...DEFAULT_SESSION,
        isActive: cards.length > 0,
        cards,
        goalType,
        goalValue,
        mode: firstMode,
        lastModeByCardId: cards.length > 0 ? { [cards[0].id]: firstMode } : {},
      },
    }));
  },
}));

function pickMode(lastMode?: ReviewMode): ReviewMode {
  // Weighted random, excluding last mode used for this card
  const weights: Record<ReviewMode, number> = { flip: 0.4, mcq: 0.35, typing: 0.25 };
  const candidates = (Object.keys(weights) as ReviewMode[]).filter((m) => m !== lastMode);
  const total = candidates.reduce((s, m) => s + weights[m], 0);
  let rand = Math.random() * total;
  for (const mode of candidates) {
    rand -= weights[mode];
    if (rand <= 0) return mode;
  }
  return candidates[0];
}

function ratingToNumber(rating: 'again' | 'hard' | 'good' | 'easy'): number {
  return { again: 1, hard: 2, good: 3, easy: 4 }[rating];
}
