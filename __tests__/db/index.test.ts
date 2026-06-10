import { getDatabase, getUserProgress, writeProgressSnapshot } from '../../db';

describe('Database Layer', () => {
  it('returns empty progress snapshot on a fresh DB', async () => {
    const progress = await getUserProgress();
    expect(Array.isArray(progress.progress)).toBe(true);
    expect(progress.streak.days).toBe(0);
    // XP / level scalars must not leak back into the client shape.
    expect((progress as any).xpTotal).toBeUndefined();
    expect((progress as any).level).toBeUndefined();
  });

  it('round-trips a server progress snapshot through the local cache', async () => {
    await writeProgressSnapshot({
      progress: [
        { level_id: 'n5', skill_id: 'vocab', mastered_units: 12, total_units: 100,
          mastery_ratio: 0.12, last_review_at: '2026-06-10T12:00:00Z' },
      ],
      streak: { days: 3, last_review_at: '2026-06-10T12:00:00Z' },
    });
    const back = await getUserProgress();
    expect(back.progress[0]).toMatchObject({ level_id: 'n5', skill_id: 'vocab', mastered_units: 12 });
    expect(back.streak.days).toBe(3);
  });

  it('should get a database connection', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(typeof db.execAsync).toBe('function');
  });
});
