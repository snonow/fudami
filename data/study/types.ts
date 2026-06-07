import { VocabCard } from '../content/types';

/** 
 * État FSRS et données de planification pour une carte.
 * Ces données vivent dans la DB locale de l'utilisateur (fudami.db).
 */
export interface CardProgress {
  id: string;
  fsrs_state: string | null;
  due_date: string | null;
  created_at: string;
}

/** 
 * Une StudyCard est l'union du Contenu (du Pack) et du Progrès (de la DB Utilisateur).
 * C'est l'objet "Propre" utilisé par l'UI.
 */
export interface StudyCard {
  id: string;
  content: VocabCard;
  progress: CardProgress;
}
