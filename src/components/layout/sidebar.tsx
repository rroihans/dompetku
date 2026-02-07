"use client"

import { useState } from "react"
import { DummyDataToggle } from "./dummy-data-toggle"
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
            { name: "Perbandingan YoY", href: "/laporan/perbandingan", icon: TrendingUp },
            { name: "Spending Heatmap", href: "/statistik/heatmap", icon: Calendar },
        ]
    },
    {
        name: "Perencanaan",
        icon: Target,
        items: [
            { name: "Anggaran", href: "/anggaran", icon: Target },
            { name: "Cicilan", href: "/cicilan", icon: CreditCard },
            { name: "Transaksi Berulang", href: "/transaksi-berulang", icon: RefreshCw },
            { name: "Kalender", href: "/kalender", icon: Calendar },
            { name: "Template A&B Bank", href: "/template-admin-dan-bunga-bank", icon: Shield },
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
        // Highlighting logic:
        // 1. Exact match (best)
        // 2. Sub-route match (e.g. /akun/detail matches /akun)
        // 3. BUT don't match if another menu item is a more specific match for this path
        const isExact = pathname === item.href
        const isSubRoute = item.href !== '/' && pathname.startsWith(item.href + '/')

        // Check if there's a better (more specific) match in the navigation
        const hasBetterMatch = navigation.some(g =>
            g.items.some(other =>
                other.href !== item.href &&
                other.href.length > item.href.length &&
                pathname.startsWith(other.href)
            )
        )

        const isActive = isExact || (isSubRoute && !hasBetterMatch)

        const Icon = item.icon
        return (
            <Link
                key={item.href} // Use href as key for stability
                href={item.href}
                className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all relative group",
                    isNested && "ml-4",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
            >
                {isActive && (
                    <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <Icon className={cn("w-4 h-4 transition-transform", isActive && "scale-110")} />
                <span>{item.name}</span>
                {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                )}
            </Link>
        )
    }

    return (
        <>
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg"
            >
                Lewati ke konten utama
            </a>
            <aside className="hidden md:flex flex-col w-64 border-r bg-card h-screen sticky top-0 shrink-0 overflow-y-auto shadow-sm">
            <div className="p-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-primary p-1.5 rounded-lg text-primary-foreground transition-transform group-hover:scale-110">
                        <Wallet className="w-6 h-6" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                        Dompetku
                    </span>
                </Link>
            </div>
            <nav className="flex-1 px-4 space-y-4">
                {navigation.map((group) => (
                    <div key={group.name} className="space-y-1">
                        <button
                            onClick={() => toggleGroup(group.name)}
                            className="flex items-center justify-between w-full px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-foreground transition-colors"
                        >
                            <span>
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

                <div className="pt-4 border-t space-y-1">
                    <DummyDataToggle />
                    {bottomItems.map(item => renderItem(item))}
                </div>
            </nav>
            <div className="p-4 border-t bg-muted/30">
                <p className="text-[10px] text-muted-foreground text-center font-medium tracking-tight">© 2026 Dompetku Pro v0.7.1</p>
            </div>
        </aside>
        </>
    )
}