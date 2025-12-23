import Dexie from 'dexie';

export const db = new Dexie('AIDiaryDB');

// v2: userId / updatedAt 인덱스 추가, 기존 데이터 마이그레이션
db.version(2)
  .stores({
    diaries: '++id, date, userId, updatedAt', // userId/updatedAt으로 동기화 확장 대비
    settings: 'id'
  })
  .upgrade(async (tx) => {
    try {
      const all = await tx.table('diaries').toArray();
      const DEFAULT_USER_ID = 'local-user';
      const now = new Date().toISOString();
      const updates = all
        .filter(d => !d.userId || !d.updatedAt)
        .map(d => ({
          ...d,
          userId: d.userId || DEFAULT_USER_ID,
          updatedAt: d.updatedAt || now
        }));
      if (updates.length > 0) {
        await tx.table('diaries').bulkPut(updates);
      }
    } catch (e) {
      console.error('Migration to v2 failed', e);
    }
  });
