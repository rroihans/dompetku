"use client";

import { Badge } from "@/components/ui/badge";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { formatRupiah } from "@/lib/format";
import { Money } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

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
  transaction: {
    id: string;
    deskripsi: string;
    kategori: string;
    nominalInt: number;
    tanggal: string | Date;
    debitAkun?: { nama: string; tipe: string } | null;
    kreditAkun?: { nama: string; tipe: string } | null;
    categoryIcon?: string | null;
  };
  onClick?: () => void;
}

export function TodayTransactionCard({ transaction, onClick }: TodayTransactionCardProps) {
  const tx = transaction;
  
  // Determine if this is an expense transaction
  // Expense: debit account is EXPENSE type, or credit account is user asset (BANK, E_WALLET, CASH, CREDIT_CARD)
  const isExpense = tx.debitAkun?.tipe === "EXPENSE" || 
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe || "");
  
  // Determine account name to display (source for expense, destination for income)
  const accountName = isExpense 
    ? tx.kreditAkun?.nama || "Akun tidak diketahui"
    : tx.debitAkun?.nama || "Akun tidak diketahui";
  
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
          "p-1.5 rounded-full shrink-0",
          isExpense ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
        )}>
          <DynamicIcon 
            name={getCategoryIcon(tx.kategori)} 
            fallback={Tag} 
            className="w-4 h-4" 
          />
        </div>
        <span className="text-sm font-medium line-clamp-2 leading-snug">
          {tx.deskripsi}
        </span>
      </div>
      
      {/* Row 2: Category Badge + Account Name */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-8">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-normal">
          {tx.kategori}
        </Badge>
        <span>•</span>
        <span className="truncate">{accountName}</span>
      </div>
      
      {/* Row 3: Amount (right-aligned) */}
      <div className="flex justify-end">
        <span 
          className={cn(
            "text-sm font-bold",
            isExpense ? "text-red-500" : "text-emerald-500"
          )}
          data-private="true"
        >
          {isExpense ? "-" : "+"}{formatRupiah(Money.toFloat(tx.nominalInt))}
        </span>
      </div>
    </div>
  );
}
