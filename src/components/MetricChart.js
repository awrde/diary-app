'use client';

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const metricColors = {
    health: { main: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)' },
    money: { main: '#eab308', bg: 'rgba(234, 179, 8, 0.1)' },
    relationship: { main: '#ec4899', bg: 'rgba(236, 72, 153, 0.1)' },
    growth: { main: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    rest: { main: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
    hobby: { main: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' },
    work: { main: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' }
};

const metricNames = {
    health: '건강',
    money: '재정',
    relationship: '인간관계',
    growth: '성장',
    rest: '휴식',
    hobby: '취미',
    work: '업무'
};

export default function MetricChart({ data, selectedMetrics = ['health', 'relationship', 'growth'], height = 300 }) {
    const chartData = {
        labels: data.map(d => d.date),
        datasets: selectedMetrics.map(metric => ({
            label: metricNames[metric],
            data: data.map(d => d[metric]),
            borderColor: metricColors[metric].main,
            backgroundColor: metricColors[metric].bg,
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: metricColors[metric].main,
            pointBorderColor: '#1a1a2e',
            pointBorderWidth: 2
        }))
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    color: '#94a3b8',
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        family: 'Inter',
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(30, 30, 50, 0.95)',
                titleColor: '#f8fafc',
                bodyColor: '#94a3b8',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 8,
                titleFont: {
                    family: 'Inter',
                    size: 14,
                    weight: 600
                },
                bodyFont: {
                    family: 'Inter',
                    size: 12
                }
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            },
            y: {
                min: 0,
                max: 5.5,
                grace: '5%',
                grid: {
                    color: 'rgba(255, 255, 255, 0.05)',
                },
                ticks: {
                    color: '#64748b',
                    stepSize: 1,
                    callback: function (value) {
                        if (value <= 5) return value;
                        return '';
                    },
                    font: {
                        family: 'Inter',
                        size: 11
                    }
                }
            }
        }
    };

    return (
        <div style={{ height: height }}>
            <Line data={chartData} options={options} />
        </div>
    );
}
