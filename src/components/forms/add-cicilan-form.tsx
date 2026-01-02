"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, CreditCard, Calculator, HelpCircle } from "lucide-react"

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
import { createCicilan } from "@/app/actions/cicilan"
import { formatRupiah } from "@/lib/format"

interface Account {
    id: string
    nama: string
    tipe: string
    limitKredit?: number | null
}

interface AddCicilanFormProps {
    accounts: Account[]
}

export function AddCicilanForm({ accounts }: AddCicilanFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [namaProduk, setNamaProduk] = useState("")
    const [totalPokok, setTotalPokok] = useState<number>(0)
    const [tenor, setTenor] = useState<number>(12)
    const [bungaPersen, setBungaPersen] = useState<number>(0)
    const [biayaAdmin, setBiayaAdmin] = useState<number>(0)
    const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState<number>(5)
    const [akunKreditId, setAkunKreditId] = useState("")

    // Hitung cicilan per bulan otomatis
    const hitungCicilanBulanan = () => {
        if (totalPokok <= 0 || tenor <= 0) return 0
        const totalBunga = (totalPokok * bungaPersen) / 100
        const totalDenganBunga = totalPokok + totalBunga + biayaAdmin
        return Math.ceil(totalDenganBunga / tenor)
    }

    const nominalPerBulan = hitungCicilanBulanan()
    const totalBayar = nominalPerBulan * tenor

    // Filter hanya kartu kredit
    const kartuKreditList = accounts.filter(a => a.tipe === "CREDIT_CARD")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (!namaProduk || !akunKreditId || totalPokok <= 0 || tenor <= 0) {
                setError("Lengkapi semua field yang diperlukan")
                setLoading(false)
                return
            }

            const res = await createCicilan({
                namaProduk,
                totalPokok,
                tenor,
                nominalPerBulan,
                bungaPersen,
                biayaAdmin,
                tanggalJatuhTempo,
                akunKreditId,
            })

            if (res.success) {
                setOpen(false)
                // Reset form
                setNamaProduk("")
                setTotalPokok(0)
                setTenor(12)
                setBungaPersen(0)
                setBiayaAdmin(0)
                setTanggalJatuhTempo(5)
                setAkunKreditId("")
                router.refresh()
            } else {
                setError(res.error || "Gagal membuat rencana cicilan")
            }
        } catch (err) {
            console.error(err)
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Rencana Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Rencana Cicilan Baru
                    </DialogTitle>
                    <DialogDescription>
                        Catat rencana cicilan kartu kredit untuk tracking otomatis.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Nama Produk */}
                    <div className="grid gap-2">
                        <Label htmlFor="namaProduk">Nama Produk / Pembelian</Label>
                        <Input
                            id="namaProduk"
                            placeholder="Contoh: iPhone 15 Pro, Laptop ASUS"
                            value={namaProduk}
                            onChange={(e) => setNamaProduk(e.target.value)}
                        />
                    </div>

                    {/* Kartu Kredit */}
                    <div className="grid gap-2">
                        <Label>Kartu Kredit Sumber</Label>
                        {kartuKreditList.length === 0 ? (
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                Belum ada akun kartu kredit.{" "}
                                <Link href="/akun" className="text-primary underline hover:text-primary/80">
                                    Tambahkan dulu di halaman Akun
                                </Link>.
                            </p>
                        ) : (
                            <Select value={akunKreditId} onValueChange={setAkunKreditId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kartu kredit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kartuKreditList.map((akun) => (
                                        <SelectItem key={akun.id} value={akun.id}>
                                            {akun.nama}
                                            {akun.limitKredit && (
                                                <span className="text-muted-foreground ml-2">
                                                    (Limit: {formatRupiah(akun.limitKredit)})
                                                </span>
                                            )}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Harga & Tenor */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="totalPokok">Harga Barang (Rp)</Label>
                            <Input
                                id="totalPokok"
                                type="number"
                                placeholder="0"
                                value={totalPokok || ""}
                                onChange={(e) => setTotalPokok(e.target.value === "" ? 0 : Number(e.target.value))}
                                min={1}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tenor" className="flex items-center gap-1">
                                Tenor (Bulan)
                                <span className="text-muted-foreground text-xs">(berapa kali bayar)</span>
                            </Label>
                            <Select value={String(tenor)} onValueChange={(v) => setTenor(Number(v))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tenor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[3, 6, 9, 12, 18, 24, 36].map((t) => (
                                        <SelectItem key={t} value={String(t)}>{t} Bulan</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Bunga & Admin */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="bungaPersen" className="flex items-center gap-1">
                                Bunga (%)
                                <span className="text-muted-foreground text-xs">(opsional)</span>
                            </Label>
                            <Input
                                id="bungaPersen"
                                type="number"
                                placeholder="0"
                                value={bungaPersen || ""}
                                onChange={(e) => setBungaPersen(e.target.value === "" ? 0 : Number(e.target.value))}
                                min={0}
                                step="0.1"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="biayaAdmin" className="flex items-center gap-1">
                                Biaya Admin (Rp)
                                <span className="text-muted-foreground text-xs">(opsional)</span>
                            </Label>
                            <Input
                                id="biayaAdmin"
                                type="number"
                                placeholder="0"
                                value={biayaAdmin || ""}
                                onChange={(e) => setBiayaAdmin(e.target.value === "" ? 0 : Number(e.target.value))}
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Tanggal Jatuh Tempo */}
                    <div className="grid gap-2">
                        <Label>Tanggal Jatuh Tempo Setiap Bulan</Label>
                        <Select value={String(tanggalJatuhTempo)} onValueChange={(v) => setTanggalJatuhTempo(Number(v))}>
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

                    {/* Kalkulasi Preview */}
                    {totalPokok > 0 && tenor > 0 && (
                        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                            <div className="flex items-center gap-2 text-primary font-semibold">
                                <Calculator className="h-4 w-4" />
                                Ringkasan Cicilan
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Cicilan per Bulan</p>
                                    <p className="text-xl font-bold">{formatRupiah(nominalPerBulan)}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Total Bayar ({tenor}x)</p>
                                    <p className="text-xl font-bold">{formatRupiah(totalBayar)}</p>
                                </div>
                            </div>
                            {bungaPersen > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    * Termasuk bunga {bungaPersen}% = {formatRupiah((totalPokok * bungaPersen) / 100)}
                                </p>
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading || kartuKreditList.length === 0} className="w-full">
                            {loading ? "Menyimpan..." : "Simpan Rencana"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
