"use client"

import { useState } from "react"
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
    Shield,
    ChevronDown,
    ChevronRight,
    TrendingUp
} from "lucide-react"

interface NavItem {
    name: string
    href: string
    icon: any
}

interface NavGroup {
    name: string
    icon?: any
    items: NavItem[]
}

const navigation: NavGroup[] = [
    {
        name: "Utama",
        items: [
            { name: "Dashboard", href: "/", icon: LayoutDashboard },
            { name: "Transaksi", href: "/transaksi", icon: ArrowLeftRight },
            { name: "Akun & Aset", href: "/akun", icon: Wallet },
        ]
    },
    {
        name: "Analisis & Laporan",
        icon: BarChart3,
        items: [
            { name: "Ringkasan", href: "/statistik", icon: BarChart3 },
            { name: "Laporan Bulanan", href: "/laporan", icon: PieChart },
            { name: "Perbandingan YoY", href: "/laporan/comparison", icon: TrendingUp },
            { name: "Spending Heatmap", href: "/statistik/heatmap", icon: Calendar },
        ]
    },
    {
        name: "Perencanaan",
        icon: Target,
        items: [
            { name: "Anggaran", href: "/anggaran", icon: Target },
            { name: "Cicilan", href: "/cicilan", icon: CreditCard },
            { name: "Transaksi Berulang", href: "/recurring", icon: RefreshCw },
            { name: "Kalender", href: "/kalender", icon: Calendar },
            { name: "Template Bank", href: "/template-akun", icon: Shield },
            { name: "Template Cepat", href: "/template", icon: FileText },
        ]
    }
]

const bottomItems = [
    { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()
    const [openGroups, setOpenGroups] = useState<string[]>(["Utama", "Analisis & Laporan", "Perencanaan"])

    const toggleGroup = (name: string) => {
        setOpenGroups(prev => 
            prev.includes(name) 
                ? prev.filter(g => g !== name) 
                : [...prev, name]
        )
    }

    const isGroupOpen = (name: string) => openGroups.includes(name)

    const renderItem = (item: NavItem, isNested = false) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
            <Link
                key={item.name}
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isNested && "ml-4",
                    isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                <Icon className="w-4 h-4" />
                {item.name}
            </Link>
        )
    }

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shrink-0 overflow-y-auto">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Wallet className="w-8 h-8" />
                    Dompetku
                </h1>
            </div>
            <nav className="flex-1 px-4 space-y-4">
                {navigation.map((group) => (
                    <div key={group.name} className="space-y-1">
                        <button
                            onClick={() => toggleGroup(group.name)}
                            className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                {group.icon && <group.icon className="w-3 h-3" />}
                                {group.name}
                            </span>
                            {isGroupOpen(group.name) ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        
                        {isGroupOpen(group.name) && (
                            <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
                                {group.items.map(item => renderItem(item, group.name !== "Utama"))}
                            </div>
                        )}
                    </div>
                ))}

                <div className="pt-4 border-t">
                    {bottomItems.map(item => renderItem(item))}
                </div>
            </nav>
            <div className="p-4 border-t">
                <p className="text-xs text-muted-foreground text-center">© 2026 Dompetku Pro v0.7.1</p>
            </div>
        </aside>
    )
}