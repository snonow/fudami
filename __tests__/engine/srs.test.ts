import { getFsrsRating, scheduleReview, createNewCard } from '../../engine';
import { Rating } from 'ts-fsrs';

describe('SRS Engine (Binary Rating)', () => {
  it('getFsrsRating should map again correctly', () => {
    expect(getFsrsRating('again')).toBe(Rating.Again);
  });

  it('getFsrsRating should map good correctly', () => {
    expect(getFsrsRating('good')).toBe(Rating.Good);
  });

  it('scheduleReview should return a card and log', () => {
    const card = createNewCard();
    const res = scheduleReview(card, Rating.Good);
    expect(res.card).toBeDefined();
    expect(res.log).toBeDefined();
    expect(res.card.due).not.toEqual(card.due);
  });
});
