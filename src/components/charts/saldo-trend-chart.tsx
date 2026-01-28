"use client"

import { useState, useEffect, useRef } from "react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface TrendDataPoint {
    tanggal: string
    saldo: number
}

interface SaldoTrendChartProps {
    data: TrendDataPoint[]
    title?: string
}

export function SaldoTrendChart({ data, title = "Trend Saldo 30 Hari" }: SaldoTrendChartProps) {
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

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="w-5 h-5" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Tidak ada data
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Format tanggal untuk display
    const formattedData = data.map(d => {
        const dateStr = d.tanggal || (d as any).date;
        const dateObj = dateStr ? new Date(dateStr) : new Date();
        const label = isNaN(dateObj.getTime())
            ? "---"
            : dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });

        return {
            ...d,
            label
        };
    })

    // Hitung rata-rata untuk reference line
    const avgSaldo = data.reduce((sum, d) => sum + d.saldo, 0) / data.length

    // Hitung min/max untuk Y axis domain
    const minSaldo = Math.min(...data.map(d => d.saldo))
    const maxSaldo = Math.max(...data.map(d => d.saldo))
    const range = maxSaldo - minSaldo
    const padding = range > 0 ? range * 0.2 : maxSaldo * 0.1
    const yMin = Math.max(0, minSaldo - padding)
    const yMax = maxSaldo + padding

    // Custom tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-lg font-bold text-emerald-500" data-private="true">
                        {formatRupiah(payload[0].value)}
                    </p>
                </div>
            )
        }
        return null
    }

    // Format Y axis
    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`
        if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
        return value.toString()
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6" ref={containerRef}>
                {!isMounted ? (
                    <div className="flex items-center justify-center h-[200px] bg-muted/20 rounded animate-pulse">
                        <span className="text-muted-foreground text-sm">Memuat chart...</span>
                    </div>
                ) : (
                    <AreaChart
                        width={chartWidth}
                        height={200}
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="saldoGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                        <XAxis
                            dataKey="label"
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
                            domain={[yMin, yMax]}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <ReferenceLine
                            y={avgSaldo}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            strokeWidth={2}
                        />
                        <Area
                            type="monotone"
                            dataKey="saldo"
                            stroke="#10b981"
                            strokeWidth={3}
                            fill="url(#saldoGradient)"
                            dot={false}
                            activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                        />
                    </AreaChart>
                )}
            </CardContent>
        </Card>
    )
}
