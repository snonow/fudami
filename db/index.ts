import * as SQLite from 'expo-sqlite';
import { Card, UserState } from '../types';
import { getLevelFromXP, createNewCard, serializeCard } from '../engine';
import vocabN5 from '../assets/jmdict/vocab_n5.json';

export const DATABASE_NAME = 'fudami.db';
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS cards (id TEXT PRIMARY KEY, type TEXT NOT NULL DEFAULT 'vocab', front_kanji TEXT NOT NULL, front_kana TEXT NOT NULL, back TEXT NOT NULL, level TEXT NOT NULL, fsrs_state TEXT, due_date TEXT, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY AUTOINCREMENT, card_id TEXT NOT NULL REFERENCES cards(id), rating INTEGER NOT NULL, mode TEXT NOT NULL, xp_earned INTEGER NOT NULL, reviewed_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS user_progress (id INTEGER PRIMARY KEY DEFAULT 1, xp_total INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1, streak_days INTEGER NOT NULL DEFAULT 0, streak_last_date TEXT, total_reviews INTEGER NOT NULL DEFAULT 0);
  INSERT OR IGNORE INTO user_progress (id, xp_total, level, streak_days, total_reviews) VALUES (1, 0, 1, 0, 0);
`;

let _dbP: Promise<SQLite.SQLiteDatabase> | null = null, _initP: Promise<void> | null = null;
export const getDatabase = () => (_dbP = _dbP || SQLite.openDatabaseAsync(DATABASE_NAME));
export const initDb = () => (_initP = _initP || (async () => {
  const db = await getDatabase(), res = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  if ((res?.user_version ?? 0) < 1) { await db.execAsync(SCHEMA); await db.execAsync('PRAGMA user_version = 1'); }
  const c = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM cards');
  if (!c?.c) {
    const now = new Date().toISOString(), fsrs = serializeCard(createNewCard());
    await db.withTransactionAsync(async () => {
      for (const w of vocabN5) await db.runAsync('INSERT OR IGNORE INTO cards (id, type, front_kanji, front_kana, back, level, fsrs_state, due_date, created_at) VALUES (?, "vocab", ?, ?, ?, "n5", ?, ?, ?)', [w.id, w.front_kanji, w.front_kana, w.back, fsrs, now, now]);
    });
  }
})());

export const getDueCards = async (limit = 20, maxNew = 10, level?: string): Promise<Card[]> => {
  const db = await getDatabase(), now = new Date().toISOString(), lC = level ? 'AND level = ?' : '', lP = level ? [level] : [];
  const due = await db.getAllAsync<any>(`SELECT * FROM cards WHERE due_date <= ? ${lC} AND EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ORDER BY due_date ASC LIMIT ?`, [now, ...lP, limit]);
  const news = await db.getAllAsync<any>(`SELECT * FROM cards WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ${lC} LIMIT ?`, [...lP, maxNew]);
  return [...due, ...news].slice(0, limit).map(r => ({ ...r, fsrs_state: r.fsrs_state ?? undefined, due_date: r.due_date ?? undefined }));
};

export const updateCardFsrs = async (id: string, state: string, due: string) => (await getDatabase()).runAsync('UPDATE cards SET fsrs_state = ?, due_date = ? WHERE id = ?', [state, due, id]);
export const insertReview = async (cardId: string, rating: number, mode: string, xp: number) => (await getDatabase()).runAsync('INSERT INTO reviews (card_id, rating, mode, xp_earned, reviewed_at) VALUES (?, ?, ?, ?, ?)', [cardId, rating, mode, xp, new Date().toISOString()]);
export const getUserProgress = async (): Promise<UserState> => {
  const r = await (await getDatabase()).getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  return { xpTotal: r?.xp_total ?? 0, level: r?.level ?? 1, streakDays: r?.streak_days ?? 0, totalReviews: r?.total_reviews ?? 0, completedLevels: [] };
};
export const addXPAndReview = async (xp: number): Promise<UserState> => {
  const db = await getDatabase(), r = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  const nX = (r?.xp_total ?? 0) + xp, nL = getLevelFromXP(nX), nR = (r?.total_reviews ?? 0) + 1;
  await db.runAsync('UPDATE user_progress SET xp_total = ?, level = ?, total_reviews = ? WHERE id = 1', [nX, nL, nR]);
  return { xpTotal: nX, level: nL, streakDays: r?.streak_days ?? 0, totalReviews: nR, completedLevels: [] };
};
export const updateStreak = async (): Promise<number> => {
  const db = await getDatabase(), today = new Date().toISOString().slice(0, 10), r = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  if (r?.streak_last_date === today) return r.streak_days;
  const yest = new Date(Date.now() - 864e5).toISOString().slice(0, 10), nS = r?.streak_last_date === yest ? (r.streak_days + 1) : 1;
  await db.runAsync('UPDATE user_progress SET streak_days = ?, streak_last_date = ? WHERE id = 1', [nS, today]);
  return nS;
};
export const getWeeklyActivity = async () => {
  const db = await getDatabase(), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
  return Promise.all(days.map(async day => ({ day, count: (await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM reviews WHERE substr(reviewed_at, 1, 10) = ?', [day]))?.c ?? 0 })));
};
export const getRetentionRate = async () => {
  const r = await (await getDatabase()).getFirstAsync<{ t: number; s: number }>('SELECT COUNT(*) as t, SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as s FROM reviews');
  return r?.t ? Math.round((r.s / r.t) * 100) : 0;
};
