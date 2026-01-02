import { Suspense } from "react"
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
import { getCalendarEvents, getCalendarSummary } from "@/app/actions/calendar"
import { CalendarClient } from "./calendar-client"

interface PageProps {
    searchParams: Promise<{ bulan?: string; tahun?: string }>
}

export default async function KalenderPage({ searchParams }: PageProps) {
    const params = await searchParams
    const now = new Date()
    const bulan = params.bulan ? parseInt(params.bulan) : now.getMonth() + 1
    const tahun = params.tahun ? parseInt(params.tahun) : now.getFullYear()

    const [eventsResult, summaryResult] = await Promise.all([
        getCalendarEvents(bulan, tahun),
        getCalendarSummary(bulan, tahun)
    ])

    const events = eventsResult.data || []
    const summary = summaryResult.data

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
            <CalendarClient events={events} bulan={bulan} tahun={tahun} />
        </div>
    )
}
