"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, CreditCard, Info } from "lucide-react"

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
    SelectValue,
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { createAkun } from "@/lib/db"
import { formatCurrency } from "@/lib/format"
import { PatternBuilderUI, TierEditor } from "@/components/akun/account-settings-components"
import { type AccountTemplateDTO as AccountTemplateData } from "@/lib/db/templates-repo"
import { NumberInput } from "@/components/ui/number-input"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formSchema = z.object({
    nama: z.string()
        .min(1, "Nama akun wajib diisi")
        .min(2, "Nama akun minimal 2 karakter")
        .max(50, "Nama akun maksimal 50 karakter"),
    tipe: z.enum(["BANK", "E_WALLET", "CREDIT_CARD", "CASH"]),
    saldoAwal: z.number()
        .min(0, "Saldo tidak boleh negatif").optional(),
    limitKredit: z.number().min(0, "Limit tidak boleh negatif").optional(),
    templateId: z.string().optional().nullable(),
    setoranAwal: z.number().optional().nullable(),
    warna: z.string().optional(),
    // Fields for flexible automation
    biayaAdminAktif: z.boolean(),
    biayaAdminNominal: z.number().optional().nullable(),
    biayaAdminPola: z.string().optional().nullable(),
    biayaAdminTanggal: z.number().optional().nullable(),
    bungaAktif: z.boolean(),
    bungaTiers: z.string().optional().nullable(),
    // Credit Card specific fields (v0.5.0)
    isSyariah: z.boolean().optional().nullable(),
    billingDate: z.number().min(1).max(31).optional().nullable(),
    dueDate: z.number().min(1).max(31).optional().nullable(),
    minPaymentFixed: z.number().optional().nullable(),
    minInstallmentAmount: z.number().optional().nullable(),
    // Display format
    useDecimalFormat: z.boolean().optional(),
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
    saldoAwal?: number;
    limitKredit?: number;
    templateId?: string | null;
    setoranAwal?: number | null;
    warna?: string;
    biayaAdminAktif: boolean;
    biayaAdminNominal?: number | null;
    biayaAdminPola?: string | null;
    biayaAdminTanggal?: number | null;
    bungaAktif: boolean;
    bungaTiers?: string | null;
    // Credit Card fields
    isSyariah?: boolean | null;
    billingDate?: number | null;
    dueDate?: number | null;
    minPaymentFixed?: number | null;
    minInstallmentAmount?: number | null;
    // Display format
    useDecimalFormat?: boolean;
}

interface AddAccountFormProps {
    templates?: AccountTemplateData[];
    trigger?: React.ReactNode;
}

export function AddAccountForm({ templates = [], trigger }: AddAccountFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
    const [showAdvanced, setShowAdvanced] = useState(true) // Show by default
    const router = useRouter()

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
            biayaAdminAktif: false,
            bungaAktif: false,
            // Credit card defaults
            isSyariah: null,
            billingDate: 25,
            dueDate: 15,
            minPaymentFixed: 50000,
            minInstallmentAmount: undefined,
            useDecimalFormat: false,
        },
    })

    const tipeAkun = watch("tipe")
    const biayaAdminAktif = watch("biayaAdminAktif")
    const bungaAktif = watch("bungaAktif")
    const pola = watch("biayaAdminPola") || "MANUAL"
    const tanggal = watch("biayaAdminTanggal")
    const tiersStr = watch("bungaTiers")
    const tiers = tiersStr ? JSON.parse(tiersStr) : []
    const isSyariah = watch("isSyariah")
    const billingDate = watch("billingDate")
    const useDecimalFormat = watch("useDecimalFormat")

    const isCreditCard = tipeAkun === "CREDIT_CARD"
    const isCash = tipeAkun === "CASH"
    const showAutomation = !isCash // Show automation for all except CASH

    const handleTemplateChange = (templateId: string) => {
        if (templateId === "none") {
            setValue("templateId", null)
            setValue("biayaAdminAktif", false)
            setValue("bungaAktif", false)
            return
        }

        const template = templates.find(t => t.id === templateId)
        if (template) {
            setValue("templateId", template.id)
            setValue("nama", template.nama)
            setValue("tipe", template.tipeAkun as any)

            // Auto-fill automation settings
            setValue("biayaAdminAktif", !!template.biayaAdmin)
            setValue("biayaAdminNominal", template.biayaAdmin ? Math.round(template.biayaAdmin) : null)
            setValue("biayaAdminPola", template.polaTagihan)
            setValue("biayaAdminTanggal", template.tanggalTagihan)

            setValue("bungaAktif", !!template.bungaTier && JSON.parse(template.bungaTier).length > 0)
            setValue("bungaTiers", template.bungaTier)

            // Show advanced settings if template has automation
            if (template.biayaAdmin || template.bungaTier) {
                setShowAdvanced(true)
            }

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
                saldoAwal: values.tipe === "CREDIT_CARD" ? 0 : (values.saldoAwal ?? 0),
                limitKredit: values.limitKredit,
                templateId: values.templateId,
                templateSource: values.templateId, // Link to source for analytics
                biayaAdminAktif: values.biayaAdminAktif,
                biayaAdminNominal: values.biayaAdminNominal,
                biayaAdminPola: values.biayaAdminPola,
                // Auto-set admin date to billing-1 for credit card
                biayaAdminTanggal: values.tipe === "CREDIT_CARD" && values.billingDate
                    ? (values.billingDate > 1 ? values.billingDate - 1 : 28)
                    : values.biayaAdminTanggal,
                bungaAktif: values.tipe === "CREDIT_CARD" ? false : values.bungaAktif,
                bungaTiers: values.tipe === "CREDIT_CARD" ? null : values.bungaTiers,
                setoranAwal: values.setoranAwal,
                icon: values.tipe === "CREDIT_CARD" ? "credit-card" : "wallet",
                warna: selectedColor,
                // Credit Card fields
                isSyariah: values.isSyariah,
                billingDate: values.billingDate,
                dueDate: values.dueDate,
                minPaymentFixed: values.minPaymentFixed,
                minInstallmentAmount: values.minInstallmentAmount,
                useDecimalFormat: values.useDecimalFormat,
            })

            if (res.success) {
                setOpen(false)
                reset()
                setSelectedColor(PRESET_COLORS[0])
                setShowAdvanced(false)

                toast.success(`Akun ${values.nama} telah ditambahkan.`)
                window.dispatchEvent(new Event('account-updated')) // Trigger refresh listeners
                router.refresh()
            } else {
                setError(res.error || "Gagal membuat akun")
            }
        } catch (err: unknown) {
            console.error(err)
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    // Debug: Log form errors
    const onError = (formErrors: any) => {
        console.error("Form validation errors:", formErrors)

        // Build descriptive error message
        const errorMessages: string[] = []
        const fieldNames: Record<string, string> = {
            nama: "Nama Akun",
            tipe: "Tipe Akun",
            saldoAwal: "Saldo Awal",
            limitKredit: "Limit Kredit",
            billingDate: "Tanggal Billing",
            dueDate: "Tanggal Jatuh Tempo",
            minPaymentFixed: "Minimum Payment",
            isSyariah: "Jenis Kartu"
        }

        for (const [field, error] of Object.entries(formErrors)) {
            const fieldLabel = fieldNames[field] || field
            const errorData = error as any
            if (errorData?.message) {
                errorMessages.push(`${fieldLabel}: ${errorData.message}`)
            } else {
                errorMessages.push(`${fieldLabel}: tidak valid`)
            }
        }

        if (errorMessages.length > 0) {
            setError(errorMessages.join("\n"))
        } else {
            setError("Ada kesalahan validasi, silakan periksa form")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Tambah Akun
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Tambah Akun Baru</DialogTitle>
                    <DialogDescription>
                        Konfigurasi akun dan otomasi perbankan secara fleksibel.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit, onError)} className="grid gap-4 py-4">
                    {/* Template Selector */}
                    <div className="grid gap-2">
                        <Label htmlFor="template">Gunakan Template (Opsional)</Label>
                        <Select onValueChange={handleTemplateChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih template bank sebagai panduan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Tanpa Template (Kustom)</SelectItem>
                                {templates.map((t) => (
                                    <SelectItem key={t.id!} value={t.id!}>{t.nama}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">
                            Template hanya sebagai panduan awal, semua nilai tetap bisa Anda sesuaikan sendiri.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="nama">Nama Akun</Label>
                        <Input
                            id="nama"
                            placeholder="Contoh: BCA Tahapan Utama"
                            {...register("nama")}
                        />
                        {errors.nama && (
                            <p className="text-sm text-red-500">{errors.nama.message}</p>
                        )}
                    </div>

                    <div className={`grid ${isCreditCard ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                        <div className="grid gap-2">
                            <Label htmlFor="tipe">Tipe Akun</Label>
                            <Select
                                value={tipeAkun}
                                onValueChange={(val) => setValue("tipe", val as any)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">Bank</SelectItem>
                                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    <SelectItem value="CASH">Tunai</SelectItem>
                                    <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {/* Hide saldo awal for credit card */}
                        {!isCreditCard && (
                            <div className="space-y-2">
                                <Label>Saldo Awal (Rp)</Label>
                                <NumberInput
                                    placeholder="0"
                                    className="flex-1"
                                    value={watch("saldoAwal")}
                                    decimalScale={useDecimalFormat ? 2 : 0}
                                    fixedDecimalScale={useDecimalFormat}
                                    decimalSeparator=","
                                    onValueChange={(v) => setValue("saldoAwal", v.floatValue)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Credit Card Specific Fields */}
                    {isCreditCard && (
                        <div className="space-y-4 border rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/20 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                                <CreditCard className="h-4 w-4" />
                                <span className="font-semibold text-sm">Pengaturan Kartu Kredit (Wajib)</span>
                            </div>

                            {/* Syariah/Konvensional */}
                            <div className="space-y-2">
                                <Label>Jenis Kartu <span className="text-red-500">*</span></Label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="isSyariah"
                                            checked={isSyariah === false}
                                            onChange={() => setValue("isSyariah", false)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Konvensional</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="isSyariah"
                                            checked={isSyariah === true}
                                            onChange={() => setValue("isSyariah", true)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Syariah</span>
                                    </label>
                                </div>
                            </div>

                            {/* Billing & Due Date */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Tanggal Billing <span className="text-red-500">*</span></Label>
                                    <NumberInput
                                        placeholder="25"
                                        value={watch("billingDate")}
                                        onValueChange={(v) => setValue("billingDate", v.floatValue)}
                                        isAllowed={(values) => {
                                            const { floatValue } = values;
                                            return floatValue === undefined || (floatValue >= 1 && floatValue <= 31);
                                        }}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Tanggal statement keluar (1-31)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tanggal Jatuh Tempo <span className="text-red-500">*</span></Label>
                                    <NumberInput
                                        placeholder="15"
                                        value={watch("dueDate")}
                                        onValueChange={(v) => setValue("dueDate", v.floatValue)}
                                        isAllowed={(values) => {
                                            const { floatValue } = values;
                                            return floatValue === undefined || (floatValue >= 1 && floatValue <= 31);
                                        }}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Deadline pembayaran (1-31)</p>
                                </div>
                            </div>

                            {/* Min Payment & Installment */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Min. Payment (Rp) <span className="text-red-500">*</span></Label>
                                    <NumberInput
                                        placeholder="50000"
                                        value={watch("minPaymentFixed")}
                                        onValueChange={(v) => setValue("minPaymentFixed", v.floatValue)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Minimum Rp 50.000</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Min. Cicilan (Rp)</Label>
                                    <NumberInput
                                        placeholder="500000"
                                        value={watch("minInstallmentAmount")}
                                        onValueChange={(v) => setValue("minInstallmentAmount", v.floatValue)}
                                    />
                                    <p className="text-[10px] text-muted-foreground">Opsional, min untuk konversi</p>
                                </div>
                            </div>

                            {/* Limit Kredit */}
                            <div className="space-y-2">
                                <Label>Limit Kredit (Rp)</Label>
                                <NumberInput
                                    placeholder="10000000"
                                    value={watch("limitKredit")}
                                    onValueChange={(v) => setValue("limitKredit", v.floatValue)}
                                />
                            </div>

                            {/* Info Box for Late Fee Rules */}
                            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="text-xs text-amber-800 dark:text-amber-300">
                                    <strong>Denda Keterlambatan:</strong>
                                    {isSyariah === true ? (
                                        <p className="mt-1">Ta'widh: Rp 75.000 (≤30 hari) atau Rp 100.000 (lebih dari 30 hari)</p>
                                    ) : isSyariah === false ? (
                                        <p className="mt-1">1% dari total tagihan, maksimal Rp 100.000</p>
                                    ) : (
                                        <p className="mt-1 italic">Pilih jenis kartu terlebih dahulu</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Advanced Toggle - Show for all except CASH */}
                    {showAutomation && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full border border-dashed text-xs"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? "Sembunyikan Pengaturan Otomasi" : "Lihat Pengaturan Otomasi"}
                        </Button>
                    )}

                    {showAdvanced && showAutomation && (
                        <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                            {/* Admin Fee Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="font-bold text-primary">Biaya Admin Bulanan</Label>
                                    <Input
                                        type="checkbox"
                                        className="w-4 h-4"
                                        checked={biayaAdminAktif}
                                        onChange={(e) => setValue("biayaAdminAktif", e.target.checked)}
                                    />
                                </div>

                                {biayaAdminAktif && (
                                    <div className="space-y-4 pt-2 border-t border-muted animate-in fade-in slide-in-from-top-1">
                                        <div className="space-y-2">
                                            <Label>Nominal (Rp)</Label>
                                            <NumberInput
                                                placeholder="Bisa diubah sesuai kebutuhan"
                                                value={watch("biayaAdminNominal")}
                                                onValueChange={(v) => setValue("biayaAdminNominal", v.floatValue)}
                                            />
                                        </div>
                                        {/* Show pattern builder only for non-credit card (credit card auto-sets from billing date) */}
                                        {!isCreditCard && (
                                            <PatternBuilderUI
                                                pola={pola}
                                                tanggal={tanggal || null}
                                                onPolaChange={(p) => setValue("biayaAdminPola", p)}
                                                onTanggalChange={(t) => setValue("biayaAdminTanggal", t)}
                                            />
                                        )}
                                        {isCreditCard && (
                                            <p className="text-xs text-muted-foreground italic">
                                                📅 Tanggal otomatis = Billing Date - 1 (H-1 statement)
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Interest Section - Hide for Credit Card */}
                            {!isCreditCard && (
                                <div className="space-y-4 pt-4 border-t">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-primary">Bunga Tabungan</Label>
                                        <Input
                                            type="checkbox"
                                            className="w-4 h-4"
                                            checked={bungaAktif}
                                            onChange={(e) => setValue("bungaAktif", e.target.checked)}
                                        />
                                    </div>

                                    {bungaAktif && (
                                        <div className="space-y-4 pt-2 border-t border-muted animate-in fade-in slide-in-from-top-1">
                                            <TierEditor
                                                tiers={tiers}
                                                onChange={(newTiers) => setValue("bungaTiers", JSON.stringify(newTiers))}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Decimal Format Option */}
                            <div className="space-y-2 pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="font-bold text-primary">Format Desimal</Label>
                                        <p className="text-[10px] text-muted-foreground">Tampilkan 2 desimal (1.203.930,88)</p>
                                    </div>
                                    <Input
                                        type="checkbox"
                                        className="w-4 h-4"
                                        {...register("useDecimalFormat")}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Color Picker & Setoran Awal */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid gap-2">
                            <Label>Warna Akun</Label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-7 h-7 rounded-full border-2 transition-all ${selectedColor === color
                                            ? 'border-foreground scale-110'
                                            : 'border-transparent hover:scale-105'
                                            }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setSelectedColor(color)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded whitespace-pre-line">
                            {error}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Menyimpan..." : "Simpan Akun"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
