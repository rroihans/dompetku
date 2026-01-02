"use client"

import { useRouter } from "next/navigation"
import { FinancialCalendar } from "@/components/calendar/financial-calendar"

interface CalendarEvent {
    id: string
    date: Date | string
    type: 'cicilan' | 'recurring' | 'transaksi'
    title: string
    nominal: number
    description?: string
    color: string
}

interface CalendarClientProps {
    events: CalendarEvent[]
    bulan: number
    tahun: number
}

export function CalendarClient({ events, bulan, tahun }: CalendarClientProps) {
    const router = useRouter()

    const handleMonthChange = (newBulan: number, newTahun: number) => {
        router.push(`/kalender?bulan=${newBulan}&tahun=${newTahun}`)
    }

    return (
        <FinancialCalendar
            events={events}
            bulan={bulan}
            tahun={tahun}
            onMonthChange={handleMonthChange}
        />
    )
}
