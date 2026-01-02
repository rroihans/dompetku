import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Target,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Copy
} from "lucide-react"
import { getBudgetWithRealization, getAvailableCategories, copyBudgetFromPreviousMonth } from "@/app/actions/anggaran"
import { formatRupiah } from "@/lib/format"
import { AddBudgetForm } from "@/components/forms/add-budget-form"
import { BudgetActions } from "@/components/anggaran/budget-actions"
import { BudgetChart } from "@/components/charts/budget-chart"
import Link from "next/link"
import { redirect } from "next/navigation"

const BULAN_LABEL = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

interface AnggaranPageProps {
    searchParams: Promise<{ bulan?: string; tahun?: string }>
}

export default async function AnggaranPage({ searchParams }: AnggaranPageProps) {
    const params = await searchParams
    const now = new Date()
    const bulan = params.bulan ? parseInt(params.bulan) : now.getMonth() + 1
    const tahun = params.tahun ? parseInt(params.tahun) : now.getFullYear()

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

    const [budgetResult, categoriesResult] = await Promise.all([
        getBudgetWithRealization(bulan, tahun),
        getAvailableCategories()
    ])

    const data = budgetResult.data
    const categories = categoriesResult.data || []

    // Hitung statistik
    const totalBudget = data.totalBudget
    const totalRealisasi = data.totalRealisasi
    const sisaTotal = totalBudget - totalRealisasi
    const persentaseTotal = totalBudget > 0 ? Math.round((totalRealisasi / totalBudget) * 100) : 0

    // Kategori yang melebihi budget
    const overBudget = data.budgets.filter((b: any) => b.persentase > 100)
    const nearLimit = data.budgets.filter((b: any) => b.persentase >= 80 && b.persentase <= 100)

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
                <div className="flex items-center gap-2">
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
                    <AddBudgetForm categories={categories} bulan={bulan} tahun={tahun} />
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
                            {data.budgets.length} kategori
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
                        <div className="text-2xl font-bold" data-private="true">{formatRupiah(totalRealisasi)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {persentaseTotal}% dari anggaran
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
                            {sisaTotal >= 0 ? "Masih dalam batas" : "Melebihi anggaran!"}
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
                        <p className="text-xs text-muted-foreground mt-1">
                            {overBudget.length} melebihi, {nearLimit.length} hampir limit
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar Total */}
            {totalBudget > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span>Progress Keseluruhan</span>
                            <span className={persentaseTotal > 100 ? 'text-red-500' : ''}>
                                {persentaseTotal}%
                            </span>
                        </div>
                        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${persentaseTotal > 100 ? 'bg-red-500' : persentaseTotal > 80 ? 'bg-amber-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(persentaseTotal, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budget Chart Visualization */}
            {data.budgets.length > 0 && (
                <BudgetChart
                    budgets={data.budgets}
                    unbudgeted={data.unbudgeted}
                    totalBudget={totalBudget}
                    totalRealisasi={totalRealisasi}
                />
            )}

            {/* Daftar Budget */}
            {data.budgets.length > 0 ? (
                <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">Detail per Kategori</h3>
                    {data.budgets.map((budget: any) => {
                        const isOver = budget.persentase > 100
                        const isNear = budget.persentase >= 80 && budget.persentase <= 100

                        return (
                            <Card key={budget.id} className={`border-l-4 ${isOver ? 'border-l-red-500' : isNear ? 'border-l-amber-500' : 'border-l-primary'
                                }`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {budget.kategori}
                                                {isOver && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                {isNear && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                            </h4>
                                            <p className="text-sm text-muted-foreground">
                                                Anggaran: <span data-private="true">{formatRupiah(budget.nominal)}</span>
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right">
                                                <p className={`font-bold ${isOver ? 'text-red-500' : ''}`} data-private="true">
                                                    {formatRupiah(budget.realisasi)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {budget.persentase}% terpakai
                                                </p>
                                            </div>
                                            <BudgetActions budget={budget} />
                                        </div>
                                    </div>
                                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${isOver ? 'bg-red-500' : isNear ? 'bg-amber-500' : 'bg-primary'
                                                }`}
                                            style={{ width: `${Math.min(budget.persentase, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <div className="flex flex-col">
                                            <span>
                                                Sisa: <span className={budget.sisa < 0 ? 'text-red-500 font-medium' : ''} data-private="true">
                                                    {formatRupiah(budget.sisa)}
                                                </span>
                                            </span>
                                            {budget.sisa > 0 && (data.sisaHari ?? 0) > 0 && (
                                                <span className="text-[10px] italic">
                                                    Saran harian: <span data-private="true">{formatRupiah(budget.saranHarian)}</span>
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            {(data.sisaHari ?? 0) > 0 ? (
                                                <span>{data.sisaHari} hari lagi</span>
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
                        <div className="flex gap-2">
                            <AddBudgetForm categories={categories} bulan={bulan} tahun={tahun} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Pengeluaran tanpa budget */}
            {data.unbudgeted.length > 0 && (
                <div className="grid gap-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Pengeluaran Tanpa Anggaran
                    </h3>
                    <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {data.unbudgeted.map((item: any) => (
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
