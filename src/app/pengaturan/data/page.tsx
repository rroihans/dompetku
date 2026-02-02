"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Database,
    Download,
    Upload,
    Trash2,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ChevronLeft,
    RotateCcw
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
import { exportData as exportBackup, importData as importBackup, resetAllData } from "@/lib/db/backup"
import { resetOnboardingStatus } from "@/lib/db/onboarding-repo"
import { isDummyDataActive } from "@/lib/db/dummy-data-repo"
import Link from "next/link"
import { toast } from "sonner"

export default function DataSettingsPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resetOnboardingDialogOpen, setResetOnboardingDialogOpen] = useState(false)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultSuccess, setResultSuccess] = useState(false)
    const [showDevTools, setShowDevTools] = useState(false)

    // Check if dev tools should be shown (demo mode active)
    useState(() => {
        isDummyDataActive().then(setShowDevTools)
    })

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
                setResultMessage("Reset berhasil! Semua data telah dihapus.\n\nAnda akan dialihkan ke onboarding dalam 3 detik...")
                setResultDialogOpen(true)

                setTimeout(() => {
                    router.push("/onboarding")
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

    // Handler untuk reset onboarding (dev tools)
    const handleResetOnboarding = async () => {
        setLoading(true)
        try {
            const result = await resetOnboardingStatus()
            if (result.success) {
                setResetOnboardingDialogOpen(false)
                toast.success("Onboarding berhasil direset. Silakan refresh halaman.")
                router.push("/onboarding")
            } else {
                toast.error(result.error || "Gagal mereset onboarding")
            }
        } catch (err) {
            toast.error("Terjadi kesalahan: " + (err as Error).message)
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
                        Kelola dan amankan data keuangan Anda
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

                {/* Developer Tools - Only show when demo mode is active */}
                {showDevTools && (
                    <Card className="border-dashed border-amber-500/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-amber-600">
                                <RotateCcw className="w-5 h-5" />
                                Developer Tools
                            </CardTitle>
                            <CardDescription>
                                Opsi pengembangan (hanya muncul saat mode demo aktif)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                variant="outline"
                                className="w-full justify-between h-auto py-4 hover:bg-amber-500/5 border-amber-500/30"
                                onClick={() => setResetOnboardingDialogOpen(true)}
                                disabled={loading}
                            >
                                <div className="flex items-center gap-3">
                                    <RotateCcw className="w-5 h-5 text-amber-500" />
                                    <div className="text-left">
                                        <div className="font-medium">Reset Onboarding</div>
                                        <div className="text-xs text-muted-foreground">
                                            Kembali ke wizard onboarding untuk testing.
                                        </div>
                                    </div>
                                </div>
                            </Button>
                        </CardContent>
                    </Card>
                )}
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

            {/* Dialog Konfirmasi Reset Onboarding */}
            <AlertDialog open={resetOnboardingDialogOpen} onOpenChange={setResetOnboardingDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
                            <RotateCcw className="w-5 h-5" />
                            Reset Onboarding?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Ini akan menandai onboarding sebagai belum selesai. Anda akan diarahkan ke wizard onboarding saat mengunjungi dashboard.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleResetOnboarding}
                            disabled={loading}
                            className="bg-amber-500 hover:bg-amber-600"
                        >
                            {loading ? "Mereset..." : "Ya, Reset Onboarding"}
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
        </div>
    )
}
