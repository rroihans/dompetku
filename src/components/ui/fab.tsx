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
        <>
            {/* Backdrop Overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-[54] bg-background/80 backdrop-blur-sm transition-opacity"
                    onClick={() => setOpen(false)}
                />
            )}

            <div className="fixed bottom-24 md:bottom-6 right-6 z-[55] flex flex-col items-end gap-4">
                {/* Menu Items */}
                <div className={cn(
                    "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                    open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
                )}>
                    {/* 1. Transaksi Baru */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200">
                            Transaksi Baru
                        </span>
                        <AddTransactionForm trigger={
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        } />
                    </div>

                    {/* 2. Transfer */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-75">
                            Transfer
                        </span>
                        <TransferForm trigger={
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <ArrowRightLeft className="h-5 w-5" />
                            </Button>
                        } />
                    </div>

                    {/* 3. Recurring */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-100">
                            Recurring
                        </span>
                        <Link href="/transaksi-berulang">
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <RefreshCw className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* 4. Tambah Akun */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-150">
                            Tambah Akun
                        </span>
                        <AddAccountForm templates={templates} trigger={
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <Wallet className="h-5 w-5" />
                            </Button>
                        } />
                    </div>

                    {/* 5. Set Budget */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-200">
                            Set Budget
                        </span>
                        <Link href="/anggaran">
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <Target className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>

                    {/* 6. Cicilan */}
                    <div className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-3 py-1.5 rounded-md text-sm font-medium shadow-md border animate-in fade-in slide-in-from-right-4 duration-200 delay-300">
                            Bayar Cicilan
                        </span>
                        <Link href="/cicilan">
                            <Button
                                onClick={() => setOpen(false)}
                                size="icon"
                                className="rounded-full shadow-lg h-11 w-11 bg-background text-foreground hover:bg-muted border transition-transform hover:scale-105"
                            >
                                <CreditCard className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Main Toggle Button */}
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-xl transition-all duration-300 z-[56]",
                        open ? "rotate-45 bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90 hover:scale-105"
                    )}
                    onClick={() => setOpen(!open)}
                >
                    <Plus className="h-6 w-6" />
                </Button>
            </div>
        </>
    )
}
