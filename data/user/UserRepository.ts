/**
 * UserRepository — Result<T>-safe wrapper around the user state DB.
 *
 * The underlying db/index.ts functions throw on error. This layer catches
 * every throw and converts it to a typed Result, so:
 *   - A DB failure never propagates as an unhandled exception.
 *   - Callers get consistent Result<T> regardless of the data source.
 *   - If we later swap expo-sqlite for something else, only this file changes.
 */

import { Result, ok, err } from '../Result';
import {
  getUserProgress,
  addXPAndReview,
  updateStreak,
  getWeeklyActivity,
  getRetentionRate,
  getDueCards,
  updateCardFsrs,
  insertReview,
  initDb,
} from '../../db';
import type { UserState, Card } from '../../types';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

export async function initUserDB(): Promise<Result<void>> {
  try {
    await initDb();
    return ok(undefined);
  } catch (e) {
    return err(`initUserDB: ${e}`);
  }
}

// ─── User progress ───────────────────────────────────────────────────────────

export async function getProgress(): Promise<Result<UserState>> {
  try { return ok(await getUserProgress()); }
  catch (e) { return err(`getProgress: ${e}`); }
}

export async function addXP(xp: number): Promise<Result<UserState>> {
  try { return ok(await addXPAndReview(xp)); }
  catch (e) { return err(`addXP: ${e}`); }
}

export async function refreshStreak(): Promise<Result<number>> {
  try { return ok(await updateStreak()); }
  catch (e) { return err(`refreshStreak: ${e}`); }
}

export async function getWeeklyStats(): Promise<Result<{ day: string; count: number }[]>> {
  try { return ok(await getWeeklyActivity()); }
  catch (e) { return err(`getWeeklyStats: ${e}`); }
}

export async function getRetention(): Promise<Result<number>> {
  try { return ok(await getRetentionRate()); }
  catch (e) { return err(`getRetention: ${e}`); }
}

// ─── Cards (user-state side) ─────────────────────────────────────────────────

/**
 * Returns cards that are due for review from the user's local state.
 * These still include content fields (legacy schema — Phase 0 not yet split).
 */
export async function getDue(limit?: number, level?: string): Promise<Result<Card[]>> {
  try { return ok(await getDueCards(limit, undefined, level)); }
  catch (e) { return err(`getDue: ${e}`); }
}

export async function scheduleCard(
  id: string,
  fsrsState: string,
  dueDate: string,
): Promise<Result<void>> {
  try {
    await updateCardFsrs(id, fsrsState, dueDate);
    return ok(undefined);
  } catch (e) {
    return err(`scheduleCard: ${e}`);
  }
}

export async function recordReview(
  cardId: string,
  rating: number,
  mode: string,
  xpEarned: number,
): Promise<Result<void>> {
  try {
    await insertReview(cardId, rating, mode, xpEarned);
    return ok(undefined);
  } catch (e) {
    return err(`recordReview: ${e}`);
  }
}
