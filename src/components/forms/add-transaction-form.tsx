"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createTransaksiSimple } from "@/app/actions/transaksi"
import { getAkun } from "@/app/actions/akun"

// Kategori pengeluaran sederhana
const KATEGORI_PENGELUARAN = [
    "Makan & Minum",
    "Transportasi",
    "Belanja",
    "Hiburan",
    "Tagihan",
    "Kesehatan",
    "Lainnya (Pengeluaran)",
]

// Kategori pemasukan
const KATEGORI_PEMASUKAN = [
    "Gaji",
    "Bonus",
    "Transfer Masuk",
    "Lainnya (Pemasukan)",
]

// Schema validasi form - SEDERHANA
const formSchema = z.object({
    nominal: z.number().min(1, "Nominal harus lebih dari 0"),
    kategori: z.string().min(1, "Pilih kategori"),
    akunId: z.string().min(1, "Pilih akun"),
    tipeTransaksi: z.enum(["KELUAR", "MASUK"]),
    tanggal: z.string().optional(), // Date string YYYY-MM-DD
    deskripsi: z.string().optional(), // OPSIONAL
})

interface FormValues {
    nominal: number;
    kategori: string;
    akunId: string;
    tipeTransaksi: "KELUAR" | "MASUK";
    tanggal?: string;
    deskripsi?: string;
}

interface Akun {
    id: string
    nama: string
    tipe: string
}

export function AddTransactionForm() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [akunList, setAkunList] = useState<Akun[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nominal: 0,
            kategori: "",
            akunId: "",
            tipeTransaksi: "KELUAR",
            tanggal: new Date().toISOString().split('T')[0], // Default hari ini
            deskripsi: "",
        },
    })

    const tipeTransaksi = watch("tipeTransaksi")

    // Load daftar akun saat dialog dibuka (filter hanya akun uang, bukan kategori)
    useEffect(() => {
        if (open) {
            getAkun().then((akuns) => {
                // Hanya tampilkan akun BANK, E_WALLET, CASH, CREDIT_CARD
                const filtered = akuns.filter((a: Akun) =>
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                )
                // Deduplicate berdasarkan ID
                const unique = filtered.filter((akun: Akun, index: number, self: Akun[]) =>
                    index === self.findIndex((a) => a.id === akun.id)
                )
                setAkunList(unique)
            }).catch(console.error)
        }
    }, [open])

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const idempotencyKey = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`

            // Untuk KELUAR: akunId adalah sumber (kredit), kategori jadi akun debit internal
            // Untuk MASUK: akunId adalah tujuan (debit), kategori jadi akun kredit internal
            // Sistem akan handle internal account di server action

            const res = await createTransaksiSimple({
                nominal: values.nominal,
                kategori: values.kategori,
                akunId: values.akunId,
                tipeTransaksi: values.tipeTransaksi,
                tanggal: values.tanggal ? new Date(values.tanggal) : undefined,
                deskripsi: values.deskripsi,
                idempotencyKey,
            })

            if (res.success) {
                setOpen(false)
                reset()
            } else {
                alert("Gagal menyimpan transaksi")
            }
        } catch (error) {
            console.error(error)
            alert("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Transaksi Baru
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Catat Transaksi</DialogTitle>
                    <DialogDescription>
                        Input cepat untuk mencatat pemasukan atau pengeluaran.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Tipe Transaksi - Toggle */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            type="button"
                            variant={tipeTransaksi === "KELUAR" ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setValue("tipeTransaksi", "KELUAR")}
                        >
                            💸 Pengeluaran
                        </Button>
                        <Button
                            type="button"
                            variant={tipeTransaksi === "MASUK" ? "default" : "outline"}
                            className="w-full"
                            onClick={() => setValue("tipeTransaksi", "MASUK")}
                        >
                            💰 Pemasukan
                        </Button>
                    </div>

                    {/* Nominal */}
                    <div className="grid gap-2">
                        <Label htmlFor="nominal">Nominal (Rp)</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="50000"
                            className="text-lg font-bold"
                            {...register("nominal", { valueAsNumber: true })}
                        />
                        {errors.nominal && (
                            <p className="text-sm text-red-500">{errors.nominal.message}</p>
                        )}
                    </div>

                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label htmlFor="kategori">Kategori</Label>
                        <Select onValueChange={(val) => setValue("kategori", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {(tipeTransaksi === "KELUAR" ? KATEGORI_PENGELUARAN : KATEGORI_PEMASUKAN).map((kat) => (
                                    <SelectItem key={kat} value={kat}>
                                        {kat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.kategori && (
                            <p className="text-sm text-red-500">{errors.kategori.message}</p>
                        )}
                    </div>

                    {/* Akun */}
                    <div className="grid gap-2">
                        <Label htmlFor="akunId">
                            {tipeTransaksi === "KELUAR" ? "Dari Akun" : "Ke Akun"}
                        </Label>
                        <Select onValueChange={(val) => setValue("akunId", val)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih akun" />
                            </SelectTrigger>
                            <SelectContent>
                                {akunList.length === 0 ? (
                                    <SelectItem value="none" disabled>Belum ada akun</SelectItem>
                                ) : (
                                    akunList.map((akun) => (
                                        <SelectItem key={akun.id} value={akun.id}>
                                            {akun.nama}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.akunId && (
                            <p className="text-sm text-red-500">{errors.akunId.message}</p>
                        )}
                    </div>

                    {/* Tanggal */}
                    <div className="grid gap-2">
                        <Label htmlFor="tanggal">Tanggal</Label>
                        <Input
                            id="tanggal"
                            type="date"
                            {...register("tanggal")}
                        />
                    </div>

                    {/* Deskripsi (Opsional) */}
                    <div className="grid gap-2">
                        <Label htmlFor="deskripsi" className="text-muted-foreground">
                            Catatan (opsional)
                        </Label>
                        <Input
                            id="deskripsi"
                            placeholder="Makan siang di..."
                            {...register("deskripsi")}
                        />
                    </div>

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
