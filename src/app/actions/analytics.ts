"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { Money } from "@/lib/money"

// Tipe akun user (bukan internal)
const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

interface PengeluaranPerKategori {
    kategori: string
    total: number
    jumlah: number
}

interface TrendBulanan {
    bulan: string
    bulanNama: string
    pemasukan: number
    pengeluaran: number
}

interface RingkasanDashboard {
    totalSaldo: number
    pemasukanBulanIni: number
    pengeluaranBulanIni: number
    selisihBulanIni: number
    pengeluaranPerKategori: PengeluaranPerKategori[]
    trendBulanan: TrendBulanan[]
}

export async function getDashboardAnalytics(): Promise<RingkasanDashboard> {
    try {
        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

        // 1. Total Saldo semua akun user
        const totalSaldoResult = await prisma.akun.aggregate({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            _sum: { saldoSekarang: true }
        })
        // Convert BigInt -> Float
        const totalSaldo = Money.toFloat(Number(totalSaldoResult._sum.saldoSekarang || 0))

        // 2. Transaksi bulan ini (Parallel Aggregations)
        const [pemasukanResult, pengeluaranResult, kategoriResult] = await Promise.all([
            // Total Pemasukan
            prisma.transaksi.aggregate({
                where: {
                    tanggal: { gte: startOfMonth, lte: endOfMonth },
                    kreditAkun: { tipe: "INCOME" }
                },
                _sum: { nominal: true }
            }),
            // Total Pengeluaran
            prisma.transaksi.aggregate({
                where: {
                    tanggal: { gte: startOfMonth, lte: endOfMonth },
                    debitAkun: { tipe: "EXPENSE" }
                },
                _sum: { nominal: true }
            }),
            // Group by Kategori (hanya untuk pengeluaran)
            prisma.transaksi.groupBy({
                by: ['kategori'],
                where: {
                    tanggal: { gte: startOfMonth, lte: endOfMonth },
                    debitAkun: { tipe: "EXPENSE" }
                },
                _sum: { nominal: true },
                _count: { id: true },
                orderBy: { _sum: { nominal: 'desc' } }
            })
        ])

        const pemasukanBulanIni = Money.toFloat(Number(pemasukanResult._sum.nominal || 0))
        const pengeluaranBulanIni = Money.toFloat(Number(pengeluaranResult._sum.nominal || 0))
        
        const pengeluaranPerKategori: PengeluaranPerKategori[] = kategoriResult.map(item => ({
            kategori: item.kategori,
            total: Money.toFloat(Number(item._sum.nominal || 0)),
            jumlah: item._count.id
        }))

        // 3. Trend 6 bulan terakhir (OPTIMIZED)
        const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']
        const trendBulanan: TrendBulanan[] = []

        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        const sixMonthsEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        
        // Single Query
        const transactions = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: sixMonthsAgo, lte: sixMonthsEnd },
                OR: [
                    { debitAkun: { tipe: "EXPENSE" } },
                    { kreditAkun: { tipe: "INCOME" } }
                ]
            },
            select: {
                tanggal: true,
                nominal: true,
                debitAkun: { select: { tipe: true } },
                kreditAkun: { select: { tipe: true } }
            }
        })

        // Group in-memory
        const monthlyStats: Record<string, { income: number, expense: number }> = {}
        
        for (const tx of transactions) {
            const monthKey = `${tx.tanggal.getFullYear()}-${String(tx.tanggal.getMonth() + 1).padStart(2, '0')}`
            if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { income: 0, expense: 0 }
            
            const nominal = Money.toFloat(Number(tx.nominal))
            
            if (tx.kreditAkun?.tipe === "INCOME") {
                monthlyStats[monthKey].income += nominal
            }
            if (tx.debitAkun?.tipe === "EXPENSE") {
                monthlyStats[monthKey].expense += nominal
            }
        }
        
        // Format Result
        for (let i = 5; i >= 0; i--) {
            const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const monthKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`
            
            const stats = monthlyStats[monthKey] || { income: 0, expense: 0 }
            
            trendBulanan.push({
                bulan: monthKey,
                bulanNama: namaBulan[targetDate.getMonth()],
                pemasukan: stats.income,
                pengeluaran: stats.expense
            })
        }

        return {
            totalSaldo,
            pemasukanBulanIni,
            pengeluaranBulanIni,
            selisihBulanIni: pemasukanBulanIni - pengeluaranBulanIni,
            pengeluaranPerKategori,
            trendBulanan
        }

    } catch (error) {
        await logSistem("ERROR", "ANALYTICS", "Gagal mengambil data analytics", (error as Error).stack)
        throw new Error("Gagal mengambil data analytics")
    }
}

// ============================================
// ENHANCED ANALYTICS FUNCTIONS
// ============================================

interface TrendDataPoint {
    tanggal: string
    saldo: number
}

interface MonthlyComparison {
    kategori: string
    bulanIni: number
    bulanLalu: number
    persentasePerubahan: number
}

interface AccountComposition {
    nama: string
    tipe: string
    saldo: number
    warna: string
    persentase: number
}

// Trend saldo harian 30 hari terakhir
export async function getSaldoTrend(days: number = 30) {
    try {
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        // 1. Ambil saldo awal (saldoAwal di tabel Akun) - BigInt
        const accounts = await prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            select: { id: true, saldoAwal: true }
        })
        let totalInitialBalanceInt = accounts.reduce((sum, acc) => sum + acc.saldoAwal, BigInt(0))

        // 2. Ambil akumulasi mutasi transaksi SEBELUM startDate - BigInt
        const [pastDebit, pastKredit] = await Promise.all([
            prisma.transaksi.aggregate({
                where: {
                    tanggal: { lt: startDate },
                    debitAkun: { tipe: { in: USER_ACCOUNT_TYPES } }
                },
                _sum: { nominal: true }
            }),
            prisma.transaksi.aggregate({
                where: {
                    tanggal: { lt: startDate },
                    kreditAkun: { tipe: { in: USER_ACCOUNT_TYPES } }
                },
                _sum: { nominal: true }
            })
        ])

        // Saldo pada H-1 dari startDate (BigInt)
        let runningBalanceInt = totalInitialBalanceInt + (pastDebit._sum.nominal || BigInt(0)) - (pastKredit._sum.nominal || BigInt(0))

        // 3. Ambil mutasi transaksi HARIAN dalam range (startDate s/d endDate)
        const transactionsInRange = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startDate, lte: endDate }
            },
            select: {
                tanggal: true,
                nominal: true,
                debitAkun: { select: { tipe: true } },
                kreditAkun: { select: { tipe: true } }
            },
            orderBy: { tanggal: 'asc' }
        })

        // Group mutasi per hari
        const dailyMutations: Record<string, bigint> = {}
        for (const tx of transactionsInRange) {
            const dateStr = tx.tanggal.toISOString().split('T')[0]
            let mutation = BigInt(0)
            if (tx.debitAkun && USER_ACCOUNT_TYPES.includes(tx.debitAkun.tipe)) {
                mutation += tx.nominal
            }
            if (tx.kreditAkun && USER_ACCOUNT_TYPES.includes(tx.kreditAkun.tipe)) {
                mutation -= tx.nominal
            }
            dailyMutations[dateStr] = (dailyMutations[dateStr] || BigInt(0)) + mutation
        }

        // 4. Bangun data trend harian
        const trendData: TrendDataPoint[] = []
        for (let i = 0; i <= days; i++) {
            const targetDate = new Date(startDate)
            targetDate.setDate(startDate.getDate() + i)
            const dateStr = targetDate.toISOString().split('T')[0]

            runningBalanceInt += (dailyMutations[dateStr] || BigInt(0))
            
            trendData.push({
                tanggal: dateStr,
                saldo: Money.toFloat(Number(runningBalanceInt))
            })
        }

        return { success: true, data: trendData }
    } catch (error) {
        console.error("[ANALYTICS] getSaldoTrend error:", error)
        return { success: false, data: [] }
    }
}

// Perbandingan bulan ini vs bulan lalu per kategori
export async function getMonthlyComparison() {
    try {
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()

        // Bulan lalu
        let lastMonth = thisMonth - 1
        let lastMonthYear = thisYear
        if (lastMonth < 0) {
            lastMonth = 11
            lastMonthYear = thisYear - 1
        }

        // Range bulan ini
        const thisMonthStart = new Date(thisYear, thisMonth, 1)
        const thisMonthEnd = new Date(thisYear, thisMonth + 1, 0, 23, 59, 59)

        // Range bulan lalu
        const lastMonthStart = new Date(lastMonthYear, lastMonth, 1)
        const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59)

        // Ambil pengeluaran bulan ini
        const thisMonthTx = await prisma.transaksi.groupBy({
            by: ["kategori"],
            where: {
                tanggal: { gte: thisMonthStart, lte: thisMonthEnd },
                debitAkun: { tipe: "EXPENSE" }
            },
            _sum: { nominal: true }
        })

        // Ambil pengeluaran bulan lalu
        const lastMonthTx = await prisma.transaksi.groupBy({
            by: ["kategori"],
            where: {
                tanggal: { gte: lastMonthStart, lte: lastMonthEnd },
                debitAkun: { tipe: "EXPENSE" }
            },
            _sum: { nominal: true }
        })

        // Gabungkan data
        const categories = new Set([
            ...thisMonthTx.map(t => t.kategori),
            ...lastMonthTx.map(t => t.kategori)
        ])

        const comparison: MonthlyComparison[] = []

        for (const kategori of categories) {
            const bulanIniBig = thisMonthTx.find(t => t.kategori === kategori)?._sum.nominal || BigInt(0)
            const bulanLaluBig = lastMonthTx.find(t => t.kategori === kategori)?._sum.nominal || BigInt(0)
            
            const bulanIni = Money.toFloat(Number(bulanIniBig))
            const bulanLalu = Money.toFloat(Number(bulanLaluBig))

            let persentasePerubahan = 0
            if (bulanLalu > 0) {
                persentasePerubahan = Math.round(((bulanIni - bulanLalu) / bulanLalu) * 100)
            } else if (bulanIni > 0) {
                persentasePerubahan = 100 // New category
            }

            comparison.push({
                kategori,
                bulanIni,
                bulanLalu,
                persentasePerubahan
            })
        }

        // Sort by bulan ini (desc)
        comparison.sort((a, b) => b.bulanIni - a.bulanIni)

        return { success: true, data: comparison }
    } catch (error) {
        console.error("[ANALYTICS] getMonthlyComparison error:", error)
        return { success: false, data: [] }
    }
}

// Komposisi aset per akun
export async function getAccountComposition() {
    try {
        const accounts = await prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            select: {
                nama: true,
                tipe: true,
                saldoSekarang: true,
                warna: true
            }
        })

        // Hitung total (hanya positif untuk proporsi)
        const accountsMapped = accounts.map(a => ({
             ...a,
             saldo: Money.toFloat(Number(a.saldoSekarang))
        }))

        const totalPositive = accountsMapped
            .filter(a => a.saldo > 0)
            .reduce((sum, a) => sum + a.saldo, 0)

        const composition: AccountComposition[] = accountsMapped
            .filter(a => a.saldo > 0) // Hanya tampilkan yang positif
            .map(a => ({
                nama: a.nama,
                tipe: a.tipe,
                saldo: a.saldo,
                warna: a.warna || getDefaultColor(a.tipe),
                persentase: totalPositive > 0
                    ? Math.round((a.saldo / totalPositive) * 100)
                    : 0
            }))
            .sort((a, b) => b.saldo - a.saldo)

        return { success: true, data: composition, total: totalPositive }
    } catch (error) {
        console.error("[ANALYTICS] getAccountComposition error:", error)
        return { success: false, data: [], total: 0 }
    }
}

// Stats dengan perbandingan bulan lalu
export async function getEnhancedStats() {
    try {
        const now = new Date()
        const thisMonth = now.getMonth()
        const thisYear = now.getFullYear()

        let lastMonth = thisMonth - 1
        let lastMonthYear = thisYear
        if (lastMonth < 0) {
            lastMonth = 11
            lastMonthYear = thisYear - 1
        }

        // Ranges
        const thisMonthStart = new Date(thisYear, thisMonth, 1)
        const thisMonthEnd = new Date(thisYear, thisMonth + 1, 0, 23, 59, 59)
        const lastMonthStart = new Date(lastMonthYear, lastMonth, 1)
        const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59)

        // Total saldo sekarang
        const accounts = await prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            select: { saldoSekarang: true }
        })
        const totalSaldo = accounts.reduce((sum, a) => sum + Money.toFloat(Number(a.saldoSekarang)), 0)

        // Pemasukan bulan ini
        const pemasukanBulanIni = await prisma.transaksi.aggregate({
            where: {
                tanggal: { gte: thisMonthStart, lte: thisMonthEnd },
                kreditAkun: { tipe: "INCOME" }
            },
            _sum: { nominal: true }
        })

        // Pemasukan bulan lalu
        const pemasukanBulanLalu = await prisma.transaksi.aggregate({
            where: {
                tanggal: { gte: lastMonthStart, lte: lastMonthEnd },
                kreditAkun: { tipe: "INCOME" }
            },
            _sum: { nominal: true }
        })

        // Pengeluaran bulan ini
        const pengeluaranBulanIni = await prisma.transaksi.aggregate({
            where: {
                tanggal: { gte: thisMonthStart, lte: thisMonthEnd },
                debitAkun: { tipe: "EXPENSE" }
            },
            _sum: { nominal: true }
        })

        // Pengeluaran bulan lalu
        const pengeluaranBulanLalu = await prisma.transaksi.aggregate({
            where: {
                tanggal: { gte: lastMonthStart, lte: lastMonthEnd },
                debitAkun: { tipe: "EXPENSE" }
            },
            _sum: { nominal: true }
        })

        const pemasukan = {
            bulanIni: Money.toFloat(Number(pemasukanBulanIni._sum.nominal || 0)),
            bulanLalu: Money.toFloat(Number(pemasukanBulanLalu._sum.nominal || 0))
        }

        const pengeluaran = {
            bulanIni: Money.toFloat(Number(pengeluaranBulanIni._sum.nominal || 0)),
            bulanLalu: Money.toFloat(Number(pengeluaranBulanLalu._sum.nominal || 0))
        }

        const selisih = {
            bulanIni: pemasukan.bulanIni - pengeluaran.bulanIni,
            bulanLalu: pemasukan.bulanLalu - pengeluaran.bulanLalu
        }

        // Hitung persentase perubahan
        const calcChange = (current: number, previous: number) => {
            if (previous === 0) return current > 0 ? 100 : 0
            return Math.round(((current - previous) / Math.abs(previous)) * 100)
        }

        return {
            success: true,
            data: {
                totalSaldo,
                pemasukan: {
                    nominal: pemasukan.bulanIni,
                    perubahan: calcChange(pemasukan.bulanIni, pemasukan.bulanLalu)
                },
                pengeluaran: {
                    nominal: pengeluaran.bulanIni,
                    perubahan: calcChange(pengeluaran.bulanIni, pengeluaran.bulanLalu)
                },
                selisih: {
                    nominal: selisih.bulanIni,
                    perubahan: calcChange(selisih.bulanIni, selisih.bulanLalu)
                }
            }
        }
    } catch (error) {
        console.error("[ANALYTICS] getEnhancedStats error:", error)
        return { success: false, data: null }
    }
}

// Drill-down data untuk kategori tertentu
export async function getCategoryDetail(kategori: string, bulan?: number, tahun?: number) {
    try {
        const now = new Date()
        const month = bulan ?? now.getMonth() + 1
        const year = tahun ?? now.getFullYear()

        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59)

        // Transaksi dalam kategori ini
        const transaksi = await prisma.transaksi.findMany({
            where: {
                kategori,
                tanggal: { gte: startDate, lte: endDate },
                debitAkun: { tipe: "EXPENSE" }
            },
            include: {
                kreditAkun: { select: { nama: true } }
            },
            orderBy: { nominal: "desc" },
            take: 20
        })

        // Total dan per minggu
        const weeklyData: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        let total = 0

        const transaksiMapped = []
        for (const tx of transaksi) {
             const nominal = Money.toFloat(Number(tx.nominal))
            total += nominal
            const week = Math.ceil(tx.tanggal.getDate() / 7)
            weeklyData[Math.min(week, 5)] += nominal
            
             transaksiMapped.push({
                    id: tx.id,
                    deskripsi: tx.deskripsi,
                    nominal: nominal,
                    tanggal: tx.tanggal,
                    akun: tx.kreditAkun?.nama || "Unknown"
             })
        }

        const weeklyBreakdown = Object.entries(weeklyData).map(([week, nominal]) => ({
            minggu: `Minggu ${week}`,
            nominal
        }))

        return {
            success: true,
            data: {
                kategori,
                total,
                jumlahTransaksi: transaksi.length,
                weeklyBreakdown,
                transaksi: transaksiMapped
            }
        }
    } catch (error) {
        console.error("[ANALYTICS] getCategoryDetail error:", error)
        return { success: false, data: null }
    }
}

function getDefaultColor(tipe: string): string {
    const colors: Record<string, string> = {
        BANK: "#3b82f6",
        E_WALLET: "#8b5cf6",
        CASH: "#22c55e",
        CREDIT_CARD: "#ef4444"
    }
    return colors[tipe] || "#6b7280"
}

// ============================================
// STATISTICS PAGE ANALYTICS
// ============================================

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

// Periode: 7D, 30D, 12W, 6M, 1Y
type PeriodType = '7D' | '30D' | '12W' | '6M' | '1Y'

function getPeriodRange(period: PeriodType): { start: Date; end: Date; days: number; prevStart: Date; prevEnd: Date } {
    const now = new Date()
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
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

// Cash Flow Table - ringkasan income vs expense
export async function getCashFlowTable(period: PeriodType = '30D') {
    try {
        const { start, end, days, prevStart, prevEnd } = getPeriodRange(period)

        // Current period transactions
        const currentTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: start, lte: end }
            },
            include: {
                debitAkun: true,
                kreditAkun: true
            }
        })

        // Previous period for comparison
        const prevTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: prevStart, lte: prevEnd }
            },
            include: {
                debitAkun: true,
                kreditAkun: true
            }
        })

        // Calculate current period
        let incomeCount = 0, incomeTotal = 0
        let expenseCount = 0, expenseTotal = 0

        for (const tx of currentTx) {
            const nominal = Money.toFloat(Number(tx.nominal))
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
            const nominal = Money.toFloat(Number(tx.nominal))
            if (tx.kreditAkun?.tipe === "INCOME") {
                prevIncomeTotal += nominal
            } else if (tx.debitAkun?.tipe === "EXPENSE") {
                prevExpenseTotal += nominal
            }
        }

        const periodLabels: Record<PeriodType, string> = {
            '7D': '7 Hari Terakhir',
            '30D': '30 Hari Terakhir',
            '12W': '12 Minggu Terakhir',
            '6M': '6 Bulan Terakhir',
            '1Y': '1 Tahun Terakhir'
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
        const currentTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: start, lte: end }
            },
            include: {
                debitAkun: true,
                kreditAkun: true
            }
        })

        // Previous period
        const prevTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: prevStart, lte: prevEnd }
            },
            include: {
                debitAkun: true,
                kreditAkun: true
            }
        })

        // Aggregate current
        const incomeMap = new Map<string, number>()
        const expenseMap = new Map<string, number>()
        let totalIncome = 0, totalExpense = 0

        for (const tx of currentTx) {
            const nominal = Money.toFloat(Number(tx.nominal))
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
            const nominal = Money.toFloat(Number(tx.nominal))
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

        const periodLabels: Record<PeriodType, string> = {
            '7D': '7 Hari Terakhir',
            '30D': '30 Hari Terakhir',
            '12W': '12 Minggu Terakhir',
            '6M': '6 Bulan Terakhir',
            '1Y': '1 Tahun Terakhir'
        }

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
        const currentTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: start, lte: end },
                debitAkun: { tipe: "EXPENSE" }
            },
            select: { kategori: true, nominal: true, tanggal: true }
        })

        // Previous spending
        const prevTx = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: prevStart, lte: prevEnd },
                debitAkun: { tipe: "EXPENSE" }
            },
            select: { kategori: true, nominal: true }
        })

        // Aggregate
        const categoryMap = new Map<string, { current: number, prev: number, count: number }>()

        for (const tx of currentTx) {
            const nominal = Money.toFloat(Number(tx.nominal))
            const existing = categoryMap.get(tx.kategori) || { current: 0, prev: 0, count: 0 }
            existing.current += nominal
            existing.count++
            categoryMap.set(tx.kategori, existing)
        }

        for (const tx of prevTx) {
            const nominal = Money.toFloat(Number(tx.nominal))
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

        // Daily spending pattern (for 30D)
        const dailySpending: Record<string, number> = {}
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

        for (const tx of currentTx) {
            const nominal = Money.toFloat(Number(tx.nominal))
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