"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { Money } from "@/lib/money"
import { formatRupiah } from "@/lib/format"

export interface HeatmapData {
    date: string // YYYY-MM-DD
    total: number
    count: number
    intensity: 0 | 1 | 2 | 3 | 4 // 0=None, 4=Very High
}

export interface PatternInsight {
    title: string
    message: string
    severity: 'info' | 'warning' | 'positive'
}

export async function getSpendingHeatmap(month: number, year: number) {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        const today = new Date();

        const transactions = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startDate, lte: endDate },
                debitAkun: { tipe: 'EXPENSE' }
            },
            select: {
                tanggal: true,
                nominal: true
            }
        });

        // 1. Daily Aggregation
        const dailyMap = new Map<string, { total: number, count: number }>();
        let maxTotal = 0;
        let maxDate = "";

        for (const tx of transactions) {
            const dateStr = tx.tanggal.toISOString().split('T')[0];
            const nominal = Money.toFloat(Number(tx.nominal));
            
            const current = dailyMap.get(dateStr) || { total: 0, count: 0 };
            current.total += nominal;
            current.count += 1;
            dailyMap.set(dateStr, current);

            if (current.total > maxTotal) {
                maxTotal = current.total;
                maxDate = dateStr;
            }
        }

        // Fill all days
        const heatmap: HeatmapData[] = [];
        const daysInMonth = new Date(year, month, 0).getDate();
        let zeroSpendingDays = 0;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const data = dailyMap.get(dateStr) || { total: 0, count: 0 };
            
            // Calculate intensity (0-4)
            let intensity: 0|1|2|3|4 = 0;
            if (data.total > 0) {
                const ratio = data.total / (maxTotal || 1);
                if (ratio < 0.25) intensity = 1;
                else if (ratio < 0.5) intensity = 2;
                else if (ratio < 0.75) intensity = 3;
                else intensity = 4;
            }

            heatmap.push({
                date: dateStr,
                total: data.total,
                count: data.count,
                intensity
            });

            // Count zero spending (only for passed days)
            const currentDate = new Date(dateStr);
            if (data.total === 0 && currentDate < today) {
                zeroSpendingDays++;
            }
        }

        // 2. Pattern Analysis
        const insights: PatternInsight[] = [];
        const monthTotal = heatmap.reduce((sum, d) => sum + d.total, 0);
        // Average based on days PASSED or total days?
        // Usually total days passed if current month, or total days if past month.
        let daysPassed = daysInMonth;
        if (year === today.getFullYear() && month === (today.getMonth() + 1)) {
            daysPassed = today.getDate();
        }
        const dailyAverage = daysPassed > 0 ? monthTotal / daysPassed : 0;

        // A. Daily Average (Always show)
        insights.push({
            title: "Rata-rata Harian",
            message: `Rata-rata pengeluaran Anda adalah ${formatRupiah(dailyAverage)} per hari.`,
            severity: "info"
        });

        // B. Zero Spending
        if (zeroSpendingDays > 0) {
            insights.push({
                title: "Zero Spending Days",
                message: `Hebat! Ada ${zeroSpendingDays} hari tanpa pengeluaran sama sekali bulan ini.`,
                severity: "positive"
            });
        }

        // C. Highest Spending
        if (maxTotal > 0) {
            const maxDateObj = new Date(maxDate);
            insights.push({
                title: "Pengeluaran Tertinggi",
                message: `Puncak pengeluaran terjadi pada tanggal ${maxDateObj.getDate()} sebesar ${formatRupiah(maxTotal)}.`,
                severity: "warning" // Neutral/Warning depending on amount? warning is safer for visibility
            });
        }
        
        // Weekend Spike
        let weekdaySum = 0, weekdayCount = 0;
        let weekendSum = 0, weekendCount = 0;

        heatmap.forEach(day => {
            const date = new Date(day.date);
            const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                weekendSum += day.total;
                weekendCount++;
            } else {
                weekdaySum += day.total;
                weekdayCount++;
            }
        });

        const weekdayAvg = weekdayCount > 0 ? weekdaySum / weekdayCount : 0;
        const weekendAvg = weekendCount > 0 ? weekendSum / weekendCount : 0;

        // Threshold lowered to 1.3 (30%)
        if (weekendAvg > weekdayAvg * 1.3 && weekdayAvg > 0) {
            const increase = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
            insights.push({
                title: "Weekend Spending Spike",
                message: `Pengeluaran akhir pekan ${increase.toFixed(0)}% lebih tinggi dari hari kerja.`,
                severity: "warning"
            });
        }

        // Paycheck Splurge (Assume 25th)
        const payday = heatmap.find(d => d.date.endsWith("-25"));
        
        if (payday && payday.total > dailyAverage * 3) {
            insights.push({
                title: "Paycheck Day Splurge",
                message: "Pengeluaran tanggal 25 sangat tinggi (3x rata-rata). Hindari belanja impulsif saat gajian.",
                severity: "warning"
            });
        }

        // D. Normal Pattern Fallback
        // If only "Daily Average" exists (length 1), add Normal Pattern
        // Or if no warning/positive insights.
        // Zero Spending is "positive", Highest is "warning".
        // If we strictly follow spec "If truly no specific patterns", but we always add Average, Zero, Highest.
        // So "Specific Patterns" refers to anomalies like Weekend/Paycheck.
        // But users said "tidak ada insight apapun". Now we populate it with Average, Zero, Highest.
        // So fallback might not be needed if we always have those.
        // Let's keep it robust.

        if (insights.length === 1) {
             insights.push({
                title: "Pola Normal",
                message: "Tidak ada lonjakan pengeluaran yang signifikan. Pola belanja Anda stabil.",
                severity: "positive"
            });
        }

        return {
            success: true,
            data: {
                heatmap,
                insights,
                stats: {
                    maxTotal,
                    monthAvg: dailyAverage
                }
            }
        };

    } catch (error) {
        await logSistem("ERROR", "ANALYTICS", "Gagal mengambil heatmap", (error as Error).stack);
        return { success: false, error: "Gagal mengambil data heatmap" };
    }
}

export async function getDailyTransactions(dateStr: string) {
    try {
        const start = new Date(dateStr);
        start.setHours(0,0,0,0);
        const end = new Date(dateStr);
        end.setHours(23,59,59,999);

        const transactions = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: start, lte: end },
                debitAkun: { tipe: 'EXPENSE' }
            },
            include: {
                debitAkun: { select: { nama: true } },
                kreditAkun: { select: { nama: true } }
            },
            orderBy: { nominal: 'desc' }
        });

        return {
            success: true,
            data: transactions.map(tx => ({
                ...tx,
                nominal: Money.toFloat(Number(tx.nominal))
            }))
        };
    } catch (error) {
        return { success: false, error: "Gagal mengambil detail transaksi" };
    }
}