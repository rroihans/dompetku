"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, CreditCard, Calculator, HelpCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

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
// Imports updated
import { createCicilan } from "@/lib/db/cicilan-repo" // Ensure correct path
import { formatRupiah } from "@/lib/format"
import type { AccountDTO } from "@/lib/account-dto"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface AddCicilanFormProps {
    accounts: AccountDTO[]
    onRefresh?: () => void
}

const formSchema = z.object({
    namaProduk: z.string().min(1, "Nama produk wajib diisi"),
    totalPokok: z.coerce.number().min(1, "Harga barang harus lebih dari 0"),
    tenor: z.coerce.number().min(1, "Tenor minimal 1 bulan"),
    bungaPersen: z.coerce.number().min(0).default(0),
    biayaAdmin: z.coerce.number().min(0).default(0),
    tanggalJatuhTempo: z.coerce.number().min(1).max(31).default(5),
    akunKreditId: z.string().min(1, "Pilih kartu kredit sumber"),
})

type FormValues = z.infer<typeof formSchema>

export function AddCicilanForm({ accounts, onRefresh }: AddCicilanFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Filter hanya kartu kredit
    const kartuKreditList = accounts.filter(a => a.tipe === "CREDIT_CARD")

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors, isValid },
    } = useForm<FormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            namaProduk: "",
            totalPokok: 0,
            tenor: 12,
            bungaPersen: 0,
            biayaAdmin: 0,
            tanggalJatuhTempo: 5,
            akunKreditId: "",
        },
    })

    const totalPokok = watch("totalPokok")
    const tenor = watch("tenor")
    const bungaPersen = watch("bungaPersen")
    const biayaAdmin = watch("biayaAdmin")
    const akunKreditIdValue = watch("akunKreditId")
    const tanggalJatuhTempoValue = watch("tanggalJatuhTempo")

    // Derived values for calculation
    const hitungCicilanBulanan = () => {
        if (!totalPokok || !tenor) return 0
        const totalBunga = (totalPokok * (bungaPersen || 0)) / 100
        const totalDenganBunga = totalPokok + totalBunga + (biayaAdmin || 0)
        return Math.ceil(totalDenganBunga / tenor)
    }

    const nominalPerBulan = hitungCicilanBulanan()
    const totalBayar = nominalPerBulan * (tenor || 0)

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const res = await createCicilan({
                namaProduk: values.namaProduk,
                totalPokok: values.totalPokok,
                tenor: values.tenor,
                nominalPerBulan,
                bungaPersen: values.bungaPersen,
                biayaAdmin: values.biayaAdmin,
                tanggalJatuhTempo: values.tanggalJatuhTempo,
                akunKreditId: values.akunKreditId,
            })

            if (res.success) {
                setOpen(false)
                reset()
                toast.success("Rencana cicilan berhasil dibuat")

                if (onRefresh) {
                    onRefresh()
                } else {
                    router.refresh()
                }
            } else {
                toast.error(typeof res.error === 'string' ? res.error : "Gagal membuat rencana cicilan")
            }
        } catch (err) {
            console.error(err)
            toast.error("Terjadi kesalahan sistem")
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
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Nama Produk */}
                    <div className="grid gap-2">
                        <Label htmlFor="namaProduk">Nama Produk / Pembelian</Label>
                        <Input
                            id="namaProduk"
                            placeholder="Contoh: iPhone 15 Pro, Laptop ASUS"
                            className={cn(errors.namaProduk && "border-red-500")}
                            {...register("namaProduk")}
                        />
                        {errors.namaProduk && (
                            <p className="text-sm text-red-500">{errors.namaProduk.message}</p>
                        )}
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
                            <Select
                                value={akunKreditIdValue}
                                onValueChange={(val) => setValue("akunKreditId", val, { shouldValidate: true })}
                            >
                                <SelectTrigger className={cn(errors.akunKreditId && "border-red-500")}>
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
                        {errors.akunKreditId && (
                            <p className="text-sm text-red-500">{errors.akunKreditId.message}</p>
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
                                className={cn(errors.totalPokok && "border-red-500")}
                                {...register("totalPokok", { valueAsNumber: true })}
                            />
                            {errors.totalPokok && (
                                <p className="text-sm text-red-500">{errors.totalPokok.message}</p>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tenor" className="flex items-center gap-1">
                                Tenor (Bulan)
                                <span className="text-muted-foreground text-xs">(berapa kali bayar)</span>
                            </Label>
                            <Select
                                value={String(tenor)}
                                onValueChange={(val) => setValue("tenor", Number(val))}
                            >
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
                                step="0.1"
                                {...register("bungaPersen", { valueAsNumber: true })}
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
                                {...register("biayaAdmin", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {/* Tanggal Jatuh Tempo */}
                    <div className="grid gap-2">
                        <Label>Tanggal Jatuh Tempo Setiap Bulan</Label>
                        <Select
                            value={String(tanggalJatuhTempoValue)}
                            onValueChange={(val) => setValue("tanggalJatuhTempo", Number(val))}
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

                    {/* Kalkulasi Preview */}
                    {(totalPokok || 0) > 0 && (tenor || 0) > 0 && (
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
                            {(bungaPersen || 0) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    * Termasuk bunga {bungaPersen}% = {formatRupiah((totalPokok * bungaPersen) / 100)}
                                </p>
                            )}
                        </div>
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
