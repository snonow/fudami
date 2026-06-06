import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'fudami.db';

const DATABASE_SCHEMA = `
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

  INSERT OR IGNORE INTO user_progress (id, xp_total, level, streak_days, total_reviews)
  VALUES (1, 0, 1, 0, 0);
`;

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return _db;
}

export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  const DATABASE_VERSION = 1;
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(DATABASE_SCHEMA);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
