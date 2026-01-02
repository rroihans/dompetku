"use client"

import { useState, useEffect, ReactNode } from "react"

interface ClientChartWrapperProps {
    children: ReactNode
    height: number
    fallback?: ReactNode
}

/**
 * Wrapper component untuk chart Recharts yang hanya render di client-side.
 * Ini mengatasi masalah ResponsiveContainer yang tidak bisa mendapatkan dimensi saat SSR.
 */
export function ClientChartWrapper({ children, height, fallback }: ClientChartWrapperProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <div
                style={{ height, width: '100%' }}
                className="flex items-center justify-center bg-muted/20 rounded animate-pulse"
            >
                {fallback || <span className="text-muted-foreground text-sm">Memuat chart...</span>}
            </div>
        )
    }

    return (
        <div style={{ height, width: '100%' }}>
            {children}
        </div>
    )
}
