import { VocabCard } from '../content/types';

/** 
 * FSRS state and scheduling data for a card.
 * This data lives in the user's local DB (fudami.db).
 */
export interface CardProgress {
  id: string;
  fsrs_state: string | null;
  due_date: string | null;
  created_at: string;
}

/** 
 * A StudyCard is the union of Content (from the Pack) and Progress (from the User DB).
 * This is the "Clean" object used by the UI.
 */
export interface StudyCard {
  id: string;
  content: VocabCard;
  progress: CardProgress;
}
