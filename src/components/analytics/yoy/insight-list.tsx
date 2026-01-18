"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Insight } from "@/lib/analytics/insights"
import { Lightbulb } from "lucide-react"

interface Props {
    insights: Insight[]
}

export function InsightList({ insights }: Props) {
    if (insights.length === 0) return null;

    // Take top 3
    const topInsights = insights.slice(0, 3);

    return (
        <Card className="bg-yellow-50/50 border-yellow-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-yellow-800">
                    <Lightbulb className="w-4 h-4" />
                    Insight Otomatis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {topInsights.map((insight, idx) => (
                    <div key={idx} className="flex gap-3 items-start text-sm">
                        <span className="mt-0.5">{insight.message.split(" ")[0]}</span> 
                        {/* Hack: The message starts with emoji, split to separate if needed or just render as is */}
                        <div className="flex-1">
                            {/* Remove the emoji from the start for cleaner text alignment if we want, but emoji is part of message string logic */}
                            <p className="text-gray-700">{insight.message.substring(2)}</p> 
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
