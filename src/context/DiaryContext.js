'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { mockDiaries, defaultWeights } from '@/lib/mockData';
import { analyzeDiaryWithGemini } from '@/lib/gemini';

const DiaryContext = createContext();
const DEFAULT_USER_ID = 'local-user';

export function DiaryProvider({ children }) {
    // 실시간 DB 쿼리 (Dexie)
    const diaries = useLiveQuery(() => db.diaries.orderBy('date').reverse().toArray(), [], []);
    const settingsQueryResult = useLiveQuery(() => db.settings.get('default'));

    // 설정 상태 관리
    const [settings, setSettings] = useState({
        personality: 'warm_companion',
        debugMode: false,
        geminiApiKey: '',
        selectedModel: 'gemini-2.0-flash',
        plan: 'free',
        forceLimit: false,
        weights: defaultWeights // weights 필드 명시적으로 추가
    });

    // 개발자 전역 API 키 (실제 배포 시 환경 변수나 보안 저장소로 관리 필요)
    const DEVELOPER_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    // DB에서 설정 로드되면 동기화
    useEffect(() => {
        if (settingsQueryResult) {
            setSettings(settingsQueryResult);
        }
    }, [settingsQueryResult]);

    // 초기 데이터 마이그레이션 (DB 비었을 때만)
    useEffect(() => {
        const initDB = async () => {
            try {
                const count = await db.diaries.count();
                if (count === 0) {
                    const localData = typeof window !== 'undefined' ? localStorage.getItem('ai-diary-data') : null;
                    if (localData) {
                        try {
                            const parsed = JSON.parse(localData);
                            if (Array.isArray(parsed)) {
                                await db.diaries.bulkAdd(parsed);
                            }
                        } catch (e) {
                            console.error('Migration failed', e);
                            await db.diaries.bulkAdd(mockDiaries);
                        }
                    } else {
                        await db.diaries.bulkAdd(mockDiaries);
                    }
                }

                const settingsCount = await db.settings.count();
                if (settingsCount === 0) {
                    await db.settings.put({
                        id: 'default',
                        personality: 'warm_companion',
                        weights: defaultWeights,
                        debugMode: false,
                        geminiApiKey: '',
                        selectedModel: 'gemini-2.0-flash',
                        plan: 'free'
                    });
                }
            } catch (err) {
                console.error('DB Initialization failed:', err);
            }
        };
        initDB();
    }, []);

    const checkUsageLimit = (allDiaries) => {
        if (settings.forceLimit) {
            return {
                canWrite: false,
                reason: `[테스트] 최근 2개월간 최대 작성 가능 횟수(100회)를 초과했습니다.`,
                count: 100
            };
        }
        if (!allDiaries || allDiaries.length === 0) return { canWrite: true };

        const MAX_FREE_DIARIES = 100;
        const TWO_MONTHS_MS = 2 * 30 * 24 * 60 * 60 * 1000;
        const now = new Date();
        const twoMonthsAgo = new Date(now.getTime() - TWO_MONTHS_MS);

        // 최근 2개월간 작성된 일기 필터링
        const recentDiaries = allDiaries.filter(d => new Date(d.date) >= twoMonthsAgo);

        if (recentDiaries.length >= MAX_FREE_DIARIES) {
            return {
                canWrite: false,
                reason: `최근 2개월간 최대 작성 가능 횟수(${MAX_FREE_DIARIES}회)를 초과했습니다.`,
                count: recentDiaries.length
            };
        }

        return { canWrite: true, count: recentDiaries.length };
    };

    const addDiary = async (diary) => {
        const usage = checkUsageLimit(diaries);
        let analysis;
        const effectiveApiKey = settings.geminiApiKey || DEVELOPER_API_KEY;

        if (settings.plan === 'free' && !usage.canWrite) {
            analysis = generateMockAnalysis(diary.content, { weather: diary.weather, sleepHours: diary.sleepHours });
        } else if (effectiveApiKey) {
            try {
                analysis = await analyzeDiaryWithGemini(
                    diary.content,
                    effectiveApiKey,
                    diary.personality || settings.personality,
                    settings.selectedModel,
                    { weather: diary.weather, sleepHours: diary.sleepHours }
                );
            } catch (err) {
                console.error('Gemini analysis failed, falling back to mock', err);
                analysis = generateMockAnalysis(diary.content, { weather: diary.weather, sleepHours: diary.sleepHours });
            }
        } else {
            analysis = generateMockAnalysis(diary.content, { weather: diary.weather, sleepHours: diary.sleepHours });
        }

        const now = new Date().toISOString();
        const newDiary = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0],
            userId: diary.userId || DEFAULT_USER_ID,
            updatedAt: now,
            ...diary,
            analysis
        };
        await db.diaries.add(newDiary);
        return newDiary;
    };

    const updateDiary = async (id, updates) => {
        const numId = parseInt(id);
        const targetDiary = await db.diaries.get(numId);

        if (!targetDiary) return null;

        const contentToAnalyze = updates.content || targetDiary.content;
        const personalityToUse = updates.personality || targetDiary.personality || settings.personality;
        const weatherToUse = updates.weather !== undefined ? updates.weather : targetDiary.weather;
        const sleepToUse = updates.sleepHours !== undefined ? updates.sleepHours : targetDiary.sleepHours;

        let newAnalysis;
        const effectiveApiKey = settings.geminiApiKey || DEVELOPER_API_KEY;

        const usage = checkUsageLimit(diaries);
        if (settings.plan === 'free' && !usage.canWrite) {
            newAnalysis = generateMockAnalysis(contentToAnalyze, { weather: weatherToUse, sleepHours: sleepToUse });
        } else if (effectiveApiKey) {
            try {
                newAnalysis = await analyzeDiaryWithGemini(
                    contentToAnalyze,
                    effectiveApiKey,
                    personalityToUse,
                    settings.selectedModel,
                    { weather: weatherToUse, sleepHours: sleepToUse }
                );
            } catch (err) {
                console.error('Gemini analysis failed, falling back to mock', err);
                newAnalysis = generateMockAnalysis(contentToAnalyze, { weather: weatherToUse, sleepHours: sleepToUse });
            }
        } else {
            newAnalysis = generateMockAnalysis(contentToAnalyze, { weather: weatherToUse, sleepHours: sleepToUse });
        }

        const updatedDiary = {
            ...targetDiary,
            ...updates,
            userId: targetDiary.userId || DEFAULT_USER_ID,
            updatedAt: new Date().toISOString(),
            analysis: newAnalysis
        };

        await db.diaries.put(updatedDiary);
        return updatedDiary;
    };

    // **삭제 기능 복구** (안전한 로직으로)
    const deleteDiary = async (id) => {
        try {
            // 숫자/문자 ID 모두 삭제 시도 (DB 무결성 보장)
            await db.diaries.delete(Number(id));
            if (String(id) !== String(Number(id))) {
                await db.diaries.delete(String(id));
            }
        } catch (e) {
            console.error('Delete failed:', e);
            throw e;
        }
    };

    const updateSettings = async (newSettings) => {
        const updated = { ...settings, ...newSettings, id: 'default' };
        setSettings(updated);
        await db.settings.put(updated);
    };

    const safeDiaries = diaries || [];

    const getLatestDiary = () => safeDiaries[0] || null;
    const getWeeklyDiaries = () => safeDiaries.slice(0, 7);

    const getWeightedScore = (diary) => {
        if (!diary || !diary.analysis || !diary.analysis.metricScores) return 0;

        const scores = diary.analysis.metricScores;
        const weights = settings.weights;
        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(weights).forEach(key => {
            if (scores[key] !== undefined) {
                totalScore += scores[key] * weights[key];
                totalWeight += weights[key];
            }
        });

        return totalWeight > 0 ? (totalScore / totalWeight).toFixed(1) : 0;
    };

    const withDefaults = (entries) => {
        const now = new Date().toISOString();
        return entries.map(item => ({
            ...item,
            userId: item.userId || DEFAULT_USER_ID,
            updatedAt: item.updatedAt || now
        }));
    };

    const resetToMockData = async () => {
        await db.diaries.clear();
        await db.diaries.bulkAdd(withDefaults(mockDiaries));
        const defaultSet = { id: 'default', personality: 'warm_companion', weights: defaultWeights };
        await db.settings.put(defaultSet);
        setSettings(defaultSet);
    };

    const importAllData = async (data) => {
        try {
            if (!data.diaries || !Array.isArray(data.diaries)) throw new Error('Invalid backup data');

            await db.diaries.clear();
            await db.diaries.bulkAdd(withDefaults(data.diaries));

            if (data.settings) {
                await db.settings.put({ ...data.settings, id: 'default' });
                setSettings(data.settings);
            }
            return true;
        } catch (err) {
            console.error('Import failed:', err);
            return false;
        }
    };

    // 증분 동기화: updatedAt 기준으로 특정 시점 이후 변경분만 추출
    const getSyncPayload = (sinceISOString) => {
        const since = sinceISOString ? new Date(sinceISOString).getTime() : 0;
        const changedDiaries = safeDiaries.filter(d => {
            if (!d.updatedAt) return true;
            const t = new Date(d.updatedAt).getTime();
            return t > since;
        });
        return {
            diaries: changedDiaries,
            settings
        };
    };

    // 외부 동기화 패치 적용: userId 매핑을 현재 사용자 ID로 덮어쓰는 옵션 포함
    const applySyncPatch = async (patch, currentUserId = DEFAULT_USER_ID) => {
        if (!patch || !patch.diaries || !Array.isArray(patch.diaries)) return false;

        const normalized = patch.diaries.map(d => ({
            ...d,
            userId: currentUserId || d.userId || DEFAULT_USER_ID,
            updatedAt: d.updatedAt || new Date().toISOString()
        }));

        await db.diaries.bulkPut(normalized);

        if (patch.settings) {
            const mergedSettings = { ...settings, ...patch.settings, id: 'default' };
            await db.settings.put(mergedSettings);
            setSettings(mergedSettings);
        }
        return true;
    };

    const clearAllData = async () => {
        await db.diaries.clear();
        // Keep settings but allow resetting them separately
    };

    return (
        <DiaryContext.Provider value={{
            diaries: safeDiaries,
            settings,
            addDiary,
            updateDiary,
            deleteDiary,
            updateSettings,
            getLatestDiary,
            getWeeklyDiaries,
            getWeightedScore,
            resetToMockData,
            importAllData,
            getSyncPayload,
            applySyncPatch,
            clearAllData,
            checkUsageLimit
        }}>
            {children}
        </DiaryContext.Provider>
    );
}

