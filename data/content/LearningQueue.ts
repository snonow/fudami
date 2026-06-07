/**
 * LearningQueue — cross-DB recommendation engine.
 *
 * Combines two data sources:
 *   • content.db  — learning_order (topological graph, what to learn next)
 *   • caller      — set of already-seen card IDs (from fudami.db)
 *
 * This module is intentionally stateless and pure: it takes the seen IDs
 * as a parameter so it never touches fudami.db directly. The coordinator
 * (ContentRepository) is responsible for fetching those IDs.
 */

import { Result } from '../Result';
import type { VocabCard, JLPTLevel, ContentError } from './types';
import { queryOrderedVocab } from './ContentDB';

export interface QueueOptions {
  level: JLPTLevel;
  limit: number;
  /** IDs already seen in the user's card table — will be excluded. */
  seenIds?: string[];
}

/**
 * Return the next `limit` vocab cards the user should learn, in graph order.
 * Already-seen cards are skipped.
 *
 * Falls back to frequency-ordered vocab if learning_order is empty
 * (packs built before Phase 1 won't have the table populated).
 */
export async function getNextToLearn(
  opts: QueueOptions,
): Promise<Result<VocabCard[], ContentError>> {
  const { level, limit, seenIds = [] } = opts;
  return queryOrderedVocab(level, limit, seenIds);
}
