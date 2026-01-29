"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, RefreshCw } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

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
import { cn } from "@/lib/utils"

interface AddRecurringFormProps {
    accounts: AccountDTO[]
    onRefresh?: () => void
}

const KATEGORI_INCOME = ["Gaji", "Bonus", "Investasi", "Lainnya"]
const KATEGORI_EXPENSE = [
    "Tagihan", "Langganan", "Asuransi", "Cicilan",
    "Tabungan", "Internet", "Listrik", "Air", "Lainnya"
]

const formSchema = z.object({
    nama: z.string().min(1, "Nama transaksi wajib diisi"),
    nominal: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
    kategori: z.string().min(1, "Pilih kategori"),
    tipeTransaksi: z.enum(["MASUK", "KELUAR"]),
    akunId: z.string().min(1, "Pilih akun"),
    frekuensi: z.enum(["HARIAN", "MINGGUAN", "BULANAN", "TAHUNAN"]),
    hariDalamBulan: z.coerce.number().min(1).max(28).default(1),
    hariDalamMinggu: z.coerce.number().min(0).max(6).default(1),
})

type FormValues = z.infer<typeof formSchema>

export function AddRecurringForm({ accounts, onRefresh }: AddRecurringFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            nama: "",
            nominal: 0,
            kategori: "",
            tipeTransaksi: "KELUAR",
            akunId: "",
            frekuensi: "BULANAN",
            hariDalamBulan: 1,
            hariDalamMinggu: 1,
        },
    })

    const tipeTransaksi = watch("tipeTransaksi")
    const kategori = watch("kategori")
    const akunId = watch("akunId")
    const frekuensi = watch("frekuensi")
    const hariDalamBulan = watch("hariDalamBulan")
    const hariDalamMinggu = watch("hariDalamMinggu")

    const kategoriList = tipeTransaksi === "MASUK" ? KATEGORI_INCOME : KATEGORI_EXPENSE

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const res = await createRecurringTransaction({
                nama: values.nama,
                nominal: values.nominal,
                kategori: values.kategori,
                tipeTransaksi: values.tipeTransaksi,
                akunId: values.akunId,
                frekuensi: values.frekuensi,
                hariDalamBulan: values.frekuensi === "BULANAN" ? values.hariDalamBulan : undefined,
                hariDalamMinggu: values.frekuensi === "MINGGUAN" ? values.hariDalamMinggu : undefined,
                tanggalMulai: new Date(),
            })

            if (res.success) {
                setOpen(false)
                reset()
                toast.success("Transaksi berulang berhasil dibuat")

                if (onRefresh) onRefresh()
                else router.refresh()
            } else {
                toast.error(res.error || "Gagal membuat transaksi berulang")
            }
        } catch (err: any) {
            console.error(err)
            toast.error(err.message || "Terjadi kesalahan sistem")
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
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Nama */}
                    <div className="grid gap-2">
                        <Label htmlFor="nama">Nama Transaksi</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: Gaji Bulanan, Tagihan Internet"
                            {...register("nama")}
                            className={cn(errors.nama && "border-red-500")}
                        />
                        {errors.nama && (
                            <p className="text-sm text-red-500">{errors.nama.message}</p>
                        )}
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
                                    setValue("tipeTransaksi", "MASUK")
                                    setValue("kategori", "") // Reset kategori saat ganti tipe
                                }}
                            >
                                Pemasukan
                            </Button>
                            <Button
                                type="button"
                                variant={tipeTransaksi === "KELUAR" ? "default" : "outline"}
                                className={`flex-1 ${tipeTransaksi === "KELUAR" ? "bg-red-600 hover:bg-red-700" : ""}`}
                                onClick={() => {
                                    setValue("tipeTransaksi", "KELUAR")
                                    setValue("kategori", "") // Reset kategori saat ganti tipe
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
                            {...register("nominal", { valueAsNumber: true })}
                            className={cn(errors.nominal && "border-red-500")}
                        />
                        {errors.nominal && (
                            <p className="text-sm text-red-500">{errors.nominal.message}</p>
                        )}
                    </div>

                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label>Kategori</Label>
                        <Select
                            value={kategori}
                            onValueChange={(val) => setValue("kategori", val, { shouldValidate: true })}
                        >
                            <SelectTrigger className={cn(errors.kategori && "border-red-500")}>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {kategoriList.map((kat) => (
                                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.kategori && (
                            <p className="text-sm text-red-500">{errors.kategori.message}</p>
                        )}
                    </div>

                    {/* Akun */}
                    <div className="grid gap-2">
                        <Label>Akun</Label>
                        <Select
                            value={akunId}
                            onValueChange={(val) => setValue("akunId", val, { shouldValidate: true })}
                        >
                            <SelectTrigger className={cn(errors.akunId && "border-red-500")}>
                                <SelectValue placeholder="Pilih akun" />
                            </SelectTrigger>
                            <SelectContent>
                                {accounts.map((akun) => (
                                    <SelectItem key={akun.id} value={akun.id}>{akun.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.akunId && (
                            <p className="text-sm text-red-500">{errors.akunId.message}</p>
                        )}
                    </div>

                    {/* Frekuensi */}
                    <div className="grid gap-2">
                        <Label>Frekuensi</Label>
                        <Select
                            value={frekuensi}
                            onValueChange={(v: any) => setValue("frekuensi", v)}
                        >
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
                                onValueChange={(v) => setValue("hariDalamBulan", Number(v))}
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
                                onValueChange={(v) => setValue("hariDalamMinggu", Number(v))}
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
