"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Database,
    Shield,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    FileText,
    ChevronLeft
} from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { exportData as exportBackup, importData as importBackup, resetAllData, exportSelective } from "@/lib/db/backup"
import { checkDatabaseIntegrity, fixDatabaseIntegrity, type IntegrityReport } from "@/lib/db/integrity-repo"
import { saveNetWorthSnapshot } from "@/lib/db/networth-repo"
import Link from "next/link"

export default function DataSettingsPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultSuccess, setResultSuccess] = useState(false)

    // Integrity check states
    const [integrityLoading, setIntegrityLoading] = useState(false)
    const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null)
    const [integrityDialogOpen, setIntegrityDialogOpen] = useState(false)

    // Selective Export states
    const [selectiveExportOpen, setSelectiveExportOpen] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['akun', 'transaksi', 'budget'])

    // Handler untuk ekspor backup
    const handleExport = async () => {
        setLoading(true)
        try {
            const result = await exportBackup()

            if (result) {
                const jsonString = JSON.stringify(result, null, 2)
                const blob = new Blob([jsonString], { type: "application/json" })
                const url = URL.createObjectURL(blob)

                const date = new Date().toISOString().split('T')[0]
                const filename = `dompetku-backup-${date}.json`

                const a = document.createElement("a")
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                const stats = result.stats || { totalAkun: 0, totalTransaksi: 0, totalCicilan: 0, totalBudget: 0 }

                setResultSuccess(true)
                setResultMessage(`Backup berhasil! File ${filename} telah diunduh.\n\nStatistik:\n• ${stats.totalAkun} akun\n• ${stats.totalTransaksi} transaksi\n• ${stats.totalCicilan} cicilan\n• ${stats.totalBudget} anggaran`)
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
        }
    }

    // Handler untuk import restore
    const handleImport = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const content = await file.text()
            const result = await importBackup(JSON.parse(content))

            if (result.success) {
                const stats = result.stats
                setResultSuccess(true)
                setResultMessage(
                    `Restore berhasil!\n\nDiimpor:\n• ${stats?.imported.akun} akun\n• ${stats?.imported.transaksi} transaksi\n• ${stats?.imported.cicilan} cicilan\n• ${stats?.imported.recurring} recurring\n• ${stats?.imported.budget} anggaran\n\nDilewati (sudah ada):\n• ${stats?.skipped.akun} akun\n• ${stats?.skipped.transaksi} transaksi`
                )
                setResultDialogOpen(true)
                router.refresh()
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Handler untuk reset data
    const handleReset = async () => {
        setLoading(true)
        try {
            const result = await resetAllData()

            if (result.success) {
                setResetDialogOpen(false)
                setResultSuccess(true)
                setResultMessage("Reset berhasil! Semua data telah dihapus.\n\nAnda akan dialihkan ke halaman utama dalam 3 detik...")
                setResultDialogOpen(true)

                setTimeout(() => {
                    router.push("/")
                    router.refresh()
                }, 3000)
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal melakukan reset")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
        }
    }

    // Handler untuk cek integritas
    const handleCheckIntegrity = async () => {
        setIntegrityLoading(true)
        try {
            const result = await checkDatabaseIntegrity()
            if (result.success && result.data) {
                setIntegrityReport(result.data)
                setIntegrityDialogOpen(true)
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal mengecek integritas")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setIntegrityLoading(false)
        }
    }

    // Handler untuk perbaikan integritas
    const handleFixIntegrity = async () => {
        setIntegrityLoading(true)
        try {
            const result = await fixDatabaseIntegrity()
            if (result.success) {
                setIntegrityDialogOpen(false)
                setResultSuccess(true)
                setResultMessage(`Perbaikan berhasil! ${result.fixedCount} masalah telah diselesaikan.`)
                setResultDialogOpen(true)
                router.refresh()
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal memperbaiki integritas")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setIntegrityLoading(false)
        }
    }

    // Handler untuk manual snapshot
    const handleSaveSnapshot = async () => {
        setLoading(true)
        try {
            const result = await saveNetWorthSnapshot()
            if (result.success) {
                setResultSuccess(true)
                setResultMessage("Snapshot kekayaan bersih berhasil disimpan!")
                setResultDialogOpen(true)
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal menyimpan snapshot")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-full pb-20">
            <div className="flex items-center gap-3">
                <Link href="/pengaturan">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Data & Backup</h2>
                    <p className="text-muted-foreground text-sm">
                        Kelola data, backup, dan maintenance
                    </p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            <div className="grid gap-6">
                {/* Data & Backup */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Data & Backup
                        </CardTitle>
                        <CardDescription>Kelola dan amankan data keuangan Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-primary/5"
                            onClick={handleExport}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                                ) : (
                                    <Download className="w-5 h-5 text-primary" />
                                )}
                                <div className="text-left">
                                    <div className="font-medium">Backup / Ekspor Data</div>
                                    <div className="text-xs text-muted-foreground">Unduh semua data ke file JSON.</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-primary/5"
                            onClick={() => setSelectiveExportOpen(true)}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-500" />
                                <div className="text-left">
                                    <div className="font-medium">Export Selektif</div>
                                    <div className="text-xs text-muted-foreground">Ekspor hanya kategori data tertentu.</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-primary/5"
                            onClick={handleImport}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                                ) : (
                                    <Upload className="w-5 h-5 text-blue-500" />
                                )}
                                <div className="text-left">
                                    <div className="font-medium">Restore / Impor Data</div>
                                    <div className="text-xs text-muted-foreground">Pulihkan data dari file backup JSON.</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-primary/5"
                            onClick={handleCheckIntegrity}
                            disabled={integrityLoading}
                        >
                            <div className="flex items-center gap-3">
                                {integrityLoading ? (
                                    <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
                                ) : (
                                    <Shield className="w-5 h-5 text-amber-500" />
                                )}
                                <div className="text-left">
                                    <div className="font-medium">Periksa Integritas Database</div>
                                    <div className="text-xs text-muted-foreground">Cek dan perbaiki data yang tidak konsisten.</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-primary/5"
                            onClick={handleSaveSnapshot}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                {loading ? (
                                    <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-5 h-5 text-emerald-500" />
                                )}
                                <div className="text-left">
                                    <div className="font-medium">Simpan Snapshot Kekayaan</div>
                                    <div className="text-xs text-muted-foreground">Ambil snapshot net worth sekarang secara manual.</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-4 hover:bg-destructive/5 text-destructive hover:text-destructive"
                            onClick={() => setResetDialogOpen(true)}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                <Trash2 className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-medium">Hapus Seluruh Data</div>
                                    <div className="text-xs text-muted-foreground">Reset aplikasi ke kondisi awal.</div>
                                </div>
                            </div>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Dialog Konfirmasi Reset */}
            <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="w-5 h-5" />
                            Hapus Seluruh Data?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-muted-foreground text-sm">
                                <p>Tindakan ini akan menghapus <strong>semua data</strong> termasuk:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Semua akun, transaksi, cicilan, recurring, anggaran</li>
                                </ul>
                                <p className="font-semibold text-destructive">Tindakan ini TIDAK DAPAT dibatalkan!</p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            disabled={loading}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {loading ? "Menghapus..." : "Ya, Hapus Semua"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Hasil */}
            <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {resultSuccess ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                            {resultSuccess ? "Berhasil" : "Gagal"}
                        </DialogTitle>
                        <DialogDescription className="whitespace-pre-line">{resultMessage}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setResultDialogOpen(false)}>Tutup</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Integritas */}
            <Dialog open={integrityDialogOpen} onOpenChange={setIntegrityDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Laporan Integritas
                        </DialogTitle>
                        <DialogDescription>Hasil pemindaian konsistensi data sistem.</DialogDescription>
                    </DialogHeader>
                    {integrityReport && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Orphaned Recurring</p>
                                    <p className={`text-xl font-bold ${integrityReport.orphanedRecurring > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{integrityReport.orphanedRecurring}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Orphaned Cicilan</p>
                                    <p className={`text-xl font-bold ${integrityReport.orphanedCicilan > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{integrityReport.orphanedCicilan}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Mismatched Admin</p>
                                    <p className={`text-xl font-bold ${integrityReport.mismatchedAdminFees > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{integrityReport.mismatchedAdminFees}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Negative Installments</p>
                                    <p className={`text-xl font-bold ${integrityReport.negativeInstallments > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{integrityReport.negativeInstallments}</p>
                                </div>
                            </div>
                            {integrityReport.orphanedCicilan > 0 || integrityReport.orphanedRecurring > 0 || integrityReport.mismatchedAdminFees > 0 || integrityReport.negativeInstallments > 0 ? (
                                <Button onClick={handleFixIntegrity} disabled={integrityLoading} className="w-full">
                                    {integrityLoading ? "Memperbaiki..." : "Perbaiki Masalah"}
                                </Button>
                            ) : (
                                <p className="text-center text-sm text-emerald-500 font-medium">Sistem dalam keadaan sehat.</p>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

        </div>
    )
}
