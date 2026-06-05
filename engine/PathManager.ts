import { Card, PathLevel } from '../types';

export class PathManager {
  private static readonly CARDS_PER_LEVEL = 15;

  /**
   * Automatically splits a deck of cards into levels
   */
  static generatePath(deckName: string, cards: Card[], completedLevelIds: string[]): PathLevel[] {
    const levels: PathLevel[] = [];
    const totalLevels = Math.ceil(cards.length / PathManager.CARDS_PER_LEVEL);

    for (let i = 0; i < totalLevels; i++) {
      const start = i * PathManager.CARDS_PER_LEVEL;
      const end = start + PathManager.CARDS_PER_LEVEL;
      const levelCards = cards.slice(start, end);
      
      const levelId = `${deckName}_level_${i + 1}`;
      const isCompleted = completedLevelIds.includes(levelId);
      
      // A level is locked if the previous one isn't completed (except for the first level)
      const isLocked = i > 0 && !completedLevelIds.includes(`${deckName}_level_${i}`);

      levels.push({
        id: levelId,
        title: `Niveau ${i + 1}`,
        cardIds: levelCards.map(c => c.id),
        isCompleted,
        isLocked,
      });
    }

    return levels;
  }
}
