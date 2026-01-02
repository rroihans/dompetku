"use client"

import { useState, useEffect, useRef } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PieChartIcon, X, ArrowLeft, Calendar } from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { getCategoryDetail } from "@/app/actions/analytics"

interface KategoriData {
    kategori: string
    total: number
    jumlah: number
    [key: string]: string | number // Index signature for Recharts compatibility
}

interface DrilldownPieChartProps {
    data: KategoriData[]
    title?: string
}

// Warna untuk chart
const COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e", "#14b8a6",
    "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"
]

export function DrilldownPieChart({ data, title = "Pengeluaran per Kategori" }: DrilldownPieChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isMounted, setIsMounted] = useState(false)
    const [containerWidth, setContainerWidth] = useState(300)
    const [activeIndex, setActiveIndex] = useState<number | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [detailData, setDetailData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(Math.max(containerRef.current.offsetWidth - 24, 280))
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
                        <PieChartIcon className="w-5 h-5" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-[200px] text-muted-foreground">
                        Tidak ada data pengeluaran
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Total untuk persentase
    const total = data.reduce((sum, d) => sum + d.total, 0)

    // Handle click untuk drill-down
    async function handleClick(kategori: string) {
        setSelectedCategory(kategori)
        setDialogOpen(true)
        setLoading(true)

        try {
            const result = await getCategoryDetail(kategori)
            if (result.success) {
                setDetailData(result.data)
            }
        } catch (error) {
            console.error("Error fetching category detail:", error)
        } finally {
            setLoading(false)
        }
    }

    // Remove unused active shape (simplifed for mobile)

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            const persen = ((item.total / total) * 100).toFixed(1)
            return (
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="font-medium">{item.kategori}</p>
                    <p className="text-lg font-bold" data-private="true">
                        {formatRupiah(item.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {item.jumlah} transaksi • {persen}%
                    </p>
                    <p className="text-xs text-primary mt-2">
                        Klik untuk lihat detail →
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <PieChartIcon className="w-5 h-5 text-red-500" />
                        {title}
                    </CardTitle>
                </CardHeader>
                <CardContent ref={containerRef}>
                    {!isMounted ? (
                        <div className="flex items-center justify-center h-[260px] bg-muted/20 rounded animate-pulse">
                            <span className="text-muted-foreground text-sm">Memuat chart...</span>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <PieChart width={containerWidth} height={260}>
                                <Pie
                                    data={data as any}
                                    dataKey="total"
                                    nameKey="kategori"
                                    cx={containerWidth / 2}
                                    cy={130}
                                    innerRadius={45}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    onClick={(_, index) => handleClick(data[index].kategori)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {data.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                            stroke="hsl(var(--background))"
                                            strokeWidth={2}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </div>
                    )}
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
                        {data.slice(0, 6).map((item, index) => (
                            <button
                                key={item.kategori}
                                onClick={() => handleClick(item.kategori)}
                                className="flex items-center gap-1.5 text-xs hover:underline"
                            >
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-muted-foreground">
                                    {item.kategori.length > 10 ? item.kategori.substring(0, 8) + "..." : item.kategori}
                                </span>
                            </button>
                        ))}
                        {data.length > 6 && (
                            <span className="text-xs text-muted-foreground">
                                +{data.length - 6} lainnya
                            </span>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Drill-down Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <button onClick={() => setDialogOpen(false)} className="hover:bg-muted p-1 rounded">
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            Detail: {selectedCategory}
                        </DialogTitle>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : detailData ? (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-xl font-bold" data-private="true">
                                        {formatRupiah(detailData.total)}
                                    </p>
                                </div>
                                <div className="bg-muted/50 rounded-lg p-3">
                                    <p className="text-xs text-muted-foreground">Transaksi</p>
                                    <p className="text-xl font-bold">{detailData.jumlahTransaksi}</p>
                                </div>
                            </div>

                            {/* Weekly Breakdown Chart */}
                            <div>
                                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Pengeluaran per Minggu
                                </p>
                                <BarChart width={350} height={120} data={detailData.weeklyBreakdown}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                    <XAxis dataKey="minggu" tick={{ fontSize: 10 }} />
                                    <YAxis
                                        tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                                        tick={{ fontSize: 10 }}
                                        width={40}
                                    />
                                    <Bar dataKey="nominal" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </div>

                            {/* Transaction List */}
                            <div>
                                <p className="text-sm font-medium mb-2">Transaksi Terbesar</p>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {detailData.transaksi.slice(0, 10).map((tx: any) => (
                                        <div key={tx.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                            <div>
                                                <p className="text-sm font-medium">{tx.deskripsi}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.tanggal).toLocaleDateString("id-ID")} • {tx.akun}
                                                </p>
                                            </div>
                                            <p className="text-sm font-bold text-red-500" data-private="true">
                                                -{formatRupiah(tx.nominal)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            Gagal memuat data
                        </div>
                    )}
                </DialogContent>
            </Dialog >
        </>
    )
}
