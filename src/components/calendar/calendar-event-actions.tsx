"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
    Play, 
    Edit, 
    Trash2, 
    Copy, 
    ExternalLink, 
    FastForward,
    Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { bayarCicilan } from "@/app/actions/cicilan"
import { deleteTransaksi } from "@/app/actions/transaksi"
import { skipRecurringForMonth } from "@/app/actions/recurring"
import Link from "next/link"

interface CalendarEventActionsProps {
    event: {
        id: string
        type: 'cicilan' | 'recurring' | 'transaksi'
        title: string
        date: Date | string
    }
}

export function CalendarEventActions({ event }: CalendarEventActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleBayarCicilan = async () => {
        setLoading(true)
        try {
            const res = await bayarCicilan(event.id)
            if (res.success) {
                toast.success(`Cicilan ${event.title} berhasil dibayar`)
                router.refresh()
            } else {
                toast.error(res.error || "Gagal membayar cicilan")
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    const handleSkipRecurring = async () => {
        setLoading(true)
        try {
            const date = new Date(event.date)
            const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`
            const res = await skipRecurringForMonth(event.id, yearMonth)
            if (res.success) {
                toast.success(`Transaksi ${event.title} diskip untuk bulan ini`)
                router.refresh()
            } else {
                toast.error(res.error || "Gagal skip transaksi")
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteTransaksi = async () => {
        if (!confirm("Hapus transaksi ini?")) return
        setLoading(true)
        try {
            const res = await deleteTransaksi(event.id)
            if (res.success) {
                toast.success("Transaksi berhasil dihapus")
                router.refresh()
            } else {
                toast.error(res.error || "Gagal menghapus transaksi")
            }
        } catch (err) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    if (event.type === 'cicilan') {
        return (
            <div className="flex gap-1">
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px] gap-1 px-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={handleBayarCicilan}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    Bayar
                </Button>
                <Link href="/cicilan">
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2">
                        <ExternalLink className="w-3 h-3" />
                        Detail
                    </Button>
                </Link>
            </div>
        )
    }

    if (event.type === 'recurring') {
        return (
            <div className="flex gap-1">
                <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 text-[10px] gap-1 px-2 border-amber-500 text-amber-600 hover:bg-amber-50"
                    onClick={handleSkipRecurring}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FastForward className="w-3 h-3" />}
                    Skip
                </Button>
                <Link href="/recurring">
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2">
                        <Edit className="w-3 h-3" />
                        Edit
                    </Button>
                </Link>
            </div>
        )
    }

    if (event.type === 'transaksi') {
        return (
            <div className="flex gap-1">
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-7 text-[10px] gap-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleDeleteTransaksi}
                    disabled={loading}
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    Hapus
                </Button>
                <Link href={`/transaksi?search=${encodeURIComponent(event.title)}`}>
                    <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2">
                        <Copy className="w-3 h-3" />
                        Duplikat
                    </Button>
                </Link>
            </div>
        )
    }

    return null
}