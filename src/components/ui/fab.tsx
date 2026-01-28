"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus, CreditCard, RefreshCw, Target, Wallet, ArrowRightLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { TransferForm } from "@/components/forms/transfer-form"
import { AddAccountForm } from "@/components/forms/add-account-form"
import { getActiveAccountTemplates, type AccountTemplateDTO } from "@/lib/db/templates-repo"

export function FAB() {
    const [open, setOpen] = useState(false)
    const [templates, setTemplates] = useState<AccountTemplateDTO[]>([])

    useEffect(() => {
        // Load templates for AddAccountForm
        getActiveAccountTemplates().then(setTemplates).catch(console.error)
    }, [])

    return (
        <div className="fixed bottom-24 md:bottom-6 right-6 z-[55] flex flex-col items-end gap-4">
            {/* Menu */}
            <div className={cn(
                "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
            )}>
                {/* 1. Transaksi Baru (Custom Form Popup) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Transaksi Baru
                    </span>
                    <AddTransactionForm trigger={
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <Plus className="h-5 w-5" />
                        </Button>
                    } />
                </div>

                {/* 2. Transfer (Dialog Popup) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Transfer
                    </span>
                    <TransferForm trigger={
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <ArrowRightLeft className="h-5 w-5" />
                        </Button>
                    } />
                </div>

                {/* 3. Recurring (Link to /transaksi-berulang) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Recurring
                    </span>
                    <Link href="/transaksi-berulang">
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <RefreshCw className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* 4. Tambah Akun (Dialog Popup) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Tambah Akun
                    </span>
                    <AddAccountForm templates={templates} trigger={
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <Wallet className="h-5 w-5" />
                        </Button>
                    } />
                </div>

                {/* 5. Set Budget (Link) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Set Budget
                    </span>
                    <Link href="/anggaran">
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <Target className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                {/* 6. Cicilan (Link) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Bayar Cicilan
                    </span>
                    <Link href="/cicilan">
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <CreditCard className="h-5 w-5" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Toggle */}
            <Button
                size="icon"
                className={cn(
                    "h-14 w-14 rounded-full shadow-xl transition-transform duration-300",
                    open ? "rotate-45 bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
                )}
                onClick={() => setOpen(!open)}
            >
                <Plus className="h-6 w-6" />
            </Button>
        </div>
    )
}
