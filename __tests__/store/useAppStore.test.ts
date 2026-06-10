import { useAppStore } from '../../store/useAppStore';

jest.mock('../../db', () => ({
  updateCardFsrs:        jest.fn().mockResolvedValue(undefined),
  insertReview:          jest.fn().mockResolvedValue(undefined),
  getUserProgress:       jest.fn().mockResolvedValue({
    progress: [],
    streak:   { days: 0, last_review_at: null },
  }),
  pendingReviewEvents:   jest.fn().mockResolvedValue([
    { client_event_id: 'evt-1', unit_id: 'word:test-1', rating: 3,
      duration_ms: 500, reviewed_at: '2026-06-10T12:00:00Z', mastered_now: 0 },
  ]),
  ackReviewEvents:       jest.fn().mockResolvedValue(undefined),
  writeProgressSnapshot: jest.fn().mockResolvedValue(undefined),
}));

const DEF_USER = { progress: [], streak: { days: 0, last_review_at: null } };

describe('useAppStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      session: {
        isActive: false,
        cards: [],
        currentIndex: 0,
        mode: 'flip',
        reviewedCount: 0,
        goalType: 'cards',
        goalValue: 0,
        progress: 0,
        lastModeByCardId: {},
        cardStartTime: 0,
      },
      user: DEF_USER,
    });
  });

  it('should start a session correctly', () => {
    const dummyCards = [
      { id: '1', progress: {}, content: { kanji: 'A', kana: 'a', meanings: ['B'] } } as any,
    ];
    useAppStore.getState().startSession(dummyCards, 'cards', 10);

    const state = useAppStore.getState().session;
    expect(state.isActive).toBe(true);
    expect(state.cards).toHaveLength(1);
    expect(state.goalValue).toBe(10);
    expect(state.currentIndex).toBe(0);
    expect(state.cardStartTime).toBeGreaterThan(0);
  });

  it('should mark session inactive when no cards provided', () => {
    useAppStore.getState().startSession([], 'cards', 10);
    expect(useAppStore.getState().session.isActive).toBe(false);
  });

  it('sends review events (not aggregates) to /user/reviews on gradeCard', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ progress: [], streak: { days: 0, last_review_at: null } }),
    });

    const dummyCard = {
      id: 'test-1',
      progress: { card_id: 'test-1' },
      content:  { kanji: '日', kana: 'ひ', meanings: ['day'] },
    };

    useAppStore.setState({
      session: {
        isActive: true,
        cards: [dummyCard as any],
        currentIndex: 0,
        mode: 'flip',
        reviewedCount: 0,
        goalType: 'cards',
        goalValue: 1,
        progress: 0,
        lastModeByCardId: {},
        cardStartTime: Date.now(),
      },
    });

    await useAppStore.getState().gradeCard('good', 'mock-token');

    expect(useAppStore.getState().session.reviewedCount).toBe(1);

    // Give the background sync promise a tick to fire fetch.
    await new Promise(r => setImmediate(r));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/user/reviews'),
      expect.objectContaining({
        method:  'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-token' }),
      }),
    );
    // Body MUST be { events: [...] } — no aggregates.
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.xpTotal).toBeUndefined();
    expect(body.level).toBeUndefined();
    expect(body.streakDays).toBeUndefined();
  });
});
