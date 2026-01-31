"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Target,
  Plus,
  RefreshCw,
  CreditCard,
  Settings,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar as CalendarIcon,
  Tag
} from "lucide-react";
import { getAkun } from "@/lib/db/accounts-repo";
import { getTransaksi } from "@/lib/db/transactions-repo";
import { getDashboardAnalytics, getSaldoTrend } from "@/lib/db/analytics-repo";
import { getDueRecurringTransactions, getUpcomingAdminFees } from "@/lib/db/recurring-repo";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
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

  const { accounts, analytics, transactions } = data;

  return (
    <div className="space-y-4 pb-20">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Ringkasan keuangan (PWA Offline).
          </p>
        </div>
        {/* Actions - hidden on mobile if FAB covers it, but good to have */}
        <div className="hidden sm:flex gap-2">
           <Link href="/transaksi">
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> Transaksi
            </Button>
          </Link>
        </div>
      </div>

      {/* Budget Banner */}
      <BudgetBanner />

      {/* Summary Cards - Grid 2x2 on mobile for compactness */}
      <div className="grid grid-cols-2 gap-3">
        {/* Total Saldo - Full Width on Mobile if needed, or keeping 2 cols */}
        <Link href="/akun" className="col-span-2">
          <Card className="border-l-4 border-l-primary shadow-sm">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Saldo</p>
                <div className="text-2xl font-bold mt-1" data-private="true">{formatRupiah(analytics.totalSaldo)}</div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                  {accounts.length} akun <ArrowRight className="w-3 h-3" />
                </p>
              </div>
              <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/transaksi?tipe=MASUK">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm h-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Pemasukan</p>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-lg font-bold text-emerald-500 truncate" data-private="true">
                +{formatRupiah(analytics.pemasukanBulanIni)}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/transaksi?tipe=KELUAR">
          <Card className="border-l-4 border-l-red-500 shadow-sm h-full">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Pengeluaran</p>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <div className="text-lg font-bold text-red-500 truncate" data-private="true">
                -{formatRupiah(analytics.pengeluaranBulanIni)}
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Selisih - Full Width or keep 2 cols depending on layout pref. Let's make it full width for emphasis */}
        <Link href="/anggaran" className="col-span-2">
          <Card className={`border-l-4 shadow-sm ${analytics.selisihBulanIni >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <CardContent className="p-3 flex items-center justify-between">
               <div>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase">Cash Flow Bulan Ini</p>
                  <div className={`text-xl font-bold mt-1 ${analytics.selisihBulanIni >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                    {analytics.selisihBulanIni >= 0 ? '+' : ''}{formatRupiah(analytics.selisihBulanIni)}
                  </div>
               </div>
               <Target className={`h-5 w-5 ${analytics.selisihBulanIni >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Transactions List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Transaksi Terkini</h3>
          <Link href="/transaksi" className="text-xs text-primary font-medium hover:underline">
            Lihat Semua
          </Link>
        </div>

        <Card className="shadow-sm border-none sm:border">
          <CardContent className="p-0">
             <div className="divide-y">
              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
                </div>
              ) : (
                transactions.slice(0, 5).map((tx: any) => {
                  const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe)

                  return (
                    <Link key={tx.id} href="/transaksi">
                      <div className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors active:bg-muted/80">
                        <div className="flex items-center gap-3 overflow-hidden">
                           <div className={`p-2 rounded-full shrink-0 ${isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                           </div>
                           <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{tx.deskripsi}</div>
                              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {tx.tanggal.toLocaleDateString('id-ID')} • {tx.kategori}
                              </div>
                           </div>
                        </div>
                        <div className={`text-sm font-bold whitespace-nowrap pl-2 ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
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

      {/* Quick Links Grid (Mobile Friendly) */}
      <div className="grid grid-cols-4 gap-2 pt-2">
          <Link href="/recurring" className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg hover:bg-muted active:scale-95 transition-all">
             <RefreshCw className="w-5 h-5 text-muted-foreground" />
             <span className="text-[10px] text-center font-medium">Berulang</span>
          </Link>
          <Link href="/cicilan" className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg hover:bg-muted active:scale-95 transition-all">
             <CreditCard className="w-5 h-5 text-muted-foreground" />
             <span className="text-[10px] text-center font-medium">Cicilan</span>
          </Link>
          <Link href="/anggaran" className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg hover:bg-muted active:scale-95 transition-all">
             <Target className="w-5 h-5 text-muted-foreground" />
             <span className="text-[10px] text-center font-medium">Anggaran</span>
          </Link>
          <Link href="/pengaturan" className="flex flex-col items-center gap-1 p-2 bg-muted/30 rounded-lg hover:bg-muted active:scale-95 transition-all">
             <Settings className="w-5 h-5 text-muted-foreground" />
             <span className="text-[10px] text-center font-medium">Setting</span>
          </Link>
      </div>

    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 col-span-2 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-16 col-span-2 rounded-xl" />
      </div>
      <div className="space-y-2">
         <Skeleton className="h-4 w-24" />
         <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )
}
