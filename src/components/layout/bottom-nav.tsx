"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Wallet,
    ArrowLeftRight,
    Target,
    PieChart,
    Menu,
    X,
    CreditCard,
    RefreshCw,
    Settings,
    Database,
    BarChart3,
    Bug,
    Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"

const mainNavItems = [
    { name: "Dash", href: "/", icon: LayoutDashboard },
    { name: "Akun", href: "/akun", icon: Wallet },
    { name: "Input", href: "/transaksi", icon: ArrowLeftRight },
    { name: "Budget", href: "/anggaran", icon: Target },
]

const allMenuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Akun", href: "/akun", icon: Wallet },
    { name: "Transaksi", href: "/transaksi", icon: ArrowLeftRight },
    { name: "Anggaran", href: "/anggaran", icon: Target },
    { name: "Cicilan", href: "/cicilan", icon: CreditCard },
    { name: "Berulang", href: "/recurring", icon: RefreshCw },
    { name: "Laporan", href: "/laporan", icon: PieChart },
    { name: "Statistik", href: "/statistik", icon: BarChart3 },
    { name: "Pengaturan", href: "/pengaturan", icon: Settings },
]

const debugMenuItems = [
    { name: "Debug Automasi", href: "/debug-automation", icon: Zap },
    { name: "Database", href: "/devdb", icon: Database },
]

export function BottomNav() {
    const pathname = usePathname()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    return (
        <>
            {/* Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t flex justify-around items-center h-16 px-2">
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 min-w-[56px] transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                            <span className="text-[10px] font-medium">{item.name}</span>
                        </Link>
                    )
                })}

                {/* Menu Button */}
                <button
                    onClick={() => setIsDrawerOpen(true)}
                    className="flex flex-col items-center justify-center gap-1 min-w-[56px] text-muted-foreground"
                >
                    <Menu className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>
            </nav>

            {/* Backdrop overlay */}
            {isDrawerOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity"
                    onClick={() => setIsDrawerOpen(false)}
                />
            )}

            {/* Sliding Drawer */}
            <div
                className={cn(
                    "md:hidden fixed bottom-0 left-0 right-0 z-[70] bg-background rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out",
                    isDrawerOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                {/* Drawer Handle */}
                <div className="flex justify-center py-3">
                    <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
                </div>

                {/* Drawer Header */}
                <div className="flex items-center justify-between px-4 pb-4 border-b">
                    <h3 className="text-lg font-semibold">Menu</h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDrawerOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                {/* Menu Items */}
                <div className="p-4 pb-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-3">
                        {allMenuItems.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setIsDrawerOpen(false)}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted/50 hover:bg-muted text-foreground"
                                    )}
                                >
                                    <Icon className="w-6 h-6" />
                                    <span className="text-xs font-medium">{item.name}</span>
                                </Link>
                            )
                        })}
                    </div>

                    {/* Debug Tools Section */}
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2 font-semibold">Developer Tools</p>
                        <div className="grid grid-cols-2 gap-2">
                            {debugMenuItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span className="text-xs font-medium">{item.name}</span>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground text-center">
                            Dompetku v0.5.0 • Double-Entry Bookkeeping
                        </p>
                    </div>
                </div>
            </div>
        </>
    )
}
