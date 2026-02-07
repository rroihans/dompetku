"use client"

import { useState, useEffect, useRef } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface NetWorthData {
    id: string
    tanggal: Date | string
    totalAset: number
    totalHutang: number
    netWorth: number
    breakdown: Record<string, number>
}

interface NetWorthChartProps {
    data: NetWorthData[]
    currentNetWorth: number
    change: number
    changePercent: number
    totalAset: number
    totalHutang: number
    totalCicilan: number
}

export function NetWorthChart({
    data,
    currentNetWorth,
    change,
    changePercent,
    totalAset,
    totalHutang,
    totalCicilan
}: NetWorthChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [chartWidth, setChartWidth] = useState(300)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        const updateWidth = () => {
            if (containerRef.current) {
                setChartWidth(Math.max(containerRef.current.offsetWidth - 24, 280))
            }
        }

        updateWidth()
        window.addEventListener('resize', updateWidth)
        const timeout = setTimeout(updateWidth, 100)

        return () => {
            window.removeEventListener('resize', updateWidth)
            clearTimeout(timeout)
        }
    }, [])

    // Format data untuk chart
    const chartData = data.map(d => ({
        ...d,
        tanggalLabel: new Date(d.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
    }))

interface NetWorthTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: number; payload?: { totalAset?: number; totalHutang?: number } }>;
    label?: string;
}

const CustomTooltip = ({ active, payload, label }: NetWorthTooltipProps) => {
    if (active && payload && payload.length) {
        const item = payload[0]
        return (
            <div className="bg-popover border rounded-lg p-3 shadow-lg min-w-[180px]">
                <p className="text-sm text-muted-foreground mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-emerald-500">Aset:</span>
                        <span className="font-bold" data-private="true">
                            {formatRupiah(item.payload?.totalAset ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-red-500">Hutang:</span>
                        <span className="font-bold" data-private="true">
                            {formatRupiah(item.payload?.totalHutang ?? 0)}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm pt-1 border-t">
                        <span className="font-medium">Net Worth:</span>
                        <span className={`font-bold ${(item.value ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                            {formatRupiah(item.value ?? 0)}
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

const formatYAxis = (value: number) => {
    if (Math.abs(value) >= 1000000000) return `${(value / 1000000000).toFixed(0)}M`
    if (Math.abs(value) >= 1000000) return `${(value / 1000000).toFixed(0)}jt`
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}rb`
    return value.toString()
}


    const isPositiveChange = change >= 0

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <PiggyBank className="w-5 h-5 text-primary" />
                        Harta Bersih (Net Worth)
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-1 text-sm ${isPositiveChange ? 'text-emerald-500' : 'text-red-500'}`}>
                            {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-medium">{isPositiveChange ? '+' : ''}{changePercent}%</span>
                            <span className="text-muted-foreground text-xs">(30 hari)</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6" ref={containerRef}>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4">
                    <div className="bg-emerald-500/10 rounded-lg p-2 sm:p-3 text-center">
                        <Wallet className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Total Aset</p>
                        <p className="text-sm sm:text-base font-bold text-emerald-500" data-private="true">
                            {formatRupiah(totalAset)}
                        </p>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2 sm:p-3 text-center">
                        <CreditCard className="w-4 h-4 text-red-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Total Hutang</p>
                        <p className="text-sm sm:text-base font-bold text-red-500" data-private="true">
                            {formatRupiah(totalHutang)}
                        </p>
                        {totalCicilan > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                                (Inc. {formatRupiah(totalCicilan)} cicilan)
                            </p>
                        )}
                    </div>
                    <div className={`rounded-lg p-2 sm:p-3 text-center ${currentNetWorth >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                        <PiggyBank className="w-4 h-4 text-primary mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">Net Worth</p>
                        <p className={`text-sm sm:text-base font-bold ${currentNetWorth >= 0 ? 'text-primary' : 'text-red-500'}`} data-private="true">
                            {formatRupiah(currentNetWorth)}
                        </p>
                    </div>
                </div>

                {/* Chart */}
                {!isMounted ? (
                    <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded animate-pulse">
                        <span className="text-muted-foreground text-sm">Memuat chart...</span>
                    </div>
                ) : data.length > 0 ? (
                    <AreaChart
                        width={chartWidth}
                        height={200}
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="netWorthGradientPositive" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="netWorthGradientNegative" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                            dataKey="tanggalLabel"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            width={50}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="3 3" />
                        <Area
                            type="monotone"
                            dataKey="netWorth"
                            stroke={currentNetWorth >= 0 ? "#10b981" : "#ef4444"}
                            strokeWidth={2}
                            fill={currentNetWorth >= 0 ? "url(#netWorthGradientPositive)" : "url(#netWorthGradientNegative)"}
                            dot={false}
                            activeDot={{ r: 5, fill: currentNetWorth >= 0 ? "#10b981" : "#ef4444" }}
                        />
                    </AreaChart>
                ) : (
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Belum ada data histori. Data akan terekam secara otomatis.
                    </div>
                )}

                {/* Change Summary */}
                {change !== 0 && (
                    <div className={`mt-4 p-3 rounded-lg ${isPositiveChange ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                        <p className="text-sm">
                            {isPositiveChange ? '📈' : '📉'} Dalam 30 hari terakhir, kekayaan bersih Anda{' '}
                            <span className={`font-bold ${isPositiveChange ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isPositiveChange ? 'bertambah' : 'berkurang'} {formatRupiah(Math.abs(change))}
                            </span>
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
