"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, X, CreditCard, RefreshCw, Target, Wallet, ArrowRightLeft, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"

// Wrap AddTransactionForm to be used inside FAB
// We need to customize the trigger button appearance in FAB
// But AddTransactionForm has its own button.
// I will modify AddTransactionForm to accept a custom trigger or child?
// Or I just use Link for now for complex actions to avoid state hell.
// "New Transaction" is the most important.
// I'll assume AddTransactionForm exports a component I can use.
// It exports `AddTransactionForm`.

export function FAB() {
    const [open, setOpen] = useState(false)

    const actions = [
        { label: "Transfer", icon: ArrowRightLeft, href: "/akun" },
        { label: "Bayar Cicilan", icon: CreditCard, href: "/cicilan" },
        { label: "Set Budget", icon: Target, href: "/anggaran" },
        { label: "Recurring", icon: RefreshCw, href: "/recurring" },
        { label: "Tambah Akun", icon: Wallet, href: "/akun" },
    ]

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {/* Menu */}
            <div className={cn(
                "flex flex-col items-end gap-3 transition-all duration-300 origin-bottom-right",
                open ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-50 translate-y-10 pointer-events-none"
            )}>
                {/* Custom Action: Add Transaction (Modal) */}
                <div className="flex items-center gap-3">
                    <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                        Transaksi Baru
                    </span>
                    <div className="fab-action-wrapper">
                       <AddTransactionForm /> 
                       {/* Note: AddTransactionForm renders a Button trigger. We might want to style it round? 
                           We can't easily style the internal button without props.
                           For now, let it render standard button, it's functional. 
                           Or better: Don't use AddTransactionForm here if style doesn't match.
                           Use Link to /transaksi?action=new if we support it.
                           I'll leave it as is, standard button in the stack.
                       */}
                    </div>
                </div>

                {actions.map((action, idx) => (
                    <Link key={idx} href={action.href} className="flex items-center gap-3">
                        <span className="bg-popover text-popover-foreground px-2 py-1 rounded text-xs font-medium shadow-md">
                            {action.label}
                        </span>
                        <Button size="icon" className="rounded-full shadow-lg h-10 w-10 bg-background text-foreground hover:bg-muted border">
                            <action.icon className="h-5 w-5" />
                        </Button>
                    </Link>
                ))}
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
