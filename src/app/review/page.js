'use client';

import { useState, useMemo } from 'react';
import { Calendar, BarChart3, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { metrics } from '@/lib/mockData';
import MetricChart from '@/components/MetricChart';
import DiaryCard from '@/components/DiaryCard';
import AnalysisModal from '@/components/AnalysisModal';
import DatePickerModal from '@/components/DatePickerModal';
import styles from './page.module.css';

const periods = [
    { id: 'week', label: '주간', days: 7 },
    { id: 'month', label: '월간', days: 30 },
    { id: 'year', label: '연간', days: 365 }
];

// ISO 8601 주차 계산 (월요일 시작, 첫 목요일 포함 주가 1주차)
function getISOWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ISO 8601 주의 시작일(월요일)과 종료일(일요일) 계산
function getISOWeekRange(date) {
    const d = new Date(date);
    const dayOfWeek = d.getDay() || 7; // 월=1, 일=7

    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek + 1);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    return { start: monday, end: sunday };
}

// ISO 8601 주가 해당 월에서 몇 주차인지 계산
function getWeekOfMonthISO(date) {
    const d = new Date(date);
    // 해당 주의 목요일 기준으로 월 결정
    const thursday = new Date(d);
    thursday.setDate(d.getDate() + 4 - (d.getDay() || 7));

    const month = thursday.getMonth();
    const year = thursday.getFullYear();

    // 해당 월 1일이 속한 주의 목요일부터 카운트
    const firstOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstOfMonth.getDay() || 7;
    const firstThursday = new Date(year, month, 1 + (4 - firstDayOfWeek + 7) % 7);

    const weekNum = Math.floor((thursday - firstThursday) / (7 * 24 * 60 * 60 * 1000)) + 1;
    return { month, weekNum: Math.max(1, weekNum) };
}

function formatPeriodLabel(date, periodType) {
    const d = new Date(date);
    if (periodType === 'week') {
        const weekInfo = getWeekOfMonthISO(d);
        return `${d.getFullYear()}년 ${weekInfo.month + 1}월 ${weekInfo.weekNum}주차`;
    } else if (periodType === 'month') {
        return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
    } else {
        return `${d.getFullYear()}년`;
    }
}

function getDateRange(baseDate, periodType) {
    const d = new Date(baseDate);
    let start, end;

    if (periodType === 'week') {
        // ISO 8601: 월요일 ~ 일요일
        const range = getISOWeekRange(d);
        start = range.start;
        end = range.end;
    } else if (periodType === 'month') {
        start = new Date(d.getFullYear(), d.getMonth(), 1);
        end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    } else {
        start = new Date(d.getFullYear(), 0, 1);
        end = new Date(d.getFullYear(), 11, 31);
    }

    return { start, end };
}

function navigatePeriod(baseDate, periodType, direction) {
    const d = new Date(baseDate);
    if (periodType === 'week') {
        d.setDate(d.getDate() + (direction * 7));
    } else if (periodType === 'month') {
        d.setMonth(d.getMonth() + direction);
    } else {
        d.setFullYear(d.getFullYear() + direction);
    }
    return d;
}

