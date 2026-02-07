"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    RefreshCw,
    Calendar,
    Wallet,
    TrendingUp,
    TrendingDown,
    Zap,
    ArrowLeft,
    Shield
} from "lucide-react"
import { getRecurringTransactions } from "@/lib/db/recurring-repo"
import { getAkun } from "@/lib/db/accounts-repo"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { AddRecurringForm } from "@/components/forms/add-recurring-form"
import { RecurringActions } from "@/components/recurring/recurring-actions"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import type { AccountDTO } from "@/lib/account-dto"
import type { RecurringTransactionDTO } from "@/lib/db/recurring-repo"

const FREKUENSI_LABEL: Record<string, string> = {
    HARIAN: "Setiap Hari",
    MINGGUAN: "Setiap Minggu",
    BULANAN: "Setiap Bulan",
    TAHUNAN: "Setiap Tahun",
}

const HARI_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export default function RecurringPage() {
    const [recurring, setRecurring] = useState<RecurringTransactionDTO[]>([])
    const [accounts, setAccounts] = useState<AccountDTO[]>([])
    const [loading, setLoading] = useState(true)

    async function loadData() {
        try {
            const [recurringResult, accountsResult] = await Promise.all([
                getRecurringTransactions(),
                getAkun()
            ])

            if (recurringResult.success) {
                setRecurring(recurringResult.data || [])
            }
            setAccounts(accountsResult)
        } catch (error) {
            console.error(error)
            toast.error("Gagal memuat data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()

        const handleAccountUpdate = () => {
            loadData()
        }

        window.addEventListener('account-updated', handleAccountUpdate)
        return () => window.removeEventListener('account-updated', handleAccountUpdate)
    }, [])

    const handleRefresh = () => {
        loadData()
    }

    if (loading) {
        return <div className="p-8 text-center">Memuat data transaksi berulang...</div>
    }

    // Buat map akun
    const akunMap = new Map(accounts.map((a) => [a.id, a.nama]))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaksi Berulang</h2>
                    <p className="text-muted-foreground">
                        Kelola transaksi otomatis yang berjalan secara berkala.
                    </p>
                </div>
                <AddRecurringForm
                    accounts={accounts.filter((a) =>
                        ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                    )}
                    onRefresh={handleRefresh}
                />
            </div>

            {recurring.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Transaksi Berulang</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Buat transaksi berulang untuk otomatisasi pencatatan seperti gaji, tagihan bulanan, atau langganan.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recurring.map((item) => (
                        <Card
                            key={item.id}
                            className={`relative overflow-hidden border-l-4 ${item.aktif
                                ? item.tipeTransaksi === "MASUK"
                                    ? "border-l-emerald-500"
                                    : "border-l-red-500"
                                : "border-l-gray-400 opacity-60"
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.tipeTransaksi === "MASUK" ? (
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-500" />
                                        )}
                                        <div className="flex flex-col">
                                            <CardTitle className="text-lg">{item.nama}</CardTitle>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {item.isAutoGenerated && (
                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-500 uppercase bg-blue-500/10 px-1 rounded">
                                                        <Zap className="w-2 h-2" /> Automasi
                                                    </span>
                                                )}
                                                {(item.kategori === "Biaya Admin Bank" || item.kategori === "Biaya Admin") && (
                                                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500 uppercase bg-amber-500/10 px-1 rounded">
                                                        <Shield className="w-2 h-2" /> Biaya Admin
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <RecurringActions recurring={item} onRefresh={handleRefresh} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className={`text-2xl font-bold ${item.tipeTransaksi === "MASUK" ? "text-emerald-500" : "text-red-500"
                                    }`} data-private="true">
                                    {item.tipeTransaksi === "MASUK" ? "+" : "-"}{formatRupiah(item.nominal)}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <RefreshCw className="w-4 h-4" />
                                    <span>{FREKUENSI_LABEL[item.frekuensi] || item.frekuensi}</span>
                                    {item.frekuensi === "BULANAN" && (
                                        <span className="text-foreground font-medium">
                                            {/* Logic for meaningful date display */}
                                            {(() => {
                                                // 1. If Admin Fee Auto-Generated, try to use Account Pattern
                                                if (item.isAutoGenerated && (item.kategori === "Biaya Admin Bank" || item.kategori === "Biaya Admin")) {
                                                    const akun = accounts.find(a => a.id === item.akunId)
                                                    if (akun) {
                                                        const pola = akun.biayaAdminPola || "MANUAL";
                                                        if (pola === "JUMAT_MINGGU_KETIGA") return " • Jumat Minggu Ke-3";
                                                        if (pola === "HARI_KERJA_TERAKHIR") return " • Hari Kerja Terakhir";
                                                        // Fallback for Fixed Date or Manual
                                                        if (akun.biayaAdminTanggal) return ` • Tanggal ${akun.biayaAdminTanggal}`;
                                                    }
                                                }
                                                // 2. Default: Use specific day from recurring record
                                                return item.hariDalamBulan ? ` • Tanggal ${item.hariDalamBulan}` : "";
                                            })()}
                                        </span>
                                    )}
                                    {item.frekuensi === "MINGGUAN" && item.hariDalamMinggu != null && (
                                        <span className="text-foreground font-medium">
                                            • {HARI_LABEL[item.hariDalamMinggu]}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Wallet className="w-4 h-4" />
                                    <span>{akunMap.get(item.akunId) || "Akun tidak ditemukan"}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                                        {item.kategori}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.aktif
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                        : "bg-muted text-muted-foreground"
                                        }`}>
                                        {item.aktif ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>

                                {item.isAutoGenerated && (
                                    <div className="pt-2 border-t">
                                        <Link href={`/akun/detail?id=${item.akunId}`}>
                                            <Button variant="outline" size="sm" className="w-full text-[10px] h-7 gap-1">
                                                <ArrowLeft className="w-3 h-3" /> Lihat Pengaturan Akun
                                            </Button>
                                        </Link>
                                    </div>
                                )}

                                {item.terakhirDieksekusi && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        Terakhir: {new Date(item.terakhirDieksekusi).toLocaleDateString("id-ID")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )
            }
        </div >
    )
}
