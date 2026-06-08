import { create } from 'zustand';
import { ReviewMode, SessionState, UserState } from '../types';
import { StudyCard } from '../data/study/types';
import { getDueStudyCards, getNewStudyCards } from '../data/study/StudyRepository';
import { updateCardFsrs, insertReview, getUserProgress, incrementReviews, updateStreak } from '../db';
import { scheduleReview, getFsrsRating, deserializeCard, serializeCard, createNewCard } from '../engine';

interface AppSessionState extends Omit<SessionState, 'cards'> {
  cards: StudyCard[];
  cardStartTime: number;
}

interface AppState {
  session: AppSessionState; user: UserState; isLoading: boolean;
  loadUser: () => Promise<void>;
  loadSession: (level?: string) => Promise<void>;
  gradeCard: (r: 'again' | 'good', token?: string) => Promise<void>;
  endSession: () => void;
  startSession: (cards: StudyCard[], type: 'cards' | 'minutes', goal: number) => void;
}

const API_BASE = "https://fudami-gateway.your-subdomain.workers.dev"; // TODO: Update after deployment

async function backgroundSync(user: UserState, token?: string) {
  if (!token) return;
  try {
    fetch(`${API_BASE}/user/sync`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    }).catch(e => console.warn('[Sync] Background push failed:', e));
  } catch (e) {
    // Silent fail for background sync
  }
}

const DEF_S: AppSessionState = { 
  isActive: false, cards: [], currentIndex: 0, mode: 'flip', 
  reviewedCount: 0, goalType: 'cards', goalValue: 0, progress: 0, 
  lastModeByCardId: {}, cardStartTime: 0 
};
const DEF_U: UserState = { streakDays: 0, totalReviews: 0, completedLevels: [] };

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
    
    // Retrieve due cards and new cards separately
    const dueResult = await getDueStudyCards(20);
    const newResult = await getNewStudyCards(level || 'n5', 10);
    
    const cards = [
      ...(dueResult.ok ? dueResult.data : []),
      ...(newResult.ok ? newResult.data : [])
    ].slice(0, 20);

    const streak = await updateStreak();
    if (!cards.length) return set({ isLoading: false, user: { ...get().user, streakDays: streak } });
    const m = pickMode();
    set({ 
      isLoading: false, 
      user: { ...get().user, streakDays: streak }, 
      session: { 
        ...DEF_S, isActive: true, cards, goalValue: cards.length, 
        mode: m, lastModeByCardId: { [cards[0].id]: m },
        cardStartTime: Date.now() 
      } 
    });
  },
  gradeCard: async (r, token) => {
    const { session, user } = get();
    const card = session.cards[session.currentIndex];
    if (!card) return;

    const duration = Date.now() - session.cardStartTime;
    const fsrsState = card.progress.fsrs_state;
    const res = scheduleReview(fsrsState ? deserializeCard(fsrsState) : createNewCard(), getFsrsRating(r));
    const sState = serializeCard(res.card), due = res.card.due.toISOString();
    
    await updateCardFsrs(card.id, sState, due);
    await insertReview(card.id, r === 'again' ? 1 : 3, session.mode, duration);
    await incrementReviews();
    
    const nextIdx = session.currentIndex + 1, revCount = session.reviewedCount + 1;
    let cards = [...session.cards];
    if (r === 'again') {
      cards.splice(Math.min(nextIdx + 3, cards.length), 0, { 
        ...card, 
        progress: { ...card.progress, fsrs_state: sState, due_date: due } 
      });
    }

    const newUser = await getUserProgress();
    // Trigger background sync (silent)
    backgroundSync(newUser, token);

    const nextCard = cards[nextIdx], nextM = nextCard ? pickMode(session.lastModeByCardId[nextCard.id]) : session.mode;
    set({ 
      user: { ...newUser, completedLevels: user.completedLevels }, 
      session: { 
        ...session, cards, currentIndex: nextIdx, reviewedCount: revCount, 
        isActive: nextIdx < cards.length, progress: Math.min(revCount / session.goalValue, 1), 
        mode: nextM, lastModeByCardId: nextCard ? { ...session.lastModeByCardId, [nextCard.id]: nextM } : session.lastModeByCardId,
        cardStartTime: Date.now()
      } 
    });
  },
  endSession: () => set({ session: DEF_S }),
  startSession: (cards, goalType, goalValue) => {
    const m = cards.length ? pickMode() : 'flip';
    set({ 
      session: { 
        ...DEF_S, isActive: !!cards.length, cards, goalType, goalValue, 
        mode: m, lastModeByCardId: cards.length ? { [cards[0].id]: m } : {},
        cardStartTime: Date.now()
      } 
    });
  }
}));
