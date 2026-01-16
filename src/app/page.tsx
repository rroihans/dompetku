import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
  ArrowRight,
  Target,
  RefreshCw,
  Settings,
} from "lucide-react"
import { getAkun } from "@/app/actions/akun"
import { getTransaksi } from "@/app/actions/transaksi"
import { getDashboardAnalytics, getSaldoTrend, getMonthlyComparison, getAccountComposition, getEnhancedStats } from "@/app/actions/analytics"
import { getCicilanStats } from "@/app/actions/cicilan"
import { getUpcomingAdminFees } from "@/app/actions/recurring-admin"
import { getNetWorthChange, getNetWorthHistory, saveNetWorthSnapshot } from "@/app/actions/networth"
import { runSystemAlertChecks } from "@/app/actions/notifications"
import { seedInitialData, seedInstallmentTemplates } from "@/app/actions/seed"
import { pruneOldLogs } from "@/app/actions/debug"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { ExpensePieChart } from "@/components/charts/expense-pie-chart"
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart"
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart"
import { MonthlyComparisonChart } from "@/components/charts/monthly-comparison-chart"
import { AssetCompositionChart } from "@/components/charts/asset-composition-chart"
import { DrilldownPieChart } from "@/components/charts/drilldown-pie-chart"
import { NetWorthChart } from "@/components/charts/net-worth-chart"
import { AdminFeeReminder } from "@/components/charts/admin-fee-reminder"

