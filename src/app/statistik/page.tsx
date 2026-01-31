"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    AlertTriangle,
    LineChart
} from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { getCashFlowTable, getIncomeExpenseBook, getSpendingInsights, getDashboardAnalytics, getSaldoTrend, type CashFlowData, type IncomeExpenseBook as IEBook, type PeriodType } from "@/lib/db/analytics-repo"
import { ExpensePieChart } from "@/components/charts/expense-pie-chart"
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart"
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart"

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

    // Data for Visual Charts (from Dashboard)
    const [analyticsData, setAnalyticsData] = useState<any>(null)
    const [saldoTrendData, setSaldoTrendData] = useState<any[]>([])

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                // Fetch data for both sections
                const [cfResult, ieResult, spResult, analyticsResult, saldoTrendResult] = await Promise.all([
                    getCashFlowTable(period),
                    getIncomeExpenseBook(period),
                    getSpendingInsights(period),
                    getDashboardAnalytics(), // This might need period adjustment if we want to sync charts
                    getSaldoTrend(30) // Fixed to 30 for trend chart for now, or match period
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

                setAnalyticsData(analyticsResult)
                if (saldoTrendResult.success && saldoTrendResult.data) {
                     setSaldoTrendData(saldoTrendResult.data)
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
        <div className="space-y-6 max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        Statistik
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Analisa visual dan laporan detail keuangan Anda.
                    </p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center sticky top-14 z-10 bg-background/80 backdrop-blur py-2">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg shadow-sm">
                    {periods.map(p => (
                        <Button
                            key={p.value}
                            variant={period === p.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPeriod(p.value)}
                            className="px-3 h-8 text-xs font-medium rounded-md transition-all"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            <Tabs defaultValue="visual" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="visual" className="flex items-center gap-2">
                        <PieChart className="w-4 h-4" /> Visual
                    </TabsTrigger>
                    <TabsTrigger value="report" className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4" /> Laporan
                    </TabsTrigger>
                </TabsList>

                {/* VISUAL TAB - Charts moved from Dashboard */}
                <TabsContent value="visual" className="space-y-4">
                     {/* Saldo Trend */}
                     {saldoTrendData && (
                        <Card className="hover:shadow-md transition-shadow">
                             <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <LineChart className="w-5 h-5 text-primary" />
                                    <CardTitle className="text-base">Trend Saldo (30 Hari)</CardTitle>
                                </div>
                             </CardHeader>
                             <CardContent>
                                <SaldoTrendChart data={saldoTrendData} />
                             </CardContent>
                        </Card>
                     )}

                     {/* Expense Pie Chart */}
                     {analyticsData && analyticsData.pengeluaranPerKategori && (
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <PieChart className="w-5 h-5 text-primary" />
                                    <CardTitle className="text-base">Komposisi Pengeluaran</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ExpensePieChart data={analyticsData.pengeluaranPerKategori} />
                            </CardContent>
                        </Card>
                     )}

                     {/* Monthly Trend Bar Chart */}
                     {analyticsData && analyticsData.trendBulanan && (
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                    <CardTitle className="text-base">Trend Pemasukan vs Pengeluaran</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <MonthlyTrendChart data={analyticsData.trendBulanan} />
                            </CardContent>
                        </Card>
                     )}
                </TabsContent>

                {/* REPORT TAB - Existing Detailed Tables */}
                <TabsContent value="report" className="space-y-6">
                    {/* Cash Flow Table */}
                    {cashFlow && (
                        <Card className="border-l-4 border-l-primary">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ArrowUpDown className="w-5 h-5 text-primary" />
                                    Cash Flow Table
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Ringkasan arus kas periode ini.</p>
                            </CardHeader>
                            <CardContent>
                                {/* Quick Overview Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-2 font-medium text-muted-foreground">Ringkasan</th>
                                                <th className="text-right py-2 font-medium text-emerald-500">Masuk</th>
                                                <th className="text-right py-2 font-medium text-red-500">Keluar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="py-2 text-muted-foreground">Jml Transaksi</td>
                                                <td className="py-2 text-right">{cashFlow.income.count}</td>
                                                <td className="py-2 text-right">{cashFlow.expense.count}</td>
                                            </tr>
                                            <tr className="border-b">
                                                <td className="py-2 text-muted-foreground">Rata/Hari</td>
                                                <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.avgPerDay)}</td>
                                                <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.avgPerDay)}</td>
                                            </tr>
                                            <tr className="font-bold">
                                                <td className="py-2">Total</td>
                                                <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.total)}</td>
                                                <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.total)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
                                    <span className="font-medium text-sm">Net Cash Flow</span>
                                    <span className={`text-lg font-bold ${cashFlow.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
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
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <DollarSign className="w-5 h-5 text-amber-500" />
                                    Buku Besar
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Rincian per kategori.</p>
                            </CardHeader>
                            <CardContent>
                                {/* Income Section */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-emerald-500 text-sm uppercase tracking-wide">Pemasukan</span>
                                        <span className="font-bold text-sm" data-private="true">{formatRupiah(incomeExpense.totalIncome)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {incomeExpense.incomeItems.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">Tidak ada pemasukan</p>
                                        ) : (
                                            incomeExpense.incomeItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-dashed">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{item.icon}</span>
                                                        <span className="text-sm">{item.kategori}</span>
                                                    </div>
                                                    <span className="font-medium text-sm" data-private="true">{formatRupiah(item.nominal)}</span>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Expense Section */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium text-red-500 text-sm uppercase tracking-wide">Pengeluaran</span>
                                        <span className="font-bold text-red-500 text-sm" data-private="true">-{formatRupiah(incomeExpense.totalExpense)}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {incomeExpense.expenseItems.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">Tidak ada pengeluaran</p>
                                        ) : (
                                            incomeExpense.expenseItems.map((item, i) => (
                                                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 border-dashed">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base">{item.icon}</span>
                                                        <span className="text-sm">{item.kategori}</span>
                                                    </div>
                                                    <span className="font-medium text-sm" data-private="true">-{formatRupiah(item.nominal)}</span>
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
                                    Top Spending
                                </CardTitle>
                                <p className="text-xs text-muted-foreground">Kategori pengeluaran terbesar.</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {spending.topCategories.slice(0, 5).map((cat, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 text-center font-bold text-muted-foreground text-xs">#{i + 1}</div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium">{cat.kategori}</span>
                                                    <span className="text-xs font-bold" data-private="true">{formatRupiah(cat.nominal)}</span>
                                                </div>
                                                <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                                        style={{ width: `${cat.persentase}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>

            {/* Decision Helper - Always Visible at bottom */}
            <Card className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white border-0 mt-6">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-full shrink-0">
                            <Lightbulb className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm mb-1">💡 Quick Insight</h3>
                            {cashFlow && (
                                <div className="text-xs text-slate-300">
                                    {cashFlow.cashFlow < 0 ? (
                                        <span className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3 text-red-400" />
                                            Warning: Pengeluaran &gt; Pemasukan.
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Wallet className="w-3 h-3 text-emerald-400" />
                                            Good Job! Surplus <span data-private="true">{formatRupiah(cashFlow.cashFlow)}</span>.
                                        </span>
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