export function useDiary() {
    const context = useContext(DiaryContext);
    if (!context) {
        throw new Error('useDiary must be used within a DiaryProvider');
    }
    return context;
}

// ============================================
// AI Analysis Logic (Preserved)
// ============================================

function generateMockAnalysis(content, extraData = {}) {
    const positiveWords = [
        '좋', '행복', '성공', '즐거', '기쁘', '감사', '사랑', '뿌듯', '상쾌', '만족',
        '신나', '최고', '훌륭', '보람', '기대', '감동', '편안', '아늑', '활기', '열정',
        '희망', '운', '럭키', '득템', '맛있', '꿀맛', '힐링', '성취', '성장', '발전',
        '웃음', '미소', '산뜻', '개운', '맑', '따뜻', '포근', '평화', '여유', '달콤',
        '흥미', '재미', '멋진', '대단', '인정', '칭찬', '선물', '행운', '설레'
    ];
    const negativeWords = [
        '스트레스', '힘들', '슬프', '걱정', '불안', '싫', '나쁘', '피곤', '짜증', '우울',
        '화가', '분노', '절망', '포기', '실패', '망했', '엉망', '최악', '끔찍', '고통',
        '아파', '아프', '병', '지겹', '심심', '따분', '답답', '막막', '눈물', '울고',
        '속상', '서운', '억울', '멍', '후회', '죄책감', '비참', '초라', '외로', '고독',
        '허무', '무기력', '귀찮', '긴장', '공포', '무서', '씁쓸', '멘붕', '충격'
    ];
    const moneyWords = ['투자', '자산', '돈', '매매', '증시', '관세', '주식', '경제', '재태크', '금전', '비트코인', '수익', '본전'];
    const healthWords = ['운동', '조깅', '헬스', '산책', '건강', '잠', '수면', '팔굽혀펴기', '몸'];
    const relationshipWords = ['친구', '가족', '동료', '만남', '대화', '사람', '약속'];
    const workWords = ['업무', '회사', '일', '프로젝트', '미팅', '회의', '공부', '스터디', '개발', '코딩'];
    const hobbyWords = ['취미', '게임', '영화', '책', '음악', '그림', '요리', '넷플릭스', '드라마', '롤체'];

    // 1. 단어 빈도수 카운트
    const countMatches = (words) => words.reduce((cnt, w) => cnt + (content.includes(w) ? 1 : 0), 0);

    const scores = {
        money: countMatches(moneyWords),
        health: countMatches(healthWords),
        relationship: countMatches(relationshipWords),
        work: countMatches(workWords),
        hobby: countMatches(hobbyWords)
    };

    // 가장 많이 언급된 주제 찾기
    const dominantCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    const maxScore = scores[dominantCategory];

    // 감정 분석 (0점 시작)
    let positive = 0;
    let negative = 0;
    positiveWords.forEach(word => { if (content.includes(word)) positive += 8; });
    negativeWords.forEach(word => { if (content.includes(word)) negative += 8; });

    // 동적 요약 생성 로직
    let generatedSummary = '';

    if (maxScore > 0) {
        switch (dominantCategory) {
            case 'money':
                generatedSummary = '투자와 자산 관리에 깊은 관심을 기울이며 미래를 위한 계획을 세운 하루였습니다.';
                break;
            case 'work':
                generatedSummary = '업무나 학습에 몰입하며 목표를 향해 나아가는, 성취감 있는 하루를 보냈습니다.';
                break;
            case 'relationship':
                generatedSummary = '소중한 사람들과의 교류를 통해 에너지와 즐거움을 얻은 하루였습니다.';
                break;
            case 'health':
                generatedSummary = '건강의 중요성을 잊지 않고 신체를 단련하며 활력을 찾은 하루였습니다.';
                break;
            case 'hobby':
                generatedSummary = '좋아하는 취미 활동을 즐기며 일상 속의 즐거움과 여유를 만끽했습니다.';
                break;
        }
    } else {
        if (positive >= 30) generatedSummary = '긍정적인 마음으로 다양한 경험을 즐긴 기분 좋은 하루였습니다.';
        else if (negative >= 30) generatedSummary = '다소 지치고 힘든 순간이 있었지만, 잘 이겨내며 하루를 마무리했습니다.';
        else generatedSummary = '차분한 마음으로 일상을 기록하며 하루를 되돌아보았습니다.';
    }

    const baseScore = positive > 60 ? 4 : positive > 40 ? 3 : 2;

    return {
        summary: generatedSummary,
        emotionalScore: {
            positive,
            negative: Math.max(0, negative),
            neutral: 0
        },
        metricScores: {
            health: scores.health > 0 ? Math.min(5, baseScore + 1 + Math.floor(scores.health / 2)) : baseScore,
            money: scores.money > 0 ? Math.min(5, baseScore + 1 + Math.floor(scores.money / 2)) : baseScore,
            relationship: scores.relationship > 0 ? Math.min(5, baseScore + 1) : baseScore,
            growth: scores.work > 0 ? Math.min(5, baseScore + 1) : baseScore,
            rest: baseScore,
            hobby: scores.hobby > 0 ? Math.min(5, baseScore + 1) : baseScore,
            work: scores.work > 0 ? Math.min(5, baseScore + 1) : baseScore
        },
        feedback: generateFeedback(positive, negative, content, dominantCategory, extraData)
    };
}

