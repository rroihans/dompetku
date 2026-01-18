"use client"

import { cn } from "@/lib/utils"
import { formatRupiah } from "@/lib/format"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Props {
    date: string
    day: number
    total: number
    intensity: 0 | 1 | 2 | 3 | 4
    onClick: () => void
}

const COLORS = {
    0: "bg-muted/30 text-muted-foreground hover:bg-muted/50",
    1: "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
    2: "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
    3: "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    4: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
}

export function HeatmapCell({ date, day, total, intensity, onClick }: Props) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div 
                        onClick={onClick}
                        className={cn(
                            "aspect-square p-1 rounded-md border flex flex-col items-center justify-center cursor-pointer transition-colors text-xs",
                            COLORS[intensity],
                            intensity === 0 && "border-transparent"
                        )}
                    >
                        <span className="font-semibold">{day}</span>
                        {total > 0 && (
                            <span className="text-[10px] hidden sm:block font-medium mt-1 truncate w-full text-center">
                                {formatRupiah(total).replace("Rp ", "")}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <div className="text-center">
                        <p className="font-bold">{date}</p>
                        <p>{formatRupiah(total)}</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
