/** Domain types for the content layer (what comes OUT of a content pack). */

export type JLPTLevel = 'n5' | 'n4' | 'n3' | 'n2' | 'n1';

/** A vocabulary card — pure content, no FSRS state. */
export interface VocabCard {
  id: string;
  kanji: string | null;
  kana: string;
  level: JLPTLevel;
  meanings: string[];        // e.g. ["eat", "to eat (food)"]
  partsOfSpeech: string[];   // e.g. ["v1", "vt"]
}

/** A kanji entry from the content pack. */
export interface KanjiEntry {
  character: string;
  meanings: string[];
  readingsKun: string[];
  readingsOn: string[];
  level: JLPTLevel | null;
}

/** An example sentence from Tatoeba, linked to a vocab word. */
export interface Sentence {
  id: string;
  japanese: string;
  english: string | null;
  /**
   * All JLPT word IDs found in this sentence (pre-computed at ingestion).
   * Use for comprehensible-input (N+1) filtering:
   *
   *   const unknown = sentence.vocabIds.filter(id => !knownIds.has(id));
   *   const isIPlusOne = unknown.length === 1;     // one new word = perfect
   *   const targetWordId = unknown[0];             // the word to learn next
   *
   * Empty array = no JLPT vocabulary recognised (grammar/function-word sentence).
   */
  vocabIds: string[];
  /** Hardest JLPT level present ("n5"…"n1"), pre-computed for quick filtering. */
  jlptLevel: JLPTLevel | null;
}

/** A grammar point — the essence (structure + meaning), graph-linked to vocab. */
export interface GrammarPoint {
  id: string;
  structure: string;          // "〜なければなりません" / "Base verbale + ながら"
  meaningFr: string | null;   // short French gloss
  pattern: string | null;     // short construction hint
  level: JLPTLevel;
}

/** A node in the WaniKani-style learning graph. */
export interface LearningNode {
  entityId: string;
  entityType: 'radical' | 'kanji' | 'vocab';
  orderIndex: number;
  level: JLPTLevel | null;
}

/** The manifest shipped alongside the encrypted pack (unencrypted, public). */
export interface PackManifest {
  id: string;
  version: string;
  packFormat: number;
  buildDate: string;
  levels: JLPTLevel[];
  counts: { words: number; kanji: number; sentences: number; grammar: number };
  integrityHash: string;     // SHA-256 of the encrypted .pack file
}

/** Typed errors — never raw strings leaking to UI. */
export type ContentError =
  | { kind: 'PACK_NOT_FOUND' }
  | { kind: 'PACK_DECRYPT_FAILED'; reason: string }
  | { kind: 'PACK_INTEGRITY_FAILED' }
  | { kind: 'PACK_VERSION_MISMATCH'; got: string; want: string }
  | { kind: 'DB_QUERY_FAILED'; reason: string }
  | { kind: 'DOWNLOAD_FAILED'; reason: string }
  | { kind: 'NOT_INITIALIZED' };

export const contentErrorMessage = (e: ContentError): string => {
  switch (e.kind) {
    case 'PACK_NOT_FOUND':        return 'No content pack installed.';
    case 'PACK_DECRYPT_FAILED':   return `Decryption failed: ${e.reason}`;
    case 'PACK_INTEGRITY_FAILED': return 'Content pack is corrupted.';
    case 'PACK_VERSION_MISMATCH': return `Pack version ${e.got} is incompatible.`;
    case 'DB_QUERY_FAILED':       return `Database error: ${e.reason}`;
    case 'DOWNLOAD_FAILED':       return `Download failed: ${e.reason}`;
    case 'NOT_INITIALIZED':       return 'Content layer not yet initialized.';
  }
};
