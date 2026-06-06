import { getDatabase } from './schema';
import { Card } from '../types';

export async function getDueCards(limit = 20, maxNew = 10, level?: string): Promise<Card[]> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const levelClause = level ? 'AND c.level = ?' : '';
  const levelParam = level ? [level] : [];

  // 1. Cards previously reviewed that are now due again
  const dueRows = await db.getAllAsync<any>(
    `SELECT c.* FROM cards c
     WHERE c.due_date <= ? ${levelClause}
     AND EXISTS (SELECT 1 FROM reviews r WHERE r.card_id = c.id)
     ORDER BY c.due_date ASC LIMIT ?`,
    [now, ...levelParam, limit]
  );

  // 2. Brand-new cards (never reviewed), capped at maxNew
  const newRows = await db.getAllAsync<any>(
    `SELECT c.* FROM cards c
     WHERE NOT EXISTS (SELECT 1 FROM reviews r WHERE r.card_id = c.id)
     ${levelClause}
     LIMIT ?`,
    [...levelParam, maxNew]
  );

  const all = [...dueRows, ...newRows].slice(0, limit);
  return all.map(rowToCard);
}

export async function updateCardFsrs(cardId: string, fsrs_state: string, due_date: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE cards SET fsrs_state = ?, due_date = ? WHERE id = ?',
    [fsrs_state, due_date, cardId]
  );
}

export async function insertReview(
  cardId: string,
  rating: number,
  mode: string,
  xpEarned: number
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO reviews (card_id, rating, mode, xp_earned, reviewed_at) VALUES (?, ?, ?, ?, ?)',
    [cardId, rating, mode, xpEarned, new Date().toISOString()]
  );
}

export async function getTotalLearned(): Promise<number> {
  const db = await getDatabase();
  const result = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(DISTINCT card_id) as count FROM reviews'
  );
  return result?.count ?? 0;
}

function rowToCard(row: any): Card {
  return {
    id: row.id,
    front_kanji: row.front_kanji,
    front_kana: row.front_kana,
    back: row.back,
    level: row.level,
    fsrs_state: row.fsrs_state ?? undefined,
    due_date: row.due_date ?? undefined,
    created_at: row.created_at,
  };
}
