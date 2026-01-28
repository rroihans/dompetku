"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    ArrowLeft,
    ArrowRight,
    Wallet,
    Target,
    ArrowUpRight
} from "lucide-react"
import { getRingkasanBulanan, getAvailableMonths } from "@/lib/db/reports-repo"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function LaporanPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Memuat laporan...</div>}>
            <LaporanContent />
        </Suspense>
    )
}

function LaporanContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    // Default to current month/year if not provided
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const bulan = Number(searchParams.get("bulan")) || currentMonth
    const tahun = Number(searchParams.get("tahun")) || currentYear

    const [ringkasan, setRingkasan] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await getRingkasanBulanan(bulan, tahun)
                setRingkasan(data)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [bulan, tahun])

    // Calculate prev/next month
    const prevMonth = bulan === 1 ? 12 : bulan - 1
    const prevYear = bulan === 1 ? tahun - 1 : tahun
    const nextMonth = bulan === 12 ? 1 : bulan + 1
    const nextYear = bulan === 12 ? tahun + 1 : tahun

    const isCurrentMonth = bulan === currentMonth && tahun === currentYear

    if (loading || !ringkasan) {
        return <div className="p-8 text-center">Memuat data laporan...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Laporan Bulanan</h2>
                    <p className="text-muted-foreground">
                        Ringkasan keuangan Anda untuk {ringkasan.bulanNama} {ringkasan.tahun}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/laporan?bulan=${prevMonth}&tahun=${prevYear}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="px-4 py-2 bg-secondary rounded-lg font-medium">
                        {ringkasan.bulanNama} {ringkasan.tahun}
                    </div>
                    {!isCurrentMonth && (
                        <Link href={`/laporan?bulan=${nextMonth}&tahun=${nextYear}`}>
                            <Button variant="outline" size="icon">
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500" data-private="true">
                            +{formatRupiah(ringkasan.totalPemasukan)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500" data-private="true">
                            -{formatRupiah(ringkasan.totalPengeluaran)}
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${ringkasan.selisih >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Selisih</CardTitle>
                        <Wallet className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${ringkasan.selisih >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                            {ringkasan.selisih >= 0 ? '+' : ''}{formatRupiah(ringkasan.selisih)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">
                            {formatRupiah(ringkasan.rataRataHarian)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {ringkasan.jumlahTransaksi} transaksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Pengeluaran per Kategori */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <TrendingDown className="w-5 h-5" />
                            Pengeluaran per Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ringkasan.pengeluaranPerKategori.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Tidak ada pengeluaran
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {ringkasan.pengeluaranPerKategori.map((item: any) => (
                                    <div key={item.kategori}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.kategori}</span>
                                            <span className="text-sm font-bold" data-private="true">{formatRupiah(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.persentase.toFixed(1)}% dari total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pemasukan per Kategori */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                            Pemasukan per Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ringkasan.pemasukanPerKategori.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Tidak ada pemasukan
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {ringkasan.pemasukanPerKategori.map((item: any) => (
                                    <div key={item.kategori}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.kategori}</span>
                                            <span className="text-sm font-bold" data-private="true">{formatRupiah(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.persentase.toFixed(1)}% dari total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Transaksi Terbesar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Top 5 Pengeluaran Terbesar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {ringkasan.transaksiTerbesar.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            Tidak ada pengeluaran besar
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {ringkasan.transaksiTerbesar.map((tx: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium">{tx.deskripsi}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {tx.kategori} • {tx.tanggal.toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-red-500" data-private="true">
                                        -{formatRupiah(tx.nominal)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-muted/30">
                <CardContent className="py-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href={`/anggaran?bulan=${bulan}&tahun=${tahun}`}>
                            <Button variant="outline" className="gap-2">
                                <Target className="w-4 h-4" />
                                Lihat Anggaran Bulan Ini
                            </Button>
                        </Link>
                        <Link href="/transaksi">
                            <Button variant="outline" className="gap-2">
                                <ArrowUpRight className="w-4 h-4" />
                                Lihat Semua Transaksi
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
