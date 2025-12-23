'use client';

import { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PenLine, Image, Sparkles, Settings, Save, Sun, Cloud, CloudRain, Snowflake, Wind, Moon, BedDouble, AlarmClock, ChevronDown, ChevronUp } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { aiPersonalities, metrics } from '@/lib/mockData';
import AnalysisModal from '@/components/AnalysisModal';
import styles from './page.module.css';

function WriteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const { addDiary, updateDiary, diaries, settings, checkUsageLimit } = useDiary();
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [weather, setWeather] = useState('맑음');
    const [sleepStart, setSleepStart] = useState('23:00');
    const [sleepEnd, setSleepEnd] = useState('07:00');
    const [sleepHours, setSleepHours] = useState(8);
    const [personality, setPersonality] = useState(settings.personality);
    const [sleepClickStep, setSleepClickStep] = useState(0); // 0: none, 1: start set, 2: both set
    const [draggingType, setDraggingType] = useState(null); // 'start', 'end' or null
    const [sleepMode, setSleepMode] = useState('dial');
    const [isSleepSettingOpen, setIsSleepSettingOpen] = useState(false);
    const lastDragAngle = useRef(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedDiary, setAnalyzedDiary] = useState(null);
    const fileInputRef = useRef(null);
    const usageInfo = useMemo(() => checkUsageLimit(diaries), [diaries, checkUsageLimit]);

    // 수정 모드일 때 데이터 로드 또는 URL 파라미터로 내용 수신
    useEffect(() => {
        if (editId && diaries.length > 0) {
            const id = parseInt(editId);
            const diary = diaries.find(d => d.id === id);
            if (diary) {
                setContent(diary.content);
                setImages(diary.images || []);
                setWeather(diary.weather || '맑음');
                setSleepStart(diary.sleepStart || '23:00');
                setSleepEnd(diary.sleepEnd || '07:00');
                setSleepHours(diary.sleepHours || 8);
                setPersonality(diary.personality || settings.personality);
            }
        } else {
            // Obsidian 등 외부에서 파라미터로 전달된 경우
            const externalContent = searchParams.get('content');
            if (externalContent) {
                setContent(externalContent);
                // URL 파라미터를 사용한 후에는 지우는 것이 좋지만, 
                // Next.js 클라이언트 사이드에서 간단히 상태만 채워넣음
            }
        }
    }, [editId, diaries, settings.personality, searchParams]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (images.length + files.length > 3) {
            alert('사진은 최대 3장까지 첨부할 수 있습니다.');
            return;
        }

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImages(prev => [...prev, reader.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleFileBtnClick = () => {
        fileInputRef.current?.click();
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;

        setIsAnalyzing(true);

        // Simulate AI analysis delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (editId) {
            const updated = await updateDiary(parseInt(editId), {
                content,
                images,
                personality,
                weather,
                sleepStart,
                sleepEnd,
                sleepHours: Number(sleepHours)
            });
            setIsAnalyzing(false);
            setAnalyzedDiary(updated);
        } else {
            // 무료 사용량 체크 (Gemini API 키가 없을 때만 강제 제한하거나, 전체적인 정책으로 적용 가능)
            if (!settings.geminiApiKey) {
                const { canWrite, reason } = checkUsageLimit(diaries);
                if (!canWrite) {
                    alert(reason + '\n\n설정에서 개인 Gemini API 키를 등록하시면 제한 없이 이용 가능합니다.');
                    setIsAnalyzing(false);
                    return;
                }
            }

            const newDiary = await addDiary({
                content,
                images,
                personality: settings.personality,
                weather,
                sleepStart,
                sleepEnd,
                sleepHours: Number(sleepHours)
            });
            setIsAnalyzing(false);
            setAnalyzedDiary(newDiary);
            setContent('');
            setImages([]);
        }
    };

    const calculateSleepHours = (start, end) => {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);

        let diff = (eH * 60 + eM) - (sH * 60 + sM);
        if (diff < 0) diff += 24 * 60; // 다음날 기상

        return (diff / 60).toFixed(1);
    };

    const handleSleepChange = (type, value) => {
        let newStart = sleepStart;
        let newEnd = sleepEnd;

        if (type === 'start') {
            newStart = value;
            setSleepStart(value);
        } else {
            newEnd = value;
            setSleepEnd(value);
        }

        setSleepHours(calculateSleepHours(newStart, newEnd));
    };

    const getTimeFromPercentage = (percentage) => {
        const totalMinutesInDay = 24 * 60;
        const startOffsetMinutes = 18 * 60; // 18:00

        let selectedMinutes = (percentage / 100) * totalMinutesInDay;
        let actualMinutes = (startOffsetMinutes + selectedMinutes) % totalMinutesInDay;

        const h = Math.floor(actualMinutes / 60);
        const m = Math.floor((actualMinutes % 60) / 10) * 10; // 10분 단위로 스냅
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const handleBarClick = (e) => {
        if (draggingType) return; // 드래그 중에는 클릭 무시

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        const timeStr = getTimeFromPercentage(percentage);

        if (sleepClickStep === 0 || sleepClickStep === 2) {
            setSleepStart(timeStr);
            setSleepClickStep(1);
            setSleepEnd(timeStr);
            setSleepHours(0);
        } else {
            setSleepEnd(timeStr);
            setSleepClickStep(2);
            setSleepHours(calculateSleepHours(sleepStart, timeStr));
        }
    };

    const handleMouseDown = (type, e) => {
        e.stopPropagation();
        setDraggingType(type);

        if (type === 'range') {
            const dial = document.querySelector('.' + styles.dialContainer);
            if (dial) {
                const rect = dial.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                lastDragAngle.current = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
            }
        }
    };

    useEffect(() => {
        if (!draggingType) return;

        const handleGlobalMove = (e) => {
            if (e.touches && e.cancelable) e.preventDefault();

            if (sleepMode === 'dial') {
                const dial = document.querySelector('.' + styles.dialContainer);
                if (!dial) return;
                const rect = dial.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                // 드래그 시 10분 단위 각도(2.5도)를 한 번에 계산
                const getAngle = (clientX, clientY) => Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
                const angle = getAngle(e.clientX || (e.touches && e.touches[0].clientX), e.clientY || (e.touches && e.touches[0].clientY));
                const timeStr = getTimeFromAngle(angle);

                if (draggingType === 'start') {
                    if (timeStr !== sleepStart) {
                        setSleepStart(timeStr);
                        setSleepHours(calculateSleepHours(timeStr, sleepEnd));
                    }
                } else if (draggingType === 'end') {
                    if (timeStr !== sleepEnd) {
                        setSleepEnd(timeStr);
                        setSleepHours(calculateSleepHours(sleepStart, timeStr));
                        setSleepClickStep(2);
                    }
                } else if (draggingType === 'range' && lastDragAngle.current !== null) {
                    let delta = angle - lastDragAngle.current;
                    if (delta > 180) delta -= 360;
                    if (delta < -180) delta += 360;

                    // 10분 단위 스냅에 해당하는 각도 임계값(약 2.5도)을 넘길 때만 업데이트
                    if (Math.abs(delta) >= 2.5) {
                        const sAngle = getAngleFromTime(sleepStart) + delta;
                        const eAngle = getAngleFromTime(sleepEnd) + delta;
                        const newStart = getTimeFromAngle(sAngle);
                        const newEnd = getTimeFromAngle(eAngle);

                        if (newStart !== sleepStart || newEnd !== sleepEnd) {
                            setSleepStart(newStart);
                            setSleepEnd(newEnd);
                            lastDragAngle.current = angle;
                        }
                    }
                }
                return;
            }

            const bar = document.getElementById('sleep-bar-track');
            if (!bar) return;

            const rect = bar.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const x = clientX - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            const timeStr = getTimeFromPercentage(percentage);

            if (draggingType === 'start') {
                setSleepStart(timeStr);
                if (sleepClickStep === 2) {
                    setSleepHours(calculateSleepHours(timeStr, sleepEnd));
                }
            } else if (draggingType === 'end') {
                setSleepEnd(timeStr);
                setSleepHours(calculateSleepHours(sleepStart, timeStr));
                setSleepClickStep(2);
            }
        };

        const handleGlobalUp = () => {
            setDraggingType(null);
        };

        window.addEventListener('mousemove', handleGlobalMove);
        window.addEventListener('mouseup', handleGlobalUp);
        window.addEventListener('touchmove', handleGlobalMove, { passive: false });
        window.addEventListener('touchend', handleGlobalUp);

        return () => {
            window.removeEventListener('mousemove', handleGlobalMove);
            window.removeEventListener('mouseup', handleGlobalUp);
            window.removeEventListener('touchmove', handleGlobalMove);
            window.removeEventListener('touchend', handleGlobalUp);
        };
    }, [draggingType, sleepStart, sleepEnd, sleepClickStep, sleepMode]);

    // 수면 시간 변경 시 휠 피커 위치 동기화 (드래그 시에도 부드럽게 연동)
    useEffect(() => {
        const syncWheel = (id, targetValue, step) => {
            const el = document.getElementById(id);
            if (el) {
                const targetScroll = targetValue * step;
                // scroll-snap 때문에 미세한 차이가 발생할 수 있으므로 threshold 유지
                if (Math.abs(el.scrollTop - targetScroll) > 2) {
                    el.scrollTop = targetScroll;
                }
            }
        };

        const [sH24, sM] = sleepStart.split(':').map(Number);
        const [eH24, eM] = sleepEnd.split(':').map(Number);

        syncWheel('wheel-start-p', sH24 < 12 ? 0 : 1, 30);
        syncWheel('wheel-start-h', (sH24 % 12 || 12) - 1, 30);
        syncWheel('wheel-start-m', sM, 30);

        syncWheel('wheel-end-p', eH24 < 12 ? 0 : 1, 30);
        syncWheel('wheel-end-h', (eH24 % 12 || 12) - 1, 30);
        syncWheel('wheel-end-m', eM, 30);
    }, [sleepStart, sleepEnd, isSleepSettingOpen]);

    // SVG 호(Arc) 경로 계산
    const getArcPath = (start, end) => {
        const s = getAngleFromTime(start);
        let e = getAngleFromTime(end);
        const radius = 44;

        const startRad = s * Math.PI / 180;
        const endRad = e * Math.PI / 180;

        const x1 = 50 + radius * Math.cos(startRad);
        const y1 = 50 + radius * Math.sin(startRad);
        const x2 = 50 + radius * Math.cos(endRad);
        const y2 = 50 + radius * Math.sin(endRad);

        let diff = e - s;
        if (diff < 0) diff += 360;
        if (diff === 0) return '';

        const largeArcFlag = diff > 180 ? 1 : 0;

        return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    };

    const renderTimeDisplay = (timeStr, label) => {
        const [h24, m] = timeStr.split(':').map(Number);
        const isPM = h24 >= 12;
        const h12 = h24 % 12 || 12;
        return (
            <div className={styles.timeDisplayBlock}>
                <span className={styles.timeDisplayLabel}>{label}</span>
                <div className={styles.timeDisplayValue}>
                    <span className={styles.timeDisplayAMPM}>{isPM ? '오후' : '오전'}</span>
                    <span className={styles.timeDisplayDigits}>{String(h12).padStart(2, '0')}:{String(m).padStart(2, '0')}</span>
                </div>
            </div>
        );
    };

    // 시간에 따른 바 위치 계산 (18:00 기준)
    const getTimePosition = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        let totalMinutes = h * 60 + m;
        let diff = totalMinutes - (18 * 60);
        if (diff < 0) diff += 24 * 60;
        return (diff / (24 * 60)) * 100;
    };

    // --- Circular Dial Helpers ---
    const getAngleFromTime = (timeStr) => {
        const [h, m] = timeStr.split(':').map(Number);
        const totalMinutes = h * 60 + m;
        return (totalMinutes / 1440) * 360 - 90; // -90 to start at 12 o'clock
    };

    const getTimeFromAngle = (angle) => {
        let normalizedAngle = (angle + 90) % 360;
        if (normalizedAngle < 0) normalizedAngle += 360;
        const totalMinutes = Math.round((normalizedAngle / 360) * 1440 / 10) * 10;
        const h = Math.floor(totalMinutes / 60) % 24;
        const m = totalMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const handleDialSlide = (e, type) => {
        const rect = e.currentTarget.closest('.' + styles.dialContainer).getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const angle = Math.atan2(clientY - centerY, clientX - centerX) * 180 / Math.PI;
        const timeStr = getTimeFromAngle(angle);

        if (type === 'start') setSleepStart(timeStr);
        else setSleepEnd(timeStr);

        setSleepClickStep(2);
        const newStart = type === 'start' ? timeStr : sleepStart;
        const newEnd = type === 'end' ? timeStr : sleepEnd;
        setSleepHours(calculateSleepHours(newStart, newEnd));
    };

    const getCharacterCount = () => {
        return content.length;
    };

    const handleModalClose = () => {
        setAnalyzedDiary(null);
        if (editId) {
            router.back(); // 수정 완료 후 뒤로가기
        }
    };

    return (
        <div className={styles.writePage}>
            <header className="page-header">
                <h1 className="page-title">{editId ? '일기 수정' : '일기 작성'}</h1>
                <p className="page-subtitle">
                    {editId ? '기록된 내용을 수정하고 다시 분석받아보세요.' : '오늘 하루는 어땠나요? 아래 네모 박스에 자유롭게 기록해보세요.'}
                </p>
            </header>

            {settings.plan === 'free' && (
                <div className={styles.limitBanner}>
                    <div className={styles.limitText}>
                        <strong>무료 이용 한도 안내</strong>
                        <span>
                            최근 2개월 동안 {usageInfo?.count ?? 0}/100 회 분석 사용.
                            {settings.geminiApiKey ? ' 개인 API 키가 등록되어 있어 한도 없이 이용할 수 있습니다.' : ' 개인 Gemini API 키를 등록하면 한도 없이 이용할 수 있습니다.'}
                        </span>
                    </div>
                    {!settings.geminiApiKey && (
                        <Link href="/settings" className={styles.limitLink}>
                            설정에서 키 등록하기
                        </Link>
                    )}
                </div>
            )}

            <div className={styles.container}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={`card ${styles.editorCard}`}>
                        <div className={styles.editorHeader}>
                            <div className={styles.date}>
                                {new Date().toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'long'
                                })}
                            </div>
                            <button
                                type="button"
                                className={`btn btn-secondary ${styles.settingsBtn}`}
                                onClick={() => setShowSettings(!showSettings)}
                            >
                                <Settings size={16} />
                                AI 설정
                            </button>
                        </div>

                        <div className={styles.extraInputs}>
                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    <Sun size={14} /> 오늘 날씨
                                </label>
                                <div className={styles.weatherOptions}>
                                    {[
                                        { id: '맑음', icon: Sun },
                                        { id: '흐림', icon: Cloud },
                                        { id: '비', icon: CloudRain },
                                        { id: '눈', icon: Snowflake },
                                        { id: '바람', icon: Wind }
                                    ].map((w) => (
                                        <button
                                            key={w.id}
                                            type="button"
                                            className={`${styles.weatherBtn} ${weather === w.id ? styles.active : ''}`}
                                            onClick={() => setWeather(w.id)}
                                            title={w.id}
                                        >
                                            <w.icon size={18} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.inputGroup}>
                                <label className={styles.inputLabel}>
                                    <Moon size={14} /> 수면 시간 설정
                                </label>
                                <div className={styles.sleepInputWrapper}>
                                    <button
                                        type="button"
                                        className={styles.sleepToggleButton}
                                        onClick={() => setIsSleepSettingOpen(!isSleepSettingOpen)}
                                    >
                                        <div className={styles.sleepDisplayInfo}>
                                            <span className={styles.timeRange}>{sleepStart} - {sleepEnd}</span>
                                            <span className={styles.durationLabel}>(총 {sleepHours}시간)</span>
                                        </div>
                                        {isSleepSettingOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </button>

                                    {isSleepSettingOpen && (
                                        <div className={styles.expandedSleepControl}>
                                            <div className={styles.dialWrapper}>
                                                <div className={styles.dialContainer}>
                                                    <svg className={styles.dialGaugeSvg} viewBox="0 0 100 100">
                                                        <path
                                                            d={getArcPath(sleepStart, sleepEnd)}
                                                            fill="none"
                                                            stroke="var(--accent-primary)"
                                                            strokeWidth="8"
                                                            strokeLinecap="round"
                                                            className={styles.dialRangeGauge}
                                                            onMouseDown={(e) => handleMouseDown('range', e)}
                                                            onTouchStart={(e) => handleMouseDown('range', e)}
                                                        />
                                                    </svg>

                                                    <div className={styles.dialFace}>
                                                        {/* 시간 눈금 (Ticks) */}
                                                        {Array.from({ length: 24 }).map((_, i) => {
                                                            const angle = (i / 24) * 360 - 90;
                                                            const rad = angle * Math.PI / 180;
                                                            const dist = 43; // 눈금 위치 살짝 조정
                                                            const x = 50 + dist * Math.cos(rad);
                                                            const y = 50 + dist * Math.sin(rad);
                                                            return <div key={`tick-${i}`} className={styles.dialTick} style={{ left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${angle + 90}deg)` }} />;
                                                        })}
                                                        {/* 숫자 레이블 */}
                                                        {[24, 6, 12, 18].map(h => {
                                                            const angle = ((h % 24) / 24) * 360 - 90;
                                                            const rad = angle * Math.PI / 180;
                                                            const dist = 44;
                                                            const left = 50 + dist * Math.cos(rad);
                                                            const top = 50 + dist * Math.sin(rad);
                                                            return <span key={h} className={styles.dialHour} style={{ left: `${left}%`, top: `${top}%` }}>{h}</span>;
                                                        })}
                                                    </div>

                                                    <div className={styles.dialValueGroup}>
                                                        {draggingType === 'start' ? (
                                                            renderTimeDisplay(sleepStart, '취침 시간')
                                                        ) : draggingType === 'end' ? (
                                                            renderTimeDisplay(sleepEnd, '기상 시간')
                                                        ) : (
                                                            <>
                                                                <div className={styles.timeDisplayRow}>
                                                                    {renderTimeDisplay(sleepStart, '취침')}
                                                                    <div className={styles.timeSeparator}></div>
                                                                    {renderTimeDisplay(sleepEnd, '기상')}
                                                                </div>
                                                                <div className={styles.dialValueLabel}>총 {sleepHours}시간 수면</div>
                                                            </>
                                                        )}
                                                    </div>

                                                    <div
                                                        className={`${styles.dialHandle} ${styles.startHandle} ${draggingType === 'start' ? styles.active : ''}`}
                                                        style={{
                                                            left: `${50 + 44 * Math.cos(getAngleFromTime(sleepStart) * Math.PI / 180)}%`,
                                                            top: `${50 + 44 * Math.sin(getAngleFromTime(sleepStart) * Math.PI / 180)}%`
                                                        }}
                                                        onMouseDown={(e) => handleMouseDown('start', e)}
                                                        onTouchStart={(e) => handleMouseDown('start', e)}
                                                    >
                                                        <BedDouble size={14} />
                                                    </div>

                                                    <div
                                                        className={`${styles.dialHandle} ${styles.endHandle} ${draggingType === 'end' ? styles.active : ''}`}
                                                        style={{
                                                            left: `${50 + 44 * Math.cos(getAngleFromTime(sleepEnd) * Math.PI / 180)}%`,
                                                            top: `${50 + 44 * Math.sin(getAngleFromTime(sleepEnd) * Math.PI / 180)}%`
                                                        }}
                                                        onMouseDown={(e) => handleMouseDown('end', e)}
                                                        onTouchStart={(e) => handleMouseDown('end', e)}
                                                    >
                                                        <AlarmClock size={14} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.wheelWrapper}>
                                                <div className={styles.wheelGroups}>
                                                    {/* 취침 시작 피커 */}
                                                    <div className={styles.wheelGroup}>
                                                        <span className={styles.wheelLabel}>취침 시작</span>
                                                        <div className={styles.wheelPair}>
                                                            {/* AM/PM */}
                                                            <div className={styles.wheelContainer} style={{ width: '45px' }}>
                                                                <div id="wheel-start-p" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return; // 다이얼 조작 중에는 휠의 자체 스크롤 이벤트 무시 (떨림 방지)
                                                                    const p = Math.round(e.target.scrollTop / 30);
                                                                    const [h24, m] = sleepStart.split(':').map(Number);
                                                                    const isPM = p === 1;
                                                                    let newH = h24 % 12;
                                                                    if (isPM) newH += 12;
                                                                    if (newH !== h24) handleSleepChange('start', `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {['오전', '오후'].map(p => <div key={p} className={`${styles.wheelItem} ${((parseInt(sleepStart.split(':')[0]) < 12 && p === '오전') || (parseInt(sleepStart.split(':')[0]) >= 12 && p === '오후')) ? styles.selected : ''}`}>{p}</div>)}
                                                                </div>
                                                            </div>
                                                            {/* Hour (1-12) */}
                                                            <div className={styles.wheelContainer} style={{ width: '35px' }}>
                                                                <div id="wheel-start-h" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return;
                                                                    const h12 = Math.round(e.target.scrollTop / 30) + 1;
                                                                    const [h24, m] = sleepStart.split(':').map(Number);
                                                                    const isPM = h24 >= 12;
                                                                    let newH24 = (h12 % 12) + (isPM ? 12 : 0);
                                                                    if (newH24 !== h24) handleSleepChange('start', `${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className={`${styles.wheelItem} ${(parseInt(sleepStart.split(':')[0]) % 12 || 12) === i + 1 ? styles.selected : ''}`}>{i + 1}</div>)}
                                                                </div>
                                                            </div>
                                                            <span className={styles.wheelSeparator}>:</span>
                                                            {/* Minute (0-59) */}
                                                            <div className={styles.wheelContainer} style={{ width: '35px' }}>
                                                                <div id="wheel-start-m" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return;
                                                                    const m = Math.round(e.target.scrollTop / 30);
                                                                    const [h24, currM] = sleepStart.split(':').map(Number);
                                                                    if (m !== currM && m >= 0 && m < 60) handleSleepChange('start', `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {Array.from({ length: 60 }).map((_, i) => <div key={i} className={`${styles.wheelItem} ${parseInt(sleepStart.split(':')[1]) === i ? styles.selected : ''}`}>{String(i).padStart(2, '0')}</div>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* 기상 시간 피커 */}
                                                    <div className={styles.wheelGroup}>
                                                        <span className={styles.wheelLabel}>기상 시간</span>
                                                        <div className={styles.wheelPair}>
                                                            {/* AM/PM */}
                                                            <div className={styles.wheelContainer} style={{ width: '45px' }}>
                                                                <div id="wheel-end-p" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return;
                                                                    const p = Math.round(e.target.scrollTop / 30);
                                                                    const [h24, m] = sleepEnd.split(':').map(Number);
                                                                    const isPM = p === 1;
                                                                    let newH = h24 % 12;
                                                                    if (isPM) newH += 12;
                                                                    if (newH !== h24) handleSleepChange('end', `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {['오전', '오후'].map(p => <div key={p} className={`${styles.wheelItem} ${((parseInt(sleepEnd.split(':')[0]) < 12 && p === '오전') || (parseInt(sleepEnd.split(':')[0]) >= 12 && p === '오후')) ? styles.selected : ''}`}>{p}</div>)}
                                                                </div>
                                                            </div>
                                                            {/* Hour (1-12) */}
                                                            <div className={styles.wheelContainer} style={{ width: '35px' }}>
                                                                <div id="wheel-end-h" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return;
                                                                    const h12 = Math.round(e.target.scrollTop / 30) + 1;
                                                                    const [h24, m] = sleepEnd.split(':').map(Number);
                                                                    const isPM = h24 >= 12;
                                                                    let newH24 = (h12 % 12) + (isPM ? 12 : 0);
                                                                    if (newH24 !== h24) handleSleepChange('end', `${String(newH24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {Array.from({ length: 12 }).map((_, i) => <div key={i} className={`${styles.wheelItem} ${(parseInt(sleepEnd.split(':')[0]) % 12 || 12) === i + 1 ? styles.selected : ''}`}>{i + 1}</div>)}
                                                                </div>
                                                            </div>
                                                            <span className={styles.wheelSeparator}>:</span>
                                                            {/* Minute (0-59) */}
                                                            <div className={styles.wheelContainer} style={{ width: '35px' }}>
                                                                <div id="wheel-end-m" className={styles.wheelList} onScroll={(e) => {
                                                                    if (draggingType) return;
                                                                    const m = Math.round(e.target.scrollTop / 30);
                                                                    const [h24, currM] = sleepEnd.split(':').map(Number);
                                                                    if (m !== currM && m >= 0 && m < 60) handleSleepChange('end', `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                                                                }}>
                                                                    {Array.from({ length: 60 }).map((_, i) => <div key={i} className={`${styles.wheelItem} ${parseInt(sleepEnd.split(':')[1]) === i ? styles.selected : ''}`}>{String(i).padStart(2, '0')}</div>)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <textarea
                            className={`form-textarea ${styles.editor}`}
                            placeholder="오늘 하루 있었던 일을 적어보세요...&#10;&#10;예시: 오늘 아침에 일찍 일어나서 조깅을 했다. 날씨가 좋아서 기분이 상쾌했다..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            disabled={isAnalyzing}
                        />

                        {images.length > 0 && (
                            <div className={styles.imagePreviewArea}>
                                {images.map((img, idx) => (
                                    <div key={idx} className={styles.previewImageWrapper}>
                                        <img src={img} alt={`preview-${idx}`} className={styles.previewImage} />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className={styles.removeImageBtn}
                                        >
                                            &times;
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.editorFooter}>
                            <span className={styles.charCount}>{getCharacterCount()}자</span>
                            <div className={styles.actions}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                />
                                <button
                                    type="button"
                                    className={`btn btn-secondary ${styles.iconBtn}`}
                                    onClick={handleFileBtnClick}
                                    title="사진 첨부"
                                >
                                    <Image size={18} />
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!content.trim() || isAnalyzing}
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <span className={styles.spinner}></span>
                                            분석 중...
                                        </>
                                    ) : (
                                        <>
                                            {editId ? <Save size={16} /> : <Sparkles size={16} />}
                                            {editId ? '수정 완료' : 'AI 분석 받기'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {showSettings && (
                        <div className={`card ${styles.settingsCard}`}>
                            <h3 className="card-title">
                                <Settings size={18} />
                                AI 분석 설정
                            </h3>

                            <div className={styles.personalitySection}>
                                <label className="form-label">AI 성격 선택</label>
                                <div className={styles.personalityOptions}>
                                    {aiPersonalities.map(p => (
                                        <label
                                            key={p.id}
                                            className={`${styles.personalityOption} ${personality === p.id ? styles.selected : ''}`}
                                        >
                                            <input
                                                type="radio"
                                                name="personality"
                                                value={p.id}
                                                checked={personality === p.id}
                                                onChange={(e) => setPersonality(e.target.value)}
                                            />
                                            <div className={styles.personalityContent}>
                                                <span className={styles.personalityName}>{p.name}</span>
                                                <span className={styles.personalityDesc}>{p.description}</span>
                                                {p.example && (
                                                    <div className={styles.personalityExample}>
                                                        <strong>예시:</strong> "{p.example}"
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                <aside className={styles.sidebar}>
                    <div className={`card ${styles.tipsCard}`}>
                        <h3 className="card-title">
                            <PenLine size={18} />
                            작성 팁
                        </h3>
                        <ul className={styles.tipsList}>
                            <li>오늘 있었던 일을 시간 순서대로 적어보세요</li>
                            <li>감정과 생각을 솔직하게 표현해보세요</li>
                            <li>구체적인 상황을 묘사하면 더 정확한 분석이 가능해요</li>
                            <li>건강, 관계, 업무 등 다양한 영역을 언급해보세요</li>
                        </ul>
                    </div>

                    <div className={`card ${styles.metricsCard}`}>
                        <h3 className="card-title">분석 지표</h3>
                        <div className={styles.metricsList}>
                            {metrics.map(m => (
                                <div key={m.id} className={styles.metricItem}>
                                    <span className={styles.metricIcon}>{m.icon}</span>
                                    <span>{m.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>
            </div >

            {analyzedDiary && (
                <AnalysisModal
                    diary={analyzedDiary}
                    onClose={handleModalClose}
                />
            )
            }
        </div >
    );
}

export default function WritePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WriteContent />
        </Suspense>
    );
}
