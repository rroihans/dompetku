"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Target,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Copy,
    RefreshCw
} from "lucide-react"
import { getBudgetWithRealization, getAvailableCategories, copyBudgetFromPreviousMonth } from "@/lib/db/budget-repo"
import { formatRupiah } from "@/lib/format"
import { AddBudgetForm } from "@/components/forms/add-budget-form"
import { BudgetActions } from "@/components/anggaran/budget-actions"
import { BudgetChart } from "@/components/charts/budget-chart"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { toast } from "sonner"

const BULAN_LABEL = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

export default function AnggaranPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Memuat anggaran...</div>}>
            <AnggaranContent />
        </Suspense>
    )
}

function AnggaranContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Validasi parameter bulan/tahun
    const paramBulan = searchParams.get("bulan") ? parseInt(searchParams.get("bulan")!) : currentMonth
    const paramTahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : currentYear

    const bulan = isNaN(paramBulan) ? currentMonth : paramBulan
    const tahun = isNaN(paramTahun) ? currentYear : paramTahun

    const [data, setData] = useState<any>(null)
    const [categories, setCategories] = useState<string[]>([])
    const [loading, setLoading] = useState(true)
    const [copying, setCopying] = useState(false)

    async function loadData() {
        setLoading(true)
        try {
            const [budgetResult, categoriesResult] = await Promise.all([
                getBudgetWithRealization(bulan, tahun),
                getAvailableCategories()
            ])

            if (budgetResult.success) {
                setData(budgetResult.data)
            }
            if (categoriesResult.success) {
                setCategories(categoriesResult.data || [])
            }
        } catch (error) {
            console.error(error)
            toast.error("Gagal memuat anggaran")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [bulan, tahun])

    async function handleCopyBudget() {
        setCopying(true)
        try {
            const res = await copyBudgetFromPreviousMonth(bulan, tahun)
            if (res.success) {
                toast.success(`Berhasil menyalin ${res.copied} kategori anggaran`)
                loadData()
            } else {
                toast.error(res.error || "Gagal menyalin anggaran")
            }
        } catch (error: any) {
            toast.error(error.message || "Terjadi kesalahan")
        } finally {
            setCopying(false)
        }
    }

    const handleRefresh = () => {
        loadData()
    }

    // Hitung bulan sebelum dan sesudah
    let prevBulan = bulan - 1
    let prevTahun = tahun
    if (prevBulan < 1) {
        prevBulan = 12
        prevTahun = tahun - 1
    }

    let nextBulan = bulan + 1
    let nextTahun = tahun
    if (nextBulan > 12) {
        nextBulan = 1
        nextTahun = tahun + 1
    }

    if (loading && !data) {
        return <div className="p-8 text-center">Memuat anggaran...</div>
    }

    // Default safe objects if data is null
    const safeData = data || {
        budgets: [],
        unbudgeted: [],
        totalBudget: 0,
        totalRealisasi: 0,
        totalProyeksi: 0,
        sisaHari: 0
    }

    // Hitung statistik
    const totalBudget = safeData.totalBudget
    const totalRealisasi = safeData.totalRealisasi
    const totalProyeksi = safeData.totalProyeksi || 0
    const totalPrediksi = totalRealisasi + totalProyeksi
    const sisaTotal = totalBudget - totalPrediksi
    const persentaseTotal = totalBudget > 0 ? Math.round((totalRealisasi / totalBudget) * 100) : 0
    const persentasePrediksiTotal = totalBudget > 0 ? Math.round((totalPrediksi / totalBudget) * 100) : 0

    // Kategori yang melebihi budget (berdasarkan prediksi total)
    const overBudget = safeData.budgets.filter((b: any) => (b.persentaseProyeksi || 0) > 100)
    const nearLimit = safeData.budgets.filter((b: any) => (b.persentaseProyeksi || 0) >= 80 && (b.persentaseProyeksi || 0) <= 100)

    return (
        <div className="space-y-6">
            {/* Header dengan navigasi bulan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Anggaran Bulanan</h2>
                    <p className="text-muted-foreground">
                        Kontrol pengeluaran dengan batas anggaran per kategori.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/anggaran?bulan=${prevBulan}&tahun=${prevTahun}`}>
                        <Button variant="outline" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="px-4 py-2 bg-muted rounded-md font-medium min-w-[150px] text-center">
                        {BULAN_LABEL[bulan - 1]} {tahun}
                    </div>
                    <Link href={`/anggaran?bulan=${nextBulan}&tahun=${nextTahun}`}>
                        <Button variant="outline" size="icon">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <AddBudgetForm
                        categories={categories}
                        bulan={bulan}
                        tahun={tahun}
                        onRefresh={handleRefresh}
                    />
                </div>
            </div>

            {/* Statistik Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Total Anggaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">{formatRupiah(totalBudget)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {safeData.budgets.length} kategori
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-destructive" />
                            Total Realisasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive" data-private="true">{formatRupiah(totalRealisasi)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            {persentaseTotal}% terpakai
                            {totalProyeksi > 0 && (
                                <span className="text-amber-500">
                                    (+{Math.round((totalProyeksi / totalBudget) * 100)}% terjadwal)
                                </span>
                            )}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {sisaTotal >= 0 ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            Sisa Anggaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${sisaTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                            {formatRupiah(sisaTotal)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {sisaTotal >= 0 ? "Masih dalam batas aman" : "Diprediksi akan melebihi!"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Peringatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overBudget.length + nearLimit.length}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-amber-600 font-medium">
                            {overBudget.length} melebihi, {nearLimit.length} mendekati
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar Total */}
            {totalBudget > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-primary rounded-sm"></span> Realisasi ({persentaseTotal}%)</span>
                                {totalProyeksi > 0 && (
                                    <span className="flex items-center gap-1 text-muted-foreground"><span className="w-3 h-3 bg-amber-500/30 rounded-sm"></span> Terjadwal ({persentasePrediksiTotal - persentaseTotal}%)</span>
                                )}
                            </div>
                            <span className={persentasePrediksiTotal > 100 ? 'text-red-500 font-bold' : ''}>
                                {persentasePrediksiTotal}% Total
                            </span>
                        </div>
                        <div className="w-full bg-secondary h-4 rounded-full overflow-hidden relative">
                            {/* Layer 1: Projected (wider) */}
                            {totalProyeksi > 0 && (
                                <div
                                    className="h-full absolute left-0 top-0 bg-amber-500/30 transition-all duration-1000"
                                    style={{ width: `${Math.min(persentasePrediksiTotal, 100)}%`, zIndex: 1 }}
                                />
                            )}
                            {/* Layer 2: Actual (solid) */}
                            <div
                                className={`h-full absolute left-0 top-0 transition-all duration-500 z-10 ${persentaseTotal > 100 ? 'bg-red-500' : persentaseTotal > 80 ? 'bg-amber-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(persentaseTotal, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budget Chart Visualization */}
            {safeData.budgets.length > 0 && (
                <BudgetChart
                    budgets={safeData.budgets}
                    unbudgeted={safeData.unbudgeted}
                    totalBudget={totalBudget}
                    totalRealisasi={totalRealisasi}
                />
            )}

            {/* Daftar Budget */}
            {safeData.budgets.length > 0 ? (
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Detail per Kategori</h3>
                    </div>

                    {safeData.budgets.map((budget: any) => {
                        const isOver = (budget.persentaseProyeksi || 0) > 100
                        const isNear = (budget.persentaseProyeksi || 0) >= 80 && (budget.persentaseProyeksi || 0) <= 100
                        const realOver = (budget.persentase || 0) > 100

                        return (
                            <Card key={budget.id} className={`border-l-4 ${realOver ? 'border-l-red-600' : isOver ? 'border-l-red-400' : isNear ? 'border-l-amber-500' : 'border-l-primary'
                                }`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {budget.kategori}
                                                {isOver && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                {isNear && !isOver && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Anggaran: <span data-private="true">{formatRupiah(budget.nominal)}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    {(budget.proyeksi || 0) > 0 && (
                                                        <span className="text-[10px] text-amber-600 font-medium" data-private="true">
                                                            +{formatRupiah(budget.proyeksi)}
                                                        </span>
                                                    )}
                                                    <p className={`font-bold ${realOver ? 'text-red-500' : ''}`} data-private="true">
                                                        {formatRupiah(budget.realisasi)}
                                                    </p>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {budget.persentaseProyeksi || 0}% (inc. terjadwal)
                                                </p>
                                            </div>
                                            <BudgetActions budget={budget} onRefresh={handleRefresh} />
                                        </div>
                                    </div>

                                    <div className="w-full bg-secondary h-3 rounded-full overflow-hidden relative">
                                        {/* Proyeksi Layer */}
                                        {(budget.proyeksi || 0) > 0 && (
                                            <div
                                                className="h-full absolute left-0 top-0 bg-amber-500/30 transition-all duration-1000"
                                                style={{ width: `${Math.min(budget.persentaseProyeksi || 0, 100)}%`, zIndex: 1 }}
                                            />
                                        )}
                                        {/* Realisasi Layer */}
                                        <div
                                            className={`h-full absolute left-0 top-0 transition-all duration-500 z-10 ${realOver ? 'bg-red-500' : (budget.persentase || 0) > 80 ? 'bg-amber-500' : 'bg-primary'
                                                }`}
                                            style={{ width: `${Math.min(budget.persentase || 0, 100)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <div className="flex flex-col">
                                            <span>
                                                Sisa: <span className={budget.sisa < 0 ? 'text-red-500 font-medium' : ''} data-private="true">
                                                    {formatRupiah(budget.sisa)}
                                                </span>
                                            </span>
                                            {budget.sisa > 0 && (safeData.sisaHari ?? 0) > 0 && (
                                                <span className="text-[10px] italic">
                                                    Saran harian: <span data-private="true">{formatRupiah(budget.saranHarian)}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {(safeData.sisaHari ?? 0) > 0 ? (
                                                <span>{safeData.sisaHari} hari lagi</span>
                                            ) : (
                                                <span>Bulan berakhir</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Target className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Anggaran</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Buat anggaran untuk mengontrol pengeluaran bulanan Anda per kategori.
                        </p>
                        <div className="flex flex-col gap-2 w-full max-w-xs items-center">
                            <AddBudgetForm
                                categories={categories}
                                bulan={bulan}
                                tahun={tahun}
                                onRefresh={handleRefresh}
                            />

                            <Button
                                variant="outline"
                                className="w-full gap-2 mt-2"
                                onClick={handleCopyBudget}
                                disabled={copying}
                            >
                                {copying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                                Salin dari Bulan Lalu
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pengeluaran tanpa budget */}
            {safeData.unbudgeted.length > 0 && (
                <div className="grid gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Pengeluaran Tanpa Anggaran
                    </h3>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {safeData.unbudgeted.map((item: any) => (
                            <Card key={item.kategori} className="border-l-4 border-l-amber-500">
                                <CardContent className="pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{item.kategori}</p>
                                        <p className="text-xs text-muted-foreground">Tanpa batas anggaran</p>
                                    </div>
                                    <p className="font-bold text-amber-600" data-private="true">{formatRupiah(item.realisasi)}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
