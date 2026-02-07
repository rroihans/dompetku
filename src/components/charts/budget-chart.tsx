"use client"

import { useState, useEffect, useRef } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface BudgetItem {
    kategori: string
    nominal: number
    realisasi: number
    persentase: number
    sisa: number
    noBudget?: boolean
    proyeksi?: number
    persentaseProyeksi?: number
}

interface BudgetChartProps {
    budgets: BudgetItem[]
    unbudgeted?: BudgetItem[]
    totalBudget: number
    totalRealisasi: number
}

export function BudgetChart({ budgets, unbudgeted = [], totalBudget, totalRealisasi }: BudgetChartProps) {
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

    // Combine and prepare data for chart
    const chartData = [
        ...budgets.map(b => ({
            kategori: b.kategori.length > 10 ? b.kategori.substring(0, 8) + "..." : b.kategori,
            fullName: b.kategori,
            budget: b.nominal,
            realisasi: b.realisasi,
            persentase: b.persentase,
            sisa: b.sisa,
            status: b.persentase > 100 ? 'over' : b.persentase > 80 ? 'warning' : 'ok'
        })),
        ...unbudgeted.slice(0, 3).map(b => ({
            kategori: b.kategori.length > 10 ? b.kategori.substring(0, 8) + "..." : b.kategori,
            fullName: b.kategori,
            budget: 0,
            realisasi: b.realisasi,
            persentase: b.persentase,
            sisa: b.sisa,
            status: 'noBudget'
        }))
    ].slice(0, 8)

interface BudgetChartData {
    fullName: string;
    budget: number;
    realisasi: number;
    status: string;
}

interface BudgetTooltipProps {
    active?: boolean;
    payload?: Array<{ payload: BudgetChartData }>;
}

const CustomTooltip = ({ active, payload }: BudgetTooltipProps) => {
    if (active && payload && payload.length) {
        const item = payload[0].payload
        return (
            <div className="bg-popover border rounded-lg p-3 shadow-lg min-w-[180px]">
                <p className="font-medium mb-2">{item.fullName}</p>
                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Anggaran:</span>
                        <span className="font-bold text-blue-500" data-private="true">
                            {item.budget === 0 ? '-' : formatRupiah(item.budget)}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Realisasi:</span>
                        <span className="font-bold text-emerald-500" data-private="true">
                            {formatRupiah(item.realisasi)}
                        </span>
                    </div>
                    <div className={`flex items-center justify-between pt-1 border-t ${item.status === 'over' ? 'text-red-500' :
                            item.status === 'warning' ? 'text-amber-500' :
                                item.status === 'noBudget' ? 'text-muted-foreground' : 'text-emerald-500'
                        }`}>
                        <span>Status:</span>
                        <span className="flex items-center gap-1 font-bold">
                            {item.status === 'over' && <><TrendingUp className="w-3 h-3" /> Melebihi</>}
                            {item.status === 'warning' && <><AlertTriangle className="w-3 h-3" /> Hampir</>}
                            {item.status === 'ok' && <><TrendingDown className="w-3 h-3" /> Aman</>}
                            {item.status === 'noBudget' && 'Tanpa Anggaran'}
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

// Status color for realisasi bar
const getRealisasiColor = (status: string) => {
    switch (status) {
        case 'over': return '#ef4444' // red
        case 'warning': return '#f59e0b' // amber
        case 'noBudget': return '#6b7280' // gray
        default: return '#22c55e' // green
    }
}

    const totalPersentase = totalBudget > 0 ? Math.round((totalRealisasi / totalBudget) * 100) : 0

    if (budgets.length === 0 && unbudgeted.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5" />
                        Anggaran vs Realisasi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                        Belum ada data anggaran bulan ini
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="w-5 h-5 text-primary" />
                        Anggaran vs Realisasi
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Terpakai</p>
                        <p className={`text-lg font-bold ${totalPersentase > 100 ? 'text-red-500' : totalPersentase > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {totalPersentase}%
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6" ref={containerRef}>
                {!isMounted ? (
                    <div className="flex items-center justify-center h-[250px] bg-muted/20 rounded animate-pulse">
                        <span className="text-muted-foreground text-sm">Memuat chart...</span>
                    </div>
                ) : (
                    <BarChart
                        width={chartWidth}
                        height={250}
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                        barGap={0}
                        barCategoryGap="20%"
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} vertical={false} />
                        <XAxis
                            dataKey="kategori"
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
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign="top"
                            height={30}
                            formatter={(value) => <span className="text-xs">{value}</span>}
                        />
                        <Bar
                            dataKey="budget"
                            name="Anggaran"
                            fill="#3b82f6"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        />
                        <Bar
                            dataKey="realisasi"
                            name="Realisasi"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={30}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getRealisasiColor(entry.status)} />
                            ))}
                        </Bar>
                    </BarChart>
                )}

                {/* Summary */}
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-500/10 rounded-lg p-3">
                        <p className="text-muted-foreground text-xs">Total Anggaran</p>
                        <p className="font-bold text-blue-500" data-private="true">{formatRupiah(totalBudget)}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${totalRealisasi > totalBudget ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
                        <p className="text-muted-foreground text-xs">Total Realisasi</p>
                        <p className={`font-bold ${totalRealisasi > totalBudget ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
                            {formatRupiah(totalRealisasi)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
