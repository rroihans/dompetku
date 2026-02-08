"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, Home, List, BarChart3, Clock, Wallet, Tag, Calendar, Settings, FileText } from "lucide-react"

const menuItems = [
    { label: "Beranda", icon: Home, href: "/", color: "#3b82f6" },
    { label: "Transaksi", icon: List, href: "/transaksi", color: "#f59e0b" },
    { label: "Akun", icon: Wallet, href: "/akun", color: "#10b981" },
    {
        label: "Statistik",
        icon: BarChart3,
        href: "/statistik",
        color: "#8b5cf6",
        submenu: [
            { label: "Statistik", href: "/statistik" },
            { label: "Perbandingan YoY", href: "/statistik/yoy" },
            { label: "Heatmap", href: "/statistik/heatmap" },
        ]
    },
    { label: "Cicilan", icon: Clock, href: "/cicilan", color: "#ec4899" },
    { label: "Anggaran", icon: Wallet, href: "/anggaran", color: "#14b8a6" },
    { label: "Kategori", icon: Tag, href: "/kategori", color: "#f97316" },
    { label: "Kalender", icon: Calendar, href: "/kalender", color: "#06b6d4" },
    { label: "Template", icon: FileText, href: "/template", color: "#84cc16" },
    { label: "Pengaturan", icon: Settings, href: "/pengaturan", color: "#64748b" },
]

export function DrawerNavigation() {
    const [open, setOpen] = useState(false)
    const [expandedMenu, setExpandedMenu] = useState<string | null>(null)
    const pathname = usePathname()

    function isActive(href: string) {
        if (href === "/") return pathname === "/"
        return pathname.startsWith(href)
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu navigasi utama">
                    <Menu className="w-5 h-5" aria-hidden="true" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-background border-border">
                <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
                <div className="flex flex-col h-full py-6">
                    {/* Header */}
                    <div className="px-6 pb-4">
                        <h2 className="text-xl font-bold text-foreground">Dompetku</h2>
                        <p className="text-xs text-muted-foreground mt-1">Kelola keuangan Anda</p>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 px-3 space-y-1 overflow-y-auto" role="navigation" aria-label="Menu utama">
                        {menuItems.map((item) => {
                            const Icon = item.icon
                            const active = isActive(item.href)
                            const hasSubmenu = item.submenu && item.submenu.length > 0
                            const isExpanded = expandedMenu === item.label

                            return (
                                <div key={item.label}>
                                    {hasSubmenu ? (
                                        <button
                                            onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                                            aria-expanded={isExpanded}
                                            aria-controls={`submenu-${item.label}`}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                }`}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${item.color}20` }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: item.color }} />
                                            </div>
                                            <span className="flex-1 text-left font-medium text-sm">
                                                {item.label}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""
                                                    }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${active
                                                ? "bg-accent text-accent-foreground"
                                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                                }`}
                                        >
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: `${item.color}20` }}
                                            >
                                                <Icon className="w-5 h-5" style={{ color: item.color }} />
                                            </div>
                                            <span className="flex-1 font-medium text-sm">{item.label}</span>
                                        </Link>
                                    )}

                                    {/* Submenu */}
                                    {hasSubmenu && isExpanded && (
                                        <div id={`submenu-${item.label}`} className="ml-12 mt-1 space-y-1">
                                            {item.submenu?.map((sub) => (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    onClick={() => setOpen(false)}
                                                    aria-current={pathname === sub.href ? "page" : undefined}
                                                    className={`block px-4 py-2 rounded text-sm ${pathname === sub.href
                                                        ? "text-foreground bg-accent/50"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                        }`}
                                                >
                                                    {sub.label}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </nav>
                    <div className="px-6 py-4 border-t border-border mt-auto">
                        <p className="text-[10px] text-muted-foreground text-center">
                            Versi Aplikasi v0.12.1
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
