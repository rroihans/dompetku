"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Pencil,
    Save,
    CreditCard,
    Calendar,
    DollarSign,
    Palette
} from "lucide-react"
import { updateAkun } from "@/lib/db"
import { toast } from "sonner"

const PRESET_COLORS = [
    "#10b981", "#3b82f6", "#8b5cf6", "#ec4899",
    "#f59e0b", "#ef4444", "#06b6d4", "#84cc16"
]

interface EditAccountFormProps {
    akun: {
        id: string
        nama: string
        tipe: string
        warna?: string | null
        limitKredit: number | null
        // Credit Card fields
        isSyariah?: boolean | null
        billingDate?: number | null
        dueDate?: number | null
        minPaymentFixed?: number | null
        minPaymentPercent?: number | null
        minInstallmentAmount?: number | null
        useDecimalFormat?: boolean
    }
}

export function EditAccountForm({ akun }: EditAccountFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    // Basic fields
    const [nama, setNama] = useState(akun.nama)
    const [warna, setWarna] = useState(akun.warna || PRESET_COLORS[0])
    const [limitKredit, setLimitKredit] = useState<number | null>(akun.limitKredit ?? null)

    // Credit Card fields
    const isCreditCard = akun.tipe === "CREDIT_CARD"
    const [isSyariah, setIsSyariah] = useState(akun.isSyariah ?? false)
    const [billingDate, setBillingDate] = useState<number | null>(akun.billingDate ?? null)
    const [dueDate, setDueDate] = useState<number | null>(akun.dueDate ?? null)
    const [minPaymentFixed, setMinPaymentFixed] = useState<number | null>(akun.minPaymentFixed ?? null)
    const [minPaymentPercent, setMinPaymentPercent] = useState<number | null>(akun.minPaymentPercent ?? null)
    const [minInstallmentAmount, setMinInstallmentAmount] = useState<number | null>(akun.minInstallmentAmount ?? null)
    const [useDecimalFormat, setUseDecimalFormat] = useState(akun.useDecimalFormat || false)

    const handleSave = async () => {
        setLoading(true)
        const toastId = toast.loading("Menyimpan perubahan...")

        try {
            const result = await updateAkun(akun.id, {
                nama,
                warna,
                limitKredit: isCreditCard ? (limitKredit ?? undefined) : undefined,
                // Credit Card fields
                isSyariah: isCreditCard ? isSyariah : undefined,
                billingDate: isCreditCard ? (billingDate ?? undefined) : undefined,
                dueDate: isCreditCard ? (dueDate ?? undefined) : undefined,
                minPaymentFixed: isCreditCard ? (minPaymentFixed ?? undefined) : undefined,
                minPaymentPercent: isCreditCard ? (minPaymentPercent ?? undefined) : undefined,
                minInstallmentAmount: isCreditCard ? (minInstallmentAmount ?? undefined) : undefined,
                useDecimalFormat
            })

            if (result.success) {
                toast.success("Perubahan berhasil disimpan", { id: toastId })
                setIsEditing(false)
                router.refresh()
            } else {
                toast.error(result.error || "Gagal menyimpan", { id: toastId })
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem", { id: toastId })
        } finally {
            setLoading(false)
        }
    }

    if (!isEditing) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Pencil className="w-4 h-4" />
                            Informasi Akun
                        </CardTitle>
                        <CardDescription>Detail dasar akun</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-3 h-3 mr-2" />
                        Edit
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nama</span>
                            <span className="font-medium">{akun.nama}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Warna</span>
                            <div
                                className="w-5 h-5 rounded-full border"
                                style={{ backgroundColor: akun.warna || PRESET_COLORS[0] }}
                            />
                        </div>
                        {isCreditCard && (
                            <>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Jenis Kartu</span>
                                    <span className="font-medium">{akun.isSyariah ? "Syariah" : "Konvensional"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Limit Kredit</span>
                                    <span className="font-medium">Rp {akun.limitKredit?.toLocaleString('id-ID') || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tanggal Billing</span>
                                    <span className="font-medium">{akun.billingDate || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tanggal Jatuh Tempo</span>
                                    <span className="font-medium">{akun.dueDate || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Format Desimal</span>
                                    <span className="font-medium">{akun.useDecimalFormat ? "Aktif" : "Nonaktif"}</span>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-primary">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Pencil className="w-4 h-4 text-primary" />
                    Edit Informasi Akun
                </CardTitle>
                <CardDescription>Ubah detail akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Nama */}
                <div className="space-y-2">
                    <Label>Nama Akun</Label>
                    <Input
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Nama akun"
                    />
                </div>

                {/* Warna */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Warna Akun
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                        {PRESET_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setWarna(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${warna === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Format Desimal */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                        <Label>Format Desimal</Label>
                        <p className="text-xs text-muted-foreground">Tampilkan saldo dengan 2 desimal (1.203.930,88)</p>
                    </div>
                    <Switch
                        checked={useDecimalFormat}
                        onCheckedChange={setUseDecimalFormat}
                    />
                </div>

                {/* Credit Card Specific Fields */}
                {isCreditCard && (
                    <div className="space-y-4 pt-4 border-t">
                        <Label className="flex items-center gap-2 text-primary font-semibold">
                            <CreditCard className="w-4 h-4" />
                            Pengaturan Kartu Kredit
                        </Label>

                        {/* Jenis Kartu */}
                        <div className="space-y-2">
                            <Label>Jenis Kartu</Label>
                            <Select
                                value={isSyariah ? "SYARIAH" : "KONVENSIONAL"}
                                onValueChange={(v) => setIsSyariah(v === "SYARIAH")}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="KONVENSIONAL">Konvensional</SelectItem>
                                    <SelectItem value="SYARIAH">Syariah</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Limit Kredit */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Limit Kredit
                            </Label>
                            <Input
                                type="number"
                                value={limitKredit || ""}
                                onChange={(e) => setLimitKredit(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Contoh: 20000000"
                            />
                        </div>

                        {/* Tanggal Billing & Due Date */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Tanggal Billing
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={billingDate || ""}
                                    onChange={(e) => setBillingDate(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="1-31"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Jatuh Tempo
                                </Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={dueDate || ""}
                                    onChange={(e) => setDueDate(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="1-31"
                                />
                            </div>
                        </div>

                        {/* Min Payment */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Min. Payment (Rp)</Label>
                                <Input
                                    type="number"
                                    value={minPaymentFixed || ""}
                                    onChange={(e) => setMinPaymentFixed(e.target.value ? parseInt(e.target.value) : null)}
                                    placeholder="50000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min. Payment (%)</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={minPaymentPercent || ""}
                                    onChange={(e) => setMinPaymentPercent(e.target.value ? parseFloat(e.target.value) : null)}
                                    placeholder="5"
                                />
                            </div>
                        </div>

                        {/* Min Installment Amount */}
                        <div className="space-y-2">
                            <Label>Min. Transaksi untuk Cicilan (Rp) - Opsional</Label>
                            <Input
                                type="number"
                                value={minInstallmentAmount || ""}
                                onChange={(e) => setMinInstallmentAmount(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="500000"
                            />
                            <p className="text-xs text-muted-foreground">Kosongkan jika tidak ada batas minimum</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setIsEditing(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        className="flex-1"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