function generateFeedback(positive, negative, content, category, extraData = {}) {
    let feedback = '';
    const { weather, sleepHours } = extraData;

    if (weather === '비' || weather === 'Rainy') {
        feedback += '비가 오는 날이네요. 차분한 빗소리와 함께 마음을 정리하기 좋은 시간입니다. ';
    } else if (weather === '눈' || weather === 'Snowy') {
        feedback += '새하얀 눈이 내리는 풍경이 마음을 설레게 하네요. ';
    } else if (weather === '맑음' || weather === 'Sunny') {
        feedback += '맑은 날씨 덕분에 기분까지 상쾌해지는 하루였을 것 같아요. ';
    }

    if (sleepHours && sleepHours < 6) {
        feedback += '수면 시간이 다소 부족해 보여요. 오늘은 조금 더 일찍 잠자리에 들어 에너지를 충전해보는 건 어럴까요? ';
    } else if (sleepHours && sleepHours >= 8) {
        feedback += '충분한 수면을 취하셨군요! 개운한 몸과 마음이 글에서도 느껴집니다. ';
    }

    if (category === 'money') {
        return feedback + '경제적 자유를 향한 꾸준한 관심과 노력이 돋보입니다. 등락에 일희일비하기보다 긴 호흡으로 자산을 운용해 나가는 지혜가 느껴집니다! 💰';
    }
    if (category === 'work' && negative > positive) {
        return feedback + '업무로 인해 고단한 하루였군요. 성취도 중요하지만, 번아웃이 오지 않도록 적절한 휴식 밸런스를 챙기는 것도 능력입니다. 수고 많으셨어요!';
    }
    if (category === 'health' && positive > negative) {
        return feedback + '몸과 마음을 건강하게 가꾸는 모습이 아름답습니다. 오늘의 땀방울이 내일 더 활기찬 에너지가 되어 돌아올 거예요! 💪';
    }

    const balance = positive - negative;

    if (balance >= 40) return feedback + '완벽에 가까운 하루네요! 긍정적인 에너지가 글 너머로도 전해집니다. 이 행복한 기분을 오래오래 간직하세요! 🎉';
    if (balance >= 15) return feedback + '기분 좋은 하루를 보내셨군요. 일상 속의 소소한 즐거움들이 모여 삶을 더욱 풍요롭게 만듭니다. 내일도 기대해봐요! 😊';
    if (positive >= 25 && negative >= 25) return feedback + '다사다난하고 치열한 하루였네요. 힘든 순간도 있었지만, 그 안에서 긍정적인 면을 찾아내려 노력한 당신이 정말 멋집니다. 👏';
    if (Math.abs(balance) < 15 && positive < 25 && negative < 25) return feedback + '잔잔하고 평온한 하루였습니다. 특별한 사건은 없어도, 이런 안온한 날들이 마음의 근육을 단단하게 만들어줍니다. ☕';
    if (balance <= -15 && balance > -40) return feedback + '마음이 조금 무거운 하루였나 봅니다. 오늘 같은 날은 스스로를 재촉하기보다, 잠시 멈춰 서서 내 마음을 돌보는 시간이 필요해요.';
    if (balance <= -40) return feedback + '정말 고생 많으셨습니다. 오늘은 그 누구보다 당신 자신을 위로해줘야 하는 날이에요. 따뜻한 이불 속에서 푹 쉬면서 지친 마음을 달래주세요. 💙';

    return feedback + (balance >= 0
        ? '무난하게 잘 마무리된 하루네요. 내일은 오늘보다 조금 더 웃을 일이 많기를 바랍니다!'
        : '조금 아쉬움이 남는 하루일 수 있지만, 내일은 새로운 기회가 기다리고 있습니다. 힘내세요!');
}
