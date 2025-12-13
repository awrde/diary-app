'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';
import styles from './DatePickerModal.module.css';

// ISO 8601 주차 계산 (월요일 시작, 첫 목요일 포함 주가 1주차)
function getISOWeekNumber(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // 목요일로 이동 (ISO 주의 기준)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNum;
}

// ISO 8601 주의 시작일(월요일)과 종료일(일요일) 계산
function getISOWeekRange(year, weekNum) {
    // 해당 연도 1월 4일이 속한 주가 1주차
    const jan4 = new Date(year, 0, 4);
    const jan4DayOfWeek = jan4.getDay() || 7; // 월=1, 일=7

    // 1주차의 월요일 찾기
    const week1Monday = new Date(jan4);
    week1Monday.setDate(jan4.getDate() - jan4DayOfWeek + 1);

    // 원하는 주차의 월요일 계산
    const targetMonday = new Date(week1Monday);
    targetMonday.setDate(week1Monday.getDate() + (weekNum - 1) * 7);

    // 일요일 계산
    const targetSunday = new Date(targetMonday);
    targetSunday.setDate(targetMonday.getDate() + 6);

    return { startDate: targetMonday, endDate: targetSunday };
}

// 특정 월에 속하는 ISO 주차들 가져오기
function getISOWeeksInMonth(year, month) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 월의 첫째 날이 속한 주
    let currentDate = new Date(firstDay);
    const firstWeek = getISOWeekNumber(firstDay);

    // 이 월에 속하는 모든 주차 수집
    const seenWeeks = new Set();

    while (currentDate <= lastDay) {
        const weekNum = getISOWeekNumber(currentDate);
        const weekYear = getISOWeekYear(currentDate);
        const key = `${weekYear}-W${weekNum}`;

        if (!seenWeeks.has(key)) {
            seenWeeks.add(key);
            const range = getISOWeekRange(weekYear, weekNum);
            const weekInMonth = weeks.length + 1;
            weeks.push({
                weekNum,
                weekYear,
                weekInMonth,
                range,
                display: `${weekInMonth}주차`
            });
        }

        currentDate.setDate(currentDate.getDate() + 7);
    }

    return weeks;
}

// ISO 주가 속한 연도 (12월 마지막 주가 다음해 1주일 수 있음)
function getISOWeekYear(date) {
    const d = new Date(date);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    return d.getFullYear();
}

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function DatePickerModal({
    isOpen,
    onClose,
    onSelect,
    currentDate,
    periodType
}) {
    const [viewMode, setViewMode] = useState('week');
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());

    // 모달이 열릴 때 초기 상태 재설정
    useEffect(() => {
        if (isOpen) {
            setViewMode(periodType === 'week' ? 'week' : periodType === 'month' ? 'month' : 'year');
            setSelectedYear(currentDate.getFullYear());
            setSelectedMonth(currentDate.getMonth());
        }
    }, [isOpen]); // periodType과 currentDate는 isOpen이 true가 될 때 최신값이므로 의존성 최소화

    if (!isOpen) return null;

    const handleYearSelect = (year) => {
        setSelectedYear(year);
        if (periodType === 'year') {
            const date = new Date(year, 6, 1);
            onSelect(date);
            onClose();
        } else {
            setViewMode('month');
        }
    };

    const handleMonthSelect = (month) => {
        setSelectedMonth(month);
        if (periodType === 'month') {
            const date = new Date(selectedYear, month, 15);
            onSelect(date);
            onClose();
        } else {
            setViewMode('week');
        }
    };

    const handleWeekSelect = (week) => {
        // 주의 목요일을 기준으로 선택 (ISO 8601 중간점)
        const thursday = new Date(week.range.startDate);
        thursday.setDate(thursday.getDate() + 3);
        onSelect(thursday);
        onClose();
    };

    const handleViewModeUp = () => {
        if (viewMode === 'week') setViewMode('month');
        else if (viewMode === 'month') setViewMode('year');
    };

    const handleViewModeDown = () => {
        if (viewMode === 'year') setViewMode('month');
        else if (viewMode === 'month') setViewMode('week');
    };

    const getTitle = () => {
        if (viewMode === 'year') return '연도 선택';
        if (viewMode === 'month') return `${selectedYear}년`;
        return `${selectedYear}년 ${selectedMonth + 1}월`;
    };

    // 상위 레벨로 이동 가능 여부 (Year가 최상위)
    const canGoUp = viewMode !== 'year';

    // 하위 레벨로 이동 가능 여부 (PeriodType에 따라 제한)
    const canGoDown = (viewMode === 'year' && periodType !== 'year') ||
        (viewMode === 'month' && periodType === 'week');

    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
    const isoWeeks = getISOWeeksInMonth(selectedYear, selectedMonth);

    const formatDateShort = (date) => {
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    {canGoDown && (
                        <button className={styles.navBtn} onClick={handleViewModeDown}>
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <span className={styles.title}>{getTitle()}</span>
                    {canGoUp && (
                        <button className={styles.navBtn} onClick={handleViewModeUp}>
                            <ChevronRight size={18} />
                        </button>
                    )}
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={18} />
                    </button>
                </div>

                <div className={styles.content}>
                    {viewMode === 'year' && (
                        <div className={styles.grid3}>
                            {years.map(year => (
                                <button
                                    key={year}
                                    className={`${styles.item} ${year === selectedYear ? styles.selected : ''}`}
                                    onClick={() => handleYearSelect(year)}
                                >
                                    {year}년
                                </button>
                            ))}
                        </div>
                    )}

                    {viewMode === 'month' && (
                        <div className={styles.grid3}>
                            {MONTHS.map((month, index) => (
                                <button
                                    key={month}
                                    className={`${styles.item} ${index === selectedMonth ? styles.selected : ''}`}
                                    onClick={() => handleMonthSelect(index)}
                                >
                                    {month}
                                </button>
                            ))}
                        </div>
                    )}

                    {viewMode === 'week' && (
                        <div className={styles.weekList}>
                            {isoWeeks.map((week, idx) => {
                                const rangeText = `${formatDateShort(week.range.startDate)} (월) ~ ${formatDateShort(week.range.endDate)} (일)`;

                                return (
                                    <button
                                        key={idx}
                                        className={styles.weekItem}
                                        onClick={() => handleWeekSelect(week)}
                                    >
                                        <span className={styles.weekNum}>{week.display}</span>
                                        <span className={styles.weekRange}>{rangeText}</span>
                                        <Check size={16} className={styles.checkIcon} />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className={styles.footer}>
                    <span className={styles.hint}>
                        {viewMode === 'year' && '연도를 선택하세요'}
                        {viewMode === 'month' && '월을 선택하세요'}
                        {viewMode === 'week' && '주차를 선택하세요 (월~일)'}
                    </span>
                </div>
            </div>
        </div>
    );
}
