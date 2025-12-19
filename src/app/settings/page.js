'use client';

import { useState, useRef } from 'react';
import { Settings, Sparkles, Save, RefreshCw, Database, Download, Upload, FileText } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { aiPersonalities, metrics, defaultWeights } from '@/lib/mockData';
import { downloadJSON, exportAllToMarkdown } from '@/lib/obsidianUtils';
import styles from './page.module.css';

export default function SettingsPage() {
    const { settings, updateSettings, diaries, importAllData, resetToMockData } = useDiary();
    const fileInputRef = useRef(null);
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
        if (confirm('모든 설정이 초기화됩니다. 계속하시겠습니까?')) {
            setWeights(defaultWeights);
            setPersonality('warm_companion');
        }
    };

    const handleResetData = async () => {
        if (confirm('주의: 모든 일기가 예시 데이터로 초기화됩니다. 정말 진행하시겠습니까?')) {
            await resetToMockData();
            alert('데이터가 초기화되었습니다.');
        }
    };

    const handleExportJSON = () => {
        const backupData = {
            diaries,
            settings,
            exportDate: new Date().toISOString()
        };
        downloadJSON(`diary-backup-${new Date().toISOString().split('T')[0]}.json`, backupData);
    };

    const handleExportMarkdown = () => {
        const md = exportAllToMarkdown(diaries, metrics);
        const element = document.createElement('a');
        const file = new Blob([md], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `diaries-all-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (confirm('주의: 현재 데이터가 백업 파일로 교체됩니다. 계속하시겠습니까?')) {
                    const success = await importAllData(json);
                    if (success) {
                        alert('데이터가 성공적으로 복원되었습니다.');
                    } else {
                        alert('복원에 실패했습니다. 유효한 백업 파일인지 확인해주세요.');
                    }
                }
            } catch (err) {
                alert('파일을 읽는 중 오류가 발생했습니다.');
            }
        };
        reader.readAsText(file);
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
                    초기화 설정
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
                            설정 저장하기
                        </>
                    )}
                </button>
            </div>

            <section className={`card ${styles.section} ${styles.dangerZone}`}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Database size={20} />
                        데이터 관리
                    </h2>
                </div>

                <div className={styles.backupGrid}>
                    <div className={styles.backupItem}>
                        <div className={styles.backupInfo}>
                            <h3>JSON 백업 및 복원</h3>
                            <p>모든 데이터와 설정을 파일로 보관하거나 다른 기기에서 불러옵니다.</p>
                        </div>
                        <div className={styles.backupActions}>
                            <button className="btn btn-secondary" onClick={handleExportJSON}>
                                <Download size={16} />
                                JSON 내보내기
                            </button>
                            <button className="btn btn-secondary" onClick={handleImportClick}>
                                <Upload size={16} />
                                복원하기
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleFileImport}
                            />
                        </div>
                    </div>

                    <div className={styles.backupItem}>
                        <div className={styles.backupInfo}>
                            <h3>Markdown 아카이브</h3>
                            <p>지금까지 작성한 모든 일기를 하나의 마크다운 파일로 묶어서 저장합니다.</p>
                        </div>
                        <div className={styles.backupActions}>
                            <button className="btn btn-secondary" onClick={handleExportMarkdown}>
                                <FileText size={16} />
                                전체 MD 내보내기
                            </button>
                        </div>
                    </div>

                    <div className={styles.backupItem}>
                        <div className={styles.backupInfo}>
                            <h3>데이터 초기화</h3>
                            <p>주의: 모든 일기를 삭제하고 예시 데이터로 되돌립니다.</p>
                        </div>
                        <div className={styles.backupActions}>
                            <button className="btn btn-danger" onClick={handleResetData}>
                                <RefreshCw size={16} />
                                데이터 초기화
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
