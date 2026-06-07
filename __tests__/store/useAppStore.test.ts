import { useAppStore } from '../../store/useAppStore';

// Mock DB functions used in store
jest.mock('../../db', () => ({
  updateCardFsrs: jest.fn().mockResolvedValue(undefined),
  insertReview: jest.fn().mockResolvedValue(undefined),
  getUserProgress: jest.fn().mockResolvedValue({ xpTotal: 0, level: 1, streakDays: 0, totalReviews: 0 }),
  incrementReviews: jest.fn().mockResolvedValue(undefined),
  updateStreak: jest.fn().mockResolvedValue(1),
}));

describe('useAppStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.setState({
      session: {
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
        cardStartTime: 0,
      },
      user: {
        xpTotal: 0,
        level: 1,
        streakDays: 0,
        totalReviews: 0,
        completedLevels: [],
      },
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

  it('should update state and call fetch on gradeCard', async () => {
    // Mock fetch globally
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })
    );

    const dummyCard = { 
      id: 'test-1', 
      progress: { card_id: 'test-1' },
      content: { kanji: '日', kana: 'ひ', meanings: ['day'] }
    };

    useAppStore.setState({
      session: {
        isActive: true,
        cards: [dummyCard as any],
        currentIndex: 0,
        mode: 'flip',
        xpEarned: 0,
        reviewedCount: 0,
        goalType: 'cards',
        goalValue: 1,
        progress: 0,
        lastModeByCardId: {},
        cardStartTime: Date.now()
      }
    });

    await useAppStore.getState().gradeCard('good', 'mock-token');

    expect(useAppStore.getState().session.reviewedCount).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/user/sync'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer mock-token'
        })
      })
    );
  });
});
