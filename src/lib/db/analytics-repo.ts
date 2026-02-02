import { db } from "./app-db";
import { Money } from "@/lib/money";
import { toDayKey } from "./summary";

export type PeriodType = '7D' | '30D' | '12W' | '6M' | '1Y';

export interface CashFlowData {
    periode: string
    income: {
        count: number
        total: number
        avgPerDay: number
        avgPerRecord: number
    }
    expense: {
        count: number
        total: number
        avgPerDay: number
        avgPerRecord: number
    }
    cashFlow: number
}

export interface IncomeExpenseItem {
    kategori: string
    icon: string
    color: string
    nominal: number
    persentase: number
    vsLastPeriod: number
}

export interface IncomeExpenseBook {
    periode: string
    totalIncome: number
    totalExpense: number
    cashFlow: number
    vsLastPeriod: number
    incomeItems: IncomeExpenseItem[]
    expenseItems: IncomeExpenseItem[]
}

interface SpendingInsight {
    kategori: string
    nominal: number
    count: number
    persentase: number
    avgPerTransaction: number
    trend: number
    status: string
}

interface SpendingData {
    topCategories: SpendingInsight[]
    spendingByDay: { hari: string; nominal: number }[]
    totalSpending: number
    avgDaily: number
    transactionCount: number
}

function getPeriodRange(period: PeriodType): { start: Date; end: Date; days: number; prevStart: Date; prevEnd: Date } {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    let start: Date
    let days: number

    switch (period) {
        case '7D':
            start = new Date(end)
            start.setDate(start.getDate() - 6)
            days = 7
            break
        case '30D':
            start = new Date(end)
            start.setDate(start.getDate() - 29)
            days = 30
            break
        case '12W':
            start = new Date(end)
            start.setDate(start.getDate() - 83) // ~12 weeks
            days = 84
            break
        case '6M':
            start = new Date(end)
            start.setMonth(start.getMonth() - 6)
            days = 180
            break
        case '1Y':
            start = new Date(end)
            start.setFullYear(start.getFullYear() - 1)
            days = 365
            break
        default:
            start = new Date(end)
            start.setDate(start.getDate() - 29)
            days = 30
    }

    start.setHours(0, 0, 0, 0)

    // Previous period
    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    prevEnd.setHours(23, 59, 59, 999)

    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevStart.getDate() - days + 1)
    prevStart.setHours(0, 0, 0, 0)

    return { start, end, days, prevStart, prevEnd }
}

const periodLabels: Record<PeriodType, string> = {
    '7D': '7 Hari Terakhir',
    '30D': '30 Hari Terakhir',
    '12W': '12 Minggu Terakhir',
    '6M': '6 Bulan Terakhir',
    '1Y': '1 Tahun Terakhir'
}

// Helper to fetch transactions with account info
async function fetchTransactionsWithAccounts(start: Date, end: Date) {
    // Validate dates to prevent IDBKeyRange errors
    if (!(start instanceof Date) || isNaN(start.getTime())) {
        console.error("fetchTransactionsWithAccounts: Invalid start date", start);
        return [];
    }
    if (!(end instanceof Date) || isNaN(end.getTime())) {
        console.error("fetchTransactionsWithAccounts: Invalid end date", end);
        return [];
    }

    // Use filter instead of between to avoid potential IDBKeyRange errors
    const txs = await db.transaksi
        .filter(tx => tx.tanggal >= start && tx.tanggal <= end)
        .toArray();

    // Fetch unique account IDs
    const accountIds = new Set<string>();
    txs.forEach(tx => {
        accountIds.add(tx.debitAkunId);
        accountIds.add(tx.kreditAkunId);
    });

    const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    return txs.map(tx => ({
        ...tx,
        debitAkun: accountMap.get(tx.debitAkunId),
        kreditAkun: accountMap.get(tx.kreditAkunId)
    }));
}

