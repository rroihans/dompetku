
"use client"

import { useEffect, useState } from "react"
import { getOverBudgetCategories } from "@/lib/db/budget-repo"
import { AlertTriangle, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatRupiah } from "@/lib/format"

type BudgetAlert = {
    kategori: string
    limit: number
    used: number
    percentage: number
    overAmount: number
    status: "SAFE" | "WARNING" | "DANGER" | "CRITICAL" | string
}

export function BudgetBanner() {
    const [alerts, setAlerts] = useState<BudgetAlert[]>([])
    const [loaded, setLoaded] = useState(false)

    useEffect(() => {
        let cancelled = false

            ; (async () => {
                try {
                    const result = await getOverBudgetCategories()
                    if (cancelled) return
                    setAlerts((result?.data ?? []) as BudgetAlert[])
                } catch (error) {
                    console.error("BudgetBanner failed to load over-budget categories", error)
                } finally {
                    if (cancelled) return
                    setLoaded(true)
                }
            })()

        return () => {
            cancelled = true
        }
    }, [])

    // Avoid showing a placeholder on initial dashboard load.
    if (!loaded) return null

    if (alerts.length === 0) return null

    // Determine highest severity for main banner color
    const hasCritical = alerts.some(a => a.status === "CRITICAL")
    const hasDanger = alerts.some(a => a.status === "DANGER")

    // Default Warning styling
    let containerClass = "bg-yellow-50 border-yellow-200 text-yellow-800"
    let icon = <AlertTriangle className="h-5 w-5 text-yellow-600" />

    if (hasCritical) {
        containerClass = "bg-red-50 border-red-200 text-red-900"
        icon = <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
    } else if (hasDanger) {
        containerClass = "bg-red-50 border-red-200 text-red-900"
        icon = <AlertCircle className="h-5 w-5 text-red-600" />
    }

    return (
        <div className={`rounded-lg border p-4 ${containerClass} mb-6`}>
            <div className="flex items-start gap-4">
                <div className="mt-1">{icon}</div>
                <div className="flex-1">
                    <h3 className="font-semibold text-lg flex items-center justify-between">
                        <span>
                            {alerts.length} Budget {alerts.length > 1 ? "Melebihi" : "Mendekati"} Limit
                        </span>
                        <Link href="/anggaran" className="text-sm font-normal underline flex items-center gap-1 hover:opacity-80">
                            Lihat Detail <ArrowRight className="h-3 w-3" />
                        </Link>
                    </h3>
                    <div className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                        {alerts.slice(0, 3).map((alert) => (
                            <div key={alert.kategori} className="text-sm flex items-center gap-2">
                                <span className="font-medium">• {alert.kategori}:</span>
                                <span className={
                                    alert.status === "CRITICAL" ? "text-red-700 font-bold" :
                                        alert.status === "DANGER" ? "text-red-600 font-semibold" :
                                            "text-yellow-700"
                                }>
                                    {Math.round(alert.percentage)}%
                                    {alert.overAmount > 0 && ` (over ${formatRupiah(alert.overAmount)})`}
                                </span>
                            </div>
                        ))}
                        {alerts.length > 3 && (
                            <div className="text-sm italic opacity-80">
                                +{alerts.length - 3} lainnya...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
