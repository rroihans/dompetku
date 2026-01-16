"use client"

import { useState, useEffect } from "react"
import { ArrowRightLeft, Calculator, Loader2 } from "lucide-react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { toast } from "sonner"
import {
    convertTransactionToInstallment,
    getInstallmentTemplates,
    getConversionPreview
} from "@/app/actions/installment"
import { formatRupiah } from "@/lib/format"

interface ConvertToInstallmentDialogProps {
    transaksiId: string
    transaksiDeskripsi: string
    transaksiNominal: number
    akunNama: string
    onSuccess?: () => void
}

interface InstallmentTemplate {
    id: string
    nama: string
    bankName: string
    cardType: string
    tenorOptions: string
    adminFeeType: string
    adminFeeAmount: number | null
    notes: string | null
}

interface Preview {
    originalNominal: number
    adminFee: number
    adminFeeType: string
    total: number
    tenor: number
    monthlyPayment: number
    deskripsi: string
}

export function ConvertToInstallmentDialog({
    transaksiId,
    transaksiDeskripsi,
    transaksiNominal,
    akunNama,
    onSuccess
}: ConvertToInstallmentDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingTemplates, setLoadingTemplates] = useState(true)
    const [loadingPreview, setLoadingPreview] = useState(false)

    // Form state
    const [mode, setMode] = useState<"template" | "manual">("template")
    const [templates, setTemplates] = useState<InstallmentTemplate[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
    const [selectedTenor, setSelectedTenor] = useState<number>(3)
    const [manualTenor, setManualTenor] = useState<string>("3")
    const [manualAdminFee, setManualAdminFee] = useState<string>("0")
    const [manualAdminFeeType, setManualAdminFeeType] = useState<"FLAT" | "PERCENTAGE">("FLAT")

    // Preview state
    const [preview, setPreview] = useState<Preview | null>(null)

    // Load templates on mount
    useEffect(() => {
        if (open) {
            loadTemplates()
        }
    }, [open])

    // Load preview when inputs change
    useEffect(() => {
        if (!open) return

        const debounce = setTimeout(() => {
            loadPreview()
        }, 300)

        return () => clearTimeout(debounce)
    }, [mode, selectedTemplateId, selectedTenor, manualTenor, manualAdminFee, manualAdminFeeType])

    async function loadTemplates() {
        setLoadingTemplates(true)
        const result = await getInstallmentTemplates()
        if (result.success) {
            setTemplates(result.data as InstallmentTemplate[])
        }
        setLoadingTemplates(false)
    }

    async function loadPreview() {
        if (mode === "template" && !selectedTemplateId) return

        const tenor = mode === "template" ? selectedTenor : parseInt(manualTenor) || 3
        const adminFee = mode === "manual" ? parseFloat(manualAdminFee) || 0 : undefined
        const adminFeeType = mode === "manual" ? manualAdminFeeType : undefined

        setLoadingPreview(true)
        const result = await getConversionPreview(
            transaksiId,
            tenor,
            mode === "template" ? selectedTemplateId : undefined,
            adminFee,
            adminFeeType
        )

        if (result.success && result.data) {
            setPreview(result.data as Preview)
        }
        setLoadingPreview(false)
    }

    function handleTemplateChange(templateId: string) {
        setSelectedTemplateId(templateId)
        const template = templates.find(t => t.id === templateId)
        if (template) {
            const tenorOptions = JSON.parse(template.tenorOptions) as number[]
            if (tenorOptions.length > 0) {
                setSelectedTenor(tenorOptions[0])
            }
        }
    }

    async function handleSubmit() {
        const tenor = mode === "template" ? selectedTenor : parseInt(manualTenor) || 3

        if (tenor < 1 || tenor > 60) {
            toast.error("Tenor harus antara 1-60 bulan")
            return
        }

        setLoading(true)
        const result = await convertTransactionToInstallment({
            transaksiId,
            tenor,
            templateId: mode === "template" ? selectedTemplateId : undefined,
            adminFeeAmount: mode === "manual" ? parseFloat(manualAdminFee) || 0 : undefined,
            adminFeeType: mode === "manual" ? manualAdminFeeType : undefined
        })

        if (result.success) {
            toast.success(result.message || "Berhasil dikonversi ke cicilan")
            setOpen(false)
            onSuccess?.()
        } else {
            toast.error(result.error || "Gagal mengkonversi ke cicilan")
        }
        setLoading(false)
    }

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId)
    const tenorOptions = selectedTemplate ? JSON.parse(selectedTemplate.tenorOptions) as number[] : []

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Convert ke Cicilan
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Convert ke Cicilan</DialogTitle>
                    <DialogDescription>
                        Ubah transaksi ini menjadi rencana cicilan
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Transaction Info */}
                    <div className="p-3 rounded-lg bg-muted/50">
                        <p className="font-medium truncate">{transaksiDeskripsi}</p>
                        <p className="text-sm text-muted-foreground mt-1" data-private="true">
                            {formatRupiah(transaksiNominal)} dari {akunNama}
                        </p>
                    </div>

                    {/* Mode Toggle */}
                    <RadioGroup value={mode} onValueChange={(v: string) => setMode(v as "template" | "manual")}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="template" id="template" />
                            <Label htmlFor="template">Gunakan Template Bank</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="manual" id="manual" />
                            <Label htmlFor="manual">Input Manual</Label>
                        </div>
                    </RadioGroup>

                    {/* Template Mode */}
                    {mode === "template" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Pilih Template</Label>
                                {loadingTemplates ? (
                                    <div className="text-sm text-muted-foreground">Memuat template...</div>
                                ) : templates.length === 0 ? (
                                    <div className="text-sm text-amber-600">
                                        Belum ada template. Gunakan mode manual.
                                    </div>
                                ) : (
                                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih template cicilan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t.id} value={t.id}>
                                                    {t.nama}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>

                            {selectedTemplateId && tenorOptions.length > 0 && (
                                <div className="space-y-2">
                                    <Label>Pilih Tenor</Label>
                                    <Select
                                        value={selectedTenor.toString()}
                                        onValueChange={(v) => setSelectedTenor(parseInt(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tenorOptions.map((t) => (
                                                <SelectItem key={t} value={t.toString()}>
                                                    {t} Bulan
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {selectedTemplate?.notes && (
                                <p className="text-xs text-muted-foreground italic">
                                    📌 {selectedTemplate.notes}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Manual Mode */}
                    {mode === "manual" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label>Tenor (Bulan)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={60}
                                    value={manualTenor}
                                    onChange={(e) => setManualTenor(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Biaya Admin</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={manualAdminFee}
                                        onChange={(e) => setManualAdminFee(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tipe</Label>
                                    <Select
                                        value={manualAdminFeeType}
                                        onValueChange={(v) => setManualAdminFeeType(v as "FLAT" | "PERCENTAGE")}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FLAT">Flat (Rp)</SelectItem>
                                            <SelectItem value="PERCENTAGE">Persen (%)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Calculation */}
                    {preview && (
                        <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
                            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
                                <Calculator className="h-4 w-4" />
                                Preview Kalkulasi
                            </div>
                            {loadingPreview ? (
                                <div className="text-sm text-muted-foreground">Menghitung...</div>
                            ) : (
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Nominal Transaksi</span>
                                        <span data-private="true">{formatRupiah(preview.originalNominal)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Biaya Admin</span>
                                        <span data-private="true">{formatRupiah(preview.adminFee)}</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-1">
                                        <span className="text-muted-foreground">Total</span>
                                        <span data-private="true">{formatRupiah(preview.total)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 text-emerald-700 dark:text-emerald-400 font-semibold">
                                        <span>Cicilan/Bulan</span>
                                        <span data-private="true">{formatRupiah(preview.monthlyPayment)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || (mode === "template" && !selectedTemplateId)}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Mengkonversi...
                            </>
                        ) : (
                            `Convert ke Cicilan ${mode === "template" ? selectedTenor : manualTenor || 3} Bulan`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
