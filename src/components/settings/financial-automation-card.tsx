"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Zap,
    Receipt,
    Percent,
    LayoutGrid,
    ChevronRight,
    ChevronLeft,
    Loader2,
    History,
    CheckCircle2,
    AlertCircle,
    X
} from "lucide-react"
import Link from "next/link"
import { processMonthlyAdminFees, processMonthlyInterest } from "@/lib/db/recurring-repo"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface LogEntry {
    id: string
    level: string
    pesan: string
    createdAt: Date | string
}

interface FinancialAutomationCardProps {
    lastLogs: LogEntry[]
    onProcessComplete?: () => void
}

// Parse log pesan to extract account details
function parseLogDetails(pesan: string): { accounts: { name: string; reason: string }[]; summary: string } {
    // Example: "Akun di-skip: BCA Tahapan (Sudah diproses bulan ini), TEST (Sudah diproses bulan ini)..."
    const skipMatch = pesan.match(/Akun di-skip: (.+)/)
    if (skipMatch) {
        const accountsStr = skipMatch[1].replace(/\.\.\.$/, '') // Remove trailing ...
        const accounts: { name: string; reason: string }[] = []

        // Split by pattern: "name (reason)," - more robust parsing
        const parts = accountsStr.split(/\),\s*/)
        for (const part of parts) {
            if (!part.trim()) continue
            const match = part.match(/^([^(]+)\s*\(([^)]+)\)?$/)
            if (match) {
                const name = match[1].trim().replace(/^,\s*/, '') // Remove leading comma if any
                const reason = match[2].trim()
                if (name) {
                    accounts.push({ name, reason })
                }
            }
        }
        return { accounts, summary: "Akun yang di-skip" }
    }

    // Check for processed message
    const processMatch = pesan.match(/diproses: (\d+) berhasil/)
    if (processMatch) {
        return { accounts: [], summary: pesan }
    }

    return { accounts: [], summary: pesan }
}

