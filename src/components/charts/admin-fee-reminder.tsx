"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Receipt, AlertCircle, Loader2 } from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { processMonthlyAdminFees } from "@/lib/db/recurring-repo"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AdminFeeReminderProps {
    fees: {
        akunId: string
        namaAkun: string
        nominal: number | null
        tanggal: Date
    }[]
}

export function AdminFeeReminder({ fees }: AdminFeeReminderProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: number, failed: number } | null>(null)

    if (!fees || fees.length === 0) return null

    const handleProcess = async () => {
        setLoading(true)
        setResult(null)
        const toastId = toast.loading("Memproses biaya admin...")
        try {
            const res = await processMonthlyAdminFees(false)
            if (res.success) {
                setResult({ success: res.processed || 0, failed: res.failed || 0 })
                if ((res.failed || 0) === 0) {
                    toast.success(`Berhasil memproses ${res.processed} biaya admin.`, { id: toastId })
                    router.refresh()
                } else {
                    toast.warning(`Proses Selesai dengan Masalah`, {
                        description: `${res.processed} berhasil, ${res.failed} gagal. Periksa log untuk detail.`,
                        id: toastId
                    })
                }
            } else {
                toast.error("Gagal memproses biaya admin", {
                    description: res.error || "Terjadi kesalahan sistem",
                    id: toastId
                })
            }
        } catch {
            toast.error("Terjadi kesalahan sistem", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20 mb-6">
            <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900 mt-1">
                            <Receipt className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2 text-base">
                                Pengingat Biaya Admin
                                <AlertCircle className="w-4 h-4" />
                            </h3>
                            <div className="mt-1 space-y-1">
                                {fees.map((fee, idx) => (
                                    <p key={idx} className="text-sm text-amber-800/80 dark:text-amber-400/80">
                                        • <strong>{fee.namaAkun}</strong>:
                                        <span className="font-semibold" data-private="true"> {formatRupiah(fee.nominal || 0)}</span> pada {new Date(fee.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                    </p>
                                ))}
                            </div>

                            {result && (
                                <div className="mt-2 flex gap-3">
                                    <span className="text-xs font-bold text-emerald-600">✓ {result.success} Berhasil</span>
                                    {result.failed > 0 && <span className="text-xs font-bold text-red-600">✗ {result.failed} Gagal</span>}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        {result && result.failed > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push('/pengaturan')}
                                className="text-xs"
                            >
                                Lihat Log
                            </Button>
                        )}
                        <Button
                            onClick={handleProcess}
                            disabled={loading}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                "Proses Sekarang"
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
