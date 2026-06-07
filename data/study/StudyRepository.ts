import { getDatabase } from '../../db';
import * as ContentRepository from '../content/ContentRepository';
import { StudyCard, CardProgress } from './types';
import { Result, ok, err } from '../Result';
import { ContentError, VocabCard } from '../content/types';

/**
 * Le StudyRepository orchestre la fusion entre :
 * 1. Le Contenu (Pack immuable via ContentRepository)
 * 2. Le Progrès (DB locale fudami.db)
 * 
 * Il garantit que le contenu n'est jamais modifié, seul le progrès l'est.
 */

export async function getDueStudyCards(limit = 20): Promise<Result<StudyCard[], ContentError>> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  // 1. On récupère les IDs et le progrès des cartes dues depuis la DB locale
  // Note: On inclut les cartes avec reviews existantes (due_date <= now)
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
  
  // 1. On récupère les IDs des cartes qui n'ont jamais été révisées
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

/** Helper pour fusionner les lignes de progrès avec le contenu du Pack */
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
      // Si une carte est dans notre DB locale mais absente du pack (ex: pack mis à jour)
      // On log et on ignore pour l'instant, ou on pourrait la supprimer de la DB locale.
      console.warn(`[StudyRepository] Content not found for card ${row.id}`);
    }
  }

  return ok(studyCards);
}
