import * as SQLite from 'expo-sqlite';
import { Card, UserState } from '../types';
import { getLevelFromXP, createNewCard, serializeCard } from '../engine/srs';
import vocabN5 from '../assets/jmdict/vocab_n5.json';

export const DATABASE_NAME = 'fudami.db';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS cards (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL DEFAULT 'vocab',
    front_kanji TEXT NOT NULL,
    front_kana  TEXT NOT NULL,
    back        TEXT NOT NULL,
    level       TEXT NOT NULL,
    fsrs_state  TEXT,
    due_date    TEXT,
    created_at  TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id     TEXT NOT NULL REFERENCES cards(id),
    rating      INTEGER NOT NULL,
    mode        TEXT NOT NULL,
    xp_earned   INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_progress (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    xp_total         INTEGER NOT NULL DEFAULT 0,
    level            INTEGER NOT NULL DEFAULT 1,
    streak_days      INTEGER NOT NULL DEFAULT 0,
    streak_last_date TEXT,
    total_reviews    INTEGER NOT NULL DEFAULT 0
  );
  INSERT OR IGNORE INTO user_progress (id, xp_total, level, streak_days, total_reviews) VALUES (1, 0, 1, 0, 0);
`;
let _dbP: Promise<SQLite.SQLiteDatabase> | null = null;
let _initP: Promise<void> | null = null;

export const getDatabase = () => {
  if (!_dbP) _dbP = SQLite.openDatabaseAsync(DATABASE_NAME);
  return _dbP;
};

export const initDb = async () => {
  if (_initP) return _initP;
  
  _initP = (async () => {
    const db = await getDatabase();
    const res = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if ((res?.user_version ?? 0) < 1) {
      await db.execAsync(SCHEMA);
      await db.execAsync('PRAGMA user_version = 1');
    }
    await seedIfNeeded(db);
  })();
  
  return _initP;
};

const seedIfNeeded = async (db: SQLite.SQLiteDatabase) => {
  const count = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM cards');
  if ((count?.c ?? 0) > 0) return;

  const now = new Date().toISOString();
  const fsrs = serializeCard(createNewCard());

  await db.withTransactionAsync(async () => {
    for (const w of vocabN5) {
      await db.runAsync(
        'INSERT OR IGNORE INTO cards (id, type, front_kanji, front_kana, back, level, fsrs_state, due_date, created_at) VALUES (?, "vocab", ?, ?, ?, "n5", ?, ?, ?)',
        [w.id, w.front_kanji, w.front_kana, w.back, fsrs, now, now]
      );
    }
  });
};

export const getDueCards = async (limit = 20, maxNew = 10, level?: string): Promise<Card[]> => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const lClause = level ? 'AND level = ?' : '';
  const lParams = level ? [level] : [];

  const due = await db.getAllAsync<any>(
    `SELECT * FROM cards WHERE due_date <= ? ${lClause} AND EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ORDER BY due_date ASC LIMIT ?`,
    [now, ...lParams, limit]
  );
  const news = await db.getAllAsync<any>(
    `SELECT * FROM cards WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ${lClause} LIMIT ?`,
    [...lParams, maxNew]
  );

  return [...due, ...news].slice(0, limit).map(row => ({
    ...row,
    fsrs_state: row.fsrs_state ?? undefined,
    due_date: row.due_date ?? undefined,
  }));
};

export const updateCardFsrs = async (id: string, state: string, due: string) => {
  const db = await getDatabase();
  await db.runAsync('UPDATE cards SET fsrs_state = ?, due_date = ? WHERE id = ?', [state, due, id]);
};

export const insertReview = async (cardId: string, rating: number, mode: string, xp: number) => {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO reviews (card_id, rating, mode, xp_earned, reviewed_at) VALUES (?, ?, ?, ?, ?)',
    [cardId, rating, mode, xp, new Date().toISOString()]
  );
};

export const getUserProgress = async (): Promise<UserState> => {
  const db = await getDatabase();
  const r = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  return {
    xpTotal: r?.xp_total ?? 0,
    level: r?.level ?? 1,
    streakDays: r?.streak_days ?? 0,
    totalReviews: r?.total_reviews ?? 0,
    completedLevels: [],
  };
};

export const addXPAndReview = async (xp: number): Promise<UserState> => {
  const db = await getDatabase();
  const r = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  const newXP = (r?.xp_total ?? 0) + xp;
  const newLevel = getLevelFromXP(newXP);
  const newReviews = (r?.total_reviews ?? 0) + 1;

  await db.runAsync('UPDATE user_progress SET xp_total = ?, level = ?, total_reviews = ? WHERE id = 1', [newXP, newLevel, newReviews]);
  return { xpTotal: newXP, level: newLevel, streakDays: r?.streak_days ?? 0, totalReviews: newReviews, completedLevels: [] };
};

export const getTotalLearned = async (): Promise<number> => {
  const db = await getDatabase();
  const r = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM cards WHERE EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id)'
  );
  return r?.c ?? 0;
};

export const updateStreak = async (): Promise<number> => {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const r = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  if (r?.streak_last_date === today) return r.streak_days;

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const newStreak = r?.streak_last_date === yesterday ? (r.streak_days + 1) : 1;
  await db.runAsync('UPDATE user_progress SET streak_days = ?, streak_last_date = ? WHERE id = 1', [newStreak, today]);
  return newStreak;
};
