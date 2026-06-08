import { getDatabase } from '../../db';
import * as ContentRepository from '../content/ContentRepository';
import { StudyCard, CardProgress } from './types';
import { Result, ok, err } from '../Result';
import { ContentError, VocabCard } from '../content/types';

/**
 * The StudyRepository orchestrates the fusion between:
 * 1. Content (Immutable Pack via ContentRepository)
 * 2. Progress (Local DB fudami.db)
 * 
 * It ensures that the content is never modified, only the progress is.
 */

export async function getDueStudyCards(limit = 20): Promise<Result<StudyCard[], ContentError>> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // 1. Retrieve IDs and progress for due cards from the local DB
  // Note: We include cards with existing reviews (due_date <= now)
  const rows = await db.getAllAsync<any>(
    `SELECT id, fsrs_state, due_date, created_at 
     FROM cards 
     WHERE due_date <= ? 
     AND EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id)
     ORDER BY due_date ASC LIMIT ?`,
    [now, limit]
  );

  return joinContentWithProgress(rows);
}

export async function getNewStudyCards(level: string, limit = 10): Promise<Result<StudyCard[], ContentError>> {
  const db = await getDatabase();
  
  // 1. Retrieve IDs for cards that have never been reviewed
  const rows = await db.getAllAsync<any>(
    `SELECT id, fsrs_state, due_date, created_at 
     FROM cards 
     WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE card_id = cards.id)
     AND level = ?
     LIMIT ?`,
    [level, limit]
  );

  return joinContentWithProgress(rows);
}

/** Helper to merge progress rows with Pack content */
async function joinContentWithProgress(progressRows: any[]): Promise<Result<StudyCard[], ContentError>> {
  const studyCards: StudyCard[] = [];

  for (const row of progressRows) {
    const contentResult = await ContentRepository.getVocabById(row.id);
    
    if (contentResult.ok) {
      studyCards.push({
        id: row.id,
        content: contentResult.data,
        progress: {
          id: row.id,
          fsrs_state: row.fsrs_state,
          due_date: row.due_date,
          created_at: row.created_at,
        }
      });
    } else {
      // If a card is in our local DB but missing from the pack (e.g., pack updated)
      // We log and ignore for now, or we could delete it from the local DB.
      console.warn(`[StudyRepository] Content not found for card ${row.id}`);
    }
  }

  return ok(studyCards);
}
