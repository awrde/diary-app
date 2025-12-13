'use client';

import { useState } from 'react';
import { Settings, Sparkles, Save, RefreshCw } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { aiPersonalities, metrics, defaultWeights } from '@/lib/mockData';
import styles from './page.module.css';

export default function SettingsPage() {
    const { settings, updateSettings } = useDiary();
    const [personality, setPersonality] = useState(settings.personality);
    const [weights, setWeights] = useState(settings.weights);
    const [saved, setSaved] = useState(false);

    const handleWeightChange = (metricId, value) => {
        setWeights(prev => ({
            ...prev,
            [metricId]: parseInt(value)
        }));
    };

    const getTotalWeight = () => {
        return Object.values(weights).reduce((a, b) => a + b, 0);
    };

    const handleSave = () => {
        updateSettings({ personality, weights });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        setWeights(defaultWeights);
        setPersonality('warm_companion');
    };

    return (
        <div className={styles.settingsPage}>
            <header className="page-header">
                <h1 className="page-title">설정</h1>
                <p className="page-subtitle">AI 분석 방식과 평가 기준을 설정하세요</p>
            </header>

            <div className={styles.settingsGrid}>
                <section className={`card ${styles.section}`}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Sparkles size={20} />
                            AI 성격 설정
                        </h2>
                    </div>

                    <p className={styles.description}>
                        AI가 피드백을 전달하는 톤앤매너를 선택하세요.
                    </p>

                    <div className={styles.personalityGrid}>
                        {aiPersonalities.map(p => (
                            <label
                                key={p.id}
                                className={`${styles.personalityCard} ${personality === p.id ? styles.selected : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="personality"
                                    value={p.id}
                                    checked={personality === p.id}
                                    onChange={(e) => setPersonality(e.target.value)}
                                />
                                <div className={styles.personalityIcon}>
                                    {p.id === 'warm_companion' && '🤗'}
                                    {p.id === 'growth_coach' && '💪'}
                                    {p.id === 'neutral_observer' && '🔍'}
                                </div>
                                <h3 className={styles.personalityName}>{p.name}</h3>
                                <p className={styles.personalityDesc}>{p.description}</p>
                            </label>
                        ))}
                    </div>
                </section>

                <section className={`card ${styles.section}`}>
                    <div className="card-header">
                        <h2 className="card-title">
                            <Settings size={20} />
                            평가 지표 가중치
                        </h2>
                    </div>

                    <p className={styles.description}>
                        각 지표의 중요도를 설정하세요. 총합은 100%가 권장됩니다.
                    </p>

                    <div className={styles.totalWeight}>
                        총합: <span className={getTotalWeight() === 100 ? styles.valid : styles.invalid}>
                            {getTotalWeight()}%
                        </span>
                    </div>

                    <div className={styles.weightsList}>
                        {metrics.map(m => (
                            <div key={m.id} className={styles.weightItem}>
                                <div className={styles.weightHeader}>
                                    <span className={styles.weightLabel}>
                                        {m.icon} {m.name}
                                    </span>
                                    <span className={styles.weightValue} style={{ color: m.color }}>
                                        {weights[m.id]}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={weights[m.id]}
                                    onChange={(e) => handleWeightChange(m.id, e.target.value)}
                                    className={styles.slider}
                                    style={{ '--slider-color': m.color }}
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className={styles.actions}>
                <button className="btn btn-secondary" onClick={handleReset}>
                    <RefreshCw size={16} />
                    초기화
                </button>
                <button
                    className={`btn btn-primary ${saved ? styles.saved : ''}`}
                    onClick={handleSave}
                >
                    {saved ? (
                        <>✓ 저장됨</>
                    ) : (
                        <>
                            <Save size={16} />
                            저장하기
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
