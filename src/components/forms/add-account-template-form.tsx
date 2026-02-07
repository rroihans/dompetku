"use client"

import { useState } from "react"
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
import { Plus, Trash2, Info } from "lucide-react"
import { createAccountTemplate } from "@/lib/db/templates-repo"
import { useRouter } from "next/navigation"
import { TierBunga } from "@/lib/template-utils"
import { toast } from "sonner"

interface AddAccountTemplateFormProps {
    onSuccess?: () => void
}

export function AddAccountTemplateForm({ onSuccess }: AddAccountTemplateFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [pola, setPola] = useState("TANGGAL_TETAP")
    const [tiers, setTiers] = useState<TierBunga[]>([])

    const [formData, setFormData] = useState({
        nama: "",
        tipeAkun: "BANK",
        biayaAdmin: "",
        tanggalTagihan: "",
        deskripsi: "",
    })

    const handleAddTier = () => {
        setTiers([...tiers, { min_saldo: 0, max_saldo: null, bunga_pa: 0 }])
    }

    const handleRemoveTier = (index: number) => {
        setTiers(tiers.filter((_, i) => i !== index))
    }

    const handleTierChange = (index: number, field: keyof TierBunga, value: string) => {
        const newTiers = [...tiers]
        const val = value === "" ? 0 : parseFloat(value)

        if (field === "max_saldo") {
            const valOrNull = value === "" ? null : val
            newTiers[index][field] = valOrNull
        } else {
            (newTiers[index][field] as number) = val
        }

        setTiers(newTiers)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await createAccountTemplate({
            nama: formData.nama,
            tipeAkun: formData.tipeAkun as "BANK" | "E_WALLET" | "CREDIT_CARD",
            biayaAdmin: formData.biayaAdmin ? parseFloat(formData.biayaAdmin) : null,
            polaTagihan: pola,
            tanggalTagihan: pola === "TANGGAL_TETAP" ? parseInt(formData.tanggalTagihan) : null,
            bungaTier: tiers.length > 0 ? JSON.stringify(tiers) : null,
            deskripsi: formData.deskripsi,
            isActive: true,
        })

        setLoading(false)

        if (result.success) {
            toast.success(`Template ${formData.nama} berhasil dibuat`)
            setOpen(false)
            setFormData({ nama: "", tipeAkun: "BANK", biayaAdmin: "", tanggalTagihan: "", deskripsi: "" })
            setTiers([])
            router.refresh()
            if (onSuccess) onSuccess()
        } else {
            toast.error(result.error || "Gagal membuat template")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Template
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Template Akun Baru</DialogTitle>
                    <DialogDescription>
                        Konfigurasi aturan automasi untuk bank tertentu
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* Nama Template */}
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama Template</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: BCA Tahapan Xpresi"
                            value={formData.nama}
                            onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Tipe Akun */}
                        <div className="space-y-2">
                            <Label>Tipe Akun</Label>
                            <Select
                                value={formData.tipeAkun}
                                onValueChange={(value) => setFormData({ ...formData, tipeAkun: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">Bank</SelectItem>
                                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Biaya Admin */}
                        <div className="space-y-2">
                            <Label htmlFor="biayaAdmin">Biaya Admin (Rp)</Label>
                            <Input
                                id="biayaAdmin"
                                type="number"
                                placeholder="10000"
                                value={formData.biayaAdmin}
                                onChange={(e) => setFormData({ ...formData, biayaAdmin: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Pola Tagihan */}
                        <div className="space-y-2">
                            <Label>Pola Tagihan</Label>
                            <Select value={pola} onValueChange={setPola}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TANGGAL_TETAP">Tanggal Tetap</SelectItem>
                                    <SelectItem value="JUMAT_MINGGU_KETIGA">Jumat ke-3</SelectItem>
                                    <SelectItem value="HARI_KERJA_TERAKHIR">Hari Kerja Akhir</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Tanggal (jika tetap) */}
                        {pola === "TANGGAL_TETAP" && (
                            <div className="space-y-2">
                                <Label htmlFor="tanggalTagihan">Tanggal (1-31)</Label>
                                <Input
                                    id="tanggalTagihan"
                                    type="number"
                                    min="1"
                                    max="31"
                                    placeholder="1"
                                    value={formData.tanggalTagihan}
                                    onChange={(e) => setFormData({ ...formData, tanggalTagihan: e.target.value })}
                                    required
                                />
                            </div>
                        )}
                    </div>

                    {/* Bunga Tier */}
                    <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                                Tier Bunga (% p.a.)
                                <Info className="w-3 h-3 text-muted-foreground" />
                            </Label>
                            <Button type="button" variant="outline" size="sm" onClick={handleAddTier}>
                                <Plus className="w-3 h-3 mr-1" /> Tier
                            </Button>
                        </div>

                        {tiers.length === 0 ? (
                            <p className="text-xs text-muted-foreground italic text-center py-2">
                                Tidak ada konfigurasi bunga.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {tiers.map((tier, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                type="number"
                                                className="h-8 text-xs pr-6"
                                                placeholder="Min Saldo"
                                                value={tier.min_saldo}
                                                onChange={(e) => handleTierChange(index, "min_saldo", e.target.value)}
                                                title="Saldo Minimum agar bunga ini berlaku"
                                            />
                                        </div>
                                        <div className="relative w-20">
                                            <Input
                                                type="number"
                                                className="h-8 text-xs pr-6"
                                                placeholder="%"
                                                value={tier.bunga_pa}
                                                onChange={(e) => handleTierChange(index, "bunga_pa", e.target.value)}
                                                title="Bunga per tahun (p.a.)"
                                            />
                                            <span className="absolute right-2 top-2 text-[10px] text-muted-foreground">%</span>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500"
                                            onClick={() => handleRemoveTier(index)}
                                            title="Hapus Tier"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                                <p className="text-[10px] text-muted-foreground mt-2">
                                    * Field kiri: Saldo Minimum. Field kanan: Bunga % p.a.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Deskripsi */}
                    <div className="space-y-2">
                        <Label htmlFor="deskripsi">Deskripsi</Label>
                        <Input
                            id="deskripsi"
                            placeholder="Keterangan tambahan..."
                            value={formData.deskripsi}
                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan Template"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