function getTodayDateRange() {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function getYesterdayDateRange() {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}

function calculatePercentageChange(current: number, previous: number): number | null {
    if (previous === 0) return null;
    const percentage = ((current - previous) / previous) * 100;
    return Math.round(percentage * 10) / 10;
}

async function getDailySummary(dateKey: string, dateRange: { start: Date, end: Date }) {
    // Note: We ignore summaryHeatmapDay here because it only tracks expenses (totalOut).
    // To get accurate Income and Net, we must fetch transactions.
    
    const txs = await fetchTransactionsWithAccounts(dateRange.start, dateRange.end);
    let income = 0;
    let expense = 0;
    
    for (const tx of txs) {
        const nominal = Money.toFloat(tx.nominalInt);
        if (tx.kreditAkun?.tipe === "INCOME") {
            income += nominal;
        } else if (tx.debitAkun?.tipe === "EXPENSE") {
            expense += nominal;
        }
    }
    
    return {
        income,
        expense,
        net: income - expense,
        transactionCount: txs.length
    };
}

// Cash Flow Table - ringkasan income vs expense
export async function getCashFlowTable(period: PeriodType = '30D') {
    try {
        const { start, end, days, prevStart, prevEnd } = getPeriodRange(period)

        // Current period transactions
        const currentTx = await fetchTransactionsWithAccounts(start, end);

        // Previous period for comparison
        const prevTx = await fetchTransactionsWithAccounts(prevStart, prevEnd);

        // Calculate current period
        let incomeCount = 0, incomeTotal = 0
        let expenseCount = 0, expenseTotal = 0

        for (const tx of currentTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            if (tx.kreditAkun?.tipe === "INCOME") {
                incomeCount++
                incomeTotal += nominal
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                expenseCount++
                expenseTotal += nominal
            }
        }

        // Calculate previous period
        let prevIncomeTotal = 0, prevExpenseTotal = 0
        for (const tx of prevTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            if (tx.kreditAkun?.tipe === "INCOME") {
                prevIncomeTotal += nominal
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                prevExpenseTotal += nominal
            }
        }

        const result: CashFlowData = {
            periode: periodLabels[period],
            income: {
                count: incomeCount,
                total: incomeTotal,
                avgPerDay: days > 0 ? Math.round(incomeTotal / days) : 0,
                avgPerRecord: incomeCount > 0 ? Math.round(incomeTotal / incomeCount) : 0
            },
            expense: {
                count: expenseCount,
                total: expenseTotal,
                avgPerDay: days > 0 ? Math.round(expenseTotal / days) : 0,
                avgPerRecord: expenseCount > 0 ? Math.round(expenseTotal / expenseCount) : 0
            },
            cashFlow: incomeTotal - expenseTotal
        }

        const vsLastPeriod = {
            income: prevIncomeTotal > 0 ? Math.round(((incomeTotal - prevIncomeTotal) / prevIncomeTotal) * 100) : (incomeTotal > 0 ? 100 : 0),
            expense: prevExpenseTotal > 0 ? Math.round(((expenseTotal - prevExpenseTotal) / prevExpenseTotal) * 100) : (expenseTotal > 0 ? 100 : 0)
        }

        return { success: true, data: result, vsLastPeriod }
    } catch (error) {
        console.error("[ANALYTICS] getCashFlowTable error:", error)
        return { success: false, data: null, vsLastPeriod: null }
    }
}

// Income & Expense Book - breakdown per kategori
export async function getIncomeExpenseBook(period: PeriodType = '30D') {
    try {
        const { start, end, days, prevStart, prevEnd } = getPeriodRange(period)

        // Current period
        const currentTx = await fetchTransactionsWithAccounts(start, end);

        // Previous period
        const prevTx = await fetchTransactionsWithAccounts(prevStart, prevEnd);

        // Aggregate current
        const incomeMap = new Map<string, number>()
        const expenseMap = new Map<string, number>()
        let totalIncome = 0, totalExpense = 0

        for (const tx of currentTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            if (tx.kreditAkun?.tipe === "INCOME") {
                totalIncome += nominal
                incomeMap.set(tx.kategori, (incomeMap.get(tx.kategori) || 0) + nominal)
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                totalExpense += nominal
                expenseMap.set(tx.kategori, (expenseMap.get(tx.kategori) || 0) + nominal)
            }
        }

        // Aggregate previous
        const prevIncomeMap = new Map<string, number>()
        const prevExpenseMap = new Map<string, number>()
        let prevTotalIncome = 0, prevTotalExpense = 0

        for (const tx of prevTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            if (tx.kreditAkun?.tipe === "INCOME") {
                prevTotalIncome += nominal
                prevIncomeMap.set(tx.kategori, (prevIncomeMap.get(tx.kategori) || 0) + nominal)
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                prevTotalExpense += nominal
                prevExpenseMap.set(tx.kategori, (prevExpenseMap.get(tx.kategori) || 0) + nominal)
            }
        }

        // Color palette for categories
        const categoryColors: Record<string, string> = {
            'Gaji': '#22c55e',
            'Investasi': '#3b82f6',
            'Bonus': '#f59e0b',
            'Freelance': '#8b5cf6',
            'Makanan': '#ef4444',
            'Transport': '#f59e0b',
            'Belanja': '#ec4899',
            'Hiburan': '#8b5cf6',
            'Utilitas': '#6366f1',
            'Kesehatan': '#14b8a6',
            'Pendidikan': '#0ea5e9',
            'Cicilan': '#dc2626'
        }

        const categoryIcons: Record<string, string> = {
            'Gaji': '💰',
            'Investasi': '📈',
            'Bonus': '🎁',
            'Freelance': '💼',
            'Makanan': '🍔',
            'Transport': '🚗',
            'Belanja': '🛒',
            'Hiburan': '🎬',
            'Utilitas': '💡',
            'Kesehatan': '🏥',
            'Pendidikan': '📚',
            'Cicilan': '💳'
        }

        // Build income items
        const incomeItems: IncomeExpenseItem[] = Array.from(incomeMap.entries())
            .map(([kategori, nominal]) => {
                const prevNominal = prevIncomeMap.get(kategori) || 0
                const vsLastPeriod = prevNominal > 0
                    ? Math.round(((nominal - prevNominal) / prevNominal) * 100)
                    : (nominal > 0 ? 100 : 0)

                return {
                    kategori,
                    icon: categoryIcons[kategori] || '💵',
                    color: categoryColors[kategori] || '#22c55e',
                    nominal,
                    persentase: totalIncome > 0 ? Math.round((nominal / totalIncome) * 100) : 0,
                    vsLastPeriod
                }
            })
            .sort((a, b) => b.nominal - a.nominal)

        // Build expense items
        const expenseItems: IncomeExpenseItem[] = Array.from(expenseMap.entries())
            .map(([kategori, nominal]) => {
                const prevNominal = prevExpenseMap.get(kategori) || 0
                const vsLastPeriod = prevNominal > 0
                    ? Math.round(((nominal - prevNominal) / prevNominal) * 100)
                    : (nominal > 0 ? 100 : 0)

                return {
                    kategori,
                    icon: categoryIcons[kategori] || '💸',
                    color: categoryColors[kategori] || '#ef4444',
                    nominal,
                    persentase: totalExpense > 0 ? Math.round((nominal / totalExpense) * 100) : 0,
                    vsLastPeriod
                }
            })
            .sort((a, b) => b.nominal - a.nominal)

        const cashFlow = totalIncome - totalExpense
        const prevCashFlow = prevTotalIncome - prevTotalExpense
        const vsLastPeriod = prevCashFlow !== 0
            ? Math.round(((cashFlow - prevCashFlow) / Math.abs(prevCashFlow)) * 100)
            : (cashFlow > 0 ? 100 : (cashFlow < 0 ? -100 : 0))

        const result: IncomeExpenseBook = {
            periode: periodLabels[period],
            totalIncome,
            totalExpense,
            cashFlow,
            vsLastPeriod,
            incomeItems,
            expenseItems
        }

        return { success: true, data: result }
    } catch (error) {
        console.error("[ANALYTICS] getIncomeExpenseBook error:", error)
        return { success: false, data: null }
    }
}

// Top spending categories dengan trend
export async function getSpendingInsights(period: PeriodType = '30D') {
    try {
        const { start, end, days, prevStart, prevEnd } = getPeriodRange(period)

        // Current spending
        const currentTxRaw = await db.transaksi
            .where("tanggal")
            .between(start, end, true, true)
            .toArray();

        // Fetch accounts for currentTx to filter EXPENSE
        const accountIds = new Set(currentTxRaw.map(tx => tx.debitAkunId));
        const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
        const accountMap = new Map(accounts.map(a => [a.id, a]));

        const currentTx = currentTxRaw.filter(tx => {
            const acc = accountMap.get(tx.debitAkunId);
            return acc?.tipe === "EXPENSE";
        });

        // Previous spending
        const prevTxRaw = await db.transaksi
            .where("tanggal")
            .between(prevStart, prevEnd, true, true)
            .toArray();

        // Fetch accounts for prevTx to filter EXPENSE
        const prevAccountIds = new Set(prevTxRaw.map(tx => tx.debitAkunId));
        const prevAccounts = await db.akun.where("id").anyOf(Array.from(prevAccountIds)).toArray();
        const prevAccountMap = new Map(prevAccounts.map(a => [a.id, a]));

        const prevTx = prevTxRaw.filter(tx => {
            const acc = prevAccountMap.get(tx.debitAkunId);
            return acc?.tipe === "EXPENSE";
        });

        // Aggregate
        const categoryMap = new Map<string, { current: number, prev: number, count: number }>()

        for (const tx of currentTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            const existing = categoryMap.get(tx.kategori) || { current: 0, prev: 0, count: 0 }
            existing.current += nominal
            existing.count++
            categoryMap.set(tx.kategori, existing)
        }

        for (const tx of prevTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            const existing = categoryMap.get(tx.kategori) || { current: 0, prev: 0, count: 0 }
            existing.prev += nominal
            categoryMap.set(tx.kategori, existing)
        }

        const totalCurrent = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.current, 0)

        const insights = Array.from(categoryMap.entries())
            .map(([kategori, data]) => ({
                kategori,
                nominal: data.current,
                count: data.count,
                persentase: totalCurrent > 0 ? Math.round((data.current / totalCurrent) * 100) : 0,
                avgPerTransaction: data.count > 0 ? Math.round(data.current / data.count) : 0,
                trend: data.prev > 0
                    ? Math.round(((data.current - data.prev) / data.prev) * 100)
                    : (data.current > 0 ? 100 : 0),
                status: data.prev > 0
                    ? (data.current > data.prev ? 'up' : data.current < data.prev ? 'down' : 'stable')
                    : 'new'
            }))
            .sort((a, b) => b.nominal - a.nominal)
            .slice(0, 10)

        // Daily spending pattern (for 30D etc)
        const dailySpending: Record<string, number> = {}
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

        for (const tx of currentTx) {
            const nominal = Money.toFloat(tx.nominalInt)
            const day = dayNames[tx.tanggal.getDay()]
            dailySpending[day] = (dailySpending[day] || 0) + nominal
        }

        const spendingByDay = dayNames.map(day => ({
            hari: day,
            nominal: dailySpending[day] || 0
        }))

        return {
            success: true,
            data: {
                topCategories: insights,
                spendingByDay,
                totalSpending: totalCurrent,
                avgDaily: days > 0 ? Math.round(totalCurrent / days) : 0,
                transactionCount: currentTx.length
            }
        }
    } catch (error) {
        console.error("[ANALYTICS] getSpendingInsights error:", error)
        return { success: false, data: null }
    }
}
// Dashboard Specific Analytics

