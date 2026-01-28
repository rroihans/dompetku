"use client"

import { Suspense, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Calendar as CalendarIcon,
    CreditCard,
    RefreshCw,
    Receipt,
    ChevronLeft,
    ChevronRight,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { formatRupiah } from "@/lib/format"
import { getCalendarEvents, getCalendarSummary, CalendarEvent } from "@/lib/db/kalender-repo"
import { CalendarClient } from "./calendar-client"
import { useSearchParams } from "next/navigation"

export default function KalenderPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center">Memuat kalender...</div>}>
            <KalenderContent />
        </Suspense>
    )
}

function KalenderContent() {
    const searchParams = useSearchParams()

    const now = new Date()
    const paramBulan = searchParams.get("bulan") ? parseInt(searchParams.get("bulan")!) : now.getMonth() + 1
    const paramTahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : now.getFullYear()

    const bulan = isNaN(paramBulan) ? now.getMonth() + 1 : paramBulan
    const tahun = isNaN(paramTahun) ? now.getFullYear() : paramTahun

    const [events, setEvents] = useState<CalendarEvent[]>([])
    const [summary, setSummary] = useState({
        cicilanAktif: 0,
        totalCicilan: 0,
        recurringCount: 0,
        transaksiCount: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const [eventsResult, summaryResult] = await Promise.all([
                    getCalendarEvents(bulan, tahun),
                    getCalendarSummary(bulan, tahun)
                ])

                if (eventsResult.success && eventsResult.data) {
                    setEvents(eventsResult.data)
                }
                if (summaryResult.success && summaryResult.data) {
                    setSummary(summaryResult.data)
                }
            } catch (error) {
                console.error("Failed to load calendar data", error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [bulan, tahun])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                            Kalender Keuangan
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Lihat jadwal pembayaran cicilan, recurring, dan transaksi
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cicilan Aktif</p>
                                <p className="text-xl font-bold">{summary.cicilanAktif}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Cicilan/Bulan</p>
                                <p className="text-xl font-bold text-amber-600" data-private="true">
                                    {formatRupiah(summary.totalCicilan)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900">
                                <RefreshCw className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Recurring Aktif</p>
                                <p className="text-xl font-bold">{summary.recurringCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Receipt className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Transaksi Bulan Ini</p>
                                <p className="text-xl font-bold">{summary.transaksiCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Component */}
            {loading ? (
                <div className="h-[500px] flex items-center justify-center border rounded-lg">
                    <p className="text-muted-foreground">Memuat data...</p>
                </div>
            ) : (
                <CalendarClient events={events} bulan={bulan} tahun={tahun} />
            )}
        </div>
    )
}
