'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Calendar, Sparkles, ArrowRight, Laugh, Smile, Frown, Meh, Moon } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import MetricChart from '@/components/MetricChart';
import DiaryCard from '@/components/DiaryCard';
import AnalysisModal from '@/components/AnalysisModal';
import styles from './page.module.css';

// 감정 이모티콘 분류
function getEmotionType(score) {
  if (score.positive >= 70) return 'happy';
  if (score.positive >= 50) return 'good';
  if (score.negative >= 40) return 'sad';
  return 'neutral';
}

const emotionLabels = {
  happy: { Icon: Laugh, color: '#22c55e', fill: '#dcfce7', label: '행복' },
  good: { Icon: Smile, color: '#6366f1', fill: '#e0e7ff', label: '좋음' },
  sad: { Icon: Frown, color: '#ef4444', fill: '#fee2e2', label: '우울' },
  neutral: { Icon: Meh, color: '#eab308', fill: '#fef9c3', label: '보통' }
};

export default function Dashboard() {
  const { diaries, getLatestDiary, getWeightedScore } = useDiary();
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);

  const latestDiary = getLatestDiary();
  const recentDiaries = diaries.slice(0, 5);

  // 최근 7일 차트 데이터
  const weeklyChartData = useMemo(() => {
    const recent7 = diaries.slice(0, 7).reverse();
    return recent7.map(diary => ({
      date: diary.date.slice(5).replace('-', '/'),
      ...diary.analysis.metricScores
    }));
  }, [diaries]);

  // 감정 통계 집계
  const emotionStats = useMemo(() => {
    const stats = { happy: 0, good: 0, sad: 0, neutral: 0 };
    diaries.forEach(diary => {
      const type = getEmotionType(diary.analysis.emotionalScore);
      stats[type]++;
    });
    return stats;
  }, [diaries]);

  const totalEmotions = Object.values(emotionStats).reduce((a, b) => a + b, 0);

  // 최근 수면 평균 (데이터가 있는 것만)
  const avgSleep = useMemo(() => {
    const sleepData = diaries
      .filter(d => d.sleepHours && d.sleepHours > 0)
      .slice(0, 7);

    if (sleepData.length === 0) return 0;

    const total = sleepData.reduce((sum, d) => sum + d.sleepHours, 0);
    return (total / sleepData.length).toFixed(1);
  }, [diaries]);

  return (
    <div className={styles.dashboard}>
      <header className="page-header">
        <h1 className="page-title">대시보드</h1>
        <p className="page-subtitle">오늘의 기록과 최근 변화를 확인하세요</p>
      </header>

      <div className={styles.statsGrid}>
        <Link href="/diaries" className={`card ${styles.statCard} ${styles.clickable}`}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
            <Calendar size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{diaries.length}</span>
            <span className={styles.statLabel}>총 일기 수</span>
          </div>
        </Link>

        <div
          className={`card ${styles.statCard} ${activeTooltip === 'score' ? styles.active : ''}`}
          onMouseEnter={() => setActiveTooltip('score')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'score' ? null : 'score')}
        >
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{getWeightedScore(latestDiary)}</span>
            <span className={styles.statLabel}>오늘 종합 점수</span>
          </div>
          {activeTooltip === 'score' && (
            <div className={styles.tooltip}>
              건강, 관계, 자기계발, 업무 지표를 가중치에 따라 합산한 오늘의 전반적인 상태 점수입니다.
            </div>
          )}
        </div>

        <div
          className={`card ${styles.statCard} ${activeTooltip === 'positive' ? styles.active : ''}`}
          onMouseEnter={() => setActiveTooltip('positive')}
          onMouseLeave={() => setActiveTooltip(null)}
          onClick={() => setActiveTooltip(activeTooltip === 'positive' ? null : 'positive')}
        >
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
            <Sparkles size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{latestDiary?.analysis.emotionalScore.positive || 0}%</span>
            <span className={styles.statLabel}>긍정 지수</span>
          </div>
          {activeTooltip === 'positive' && (
            <div className={styles.tooltip}>
              AI가 분석한 일기 내용 중 긍정적인 감정의 비율을 나타냅니다.
            </div>
          )}
        </div>

        <div className={`card ${styles.statCard}`}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #a78bfa, #7c3aed)' }}>
            <Moon size={24} />
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{avgSleep}h</span>
            <span className={styles.statLabel}>최근 평균 수면</span>
          </div>
        </div>
      </div>

      {/* 감정 분포 카드 */}
      <div className={`card ${styles.emotionCard}`}>
        <h3 className={styles.emotionTitle}>📊 전체 감정 분포</h3>
        <div className={styles.emotionGrid}>
          {Object.entries(emotionStats).map(([key, count]) => {
            const { Icon, color, fill, label } = emotionLabels[key];
            return (
              <div key={key} className={styles.emotionItem}>
                <span className={styles.emotionEmoji}>
                  <Icon size={28} color={color} fill={fill} />
                </span>
                <span className={styles.emotionCount}>{count}</span>
                <span className={styles.emotionLabel}>{label}</span>
                <div className={styles.emotionBar}>
                  <div
                    className={styles.emotionBarFill}
                    style={{
                      width: totalEmotions > 0 ? `${(count / totalEmotions) * 100}%` : '0%',
                      background: color // Use the same color defined in labels
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.mainGrid}>
        <section className={`card ${styles.chartSection}`}>
          <div className="card-header">
            <h2 className="card-title">
              <TrendingUp size={20} />
              최근 7일 지표 추이
            </h2>
          </div>
          {weeklyChartData.length > 0 ? (
            <MetricChart
              data={weeklyChartData}
              selectedMetrics={['health', 'relationship', 'growth', 'work']}
              height={280}
            />
          ) : (
            <div className={styles.noData}>데이터가 없습니다</div>
          )}
        </section>

        <section className={styles.recentSection}>
          <div className={styles.sectionHeader}>
            <h2 className="card-title">
              <Calendar size={20} />
              최근 기록
            </h2>
            <a href="/diaries" className={styles.viewAll}>
              전체 보기 <ArrowRight size={16} />
            </a>
          </div>

          <div className={styles.diaryList}>
            {recentDiaries.map(diary => (
              <DiaryCard
                key={diary.id}
                diary={diary}
                onClick={() => setSelectedDiary(diary)}
              />
            ))}
          </div>
        </section>
      </div>

      {selectedDiary && (
        <AnalysisModal
          diary={selectedDiary}
          onClose={() => setSelectedDiary(null)}
        />
      )}
    </div>
  );
}