export async function getDashboardAnalytics() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Fetch current month transactions
        const currentTx = await fetchTransactionsWithAccounts(startOfMonth, endOfMonth);

        let incomeTotal = 0;
        let expenseTotal = 0;
        const expenseMap = new Map<string, { total: number, jumlah: number }>();

        for (const tx of currentTx) {
            const nominal = Money.toFloat(tx.nominalInt);
            if (tx.kreditAkun?.tipe === "INCOME") {
                incomeTotal += nominal;
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                expenseTotal += nominal;
                const stats = expenseMap.get(tx.kategori) || { total: 0, jumlah: 0 };
                expenseMap.set(tx.kategori, {
                    total: stats.total + nominal,
                    jumlah: stats.jumlah + 1
                });
            }
        }

        // Total Saldo
        const liquidAccounts = await db.akun
            .where("tipe").anyOf(["BANK", "E_WALLET", "CASH"])
            .toArray();

        let totalSaldo = 0;
        for (const acc of liquidAccounts) {
            totalSaldo += Money.toFloat(acc.saldoSekarangInt);
        }

        // Pengeluaran per Kategori (Top 5)
        const pengeluaranPerKategori = Array.from(expenseMap.entries())
            .map(([kategori, stats]) => ({
                kategori,
                total: stats.total,
                jumlah: stats.jumlah,
                fill: '#8884d8'
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);

        // 6 Month Trend
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const trendTx = await fetchTransactionsWithAccounts(sixMonthsAgo, endOfMonth);

        const trendData: Record<string, any> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = d.toLocaleString('id-ID', { month: 'short' });
            trendData[key] = { bulanNama: label, pemasukan: 0, pengeluaran: 0 };
        }

        for (const tx of trendTx) {
            const key = `${tx.tanggal.getFullYear()}-${String(tx.tanggal.getMonth() + 1).padStart(2, '0')}`;
            if (trendData[key]) {
                const nominal = Money.toFloat(tx.nominalInt);
                if (tx.kreditAkun?.tipe === "INCOME") {
                    trendData[key].pemasukan += nominal;
                } else if (tx.debitAkun?.tipe === "EXPENSE") {
                    trendData[key].pengeluaran += nominal;
                }
            }
        }

        const todayRange = getTodayDateRange();
        const yesterdayRange = getYesterdayDateRange();
        
        const todayKey = toDayKey(todayRange.start);
        const yesterdayKey = toDayKey(yesterdayRange.start);
        
        const todaySummary = await getDailySummary(todayKey, todayRange);
        const yesterdaySummary = await getDailySummary(yesterdayKey, yesterdayRange);
        
        const todayTransactions = await fetchTransactionsWithAccounts(todayRange.start, todayRange.end);
        
        // Recalculate today's stats from actual transactions to ensure accuracy (especially for income)
        let todayIncome = 0;
        let todayExpense = 0;
        for (const tx of todayTransactions) {
            const nominal = Money.toFloat(tx.nominalInt);
            if (tx.kreditAkun?.tipe === "INCOME") {
                todayIncome += nominal;
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                todayExpense += nominal;
            }
        }
        
        todayTransactions.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());
        const recentTransactions = todayTransactions.slice(0, 3);
        
        const comparison = {
            incomeChange: calculatePercentageChange(todayIncome, yesterdaySummary.income),
            expenseChange: calculatePercentageChange(todayExpense, yesterdaySummary.expense),
            netChange: calculatePercentageChange(todayIncome - todayExpense, yesterdaySummary.net),
            hasYesterdayData: yesterdaySummary.income !== 0 || yesterdaySummary.expense !== 0
        };

        return {
            totalSaldo,
            pemasukanBulanIni: incomeTotal,
            pengeluaranBulanIni: expenseTotal,
            selisihBulanIni: incomeTotal - expenseTotal,
            pengeluaranPerKategori,
            trendBulanan: Object.values(trendData),
            today: {
                income: todayIncome,
                expense: todayExpense,
                net: todayIncome - todayExpense,
                transactionCount: todayTransactions.length,
                transactions: recentTransactions
            },
            yesterday: {
                income: yesterdaySummary.income,
                expense: yesterdaySummary.expense,
                net: yesterdaySummary.net
            },
            comparison
        };
    } catch (error) {
        console.error("getDashboardAnalytics error:", error);
        return {
            totalSaldo: 0,
            pemasukanBulanIni: 0,
            pengeluaranBulanIni: 0,
            selisihBulanIni: 0,
            pengeluaranPerKategori: [],
            trendBulanan: [],
            today: {
                income: 0,
                expense: 0,
                net: 0,
                transactionCount: 0,
                transactions: []
            },
            yesterday: {
                income: 0,
                expense: 0,
                net: 0
            },
            comparison: {
                incomeChange: null,
                expenseChange: null,
                netChange: null,
                hasYesterdayData: false
            }
        };
    }
}

