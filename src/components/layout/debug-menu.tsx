"use client"

import { useState } from "react"
import { Bug, ChevronDown, Database, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

const DEBUG_PAGES = [
    {
        href: "/debug-automation",
        label: "Debug Automasi",
        desc: "Analisis biaya admin & bunga",
        icon: Zap
    },
    {
        href: "/devdb",
        label: "Database Inspector",
        desc: "Lihat isi database langsung",
        icon: Database
    },
]

export function DebugMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400"
                    title="Debug Tools"
                >
                    <Bug className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-red-500" />
                    Developer Tools
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {DEBUG_PAGES.map((page) => (
                    <DropdownMenuItem key={page.href} asChild>
                        <Link href={page.href} className="cursor-pointer">
                            <page.icon className="w-4 h-4 mr-2 text-muted-foreground" />
                            <div>
                                <div className="font-medium">{page.label}</div>
                                <div className="text-[10px] text-muted-foreground">{page.desc}</div>
                            </div>
                        </Link>
                    </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/pengaturan" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                        <span>Pengaturan</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
