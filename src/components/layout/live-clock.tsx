"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"

export function LiveClock() {
    const [time, setTime] = useState<Date | null>(null)

    useEffect(() => {
        // Initial set can be handled by default state if we knew the date, 
        // but since it's client-only, we do it in useEffect but maybe not synchronously if it causes issues.
        // Actually, just setting it is fine, but lint complains.
        const now = new Date()
        setTime(now)
        
        const timer = setInterval(() => {
            setTime(new Date())
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    if (!time) return <div className="h-5 w-32 bg-muted animate-pulse rounded" />

    const dateStr = time.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })

    const timeStr = time.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    })

    const dateShortStr = time.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })

    const timeShortStr = time.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    })

    return (
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-full border">
            {/* Desktop View */}
            <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>{dateStr}</span>
                </div>
                <div className="w-[1px] h-3 bg-border" />
                <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{timeStr} WIB</span>
                </div>
            </div>

            {/* Mobile View */}
            <div className="flex sm:hidden items-center gap-2">
                <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-primary" />
                    <span>{dateShortStr}</span>
                </div>
                <div className="w-[1px] h-3 bg-border" />
                <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-primary" />
                    <span>{timeShortStr}</span>
                </div>
            </div>
        </div>
    )
}