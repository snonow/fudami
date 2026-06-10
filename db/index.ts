import * as SQLite from 'expo-sqlite';
import { Card, SkillProgress, UserState } from '../types';
import { createNewCard, serializeCard } from '../engine';
import vocabN5 from '../assets/jmdict/vocab_n5.json';

export const DATABASE_NAME = 'fudami.db';

// ─── Schema (see /SEMANTIC_MODEL.md) ─────────────────────────────────────────
//
// Local mirror of the gateway's star schema. The client never computes
// aggregates — `skill_progress` and `streak_cache` cache the last server
// snapshot so the UI can render offline. Authoritative writes happen via
// POST /user/reviews; this DB only buffers events that haven't synced yet.
const SCHEMA_V1 = `
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'vocab',
    front_kanji TEXT NOT NULL,
    front_kana TEXT NOT NULL,
    back TEXT NOT NULL,
    level TEXT NOT NULL,
    fsrs_state TEXT,
    due_date TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL REFERENCES cards(id),
    rating INTEGER NOT NULL,
    mode TEXT NOT NULL,
    -- v1 stored duration_ms here under the legacy name 'xp_earned'.
    -- Migration v1→v2 renames it.
    xp_earned INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY DEFAULT 1,
    xp_total INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    streak_days INTEGER NOT NULL DEFAULT 0,
    streak_last_date TEXT,
    total_reviews INTEGER NOT NULL DEFAULT 0
  );
  INSERT OR IGNORE INTO user_progress (id) VALUES (1);
`;

// Migration v1 → v2: drop XP / level scalars; rename misused xp_earned →
// duration_ms; add skill_progress cache + outbox of unsynced events.
const MIGRATE_V2 = `
  CREATE TABLE IF NOT EXISTS reviews_v2 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id TEXT NOT NULL REFERENCES cards(id),
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 4),
    mode TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL
  );
  INSERT INTO reviews_v2 (id, card_id, rating, mode, duration_ms, reviewed_at)
    SELECT id, card_id,
           CASE WHEN rating BETWEEN 1 AND 4 THEN rating ELSE 3 END,
           mode, xp_earned, reviewed_at
      FROM reviews;
  DROP TABLE reviews;
  ALTER TABLE reviews_v2 RENAME TO reviews;

  DROP TABLE user_progress;

  -- Cache of last server-snapshot for offline display.
  CREATE TABLE IF NOT EXISTS skill_progress (
    level_id        TEXT NOT NULL,
    skill_id        TEXT NOT NULL,
    mastered_units  INTEGER NOT NULL DEFAULT 0,
    total_units     INTEGER NOT NULL DEFAULT 0,
    mastery_ratio   REAL    NOT NULL DEFAULT 0,
    last_review_at  TEXT,
    PRIMARY KEY (level_id, skill_id)
  );
  CREATE TABLE IF NOT EXISTS streak_cache (
    id              INTEGER PRIMARY KEY DEFAULT 1,
    days            INTEGER NOT NULL DEFAULT 0,
    last_review_at  TEXT
  );
  INSERT OR IGNORE INTO streak_cache (id) VALUES (1);

  -- Outbox: review events not yet acknowledged by the gateway. Drained by
  -- the sync layer; each row maps to one POST /user/reviews event.
  CREATE TABLE IF NOT EXISTS review_outbox (
    client_event_id TEXT PRIMARY KEY,
    unit_id         TEXT NOT NULL,
    rating          INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 4),
    duration_ms     INTEGER NOT NULL,
    reviewed_at     TEXT NOT NULL,
    mastered_now    INTEGER NOT NULL DEFAULT 0 CHECK(mastered_now IN (0,1))
  );
`;

let _dbP: Promise<SQLite.SQLiteDatabase> | null = null, _initP: Promise<void> | null = null;
export const getDatabase = () => (_dbP = _dbP || SQLite.openDatabaseAsync(DATABASE_NAME));

export const initDb = () => (_initP = _initP || (async () => {
  const db = await getDatabase();
  const res = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = res?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync('PRAGMA user_version = 1');
  }
  if (version < 2) {
    await db.execAsync(MIGRATE_V2);
    await db.execAsync('PRAGMA user_version = 2');
  }
  const c = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM cards');
  if (!c?.c) {
    const now = new Date().toISOString(), fsrs = serializeCard(createNewCard());
    await db.withTransactionAsync(async () => {
      for (const w of vocabN5) {
        await db.runAsync(
          'INSERT OR IGNORE INTO cards (id, type, front_kanji, front_kana, back, level, fsrs_state, due_date, created_at) VALUES (?, \'vocab\', ?, ?, ?, \'n5\', ?, ?, ?)',
          [w.id, w.front_kanji, w.front_kana, w.back, fsrs, now, now],
        );
      }
    });
  }
})());

// ─── Cards ──────────────────────────────────────────────────────────────────

