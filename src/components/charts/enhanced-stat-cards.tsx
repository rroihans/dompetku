"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Minus
} from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface StatData {
    nominal: number
    perubahan: number
}

interface EnhancedStatsData {
    totalSaldo: number
    pemasukan: StatData
    pengeluaran: StatData
    selisih: StatData
}

interface EnhancedStatCardsProps {
    data: EnhancedStatsData
}

export function EnhancedStatCards({ data }: EnhancedStatCardsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Total Saldo */}
            <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold" data-private="true">
                        {formatRupiah(data.totalSaldo)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Semua akun user
                    </p>
                </CardContent>
            </Card>

            {/* Pemasukan */}
            <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pemasukan</CardTitle>
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-500" data-private="true">
                        +{formatRupiah(data.pemasukan.nominal)}
                    </div>
                    <ChangeIndicator
                        value={data.pemasukan.perubahan}
                        positiveIsGood={true}
                    />
                </CardContent>
            </Card>

            {/* Pengeluaran */}
            <Card className="border-l-4 border-l-red-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pengeluaran</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-500" data-private="true">
                        -{formatRupiah(data.pengeluaran.nominal)}
                    </div>
                    <ChangeIndicator
                        value={data.pengeluaran.perubahan}
                        positiveIsGood={false}  // Pengeluaran naik = buruk
                    />
                </CardContent>
            </Card>

            {/* Selisih */}
            <Card className={`border-l-4 ${data.selisih.nominal >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Selisih Bulan Ini</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div
                        className={`text-2xl font-bold ${data.selisih.nominal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                        data-private="true"
                    >
                        {data.selisih.nominal >= 0 ? '+' : ''}{formatRupiah(data.selisih.nominal)}
                    </div>
                    <ChangeIndicator
                        value={data.selisih.perubahan}
                        positiveIsGood={true}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

interface ChangeIndicatorProps {
    value: number
    positiveIsGood: boolean
}

function ChangeIndicator({ value, positiveIsGood }: ChangeIndicatorProps) {
    if (value === 0) {
        return (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Minus className="w-3 h-3" />
                Sama dengan bulan lalu
            </p>
        )
    }

    const isPositive = value > 0
    const isGood = positiveIsGood ? isPositive : !isPositive

    return (
        <p className={`text-xs flex items-center gap-1 ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
            ) : (
                <ArrowDownRight className="w-3 h-3" />
            )}
            <span className="font-medium">{isPositive ? '+' : ''}{value}%</span>
            <span className="text-muted-foreground">vs bulan lalu</span>
        </p>
    )
}
