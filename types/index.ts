export interface Card {
  id: string;
  front_kanji: string;
  front_kana: string;
  back: string;
  level: 'n5' | 'n4' | 'n3';
  fsrs_state?: string;
  due_date?: string;
  created_at: string;
}

export type ReviewMode = 'flip' | 'mcq' | 'typing';

export interface SessionState {
  isActive: boolean;
  cards: Card[];
  currentIndex: number;
  mode: ReviewMode;
  reviewedCount: number;
  goalValue: number;
  goalType: 'cards' | 'minutes';
  progress: number;
  lastModeByCardId: Record<string, ReviewMode>;
}

// ─── Progress layer (star schema, see /SEMANTIC_MODEL.md) ────────────────────

/** Canonical proficiency level. JLPT-keyed; aliased to CEFR/ACTFL in dim_level. */
export type LevelId = 'n5' | 'n4' | 'n3' | 'n2' | 'n1';

/** The 7 learning skills (3 knowledge atoms + 4 integrative competences). */
export type SkillId =
  | 'vocab' | 'kanji' | 'grammar'
  | 'reading' | 'listening' | 'writing' | 'speaking';

/** One cell of the (level × skill) matrix — server-authoritative. */
export interface SkillProgress {
  level_id:        LevelId;
  skill_id:        SkillId;
  mastered_units:  number;
  total_units:     number;
  mastery_ratio:   number;  // 0..1, computed by server
  last_review_at:  string | null;
}

/**
 * The user's progress snapshot. Aggregates (mastery_ratio, streak.days) are
 * computed server-side from the fact_review event log — never stored or
 * computed client-side. See /SEMANTIC_MODEL.md §4.
 */
export interface UserState {
  /** Last server snapshot of the user's progress matrix. */
  progress: SkillProgress[];
  /** Server-computed streak. */
  streak: { days: number; last_review_at: string | null };
}

/**
 * A single review event the client appends to the server log. Idempotent via
 * client_event_id. The client never sends aggregates.
 */
export interface ReviewEvent {
  client_event_id: string;       // UUID generated client-side
  unit_id:         string;       // 'word:1234567'
  rating:          1 | 2 | 3 | 4; // FSRS again|hard|good|easy
  duration_ms:     number;
  reviewed_at:     string;       // ISO-8601 UTC
  mastered_now?:   boolean;      // optional forward signal; server enforces monotonicity
}

export interface PathLevel {
  id: string;
  title: string;
  cardIds: string[];
  isCompleted: boolean;
  isLocked: boolean;
}
