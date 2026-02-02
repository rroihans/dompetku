"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
import { ArrowRight, PieChart, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonthlyOverviewProps {
  monthlyData: {
    income: number;
    expense: number;
    net: number;
    categories: Array<{
      kategori: string;
      total: number;
      jumlah: number;
      fill: string;
    }>;
  };
}

export function MonthlyOverview({ monthlyData }: MonthlyOverviewProps) {
  const { income, expense, net, categories } = monthlyData;

  // Calculate percentages for categories
  const totalCategoryExpense = categories.reduce((sum, cat) => sum + cat.total, 0);

  return (
    <div className="space-y-3" aria-label="Ringkasan keuangan bulan ini">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Ringkasan Bulan Ini
        </h3>
        <Link href="/laporan" className="text-xs text-primary font-medium hover:underline">
          Lihat Laporan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Cash Flow Card */}
        <Card className="shadow-sm" aria-label="Arus kas bulan ini">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Arus Kas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pemasukan</span>
              <span className="text-sm font-semibold text-emerald-600" data-private="true">
                {formatRupiah(income)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Pengeluaran</span>
              <span className="text-sm font-semibold text-red-600" data-private="true">
                {formatRupiah(expense)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between items-center">
              <span className="text-xs font-medium">Selisih</span>
              <span 
                className={cn("text-sm font-bold", net >= 0 ? "text-emerald-600" : "text-red-600")} 
                data-private="true"
              >
                {net >= 0 ? "+" : ""}{formatRupiah(net)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Top Categories Card */}
        <Card className="shadow-sm" aria-label="Kategori pengeluaran teratas">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Top Pengeluaran
              </div>
              <Link href="/kategori" className="text-xs text-muted-foreground hover:text-primary" aria-label="Lihat semua kategori">
                <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            {categories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Belum ada data pengeluaran.</p>
            ) : (
              categories.slice(0, 3).map((cat, idx) => {
                const percentage = totalCategoryExpense > 0 ? Math.round((cat.total / totalCategoryExpense) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{cat.kategori}</span>
                      <span className="font-medium text-muted-foreground" data-private="true">
                        {formatRupiah(cat.total)}
                      </span>
                    </div>
                    <div 
                      className="h-1.5 w-full bg-secondary rounded-full overflow-hidden"
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${cat.kategori}: ${percentage}% dari total pengeluaran`}
                    >
                      <div 
                        className="h-full bg-primary/70 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