export function FinancialAutomationCard({ lastLogs, onProcessComplete }: FinancialAutomationCardProps) {
    const router = useRouter()
    const [loadingAdmin, setLoadingAdmin] = useState(false)
    const [loadingInterest, setLoadingInterest] = useState(false)
    const [isDryRun, setIsDryRun] = useState(false)

    // Dialog state
    const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
    const [currentPage, setCurrentPage] = useState(0)
    const ITEMS_PER_PAGE = 5

    const handleProcessAdmin = async () => {
        const msg = isDryRun
            ? "Simulasi biaya admin bulanan? (Tidak akan membuat transaksi asli)"
            : "Proses biaya admin bulanan untuk semua akun yang memenuhi kriteria?"

        if (!confirm(msg)) return

        setLoadingAdmin(true)
        const toastId = toast.loading("Memproses biaya admin...")
        try {
            const res = await processMonthlyAdminFees(isDryRun)
            if (res.success) {
                if (isDryRun) {
                    toast.info(`Simulasi Selesai`, {
                        description: `${res.processed} biaya admin terdeteksi akan diproses.`,
                        id: toastId
                    })
                } else {
                    if (res.failed === 0) {
                        toast.success(`Berhasil memproses ${res.processed} biaya admin.`, { id: toastId })
                    } else {
                        toast.warning(`Proses Selesai dengan Masalah`, {
                            description: `${res.processed} berhasil, ${res.failed} gagal. Periksa log untuk detail.`,
                            id: toastId
                        })
                    }
                }
                router.refresh()
                if (onProcessComplete) onProcessComplete()
            } else {
                toast.error("Gagal memproses biaya admin", {
                    description: res.error || "Terjadi kesalahan sistem",
                    id: toastId
                })
            }
        } catch {
            toast.error("Terjadi kesalahan sistem", { id: toastId })
        } finally {
            setLoadingAdmin(false)
        }
    }

    const handleProcessInterest = async () => {
        const msg = isDryRun
            ? "Simulasi kredit bunga bulanan? (Tidak akan membuat transaksi asli)"
            : "Proses kredit bunga bulanan untuk semua akun yang memiliki otomasi bunga aktif?"

        if (!confirm(msg)) return

        setLoadingInterest(true)
        const toastId = toast.loading("Memproses bunga tabungan...")
        try {
            const res = await processMonthlyInterest(isDryRun)
            if (res.success) {
                if (isDryRun) {
                    toast.info(`Simulasi Selesai`, {
                        description: `${res.processed} bunga tabungan terdeteksi akan dikreditkan.`,
                        id: toastId
                    })
                } else {
                    if (res.failed === 0) {
                        toast.success(`Berhasil mengkreditkan ${res.processed} bunga tabungan.`, { id: toastId })
                    } else {
                        toast.warning(`Proses Selesai dengan Masalah`, {
                            description: `${res.processed} berhasil, ${res.failed} gagal. Periksa log untuk detail.`,
                            id: toastId
                        })
                    }
                }
                router.refresh()
                if (onProcessComplete) onProcessComplete()
            } else {
                toast.error("Gagal memproses bunga", {
                    description: res.error || "Terjadi kesalahan sistem",
                    id: toastId
                })
            }
        } catch {
            toast.error("Terjadi kesalahan sistem", { id: toastId })
        } finally {
            setLoadingInterest(false)
        }
    }

    // Get parsed details for selected log
    const logDetails = selectedLog ? parseLogDetails(selectedLog.pesan) : null
    const totalPages = logDetails ? Math.ceil(logDetails.accounts.length / ITEMS_PER_PAGE) : 0
    const paginatedAccounts = logDetails?.accounts.slice(
        currentPage * ITEMS_PER_PAGE,
        (currentPage + 1) * ITEMS_PER_PAGE
    ) || []

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500" />
                                Automasi Keuangan
                            </CardTitle>
                            <CardDescription>Otomatisasi biaya rutin perbankan dan bunga tabungan.</CardDescription>
                        </div>
                        <Button
                            variant={isDryRun ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsDryRun(!isDryRun)}
                            className={isDryRun ? "bg-amber-500 hover:bg-amber-600" : ""}
                        >
                            {isDryRun ? "Mode Simulasi: ON" : "Simulasi Off"}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-2">
                        <Button
                            variant="outline"
                            className="h-auto py-3 justify-start"
                            onClick={handleProcessAdmin}
                            disabled={loadingAdmin}
                        >
                            {loadingAdmin ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Receipt className="w-4 h-4 mr-3 text-red-500" />}
                            <div className="text-left">
                                <div className="font-medium">Proses Biaya Admin</div>
                                <div className="text-[10px] text-muted-foreground">Eksekusi tagihan bulan berjalan</div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="h-auto py-3 justify-start"
                            onClick={handleProcessInterest}
                            disabled={loadingInterest}
                        >
                            {loadingInterest ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Percent className="w-4 h-4 mr-3 text-emerald-500" />}
                            <div className="text-left">
                                <div className="font-medium">Proses Bunga</div>
                                <div className="text-[10px] text-muted-foreground">Kreditkan bunga bulan lalu</div>
                            </div>
                        </Button>
                    </div>

                    <Link href="/template-admin-dan-bunga-bank" className="block">
                        <Button variant="secondary" className="w-full justify-between group">
                            <div className="flex items-center gap-2">
                                <LayoutGrid className="w-4 h-4" />
                                <span>Template Admin dan Bunga Bank</span>
                            </div>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>

                    {/* Last Logs - Clickable for popup */}
                    <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                <History className="w-3 h-3" />
                                Log Automasi Terakhir
                            </div>
                            <Link href="/debug-automation">
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                                    Lihat Semua
                                </Button>
                            </Link>
                        </div>
                        {lastLogs.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-2">Belum ada aktivitas automasi.</p>
                        ) : (
                            <div className="space-y-1.5">
                                {lastLogs.slice(0, 8).map((log) => (
                                    <button
                                        key={log.id}
                                        onClick={() => { setSelectedLog(log); setCurrentPage(0); }}
                                        className="w-full flex items-start gap-2 p-2 rounded bg-muted/50 text-[10px] cursor-pointer hover:bg-muted/80 transition-colors text-left"
                                    >
                                        {log.level === 'ERROR' ? (
                                            <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                                        ) : (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium line-clamp-1">{log.pesan}</p>
                                            <p className="text-muted-foreground">{new Date(log.createdAt).toLocaleString('id-ID')}</p>
                                        </div>
                                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Log Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
                <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedLog?.level === 'ERROR' ? (
                                <AlertCircle className="w-5 h-5 text-red-500" />
                            ) : (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            )}
                            Detail Log Automasi
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            {/* Timestamp */}
                            <div className="text-xs text-muted-foreground">
                                {new Date(selectedLog.createdAt).toLocaleString('id-ID', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>

                            {/* Full Message */}
                            <div className="p-3 bg-muted rounded-lg">
                                <p className="text-sm whitespace-pre-wrap break-words">{selectedLog.pesan}</p>
                            </div>

                            {/* Account Details List */}
                            {logDetails && logDetails.accounts.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-semibold">{logDetails.summary} ({logDetails.accounts.length})</h4>
                                        {totalPages > 1 && (
                                            <div className="flex items-center gap-2 text-xs">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                                    disabled={currentPage === 0}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <span>{currentPage + 1} / {totalPages}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                                    disabled={currentPage >= totalPages - 1}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        {paginatedAccounts.map((acc, i) => (
                                            <div key={i} className="flex justify-between items-start p-2 bg-muted/50 rounded border text-sm">
                                                <div className="font-medium">{acc.name}</div>
                                                <div className="text-xs text-muted-foreground text-right max-w-[50%]">{acc.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}
