'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  PenLine,
  BookOpen,
  BarChart3,
  Settings,
  Heart,
  Zap,
  Coffee,
  Sun,
  CheckCircle2
} from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import DiaryCard from '@/components/DiaryCard';
import AnalysisModal from '@/components/AnalysisModal';
import styles from './page.module.css';

export default function Dashboard() {
  const { diaries, getLatestDiary, getWeightedScore } = useDiary();
  const [selectedDiary, setSelectedDiary] = useState(null);

  const latestDiary = getLatestDiary();
  const recentList = diaries.slice(0, 3);
  const todayDateKey = new Date().toISOString().split('T')[0];
  const hasWrittenToday = diaries.some(d => d.date === todayDateKey);

  // 최근 7일 중 며칠 썼는지 계산
  const last7Days = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });
  }, []);

  const streak = useMemo(() => {
    return last7Days.filter(date => diaries.some(d => d.date === date)).length;
  }, [diaries, last7Days]);

  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  return (
    <div className={styles.hubContainer}>
      {/* 1. Welcome Section (Hero) */}
      <section className={styles.heroSection}>
        <div className={styles.welcomeText}>
          <div className={styles.topStatus}>
            <span className={styles.dateLabel}>{today}</span>
            <span className={styles.streakBadge}>🔥 {streak}/7일 기록</span>
          </div>
          <h1 className={styles.greeting}>
            {hasWrittenToday ? (
              <>기록 <span className={styles.highlight}>완료!</span></>
            ) : (
              <>오늘, <span className={styles.highlight}>어땠나요?</span></>
            )}
          </h1>
          <p className={styles.subGreeting}>
            {hasWrittenToday
              ? "오늘의 마음을 성공적으로 남겼습니다."
              : "지금 소중한 순간을 AI와 공유하세요."}
          </p>
        </div>
        {!hasWrittenToday ? (
          <Link href="/write" className={styles.mainWriteBtn}>
            <PenLine size={20} />
            <span>일기 쓰기</span>
            <Sparkles size={18} className={styles.sparkleIcon} />
          </Link>
        ) : (
          <Link href="/calendar" className={`${styles.mainWriteBtn} ${styles.completedBtn}`}>
            <CheckCircle2 size={20} />
            <span>기록 확인</span>
          </Link>
        )}
      </section>

      {/* 2. Main Navigation Grid (Bento Style) */}
      <section className={styles.menuGrid}>
        <Link href="/calendar" className={`${styles.menuCard} ${styles.calendarCard}`}>
          <div className={styles.menuIcon}><Calendar size={32} /></div>
          <div className={styles.menuInfo}>
            <h3>캘린더</h3>
            <p>기록의 흐름을 한눈에 확인하세요</p>
          </div>
          <div className={styles.miniHeatmap}>
            {/* 최근 14일 상태를 시각화 (간략히) */}
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className={styles.heatmapDot} data-active={i % 3 === 0} />
            ))}
          </div>
        </Link>

        <Link href="/diaries" className={`${styles.menuCard} ${styles.historyCard}`}>
          <div className={styles.menuIcon}><BookOpen size={32} /></div>
          <div className={styles.menuInfo}>
            <h3>전체 일기</h3>
            <p>쌓여가는 당신의 기록들</p>
          </div>
          <span className={styles.countBadge}>{diaries.length} entries</span>
        </Link>

        <Link href="/review" className={`${styles.menuCard} ${styles.analysisCard}`}>
          <div className={styles.menuIcon}><TrendingUp size={32} /></div>
          <div className={styles.menuInfo}>
            <h3>기간별 회고</h3>
            <p>당신의 감정 패턴을 분석합니다</p>
          </div>
          <Zap size={40} className={styles.bgIcon} />
        </Link>

        <Link href="/settings" className={`${styles.menuCard} ${styles.settingsCard}`}>
          <div className={styles.menuIcon}><Settings size={32} /></div>
          <div className={styles.menuInfo}>
            <h3>설정</h3>
            <p>개인화된 AI 동반자 관리</p>
          </div>
        </Link>
      </section>

      {/* 3. Latest Insights & Recent Activity */}
      <div className={styles.bottomGrid}>
        <section className={styles.insightSection}>
          <h2 className={styles.sectionTitle}>
            <Sparkles size={20} /> Today's Insight
          </h2>
          {latestDiary ? (
            <div className={`card ${styles.insightCard}`} onClick={() => setSelectedDiary(latestDiary)}>
              <div className={styles.insightHeader}>
                <span className={styles.scoreTitle}>AI 종합 점수</span>
                <span className={styles.scoreValue}>{getWeightedScore(latestDiary)}</span>
              </div>
              <p className={styles.insightSummary}>{latestDiary.analysis.summary}</p>
              <div className={styles.insightFooter}>
                <span className={styles.feedbackTag}>
                  <Heart size={14} /> AI가 드리는 위로 한 마디
                </span>
                <ArrowRight size={16} />
              </div>
            </div>
          ) : (
            <div className={styles.noDataCard}>
              <Coffee size={32} />
              <p>아직 오늘의 기록이 없네요!</p>
            </div>
          )}
        </section>

        <section className={styles.recentActivity}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>최근 기록</h2>
            <Link href="/diaries" className={styles.viewLink}>전체보기</Link>
          </div>
          <div className={styles.miniDiaryContainer}>
            {recentList.map(diary => (
              <div key={diary.id} className={styles.miniDiaryItem} onClick={() => setSelectedDiary(diary)}>
                <div className={styles.miniDate}>{diary.date.split('-').slice(1).join('.')}</div>
                <div className={styles.miniContent}>{diary.content}</div>
                <div className={styles.miniScore}>{getWeightedScore(diary)}</div>
              </div>
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
