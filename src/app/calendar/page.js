'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import styles from './page.module.css';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function CalendarPage() {
    const router = useRouter();
    const { diaries } = useDiary();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isYearView, setIsYearView] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 일기 작성 여부를 빠르게 확인하기 위한 Set (성능 최적화)
    const diaryDatesSet = useMemo(() => new Set(diaries.map(d => d.date)), [diaries]);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handlePrevYear = () => {
        setCurrentDate(new Date(year - 1, month, 1));
    };

    const handleNextYear = () => {
        setCurrentDate(new Date(year + 1, month, 1));
    };

    const handleDayClick = (dayInfo) => {
        const existingDiary = diaries.find(d => d.date === dayInfo.dateKey);
        if (existingDiary) {
            router.push(`/write?edit=${existingDiary.id}`);
        } else {
            router.push(`/write?date=${dayInfo.dateKey}`);
        }
    };

    const handleMonthSelect = (m) => {
        setCurrentDate(new Date(year, m, 1));
        setIsYearView(false);
    };

    const isToday = (day, m, y) => {
        const today = new Date();
        return day === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    // 특정 월의 날짜 배열 생성
    const getDaysForMonth = (y, m) => {
        const firstDay = new Date(y, m, 1);
        const lastDay = new Date(y, m + 1, 0);
        const firstDayWeekday = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days = [];
        // 이전 달 빈칸
        for (let i = 0; i < firstDayWeekday; i++) {
            days.push({ day: null, isCurrentMonth: false });
        }
        // 현재 달
        for (let i = 1; i <= totalDays; i++) {
            const dateKey = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            days.push({
                day: i,
                isCurrentMonth: true,
                dateKey,
                hasDiary: diaryDatesSet.has(dateKey)
            });
        }

        // 다음 달 빈칸 채우기 (항상 42칸 유지)
        const remaining = 42 - days.length;
        for (let i = 0; i < remaining; i++) {
            days.push({ day: null, isCurrentMonth: false });
        }

        return days;
    };

    // 현재 월 뷰 렌더링용 날짜 데이터
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayWeekday = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const days = [];
        const prevMonthDate = new Date(year, month, 0);
        const prevMonthLastDate = prevMonthDate.getDate();
        const prevMonthYear = prevMonthDate.getFullYear();
        const prevMonth = prevMonthDate.getMonth();

        for (let i = firstDayWeekday - 1; i >= 0; i--) {
            const d = prevMonthLastDate - i;
            days.push({
                day: d,
                month: prevMonth,
                year: prevMonthYear,
                isCurrentMonth: false,
                dateKey: `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
            });
        }

        for (let i = 1; i <= totalDays; i++) {
            days.push({
                day: i,
                month: month,
                year: year,
                isCurrentMonth: true,
                dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        const remainingCells = 42 - days.length;
        const nextMonthDate = new Date(year, month + 1, 1);
        const nextMonthYear = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth();

        for (let i = 1; i <= remainingCells; i++) {
            days.push({
                day: i,
                month: nextMonth,
                year: nextMonthYear,
                isCurrentMonth: false,
                dateKey: `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }
        return days;
    }, [year, month, diaryDatesSet]);

    return (
        <div className={styles.calendarPage}>
            <div className={`card ${styles.calendarCard}`}>
                <div className={styles.calendarHeader}>
                    <div className={styles.currentMonth} onClick={() => setIsYearView(!isYearView)}>
                        <CalendarIcon size={24} className="text-accent" />
                        {isYearView ? `${year}년` : `${year}년 ${month + 1}월`}
                    </div>
                    <div className={styles.navButtons}>
                        <button className={styles.navBtn} onClick={isYearView ? handlePrevYear : handlePrevMonth} title={isYearView ? "이전 연도" : "이전 달"}>
                            {isYearView ? <ChevronsLeft size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        <button className={styles.navBtn} onClick={() => {
                            setCurrentDate(new Date());
                            setIsYearView(false);
                        }}>
                            {isYearView ? '올해' : '오늘'}
                        </button>
                        <button className={styles.navBtn} onClick={isYearView ? handleNextYear : handleNextMonth} title={isYearView ? "다음 연도" : "다음 달"}>
                            {isYearView ? <ChevronsRight size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>
                </div>

                {isYearView ? (
                    <div className={styles.yearViewGrid}>
                        {MONTHS.map((mName, mIdx) => {
                            const monthDays = getDaysForMonth(year, mIdx);
                            return (
                                <div key={mIdx} className={styles.monthCard} onClick={() => handleMonthSelect(mIdx)}>
                                    <div className={styles.monthTitle}>{mName}</div>
                                    <div className={styles.miniCalendarGrid}>
                                        {monthDays.map((d, dIdx) => (
                                            <div
                                                key={dIdx}
                                                className={`
                                                    ${styles.miniDay} 
                                                    ${!d.isCurrentMonth ? styles.notInMonth : ''} 
                                                    ${d.hasDiary ? styles.hasDiary : ''}
                                                `}
                                            >
                                                {d.day}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className={styles.calendarGrid}>
                        {DAYS.map(day => (
                            <div key={day} className={styles.weekday}>{day}</div>
                        ))}

                        {calendarDays.map((dayInfo, idx) => {
                            const hasEntry = diaryDatesSet.has(dayInfo.dateKey);
                            const today = isToday(dayInfo.day, dayInfo.month, dayInfo.year);

                            return (
                                <div
                                    key={idx}
                                    className={`
                                        ${styles.day} 
                                        ${!dayInfo.isCurrentMonth ? styles.notInMonth : ''} 
                                        ${hasEntry ? styles.hasDiary : ''}
                                        ${today ? styles.today : ''}
                                    `}
                                    onClick={() => handleDayClick(dayInfo)}
                                >
                                    <span className={styles.dayNumber}>{dayInfo.day}</span>
                                    {hasEntry && (
                                        <div className={styles.indicator}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
