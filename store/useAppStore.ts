import { create } from 'zustand';
import { Card, ReviewMode, SessionState, UserState } from '../types';
import { getDueCards, updateCardFsrs, insertReview, getUserProgress, addXPAndReview, updateStreak } from '../db';
import { scheduleReview, getFsrsRating, deserializeCard, serializeCard, createNewCard, getXPForRating } from '../engine';

interface AppState {
  session: SessionState; user: UserState; isLoading: boolean;
  loadUser: () => Promise<void>;
  loadSession: (level?: string) => Promise<void>;
  gradeCard: (r: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  endSession: () => void;
  startSession: (cards: Card[], type: 'cards' | 'minutes', goal: number) => void;
}

const DEF_S: SessionState = { isActive: false, cards: [], currentIndex: 0, mode: 'flip', xpEarned: 0, reviewedCount: 0, goalType: 'cards', goalValue: 0, progress: 0, lastModeByCardId: {} };
const DEF_U: UserState = { xpTotal: 0, level: 1, streakDays: 0, totalReviews: 0, completedLevels: [] };

const pickMode = (last?: ReviewMode): ReviewMode => {
  const w: Record<ReviewMode, number> = { flip: 0.4, mcq: 0.35, typing: 0.25 };
  const opts = (Object.keys(w) as ReviewMode[]).filter(m => m !== last);
  const total = opts.reduce((s, m) => s + w[m], 0);
  let r = Math.random() * total;
  for (const m of opts) if ((r -= w[m]) <= 0) return m;
  return opts[0];
};

export const useAppStore = create<AppState>((set, get) => ({
  session: DEF_S, user: DEF_U, isLoading: false,
  loadUser: async () => set({ user: await getUserProgress() }),
  loadSession: async (level) => {
    set({ isLoading: true });
    const cards = await getDueCards(20, 10, level);
    const streak = await updateStreak();
    if (!cards.length) return set({ isLoading: false, user: { ...get().user, streakDays: streak } });
    const m = pickMode();
    set({ isLoading: false, user: { ...get().user, streakDays: streak }, session: { ...DEF_S, isActive: true, cards, goalValue: cards.length, mode: m, lastModeByCardId: { [cards[0].id]: m } } });
  },
  gradeCard: async (r) => {
    const { session, user } = get();
    const card = session.cards[session.currentIndex];
    if (!card) return;
    const res = scheduleReview(card.fsrs_state ? deserializeCard(card.fsrs_state) : createNewCard(), getFsrsRating({ again: 1, hard: 2, good: 3, easy: 4 }[r]));
    const sState = serializeCard(res.card), due = res.card.due.toISOString();
    await updateCardFsrs(card.id, sState, due);
    const xp = getXPForRating(r, user.streakDays);
    await insertReview(card.id, { again: 1, hard: 2, good: 3, easy: 4 }[r], session.mode, xp);
    const newUser = await addXPAndReview(xp), nextIdx = session.currentIndex + 1, revCount = session.reviewedCount + 1;
    let cards = [...session.cards];
    if (r === 'again') cards.splice(Math.min(nextIdx + 3, cards.length), 0, { ...card, fsrs_state: sState, due_date: due });
    const nextCard = cards[nextIdx], nextM = nextCard ? pickMode(session.lastModeByCardId[nextCard.id]) : session.mode;
    set({ user: { ...newUser, completedLevels: user.completedLevels }, session: { ...session, cards, currentIndex: nextIdx, reviewedCount: revCount, isActive: nextIdx < cards.length, progress: Math.min(revCount / session.goalValue, 1), xpEarned: session.xpEarned + xp, mode: nextM, lastModeByCardId: nextCard ? { ...session.lastModeByCardId, [nextCard.id]: nextM } : session.lastModeByCardId } });
  },
  endSession: () => set({ session: DEF_S }),
  startSession: (cards, goalType, goalValue) => {
    const m = cards.length ? pickMode() : 'flip';
    set({ session: { ...DEF_S, isActive: !!cards.length, cards, goalType, goalValue, mode: m, lastModeByCardId: cards.length ? { [cards[0].id]: m } : {} } });
  }
}));
