/**
 * ContentRepository — the ONLY surface the rest of the app touches for content.
 *
 * Abstraction contract:
 *   - Hides whether data comes from a content pack or the bundled seed.
 *   - Returns Result<T> everywhere — callers never need a try/catch.
 *   - Graceful degradation: if the pack isn't installed, transparently falls
 *     back to the bundled 50-word seed so the app keeps working.
 *
 * Nothing outside this file should import ContentDB or PackLoader directly.
 */

import { Result, ok, err } from '../Result';
import type { VocabCard, KanjiEntry, JLPTLevel, ContentError, PackManifest, Sentence, GrammarPoint, ContentImage } from './types';
import {
  queryVocabForLevel,
  queryVocabById,
  queryVocabSearch,
  queryKanji,
  querySentencesForVocab,
  queryIPlusOneSentences,
  queryGrammarForLevel,
  queryGrammarForWord,
  querySentencesForGrammar,
  queryImagesForWord,
  queryImagesForKanji,
  queryImageForSentence,
  openContentDB,
} from './ContentDB';
import { getNextToLearn } from './LearningQueue';
import {
  isContentDbInstalled,
  getInstalledManifest,
  installPackFromUrl,
} from './PackLoader';
import { PACK_URL } from '../../constants/pack';

// Bundled seed — always available, zero network needed
import seedRaw from '../../assets/jmdict/vocab_n5.json';

type SeedEntry = { id: string; front_kanji: string; front_kana: string; back: string };
const SEED = seedRaw as SeedEntry[];

function seedToCard(w: SeedEntry): VocabCard {
  return {
    id:            w.id,
    kanji:         w.front_kanji || null,
    kana:          w.front_kana,
    level:         'n5',
    meanings:      [w.back],
    partsOfSpeech: [],
    frequencyRank: null,  // seed has no frequency data
  };
}

// ─── State ───────────────────────────────────────────────────────────────────

type Source = 'pack' | 'seed' | 'uninitialized';
let _source: Source = 'uninitialized';

// ─── Initialization ──────────────────────────────────────────────────────────

/**
 * Call once at app startup (e.g. in _layout.tsx).
 * Resolves quickly: either opens the cached DB or falls back to seed.
 * Pack download (if needed) happens in the background — never blocks boot.
 */
export async function initContent(): Promise<Result<'pack' | 'seed', ContentError>> {
  // Fast path — content DB already on disk
  if (await isContentDbInstalled()) {
    const dbResult = await openContentDB();
    if (dbResult.ok) {
      _source = 'pack';
      return ok('pack');
    }
    // DB file exists but is unreadable — fall through to seed, attempt re-download
  }

  // Attempt background download if a URL is configured
  if (PACK_URL) {
    installPackFromUrl(PACK_URL).then((result) => {
      if (result.ok) {
        _source = 'pack';
        console.log('[ContentRepository] Pack installed in background.');
      } else {
        console.warn('[ContentRepository] Background pack install failed:', result.error);
      }
    });
  }

  // Seed fallback — app is fully functional right now
  _source = 'seed';
  return ok('seed');
}

export const contentSource = (): Source => _source;
export const isUsingPack   = (): boolean => _source === 'pack';

// ─── Vocab API ───────────────────────────────────────────────────────────────

export async function getVocabForLevel(
  level: JLPTLevel,
  limit: number,
): Promise<Result<VocabCard[], ContentError>> {
  if (_source === 'pack') return queryVocabForLevel(level, limit);

  if (_source === 'seed') {
    // Seed only has n5 — other levels return empty (app handles gracefully)
    if (level !== 'n5') return ok([]);
    return ok(SEED.slice(0, limit).map(seedToCard));
  }

  return err({ kind: 'NOT_INITIALIZED' });
}

export async function getVocabById(
  id: string,
): Promise<Result<VocabCard, ContentError>> {
  if (_source === 'pack') return queryVocabById(id);

  if (_source === 'seed') {
    const entry = SEED.find((w) => w.id === id);
    return entry ? ok(seedToCard(entry)) : err({ kind: 'PACK_NOT_FOUND' });
  }

  return err({ kind: 'NOT_INITIALIZED' });
}

