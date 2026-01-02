"use client"

import { useState } from "react"
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
import { createAkun } from "@/app/actions/akun"
import { formatCurrency } from "@/lib/format"

const formSchema = z.object({
    nama: z.string()
        .min(1, "Nama akun wajib diisi")
        .min(2, "Nama akun minimal 2 karakter")
        .max(50, "Nama akun maksimal 50 karakter"),
    tipe: z.enum(["BANK", "E_WALLET", "CREDIT_CARD", "CASH"]),
    saldoAwal: z.number()
        .min(0, "Saldo tidak boleh negatif"),
    limitKredit: z.number().min(0, "Limit tidak boleh negatif").optional(),
    templateId: z.string().optional().nullable(),
    setoranAwal: z.number().optional().nullable(),
    warna: z.string().optional(),
})

// Preset warna yang bisa dipilih
const PRESET_COLORS = [
    '#3b82f6', // blue
    '#005696', // BCA blue
    '#8b5cf6', // purple
    '#ef4444', // red
    '#22c55e', // green
    '#f97316', // orange
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#eab308', // yellow
]

interface AddAccountFormValues {
    nama: string;
    tipe: "BANK" | "E_WALLET" | "CREDIT_CARD" | "CASH";
    saldoAwal: number;
    limitKredit?: number;
    templateId?: string | null;
    setoranAwal?: number | null;
    warna?: string;
}

interface AccountTemplate {
    id: string;
    nama: string;
    tipeAkun: string;
    biayaAdmin: number | null;
    polaTagihan: string;
    tanggalTagihan: number | null;
    deskripsi: string | null;
}

export function AddAccountForm({ templates = [] }: { templates?: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
    const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplate | null>(null)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<AddAccountFormValues>({
        resolver: zodResolver(formSchema),
        mode: "onChange",
        defaultValues: {
            nama: "",
            tipe: "BANK",
            saldoAwal: 0,
            templateId: null,
            warna: PRESET_COLORS[0],
        },
    })

    const tipeAkun = watch("tipe")

    const handleTemplateChange = (templateId: string) => {
        if (templateId === "none") {
            setSelectedTemplate(null)
            setValue("templateId", null)
            return
        }

        const template = templates.find(t => t.id === templateId)
        if (template) {
            setSelectedTemplate(template)
            setValue("templateId", template.id)
            setValue("nama", template.nama)
            setValue("tipe", template.tipeAkun as any)
            
            // Set default color based on bank if possible
            if (template.nama.toLowerCase().includes("bca")) setSelectedColor("#005696")
            else if (template.nama.toLowerCase().includes("mandiri")) setSelectedColor("#f97316")
            else if (template.nama.toLowerCase().includes("bni")) setSelectedColor("#f97316")
        }
    }

    async function onSubmit(values: AddAccountFormValues) {
        setLoading(true)
        setError("")
        try {
            const res = await createAkun({
                nama: values.nama,
                tipe: values.tipe,
                saldoAwal: values.saldoAwal,
                limitKredit: values.limitKredit,
                templateId: values.templateId,
                setoranAwal: values.setoranAwal,
                icon: "wallet",
                warna: selectedColor,
            })

            if (res.success) {
                setOpen(false)
                reset()
                setSelectedTemplate(null)
                setSelectedColor(PRESET_COLORS[0])
            } else {
                setError(res.error || "Gagal membuat akun")
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
                    <Plus className="h-4 w-4" /> Tambah Akun
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Akun Baru</DialogTitle>
                    <DialogDescription>
                        Pilih template untuk otomatisasi biaya admin atau buat manual.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
                    {/* Template Selector */}
                    <div className="grid gap-2">
                        <Label htmlFor="template">Gunakan Template</Label>
                        <Select onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih template bank (opsional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tanpa Template (Custom)</SelectItem>
                                {templates.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedTemplate && (
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-xs space-y-1">
                            <p className="font-semibold text-primary">{selectedTemplate.nama}</p>
                            <p className="text-muted-foreground">{selectedTemplate.deskripsi}</p>
                            <div className="flex gap-4 mt-2 font-medium">
                                <span>Admin: {selectedTemplate.biayaAdmin ? formatCurrency(selectedTemplate.biayaAdmin) : 'Gratis'}</span>
                                <span>Tagihan: {selectedTemplate.polaTagihan.replace(/_/g, ' ')}</span>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="nama">Nama Akun</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: BCA Utama"
                            {...register("nama")}
                        />
                        {errors.nama && (
                            <p className="text-sm text-red-500">{errors.nama.message}</p>
                        )}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="tipe">Tipe Akun</Label>
                        <Select
                            value={tipeAkun}
                            onValueChange={(val) => setValue("tipe", val as any)}
                            disabled={!!selectedTemplate}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK">Bank</SelectItem>
                                <SelectItem value="E_WALLET">E-Wallet (Gopay/OVO)</SelectItem>
                                <SelectItem value="CASH">Tunai</SelectItem>
                                <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="saldoAwal">Saldo Awal (Rp)</Label>
                            <Input
                                id="saldoAwal"
                                type="number"
                                {...register("saldoAwal", { valueAsNumber: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="setoranAwal">Setoran Awal (Rp)</Label>
                            <Input
                                id="setoranAwal"
                                type="number"
                                placeholder="Opsional"
                                {...register("setoranAwal", { valueAsNumber: true })}
                            />
                        </div>
                    </div>

                    {tipeAkun === "CREDIT_CARD" && (
                        <div className="grid gap-2">
                            <Label htmlFor="limitKredit">Limit Kredit (Rp)</Label>
                            <Input
                                id="limitKredit"
                                type="number"
                                {...register("limitKredit", { valueAsNumber: true })}
                            />
                        </div>
                    )}

                    {/* Color Picker */}
                    <div className="grid gap-2">
                        <Label>Warna Akun</Label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color
                                        ? 'border-foreground scale-110'
                                        : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => setSelectedColor(color)}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan Akun"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
