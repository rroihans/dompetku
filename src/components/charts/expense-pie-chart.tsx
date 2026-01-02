"use client"

import { useState, useEffect, useRef } from "react"
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts"
import { formatRupiah } from "@/lib/format"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Loader2 } from "lucide-react"
import { getCategoryDetail } from "@/app/actions/analytics"

interface PengeluaranPerKategori {
    kategori: string
    total: number
    jumlah: number
}

interface ExpensePieChartProps {
    data: PengeluaranPerKategori[]
}

// Warna palet yang menarik
const COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#06b6d4", // cyan
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#ec4899", // pink
]

export function ExpensePieChart({ data }: ExpensePieChartProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [dimensions, setDimensions] = useState({ width: 300, height: 250 })
    const [isMounted, setIsMounted] = useState(false)

    // State for drill-down
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [detailData, setDetailData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setIsMounted(true)

        const updateDimensions = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth
                setDimensions({ width: Math.max(width, 250), height: 250 })
            }
        }

        updateDimensions()
        window.addEventListener('resize', updateDimensions)

        // Re-check after a small delay to ensure layout is complete
        const timeout = setTimeout(updateDimensions, 100)

        return () => {
            window.removeEventListener('resize', updateDimensions)
            clearTimeout(timeout)
        }
    }, [])

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                Belum ada data pengeluaran bulan ini
            </div>
        )
    }

    // Format data untuk chart
    const chartData = data.slice(0, 8).map((item, index) => ({
        name: item.kategori,
        value: item.total,
        count: item.jumlah,
        color: COLORS[index % COLORS.length]
    }))

    // Total untuk persentase di tooltip
    const totalPengeluaran = data.reduce((sum, d) => sum + d.total, 0)

    // Handle click untuk drill-down
    async function handleClick(kategori: string) {
        setSelectedCategory(kategori)
        setDialogOpen(true)
        setLoading(true)

        try {
            // Kita asumsikan drill-down untuk bulan/tahun saat ini
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

    // Custom Tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload
            const persen = ((item.value / totalPengeluaran) * 100).toFixed(1)
            return (
                <div className="bg-popover border rounded-lg p-3 shadow-lg">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-base font-bold text-red-500" data-private="true">
                        {formatRupiah(item.value)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {item.count} transaksi • {persen}%
                    </p>
                    <p className="text-[10px] text-primary mt-2 font-medium">
                        Klik untuk lihat detail →
                    </p>
                </div>
            )
        }
        return null
    }

    return (
        <div ref={containerRef} className="w-full">
            {!isMounted ? (
                <div className="flex items-center justify-center h-[250px] bg-muted/20 rounded animate-pulse">
                    <span className="text-muted-foreground text-sm">Memuat chart...</span>
                </div>
            ) : (
                <>
                    <PieChart width={dimensions.width} height={dimensions.height}>
                        <Pie
                            data={chartData}
                            cx={dimensions.width / 2}
                            cy={125}
                            innerRadius={Math.min(dimensions.width * 0.15, 50)}
                            outerRadius={Math.min(dimensions.width * 0.25, 80)}
                            paddingAngle={2}
                            dataKey="value"
                            label={({ name, percent }) => {
                                const displayName = name || 'Lainnya'
                                return `${displayName.length > 8 ? displayName.substring(0, 6) + '...' : displayName} ${((percent || 0) * 100).toFixed(0)}%`
                            }}
                            labelLine={false}
                            onClick={(_, index) => handleClick(chartData[index].name)}
                            style={{ cursor: "pointer" }}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>

                    {/* Legend interaktif */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        {data.slice(0, 6).map((item, i) => (
                            <button
                                key={item.kategori}
                                onClick={() => handleClick(item.kategori)}
                                className="flex items-center justify-between p-1.5 rounded hover:bg-muted/50 transition-colors text-left"
                            >
                                <div className="flex items-center gap-2 truncate mr-2">
                                    <div
                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                    />
                                    <span className="text-muted-foreground truncate text-xs">{item.kategori}</span>
                                </div>
                                <span className="font-medium text-xs whitespace-nowrap" data-private="true">{formatRupiah(item.total)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Drill-down Dialog */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <button
                                        onClick={() => setDialogOpen(false)}
                                        className="hover:bg-muted p-1 rounded-full transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                    </button>
                                    Detail Pengeluaran: {selectedCategory}
                                </DialogTitle>
                            </DialogHeader>

                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-sm text-muted-foreground">Memuat detail...</p>
                                </div>
                            ) : detailData ? (
                                <div className="space-y-6">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-muted/30 border rounded-xl p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total</p>
                                            <p className="text-xl font-bold text-red-500" data-private="true">
                                                {formatRupiah(detailData.total)}
                                            </p>
                                        </div>
                                        <div className="bg-muted/30 border rounded-xl p-3">
                                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Transaksi</p>
                                            <p className="text-xl font-bold">{detailData.jumlahTransaksi}</p>
                                        </div>
                                    </div>

                                    {/* Weekly Trend Bar Chart */}
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                                            <Calendar className="w-3.5 h-3.5" />
                                            Trend Mingguan
                                        </p>
                                                                            <div className="h-[140px] w-full">
                                                                                <ResponsiveContainer width="100%" height="100%">
                                                                                    <BarChart data={detailData.weeklyBreakdown}>
                                                                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                                                                        <XAxis
                                                                                            dataKey="minggu"
                                                                                            tick={{ fontSize: 9 }}
                                                                                            axisLine={false}
                                                                                            tickLine={false}
                                                                                        />
                                                                                        <YAxis
                                                                                            tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}rb` : v}
                                                                                            tick={{ fontSize: 9 }}
                                                                                            width={35}
                                                                                            axisLine={false}
                                                                                            tickLine={false}
                                                                                        />
                                                                                        <Tooltip
                                                                                            formatter={(v) => formatRupiah(v as number)}
                                                                                            labelStyle={{ fontSize: '10px' }}
                                                                                            contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                                                                                        />
                                                                                        <Bar dataKey="nominal" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                                                                    </BarChart>
                                                                                </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Recent Transactions List */}
                                            <div className="space-y-3">
                                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daftar Transaksi</p>
                                                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {detailData.transaksi.length === 0 ? (
                                                        <p className="text-center py-4 text-sm text-muted-foreground">Tidak ada transaksi detail.</p>
                                                    ) : (
                                                        detailData.transaksi.map((tx: any) => (
                                                            <div key={tx.id} className="flex items-center justify-between p-2.5 bg-muted/20 border rounded-lg hover:bg-muted/40 transition-colors">
                                                                <div className="min-w-0 flex-1 mr-2">
                                                                    <p className="text-sm font-medium truncate">{tx.deskripsi}</p>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        {new Date(tx.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })} • {tx.akun}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm font-bold text-red-500 whitespace-nowrap" data-private="true">
                                                                    -{formatRupiah(tx.nominal)}
                                                                </p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground italic">
                                    Gagal memuat data detail.
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </>
            )}
        </div>
    )
}
