'use client';

import React from 'react';

export default function EmotionRadar({ emotionalScore }) {
    // 긍정 - 부정 차이를 통해 0~100 사이 위치 계산
    // 기본적으로 50에서 시작. (긍정 - 부정)의 절반만큼 이동하여 0~100 스케일로 변환
    // 예: 긍정 90, 부정 10 -> 차이 80 -> 50 + 40 = 90%
    // 예: 긍정 10, 부정 90 -> 차이 -80 -> 50 - 40 = 10%

    // 점수 보정: emotionalScore가 없을 경우 대비
    const positive = emotionalScore?.positive || 0;
    const negative = emotionalScore?.negative || 0;

    const position = 50 + (positive - negative) / 2;
    const clampedPosition = Math.min(Math.max(position, 0), 100);

    let statusText = '평온함';
    if (clampedPosition >= 70) statusText = '매우 긍정적';
    else if (clampedPosition >= 55) statusText = '긍정적';
    else if (clampedPosition <= 30) statusText = '매우 부정적';
    else if (clampedPosition <= 45) statusText = '부정적';

    return (
        <div style={{ padding: '20px 10px', width: '100%' }}>
            {/* 라벨 영역 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>
                <span style={{ color: '#ef4444' }}>부정</span>
                <span style={{ color: '#64748b' }}>중립</span>
                <span style={{ color: '#22c55e' }}>긍정</span>
            </div>

            {/* 바 영역 */}
            <div style={{ position: 'relative', height: '16px', background: 'linear-gradient(90deg, #ef4444 0%, #eab308 50%, #22c55e 100%)', borderRadius: '10px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                {/* 포인터 */}
                <div style={{
                    position: 'absolute',
                    left: `${clampedPosition}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '24px',
                    height: '24px',
                    background: 'white',
                    border: '4px solid #6366f1',
                    borderRadius: '50%',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    transition: 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    zIndex: 10
                }} />

                {/* 중립 가이드라인 */}
                <div style={{
                    position: 'absolute',
                    left: '50%',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: 'rgba(255,255,255,0.5)',
                    transform: 'translateX(-50%)'
                }} />
            </div>

            {/* 상태 텍스트 */}
            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', fontWeight: '600', color: '#475569' }}>
                현재 상태: <span style={{ color: '#6366f1' }}>{statusText}</span>
            </div>
        </div>
    );
}
