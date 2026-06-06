import { getDatabase, getUserProgress, updateStreak } from '../../db';

describe('Database Layer', () => {
  it('should return default user progress when DB is empty', async () => {
    const progress = await getUserProgress();
    expect(progress.xpTotal).toBe(0);
    expect(progress.level).toBe(1);
    expect(progress.streakDays).toBe(0);
  });

  it('should update streak correctly', async () => {
    const streak = await updateStreak();
    expect(typeof streak).toBe('number');
  });

  it('should get a database connection', async () => {
    const db = await getDatabase();
    expect(db).toBeDefined();
    expect(typeof db.execAsync).toBe('function');
  });
});
