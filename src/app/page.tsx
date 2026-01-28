"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import { getAkun } from "@/lib/db/accounts-repo";
import { getTransaksi } from "@/lib/db/transactions-repo";
import { getDashboardAnalytics, getSaldoTrend } from "@/lib/db/analytics-repo";
import { getDueRecurringTransactions, getUpcomingAdminFees } from "@/lib/db/recurring-repo";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
import { ExpensePieChart } from "@/components/charts/expense-pie-chart";
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart";
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart";
import { DrilldownPieChart } from "@/components/charts/drilldown-pie-chart";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AdminFeeReminder } from "@/components/charts/admin-fee-reminder";
import { BudgetBanner } from "@/components/dashboard/budget-banner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    accounts: any[];
    analytics: any;
    transactions: any[];
    saldoTrend: any[];
    upcomingFees: any[];
    recurringDue: any[];
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [
          accounts,
          analytics,
          transactionsResult,
          saldoTrendResult,
          recurringDue,
          upcomingFeesResult
        ] = await Promise.all([
          getAkun(),
          getDashboardAnalytics(),
          getTransaksi({ page: 1 }),
          getSaldoTrend(30),
          getDueRecurringTransactions(),
          getUpcomingAdminFees()
        ]);

        setData({
          accounts,
          analytics,
          transactions: transactionsResult.data,
          saldoTrend: saldoTrendResult.data,
          upcomingFees: upcomingFeesResult.data,
          recurringDue
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading || !data) {
    return <DashboardSkeleton />;
  }

  const { accounts, analytics, transactions, saldoTrend, upcomingFees } = data;

  return (
    <div className="space-y-6">
      {/* Header dengan Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan keuangan Anda bulan ini (PWA Offline).
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

      {/* Budget Banner */}
      <BudgetBanner />

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
      <div className="grid gap-4 md:grid-cols-1">
        {/* Line Chart: Trend Saldo 30 Hari */}
        <SaldoTrendChart data={saldoTrend} />
      </div>

      {/* Drill-down Pie Chart */}
      <DrilldownPieChart
        data={analytics.pengeluaranPerKategori as any}
        title="Pengeluaran per Kategori (Klik untuk Detail)"
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px] rounded-xl" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    </div>
  )
}