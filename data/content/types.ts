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
  /**
   * JMdict nf-frequency band (1–48). 1 = most frequent in news corpus.
   * NULL means the word isn't covered by JMdict's frequency data.
   * Use for display ("common word" badge) and learning-queue priority.
   * Lower number = higher priority. Set by the jmdict_nf Studio provider.
   */
  frequencyRank: number | null;
}

/** A kanji entry from the content pack. */
export interface KanjiEntry {
  character: string;
  meanings: string[];
  readingsKun: string[];
  readingsOn: string[];
  level: JLPTLevel | null;
  /**
   * KanjiVG stroke-order SVG markup (stored as a raw SVG string).
   * NULL until the kanjivg Studio provider has run.
   * Render with react-native-svg's SvgXml or a WebView for animations.
   */
  strokeOrderSvg: string | null;
}

/** An image linked to a content node (word, kanji, or sentence). */
export interface ContentImage {
  id: string;
  url: string;
  captionJa: string | null;
  /** Japanese keywords / aliases as a JSON array string from the DB. */
  keywordsJa: string[];
  source: 'wikidata' | 'stair' | 'dejima';
  license: string;
  /** Relevance weight 0–1. 1.0 = perfect match; 0.2 = loose association. */
  weight: number;
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
  meaningFr: string | null;   // short French gloss (legacy field, prefer explanation)
  pattern: string | null;     // short construction hint
  level: JLPTLevel;
  /** Explanation in the requested language (from grammar_translations). */
  explanation?: string | null;
}

/** A node in the WaniKani-style learning graph. */
export interface LearningNode {
  entityId: string;
  entityType: 'radical' | 'kanji' | 'vocab' | 'grammar';
  orderIndex: number;
  level: JLPTLevel | null;
}

/** The manifest shipped alongside the encrypted pack (unencrypted, public). */
export interface PackManifest {
  id: string;
  /** e.g. "n5-v3"  — used for update checks (compare installed vs remote). */
  packName: string;
  /** "n5" | "n4" | … — for per-level packs. */
  level?: JLPTLevel;
  version: string;
  /** 1 = raw sqlite after decrypt; 2 = zlib-compressed then AES-GCM. */
  packFormat: number;
  /** "zlib" when packFormat ≥ 2. */
  compression?: string;
  buildDate: string;
  /** For the full-DB (legacy) manifest only — list of levels included. */
  levels?: JLPTLevel[];
  counts: { words: number; kanji: number; sentences: number; grammar: number };
  sizes?: { dbBytes: number; compressedBytes: number; packBytes: number };
  integrityHash: string;
  /** Attribution strings for the "Sources & Credits" screen (legally required). */
  attribution?: string[];
  license?: string;
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