export async function getSaldoTrend(days: number = 30, akunId?: string) {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);
        startDate.setHours(0, 0, 0, 0);

        // Fetch all transactions in range
        const txs = await db.transaksi
            .where("tanggal")
            .between(startDate, endDate, true, true)
            .sortBy("tanggal");

        let liquidAccounts;
        if (akunId) {
            const acc = await db.akun.get(akunId);
            liquidAccounts = acc ? [acc] : [];
        } else {
            liquidAccounts = await db.akun
                .where("tipe").anyOf(["BANK", "E_WALLET", "CASH"])
                .toArray();
        }

        let currentTotal = 0;
        const liquidIds = new Set(liquidAccounts.map(a => a.id));
        for (const acc of liquidAccounts) {
            currentTotal += Money.toFloat(acc.saldoSekarangInt);
        }

        const txByDay = new Map<string, number>();
        const userTimezoneOffset = endDate.getTimezoneOffset() * 60000;

        // Initialize all days
        const fullHistory = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(endDate);
            d.setDate(d.getDate() - i);
            const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const key = `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`;

            fullHistory.push({ date: key, balance: 0 });
        }
        fullHistory.reverse();

        const changeByDate = new Map<string, number>();

        for (const tx of txs) {
            const d = tx.tanggal;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const nominal = Money.toFloat(tx.nominalInt);
            let net = 0;

            if (liquidIds.has(tx.debitAkunId)) {
                net += nominal;
            }
            if (liquidIds.has(tx.kreditAkunId)) {
                net -= nominal;
            }

            changeByDate.set(key, (changeByDate.get(key) || 0) + net);
        }

        let runningBalance = currentTotal;
        const trendData = [];

        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            trendData.push({
                tanggal: d.toISOString(),
                saldo: runningBalance
            });

            const change = changeByDate.get(key) || 0;
            runningBalance -= change;
        }

        return { success: true, data: trendData.reverse() };

    } catch (error) {
        console.error("getSaldoTrend error:", error);
        return { success: false, data: [] };
    }
}