export default async function Dashboard() {
  // Auto-prune logs > 30 hari
  await pruneOldLogs(30)

  // Run system notifications checks
  await runSystemAlertChecks()

  // Auto-seed installment templates if not exists
  await seedInstallmentTemplates()

  let accounts = await getAkun()
  if (accounts.length === 0) {
    await seedInitialData()
    accounts = await getAkun()
  }

  // Ambil data analytics (parallel fetch untuk performa)
  const [
    analytics,
    transactionsResult,
    cicilanStats,
    upcomingFeesResult,
    saldoTrendResult,
    monthlyComparisonResult,
    assetCompositionResult,
    enhancedStatsResult,
    netWorthResult,
    netWorthHistoryResult
  ] = await Promise.all([
    getDashboardAnalytics(),
    getTransaksi(),
    getCicilanStats(),
    getUpcomingAdminFees(),
    getSaldoTrend(30),
    getMonthlyComparison(),
    getAccountComposition(),
    getEnhancedStats(),
    getNetWorthChange(),
    getNetWorthHistory(30)
  ])
  const transactions = transactionsResult.data
  const upcomingFees = upcomingFeesResult.data || []
  const saldoTrend = saldoTrendResult.data || []
  const monthlyComparison = monthlyComparisonResult.data || []
  const assetComposition = assetCompositionResult.data || []
  const assetTotal = assetCompositionResult.total || 0
  const enhancedStats = enhancedStatsResult.data
  const netWorth = netWorthResult.data
  const netWorthHistory = netWorthHistoryResult.data || []

  // Save snapshot jika belum ada hari ini (simple implementation)
  if (netWorthHistory.length === 0) {
    await saveNetWorthSnapshot()
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan keuangan Anda bulan ini.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transaksi">
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Transaksi
            </Button>
          </Link>
          <Link href="/laporan">
            <Button className="gap-2">
              <BarChart3 className="w-4 h-4" /> Laporan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/akun">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-private="true">{formatRupiah(analytics.totalSaldo)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {accounts.length} akun terdaftar
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/transaksi?tipe=MASUK">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500" data-private="true">
                +{formatRupiah(analytics.pemasukanBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total pemasukan
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/transaksi?tipe=KELUAR">
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500" data-private="true">
                -{formatRupiah(analytics.pengeluaranBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total pengeluaran
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/anggaran">
          <Card className={`border-l-4 hover:shadow-md transition-all hover:scale-[1.02] ${analytics.selisihBulanIni >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selisih Bulan Ini</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.selisihBulanIni >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                {analytics.selisihBulanIni >= 0 ? '+' : ''}{formatRupiah(analytics.selisihBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cek anggaran →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* NEW: Admin Fee Reminder */}
      <AdminFeeReminder fees={upcomingFees} />

      {/* Alert jika ada cicilan */}
      {cicilanStats.data.jumlahCicilanAktif > 0 && (
        <Link href="/cicilan" className="block mb-4">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Cicilan Aktif: {cicilanStats.data.jumlahCicilanAktif}</p>
                  <p className="text-sm text-muted-foreground">
                    Tagihan bulan ini: <span data-private="true">{formatRupiah(cicilanStats.data.tagihanBulanIni)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Hutang</p>
                <p className="font-bold text-amber-600" data-private="true">{formatRupiah(cicilanStats.data.totalHutang)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </div>
            <Link href="/anggaran">
              <Button variant="ghost" size="sm" className="text-xs">
                Atur Anggaran →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ExpensePieChart data={analytics.pengeluaranPerKategori} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>Trend 6 Bulan Terakhir</CardTitle>
            </div>
            <Link href="/laporan">
              <Button variant="ghost" size="sm" className="text-xs">
                Detail Laporan →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={analytics.trendBulanan} />
          </CardContent>
        </Card>
      </div>

      {/* NEW: Enhanced Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Line Chart: Trend Saldo 30 Hari */}
        <SaldoTrendChart data={saldoTrend} />

        {/* Bar Chart: Bulan Ini vs Bulan Lalu */}
        <MonthlyComparisonChart data={monthlyComparison as any} />

        {/* Donut Chart: Komposisi Aset */}
        <AssetCompositionChart data={assetComposition as any} total={assetTotal} />
      </div>

      {/* Drill-down Pie Chart */}
      <DrilldownPieChart
        data={analytics.pengeluaranPerKategori as any}
        title="Pengeluaran per Kategori (Klik untuk Detail)"
      />

      {/* Net Worth Chart */}
      <NetWorthChart
        data={netWorthHistory}
        currentNetWorth={netWorth.current}
        change={netWorth.change}
        changePercent={netWorth.changePercent}
        totalAset={netWorth.totalAset}
        totalHutang={netWorth.totalHutang}
        totalCicilan={netWorth.totalCicilan}
      />

      {/* Bottom Row - Accounts & Recent Transactions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aset & Akun</CardTitle>
            <Link href="/akun">
              <Button variant="ghost" size="sm">Kelola Semua →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {accounts.length === 0 ? (
                <Link href="/akun">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Wallet className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada akun.</p>
                    <p className="text-sm text-primary underline">Klik untuk menambahkan</p>
                  </div>
                </Link>
              ) : (
                accounts.slice(0, 4).map((akun: any) => (
                  <Link key={akun.id} href="/akun">
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: akun.warna ? `${akun.warna}20` : 'hsl(var(--primary) / 0.1)' }}
                        >
                          <Wallet className="w-4 h-4" style={{ color: akun.warna || 'hsl(var(--primary))' }} />
                        </div>
                        <div>
                          <div className="font-semibold">{akun.nama}</div>
                          <div className="text-xs text-muted-foreground uppercase">{akun.tipe.replace("_", " ")}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${akun.saldoSekarang < 0 ? 'text-red-500' : ''}`} data-private="true">
                          {formatRupiah(akun.saldoSekarang)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaksi Terkini</CardTitle>
            <Link href="/transaksi">
              <Button variant="ghost" size="sm">Semua →</Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <Link href="/transaksi">
                  <div className="text-center py-8 border-2 border-dashed rounded-lg hover:bg-muted/50 transition-colors">
                    <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Belum ada transaksi.</p>
                    <p className="text-sm text-primary underline">Klik untuk menambahkan</p>
                  </div>
                </Link>
              ) : (
                transactions.slice(0, 5).map((tx: any) => {
                  const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe)

                  return (
                    <Link key={tx.id} href="/transaksi">
                      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div>
                          <div className="text-sm font-medium">{tx.deskripsi}</div>
                          <div className="text-xs text-muted-foreground">
                            {tx.tanggal.toLocaleDateString('id-ID')} • {tx.kategori}
                          </div>
                        </div>
                        <div className={`font-bold ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
                          {isExpense ? '-' : '+'}{formatRupiah(tx.nominal)}
                        </div>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links Footer */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/recurring" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <RefreshCw className="w-4 h-4" /> Transaksi Berulang
            </Link>
            <Link href="/cicilan" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <CreditCard className="w-4 h-4" /> Cicilan
            </Link>
            <Link href="/anggaran" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Target className="w-4 h-4" /> Anggaran
            </Link>
            <Link href="/pengaturan" className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors">
              <Settings className="w-4 h-4" /> Pengaturan
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
