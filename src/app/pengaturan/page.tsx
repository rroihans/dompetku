"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Settings,
    Database,
    Shield,
    Palette,
    Info,
    ExternalLink,
    ChevronRight,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    CreditCard,
    Target,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    Loader2,
    FileText
} from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
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
import { getLogData } from "@/lib/db/debug-repo"
import { checkDatabaseIntegrity, fixDatabaseIntegrity, type IntegrityReport } from "@/lib/db/integrity-repo"
import { saveNetWorthSnapshot } from "@/lib/db/networth-repo"
import { CurrencySettings } from "@/components/settings/currency-settings"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FinancialAutomationCard } from "@/components/settings/financial-automation-card"
import { useEffect, useCallback } from "react"

interface LogEntry {
    id: string
    level: string
    pesan: string
    createdAt: Date | string
}

export default function PengaturanPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultSuccess, setResultSuccess] = useState(false)
    const [lastLogs, setLastLogs] = useState<LogEntry[]>([])

    // Integrity check states
    const [integrityLoading, setIntegrityLoading] = useState(false)
    const [integrityReport, setIntegrityReport] = useState<IntegrityReport | null>(null)
    const [integrityDialogOpen, setIntegrityDialogOpen] = useState(false)

    // Selective Export states
    const [selectiveExportOpen, setSelectiveExportOpen] = useState(false)
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['akun', 'transaksi', 'budget'])

    const fetchLogs = useCallback(async () => {
        try {
            // Fetch logs for AUTOMASI context (used by recurring-admin.ts)
            const res = await getLogData(1, "AUTOMASI")

            const allLogs = (res.data || [])
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)

            setLastLogs(allLogs)
        } catch (err) {
            console.error("Failed to fetch logs:", err)
        }
    }, [])

    // Load logs for automation card
    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // Handler untuk ekspor backup
    const handleExport = async () => {
        setLoading(true)
        try {
            const result = await exportBackup()

            if (result) {
                // Buat dan download file JSON
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
            // Reset file input
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

                // Redirect ke halaman utama setelah 3 detik
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

    const handleSelectiveExport = async () => {
        if (selectedTypes.length === 0) {
            alert("Pilih minimal satu tipe data")
            return
        }

        setLoading(true)
        try {
            const result = await exportSelective(selectedTypes)
            if (result.success && result.data) {
                const jsonString = JSON.stringify(result.data, null, 2)
                const blob = new Blob([jsonString], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const date = new Date().toISOString().split('T')[0]
                const filename = `dompetku-selective-${date}.json`

                const a = document.createElement("a")
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                setSelectiveExportOpen(false)
                setResultSuccess(true)
                setResultMessage(`Export selektif berhasil! Tipe data: ${selectedTypes.join(', ')}`)
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
        <div className="space-y-6 max-w-full overflow-hidden">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Konfigurasi aplikasi dan preferensi pembukuan Anda.
                </p>
            </div>

            <div className="grid gap-6 max-w-full">
                {/* Tampilan & Tema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Tampilan & Tema
                        </CardTitle>
                        <CardDescription>Sesuaikan bagaimana Dompetku terlihat di perangkat Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="font-medium">Mode Gelap / Terang</div>
                                <div className="text-xs text-muted-foreground">Ubah skema warna aplikasi.</div>
                            </div>
                            <div className="shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pintasan Cepat */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Pintasan Cepat
                        </CardTitle>
                        <CardDescription>Akses cepat ke fitur-fitur utama.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 md:grid-cols-2">
                        <Link href="/akun" className="block w-full">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-primary/5">
                                <Wallet className="w-5 h-5 mr-3 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Kelola Akun</div>
                                    <div className="text-xs text-muted-foreground truncate">Bank, E-Wallet, Kartu Kredit</div>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/cicilan" className="block w-full">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-primary/5">
                                <CreditCard className="w-5 h-5 mr-3 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Cicilan</div>
                                    <div className="text-xs text-muted-foreground truncate">Kelola kartu kredit</div>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/recurring" className="block w-full">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-primary/5">
                                <RefreshCw className="w-5 h-5 mr-3 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Transaksi Berulang</div>
                                    <div className="text-xs text-muted-foreground truncate">Tagihan otomatis</div>
                                </div>
                            </Button>
                        </Link>
                        <Link href="/anggaran" className="block w-full">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-primary/5">
                                <Target className="w-5 h-5 mr-3 shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Anggaran</div>
                                    <div className="text-xs text-muted-foreground truncate">Batas pengeluaran</div>
                                </div>
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Sistem Pembukuan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            Sistem Pembukuan
                        </CardTitle>
                        <CardDescription>Konfigurasi standar akuntansi yang digunakan.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                            <div className="space-y-0.5">
                                <div className="font-medium flex items-center gap-2">
                                    Standar PSAK Indonesia
                                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">Aktif</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Gunakan klasifikasi akun sesuai standar PSAK Indonesia.</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
                            <div className="space-y-0.5">
                                <div className="font-medium flex items-center gap-2">
                                    Double-Entry Bookkeeping
                                    <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">Aktif</span>
                                </div>
                                <div className="text-xs text-muted-foreground">Setiap transaksi memiliki akun Debit & Kredit untuk integritas data.</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

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
                            <ChevronRight className="w-4 h-4" />
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
                            <ChevronRight className="w-4 h-4" />
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
                            <ChevronRight className="w-4 h-4" />
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
                            <ChevronRight className="w-4 h-4" />
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
                            <ChevronRight className="w-4 h-4" />
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
                                    <div className="text-xs text-muted-foreground">Reset aplikasi ke kondisi awal. Pastikan sudah backup!</div>
                                </div>
                            </div>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Automasi Keuangan */}
                <FinancialAutomationCard lastLogs={lastLogs} onProcessComplete={fetchLogs} />

                {/* Multi-Currency Settings */}
                <CurrencySettings />

                {/* Developer Tools */}
                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-muted-foreground">
                            <Settings className="w-5 h-5" />
                            Developer Tools
                        </CardTitle>
                        <CardDescription>Fitur untuk pengembangan dan debugging.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/devdb">
                            <Button variant="outline" className="w-full justify-between h-auto py-3">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4" />
                                    <div className="text-left">
                                        <div className="font-medium">Database Inspector</div>
                                        <div className="text-xs text-muted-foreground">Lihat isi database secara langsung.</div>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Tentang Aplikasi */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Tentang Aplikasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                            <span className="text-muted-foreground">Versi Aplikasi</span>
                            <span className="font-mono bg-muted px-2 py-1 rounded">v0.2.0-beta</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                            <span className="text-muted-foreground">Framework</span>
                            <span className="font-medium">Next.js + Prisma</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                            <span className="text-muted-foreground">Database</span>
                            <span className="font-medium">SQLite (Lokal)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 rounded hover:bg-muted/50">
                            <span className="text-muted-foreground">Lisensi</span>
                            <span className="font-medium">MIT License</span>
                        </div>

                        <div className="pt-4 flex flex-wrap gap-3 border-t">
                            <a href="https://iaiglobal.or.id/v03/standar-akuntansi-keuangan/pernyataan-sak" target="_blank" rel="noopener noreferrer">
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    Dokumentasi PSAK <ExternalLink className="w-3 h-3" />
                                </Button>
                            </a>
                            <Link href="/laporan">
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    Lihat Laporan <ChevronRight className="w-3 h-3" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Maintenance Section for PWA */}
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-emerald-600" />
                            Maintenance & PWA
                        </CardTitle>
                        <CardDescription>Alat perbaikan data untuk versi Offline PWA.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-3 bg-background"
                            onClick={async () => {
                                if (!confirm("Isi data dummy? Data lama akan dihapus.")) return;
                                setLoading(true);
                                try {
                                    const { seedDummyData } = await import("@/lib/db/seed");
                                    await seedDummyData();
                                    const { rebuildSummaries } = await import("@/lib/db/maintenance");
                                    await rebuildSummaries();
                                    alert("Data seeded & summaries rebuilt!");
                                    router.push("/");
                                } catch (e) {
                                    alert("Error: " + e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-emerald-600" />
                                <div className="text-left">
                                    <div className="font-medium">Seed Dummy Data</div>
                                    <div className="text-xs text-muted-foreground">Isi database lokal dengan data contoh</div>
                                </div>
                            </div>
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full justify-between h-auto py-3 bg-background"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const { rebuildSummaries } = await import("@/lib/db/maintenance");
                                    await rebuildSummaries();
                                    alert("Summaries berhasil direbuild ulang dari transaksi raw.");
                                    router.refresh();
                                } catch (e) {
                                    alert("Error: " + e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            disabled={loading}
                        >
                            <div className="flex items-center gap-3">
                                <RefreshCw className="w-4 h-4 text-emerald-600" />
                                <div className="text-left">
                                    <div className="font-medium">Rebuild Analytics</div>
                                    <div className="text-xs text-muted-foreground">Hitung ulang dashboard jika data tidak sinkron</div>
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
                                    <li>Semua akun (Bank, E-Wallet, Kartu Kredit)</li>
                                    <li>Semua transaksi</li>
                                    <li>Semua cicilan dan recurring</li>
                                    <li>Semua anggaran</li>
                                </ul>
                                <p className="font-semibold text-destructive">Tindakan ini TIDAK DAPAT dibatalkan!</p>
                                <p>Pastikan Anda sudah melakukan backup terlebih dahulu.</p>
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
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                "Ya, Hapus Semua"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Hasil */}
            <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {resultSuccess ? (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    Berhasil
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-destructive" />
                                    Gagal
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription className="whitespace-pre-line">
                            {resultMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setResultDialogOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Integritas */}
            <Dialog open={integrityDialogOpen} onOpenChange={setIntegrityDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-amber-500" />
                            Laporan Integritas Database
                        </DialogTitle>
                        <DialogDescription>
                            Hasil pemindaian konsistensi data sistem.
                        </DialogDescription>
                    </DialogHeader>

                    {integrityReport && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Orphaned Recurring</p>
                                    <p className={`text-xl font-bold ${integrityReport.orphanedRecurring > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {integrityReport.orphanedRecurring}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Orphaned Cicilan</p>
                                    <p className={`text-xl font-bold ${integrityReport.orphanedCicilan > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {integrityReport.orphanedCicilan}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-lg bg-muted/50">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Mismatched Admin</p>
                                    <p className={`text-xl font-bold ${integrityReport.mismatchedAdminFees > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {integrityReport.mismatchedAdminFees}
                                    </p>
                                </div>
                                <div className="p-3 border rounded-lg bg-primary/5 border-primary/20">
                                    <p className="text-[10px] text-primary uppercase font-bold">Total Masalah</p>
                                    <p className="text-xl font-bold text-primary">
                                        {integrityReport.totalIssues}
                                    </p>
                                </div>
                            </div>

                            {integrityReport.totalIssues > 0 ? (
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                    <div className="flex gap-2 text-amber-800 dark:text-amber-300">
                                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p className="text-xs">
                                            Ditemukan ketidakkonsistenan data. Hal ini bisa terjadi jika akun dihapus namun data terkait masih tersisa. Disarankan untuk melakukan perbaikan otomatis.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                                    <div className="flex gap-2 text-emerald-800 dark:text-emerald-300">
                                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                                        <p className="text-xs">
                                            Luar biasa! Tidak ditemukan masalah integritas data. Semua record terhubung dengan benar.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button variant="ghost" onClick={() => setIntegrityDialogOpen(false)} disabled={integrityLoading}>
                            Tutup
                        </Button>
                        {integrityReport && integrityReport.totalIssues > 0 && (
                            <Button
                                onClick={handleFixIntegrity}
                                disabled={integrityLoading}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                {integrityLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Memperbaiki...
                                    </>
                                ) : (
                                    "Perbaiki Otomatis"
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Export Selektif */}
            <Dialog open={selectiveExportOpen} onOpenChange={setSelectiveExportOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-500" />
                            Export Data Selektif
                        </DialogTitle>
                        <DialogDescription>
                            Pilih jenis data yang ingin Anda ekspor ke file JSON.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        {[
                            { id: 'akun', label: 'Daftar Akun' },
                            { id: 'transaksi', label: 'Histori Transaksi' },
                            { id: 'cicilan', label: 'Rencana Cicilan' },
                            { id: 'recurring', label: 'Transaksi Berulang' },
                            { id: 'budget', label: 'Anggaran Bulanan' },
                            { id: 'template', label: 'Template Pengaturan' }
                        ].map((type) => (
                            <div key={type.id} className="flex items-center space-x-3">
                                <Checkbox
                                    id={type.id}
                                    checked={selectedTypes.includes(type.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedTypes([...selectedTypes, type.id])
                                        } else {
                                            setSelectedTypes(selectedTypes.filter(t => t !== type.id))
                                        }
                                    }}
                                />
                                <Label htmlFor={type.id} className="text-sm font-medium leading-none cursor-pointer">
                                    {type.label}
                                </Label>
                            </div>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setSelectiveExportOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleSelectiveExport} disabled={loading || selectedTypes.length === 0}>
                            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                            Export Sekarang
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