// ==========================================
// Heatmap & YoY Analytics (Ported from Server Actions)
// ==========================================

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
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        const today = new Date();

        // Fetch transactions
        const transactionsRaw = await db.transaksi
            .where("tanggal")
            .between(startDate, endDate, true, true)
            .toArray();

        // Filter for EXPENSE only
        // Need to fetch accounts to check type
        const accountIds = new Set(transactionsRaw.map(tx => tx.debitAkunId));
        const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
        const accountMap = new Map(accounts.map(a => [a.id, a]));

        const transactions = transactionsRaw.filter(tx => {
            const acc = accountMap.get(tx.debitAkunId);
            return acc?.tipe === 'EXPENSE';
        });

        // 1. Daily Aggregation
        const dailyMap = new Map<string, { total: number, count: number }>();
        let maxTotal = 0;
        let maxDate = "";

        for (const tx of transactions) {
            const dateStr = tx.tanggal.toISOString().split('T')[0];
            const nominal = Money.toFloat(tx.nominalInt);

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
            let intensity: 0 | 1 | 2 | 3 | 4 = 0;
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

            // Count zero spending for the WHOLE month to match visual calendar
            if (data.total === 0) {
                zeroSpendingDays++;
            }
        }

        // 2. Pattern Analysis
        const insights: PatternInsight[] = [];
        const monthTotal = heatmap.reduce((sum, d) => sum + d.total, 0);

        // Calculate average based on days that have passed OR all days if the month is over
        let daysForAverage = daysInMonth;
        if (year === today.getFullYear() && month === (today.getMonth() + 1)) {
            daysForAverage = today.getDate();
        }
        const dailyAverage = daysForAverage > 0 ? monthTotal / daysForAverage : 0;

        // A. Daily Average (Always show)
        insights.push({
            title: "Rata-rata Harian",
            message: `Rata-rata pengeluaran Anda adalah ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(dailyAverage)} per hari.`,
            severity: "info"
        });

        // B. Zero Spending
        if (zeroSpendingDays > 0) {
            insights.push({
                title: "Zero Spending Days",
                message: `Ada ${zeroSpendingDays} hari tanpa pengeluaran tercatat di kalender bulan ini.`,
                severity: "positive"
            });
        }

        // C. Highest Spending
        if (maxTotal > 0) {
            const maxDateObj = new Date(maxDate);
            insights.push({
                title: "Pengeluaran Tertinggi",
                message: `Puncak pengeluaran terjadi pada tanggal ${maxDateObj.getDate()} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(maxTotal)}.`,
                severity: "warning"
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

        if (weekendAvg > weekdayAvg * 1.3 && weekdayAvg > 0) {
            const increase = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
            insights.push({
                title: "Weekend Spending Spike",
                message: `Pengeluaran akhir pekan ${increase.toFixed(0)}% lebih tinggi dari hari kerja.`,
                severity: "warning"
            });
        }

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
        console.error("getSpendingHeatmap error", error);
        return { success: false, error: "Gagal mengambil data heatmap" };
    }
}

export async function getDailyTransactions(dateStr: string) {
    try {
        const start = new Date(dateStr);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateStr);
        end.setHours(23, 59, 59, 999);

        const transactionsRaw = await db.transaksi
            .where("tanggal")
            .between(start, end, true, true)
            .toArray();

        // Filter and enrich
        // Need Account Names
        const accountIds = new Set<string>();
        transactionsRaw.forEach(tx => {
            accountIds.add(tx.debitAkunId);
            accountIds.add(tx.kreditAkunId);
        });
        const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
        const accountMap = new Map(accounts.map(a => [a.id, a]));

        // Filter EXPENSE only
        const transactions = transactionsRaw
            .filter(tx => {
                const acc = accountMap.get(tx.debitAkunId);
                return acc?.tipe === 'EXPENSE';
            })
            .map(tx => ({
                ...tx,
                debitAkun: accountMap.get(tx.debitAkunId),
                kreditAkun: accountMap.get(tx.kreditAkunId),
                nominal: Money.toFloat(tx.nominalInt)
            }))
            .sort((a, b) => b.nominal - a.nominal);

        return {
            success: true,
            data: transactions
        };
    } catch (error) {
        console.error("getDailyTransactions error", error);
        return { success: false, error: "Gagal mengambil detail transaksi" };
    }
}

