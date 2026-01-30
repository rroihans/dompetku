"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { X, Check, Delete, ArrowRight, ArrowLeft, Search, LayoutGrid, List } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // Using custom tabs for styling control
import { createTransaksiSimple, getAkun, createTransfer } from "@/lib/db" // Import createTransfer
import { getAllKategori, type KategoriRecord } from "@/lib/db/kategori-repo"
import { getTransactionTemplates, incrementTemplateUsage } from "@/lib/db/transaction-templates-repo"
import { type TemplateTransaksiRecord } from "@/lib/db/app-db"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { AccountDTO } from "@/lib/account-dto"
import { formatRupiah } from "@/lib/format"

// Schema includes Transfer fields now
const formSchema = z.object({
    nominal: z.number().min(1, "Nominal wajib diisi"), // Changed from coerce to number, manual handling
    kategori: z.string().optional(),
    akunId: z.string().min(1, "Pilih akun"),
    keAkunId: z.string().optional(), // For Transfer
    tipeTransaksi: z.enum(["KELUAR", "MASUK", "TRANSFER"]),
    tanggal: z.string().optional(),
    deskripsi: z.string().max(200, "Maksimal 200 karakter").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface AddTransactionFormProps {
    trigger?: React.ReactNode;
    initialValues?: Partial<FormValues>;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddTransactionForm({ trigger, initialValues, open: controlledOpen, onOpenChange }: AddTransactionFormProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [akunList, setAkunList] = useState<AccountDTO[]>([])
    const [kategoriList, setKategoriList] = useState<KategoriRecord[]>([])
    const [templateList, setTemplateList] = useState<TemplateTransaksiRecord[]>([])

    // View State
    const [view, setView] = useState<"FORM" | "CATEGORY" | "TEMPLATE">("FORM")
    const [searchQuery, setSearchQuery] = useState("")

    // Numpad State
    const [displayVal, setDisplayVal] = useState("0")
    const [mathExpression, setMathExpression] = useState("")

    const open = controlledOpen ?? internalOpen
    const setOpen = (val: boolean) => {
        if (onOpenChange) {
            onOpenChange(val)
        } else {
            setInternalOpen(val)
        }
    }

    const {
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nominal: 0,
            kategori: "",
            akunId: "",
            keAkunId: "",
            tipeTransaksi: "KELUAR",
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: "",
        },
    })

    const tipeTransaksi = watch("tipeTransaksi")
    const kategoriValue = watch("kategori")
    const akunIdValue = watch("akunId")
    const keAkunIdValue = watch("keAkunId")
    const nominalValue = watch("nominal")

    // Effects for Data Loading and Reset
    useEffect(() => {
        if (open) {
            // Load Data
            getAkun().then((akuns) => {
                const filtered = akuns.filter((a: AccountDTO) =>
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                )
                // Unique check
                const unique = filtered.filter((akun: AccountDTO, index: number, self: AccountDTO[]) =>
                    index === self.findIndex((a) => a.id === akun.id)
                )
                setAkunList(unique)
                setAkunList(unique)
            }).catch(console.error)

            getAllKategori().then(setKategoriList).catch(console.error)
            getTransactionTemplates().then(res => {
                if (res.success && res.data) setTemplateList(res.data)
            }).catch(console.error)
        } else {
            // Reset view when closed
            setView("FORM")
            setSearchQuery("")
        }
    }, [open])

    useEffect(() => {
        if (open) {
            if (initialValues) {
                reset({
                    nominal: initialValues.nominal || 0,
                    kategori: initialValues.kategori || "",
                    akunId: initialValues.akunId || "",
                    keAkunId: initialValues.keAkunId || "",
                    tipeTransaksi: initialValues.tipeTransaksi || "KELUAR",
                    tanggal: initialValues.tanggal || new Date().toISOString().split('T')[0],
                    deskripsi: initialValues.deskripsi || "",
                })
                setDisplayVal((initialValues.nominal || 0).toString())
            } else {
                reset({
                    nominal: 0,
                    kategori: "",
                    akunId: "",
                    keAkunId: "",
                    tipeTransaksi: "KELUAR",
                    tanggal: new Date().toISOString().split('T')[0],
                    deskripsi: "",
                })
                setDisplayVal("0")
            }
        }
    }, [open, initialValues, reset])

    // Background Color Logic
    const getBgColor = () => {
        // 5. Account Color takes precedence if an account is selected
        if (akunIdValue) {
            const selectedAkun = akunList.find(a => a.id === akunIdValue)
            if (selectedAkun && selectedAkun.warna) {
                // Tailwind arbitrary value for dynamic hex, handled via style usually, 
                // but since we need class names for consistency, we might stick to default types if no hex is supported inline nicely.
                // However, user asked to reflect account color.
                // We will return a special class marker and handle inline style in the div.
                return "custom-color"
            }
        }

        switch (tipeTransaksi) {
            case "KELUAR": return "bg-amber-500"
            case "MASUK": return "bg-emerald-500"
            case "TRANSFER": return "bg-blue-500"
            default: return "bg-amber-500"
        }
    }

    const currentAkunColor = akunIdValue ? akunList.find(a => a.id === akunIdValue)?.warna : null
    const bgStyle = currentAkunColor ? { backgroundColor: currentAkunColor } : {}
    const defaultBgClass = getBgColor() === "custom-color" ? "" : getBgColor()

    // Helper functions for View Handling
    const handleCategorySelect = (catName: string) => {
        setValue("kategori", catName)
        setView("FORM")
    }

    const handleTemplateSelect = async (template: TemplateTransaksiRecord) => {
        setValue("nominal", template.nominal)
        setValue("kategori", template.kategori)
        setValue("akunId", template.akunId)
        setValue("tipeTransaksi", template.tipeTransaksi as "MASUK" | "KELUAR" | "TRANSFER") // Ensure type compatibility
        setValue("deskripsi", template.deskripsi)
        setDisplayVal(template.nominal.toString())

        await incrementTemplateUsage(template.id)
        setView("FORM")
    }

    // Numpad Handling
    const handleNumClick = (val: string) => {
        if (displayVal === "0" && val !== ".") {
            setDisplayVal(val)
        } else {
            // Prevent multiple dots
            if (val === "." && displayVal.includes(".")) return
            setDisplayVal(prev => prev + val)
        }
    }

    const handleDelete = () => {
        setDisplayVal(prev => prev.length > 1 ? prev.slice(0, -1) : "0")
    }

    // Sync Display with Form
    useEffect(() => {
        const val = parseFloat(displayVal)
        setValue("nominal", isNaN(val) ? 0 : val)
    }, [displayVal, setValue])


    async function onSubmit(values: FormValues) {
        setLoading(true)
        try {
            const idempotencyKey = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`

            if (values.tipeTransaksi === "TRANSFER") {
                // Transfer Logic
                if (!values.keAkunId || values.akunId === values.keAkunId) {
                    toast.error("Akun tujuan tidak valid")
                    setLoading(false)
                    return
                }
                const res = await createTransfer({
                    dariAkunId: values.akunId,
                    keAkunId: values.keAkunId,
                    nominal: values.nominal,
                    catatan: values.deskripsi,
                    tanggal: values.tanggal ? new Date(values.tanggal) : undefined,
                    idempotencyKey,
                })
                handleResult(res, "Transfer berhasil")

            } else {
                // Income/Expense Logic
                const res = await createTransaksiSimple({
                    nominal: values.nominal,
                    kategori: values.kategori || "", // Optional for logic but usually required
                    akunId: values.akunId,
                    tipeTransaksi: values.tipeTransaksi as "MASUK" | "KELUAR",
                    tanggal: values.tanggal ? new Date(values.tanggal) : undefined,
                    deskripsi: values.deskripsi,
                    idempotencyKey,
                })
                handleResult(res, "Transaksi berhasil disimpan")
            }

        } catch (error) {
            console.error(error)
            toast.error("Terjadi kesalahan sistem")
            setLoading(false)
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleResult(res: any, successMsg: string) {
        if (res.success) {
            setOpen(false)
            reset()
            toast.success(successMsg)
            // Show budget alert if any
            if (res.alert && res.alert.level !== "SAFE") {
                if (res.alert.level === "CRITICAL" || res.alert.level === "DANGER") {
                    toast.error(res.alert.message, { duration: 5000 })
                } else {
                    toast.warning(res.alert.message, { duration: 5000 })
                }
            }
        } else {
            toast.error(res.error || "Gagal menyimpan")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="p-0 gap-0 sm:max-w-md w-full overflow-hidden border-none shadow-none h-full sm:h-auto sm:rounded-xl">
                <DialogHeader className="sr-only">
                    <DialogTitle>Buat Transaksi Baru</DialogTitle>
                    <DialogDescription>
                        Form untuk mencatat pemasukan, pengeluaran, atau transfer.
                    </DialogDescription>
                </DialogHeader>
                <style jsx global>{`
                    /* Hide standard close button via CSS if accessible */
                    button[aria-label="Close"] { display: none; } 
                `}</style>

                {view === "FORM" ? (
                    <>
                        {/* Header & Display Section (Colored) */}
                        <div
                            className={cn("transition-colors duration-300 p-6 pb-8 text-white flex flex-col justify-between min-h-[40vh]", defaultBgClass)}
                            style={bgStyle}
                        >
                            {/* Top Bar */}
                            <div className="flex justify-between items-center mb-6">
                                <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setOpen(false)}>
                                    <X className="w-6 h-6" />
                                </Button>
                                <div className="flex gap-1 bg-black/20 p-1 rounded-lg">
                                    {(["MASUK", "KELUAR", "TRANSFER"] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setValue("tipeTransaksi", type)}
                                            className={cn(
                                                "px-3 py-1 rounded-md text-xs font-bold transition-all",
                                                tipeTransaksi === type ? "bg-white text-black shadow-sm" : "text-white/70 hover:bg-white/10"
                                            )}
                                        >
                                            {type === "MASUK" ? "INCOME" : type === "KELUAR" ? "EXPENSE" : "TRANSFER"}
                                        </button>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-white hover:bg-white/20"
                                    onClick={handleSubmit(onSubmit)}
                                    disabled={loading}
                                >
                                    <Check className="w-6 h-6" />
                                </Button>
                            </div>

                            {/* Amount Display */}
                            <div className="text-center space-y-2 mt-auto">
                                <div className="flex items-center justify-center gap-2 text-5xl font-bold tracking-tight">
                                    {/* +/- Signs */}
                                    {tipeTransaksi === "KELUAR" && <span>-</span>}
                                    {tipeTransaksi === "MASUK" && <span>+</span>}

                                    <span>{formatRupiah(parseFloat(displayVal)).replace("Rp", "").trim()}</span>
                                </div>
                                <div className="text-xl font-medium opacity-80">IDR</div>
                            </div>

                            {/* Selectors Row */}
                            {tipeTransaksi === "TRANSFER" ? (
                                /* Transfer UI Improvements */
                                <div className="flex items-center justify-between gap-2 mt-8 px-2">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-white/80 text-[10px] uppercase tracking-wider block text-center">From Account</Label>
                                        <Select value={akunIdValue} onValueChange={(val) => setValue("akunId", val, { shouldValidate: true })}>
                                            <SelectTrigger className="bg-white/10 border-none text-white text-center h-10 font-bold text-xs p-0 px-1 focus:ring-0">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {akunList.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <ArrowRight className="text-white/70 w-5 h-5 mt-4" />

                                    <div className="flex-1 space-y-1">
                                        <Label className="text-white/80 text-[10px] uppercase tracking-wider block text-center">To Account</Label>
                                        <Select value={keAkunIdValue} onValueChange={(val) => setValue("keAkunId", val, { shouldValidate: true })}>
                                            <SelectTrigger className="bg-white/10 border-none text-white text-center h-10 font-bold text-xs p-0 px-1 focus:ring-0">
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {akunList.filter(a => a.id !== akunIdValue).map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Income/Expense Selectors */
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="space-y-1">
                                        <Label className="text-white/80 text-xs uppercase tracking-wider block text-center">Account</Label>
                                        <Select value={akunIdValue} onValueChange={(val) => setValue("akunId", val, { shouldValidate: true })}>
                                            <SelectTrigger className="bg-white/10 border-none text-white text-center h-10 font-semibold focus:ring-0 focus:ring-offset-0">
                                                <SelectValue placeholder="Select Account" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {akunList.map(a => (
                                                    <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-white/80 text-xs uppercase tracking-wider block text-center">Category</Label>
                                        <Button
                                            variant="ghost"
                                            className="w-full bg-white/10 border-none text-white text-center h-10 font-semibold hover:bg-white/20"
                                            onClick={() => setView("CATEGORY")}
                                        >
                                            {kategoriValue || "Select Category"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Templates Bar or Transfer Target */}
                        {tipeTransaksi === "TRANSFER" ? (
                            <div className="bg-muted/30 py-2 px-4 flex justify-between items-center text-xs text-muted-foreground border-b border-border/10">
                                <span className="font-medium">Estimasi Saldo Akhir</span>
                                <span className="font-bold">
                                    {keAkunIdValue
                                        ? formatRupiah((akunList.find(a => a.id === keAkunIdValue)?.saldoSekarang || 0) + parseFloat(displayVal))
                                        : "0"}
                                </span>
                            </div>
                        ) : (
                            <div className="bg-muted/30 py-1 px-4 flex justify-center border-b border-border/10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground w-full"
                                    onClick={() => setView("TEMPLATE")}
                                >
                                    TEMPLATES ({templateList.length})
                                </Button>
                            </div>
                        )}

                        {/* Numpad Section */}
                        <div className="bg-background md:p-4 grid grid-cols-4 md:gap-2 text-center h-full">
                            {[7, 8, 9, '÷'].map((btn, i) => (
                                <Button key={i} variant="ghost" className="h-16 text-2xl font-normal rounded-none md:rounded-md active:bg-muted" onClick={() => typeof btn === 'number' ? handleNumClick(btn.toString()) : null /* Math not impl */}>
                                    {btn}
                                </Button>
                            ))}
                            {[4, 5, 6, 'x'].map((btn, i) => (
                                <Button key={i} variant="ghost" className="h-16 text-2xl font-normal rounded-none md:rounded-md active:bg-muted" onClick={() => typeof btn === 'number' ? handleNumClick(btn.toString()) : null}>
                                    {btn}
                                </Button>
                            ))}
                            {[1, 2, 3, '-'].map((btn, i) => (
                                <Button key={i} variant="ghost" className="h-16 text-2xl font-normal rounded-none md:rounded-md active:bg-muted" onClick={() => typeof btn === 'number' ? handleNumClick(btn.toString()) : null}>
                                    {btn}
                                </Button>
                            ))}
                            {['.', 0, '⌫', '+'].map((btn, i) => (
                                <Button key={i} variant="ghost" className="h-16 text-2xl font-normal rounded-none md:rounded-md active:bg-muted" onClick={() => {
                                    if (btn === '⌫') handleDelete()
                                    else if (typeof btn === 'number' || btn === '.') handleNumClick(btn.toString())
                                }}>
                                    {btn === '⌫' ? <Delete className="w-6 h-6" /> : btn}
                                </Button>
                            ))}
                        </div>
                    </>
                ) : view === "CATEGORY" ? (
                    /* Category Selection View */
                    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setView("FORM")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <Input
                                placeholder="Search Category..."
                                className="border-none bg-muted focus-visible:ring-0"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <Label className="text-muted-foreground text-xs font-bold uppercase mb-4 block">Most Frequent</Label>
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {/* Temporary: Just show top 4 from list */}
                                {kategoriList.filter(k => k.show && !k.parentId).slice(0, 4).map(k => (
                                    <button key={k.id} className="flex flex-col items-center gap-2" onClick={() => handleCategorySelect(k.nama)}>
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                                            style={{ backgroundColor: k.warna || "#ccc" }}
                                        >
                                            <span className="text-lg font-bold">{k.nama[0]}</span>
                                        </div>
                                        <span className="text-[10px] text-center leading-tight truncate w-full">{k.nama}</span>
                                    </button>
                                ))}
                            </div>

                            <Label className="text-muted-foreground text-xs font-bold uppercase mb-4 block">All Categories</Label>
                            <div className="space-y-4">
                                {kategoriList
                                    .filter(k => k.show && !k.parentId)
                                    .filter(k => k.nama.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(k => (
                                        <button
                                            key={k.id}
                                            className="flex items-center gap-4 w-full p-2 hover:bg-muted rounded-lg transition-colors"
                                            onClick={() => handleCategorySelect(k.nama)}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                                                style={{ backgroundColor: k.warna || "#ccc" }}
                                            >
                                                <span className="font-bold">{k.nama[0]}</span>
                                            </div>
                                            <div className="text-left">
                                                <div className="font-medium text-sm">{k.nama}</div>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Template Selection View */
                    <div className="flex flex-col h-full bg-background animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setView("FORM")}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <span className="font-bold text-lg">Select Template</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-3">
                                {templateList.length === 0 && <p className="text-center text-muted-foreground py-10">No templates found.</p>}
                                {templateList.map(t => (
                                    <button
                                        key={t.id}
                                        className="flex items-center justify-between w-full p-3 border rounded-lg hover:bg-muted transition-colors hover:shadow-sm"
                                        onClick={() => handleTemplateSelect(t)}
                                    >
                                        <div className="flex items-center gap-3 text-left">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                                                t.tipeTransaksi === "MASUK" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                                            )}>
                                                {t.tipeTransaksi === "MASUK" ? "+" : "-"}
                                            </div>
                                            <div>
                                                <div className="font-bold text-sm">{t.nama}</div>
                                                <div className="text-xs text-muted-foreground">{t.kategori} • {formatRupiah(t.nominal)}</div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
