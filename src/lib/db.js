import Dexie from 'dexie';

export const db = new Dexie('AIDiaryDB');

db.version(1).stores({
    diaries: '++id, date', // id는 자동 증가, date로 조회 가능하게 인덱싱
    settings: 'id' // 설정 저장을 위한 테이블 (id='default' 하나만 사용)
});
