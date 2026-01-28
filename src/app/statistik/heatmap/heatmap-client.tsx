"use client"

import { useState, useEffect } from "react"
import { getSpendingHeatmap, HeatmapData, PatternInsight } from "@/lib/db/analytics-repo"
import { HeatmapGrid } from "@/components/analytics/heatmap/heatmap-grid"
import { HeatmapWeeklySwipe } from "@/components/analytics/heatmap/heatmap-weekly"
import { DailyDetailModal } from "@/components/analytics/heatmap/daily-detail-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, ArrowLeft, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

const SEVERITY_STYLES = {
    info: "bg-blue-50 border-blue-200 text-blue-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    positive: "bg-emerald-50 border-emerald-200 text-emerald-900"
}

export default function HeatmapClient() {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear().toString());
    const [month, setMonth] = useState((today.getMonth() + 1).toString());
    const [data, setData] = useState<{ heatmap: HeatmapData[], insights: PatternInsight[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getSpendingHeatmap(parseInt(month), parseInt(year));
            if (res.success && res.data) {
                setData(res.data);
            }
            setLoading(false);
        }
        load();
    }, [month, year]);

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/statistik">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Spending Heatmap</h2>
                        <p className="text-muted-foreground text-sm">
                            Visualisasi pola pengeluaran harian
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={month} onValueChange={setMonth}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {MONTHS.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={year} onValueChange={setYear}>
                        <SelectTrigger className="w-[100px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loading ? (
                <div className="h-[400px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
            ) : data ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Kalender Pengeluaran</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="hidden md:block">
                                <HeatmapGrid
                                    data={data.heatmap}
                                    year={parseInt(year)}
                                    month={parseInt(month)}
                                    onDayClick={setSelectedDate}
                                />
                            </div>
                            <div className="md:hidden">
                                <HeatmapWeeklySwipe
                                    data={data.heatmap}
                                    year={parseInt(year)}
                                    month={parseInt(month)}
                                    onDayClick={setSelectedDate}
                                />
                            </div>

                            {/* Legend */}
                            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Low</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> Medium</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></div> High</div>
                                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Very High</div>
                            </div>
                        </CardContent>
                    </Card>

                    {data.insights.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Lightbulb className="w-5 h-5 text-yellow-500" /> Pattern Insights
                            </h3>
                            {data.insights.map((insight, idx) => (
                                <Alert key={idx} className={SEVERITY_STYLES[insight.severity]}>
                                    <AlertTitle className="font-semibold mb-1">
                                        {insight.title}
                                    </AlertTitle>
                                    <AlertDescription className="text-sm opacity-90">
                                        {insight.message}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground">Gagal memuat data</div>
            )}

            <DailyDetailModal date={selectedDate} onClose={() => setSelectedDate(null)} />
        </div>
    )
}