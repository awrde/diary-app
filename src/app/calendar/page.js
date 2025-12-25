'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { useDiary } from '@/context/DiaryContext';
import styles from './page.module.css';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarPage() {
    const router = useRouter();
    const { diaries } = useDiary();
    const [currentDate, setCurrentDate] = useState(new Date());

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();

    const calendarDays = [];

    // 이전 달 정보
    const prevMonthDate = new Date(year, month, 0);
    const prevMonthLastDate = prevMonthDate.getDate();
    const prevMonthYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();

    // 이전 달 빈칸 채우기
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
        const d = prevMonthLastDate - i;
        calendarDays.push({
            day: d,
            month: prevMonth,
            year: prevMonthYear,
            isCurrentMonth: false,
            dateKey: `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        });
    }

    // 현재 달 채우기
    for (let i = 1; i <= totalDays; i++) {
        calendarDays.push({
            day: i,
            month: month,
            year: year,
            isCurrentMonth: true,
            dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        });
    }

    // 다음 달 정보
    const nextMonthDate = new Date(year, month + 1, 1);
    const nextMonthYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth();

    // 다음 달 빈칸 채우기
    const remainingCells = 42 - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        calendarDays.push({
            day: i,
            month: nextMonth,
            year: nextMonthYear,
            isCurrentMonth: false,
            dateKey: `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        });
    }

    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const handleDayClick = (dayInfo) => {
        const existingDiary = diaries.find(d => d.date === dayInfo.dateKey);
        if (existingDiary) {
            router.push(`/write?edit=${existingDiary.id}`);
        } else {
            router.push(`/write?date=${dayInfo.dateKey}`);
        }
    };

    const hasDiaryEntry = (dateKey) => {
        return diaries.some(d => d.date === dateKey);
    };

    const isToday = (day, m, y) => {
        const today = new Date();
        return day === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    };

    return (
        <div className={styles.calendarPage}>
            <header className="page-header">
                <h1 className="page-title">캘린더</h1>
                <p className="page-subtitle">날짜를 클릭하여 그날의 기록을 남기거나 확인해보세요.</p>
            </header>

            <div className={`card ${styles.calendarCard}`}>
                <div className={styles.calendarHeader}>
                    <div className={styles.currentMonth}>
                        <CalendarIcon size={24} className="text-accent" />
                        {year}년 {month + 1}월
                    </div>
                    <div className={styles.navButtons}>
                        <button className={styles.navBtn} onClick={handlePrevMonth}>
                            <ChevronLeft size={20} />
                        </button>
                        <button className={styles.navBtn} onClick={() => setCurrentDate(new Date())}>
                            오늘
                        </button>
                        <button className={styles.navBtn} onClick={handleNextMonth}>
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.calendarGrid}>
                    {DAYS.map(day => (
                        <div key={day} className={styles.weekday}>{day}</div>
                    ))}

                    {calendarDays.map((dayInfo, idx) => {
                        const hasEntry = hasDiaryEntry(dayInfo.dateKey);
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
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
                <div className={styles.indicator} style={{ position: 'static' }}></div>
                <span>표시된 날짜는 이미 일기가 작성된 날입니다.</span>
            </div>
        </div>
    );
}
