'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Home,
    PenLine,
    BarChart3,
    Settings,
    Sparkles,
    Calendar,
    BookOpen
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', icon: Home, label: '대시보드' },
    { href: '/write', icon: PenLine, label: '일기 작성' },
    { href: '/diaries', icon: BookOpen, label: '전체 일기' },
    { href: '/review', icon: Calendar, label: '기간별 회고' },
    { href: '/settings', icon: Settings, label: '설정' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logo}>
                <div className={styles.logoIcon}>
                    <Sparkles size={24} />
                </div>
                <span className={styles.logoText}>AI 일기장</span>
            </div>

            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <div className={styles.stats}>
                    <BarChart3 size={16} />
                    <span>이번 주 기록: 5일</span>
                </div>
            </div>
        </aside>
    );
}
