"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { 
    Plus, 
    Trash2, 
    Info, 
    Calendar as CalendarIcon, 
    Calculator, 
    RefreshCcw,
    CheckCircle2,
    XCircle
} from "lucide-react"
import { TierBunga, calculateNextBillingDate, getApplicableInterestRate } from "@/lib/template-utils"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"

// --- PatternBuilderUI ---
interface PatternBuilderUIProps {
    pola: string;
    tanggal: number | null;
    onPolaChange: (pola: string) => void;
    onTanggalChange: (tanggal: number | null) => void;
}

export function PatternBuilderUI({ pola, tanggal, onPolaChange, onTanggalChange }: PatternBuilderUIProps) {
    const nextDates = useMemo(() => {
        const dates: Date[] = []
        let lastDate = new Date()
        for (let i = 0; i < 5; i++) {
            const next = calculateNextBillingDate(pola, tanggal, lastDate)
            dates.push(next)
            // Move lastDate slightly forward to find the one after next
            lastDate = new Date(next)
            lastDate.setDate(lastDate.getDate() + 1)
        }
        return dates
    }, [pola, tanggal])

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Pola Tagihan</Label>
                    <Select value={pola} onValueChange={onPolaChange}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MANUAL">Manual (Tanpa Otomasi)</SelectItem>
                            <SelectItem value="TANGGAL_TETAP">Tanggal Tetap (1-31)</SelectItem>
                            <SelectItem value="JUMAT_MINGGU_KETIGA">Jumat Minggu Ke-3</SelectItem>
                            <SelectItem value="HARI_KERJA_TERAKHIR">Hari Kerja Terakhir</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {pola === "TANGGAL_TETAP" && (
                    <div className="space-y-2">
                        <Label>Tanggal (1-31)</Label>
                        <Input
                            type="number"
                            min="1"
                            max="31"
                            value={tanggal || ""}
                            onChange={(e) => onTanggalChange(e.target.value ? parseInt(e.target.value) : null)}
                            placeholder="Contoh: 15"
                        />
                    </div>
                )}
            </div>

            <div className="p-3 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Preview 5 Jadwal Berikutnya
                </div>
                <div className="grid grid-cols-1 gap-1">
                    {nextDates.map((date, i) => (
                        <div key={i} className="text-xs flex justify-between py-1 border-b last:border-0 border-muted">
                            <span className="text-muted-foreground">Tagihan #{i + 1}</span>
                            <span className="font-mono">
                                {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground flex gap-1 items-start">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>
                        {pola === "MANUAL" 
                            ? "Pola manual tidak akan menggenerate transaksi otomatis." 
                            : "Estimasi tanggal berdasarkan aturan pola yang dipilih."}
                    </span>
                </div>
            </div>
        </div>
    )
}

// --- TierEditor ---
interface TierEditorProps {
    tiers: TierBunga[];
    onChange: (tiers: TierBunga[]) => void;
}

export function TierEditor({ tiers, onChange }: TierEditorProps) {
    const handleAddTier = () => {
        const lastMax = tiers.length > 0 ? tiers[tiers.length - 1].max_saldo : 0
        onChange([...tiers, { min_saldo: lastMax || 0, max_saldo: null, bunga_pa: 0 }])
    }

    const handleRemoveTier = (index: number) => {
        onChange(tiers.filter((_, i) => i !== index))
    }

    const handleUpdateTier = (index: number, field: keyof TierBunga, value: number | null) => {
        const newTiers = [...tiers]
        newTiers[index] = { ...newTiers[index], [field]: value }
        onChange(newTiers)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Konfigurasi Tier Bunga</Label>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[250px]">
                            <p>Bunga dihitung berdasarkan <strong>saldo terendah</strong> akun Anda di bulan lalu untuk akurasi maksimal.</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTier}>
                    <Plus className="w-4 h-4 mr-1" /> Tambah Tier
                </Button>
            </div>

            {tiers.length === 0 ? (
                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm italic">
                    Belum ada tier bunga. Klik tambah untuk memulai.
                </div>
            ) : (
                <div className="space-y-3">
                    {tiers.map((tier, idx) => (
                        <div key={idx} className="relative p-3 border rounded-lg bg-card group">
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full opacity-50" />
                            <div className="flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Min. Saldo</Label>
                                        <Input 
                                            type="number" 
                                            className="h-8 text-sm"
                                            value={tier.min_saldo}
                                            onChange={(e) => handleUpdateTier(idx, 'min_saldo', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Max. Saldo</Label>
                                        <Input 
                                            type="number" 
                                            className="h-8 text-sm"
                                            placeholder="Infinity"
                                            value={tier.max_saldo || ""}
                                            onChange={(e) => handleUpdateTier(idx, 'max_saldo', e.target.value ? parseFloat(e.target.value) : null)}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[10px] uppercase text-muted-foreground">Bunga (% p.a.)</Label>
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                step="0.01"
                                                className="h-8 text-sm pr-6"
                                                value={tier.bunga_pa}
                                                onChange={(e) => handleUpdateTier(idx, 'bunga_pa', parseFloat(e.target.value) || 0)}
                                            />
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleRemoveTier(idx)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Visual Range Indicator */}
            {tiers.length > 0 && (
                <div className="mt-4 space-y-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Visual Range Preview</Label>
                    <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted">
                        {tiers.map((tier, i) => {
                            const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500']
                            return (
                                <div 
                                    key={i} 
                                    className={cn(colors[i % colors.length], "h-full border-r last:border-0 border-white/20")}
                                    style={{ flex: 1 }}
                                    title={`Tier ${i+1}: ${tier.bunga_pa}%`}
                                />
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

// --- InterestCalculator ---
export function InterestCalculator({ tiers }: { tiers: TierBunga[] }) {
    const [testSaldo, setTestSaldo] = useState<string>("10000000")
    
    const calculation = useMemo(() => {
        const saldoNum = parseFloat(testSaldo) || 0
        const ratePa = getApplicableInterestRate(saldoNum, tiers)
        const interestGross = (saldoNum * (ratePa / 100)) / 12
        const tax = interestGross * 0.20 // Pajak 20%
        const netInterest = interestGross - tax

        return {
            ratePa,
            interestGross,
            tax,
            netInterest
        }
    }, [testSaldo, tiers])

    return (
        <div className="p-4 border rounded-xl bg-primary/5 space-y-4">
            <div className="flex items-center gap-2 font-semibold text-sm">
                <Calculator className="w-4 h-4 text-primary" />
                Simulasi Bunga Bulanan
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="simulasi-saldo" className="text-xs">Saldo Simulasi (Rp)</Label>
                <Input 
                    id="simulasi-saldo"
                    type="number"
                    value={testSaldo}
                    onChange={(e) => setTestSaldo(e.target.value)}
                    placeholder="Masukkan saldo..."
                    className="bg-background"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="p-2 border rounded-lg bg-background">
                    <div className="text-[10px] text-muted-foreground uppercase">Rate p.a.</div>
                    <div className="font-bold text-lg">{calculation.ratePa.toFixed(2)}%</div>
                </div>
                <div className="p-2 border rounded-lg bg-background">
                    <div className="text-[10px] text-muted-foreground uppercase">Bunga Bruto</div>
                    <div className="font-bold text-lg text-emerald-600">{formatCurrency(Math.round(calculation.interestGross))}</div>
                </div>
                <div className="p-2 border rounded-lg bg-background">
                    <div className="text-[10px] text-muted-foreground uppercase">Pajak (20%)</div>
                    <div className="font-bold text-sm text-destructive">-{formatCurrency(Math.round(calculation.tax))}</div>
                </div>
                <div className="p-2 border rounded-lg bg-primary/10 border-primary/20">
                    <div className="text-[10px] text-primary uppercase font-bold">Bunga Netto</div>
                    <div className="font-bold text-lg text-primary">{formatCurrency(Math.round(calculation.netInterest))}</div>
                </div>
            </div>

            <p className="text-[10px] text-muted-foreground italic text-center">
                *Metode Saldo Terendah memastikan estimasi bunga tetap akurat meskipun Anda melakukan penarikan besar di tengah bulan.
            </p>
        </div>
    )
}

// --- ComparisonTable ---
interface ComparisonTableProps {
    template: {
        biayaAdmin: number | null;
        polaTagihan: string;
        tanggalTagihan: number | null;
        bungaTier: string | null;
    } | null;
    current: {
        biayaAdminNominal: number | null;
        biayaAdminPola: string | null;
        biayaAdminTanggal: number | null;
        bungaTiers: string | null;
    };
}

export function ComparisonTable({ template, current }: ComparisonTableProps) {
    if (!template) return null

    const templateTiers = template.bungaTier ? JSON.parse(template.bungaTier) as TierBunga[] : []
    const currentTiers = current.bungaTiers ? JSON.parse(current.bungaTiers) as TierBunga[] : []

    const rows = [
        {
            label: "Nominal Admin",
            template: formatCurrency(template.biayaAdmin || 0),
            current: formatCurrency(current.biayaAdminNominal || 0),
            isChanged: (template.biayaAdmin || 0) !== (current.biayaAdminNominal || 0)
        },
        {
            label: "Pola Tagihan",
            template: template.polaTagihan.replace(/_/g, ' '),
            current: (current.biayaAdminPola || "MANUAL").replace(/_/g, ' '),
            isChanged: template.polaTagihan !== current.biayaAdminPola
        },
        {
            label: "Tanggal Tagihan",
            template: template.tanggalTagihan || "-",
            current: current.biayaAdminTanggal || "-",
            isChanged: template.tanggalTagihan !== current.biayaAdminTanggal
        },
        {
            label: "Jumlah Tier Bunga",
            template: templateTiers.length,
            current: currentTiers.length,
            isChanged: templateTiers.length !== currentTiers.length
        }
    ]

    return (
        <div className="border rounded-lg overflow-hidden text-sm">
            <table className="w-full">
                <thead className="bg-muted/50">
                    <tr>
                        <th className="text-left p-2 font-medium border-b">Parameter</th>
                        <th className="text-left p-2 font-medium border-b">Template Default</th>
                        <th className="text-left p-2 font-medium border-b">Nilai Saat Ini</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                            <td className="p-2 font-medium text-muted-foreground">{row.label}</td>
                            <td className="p-2">{row.template}</td>
                            <td className={cn("p-2 font-semibold", row.isChanged ? "text-orange-600 flex items-center gap-1" : "text-emerald-600 flex items-center gap-1")}>
                                {row.current}
                                {row.isChanged ? <RefreshCcw className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
