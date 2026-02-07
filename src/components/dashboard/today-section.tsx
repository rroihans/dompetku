"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp, 
  TrendingDown
} from "lucide-react";
import { formatRupiah } from "@/lib/format";
import Link from "next/link";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";
import { TodayTransactionCard } from "./today-transaction-card";

interface TodaySectionProps {
  todayData: {
    income: number;
    expense: number;
    net: number;
    transactionCount: number;
    transactions: any[]; // Using any for enriched transactions with account details
  };
  yesterdayData: {
    income: number;
    expense: number;
    net: number;
  };
  comparison: {
    incomeChange: number | null;
    expenseChange: number | null;
    netChange: number | null;
    hasYesterdayData: boolean;
  };
}

export function TodaySection({ todayData, yesterdayData, comparison }: TodaySectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const todayDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const netPositive = todayData.net >= 0;
  
  // Helper to render percentage badge
  const renderBadge = (change: number, inverse = false) => {
    // For expense: positive change (increase) is bad (red), negative change (decrease) is good (green)
    // For income/net: positive change is good (green), negative change is bad (red)
    const isGood = inverse ? change < 0 : change > 0;
    const colorClass = isGood ? "text-emerald-600 bg-emerald-100" : "text-red-600 bg-red-100";
    const arrow = change > 0 ? "↑" : "↓";
    
    return (
      <span className={cn("text-[10px] px-1 rounded font-medium", colorClass)}>
        {arrow} {Math.abs(change)}%
      </span>
    );
  };

  return (
    <Card 
      className={cn("border-l-4 shadow-sm", netPositive ? "border-l-emerald-500" : "border-l-red-500")}
      aria-label="Ringkasan transaksi hari ini"
    >
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Hari Ini</h3>
            <p className="text-xs text-muted-foreground">{todayDate}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Sembunyikan transaksi" : "Tampilkan transaksi"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {/* Summary Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Income */}
          <div className="bg-emerald-50/50 p-2 rounded-lg border border-emerald-100" aria-label="Pemasukan hari ini">
            <div className="flex justify-between items-start mb-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />
              <span aria-label="Perubahan pemasukan dibanding kemarin">
                {comparison.incomeChange !== null ? renderBadge(comparison.incomeChange) : <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Baru</span>}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Masuk</p>
            <p className="text-sm font-bold text-emerald-600 truncate" data-private="true">
              {formatRupiah(todayData.income)}
            </p>
          </div>

          {/* Expense */}
          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100" aria-label="Pengeluaran hari ini">
            <div className="flex justify-between items-start mb-1">
              <TrendingDown className="h-3 w-3 text-red-500" aria-hidden="true" />
              <span aria-label="Perubahan pengeluaran dibanding kemarin">
                {comparison.expenseChange !== null ? renderBadge(comparison.expenseChange, true) : <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Baru</span>}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Keluar</p>
            <p className="text-sm font-bold text-red-600 truncate" data-private="true">
              {formatRupiah(todayData.expense)}
            </p>
          </div>

          {/* Net */}
          <div className="bg-muted/50 p-2 rounded-lg border border-border" aria-label="Selisih bersih hari ini">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold">NET</span>
              <span aria-label="Perubahan selisih dibanding kemarin">
                {comparison.netChange !== null ? renderBadge(comparison.netChange) : <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">Baru</span>}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">Selisih</p>
            <p className={cn("text-sm font-bold truncate", todayData.net >= 0 ? "text-emerald-600" : "text-red-600")} data-private="true">
              {formatRupiah(todayData.net)}
            </p>
          </div>
        </div>

        {/* Transaction List */}
        {isExpanded && (
          <div className="space-y-3 animate-in slide-in-from-top-2 duration-200" role="region" aria-live="polite">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Transaksi ({todayData.transactionCount})
              </h4>
              {todayData.transactionCount > 3 && (
                <Link href="/transaksi" className="text-xs text-primary hover:underline">
                  Lihat Semua
                </Link>
              )}
            </div>

            {todayData.transactions.length === 0 ? (
              <EmptyState 
                icon={Calendar} 
                title="Belum ada transaksi" 
                description="Mulai hari ini dengan mencatat transaksi pertamamu."
              />
            ) : (
              <div className="space-y-2">
                {todayData.transactions.map((tx) => (
                  <Link key={tx.id} href="/transaksi">
                    <TodayTransactionCard transaction={tx} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