// Helper for YoY
function getCategoryType(categoryName: string, isExpense: boolean): 'income' | 'essential' | 'discretionary' {
    if (!isExpense) return 'income';

    const lower = categoryName.toLowerCase();
    if (['makan', 'transport', 'sewa', 'listrik', 'tagihan', 'kesehatan', 'pendidikan', 'cicilan'].some(k => lower.includes(k))) {
        return 'essential';
    }
    return 'discretionary';
}

// Needed Interfaces for YoY
export interface CategoryData {
    name: string;
    amount: number;
    type: 'income' | 'essential' | 'discretionary';
}

export interface MonthlyData {
    month: number;
    year: number;
    categories: CategoryData[];
    totalIncome: number;
    totalExpense: number;
}

export interface YearStats {
    month: number;
    expense: number;
    income: number;
}

function generateYoYInsights(curr: MonthlyData, prev: MonthlyData) {
    const insights = [];

    const diff = curr.totalExpense - prev.totalExpense;
    const diffPercent = prev.totalExpense > 0 ? (diff / prev.totalExpense) * 100 : 0;

    if (diff > 0) {
        insights.push({
            title: "Pengeluaran Meningkat",
            message: `Total pengeluaran tahun ini meningkat ${diffPercent.toFixed(1)}% dibandingkan tahun lalu.`,
            type: "warning"
        });
    } else if (diff < 0) {
        insights.push({
            title: "Penghematan",
            message: `Anda berhasil menghemat ${Math.abs(diffPercent).toFixed(1)}% dibandingkan tahun lalu.`,
            type: "positive"
        });
    }

    return insights;
}

