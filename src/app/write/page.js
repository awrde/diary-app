'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PenLine, Image, Sparkles, Settings, Save, ClipboardList } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import { aiPersonalities, metrics } from '@/lib/mockData';
import AnalysisModal from '@/components/AnalysisModal';
import styles from './page.module.css';

function WriteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const editId = searchParams.get('edit');

    const { addDiary, updateDiary, diaries, settings } = useDiary();
    const [content, setContent] = useState('');
    const [showSettings, setShowSettings] = useState(false);
    const [personality, setPersonality] = useState(settings.personality);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzedDiary, setAnalyzedDiary] = useState(null);
    const [images, setImages] = useState([]);
    const fileInputRef = useRef(null);

    // 수정 모드일 때 데이터 로드 또는 URL 파라미터로 내용 수신
    useEffect(() => {
        if (editId && diaries.length > 0) {
            const id = parseInt(editId);
            const diary = diaries.find(d => d.id === id);
            if (diary) {
                setContent(diary.content);
                setImages(diary.images || []);
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

    const handleClipboardImport = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                if (content.trim()) {
                    if (confirm('이미 작성된 내용이 있습니다. 덮어쓰시겠습니까? (취소 시 기존 내용 뒤에 추가됩니다)')) {
                        setContent(text);
                    } else {
                        setContent(prev => prev + '\n\n' + text);
                    }
                } else {
                    setContent(text);
                }
            }
        } catch (err) {
            console.error('Clipboard read failed:', err);
            alert('클립보드 내용을 가져오는데 실패했습니다. 브라우저 권한을 확인해주세요.');
        }
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
                personality
            });
            setIsAnalyzing(false);
            setAnalyzedDiary(updated);
        } else {
            const newDiary = await addDiary({
                content,
                images,
                personality
            });
            setIsAnalyzing(false);
            setAnalyzedDiary(newDiary);
            setContent('');
            setImages([]);
        }
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
                    {editId ? '기록된 내용을 수정하고 다시 분석받아보세요.' : '오늘 하루는 어땠나요? 자유롭게 기록해보세요.'}
                </p>
            </header>

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
                                <button type="button" className="btn btn-secondary" onClick={handleFileBtnClick}>
                                    <Image size={16} />
                                    사진 첨부
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleClipboardImport}>
                                    <ClipboardList size={16} />
                                    클립보드 가져오기
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
            </div>

            {analyzedDiary && (
                <AnalysisModal
                    diary={analyzedDiary}
                    onClose={handleModalClose}
                />
            )}
        </div>
    );
}

export default function WritePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WriteContent />
        </Suspense>
    );
}
