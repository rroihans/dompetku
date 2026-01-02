"use client"

import { useState, useEffect, useRef } from "react"
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PiggyBank } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface AccountComposition {
    nama: string
    tipe: string
    saldo: number
    warna: string
    persentase: number
    [key: string]: string | number
}

interface AssetCompositionChartProps {
    data: AccountComposition[]
    total: number
}

export function AssetCompositionChart({ data, total }: AssetCompositionChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [chartWidth, setChartWidth] = useState(280)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        const updateWidth = () => {
            if (containerRef.current) {
                setChartWidth(Math.max(containerRef.current.offsetWidth - 24, 250))
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
                        <PiggyBank className="w-5 h-5" />
                        Komposisi Aset
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Tidak ada aset dengan saldo positif
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            return (
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{item.nama}</p>
                    <p className="text-xs text-muted-foreground mb-2">{getTipeLabel(item.tipe)}</p>
                    <p className="text-lg font-bold" data-private="true">
                        {formatRupiah(item.saldo)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {item.persentase}% dari total
                    </p>
                </div>
            )
        }
        return null
    }

    // Custom legend - mobile friendly
    const renderLegend = (props: any) => {
        const { payload } = props
        return (
            <div className="grid grid-cols-2 gap-1 mt-2 px-2 text-[10px] sm:text-xs">
                {payload.slice(0, 6).map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-1 truncate">
                        <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground truncate">
                            {entry.value.length > 10 ? entry.value.substring(0, 10) + "..." : entry.value} ({entry.payload.persentase}%)
                        </span>
                    </div>
                ))}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <PiggyBank className="w-5 h-5 text-primary" />
                        Komposisi Aset
                    </CardTitle>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Total Aset</p>
                        <p className="text-lg font-bold" data-private="true">{formatRupiah(total)}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6" ref={containerRef}>
                {!isMounted ? (
                    <div className="flex items-center justify-center h-[180px] bg-muted/20 rounded animate-pulse">
                        <span className="text-muted-foreground text-sm">Memuat chart...</span>
                    </div>
                ) : (
                    <PieChart width={chartWidth} height={180}>
                        <Pie
                            data={data}
                            dataKey="saldo"
                            nameKey="nama"
                            cx={chartWidth / 2}
                            cy={70}
                            innerRadius={30}
                            outerRadius={Math.min(chartWidth * 0.15, 55)}
                            paddingAngle={2}
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.warna}
                                    stroke="hsl(var(--background))"
                                    strokeWidth={2}
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend content={renderLegend} />
                    </PieChart>
                )}
            </CardContent>
        </Card>
    )
}

function getTipeLabel(tipe: string): string {
    const labels: Record<string, string> = {
        BANK: "Bank",
        E_WALLET: "E-Wallet",
        CASH: "Tunai",
        CREDIT_CARD: "Kartu Kredit"
    }
    return labels[tipe] || tipe
}
