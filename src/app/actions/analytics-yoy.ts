"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { Money } from "@/lib/money"
import { generateInsights, MonthlyData, CategoryData } from "@/lib/analytics/insights"

// Helper to determine category type (naive implementation)
function getCategoryType(categoryName: string, isExpense: boolean): 'income' | 'essential' | 'discretionary' {
    if (!isExpense) return 'income';
    
    const lower = categoryName.toLowerCase();
    if (['makan', 'transport', 'sewa', 'listrik', 'tagihan', 'kesehatan', 'pendidikan', 'cicilan'].some(k => lower.includes(k))) {
        return 'essential';
    }
    return 'discretionary';
}

export async function getYearOverYearComparison(year1: number, year2: number) {
    try {
        const [data1, data2] = await Promise.all([
            getYearData(year1),
            getYearData(year2)
        ]);

        // Generate Insights based on Full Year comparison
        const insights = generateInsights(data2.summary, data1.summary);

        return {
            success: true,
            data: {
                year1: data1,
                year2: data2,
                insights
            }
        };
    } catch (error) {
        await logSistem("ERROR", "ANALYTICS", `Gagal mengambil perbandingan YoY ${year1}-${year2}`, (error as Error).stack);
        return { success: false, error: "Gagal mengambil data perbandingan" };
    }
}

async function getYearData(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // 1. Monthly Aggregation
    const monthlyRaw = await prisma.transaksi.findMany({
        where: { tanggal: { gte: startDate, lte: endDate } },
        select: {
            tanggal: true,
            nominal: true,
            debitAkun: { select: { tipe: true } },
            kreditAkun: { select: { tipe: true } }
        }
    });

    const monthlyStats = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        expense: 0,
        income: 0
    }));

    for (const tx of monthlyRaw) {
        const monthIndex = tx.tanggal.getMonth();
        const nominal = Money.toFloat(Number(tx.nominal));
        
        // Expense: Debit is EXPENSE or Credit is User Account (and Debit is not User Account?)
        // Standard logic:
        // Expense: debitAkun.tipe === 'EXPENSE'
        // Income: kreditAkun.tipe === 'INCOME'
        
        if (tx.debitAkun.tipe === 'EXPENSE') {
            monthlyStats[monthIndex].expense += nominal;
        } else if (tx.kreditAkun.tipe === 'INCOME') {
            monthlyStats[monthIndex].income += nominal;
        }
    }

    // 2. Category Aggregation (Full Year)
    const categoryRaw = await prisma.transaksi.groupBy({
        by: ['kategori', 'debitAkunId', 'kreditAkunId'], // Include IDs to join manually? No, groupBy doesn't support relation filter easily in result
        // We need to filter by Expense/Income. 
        // Best to fetch all and aggregate in JS for flexibility or use two queries.
        // Two groupBy queries is better.
        where: { tanggal: { gte: startDate, lte: endDate } },
        _sum: { nominal: true }
    });
    
    // To distinguish Income/Expense categories, we need to know the account type.
    // groupBy doesn't return included relations.
    // Let's use the raw transaction fetch from above if memory allows, or fetch category stats specifically.
    // For scalability, let's fetch specific aggregates.
    
    // Expenses by Category
    const expenseCategories = await prisma.transaksi.groupBy({
        by: ['kategori'],
        where: {
            tanggal: { gte: startDate, lte: endDate },
            debitAkun: { tipe: 'EXPENSE' }
        },
        _sum: { nominal: true }
    });

    // Income by Category
    const incomeCategories = await prisma.transaksi.groupBy({
        by: ['kategori'],
        where: {
            tanggal: { gte: startDate, lte: endDate },
            kreditAkun: { tipe: 'INCOME' }
        },
        _sum: { nominal: true }
    });

    const categories: CategoryData[] = [
        ...expenseCategories.map(c => ({
            name: c.kategori,
            amount: Money.toFloat(Number(c._sum.nominal || 0)),
            type: getCategoryType(c.kategori, true)
        })),
        ...incomeCategories.map(c => ({
            name: c.kategori,
            amount: Money.toFloat(Number(c._sum.nominal || 0)),
            type: 'income' as const
        }))
    ];

    const totalIncome = monthlyStats.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthlyStats.reduce((sum, m) => sum + m.expense, 0);

    const summary: MonthlyData = {
        month: 0, // Represents Full Year
        year: year,
        categories: categories,
        totalIncome,
        totalExpense
    };

    return {
        year,
        monthly: monthlyStats,
        categories,
        summary
    };
}
