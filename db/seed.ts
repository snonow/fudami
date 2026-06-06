import { getDatabase } from './schema';
import { createNewCard, serializeCard } from '../engine/fsrs';
import vocabN5 from '../assets/jmdict/vocab_n5.json';

export async function seedIfNeeded(): Promise<void> {
  const db = await getDatabase();

  const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cards');
  if ((existing?.count ?? 0) > 0) return;

  const now = new Date().toISOString();
  const fsrsCard = createNewCard();
  const fsrs_state = serializeCard(fsrsCard);

  await db.withTransactionAsync(async () => {
    for (const word of vocabN5) {
      await db.runAsync(
        `INSERT OR IGNORE INTO cards (id, type, front_kanji, front_kana, back, level, fsrs_state, due_date, created_at)
         VALUES (?, 'vocab', ?, ?, ?, 'n5', ?, ?, ?)`,
        [word.id, word.front_kanji, word.front_kana, word.back, fsrs_state, now, now]
      );
    }
  });
}
