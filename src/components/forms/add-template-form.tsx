"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { createTemplate } from "@/app/actions/template"
import { useRouter } from "next/navigation"

interface Akun {
    id: string
    nama: string
    tipe: string
}

interface AddTemplateFormProps {
    akuns: Akun[]
    kategoriExpense: string[]
    kategoriIncome: string[]
}

export function AddTemplateForm({ akuns, kategoriExpense, kategoriIncome }: AddTemplateFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [tipe, setTipe] = useState<"KELUAR" | "MASUK">("KELUAR")
    const [formData, setFormData] = useState({
        nama: "",
        deskripsi: "",
        nominal: "",
        kategori: "",
        akunId: "",
    })

    const kategoris = tipe === "KELUAR" ? kategoriExpense : kategoriIncome

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await createTemplate({
            nama: formData.nama,
            deskripsi: formData.deskripsi,
            nominal: parseFloat(formData.nominal) || 0,
            kategori: formData.kategori,
            tipeTransaksi: tipe,
            akunId: formData.akunId,
        })

        setLoading(false)

        if (result.success) {
            setOpen(false)
            setFormData({ nama: "", deskripsi: "", nominal: "", kategori: "", akunId: "" })
            router.refresh()
        } else {
            alert(result.error || "Gagal membuat template")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Template
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Buat Template Baru</DialogTitle>
                    <DialogDescription>
                        Template untuk transaksi yang sering dilakukan
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Tipe Toggle */}
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant={tipe === "KELUAR" ? "default" : "outline"}
                            className={`flex-1 ${tipe === "KELUAR" ? "bg-red-500 hover:bg-red-600" : ""}`}
                            onClick={() => setTipe("KELUAR")}
                        >
                            <TrendingDown className="w-4 h-4 mr-2" />
                            Pengeluaran
                        </Button>
                        <Button
                            type="button"
                            variant={tipe === "MASUK" ? "default" : "outline"}
                            className={`flex-1 ${tipe === "MASUK" ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
                            onClick={() => setTipe("MASUK")}
                        >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Pemasukan
                        </Button>
                    </div>

                    {/* Nama Template */}
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Template</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: Kopi Starbucks"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            required
                        />
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi Transaksi</Label>
                        <Input
                            id="deskripsi"
                            placeholder="Contoh: Beli kopi pagi"
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                            required
                        />
                    </div>

                    {/* Nominal */}
                    <div className="space-y-2">
                        <Label htmlFor="nominal">Nominal Default</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="50000"
                            value={formData.nominal}
                            onChange={(e) => setFormData({ ...formData, nominal: e.target.value })}
                            required
                        />
                    </div>

                    {/* Kategori */}
                    <div className="space-y-2">
                        <Label>Kategori</Label>
                        <Select
                            value={formData.kategori}
                            onValueChange={(value) => setFormData({ ...formData, kategori: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {kategoris.map(kat => (
                                    <SelectItem key={kat} value={kat}>{kat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Akun */}
                    <div className="space-y-2">
                        <Label>Akun Default</Label>
                        <Select
                            value={formData.akunId}
                            onValueChange={(value) => setFormData({ ...formData, akunId: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih akun" />
                            </SelectTrigger>
                            <SelectContent>
                                {akuns.map(akun => (
                                    <SelectItem key={akun.id} value={akun.id}>{akun.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan Template"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
