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
        <Card className="bg-primary/5 border-none border-l-4 border-l-primary shadow-sm overflow-hidden">
            <CardHeader className="pb-2 bg-primary/5">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-primary">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    Insight Otomatis
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
                {topInsights.map((insight, idx) => {
                    const message = insight.message || "";
                    const emoji = message.split(" ")[0] || "💡";
                    const text = message.length > 2 ? message.substring(2) : message;
                    return (
                        <div key={idx} className="flex gap-3 items-start text-sm py-1">
                            <span className="mt-0.5 text-base">{emoji}</span>
                            <div className="flex-1">
                                <p className="text-foreground/90 leading-relaxed font-medium">{text}</p>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    )
}