export const getDueCards = async (limit = 20, maxNew = 10, level?: string): Promise<Card[]> => {
  const db = await getDatabase(), now = new Date().toISOString(), lC = level ? 'AND level = ?' : '', lP = level ? [level] : [];
  const due = await db.getAllAsync<any>(`SELECT * FROM cards WHERE due_date <= ? ${lC} AND EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ORDER BY due_date ASC LIMIT ?`, [now, ...lP, limit]);
  const news = await db.getAllAsync<any>(`SELECT * FROM cards WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id) ${lC} LIMIT ?`, [...lP, maxNew]);
  return [...due, ...news].slice(0, limit).map(r => ({ ...r, fsrs_state: r.fsrs_state ?? undefined, due_date: r.due_date ?? undefined }));
};

export const updateCardFsrs = async (id: string, state: string, due: string) =>
  (await getDatabase()).runAsync('UPDATE cards SET fsrs_state = ?, due_date = ? WHERE id = ?', [state, due, id]);

/**
 * Insert a local review row AND enqueue an event in the outbox for the
 * gateway. The outbox makes sync idempotent: the same client_event_id can be
 * retried until the gateway acknowledges it.
 */
export const insertReview = async (
  cardId: string,
  rating: number,
  mode: string,
  durationMs: number,
  opts?: { unitId?: string; clientEventId?: string; masteredNow?: boolean },
) => {
  const db = await getDatabase();
  const reviewedAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO reviews (card_id, rating, mode, duration_ms, reviewed_at) VALUES (?, ?, ?, ?, ?)',
    [cardId, rating, mode, durationMs, reviewedAt],
  );
  // Best-effort outbox. unitId defaults to "word:<cardId>" — the seed deck
  // uses JMdict sequence numbers as card IDs, matching dim_unit ref_ids.
  const unitId        = opts?.unitId ?? `word:${cardId}`;
  const clientEventId = opts?.clientEventId ?? `${reviewedAt}-${cardId}`;
  const masteredNow   = opts?.masteredNow ? 1 : 0;
  await db.runAsync(
    `INSERT OR IGNORE INTO review_outbox
       (client_event_id, unit_id, rating, duration_ms, reviewed_at, mastered_now)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [clientEventId, unitId, rating, durationMs, reviewedAt, masteredNow],
  );
};

// ─── Progress (mirror of server snapshot) ───────────────────────────────────

/**
 * Read the cached server snapshot. Returns empty arrays if no sync has
 * happened yet — the UI should show a "syncing…" placeholder rather than
 * fabricating numbers.
 */
export const getUserProgress = async (): Promise<UserState> => {
  const db = await getDatabase();
  const progress = await db.getAllAsync<SkillProgress>(
    'SELECT level_id, skill_id, mastered_units, total_units, mastery_ratio, last_review_at FROM skill_progress ORDER BY level_id, skill_id',
  );
  const streak = await db.getFirstAsync<{ days: number; last_review_at: string | null }>(
    'SELECT days, last_review_at FROM streak_cache WHERE id = 1',
  );
  return {
    progress,
    streak: { days: streak?.days ?? 0, last_review_at: streak?.last_review_at ?? null },
  };
};

/** Persist a server snapshot fetched via GET /user/progress. */
export const writeProgressSnapshot = async (
  snapshot: { progress: SkillProgress[]; streak: { days: number; last_review_at: string | null } },
): Promise<void> => {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM skill_progress');
    for (const p of snapshot.progress) {
      await db.runAsync(
        `INSERT INTO skill_progress
           (level_id, skill_id, mastered_units, total_units, mastery_ratio, last_review_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [p.level_id, p.skill_id, p.mastered_units, p.total_units, p.mastery_ratio, p.last_review_at],
      );
    }
    await db.runAsync(
      'UPDATE streak_cache SET days = ?, last_review_at = ? WHERE id = 1',
      [snapshot.streak.days, snapshot.streak.last_review_at],
    );
  });
};

// ─── Outbox (sync queue) ────────────────────────────────────────────────────

export const pendingReviewEvents = async (limit = 200) =>
  (await getDatabase()).getAllAsync<{
    client_event_id: string; unit_id: string; rating: number;
    duration_ms: number; reviewed_at: string; mastered_now: number;
  }>(
    'SELECT client_event_id, unit_id, rating, duration_ms, reviewed_at, mastered_now FROM review_outbox ORDER BY reviewed_at ASC LIMIT ?',
    [limit],
  );

export const ackReviewEvents = async (clientEventIds: string[]): Promise<void> => {
  if (clientEventIds.length === 0) return;
  const db = await getDatabase();
  const placeholders = clientEventIds.map(() => '?').join(',');
  await db.runAsync(`DELETE FROM review_outbox WHERE client_event_id IN (${placeholders})`, clientEventIds);
};

// ─── Aggregates ─────────────────────────────────────────────────────────────

export const getWeeklyActivity = async () => {
  const db = await getDatabase(), days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toISOString().slice(0, 10); }).reverse();
  return Promise.all(days.map(async day => ({ day, count: (await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM reviews WHERE substr(reviewed_at, 1, 10) = ?', [day]))?.c ?? 0 })));
};

export const getRetentionRate = async () => {
  const r = await (await getDatabase()).getFirstAsync<{ t: number; s: number }>('SELECT COUNT(*) as t, SUM(CASE WHEN rating >= 3 THEN 1 ELSE 0 END) as s FROM reviews');
  return r?.t ? Math.round((r.s / r.t) * 100) : 0;
};
