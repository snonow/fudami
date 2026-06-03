import { useAppStore } from '../../store/useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useAppStore.setState({
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
      },
    });
  });

  it('should start a session correctly', () => {
    const dummyCards = [{ id: 1 }, { id: 2 }];
    useAppStore.getState().startSession(dummyCards, 'cards', 10);

    const state = useAppStore.getState().session;
    expect(state.isActive).toBe(true);
    expect(state.cards).toEqual(dummyCards);
    expect(state.goalValue).toBe(10);
    expect(state.currentIndex).toBe(0);
    expect(state.xpEarned).toBe(0);
  });

  it('should progress to the next card', () => {
    const dummyCards = [{ id: 1 }, { id: 2 }];
    useAppStore.getState().startSession(dummyCards, 'cards', 2);
    
    useAppStore.getState().nextCard();
    
    const state = useAppStore.getState().session;
    expect(state.currentIndex).toBe(1);
    expect(state.progress).toBe(0.5); // 1 out of 2 goal value
    expect(state.isActive).toBe(true);
  });

  it('should end session when out of cards', () => {
    const dummyCards = [{ id: 1 }];
    useAppStore.getState().startSession(dummyCards, 'cards', 1);
    
    useAppStore.getState().nextCard();
    
    const state = useAppStore.getState().session;
    expect(state.currentIndex).toBe(1);
    expect(state.isActive).toBe(false);
    expect(state.progress).toBe(1);
  });

  it('should add XP correctly', () => {
    useAppStore.getState().startSession([], 'cards', 10);
    useAppStore.getState().addXP(15);
    
    expect(useAppStore.getState().session.xpEarned).toBe(15);
    expect(useAppStore.getState().user.xpTotal).toBe(15);
  });
});
