"use client";

import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { formatRupiah } from "@/lib/format";
import { Money } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";
import { MappedTransaksi } from "@/types/transaksi";

/**
 * TodayTransactionCard - A compact 3-row stacked layout component for displaying transactions.
 * 
 * ## Layout Structure:
 * - **Row 1**: Icon + Description (full width, wraps to 2 lines max using `line-clamp-2`)
 * - **Row 2**: Category badge + Account name (separated by bullet point)
 * - **Row 3**: Amount (right-aligned, color-coded by transaction type)
 * 
 * ## Key Features:
 * - Uses `DynamicIcon` component for dynamic category icons based on category name
 * - Applies `data-private="true"` attribute to amount for privacy mode blur support
 * - Uses theme colors for consistent light/dark mode support
 * - Color-codes amounts: green (`text-emerald-500`) for income, red (`text-red-500`) for expense
 * - Uses `line-clamp-2` on description to prevent excessively long text from breaking layout
 * - Account name uses `truncate` class to prevent overflow while preserving layout
 */

interface TodayTransactionCardProps {
  transaction: MappedTransaksi;
  onClick?: () => void;
}

export function TodayTransactionCard({ transaction, onClick }: TodayTransactionCardProps) {
  const tx = transaction;
  
  // Determine if this is an expense transaction
  // Expense: debit account is EXPENSE type (pengeluaran dari aset)
  // Income: credit account is INCOME type (pemasukan ke aset)
  // Transfer: tidak mengubah total aset (BANK->E_WALLET, dll) - tidak ditampilkan sebagai expense/income
  const isExpense = tx.debitAkun?.tipe === "EXPENSE";
  const isIncome = tx.kreditAkun?.tipe === "INCOME";
  
  // Determine account name to display
  // For expense: show the asset account that was debited (kreditAkun)
  // For income: show the asset account that was credited (debitAkun)
  // For transfer: show both accounts
  const accountName = isExpense 
    ? tx.kreditAkun?.nama || "Akun tidak diketahui"
    : isIncome 
    ? tx.debitAkun?.nama || "Akun tidak diketahui"
    : `${tx.kreditAkun?.nama || '?'} → ${tx.debitAkun?.nama || '?'}`;
  
  // Map common category names to icon names
  const getCategoryIcon = (kategori: string): string | undefined => {
    const iconMap: Record<string, string> = {
      "Gaji": "Briefcase",
      "Makan": "Utensils",
      "Makanan": "Utensils",
      "Transport": "Car",
      "Transportasi": "Car",
      "Belanja": "ShoppingBag",
      "Hiburan": "Gamepad2",
      "Kesehatan": "Heart",
      "Pendidikan": "GraduationCap",
      "Tagihan": "Receipt",
      "Utilitas": "Zap",
      "Investasi": "TrendingUp",
      "Asuransi": "Shield",
      "Bonus": "Gift",
      "Hadiah": "Gift",
      "Lainnya": "MoreHorizontal",
    };
    return iconMap[kategori] || tx.categoryIcon || undefined;
  };

  return (
    <div 
      className={cn(
        "p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer",
        "flex flex-col gap-1.5"
      )}
      onClick={onClick}
    >
      {/* Row 1: Icon + Description */}
      <div className="flex items-start gap-2">
        <div className={cn(
          "p-1 rounded-full shrink-0",
          isExpense ? "bg-red-500/10 text-red-500" : 
          isIncome ? "bg-emerald-500/10 text-emerald-500" : 
          "bg-blue-500/10 text-blue-500"
        )}>
          <DynamicIcon 
            name={getCategoryIcon(tx.kategori)} 
            fallback={Tag} 
            className="w-3.5 h-3.5" 
          />
        </div>
        <span className="text-xs font-medium line-clamp-2 leading-snug">
          {tx.deskripsi}
        </span>
      </div>
      
      {/* Row 2: Category Badge + Account Name */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground pl-7">
        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 font-normal">
          {tx.kategori}
        </Badge>
        <span>•</span>
        <span className="truncate">{accountName}</span>
      </div>
      
      {/* Row 3: Amount (right-aligned) */}
      <div className="flex justify-end">
        <span 
          className={cn(
            "text-xs font-bold",
            isExpense ? "text-red-500" : 
            isIncome ? "text-emerald-500" : 
            "text-blue-500"
          )}
          data-private="true"
        >
          {isExpense ? "-" : isIncome ? "+" : "⇄"}{formatRupiah(Money.toFloat(tx.nominalInt))}
        </span>
      </div>
    </div>
  );
}
