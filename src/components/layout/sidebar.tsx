"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Wallet,
    ArrowLeftRight,
    CreditCard,
    PieChart,
    Settings,
    RefreshCw,
    Target,
    BarChart3,
    Calendar,
    FileText,
    Shield
} from "lucide-react"

const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Akun", href: "/akun", icon: Wallet },
    { name: "Transaksi", href: "/transaksi", icon: ArrowLeftRight },
    { name: "Template Bank", href: "/template-akun", icon: Shield },
    { name: "Template Cepat", href: "/template", icon: FileText },
    { name: "Berulang", href: "/recurring", icon: RefreshCw },
    { name: "Cicilan", href: "/cicilan", icon: CreditCard },
    { name: "Anggaran", href: "/anggaran", icon: Target },
    { name: "Kalender", href: "/kalender", icon: Calendar },
    { name: "Laporan", href: "/laporan", icon: PieChart },
    { name: "Statistik", href: "/statistik", icon: BarChart3 },
    { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shrink-0 overflow-y-auto">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Wallet className="w-8 h-8" />
                    Dompetku
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-1">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t">
                <p className="text-xs text-muted-foreground">© 2026 Dompetku Pro</p>
            </div>
        </aside>
    )
}
