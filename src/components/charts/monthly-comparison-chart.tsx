"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface MonthlyComparison {
    kategori: string
    bulanIni: number
    bulanLalu: number
    persentasePerubahan: number
}

interface MonthlyComparisonChartProps {
    data: MonthlyComparison[]
    limit?: number
}

export function MonthlyComparisonChart({ data, limit = 8 }: MonthlyComparisonChartProps) {
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
                        <ArrowUpDown className="w-5 h-5" />
                        Bulan Ini vs Bulan Lalu
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        Tidak ada data pengeluaran
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Limit data untuk tampilan
    const chartData = data.slice(0, limit).map(d => ({
        ...d,
        kategoriShort: d.kategori.length > 8 ? d.kategori.substring(0, 6) + "..." : d.kategori
    }))

interface ComparisonChartData {
    kategori: string;
    kategoriShort: string;
    persentasePerubahan: number;
}

interface ComparisonTooltipProps {
    active?: boolean;
    payload?: Array<{ value?: number }>;
    label?: string;
    data?: ComparisonChartData[];
}

const CustomTooltip = ({ active, payload, label, data }: ComparisonTooltipProps) => {
    if (active && payload && payload.length && data) {
        // Find full item data
        const item = data.find((d) => d.kategoriShort === label) || 
                     data.find((d) => d.kategori.startsWith(label?.replace("...", "") ?? ""))
        
        const perubahan = item?.persentasePerubahan || 0

        return (
            <div className="bg-popover border rounded-lg p-3 shadow-lg min-w-[180px]">
                <p className="font-medium mb-2">{item?.kategori || label}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Bulan ini:</span>
                        <span className="font-bold" data-private="true">{formatRupiah(payload[0]?.value || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Bulan lalu:</span>
                        <span className="font-bold" data-private="true">{formatRupiah(payload[1]?.value || 0)}</span>
                    </div>
                    <div className={`flex items-center justify-between pt-1 border-t ${perubahan > 0 ? "text-red-500" : perubahan < 0 ? "text-emerald-500" : "text-muted-foreground"
                        }`}>
                        <span>Perubahan:</span>
                        <span className="flex items-center gap-1 font-bold">
                            {perubahan > 0 ? <TrendingUp className="w-3 h-3" /> : perubahan < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                            {perubahan > 0 ? "+" : ""}{perubahan}%
                        </span>
                    </div>
                </div>
            </div>
        )
    }
    return null
}

const formatYAxis = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
    return value.toString()
}

    // Format Y axis

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <ArrowUpDown className="w-5 h-5 text-primary" />
                    Pengeluaran: Bulan Ini vs Lalu
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6" ref={containerRef}>
                {!isMounted ? (
                    <div className="flex items-center justify-center h-[220px] bg-muted/20 rounded animate-pulse">
                        <span className="text-muted-foreground text-sm">Memuat chart...</span>
                    </div>
                ) : (
                    <BarChart
                        width={chartWidth}
                        height={220}
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        barGap={2}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="kategoriShort"
                            tick={{ fontSize: 9, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            angle={-35}
                            textAnchor="end"
                            height={50}
                        />
                        <YAxis
                            tickFormatter={formatYAxis}
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            width={45}
                        />
                        <Tooltip content={<CustomTooltip data={chartData} />} />
                        <Legend
                            verticalAlign="top"
                            height={30}
                            formatter={(value) => <span className="text-xs">{value}</span>}
                        />
                        <Bar
                            dataKey="bulanIni"
                            name="Bulan Ini"
                            fill="#ef4444"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={25}
                        />
                        <Bar
                            dataKey="bulanLalu"
                            name="Bulan Lalu"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={25}
                        />
                    </BarChart>
                )}
            </CardContent>
        </Card>
    )
}
