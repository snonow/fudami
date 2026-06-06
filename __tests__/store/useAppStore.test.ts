import { useAppStore } from '../../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
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
      { id: '1', front_kanji: 'A', front_kana: 'a', back: 'B', level: 'n5', created_at: '' },
    ];
    useAppStore.getState().startSession(dummyCards, 'cards', 10);

    const state = useAppStore.getState().session;
    expect(state.isActive).toBe(true);
    expect(state.cards).toHaveLength(1);
    expect(state.goalValue).toBe(10);
    expect(state.currentIndex).toBe(0);
  });

  it('should mark session inactive when no cards provided', () => {
    useAppStore.getState().startSession([], 'cards', 10);
    expect(useAppStore.getState().session.isActive).toBe(false);
  });

  it('should expose gradeCard as a function', () => {
    expect(typeof useAppStore.getState().gradeCard).toBe('function');
  });

  it('should expose loadSession as a function', () => {
    expect(typeof useAppStore.getState().loadSession).toBe('function');
  });
});
