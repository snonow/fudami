import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'fudami.db';

export const DATABASE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS cards (
    id          TEXT PRIMARY KEY,   -- JMdict entry ID
    type        TEXT NOT NULL,      -- 'vocab' | 'kanji' | 'phrase'
    front_kanji TEXT NOT NULL,      -- e.g. "食べる"
    front_kana  TEXT NOT NULL,      -- e.g. "たべる"
    back        TEXT NOT NULL,      -- meaning in FR/EN
    level       TEXT NOT NULL,      -- 'n5' | 'n4' | 'n3'
    fsrs_state  TEXT,               -- JSON: ts-fsrs Card object
    due_date    TEXT,               -- ISO 8601
    created_at  TEXT NOT NULL       -- ISO 8601
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    card_id     TEXT NOT NULL REFERENCES cards(id),
    rating      INTEGER NOT NULL,   -- 1=Again 2=Hard 3=Good 4=Easy
    mode        TEXT NOT NULL,      -- 'flip' | 'mcq' | 'typing'
    xp_earned   INTEGER NOT NULL,
    reviewed_at TEXT NOT NULL       -- ISO 8601
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id               INTEGER PRIMARY KEY DEFAULT 1,
    xp_total         INTEGER NOT NULL DEFAULT 0,
    level            INTEGER NOT NULL DEFAULT 1,
    streak_days      INTEGER NOT NULL DEFAULT 0,
    streak_last_date TEXT,          -- ISO date (YYYY-MM-DD)
    total_reviews    INTEGER NOT NULL DEFAULT 0
  );

  -- Initialize user_progress if it doesn't exist
  INSERT OR IGNORE INTO user_progress (id, xp_total, level, streak_days, total_reviews)
  VALUES (1, 0, 1, 0, 0);
`;

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase) {
  const DATABASE_VERSION = 1;
  let { user_version: currentDbVersion } = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  ) ?? { user_version: 0 };

  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentDbVersion === 0) {
    await db.execAsync(DATABASE_SCHEMA);
  }
  
  // Future migrations go here...

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
