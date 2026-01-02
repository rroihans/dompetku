import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    RefreshCw,
    Calendar,
    Wallet,
    TrendingUp,
    TrendingDown,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Plus
} from "lucide-react"
import { getRecurringTransactions } from "@/app/actions/recurring"
import { getAkun } from "@/app/actions/akun"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { AddRecurringForm } from "@/components/forms/add-recurring-form"
import { RecurringActions } from "@/components/recurring/recurring-actions"

const FREKUENSI_LABEL: Record<string, string> = {
    HARIAN: "Setiap Hari",
    MINGGUAN: "Setiap Minggu",
    BULANAN: "Setiap Bulan",
    TAHUNAN: "Setiap Tahun",
}

const HARI_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export default async function RecurringPage() {
    const result = await getRecurringTransactions()
    const recurring = result.data || []
    const accounts = await getAkun()

    // Buat map akun
    const akunMap = new Map(accounts.map((a: any) => [a.id, a.nama]))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaksi Berulang</h2>
                    <p className="text-muted-foreground">
                        Kelola transaksi otomatis yang berjalan secara berkala.
                    </p>
                </div>
                <AddRecurringForm accounts={accounts.filter((a: any) =>
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                )} />
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
                    {recurring.map((item: any) => (
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
                                        <CardTitle className="text-lg">{item.nama}</CardTitle>
                                    </div>
                                    <RecurringActions recurring={item} />
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
                                    {item.frekuensi === "BULANAN" && item.hariDalamBulan && (
                                        <span className="text-foreground font-medium">
                                            • Tanggal {item.hariDalamBulan}
                                        </span>
                                    )}
                                    {item.frekuensi === "MINGGUAN" && item.hariDalamMinggu !== null && (
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
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                        }`}>
                                        {item.aktif ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>

                                {item.terakhirDieksekusi && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        Terakhir: {new Date(item.terakhirDieksekusi).toLocaleDateString("id-ID")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
