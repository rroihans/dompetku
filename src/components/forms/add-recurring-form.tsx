"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createRecurringTransaction } from "@/lib/db/recurring-repo"
import { AccountDTO } from "@/lib/account-dto"

interface AddRecurringFormProps {
    accounts: AccountDTO[]
    onRefresh?: () => void
}

const KATEGORI_INCOME = ["Gaji", "Bonus", "Investasi", "Lainnya"]
const KATEGORI_EXPENSE = [
    "Tagihan", "Langganan", "Asuransi", "Cicilan",
    "Tabungan", "Internet", "Listrik", "Air", "Lainnya"
]

export function AddRecurringForm({ accounts, onRefresh }: AddRecurringFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [nama, setNama] = useState("")
    const [nominal, setNominal] = useState<number>(0)
    const [kategori, setKategori] = useState("")
    const [tipeTransaksi, setTipeTransaksi] = useState<"MASUK" | "KELUAR">("KELUAR")
    const [akunId, setAkunId] = useState("")
    const [frekuensi, setFrekuensi] = useState<"HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN">("BULANAN")
    const [hariDalamBulan, setHariDalamBulan] = useState<number>(1)
    const [hariDalamMinggu, setHariDalamMinggu] = useState<number>(1)

    const kategoriList = tipeTransaksi === "MASUK" ? KATEGORI_INCOME : KATEGORI_EXPENSE

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (!nama || !akunId || !kategori || nominal <= 0) {
                setError("Lengkapi semua field yang diperlukan")
                setLoading(false)
                return
            }

            const res = await createRecurringTransaction({
                nama,
                nominal,
                kategori,
                tipeTransaksi,
                akunId,
                frekuensi,
                hariDalamBulan: frekuensi === "BULANAN" ? hariDalamBulan : undefined,
                hariDalamMinggu: frekuensi === "MINGGUAN" ? hariDalamMinggu : undefined,
                tanggalMulai: new Date(),
            })

            if (res.success) {
                setOpen(false)
                // Reset form
                setNama("")
                setNominal(0)
                setKategori("")
                setTipeTransaksi("KELUAR")
                setAkunId("")
                setFrekuensi("BULANAN")
                setHariDalamBulan(1)

                if (onRefresh) onRefresh()
                else router.refresh()
            }
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Gagal membuat transaksi berulang")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Tambah
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Transaksi Berulang Baru
                    </DialogTitle>
                    <DialogDescription>
                        Buat transaksi otomatis yang akan dijalankan secara berkala.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Nama */}
                    <div className="grid gap-2">
                        <Label htmlFor="nama">Nama Transaksi</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: Gaji Bulanan, Tagihan Internet"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                        />
                    </div>

                    {/* Tipe Transaksi */}
                    <div className="grid gap-2">
                        <Label>Tipe Transaksi</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={tipeTransaksi === "MASUK" ? "default" : "outline"}
                                className={`flex-1 ${tipeTransaksi === "MASUK" ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                                onClick={() => {
                                    setTipeTransaksi("MASUK")
                                    setKategori("")
                                }}
                            >
                                Pemasukan
                            </Button>
                            <Button
                                type="button"
                                variant={tipeTransaksi === "KELUAR" ? "default" : "outline"}
                                className={`flex-1 ${tipeTransaksi === "KELUAR" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                onClick={() => {
                                    setTipeTransaksi("KELUAR")
                                    setKategori("")
                                }}
                            >
                                Pengeluaran
                            </Button>
                        </div>
                    </div>

                    {/* Nominal */}
                    <div className="grid gap-2">
                        <Label htmlFor="nominal">Nominal (Rp)</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="0"
                            value={nominal || ""}
                            onChange={(e) => setNominal(e.target.value === "" ? 0 : Number(e.target.value))}
                            min={1}
                        />
                    </div>

                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label>Kategori</Label>
                        <Select value={kategori} onValueChange={setKategori}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {kategoriList.map((kat) => (
                                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Akun */}
                    <div className="grid gap-2">
                        <Label>Akun</Label>
                        <Select value={akunId} onValueChange={setAkunId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih akun" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((akun) => (
                                    <SelectItem key={akun.id} value={akun.id}>{akun.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Frekuensi */}
                    <div className="grid gap-2">
                        <Label>Frekuensi</Label>
                        <Select value={frekuensi} onValueChange={(v: any) => setFrekuensi(v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih frekuensi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="HARIAN">Setiap Hari</SelectItem>
                                <SelectItem value="MINGGUAN">Setiap Minggu</SelectItem>
                                <SelectItem value="BULANAN">Setiap Bulan</SelectItem>
                                <SelectItem value="TAHUNAN">Setiap Tahun</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Hari dalam bulan (untuk BULANAN) */}
                    {frekuensi === "BULANAN" && (
                        <div className="grid gap-2">
                            <Label>Tanggal Eksekusi</Label>
                            <Select
                                value={String(hariDalamBulan)}
                                onValueChange={(v) => setHariDalamBulan(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tanggal" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                                        <SelectItem key={d} value={String(d)}>Tanggal {d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Hari dalam minggu (untuk MINGGUAN) */}
                    {frekuensi === "MINGGUAN" && (
                        <div className="grid gap-2">
                            <Label>Hari Eksekusi</Label>
                            <Select
                                value={String(hariDalamMinggu)}
                                onValueChange={(v) => setHariDalamMinggu(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih hari" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Minggu</SelectItem>
                                    <SelectItem value="1">Senin</SelectItem>
                                    <SelectItem value="2">Selasa</SelectItem>
                                    <SelectItem value="3">Rabu</SelectItem>
                                    <SelectItem value="4">Kamis</SelectItem>
                                    <SelectItem value="5">Jumat</SelectItem>
                                    <SelectItem value="6">Sabtu</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
