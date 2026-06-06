import { getDatabase } from './schema';
import { UserState } from '../types';
import { getLevelFromXP } from '../engine/gamification';

export async function getUserProgress(): Promise<UserState> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');

  return {
    xpTotal: row?.xp_total ?? 0,
    level: row?.level ?? 1,
    streakDays: row?.streak_days ?? 0,
    totalReviews: row?.total_reviews ?? 0,
    completedLevels: [],
  };
}

export async function addXPAndReview(xpGained: number): Promise<UserState> {
  const db = await getDatabase();

  const row = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  const newXP = (row?.xp_total ?? 0) + xpGained;
  const newLevel = getLevelFromXP(newXP);
  const newReviews = (row?.total_reviews ?? 0) + 1;

  await db.runAsync(
    'UPDATE user_progress SET xp_total = ?, level = ?, total_reviews = ? WHERE id = 1',
    [newXP, newLevel, newReviews]
  );

  return {
    xpTotal: newXP,
    level: newLevel,
    streakDays: row?.streak_days ?? 0,
    totalReviews: newReviews,
    completedLevels: [],
  };
}

export async function updateStreak(): Promise<number> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);

  const row = await db.getFirstAsync<any>('SELECT * FROM user_progress WHERE id = 1');
  const last = row?.streak_last_date;

  if (last === today) return row?.streak_days ?? 0;

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const newStreak = last === yesterday ? (row?.streak_days ?? 0) + 1 : 1;

  await db.runAsync(
    'UPDATE user_progress SET streak_days = ?, streak_last_date = ? WHERE id = 1',
    [newStreak, today]
  );

  return newStreak;
}
