"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    RefreshCw,
    Receipt,
    TrendingUp,
    TrendingDown
} from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { CalendarEventActions } from "./calendar-event-actions"

interface CalendarEvent {
    id: string
    date: Date | string
    type: 'cicilan' | 'recurring' | 'transaksi'
    title: string
    nominal: number
    description?: string
    color: string
}

interface FinancialCalendarProps {
    events: CalendarEvent[]
    bulan: number
    tahun: number
    onMonthChange?: (bulan: number, tahun: number) => void
}

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const BULAN_NAMA = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function FinancialCalendar({ events, bulan, tahun, onMonthChange }: FinancialCalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    // Generate calendar days
    const firstDayOfMonth = new Date(tahun, bulan - 1, 1)
    const lastDayOfMonth = new Date(tahun, bulan, 0)
    const daysInMonth = lastDayOfMonth.getDate()
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday

    // Create array of days
    const calendarDays: (number | null)[] = []

    // Add empty slots for days before the 1st
    for (let i = 0; i < startingDayOfWeek; i++) {
        calendarDays.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        calendarDays.push(day)
    }

    // Group events by date
    const eventsByDate = new Map<number, CalendarEvent[]>()
    events.forEach(event => {
        const eventDate = new Date(event.date)
        const day = eventDate.getDate()
        if (!eventsByDate.has(day)) {
            eventsByDate.set(day, [])
        }
        eventsByDate.get(day)?.push(event)
    })

    // Get events for selected date
    const selectedDateEvents = selectedDate ? eventsByDate.get(selectedDate.getDate()) || [] : []

    // Navigation handlers
    const goToPrevMonth = () => {
        let newBulan = bulan - 1
        let newTahun = tahun
        if (newBulan < 1) {
            newBulan = 12
            newTahun--
        }
        onMonthChange?.(newBulan, newTahun)
    }

    const goToNextMonth = () => {
        let newBulan = bulan + 1
        let newTahun = tahun
        if (newBulan > 12) {
            newBulan = 1
            newTahun++
        }
        onMonthChange?.(newBulan, newTahun)
    }

    const goToToday = () => {
        const now = new Date()
        onMonthChange?.(now.getMonth() + 1, now.getFullYear())
    }

    // Check if a day is today
    const isToday = (day: number) => {
        const now = new Date()
        return day === now.getDate() && bulan === now.getMonth() + 1 && tahun === now.getFullYear()
    }

    // Get icon for event type
    const getEventIcon = (type: string) => {
        switch (type) {
            case 'cicilan': return <CreditCard className="w-3 h-3" />
            case 'recurring': return <RefreshCw className="w-3 h-3" />
            default: return <Receipt className="w-3 h-3" />
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        Kalender Keuangan
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={goToPrevMonth}
                            aria-label="Bulan sebelumnya"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-sm font-medium"
                                    onClick={goToToday}
                                >
                                    {BULAN_NAMA[bulan - 1]} {tahun}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Kembali ke Bulan Ini</p>
                            </TooltipContent>
                        </Tooltip>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={goToNextMonth}
                            aria-label="Bulan selanjutnya"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                    {/* Day headers */}
                    {HARI.map(hari => (
                        <div key={hari} className="text-center text-xs font-medium text-muted-foreground py-2">
                            {hari}
                        </div>
                    ))}

                    {/* Calendar days */}
                    {calendarDays.map((day, index) => {
                        if (day === null) {
                            return <div key={`empty-${index}`} className="aspect-square" />
                        }

                        const dayEvents = eventsByDate.get(day) || []
                        const hasEvents = dayEvents.length > 0
                        const isSelected = selectedDate?.getDate() === day
                        const hasCicilan = dayEvents.some(e => e.type === 'cicilan')
                        const hasRecurring = dayEvents.some(e => e.type === 'recurring')

                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDate(new Date(tahun, bulan - 1, day))}
                                aria-label={`${day} ${BULAN_NAMA[bulan - 1]} ${tahun}`}
                                className={`
                                    aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                                    transition-all relative
                                    ${isToday(day) ? 'bg-primary text-primary-foreground font-bold' : ''}
                                    ${isSelected && !isToday(day) ? 'bg-muted ring-2 ring-primary' : ''}
                                    ${!isSelected && !isToday(day) ? 'hover:bg-muted/50' : ''}
                                `}
                            >
                                <span>{day}</span>
                                {hasEvents && (
                                    <div className="flex gap-0.5 mt-0.5">
                                        {hasCicilan && <div className="w-1 h-1 rounded-full bg-amber-500" />}
                                        {hasRecurring && <div className="w-1 h-1 rounded-full bg-violet-500" />}
                                        {dayEvents.some(e => e.type === 'transaksi') && (
                                            <div className="w-1 h-1 rounded-full bg-emerald-500" />
                                        )}
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-4 justify-center">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Cicilan</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-violet-500" />
                        <span>Recurring</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Transaksi</span>
                    </div>
                </div>

                {/* Selected Date Events */}
                {selectedDate && (
                    <div className="border-t pt-4">
                        <h4 className="font-medium mb-2 text-sm">
                            {selectedDate.toLocaleDateString('id-ID', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long'
                            })}
                        </h4>

                        {selectedDateEvents.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Tidak ada event</p>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {selectedDateEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="p-1.5 rounded-full"
                                                style={{ backgroundColor: `${event.color}20` }}
                                            >
                                                <div style={{ color: event.color }}>
                                                    {getEventIcon(event.type)}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{event.title}</p>
                                                <p className="text-xs text-muted-foreground">{event.description}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <p
                                                className="text-sm font-bold"
                                                style={{ color: event.color }}
                                                data-private="true"
                                            >
                                                {formatRupiah(event.nominal)}
                                            </p>
                                            <CalendarEventActions event={event} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
