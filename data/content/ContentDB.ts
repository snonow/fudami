/**
 * ContentDB — raw SQLite access on the content pack (content.db).
 *
 * Rules:
 *   - Read-only. Never writes to content.db.
 *   - Returns Result<T, ContentError> — never throws out.
 *   - Knows nothing about encryption, downloading, or user state.
 */

import * as SQLite from 'expo-sqlite';
import { Result, ok, err } from '../Result';
import type { VocabCard, KanjiEntry, JLPTLevel, ContentError, Sentence, LearningNode, GrammarPoint } from './types';
import { CONTENT_DB_NAME } from './PackLoader';

let _db: SQLite.SQLiteDatabase | null = null;

// ─── Connection ──────────────────────────────────────────────────────────────

export async function openContentDB(): Promise<Result<SQLite.SQLiteDatabase, ContentError>> {
  if (_db) return ok(_db);
  try {
    // Content DB is never written to by the app — ingestion is done in the Studio.
    _db = await SQLite.openDatabaseAsync(CONTENT_DB_NAME);
    return ok(_db);
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

export function closeContentDB(): void {
  if (!_db) return;
  _db.closeAsync().catch(() => {});
  _db = null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Fetch up to `limit` vocab entries for a JLPT level, ordered by frequency. */
export async function queryVocabForLevel(
  level: JLPTLevel,
  limit: number,
): Promise<Result<VocabCard[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<RawVocabRow>(
      `SELECT w.id, w.kanji, w.kana, w.jlpt_level,
              GROUP_CONCAT(DISTINCT s.pos)         AS pos,
              GROUP_CONCAT(g.definition, '||')     AS definitions
       FROM   words  w
       LEFT JOIN senses  s ON s.word_id  = w.id
       LEFT JOIN glosses g ON g.sense_id = s.id AND g.lang = 'eng'
       WHERE  w.jlpt_level = ?
       GROUP  BY w.id
       ORDER  BY w.commonality ASC
       LIMIT  ?`,
      [levelToInt(level), limit],
    );
    return ok(rows.map(rowToVocabCard));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch a single vocab entry by its JMdict ID. */
export async function queryVocabById(
  id: string,
): Promise<Result<VocabCard, ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const row = await dbResult.data.getFirstAsync<RawVocabRow>(
      `SELECT w.id, w.kanji, w.kana, w.jlpt_level,
              GROUP_CONCAT(DISTINCT s.pos)         AS pos,
              GROUP_CONCAT(g.definition, '||')     AS definitions
       FROM   words  w
       LEFT JOIN senses  s ON s.word_id  = w.id
       LEFT JOIN glosses g ON g.sense_id = s.id AND g.lang = 'eng'
       WHERE  w.id = ?
       GROUP  BY w.id`,
      [id],
    );
    if (!row) return err({ kind: 'PACK_NOT_FOUND' });
    return ok(rowToVocabCard(row));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Search vocab by kanji or kana prefix. */
export async function queryVocabSearch(
  query: string,
  limit = 20,
): Promise<Result<VocabCard[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const pattern = `${query}%`;
    const rows = await dbResult.data.getAllAsync<RawVocabRow>(
      `SELECT w.id, w.kanji, w.kana, w.jlpt_level,
              GROUP_CONCAT(DISTINCT s.pos)         AS pos,
              GROUP_CONCAT(g.definition, '||')     AS definitions
       FROM   words  w
       LEFT JOIN senses  s ON s.word_id  = w.id
       LEFT JOIN glosses g ON g.sense_id = s.id AND g.lang = 'eng'
       WHERE  (w.kanji LIKE ? OR w.kana LIKE ?)
       GROUP  BY w.id
       LIMIT  ?`,
      [pattern, pattern, limit],
    );
    return ok(rows.map(rowToVocabCard));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch a kanji entry by its character. */
export async function queryKanji(
  character: string,
): Promise<Result<KanjiEntry, ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const row = await dbResult.data.getFirstAsync<{
      character: string;
      meanings: string;
      readings_kun: string;
      readings_on: string;
      jlpt_level: number | null;
    }>('SELECT * FROM kanji WHERE character = ?', [character]);
    if (!row) return err({ kind: 'PACK_NOT_FOUND' });
    return ok({
      character: row.character,
      meanings:     splitPipe(row.meanings),
      readingsKun:  splitPipe(row.readings_kun),
      readingsOn:   splitPipe(row.readings_on),
      level: row.jlpt_level ? intToLevel(row.jlpt_level) : null,
    });
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch example sentences for a vocab word (from Tatoeba). */
export async function querySentencesForVocab(
  wordId: string,
  limit = 3,
): Promise<Result<Sentence[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<RawSentenceRow>(
      `SELECT s.id, s.japanese, s.english, s.vocab_ids, s.jlpt_level
       FROM sentences s
       JOIN word_sentences ws ON ws.sentence_id = s.id
       WHERE ws.word_id = ?
       LIMIT ?`,
      [wordId, limit],
    );
    return ok(rows.map(rowToSentence));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/**
 * Fetch sentences suitable for N+1 / comprehensible-input learning.
 *
 * Returns sentences where exactly `unknownCount` words from `vocab_ids`
 * are NOT in `knownWordIds`. Default unknownCount=1 = strict i+1.
 *
 * Implementation note: filtering is done in JS (not SQL) because `vocab_ids`
 * is a JSON array and SQLite JSON functions may not be available on all
 * Expo SQLite versions. The query fetches candidate sentences (those linked
 * to any word the learner knows) then filters in memory.
 */
export async function queryIPlusOneSentences(
  knownWordIds: string[],
  level: JLPTLevel,
  limit = 20,
  unknownCount = 1,
): Promise<Result<Sentence[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    if (knownWordIds.length === 0) return ok([]);
    const known = new Set(knownWordIds);
    // Fetch candidate sentences for this JLPT level
    const rows = await dbResult.data.getAllAsync<RawSentenceRow>(
      `SELECT DISTINCT s.id, s.japanese, s.english, s.vocab_ids, s.jlpt_level
       FROM sentences s
       WHERE s.jlpt_level = ?
         AND s.vocab_ids != '[]'
       LIMIT 2000`,
      [level],
    );
    const results: Sentence[] = [];
    for (const row of rows) {
      const ids: string[] = JSON.parse(row.vocab_ids ?? '[]');
      const unknown = ids.filter(id => !known.has(id));
      if (unknown.length === unknownCount) {
        results.push(rowToSentence(row));
        if (results.length >= limit) break;
      }
    }
    return ok(results);
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/**
 * Fetch vocab in learning-graph order (learning_order JOIN words).
 * Returns words for `level` sorted by their topological order_index.
 * Excludes word IDs in `excludeIds` (already seen by the user).
 */
export async function queryOrderedVocab(
  level: JLPTLevel,
  limit: number,
  excludeIds: string[] = [],
): Promise<Result<VocabCard[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const placeholders = excludeIds.length > 0
      ? `AND w.id NOT IN (${excludeIds.map(() => '?').join(',')})`
      : '';
    const params: (string | number)[] = [levelToInt(level), ...excludeIds, limit];
    const rows = await dbResult.data.getAllAsync<RawVocabRow>(
      `SELECT w.id, w.kanji, w.kana, w.jlpt_level,
              GROUP_CONCAT(DISTINCT s.pos)         AS pos,
              GROUP_CONCAT(g.definition, '||')     AS definitions
       FROM   learning_order lo
       JOIN   words  w ON w.id = lo.entity_id AND lo.entity_type = 'vocab'
       LEFT JOIN senses  s ON s.word_id  = w.id
       LEFT JOIN glosses g ON g.sense_id = s.id AND g.lang = 'eng'
       WHERE  w.jlpt_level = ? ${placeholders}
       GROUP  BY w.id
       ORDER  BY lo.order_index ASC
       LIMIT  ?`,
      params,
    );
    return ok(rows.map(rowToVocabCard));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch learning_order nodes for a given level (all entity types). */
export async function queryLearningNodes(
  level: JLPTLevel,
  limit = 500,
): Promise<Result<LearningNode[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<{
      entity_id: string;
      entity_type: string;
      order_index: number;
      jlpt_level: string | null;
    }>(
      `SELECT entity_id, entity_type, order_index, jlpt_level
       FROM learning_order
       WHERE jlpt_level = ? OR (entity_type = 'radical' AND jlpt_level IS NULL)
       ORDER BY order_index ASC
       LIMIT ?`,
      [level, limit],
    );
    return ok(rows.map(r => ({
      entityId:    r.entity_id,
      entityType:  r.entity_type as LearningNode['entityType'],
      orderIndex:  r.order_index,
      level:       (r.jlpt_level as JLPTLevel) ?? null,
    })));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

// ─── Grammar ──────────────────────────────────────────────────────────────────

const _ROW_TO_GRAMMAR = (r: RawGrammarRow, explanation?: string | null): GrammarPoint => ({
  id:          r.id,
  structure:   r.structure,
  meaningFr:   r.meaning_fr ?? null,
  pattern:     r.pattern ?? null,
  level:       intToLevel(r.jlpt_level),
  explanation: explanation ?? null,
});

/**
 * Fetch grammar points for a JLPT level, in learning-graph order if available.
 * Includes the explanation in `lang` from grammar_translations (falls back to 'en').
 */
export async function queryGrammarForLevel(
  level: JLPTLevel,
  limit = 200,
  lang = 'en',
): Promise<Result<GrammarPoint[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<RawGrammarRow & { explanation: string | null }>(
      `SELECT gp.id, gp.structure, gp.meaning_fr, gp.pattern, gp.jlpt_level,
              COALESCE(
                (SELECT text FROM grammar_translations WHERE grammar_id = gp.id AND lang = ?),
                (SELECT text FROM grammar_translations WHERE grammar_id = gp.id AND lang = 'en')
              ) AS explanation
       FROM   grammar_points gp
       LEFT JOIN learning_order lo
              ON lo.entity_id = gp.id AND lo.entity_type = 'grammar'
       WHERE  gp.jlpt_level = ?
       ORDER  BY COALESCE(lo.order_index, 999999) ASC
       LIMIT  ?`,
      [lang, levelToInt(level), limit],
    );
    return ok(rows.map(r => _ROW_TO_GRAMMAR(r, r.explanation)));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch the grammar points that a given vocab word is used in. */
export async function queryGrammarForWord(
  wordId: string,
  lang = 'en',
): Promise<Result<GrammarPoint[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<RawGrammarRow & { explanation: string | null }>(
      `SELECT gp.id, gp.structure, gp.meaning_fr, gp.pattern, gp.jlpt_level,
              COALESCE(
                (SELECT text FROM grammar_translations WHERE grammar_id = gp.id AND lang = ?),
                (SELECT text FROM grammar_translations WHERE grammar_id = gp.id AND lang = 'en')
              ) AS explanation
       FROM   grammar_vocab gv
       JOIN   grammar_points gp ON gp.id = gv.grammar_id
       WHERE  gv.word_id = ?`,
      [lang, wordId],
    );
    return ok(rows.map(r => _ROW_TO_GRAMMAR(r, r.explanation)));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

/** Fetch example sentences demonstrating a grammar point (from Tatoeba). */
export async function querySentencesForGrammar(
  grammarId: string,
  limit = 3,
): Promise<Result<Sentence[], ContentError>> {
  const dbResult = await openContentDB();
  if (!dbResult.ok) return dbResult;
  try {
    const rows = await dbResult.data.getAllAsync<RawSentenceRow>(
      `SELECT s.id, s.japanese, s.english, s.vocab_ids, s.jlpt_level
       FROM   grammar_sentences gs
       JOIN   sentences s ON s.id = gs.sentence_id
       WHERE  gs.grammar_id = ?
       LIMIT  ?`,
      [grammarId, limit],
    );
    return ok(rows.map(rowToSentence));
  } catch (e) {
    return err({ kind: 'DB_QUERY_FAILED', reason: String(e) });
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────

interface RawSentenceRow {
  id: string;
  japanese: string;
  english: string | null;
  vocab_ids: string | null;   // JSON array, e.g. '["1000010","1234567"]'
  jlpt_level: string | null;  // "n5"/"n4"/…/null
}

function rowToSentence(r: RawSentenceRow): import('./types').Sentence {
  return {
    id:        r.id,
    japanese:  r.japanese,
    english:   r.english ?? null,
    vocabIds:  JSON.parse(r.vocab_ids ?? '[]') as string[],
    jlptLevel: (r.jlpt_level as JLPTLevel) ?? null,
  };
}

interface RawVocabRow {
  id: string;
  kanji: string | null;
  kana: string;
  jlpt_level: number;
  pos: string | null;
  definitions: string | null;
}

interface RawGrammarRow {
  id: string;
  structure: string;
  meaning_fr: string | null;
  pattern: string | null;
  jlpt_level: number;
}

const LEVEL_MAP: Record<number, JLPTLevel> = { 1: 'n1', 2: 'n2', 3: 'n3', 4: 'n4', 5: 'n5' };

function levelToInt(level: JLPTLevel): number {
  return { n1: 1, n2: 2, n3: 3, n4: 4, n5: 5 }[level];
}
function intToLevel(n: number): JLPTLevel {
  return LEVEL_MAP[n] ?? 'n5';
}
function splitPipe(s: string | null): string[] {
  return s ? s.split('||').filter(Boolean) : [];
}
function rowToVocabCard(row: RawVocabRow): VocabCard {
  return {
    id:           row.id,
    kanji:        row.kanji ?? null,
    kana:         row.kana,
    level:        intToLevel(row.jlpt_level),
    meanings:     splitPipe(row.definitions),
    partsOfSpeech: (row.pos ?? '').split(',').filter(Boolean),
  };
}
