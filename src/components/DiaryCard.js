import { Calendar, Laugh, Smile, Frown, Meh } from 'lucide-react';
import styles from './DiaryCard.module.css';

export default function DiaryCard({ diary, onClick }) {
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short'
        });
    };

    const getEmotionIcon = (score) => {
        if (score.positive >= 70) return <Laugh size={28} color="#22c55e" fill="#dcfce7" />; // Happy (Green)
        if (score.positive >= 50) return <Smile size={28} color="#6366f1" fill="#e0e7ff" />; // Good (Indigo)
        if (score.negative >= 40) return <Frown size={28} color="#ef4444" fill="#fee2e2" />; // Sad (Red)
        return <Meh size={28} color="#eab308" fill="#fef9c3" />; // Neutral (Yellow)
    };

    return (
        <div className={`card ${styles.diaryCard}`} onClick={onClick}>
            <div className={styles.header}>
                <div className={styles.date}>
                    <Calendar size={14} />
                    {formatDate(diary.date)}
                </div>
                <div className={styles.emoji}>
                    {getEmotionIcon(diary.analysis.emotionalScore)}
                </div>
            </div>

            <p className={styles.content}>
                {diary.content.length > 100
                    ? diary.content.slice(0, 100) + '...'
                    : diary.content}
            </p>

            <div className={styles.summary}>
                {diary.analysis.summary}
            </div>

            <div className={styles.metrics}>
                {Object.entries(diary.analysis.metricScores).slice(0, 4).map(([key, value]) => (
                    <div key={key} className={styles.metricBadge}>
                        <span className={`metric-dot ${key}`}></span>
                        <span>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
