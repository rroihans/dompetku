"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Target } from "lucide-react"

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

export function AddBudgetForm({ categories, bulan, tahun, onRefresh }: AddBudgetFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [kategori, setKategori] = useState("")
    const [customKategori, setCustomKategori] = useState("")
    const [nominal, setNominal] = useState<number>(0)

    const BULAN_LABEL = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    // Gabungkan kategori dari database dan preset
    const allCategories = Array.from(new Set([...categories, ...PRESET_BUDGETS.map(p => p.kategori)])).sort()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const selectedKategori = kategori === "custom" ? customKategori : kategori

            if (!selectedKategori || nominal <= 0) {
                setError("Lengkapi kategori dan nominal")
                setLoading(false)
                return
            }

            const res = await upsertBudget({
                kategori: selectedKategori,
                bulan,
                tahun,
                nominal,
            })

            if (res.success) {
                setOpen(false)
                setKategori("")
                setCustomKategori("")
                setNominal(0)

                if (onRefresh) onRefresh()
                else router.refresh()
            } else {
                setError(res.error || "Gagal menyimpan budget")
            }
        } catch (err: any) {
            console.error(err)
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    // Saat kategori dipilih, set nominal dari preset jika ada
    function handleKategoriChange(value: string) {
        setKategori(value)
        const preset = PRESET_BUDGETS.find(p => p.kategori === value)
        if (preset && nominal === 0) {
            setNominal(preset.nominal)
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
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Kategori */}
                    <div className="grid gap-2">
                        <Label>Kategori Pengeluaran</Label>
                        <Select value={kategori} onValueChange={handleKategoriChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {allCategories.map((kat) => (
                                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                                ))}
                                <SelectItem value="custom">+ Kategori Baru</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Kategori */}
                    {kategori === "custom" && (
                        <div className="grid gap-2">
                            <Label htmlFor="customKategori">Nama Kategori Baru</Label>
                            <Input
                                id="customKategori"
                                placeholder="Contoh: Pendidikan, Asuransi"
                                value={customKategori}
                                onChange={(e) => setCustomKategori(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Nominal */}
                    <div className="grid gap-2">
                        <Label htmlFor="nominal">Batas Anggaran (Rp)</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="0"
                            value={nominal || ""}
                            onChange={(e) => setNominal(e.target.value === "" ? 0 : Number(e.target.value))}
                            min={1}
                        />
                        {nominal > 0 && (
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
                                    onClick={() => setNominal(val)}
                                >
                                    {val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {error}
                        </p>
                    )}

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
