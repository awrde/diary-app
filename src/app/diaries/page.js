'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar, Search, Filter, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import DiaryCard from '@/components/DiaryCard';
import AnalysisModal from '@/components/AnalysisModal';
import styles from './page.module.css';

const months = [
    '전체', '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
];

// 감정 이모티콘 분류
function getEmotionType(score) {
    if (score.positive >= 70) return 'happy';
    if (score.positive >= 50) return 'good';
    if (score.negative >= 40) return 'sad';
    return 'neutral';
}

const emotionLabels = {
    happy: { emoji: '😊', label: '행복' },
    good: { emoji: '🙂', label: '좋음' },
    sad: { emoji: '😔', label: '우울' },
    neutral: { emoji: '😐', label: '보통' }
};

export default function DiariesPage() {
    const { diaries } = useDiary();
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMonth, setSelectedMonth] = useState('전체');
    const [sortOrder, setSortOrder] = useState('newest');
    const [selectedEmotion, setSelectedEmotion] = useState('전체');
    const [showScrollButtons, setShowScrollButtons] = useState(false);

    // 스크롤 감지하여 버튼 표시 여부 결정
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollButtons(window.scrollY > 300);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    // 필터링 및 정렬된 일기 목록
    const filteredDiaries = useMemo(() => {
        let result = [...diaries];

        // 월별 필터링
        if (selectedMonth !== '전체') {
            const monthNum = months.indexOf(selectedMonth);
            result = result.filter(diary => {
                const date = new Date(diary.date);
                return date.getMonth() + 1 === monthNum;
            });
        }

        // 검색어 필터링
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(diary =>
                diary.content.toLowerCase().includes(query) ||
                diary.analysis.summary.toLowerCase().includes(query)
            );
        }

        // 감정 필터링
        if (selectedEmotion !== '전체') {
            result = result.filter(diary =>
                getEmotionType(diary.analysis.emotionalScore) === selectedEmotion
            );
        }

        // 정렬
        result.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [diaries, selectedMonth, searchQuery, selectedEmotion, sortOrder]);

    // 월별 일기 수 계산
    const monthStats = useMemo(() => {
        const stats = {};
        diaries.forEach(diary => {
            const date = new Date(diary.date);
            const month = date.getMonth() + 1;
            stats[month] = (stats[month] || 0) + 1;
        });
        return stats;
    }, [diaries]);

    // 감정 통계 (월별/검색어 필터링만 적용된 일기 기준)
    const emotionStats = useMemo(() => {
        const stats = { happy: 0, good: 0, sad: 0, neutral: 0 };

        let targetDiaries = [...diaries];
        if (selectedMonth !== '전체') {
            const monthNum = months.indexOf(selectedMonth);
            targetDiaries = targetDiaries.filter(diary => {
                const date = new Date(diary.date);
                return date.getMonth() + 1 === monthNum;
            });
        }
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            targetDiaries = targetDiaries.filter(diary =>
                diary.content.toLowerCase().includes(query) ||
                diary.analysis.summary.toLowerCase().includes(query)
            );
        }

        targetDiaries.forEach(diary => {
            const type = getEmotionType(diary.analysis.emotionalScore);
            stats[type]++;
        });
        return stats;
    }, [diaries, selectedMonth, searchQuery]);

    const handleEmotionToggle = (emotion) => {
        if (selectedEmotion === emotion) {
            setSelectedEmotion('전체');
        } else {
            setSelectedEmotion(emotion);
        }
    };

    return (
        <div className={styles.diariesPage}>
            <header className="page-header">
                <h1 className="page-title">전체 일기</h1>
                <p className="page-subtitle">지금까지 작성한 모든 일기를 확인하세요</p>
            </header>

            <div className={styles.toolbar}>
                <div className={styles.searchBox}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="일기 내용 검색..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filters}>
                    <div className={styles.filterGroup}>
                        <Filter size={16} />
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className={styles.select}
                        >
                            {months.map(month => (
                                <option key={month} value={month}>
                                    {month} {month !== '전체' && monthStats[months.indexOf(month)]
                                        ? `(${monthStats[months.indexOf(month)]})`
                                        : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={styles.filterGroup}>
                        <ChevronDown size={16} />
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={styles.select}
                        >
                            <option value="newest">최신순</option>
                            <option value="oldest">오래된순</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className={styles.statsBar}>
                <span>📝 총 {diaries.length}개 일기</span>
                <span>🔍 검색 결과: {filteredDiaries.length}개</span>
                <div className={styles.emotionMini}>
                    <button
                        className={`${styles.emotionMiniItem} ${styles.allEmotion} ${selectedEmotion === '전체' ? styles.active : ''}`}
                        onClick={() => setSelectedEmotion('전체')}
                    >
                        전체
                    </button>
                    {Object.entries(emotionStats).map(([key, count]) => (
                        count > 0 && (
                            <button
                                key={key}
                                className={`${styles.emotionMiniItem} ${selectedEmotion === key ? styles.active : ''}`}
                                onClick={() => handleEmotionToggle(key)}
                            >
                                {emotionLabels[key].emoji} {count}
                            </button>
                        )
                    ))}
                </div>
            </div>

            <div className={styles.diariesGrid}>
                {filteredDiaries.map(diary => (
                    <DiaryCard
                        key={diary.id}
                        diary={diary}
                        onClick={() => setSelectedDiary(diary)}
                        onEmotionClick={() => handleEmotionToggle(getEmotionType(diary.analysis.emotionalScore))}
                    />
                ))}
            </div>

            {filteredDiaries.length === 0 && (
                <div className={styles.noData}>
                    <Calendar size={48} />
                    <p>검색 결과가 없습니다.</p>
                </div>
            )}

            {selectedDiary && (
                <AnalysisModal
                    diary={selectedDiary}
                    onClose={() => setSelectedDiary(null)}
                />
            )}

            {/* 플로팅 이동 버튼 */}
            <div className={`${styles.floatingScroll} ${showScrollButtons ? styles.visible : ''}`}>
                <button
                    onClick={scrollToTop}
                    className={styles.floatButton}
                    title="맨 위로"
                >
                    <ArrowUp size={24} />
                </button>
                <button
                    onClick={scrollToBottom}
                    className={styles.floatButton}
                    title="맨 아래로"
                >
                    <ArrowDown size={24} />
                </button>
            </div>
        </div>
    );
}
