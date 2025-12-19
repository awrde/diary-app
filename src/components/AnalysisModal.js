'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useDiary } from '@/context/DiaryContext';
import { X, Sparkles, TrendingUp, MessageCircle, Trash2, CheckCircle, AlertCircle, RotateCcw, Copy, Download, ExternalLink, Hash } from 'lucide-react';
import { convertToMarkdown, copyToClipboard, downloadMarkdown, openInObsidian } from '@/lib/obsidianUtils';
import EmotionRadar from './EmotionRadar';
import styles from './AnalysisModal.module.css';
import { metrics } from '@/lib/mockData';

export default function AnalysisModal({ diary, onClose }) {
    const [mounted, setMounted] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // 삭제 확인 상태
    const [copyStatus, setCopyStatus] = useState(false);
    const router = useRouter();
    const { deleteDiary } = useDiary();

    useEffect(() => {
        setMounted(true);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // 외부 클릭 시 확인 상태 초기화
    const handleOverlayClick = (e) => {
        if (isConfirming) {
            setIsConfirming(false);
        } else {
            onClose();
        }
    };

    if (!mounted || !diary || !diary.analysis) return null;

    const { analysis } = diary;

    const handleDelete = async (e) => {
        e.stopPropagation();
        e.preventDefault();

        // 1단계: 확인 모드로 전환
        if (!isConfirming) {
            setIsConfirming(true);
            return;
        }

        // 2단계: 실제 삭제 수행
        try {
            await deleteDiary(diary.id);
            onClose();
        } catch (err) {
            console.error('Delete failed:', err);
            // 에러 시에는 어쩔 수 없이 alert 사용
            alert('삭제에 실패했습니다. 다시 시도해주세요.');
            setIsConfirming(false);
        }
    };

    const handleEdit = (e) => {
        e.stopPropagation();
        e.preventDefault();
        router.push(`/write?edit=${diary.id}`);
    };

    const handleCopyMarkdown = async () => {
        const md = convertToMarkdown(diary, metrics);
        const success = await copyToClipboard(md);
        if (success) {
            setCopyStatus(true);
            setTimeout(() => setCopyStatus(false), 2000);
        }
    };

    const handleDownloadMarkdown = () => {
        const md = convertToMarkdown(diary, metrics);
        const filename = `diary-${diary.date}.md`;
        downloadMarkdown(filename, md);
    };

    const handleOpenInObsidian = () => {
        const md = convertToMarkdown(diary, metrics);
        const filename = `diary-${diary.date}.md`;
        openInObsidian(filename, md);
    };

    const modalContent = (
        <div
            className="modal-overlay"
            onClick={handleOverlayClick}
            style={{ zIndex: 99999 }}
        >
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className={styles.title}>
                        <Sparkles size={24} />
                        AI 분석 결과
                    </h2>
                    <button type="button" className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>
                        <TrendingUp size={18} />
                        오늘의 요약
                    </h3>
                    <p className={styles.summary}>{analysis.summary}</p>
                </div>

                <div className={styles.grid}>
                    <div className={styles.emotionSection}>
                        <h3 className={styles.sectionTitle}>감정 분석</h3>
                        <EmotionRadar emotionalScore={analysis.emotionalScore} />
                        <div className={styles.emotionLabels}>
                            <span className={styles.positive}>긍정 {analysis.emotionalScore.positive}%</span>
                            <span className={styles.negative}>부정 {analysis.emotionalScore.negative}%</span>
                        </div>
                    </div>

                    <div className={styles.metricsSection}>
                        <h3 className={styles.sectionTitle}>지표별 점수</h3>
                        <div className={styles.metricsList}>
                            {metrics.map(metric => {
                                const score = analysis.metricScores[metric.id];
                                return (
                                    <div key={metric.id} className={styles.metricItem}>
                                        <div className={styles.metricHeader}>
                                            <span>{metric.icon} {metric.name}</span>
                                            <span className={styles.metricScore}>{score}/5</span>
                                        </div>
                                        <div className="score-bar">
                                            <div
                                                className="score-bar-fill"
                                                style={{
                                                    width: `${(score / 5) * 100}%`,
                                                    background: metric.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.feedbackSection}>
                    <h3 className={styles.sectionTitle}>
                        <MessageCircle size={18} />
                        AI 피드백
                    </h3>
                    <div className={styles.feedback}>
                        {analysis.feedback}
                    </div>
                </div>

                <div className={styles.obsidianSection}>
                    <h3 className={styles.sectionTitle}>
                        <Hash size={18} />
                        Obsidian 연동
                    </h3>
                    <div className={styles.obsidianButtons}>
                        <button type="button" className={styles.obsidianBtn} onClick={handleCopyMarkdown}>
                            {copyStatus ? <CheckCircle size={16} /> : <Copy size={16} />}
                            {copyStatus ? '복사 완료!' : '마크다운 복사'}
                        </button>
                        <button type="button" className={styles.obsidianBtn} onClick={handleDownloadMarkdown}>
                            <Download size={16} />
                            MD 파일 다운로드
                        </button>
                        <button type="button" className={styles.obsidianBtn} onClick={handleOpenInObsidian}>
                            <ExternalLink size={16} />
                            옵시디언으로 열기
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: 'var(--space-lg)', position: 'relative' }}>
                    {isConfirming ? (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsConfirming(false);
                            }}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                zIndex: 10000,
                                pointerEvents: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <RotateCcw size={16} />
                            취소
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={handleEdit}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                zIndex: 10000,
                                pointerEvents: 'auto'
                            }}
                        >
                            수정
                        </button>
                    )}

                    <button
                        type="button"
                        className="btn"
                        onClick={handleDelete}
                        style={{
                            flex: isConfirming ? 3 : 1, // 확인 시 버튼 커짐
                            backgroundColor: isConfirming ? '#dc2626' : '#ef4444',
                            color: 'white',
                            cursor: 'pointer',
                            zIndex: 10000,
                            pointerEvents: 'auto',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            fontWeight: isConfirming ? 'bold' : 'normal'
                        }}
                    >
                        {isConfirming ? (
                            <>
                                <AlertCircle size={18} />
                                정말 삭제하시겠습니까?
                            </>
                        ) : (
                            <>
                                <Trash2 size={18} />
                                삭제
                            </>
                        )}
                    </button>

                    {!isConfirming && (
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={onClose}
                            style={{ flex: 2, cursor: 'pointer', zIndex: 10000, pointerEvents: 'auto' }}
                        >
                            확인
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