export async function searchVocab(
  query: string,
  limit = 20,
): Promise<Result<VocabCard[], ContentError>> {
  if (_source === 'pack') return queryVocabSearch(query, limit);

  if (_source === 'seed') {
    const results = SEED
      .filter((w) => w.front_kanji?.includes(query) || w.front_kana.includes(query))
      .slice(0, limit)
      .map(seedToCard);
    return ok(results);
  }

  return err({ kind: 'NOT_INITIALIZED' });
}

// ─── Learning queue (Phase 3) ────────────────────────────────────────────────

/**
 * Return the next cards to learn in topological graph order.
 * `seenIds` should come from the user DB (cards already in fudami.db).
 * Falls back to frequency-ordered vocab for packs built before Phase 1.
 */
export async function getNextToLearnCards(
  level: JLPTLevel,
  limit: number,
  seenIds: string[] = [],
): Promise<Result<VocabCard[], ContentError>> {
  if (_source !== 'pack') return getVocabForLevel(level, limit);
  return getNextToLearn({ level, limit, seenIds });
}

/** Fetch example sentences for a vocab word (from Tatoeba, pack only). */
export async function getSentences(
  wordId: string,
  limit = 3,
): Promise<Result<Sentence[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return querySentencesForVocab(wordId, limit);
}

/**
 * Return sentences where exactly `unknownCount` words are unknown to the learner.
 * Default unknownCount=1 = strict i+1 (Krashen comprehensible input).
 *
 * `knownWordIds` should come from the user DB (cards already seen/learned).
 * Pack only — requires vocab_ids column built by the sentence-first tatoeba ingestion.
 *
 * Example:
 *   const result = await getIPlusOneSentences(userKnownIds, 'n5', 10);
 *   // Each sentence has exactly 1 word the learner doesn't know yet.
 */
export async function getIPlusOneSentences(
  knownWordIds: string[],
  level: JLPTLevel,
  limit = 20,
  unknownCount = 1,
): Promise<Result<Sentence[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return queryIPlusOneSentences(knownWordIds, level, limit, unknownCount);
}

// ─── Grammar API (Phase 2.5) ──────────────────────────────────────────────────

/** Grammar points for a level, in learning-graph order. Pack only. */
export async function getGrammarForLevel(
  level: JLPTLevel,
  limit = 200,
): Promise<Result<GrammarPoint[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return queryGrammarForLevel(level, limit);
}

/** Grammar points that build on a given vocab word (reinforced vocab node). */
export async function getGrammarForWord(
  wordId: string,
): Promise<Result<GrammarPoint[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return queryGrammarForWord(wordId);
}

/** Tatoeba example sentences demonstrating a grammar point. Pack only. */
export async function getGrammarSentences(
  grammarId: string,
  limit = 3,
): Promise<Result<Sentence[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return querySentencesForGrammar(grammarId, limit);
}

// ─── Image API ───────────────────────────────────────────────────────────────

/**
 * Best images for a vocabulary word, sorted by relevance weight.
 * Returns empty array if the images step hasn't run yet or no image was found.
 */
export async function getImagesForWord(
  wordId: string,
  limit = 3,
): Promise<Result<ContentImage[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return queryImagesForWord(wordId, limit);
}

/** Best images for a kanji character (concept illustration). */
export async function getImagesForKanji(
  character: string,
  limit = 2,
): Promise<Result<ContentImage[], ContentError>> {
  if (_source !== 'pack') return ok([]);
  return queryImagesForKanji(character, limit);
}

/** Best scene image matched to a Tatoeba sentence. Null if none found. */
export async function getImageForSentence(
  sentenceId: string,
): Promise<Result<ContentImage | null, ContentError>> {
  if (_source !== 'pack') return ok(null);
  return queryImageForSentence(sentenceId);
}

// ─── Kanji API ───────────────────────────────────────────────────────────────

export async function getKanji(
  character: string,
): Promise<Result<KanjiEntry, ContentError>> {
  if (_source === 'pack') return queryKanji(character);
  // Seed has no kanji entries
  return err({ kind: 'PACK_NOT_FOUND' });
}

// ─── Pack metadata ───────────────────────────────────────────────────────────

export async function getPackManifest(): Promise<PackManifest | null> {
  return getInstalledManifest();
}

export async function refreshPack(
  url: string = PACK_URL ?? '',
): Promise<Result<PackManifest, ContentError>> {
  if (!url) return err({ kind: 'DOWNLOAD_FAILED', reason: 'No pack URL configured.' });
  const result = await installPackFromUrl(url);
  if (result.ok) _source = 'pack';
  return result;
}
