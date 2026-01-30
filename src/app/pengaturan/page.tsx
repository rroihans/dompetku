"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    Tag,
    FileText,
    ChevronRight,
    SlidersHorizontal,
    Wand2,
    User,
    Crown
} from "lucide-react"

export default function PengaturanPage() {
    return (
        <div className="space-y-6 max-w-full overflow-hidden pb-20">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground text-sm">
                    Manage your application preferences
                </p>
            </div>

            {/* User Profile (Placeholder for Visual Match) */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white">
                    <User className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold">User Profile</h3>
                    <p className="text-xs text-muted-foreground">Change profile image, name or password</p>
                </div>
            </div>

            {/* Premium Plans (Placeholder) */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Crown className="w-6 h-6 fill-blue-500" />
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-blue-500">Premium plans</h3>
                    <p className="text-xs text-muted-foreground">Explore premium options (Demo)</p>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground px-1">General</h3>

                {/* Accounts */}
                <Link href="/akun" className="block">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Accounts</h4>
                            <p className="text-xs text-muted-foreground">Manage accounts, change icons & colors</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>

                {/* Categories */}
                <Link href="/kategori" className="block">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600">
                            <Tag className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Categories</h4>
                            <p className="text-xs text-muted-foreground">Manage categories & subcategories</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>

                {/* Templates */}
                <Link href="/template" className="block">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Templates</h4>
                            <p className="text-xs text-muted-foreground">Create templates for faster records</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>

                {/* Filters */}
                <Link href="#" className="block opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Filters</h4>
                            <p className="text-xs text-muted-foreground">Set custom filters (Coming Soon)</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>

                {/* Automatic Rules */}
                <Link href="#" className="block opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm">
                        <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Automatic rules</h4>
                            <p className="text-xs text-muted-foreground">Manage recurring rules (Coming Soon)</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground px-1">System</h3>
                {/* Backup/Restore (Moving existing functionality here) */}
                <Link href="/pengaturan/data" className="block">
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-card border shadow-sm hover:bg-accent/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">Data & Backup</h4>
                            <p className="text-xs text-muted-foreground">Export, Import, and Reset Data</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
