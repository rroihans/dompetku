"use client"

import { useState } from "react"
import { HeatmapData } from "@/lib/db/analytics-repo"
import { HeatmapCell } from "./heatmap-cell"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatRupiah } from "@/lib/format"

interface Props {
    data: HeatmapData[]
    year: number
    month: number
    onDayClick: (date: string) => void
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HeatmapWeeklySwipe({ data, year, month, onDayClick }: Props) {
    const [currentWeek, setCurrentWeek] = useState(0);

    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    // Pad data with nulls to align with weeks
    const paddedData = [...Array(offset).fill(null), ...data];

    // Chunk into weeks
    const weeks: (HeatmapData | null)[][] = [];
    for (let i = 0; i < paddedData.length; i += 7) {
        weeks.push(paddedData.slice(i, i + 7));
    }

    // Fill last week if incomplete
    if (weeks[weeks.length - 1].length < 7) {
        const remaining = 7 - weeks[weeks.length - 1].length;
        weeks[weeks.length - 1] = [...weeks[weeks.length - 1], ...Array(remaining).fill(null)];
    }

    const activeWeek = weeks[currentWeek];
    const totalWeek = activeWeek.reduce((sum, d) => sum + (d?.total || 0), 0);
    const avgWeek = totalWeek / 7;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg">
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentWeek === 0}
                    onClick={() => setCurrentWeek(c => c - 1)}
                >
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-medium text-sm">Week {currentWeek + 1}</span>
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentWeek === weeks.length - 1}
                    onClick={() => setCurrentWeek(c => c + 1)}
                >
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[10px] text-muted-foreground font-bold">{d}</div>
                ))}
                {activeWeek.map((day, i) => (
                    day ? (
                        <HeatmapCell
                            key={day.date}
                            date={day.date}
                            day={parseInt(day.date.split('-')[2])}
                            total={day.total}
                            intensity={day.intensity}
                            onClick={() => onDayClick(day.date)}
                        />
                    ) : (
                        <div key={`empty-${i}`} className="aspect-square" />
                    )
                ))}
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-card border p-2 rounded text-center">
                    <div className="text-muted-foreground">Total Week</div>
                    <div className="font-bold text-primary">{formatRupiah(totalWeek)}</div>
                </div>
                <div className="bg-card border p-2 rounded text-center">
                    <div className="text-muted-foreground">Avg / Day</div>
                    <div className="font-bold">{formatRupiah(avgWeek)}</div>
                </div>
            </div>
        </div>
    )
}
