"use client"

import { useState, useEffect } from "react"
import { getYearOverYearComparison } from "@/lib/db/analytics-repo"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowLeft } from "lucide-react"
import { YoYSummaryCards } from "@/components/analytics/yoy/summary-cards"
import { CategoryComparisonTable } from "@/components/analytics/yoy/category-table"
import { YoYCharts } from "@/components/analytics/yoy/charts"
import { InsightList } from "@/components/analytics/yoy/insight-list"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Insight, CategoryData } from "@/lib/analytics/insights"

interface YoYInsight {
    title: string;
    message: string;
    type: string;
}

interface CategoryDataItem {
    name: string;
    amount: number;
    type: 'income' | 'essential' | 'discretionary';
}

interface YearData {
    year: number;
    monthly: { month: number; expense: number; income: number }[];
    categories: CategoryDataItem[];
    summary: { month: number; year: number; categories: CategoryDataItem[]; totalIncome: number; totalExpense: number };
}

interface YoYData {
    year1: YearData;
    year2: YearData;
    insights: YoYInsight[];
}

export default function PerbandinganClient() {
    const currentYear = new Date().getFullYear();
    const [year1, setYear1] = useState<string>((currentYear - 1).toString());
    const [year2, setYear2] = useState<string>(currentYear.toString());
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<YoYData | null>(null);

    // Generate years 2020 - 2030
    const years = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getYearOverYearComparison(parseInt(year1), parseInt(year2));
            if (res.success && res.data) {
                setData(res.data as unknown as YoYData);
            }
            setLoading(false);
        }
        load();
    }, [year1, year2]);

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/laporan">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Perbandingan Tahunan</h2>
                        <p className="text-muted-foreground text-sm">
                            Analisis tren keuangan jangka panjang
                        </p>
                    </div>
                </div>

                {/* Year Selectors */}
                <div className="flex items-center gap-2 bg-card p-2 rounded-lg border shadow-sm">
                    <Select value={year1} onValueChange={setYear1}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <Select value={year2} onValueChange={setYear2}>
                        <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
                    <YoYSummaryCards
                        year1Data={data.year1}
                        year2Data={data.year2}
                        year1={parseInt(year1)}
                        year2={parseInt(year2)}
                    />

                    <InsightList insights={data.insights as unknown as Insight[]} />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <CategoryComparisonTable
                            year1={parseInt(year1)}
                            year2={parseInt(year2)}
                            categories1={data.year1.categories as unknown as CategoryData[]}
                            categories2={data.year2.categories as unknown as CategoryData[]}
                        />
                        <YoYCharts
                            year1={parseInt(year1)}
                            year2={parseInt(year2)}
                            monthly1={data.year1.monthly}
                            monthly2={data.year2.monthly}
                        />
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-muted-foreground">
                    Gagal memuat data
                </div>
            )}
        </div>
    )
}
