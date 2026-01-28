"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpDown,
    Share2,
    DollarSign,
    PieChart,
    Calendar,
    Lightbulb,
    AlertTriangle
} from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { getCashFlowTable, getIncomeExpenseBook, getSpendingInsights, type CashFlowData, type IncomeExpenseBook as IEBook, type PeriodType } from "@/lib/db/analytics-repo"



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

export default function StatisticsPage() {
    const [period, setPeriod] = useState<PeriodType>('30D')
    const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
    const [vsLastPeriod, setVsLastPeriod] = useState<{ income: number; expense: number } | null>(null)
    const [incomeExpense, setIncomeExpense] = useState<IEBook | null>(null)
    const [spending, setSpending] = useState<SpendingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [cfResult, ieResult, spResult] = await Promise.all([
                    getCashFlowTable(period),
                    getIncomeExpenseBook(period),
                    getSpendingInsights(period)
                ])

                if (cfResult.success && cfResult.data) {
                    setCashFlow(cfResult.data)
                    setVsLastPeriod(cfResult.vsLastPeriod)
                }
                if (ieResult.success && ieResult.data) {
                    setIncomeExpense(ieResult.data)
                }
                if (spResult.success && spResult.data) {
                    setSpending(spResult.data as SpendingData)
                }
            } catch (error) {
                console.error("Error fetching statistics:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [period])

    const periods: { value: PeriodType; label: string }[] = [
        { value: '7D', label: '7H' },
        { value: '30D', label: '30H' },
        { value: '12W', label: '12M' },
        { value: '6M', label: '6B' },
        { value: '1Y', label: '1T' }
    ]

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl sm:text-3xl font-bold">Statistik</h2>
                </div>
                <div className="grid gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        Statistik
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Insight keuangan untuk keputusan lebih baik.
                    </p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
                    {periods.map(p => (
                        <Button
                            key={p.value}
                            variant={period === p.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPeriod(p.value)}
                            className="px-4"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Cash Flow Table */}
            {cashFlow && (
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ArrowUpDown className="w-5 h-5 text-primary" />
                                Cash Flow Table
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Apakah saya terlalu boros?</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">{cashFlow.periode.toUpperCase()}</p>

                        {/* Quick Overview Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 font-medium text-muted-foreground">Ringkasan</th>
                                        <th className="text-right py-2 font-medium text-emerald-500">Pemasukan</th>
                                        <th className="text-right py-2 font-medium text-red-500">Pengeluaran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Jumlah Transaksi</td>
                                        <td className="py-2 text-right">{cashFlow.income.count}</td>
                                        <td className="py-2 text-right">{cashFlow.expense.count}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Rata-rata/Hari</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.avgPerDay)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.avgPerDay)}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Rata-rata/Transaksi</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.avgPerRecord)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.avgPerRecord)}</td>
                                    </tr>
                                    <tr className="font-bold">
                                        <td className="py-2">Total</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.total)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Cash Flow Summary */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                            <span className="font-medium">Cash Flow</span>
                            <span className={`text-xl font-bold ${cashFlow.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                                {cashFlow.cashFlow >= 0 ? '+' : ''}{formatRupiah(cashFlow.cashFlow)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Income & Expense Book */}
            {incomeExpense && (
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                                Buku Pemasukan & Pengeluaran
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Ke mana uang Anda pergi?</p>
                    </CardHeader>
                    <CardContent>
                        {/* Summary */}
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-xs text-muted-foreground">{incomeExpense.periode.toUpperCase()}</p>
                                <p className={`text-2xl font-bold ${incomeExpense.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                                    {incomeExpense.cashFlow >= 0 ? '+' : ''}{formatRupiah(incomeExpense.cashFlow)}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${incomeExpense.vsLastPeriod >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {incomeExpense.vsLastPeriod >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {incomeExpense.vsLastPeriod >= 0 ? '+' : ''}{incomeExpense.vsLastPeriod}%
                                <span className="text-muted-foreground text-xs ml-1">vs periode lalu</span>
                            </div>
                        </div>

                        {/* Income Section */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-emerald-500">Pemasukan</span>
                                <span className="font-bold" data-private="true">{formatRupiah(incomeExpense.totalIncome)}</span>
                            </div>
                            <div className="space-y-2">
                                {incomeExpense.incomeItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tidak ada pemasukan</p>
                                ) : (
                                    incomeExpense.incomeItems.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{item.icon}</span>
                                                <span className="text-sm">{item.kategori}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium" data-private="true">{formatRupiah(item.nominal)}</span>
                                                {item.vsLastPeriod !== 0 && (
                                                    <span className={`text-xs ${item.vsLastPeriod > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {item.vsLastPeriod > 0 ? '+' : ''}{item.vsLastPeriod}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Expense Section */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-red-500">Pengeluaran</span>
                                <span className="font-bold text-red-500" data-private="true">-{formatRupiah(incomeExpense.totalExpense)}</span>
                            </div>
                            <div className="space-y-2">
                                {incomeExpense.expenseItems.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Tidak ada pengeluaran</p>
                                ) : (
                                    incomeExpense.expenseItems.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{item.icon}</span>
                                                <span className="text-sm">{item.kategori}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium" data-private="true">-{formatRupiah(item.nominal)}</span>
                                                {item.vsLastPeriod !== 0 && (
                                                    <span className={`text-xs ${item.vsLastPeriod > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                        {item.vsLastPeriod > 0 ? '↑' : '↓'}{Math.abs(item.vsLastPeriod)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Spending Insights */}
            {spending && (
                <Card className="border-l-4 border-l-purple-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Lightbulb className="w-5 h-5 text-purple-500" />
                            Insight Pengeluaran
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">Pola pengeluaran Anda</p>
                    </CardHeader>
                    <CardContent>
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-bold text-red-500" data-private="true">-{formatRupiah(spending.totalSpending)}</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Rata-rata/Hari</p>
                                <p className="font-bold" data-private="true">{formatRupiah(spending.avgDaily)}</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground">Transaksi</p>
                                <p className="font-bold">{spending.transactionCount}x</p>
                            </div>
                        </div>

                        {/* Top Categories */}
                        <div className="mb-4">
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Top Kategori
                            </h4>
                            <div className="space-y-2">
                                {spending.topCategories.slice(0, 5).map((cat, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="w-8 text-center font-bold text-muted-foreground">#{i + 1}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium">{cat.kategori}</span>
                                                <span className="text-sm" data-private="true">{formatRupiah(cat.nominal)}</span>
                                            </div>
                                            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                                                    style={{ width: `${cat.persentase}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                                <span>{cat.count}x transaksi</span>
                                                <span className={cat.trend > 0 ? 'text-red-500' : cat.trend < 0 ? 'text-emerald-500' : ''}>
                                                    {cat.trend > 0 ? '↑' : cat.trend < 0 ? '↓' : '='} {Math.abs(cat.trend)}% vs periode lalu
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Spending by Day */}
                        <div>
                            <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Pengeluaran per Hari
                            </h4>
                            <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
                                {spending.spendingByDay.map((day, i) => {
                                    const maxSpending = Math.max(...spending.spendingByDay.map(d => d.nominal), 1)
                                    const heightPixels = maxSpending > 0 ? Math.max((day.nominal / maxSpending) * 100, day.nominal > 0 ? 10 : 4) : 4

                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                                            <div
                                                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all"
                                                style={{
                                                    height: heightPixels,
                                                    minWidth: 20,
                                                    opacity: day.nominal > 0 ? 1 : 0.3
                                                }}
                                            ></div>
                                            <span className="text-[10px] text-muted-foreground">{day.hari}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Decision Helper */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-amber-500/20 rounded-full">
                            <Lightbulb className="w-6 h-6 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">💡 Rekomendasi</h3>
                            {cashFlow && spending && (
                                <div className="space-y-2 text-sm text-slate-300">
                                    {cashFlow.cashFlow < 0 && (
                                        <p className="flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                            <span>Pengeluaran melebihi pemasukan. Pertimbangkan untuk mengurangi pengeluaran non-esensial.</span>
                                        </p>
                                    )}
                                    {spending.topCategories[0] && (
                                        <p className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                                            <span>
                                                Kategori terbesar: <strong>{spending.topCategories[0].kategori}</strong> ({spending.topCategories[0].persentase}% dari total).
                                                {spending.topCategories[0].trend > 20 && ' Naik signifikan dari periode lalu.'}
                                            </span>
                                        </p>
                                    )}
                                    {cashFlow.cashFlow > 0 && (
                                        <p className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                                            <span>
                                                Bagus! Anda berhasil menyisihkan <strong data-private="true">{formatRupiah(cashFlow.cashFlow)}</strong> periode ini.
                                            </span>
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