export async function getYearOverYearComparison(year1: number, year2: number) {
    try {
        const [data1, data2] = await Promise.all([
            getYearData(year1),
            getYearData(year2)
        ]);

        const insights = generateYoYInsights(data2.summary, data1.summary);

        return {
            success: true,
            data: {
                year1: data1,
                year2: data2,
                insights
            }
        };
    } catch (error) {
        console.error(`getYearOverYearComparison error ${year1}-${year2}`, error);
        return { success: false, error: "Gagal mengambil data perbandingan" };
    }
}

async function getYearData(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const txsRaw = await db.transaksi
        .where("tanggal")
        .between(startDate, endDate, true, true)
        .toArray();

    const accountIds = new Set<string>();
    txsRaw.forEach(tx => {
        accountIds.add(tx.debitAkunId);
        accountIds.add(tx.kreditAkunId);
    });
    const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const txs = txsRaw.map(tx => ({
        ...tx,
        debitAkun: accountMap.get(tx.debitAkunId),
        kreditAkun: accountMap.get(tx.kreditAkunId),
        nominal: Money.toFloat(tx.nominalInt)
    }));

    const monthlyStats: YearStats[] = Array(12).fill(0).map((_, i) => ({
        month: i + 1,
        expense: 0,
        income: 0
    }));

    const categoryStats = new Map<string, { nominal: number, type: 'income' | 'essential' | 'discretionary' }>();

    for (const tx of txs) {
        const monthIndex = tx.tanggal.getMonth();

        if (tx.debitAkun?.tipe === 'EXPENSE') {
            monthlyStats[monthIndex].expense += tx.nominal;

            const existing = categoryStats.get(tx.kategori) || { nominal: 0, type: getCategoryType(tx.kategori, true) };
            existing.nominal += tx.nominal;
            categoryStats.set(tx.kategori, existing);

        } else if (tx.kreditAkun?.tipe === 'INCOME') {
            monthlyStats[monthIndex].income += tx.nominal;

            const existing = categoryStats.get(tx.kategori) || { nominal: 0, type: 'income' };
            existing.nominal += tx.nominal;
            categoryStats.set(tx.kategori, existing);
        }
    }

    const categories: CategoryData[] = Array.from(categoryStats.entries()).map(([name, data]) => ({
        name,
        amount: data.nominal,
        type: data.type
    })).sort((a, b) => b.amount - a.amount);

    const totalIncome = monthlyStats.reduce((sum, m) => sum + m.income, 0);
    const totalExpense = monthlyStats.reduce((sum, m) => sum + m.expense, 0);

    const summary: MonthlyData = {
        month: 0,
        year,
        categories,
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

// Category Detail for Drill-Down
export async function getCategoryDetail(kategori: string, bulan?: number, tahun?: number) {
    try {
        const now = new Date();
        const month = bulan || now.getMonth() + 1;
        const year = tahun || now.getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);

        const transaksi = await db.transaksi.toArray();
        const filtered = transaksi.filter(tx => {
            const t = new Date(tx.tanggal);
            return t >= startDate && t <= endDate && tx.kategori === kategori;
        });

        const accounts = await db.akun.toArray();
        const akunMap = new Map(accounts.map(a => [a.id, a]));

        // Build weekly breakdown
        const weeklyMap = new Map<string, number>();
        for (let w = 1; w <= 5; w++) {
            weeklyMap.set(`Minggu ${w}`, 0);
        }

        for (const tx of filtered) {
            const d = new Date(tx.tanggal).getDate();
            const weekNum = Math.ceil(d / 7);
            const weekLabel = `Minggu ${Math.min(weekNum, 5)}`;
            const current = weeklyMap.get(weekLabel) || 0;
            weeklyMap.set(weekLabel, current + Money.toFloat(tx.nominalInt));
        }

        const weeklyBreakdown = Array.from(weeklyMap.entries()).map(([minggu, nominal]) => ({
            minggu,
            nominal
        }));

        const txList = filtered
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
            .slice(0, 20)
            .map(tx => ({
                id: tx.id,
                deskripsi: tx.deskripsi,
                nominal: Money.toFloat(tx.nominalInt),
                tanggal: tx.tanggal,
                akun: akunMap.get(tx.kreditAkunId)?.nama || "Unknown"
            }));

        const total = filtered.reduce((sum, tx) => sum + Money.toFloat(tx.nominalInt), 0);

        return {
            success: true,
            data: {
                kategori,
                bulan: month,
                tahun: year,
                total,
                jumlahTransaksi: filtered.length,
                weeklyBreakdown,
                transaksi: txList
            }
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