export default function ReviewPage() {
    const { diaries } = useDiary();
    const [activePeriod, setActivePeriod] = useState('week');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedMetrics, setSelectedMetrics] = useState(['health', 'relationship', 'growth', 'work']);
    const [selectedDiary, setSelectedDiary] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // 현재 기간의 날짜 범위
    const dateRange = useMemo(() => {
        return getDateRange(currentDate, activePeriod);
    }, [currentDate, activePeriod]);

    // 선택된 기간에 따라 일기 필터링
    const filteredDiaries = useMemo(() => {
        return diaries.filter(diary => {
            const diaryDate = new Date(diary.date);
            return diaryDate >= dateRange.start && diaryDate <= dateRange.end;
        });
    }, [diaries, dateRange]);

    // 필터링된 일기로 차트 데이터 생성
    const chartData = useMemo(() => {
        const sorted = [...filteredDiaries].sort((a, b) => new Date(a.date) - new Date(b.date));

        const maxPoints = activePeriod === 'week' ? 7 : activePeriod === 'month' ? 31 : 52;

        if (sorted.length <= maxPoints) {
            return sorted.map(diary => ({
                date: diary.date.slice(5).replace('-', '/'),
                ...diary.analysis.metricScores
            }));
        }

        const step = Math.ceil(sorted.length / maxPoints);
        const sampled = [];
        for (let i = 0; i < sorted.length; i += step) {
            sampled.push(sorted[i]);
        }

        return sampled.map(diary => ({
            date: diary.date.slice(5).replace('-', '/'),
            ...diary.analysis.metricScores
        }));
    }, [filteredDiaries, activePeriod]);

    // 평균 점수 계산
    const avgScores = useMemo(() => {
        if (filteredDiaries.length === 0) return {};

        const scores = {};
        metrics.forEach(m => {
            const total = filteredDiaries.reduce((sum, diary) =>
                sum + (diary.analysis.metricScores[m.id] || 0), 0);
            scores[m.id] = (total / filteredDiaries.length).toFixed(1);
        });
        return scores;
    }, [filteredDiaries]);

    // AI 인사이트 생성
    const insight = useMemo(() => {
        if (Object.keys(avgScores).length === 0) return null;

        const sortedMetrics = Object.entries(avgScores)
            .sort((a, b) => parseFloat(b[1]) - parseFloat(a[1]));

        const highest = metrics.find(m => m.id === sortedMetrics[0][0]);
        const lowest = metrics.find(m => m.id === sortedMetrics[sortedMetrics.length - 1][0]);

        return { highest, lowest };
    }, [avgScores]);

    // 감정 통계 집계
    const emotionStats = useMemo(() => {
        const stats = { happy: 0, good: 0, sad: 0, neutral: 0 };
        const getEmotionType = (score) => {
            if (score.positive >= 70) return 'happy';
            if (score.positive >= 50) return 'good';
            if (score.negative >= 40) return 'sad';
            return 'neutral';
        };
        filteredDiaries.forEach(diary => {
            const type = getEmotionType(diary.analysis.emotionalScore);
            stats[type]++;
        });
        return stats;
    }, [filteredDiaries]);

    const emotionLabels = {
        happy: { emoji: '😊', label: '행복' },
        good: { emoji: '🙂', label: '좋음' },
        sad: { emoji: '😔', label: '우울' },
        neutral: { emoji: '😐', label: '보통' }
    };

    const toggleMetric = (metricId) => {
        setSelectedMetrics(prev => {
            if (prev.includes(metricId)) {
                if (prev.length === 1) return prev;
                return prev.filter(m => m !== metricId);
            }
            return [...prev, metricId];
        });
    };

    const handlePrevPeriod = () => {
        setCurrentDate(navigatePeriod(currentDate, activePeriod, -1));
    };

    const handleNextPeriod = () => {
        setCurrentDate(navigatePeriod(currentDate, activePeriod, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const handlePeriodChange = (periodId) => {
        setActivePeriod(periodId);
        setCurrentDate(new Date());
    };

    const handleDateSelect = (selectedDate) => {
        setCurrentDate(selectedDate);
    };

    const getPeriodTitle = () => {
        switch (activePeriod) {
            case 'week': return '주간 회고';
            case 'month': return '월간 회고';
            case 'year': return '연간 회고';
            default: return '회고';
        }
    };

    return (
        <div className={styles.reviewPage}>
            <header className="page-header">
                <h1 className="page-title">기간별 회고</h1>
                <p className="page-subtitle">지난 기록을 돌아보고 패턴을 발견하세요</p>
            </header>

            <div className="tabs">
                {periods.map(period => (
                    <button
                        key={period.id}
                        className={`tab ${activePeriod === period.id ? 'active' : ''}`}
                        onClick={() => handlePeriodChange(period.id)}
                    >
                        {period.label}
                    </button>
                ))}
            </div>

            {/* 기간 네비게이션 */}
            <div className={styles.periodNav}>
                <button className={styles.navBtn} onClick={handlePrevPeriod}>
                    <ChevronLeft size={20} />
                    이전
                </button>

                <button
                    className={styles.periodLabel}
                    onClick={() => setShowDatePicker(true)}
                >
                    <span className={styles.periodTitle}>{formatPeriodLabel(currentDate, activePeriod)}</span>
                    <span className={styles.periodRange}>
                        {dateRange.start.toLocaleDateString('ko-KR')} ~ {dateRange.end.toLocaleDateString('ko-KR')}
                    </span>
                    <Calendar size={16} className={styles.calendarIcon} />
                </button>

                <button className={styles.navBtn} onClick={handleNextPeriod}>
                    다음
                    <ChevronRight size={20} />
                </button>
                <button className={styles.todayBtn} onClick={handleToday}>
                    오늘
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={styles.statBadge}>
                    📝 이 기간 {filteredDiaries.length}개 기록
                </div>
                <div className={styles.statBadge}>
                    📊 전체 {diaries.length}개 일기
                </div>
                <div className={styles.emotionMini}>
                    {Object.entries(emotionStats).map(([key, count]) => (
                        count > 0 && (
                            <span key={key} className={styles.emotionMiniItem}>
                                {emotionLabels[key].emoji} {count}
                            </span>
                        )
                    ))}
                </div>
            </div>

            <div className={styles.mainGrid}>
                <section className={`card ${styles.chartSection}`}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <BarChart3 size={20} />
                            {getPeriodTitle()} - 지표 추이
                        </h2>
                    </div>

                    <div className={styles.metricFilters}>
                        {metrics.map(m => (
                            <button
                                key={m.id}
                                className={`${styles.metricFilter} ${selectedMetrics.includes(m.id) ? styles.active : ''}`}
                                style={{
                                    '--metric-color': m.color,
                                    borderColor: selectedMetrics.includes(m.id) ? m.color : 'transparent'
                                }}
                                onClick={() => toggleMetric(m.id)}
                            >
                                {m.icon} {m.name}
                            </button>
                        ))}
                    </div>

                    {chartData.length > 0 ? (
                        <MetricChart
                            data={chartData}
                            selectedMetrics={selectedMetrics}
                            height={300}
                        />
                    ) : (
                        <div className={styles.noData}>해당 기간에 데이터가 없습니다.</div>
                    )}
                </section>

                <section className={`card ${styles.summarySection}`}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <FileText size={20} />
                            평균 점수
                        </h2>
                    </div>

                    <div className={styles.avgScoresList}>
                        {metrics.map(m => (
                            <div key={m.id} className={styles.avgScoreItem}>
                                <div className={styles.avgScoreHeader}>
                                    <span>{m.icon} {m.name}</span>
                                    <span className={styles.avgScoreValue} style={{ color: m.color }}>
                                        {avgScores[m.id] || '0.0'}
                                    </span>
                                </div>
                                <div className="score-bar">
                                    <div
                                        className="score-bar-fill"
                                        style={{
                                            width: `${((avgScores[m.id] || 0) / 5) * 100}%`,
                                            background: m.color
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {insight && (
                        <div className={styles.insight}>
                            <h4>💡 AI 인사이트</h4>
                            <p>
                                이 기간 동안 <strong>{insight.highest?.name}</strong> 지표가 가장 높았고,
                                <strong> {insight.lowest?.name}</strong> 지표가 다소 낮았습니다.
                                {insight.lowest?.id === 'rest' && ' 수면 시간을 늘리는 것을 권장드려요.'}
                                {insight.lowest?.id === 'health' && ' 운동이나 건강 관리에 신경 써보세요.'}
                                {insight.lowest?.id === 'relationship' && ' 주변 사람들과 더 많은 시간을 보내보세요.'}
                                {insight.lowest?.id === 'hobby' && ' 취미 활동을 통해 스트레스를 해소해보세요.'}
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <section className={styles.diariesSection}>
                <h2 className={`card-title ${styles.sectionTitle}`}>
                    <Calendar size={20} />
                    {formatPeriodLabel(currentDate, activePeriod)} 기록 ({filteredDiaries.length}개)
                </h2>

                <div className={styles.diariesGrid}>
                    {filteredDiaries.map(diary => (
                        <DiaryCard
                            key={diary.id}
                            diary={diary}
                            onClick={() => setSelectedDiary(diary)}
                        />
                    ))}
                </div>

                {filteredDiaries.length === 0 && (
                    <div className={styles.noData}>해당 기간에 작성된 일기가 없습니다.</div>
                )}
            </section>

            {selectedDiary && (
                <AnalysisModal
                    diary={selectedDiary}
                    onClose={() => setSelectedDiary(null)}
                />
            )}

            <DatePickerModal
                isOpen={showDatePicker}
                onClose={() => setShowDatePicker(false)}
                onSelect={handleDateSelect}
                currentDate={currentDate}
                periodType={activePeriod}
            />
        </div>
    );
}
