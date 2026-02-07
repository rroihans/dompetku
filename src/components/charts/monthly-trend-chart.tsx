"use client"

import { useState, useEffect, useRef } from "react"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts"
import { formatRupiah } from "@/lib/format"

interface TrendBulanan {
    bulanNama: string
    pemasukan: number
    pengeluaran: number
}

interface MonthlyTrendChartProps {
    data: TrendBulanan[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 300, height: 250 })
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth
                setDimensions({ width: Math.max(width, 280), height: 250 })
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)
        const timeout = setTimeout(updateDimensions, 100)

        return () => {
            window.removeEventListener('resize', updateDimensions)
            clearTimeout(timeout)
        }
    }, [])

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Belum ada data trend
            </div>
        )
    }

    return (
        <div ref={containerRef} className="w-full">
            {!isMounted ? (
                <div className="flex items-center justify-center h-[250px] bg-muted/20 rounded animate-pulse">
                    <span className="text-muted-foreground text-sm">Memuat chart...</span>
                </div>
            ) : (
                <BarChart
                    width={dimensions.width}
                    height={dimensions.height}
                    data={data}
                    margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                        dataKey="bulanNama"
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                    />
                    <YAxis
                        tickFormatter={(value) => {
                            if (value >= 1000000) return `${(value / 1000000).toFixed(0)}jt`
                            if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
                            return value
                        }}
                        tick={{ fontSize: 10 }}
                        className="fill-muted-foreground"
                    />
                    <Tooltip
                        formatter={(value, name) => [
                            formatRupiah(value as number),
                            name === "pemasukan" ? "Pemasukan" : "Pengeluaran"
                        ]}
                        labelFormatter={(label) => `Bulan: ${label}`}
                        contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                        }}
                    />
                    <Legend
                        formatter={(value) => value === "pemasukan" ? "Pemasukan" : "Pengeluaran"}
                    />
                    <Bar
                        dataKey="pemasukan"
                        fill="#22c55e"
                        radius={[4, 4, 0, 0]}
                        name="pemasukan"
                    />
                    <Bar
                        dataKey="pengeluaran"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        name="pengeluaran"
                    />
                </BarChart>
            )}
        </div>
    )
}
