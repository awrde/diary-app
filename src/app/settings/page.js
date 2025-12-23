'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Sparkles, Save, RefreshCw, Database, Download, Upload, FileText, CheckCircle, ExternalLink, AlertCircle } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { aiPersonalities, metrics, defaultWeights } from '@/lib/mockData';
import { downloadJSON, exportAllToMarkdown } from '@/lib/obsidianUtils';
import { testGeminiConnection } from '@/lib/gemini';
import styles from './page.module.css';

export default function SettingsPage() {
    const { settings, updateSettings, diaries, importAllData, resetToMockData } = useDiary();
    const fileInputRef = useRef(null);
    const [personality, setPersonality] = useState(settings?.personality || 'warm_companion');
    const [weights, setWeights] = useState(settings?.weights || defaultWeights);
    const [geminiApiKey, setGeminiApiKey] = useState(settings?.geminiApiKey || '');
    const [selectedModel, setSelectedModel] = useState(settings?.selectedModel || 'gemini-2.0-flash');
    const [debugMode, setDebugMode] = useState(settings?.debugMode || false);
    const [plan, setPlan] = useState(settings?.plan || 'free');
    const [forceLimit, setForceLimit] = useState(settings?.forceLimit || false);
    const [saved, setSaved] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);

    // DB에서 데이터가 로드되면 로컬 상태 업데이트
    useEffect(() => {
        if (settings) {
            setPersonality(settings.personality || 'warm_companion');
            setWeights(settings.weights || defaultWeights);
            setGeminiApiKey(settings.geminiApiKey || '');
            setSelectedModel(settings.selectedModel || 'gemini-2.0-flash');
            setDebugMode(settings.debugMode || false);
            setPlan(settings.plan || 'free');
            setForceLimit(settings.forceLimit || false);
        }
    }, [settings]);

    const handleWeightChange = (metricId, value) => {
        setWeights(prev => ({
            ...prev,
            [metricId]: parseInt(value)
        }));
    };

    const getTotalWeight = () => {
        if (!weights) return 0;
        return Object.values(weights).reduce((a, b) => a + b, 0);
    };

    const handleSave = () => {
        updateSettings({
            personality,
            weights,
            geminiApiKey,
            selectedModel,
            debugMode,
            plan,
            forceLimit
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (confirm('모든 설정이 초기화됩니다. 계속하시겠습니까?')) {
            setWeights(defaultWeights);
            setPersonality('warm_companion');
            setGeminiApiKey('');
            setSelectedModel('gemini-2.0-flash');
            setDebugMode(false);
            setPlan('free');
            setForceLimit(false);
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

    const handleTestConnection = async () => {
        if (!geminiApiKey) {
            alert('API 키를 입력해주세요.');
            return;
        }

        setIsTesting(true);
        setTestResult(null);

        try {
            const result = await testGeminiConnection(geminiApiKey, selectedModel);
            setTestResult({
                success: true,
                message: result.response,
                prompt: result.prompt
            });
        } catch (err) {
            setTestResult({
                success: false,
                message: err.message || '연결에 실패했습니다.'
            });
        } finally {
            setIsTesting(false);
        }
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

            <section className={`card ${styles.section}`} style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h2 className={styles.sectionTitle}>
                        <CheckCircle size={20} />
                        내 플랜 정보
                    </h2>
                </div>
                <div className={styles.planBadge} data-plan={plan}>
                    {plan === 'pro' ? 'Premium Pro' : 'Free Tier'}
                </div>
                <p className={styles.description}>
                    {plan === 'pro'
                        ? '무제한 AI 분석과 최상위 모델을 사용 중입니다.'
                        : '무료 티어에서는 2개월간 총 100회의 AI 분석이 가능합니다.'}
                </p>
                {plan === 'free' && (
                    <div style={{ marginTop: '1rem', borderTop: '1px dotted var(--border-glass)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8 }}>
                            <input
                                type="checkbox"
                                id="forceLimit"
                                checked={forceLimit}
                                onChange={(e) => setForceLimit(e.target.checked)}
                            />
                            <label htmlFor="forceLimit" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                                [테스트 전용] 사용량 제한(100개) 강제 활성화
                            </label>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                            ※ 활성화 시 실제 일기 수와 상관없이 '무료 한도 초과' 상태가 되어 모의 분석이 수행됩니다.
                        </p>

                        <button
                            className="btn btn-primary"
                            style={{ marginTop: '1rem', width: '100%' }}
                            onClick={() => {
                                if (confirm('Pro 플랜으로 업그레이드하시겠습니까? (테스트용)')) {
                                    setPlan('pro');
                                    setForceLimit(false); // 업그레이드 시 테스트 제한 해제
                                }
                            }}
                        >
                            Pro 플랜으로 업그레이드
                        </button>
                    </div>
                )}
            </section>

            <section className={`card ${styles.section}`} style={{ marginTop: 'var(--space-xl)' }}>
                <div className="card-header">
                    <h2 className="card-title">
                        <Sparkles size={20} />
                        Gemini AI 연동 설정
                    </h2>
                </div>

                <p className={styles.description}>
                    실제 Gemini AI를 사용하여 정교한 분석을 받으려면 API 키를 등록하세요.
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className={styles.link}>
                        (API 키 발급받기)
                    </a>
                </p>

                <div className={styles.geminiSettings}>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>
                            개인 Gemini API Key (선택 사항)
                        </label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="개인 키 입력 시 우선 사용됩니다 (미입력 시 기본 제공 키 사용)"
                            value={geminiApiKey}
                            onChange={(e) => setGeminiApiKey(e.target.value)}
                        />
                        <p className={styles.helperText}>
                            개인 API 키를 등록하면 더 빠르고 안정적인 분석이 가능합니다.
                            <a
                                href="https://aistudio.google.com/app/apikey"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.inlineLink}
                            >
                                키 발급받기 <ExternalLink size={12} />
                            </a>
                        </p>
                    </div>

                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">AI 모델 선택</label>
                        <select
                            className="form-select"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        >
                            <option value="gemini-2.0-flash">Gemini 2.0 Flash (추천)</option>
                            <option value="gemini-2.0-flash-lite-preview-02-05">Gemini 2.0 Flash Lite</option>
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash (준비 중 - 지원 시 사용 가능)</option>
                            <option value="gemini-3.0-flash">Gemini 3.0 Flash (준비 중 - 지원 시 사용 가능)</option>
                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                        </select>
                        <p className={styles.inputHelp}>
                            ※ 3.0 모델 출시 시 자동으로 업데이트될 예정입니다.
                        </p>
                    </div>

                    <div className={styles.testArea} style={{ marginTop: '1rem' }}>
                        <div className={styles.debugToggle} style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="checkbox"
                                id="debugMode"
                                checked={debugMode}
                                onChange={(e) => setDebugMode(e.target.checked)}
                            />
                            <label htmlFor="debugMode" className={styles.formLabel} style={{ marginBottom: 0 }}>디버그 모드 활성화 (프롬프트/응답 확인)</label>
                        </div>

                        <button
                            className="btn btn-secondary"
                            onClick={handleTestConnection}
                            disabled={isTesting}
                        >
                            {isTesting ? '테스트 중...' : 'API 연결 테스트'}
                        </button>
                        {testResult && (
                            <div className={`${styles.testMessage} ${testResult.success ? styles.testSuccess : styles.testError}`}>
                                <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                    {testResult.success ? '✅ 연결 성공' : '❌ 연결 실패'}
                                </div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>{testResult.message}</div>

                                {debugMode && testResult.prompt && (
                                    <div className={styles.debugDetails} style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.5rem' }}>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>[SENT PROMPT]</div>
                                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.7rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
                                            {testResult.prompt}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
                        <p className={styles.description} style={{ marginBottom: '0.5rem' }}>
                            🔒 <strong>무료 사용량 안내</strong>
                        </p>
                        <p className={styles.inputHelp} style={{ color: 'var(--text-secondary)' }}>
                            스토어 공식 출시 버전에서는 3개월간 최대 100개의 일기까지 무료로 분석을 이용할 수 있습니다.
                            개인 API 키를 등록하시면 제한 없이 사용 가능합니다.
                        </p>
                    </div>
                </div>
            </section>

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
