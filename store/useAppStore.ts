import { create } from 'zustand';
import { ReviewMode, SessionState, UserState } from '../types';
import { StudyCard } from '../data/study/types';
import { getDueStudyCards, getNewStudyCards } from '../data/study/StudyRepository';
import {
  updateCardFsrs,
  insertReview,
  getUserProgress,
  pendingReviewEvents,
  ackReviewEvents,
  writeProgressSnapshot,
} from '../db';
import { scheduleReview, getFsrsRating, deserializeCard, serializeCard, createNewCard } from '../engine';
import { WORKER_URL } from '../constants/pack';

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

/**
 * Drain the local review outbox to the gateway. The server is authoritative —
 * we send only events and overwrite the local progress snapshot with whatever
 * the server returns. See /SEMANTIC_MODEL.md §4.
 */
async function syncReviews(token?: string): Promise<void> {
  if (!token) return;
  const events = await pendingReviewEvents(200);
  if (events.length === 0) return;
  try {
    const res = await fetch(`${WORKER_URL}/user/reviews`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        events: events.map(e => ({
          client_event_id: e.client_event_id,
          unit_id:         e.unit_id,
          rating:          e.rating,
          duration_ms:     e.duration_ms,
          reviewed_at:     e.reviewed_at,
          mastered_now:    e.mastered_now === 1,
        })),
      }),
    });
    if (!res.ok) {
      console.warn('[Sync] gateway returned', res.status);
      return;
    }
    const snapshot = await res.json() as {
      progress: UserState['progress'];
      streak:   UserState['streak'];
    };
    await writeProgressSnapshot(snapshot);
    await ackReviewEvents(events.map(e => e.client_event_id));
  } catch (e) {
    console.warn('[Sync] failed:', e);
  }
}

const DEF_S: AppSessionState = {
  isActive: false, cards: [], currentIndex: 0, mode: 'flip',
  reviewedCount: 0, goalType: 'cards', goalValue: 0, progress: 0,
  lastModeByCardId: {}, cardStartTime: 0
};
const DEF_U: UserState = { progress: [], streak: { days: 0, last_review_at: null } };

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

    if (!cards.length) return set({ isLoading: false });
    const m = pickMode();
    set({
      isLoading: false,
      session: {
        ...DEF_S, isActive: true, cards, goalValue: cards.length,
        mode: m, lastModeByCardId: { [cards[0].id]: m },
        cardStartTime: Date.now()
      }
    });
  },
  gradeCard: async (r, token) => {
    const { session } = get();
    const card = session.cards[session.currentIndex];
    if (!card) return;

    const duration = Date.now() - session.cardStartTime;
    const fsrsState = card.progress.fsrs_state;
    const res = scheduleReview(fsrsState ? deserializeCard(fsrsState) : createNewCard(), getFsrsRating(r));
    const sState = serializeCard(res.card), due = res.card.due.toISOString();

    // FSRS stability ≥ 21d is our operational definition of mastery
    // (see /SEMANTIC_MODEL.md §2.2 — mastered_now is a monotonic forward signal).
    const masteredNow = res.card.stability >= 21;

    await updateCardFsrs(card.id, sState, due);
    await insertReview(card.id, r === 'again' ? 1 : 3, session.mode, duration, { masteredNow });

    const nextIdx = session.currentIndex + 1, revCount = session.reviewedCount + 1;
    let cards = [...session.cards];
    if (r === 'again') {
      cards.splice(Math.min(nextIdx + 3, cards.length), 0, {
        ...card,
        progress: { ...card.progress, fsrs_state: sState, due_date: due }
      });
    }

    // Drain the outbox to the gateway; the response is the authoritative
    // progress snapshot. Falls back to the local cache on offline / 4xx / 5xx.
    syncReviews(token).then(async () => set({ user: await getUserProgress() }));

    const nextCard = cards[nextIdx], nextM = nextCard ? pickMode(session.lastModeByCardId[nextCard.id]) : session.mode;
    set({
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
