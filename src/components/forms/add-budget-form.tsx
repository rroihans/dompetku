"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Target } from "lucide-react"
import { useForm, useWatch } from "react-hook-form"
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
import { upsertBudget } from "@/lib/db/budget-repo"
import { formatRupiah } from "@/lib/format"
import { cn } from "@/lib/utils"

interface AddBudgetFormProps {
    categories: string[]
    bulan: number
    tahun: number
    onRefresh?: () => void
}

const PRESET_BUDGETS = [
    { kategori: "Makan & Minum", nominal: 2000000 },
    { kategori: "Transportasi", nominal: 500000 },
    { kategori: "Belanja", nominal: 1000000 },
    { kategori: "Hiburan", nominal: 500000 },
    { kategori: "Tagihan", nominal: 1500000 },
    { kategori: "Kesehatan", nominal: 300000 },
]

const formSchema = z.object({
    kategori: z.string().min(1, "Pilih kategori"),
    customKategori: z.string().optional(),
    nominal: z.number().min(1, "Nominal harus lebih dari 0"),
}).refine(data => {
    if (data.kategori === 'custom' && (!data.customKategori || data.customKategori.trim() === '')) {
        return false
    }
    return true
}, {
    message: "Nama kategori baru wajib diisi",
    path: ["customKategori"]
})

type FormValues = z.infer<typeof formSchema>

export function AddBudgetForm({ categories, bulan, tahun, onRefresh }: AddBudgetFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Gabungkan kategori dari database dan preset
    const allCategories = Array.from(new Set([...categories, ...PRESET_BUDGETS.map(p => p.kategori)])).sort()

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            kategori: "",
            customKategori: "",
            nominal: 0,
        },
    })

    const kategori = useWatch({ control, name: "kategori" })
    const nominal = useWatch({ control, name: "nominal" })

    const BULAN_LABEL = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const selectedKategori = values.kategori === "custom" ? values.customKategori! : values.kategori

            const res = await upsertBudget({
                kategori: selectedKategori,
                bulan,
                tahun,
                nominal: values.nominal,
            })

            if (res.success) {
                setOpen(false)
                reset()
                toast.success("Anggaran berhasil disimpan")

                if (onRefresh) onRefresh()
                else router.refresh()
            } else {
                toast.error(res.error || "Gagal menyimpan budget")
            }
        } catch (err) {
            console.error(err)
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    // Saat kategori dipilih, set nominal dari preset jika ada
    function handleKategoriChange(value: string) {
        setValue("kategori", value, { shouldValidate: true })
        const preset = PRESET_BUDGETS.find(p => p.kategori === value)
        if (preset && (nominal === 0)) {
            setValue("nominal", preset.nominal)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Tambah Anggaran
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Tambah Anggaran
                    </DialogTitle>
                    <DialogDescription>
                        Set batas pengeluaran untuk kategori di bulan {BULAN_LABEL[bulan - 1]} {tahun}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label>Kategori Pengeluaran</Label>
                        <Select value={kategori} onValueChange={handleKategoriChange}>
                            <SelectTrigger aria-label="Pilih kategori pengeluaran" className={cn(errors.kategori && "border-red-500")}>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map((kat) => (
                                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                                ))}
                                <SelectItem value="custom">+ Kategori Baru</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.kategori && (
                            <p className="text-sm text-red-500" role="alert">{errors.kategori.message}</p>
                        )}
                    </div>

                    {/* Custom Kategori */}
                    {kategori === "custom" && (
                        <div className="grid gap-2">
                            <Label htmlFor="customKategori">Nama Kategori Baru</Label>
                            <Input
                                id="customKategori"
                                placeholder="Contoh: Pendidikan, Asuransi"
                                aria-label="Masukkan nama kategori baru"
                                {...register("customKategori")}
                                className={cn(errors.customKategori && "border-red-500")}
                            />
                            {errors.customKategori && (
                                <p className="text-sm text-red-500" role="alert">{errors.customKategori.message}</p>
                            )}
                        </div>
                    )}

                    {/* Nominal */}
                    <div className="grid gap-2">
                        <Label htmlFor="nominal">Batas Anggaran (Rp)</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="0"
                            aria-label="Masukkan batas anggaran"
                            {...register("nominal", { valueAsNumber: true })}
                            className={cn(errors.nominal && "border-red-500")}
                        />
                        {errors.nominal && (
                            <p className="text-sm text-red-500" role="alert">{errors.nominal.message}</p>
                        )}
                        {(nominal || 0) > 0 && (
                            <p className="text-xs text-muted-foreground">
                                = {formatRupiah(nominal)} per bulan
                            </p>
                        )}
                    </div>

                    {/* Quick Set */}
                    <div className="grid gap-2">
                        <Label className="text-xs text-muted-foreground">Preset Cepat</Label>
                        <div className="flex flex-wrap gap-2">
                            {[500000, 1000000, 2000000, 3000000, 5000000].map((val) => (
                                <Button
                                    key={val}
                                    type="button"
                                    variant={nominal === val ? "default" : "outline"}
                                    size="sm"
                                    aria-label={`Set anggaran ${val} rupiah`}
                                    onClick={() => setValue("nominal", val)}
                                >
                                    {val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Menyimpan..." : "Simpan Anggaran"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
