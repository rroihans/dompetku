"use client"

import { HeatmapData } from "@/app/actions/analytics-heatmap"
import { HeatmapCell } from "./heatmap-cell"

interface Props {
    data: HeatmapData[]
    year: number
    month: number
    onDayClick: (date: string) => void
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HeatmapGrid({ data, year, month, onDayClick }: Props) {
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay(); // 0=Sun, 1=Mon
    // Convert to Mon=0 ... Sun=6
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    // Create empty slots for offset
    const blanks = Array(offset).fill(null);

    return (
        <div className="w-full">
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-sm text-muted-foreground font-medium">
                {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-2">
                {blanks.map((_, i) => (
                    <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {data.map((day) => (
                    <HeatmapCell
                        key={day.date}
                        date={day.date}
                        day={parseInt(day.date.split('-')[2])}
                        total={day.total}
                        intensity={day.intensity}
                        onClick={() => onDayClick(day.date)}
                    />
                ))}
            </div>
        </div>
    )
}
