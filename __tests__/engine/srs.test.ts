import { Rating, State } from 'ts-fsrs';
import {
  getLevelFromXP,
  getXPForRating,
  getXPForNextLevel,
  scheduleReview,
  createNewCard,
  serializeCard,
  deserializeCard,
  generatePath,
  LEVEL_THRESHOLDS,
} from '../../engine';
import { Card } from '../../types';

describe('getLevelFromXP', () => {
  it('level 1 at 0 XP', () => expect(getLevelFromXP(0)).toBe(1));
  it('level 2 at exactly 100 XP', () => expect(getLevelFromXP(100)).toBe(2));
  it('level 2 just before level 3', () => expect(getLevelFromXP(249)).toBe(2));
  it('level 3 at exactly 250 XP', () => expect(getLevelFromXP(250)).toBe(3));
  it('level 10 at exactly 10000 XP', () => expect(getLevelFromXP(10000)).toBe(10));
  it('level 11 at 13000 XP', () => expect(getLevelFromXP(13000)).toBe(11));
  it('level 12 at 16000 XP', () => expect(getLevelFromXP(16000)).toBe(12));
  it('all thresholds map to correct levels', () => {
    LEVEL_THRESHOLDS.forEach((xp, i) => {
      expect(getLevelFromXP(xp)).toBe(i + 1);
    });
  });
});

describe('getXPForRating', () => {
  it('again gives 0 XP', () => expect(getXPForRating('again', 0)).toBe(0));
  it('hard gives 5 XP', () => expect(getXPForRating('hard', 0)).toBe(5));
  it('good gives 10 XP', () => expect(getXPForRating('good', 0)).toBe(10));
  it('easy gives 15 XP', () => expect(getXPForRating('easy', 0)).toBe(15));
  it('applies 20% streak bonus at streak >= 7', () => {
    expect(getXPForRating('good', 7)).toBe(12);
    expect(getXPForRating('easy', 7)).toBe(18);
    expect(getXPForRating('hard', 7)).toBe(6);
  });
  it('no streak bonus below 7 days', () => {
    expect(getXPForRating('good', 6)).toBe(10);
    expect(getXPForRating('good', 0)).toBe(10);
  });
  it('again always stays 0 even with streak', () => {
    expect(getXPForRating('again', 10)).toBe(0);
  });
});

describe('getXPForNextLevel', () => {
  it('at level 1 (0 XP): next is 100', () => {
    const r = getXPForNextLevel(0);
    expect(r.level).toBe(1);
    expect(r.current).toBe(0);
    expect(r.next).toBe(100);
  });
  it('at level 2 (150 XP): current is 100, next is 250', () => {
    const r = getXPForNextLevel(150);
    expect(r.level).toBe(2);
    expect(r.current).toBe(100);
    expect(r.next).toBe(250);
  });
  it('at level 10 (10000 XP): next is 13000', () => {
    const r = getXPForNextLevel(10000);
    expect(r.level).toBe(10);
    expect(r.next).toBe(13000);
  });
});

describe('createNewCard / serializeCard / deserializeCard', () => {
  it('round-trips a card through JSON without losing dates', () => {
    const card = createNewCard();
    expect(card.state).toBe(State.New);
    const json = serializeCard(card);
    const restored = deserializeCard(json);
    expect(restored.due).toBeInstanceOf(Date);
    expect(restored.state).toBe(State.New);
    expect(restored.due.getTime()).toBe(card.due.getTime());
  });

  it('restores last_review as Date when present', () => {
    const card = createNewCard();
    const now = new Date();
    (card as any).last_review = now;
    const restored = deserializeCard(serializeCard(card));
    expect(restored.last_review).toBeInstanceOf(Date);
    expect(restored.last_review!.getTime()).toBe(now.getTime());
  });
});

describe('scheduleReview', () => {
  it('returns a card and log for each rating', () => {
    const ratings: Rating[] = [Rating.Again, Rating.Hard, Rating.Good, Rating.Easy];
    const card = createNewCard();
    for (const r of ratings) {
      const { card: next, log } = scheduleReview(card, r);
      expect(next).toBeDefined();
      expect(log).toBeDefined();
      expect(next.due).toBeInstanceOf(Date);
    }
  });

  it('Again keeps the card in learning/review state', () => {
    const card = createNewCard();
    const { card: next } = scheduleReview(card, Rating.Again);
    expect([State.Learning, State.Relearning]).toContain(next.state);
  });

  it('Good on a new card moves it out of New state', () => {
    const card = createNewCard();
    const { card: next } = scheduleReview(card, Rating.Good);
    expect(next.state).not.toBe(State.New);
  });
});

describe('generatePath', () => {
  const makeCards = (n: number): Card[] =>
    Array.from({ length: n }, (_, i) => ({
      id: `card_${i}`,
      front_kanji: '食べる',
      front_kana: 'たべる',
      back: 'to eat',
      level: 'n5' as const,
      created_at: new Date().toISOString(),
    }));

  it('creates correct number of levels (15 cards per level)', () => {
    const path = generatePath('deck', makeCards(30), []);
    expect(path).toHaveLength(2);
  });

  it('first level is always unlocked', () => {
    const [first] = generatePath('deck', makeCards(15), []);
    expect(first.isLocked).toBe(false);
  });

  it('second level is locked when first not completed', () => {
    const path = generatePath('deck', makeCards(30), []);
    expect(path[1].isLocked).toBe(true);
  });

  it('second level unlocks when first is completed', () => {
    const path = generatePath('deck', makeCards(30), ['deck_level_1']);
    expect(path[1].isLocked).toBe(false);
  });

  it('marks completed levels correctly', () => {
    const path = generatePath('deck', makeCards(30), ['deck_level_1']);
    expect(path[0].isCompleted).toBe(true);
    expect(path[1].isCompleted).toBe(false);
  });

  it('each level contains correct cardIds', () => {
    const cards = makeCards(16);
    const path = generatePath('deck', cards, []);
    expect(path[0].cardIds).toHaveLength(15);
    expect(path[1].cardIds).toHaveLength(1);
    expect(path[0].cardIds).toContain('card_0');
    expect(path[1].cardIds).toContain('card_15');
  });
});
