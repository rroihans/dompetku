"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatRupiah } from "@/lib/format"
import { TrendingUp, TrendingDown, PiggyBank } from "lucide-react"

interface YearData {
    summary: {
        totalIncome: number
        totalExpense: number
    }
}

interface Props {
    year1Data: YearData
    year2Data: YearData
    year1: number
    year2: number
}

export function YoYSummaryCards({ year1Data, year2Data, year1, year2 }: Props) {
    const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr === 0 ? 0 : 100;
        return ((curr - prev) / prev) * 100;
    }

    const expenseChange = calcChange(year2Data.summary.totalExpense, year1Data.summary.totalExpense);
    const incomeChange = calcChange(year2Data.summary.totalIncome, year1Data.summary.totalIncome);
    
    // Savings Rate
    const savings1 = year1Data.summary.totalIncome > 0 
        ? ((year1Data.summary.totalIncome - year1Data.summary.totalExpense) / year1Data.summary.totalIncome) * 100 
        : 0;
    const savings2 = year2Data.summary.totalIncome > 0
        ? ((year2Data.summary.totalIncome - year2Data.summary.totalExpense) / year2Data.summary.totalIncome) * 100
        : 0;
    const savingsChange = savings2 - savings1; // Percentage point change

    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatRupiah(year2Data.summary.totalExpense)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {year1}: {formatRupiah(year1Data.summary.totalExpense)}
                    </p>
                    <div className={`text-xs font-medium mt-1 ${expenseChange < 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}% ({expenseChange < 0 ? 'Lebih Hemat' : 'Naik'})
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatRupiah(year2Data.summary.totalIncome)}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {year1}: {formatRupiah(year1Data.summary.totalIncome)}
                    </p>
                    <div className={`text-xs font-medium mt-1 ${incomeChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Savings Rate</CardTitle>
                    <PiggyBank className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{savings2.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {year1}: {savings1.toFixed(1)}%
                    </p>
                    <div className={`text-xs font-medium mt-1 ${savingsChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {savingsChange > 0 ? '+' : ''}{savingsChange.toFixed(1)}%
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
