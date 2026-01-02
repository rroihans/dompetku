"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import {
    Globe,
    RefreshCw,
    Save,
    ArrowRight,
    Calculator,
    Cloud,
    Key
} from "lucide-react"
import {
    getCurrencyRates,
    updateCurrencyRate,
    convertToIDR,
    fetchLiveRates,
    saveCurrencyApiKey,
    getCurrencyApiKey
} from "@/app/actions/currency"
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from "@/lib/currency"
import { formatRupiah, formatCurrency } from "@/lib/format"
import { useRouter } from "next/navigation"

interface CurrencyRate {
    id: string
    kodeAsal: string
    kodeTujuan: string
    rate: number
    tanggalUpdate: Date | string
    sumber: string | null
}

export function CurrencySettings() {
    const router = useRouter()
    const [rates, setRates] = useState<CurrencyRate[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [editingRate, setEditingRate] = useState<string | null>(null)
    const [editValue, setEditValue] = useState("")

    // API Key state
    const [apiKey, setApiKey] = useState("")
    const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false)
    const [fetchingApi, setFetchingApi] = useState(false)

    // Converter state
    const [converterOpen, setConverterOpen] = useState(false)
    const [fromCurrency, setFromCurrency] = useState("USD")
    const [amount, setAmount] = useState("")
    const [biayaAdmin, setBiayaAdmin] = useState("0")
    const [convertedAmount, setConvertedAmount] = useState<number | null>(null)

    useEffect(() => {
        loadRates()
        loadApiKey()
    }, [])

    const loadRates = async () => {
        setLoading(true)
        try {
            const result = await getCurrencyRates()
            setRates(result.data || [])
        } catch (error) {
            console.error("Error loading rates:", error)
        }
        setLoading(false)
    }

    const loadApiKey = async () => {
        try {
            const result = await getCurrencyApiKey()
            setApiKey(result.data || "")
        } catch (error) {
            console.error("Error loading API key:", error)
        }
    }

    const handleSaveRate = async (kodeAsal: string) => {
        if (!editValue) return

        setSaving(true)
        const result = await updateCurrencyRate(kodeAsal, parseFloat(editValue))
        setSaving(false)

        if (result.success) {
            setEditingRate(null)
            loadRates()
        } else {
            alert("Gagal menyimpan rate")
        }
    }

    const handleFetchLiveRates = async () => {
        if (!apiKey) {
            setApiKeyDialogOpen(true)
            return
        }

        setFetchingApi(true)
        const result = await fetchLiveRates(apiKey)
        setFetchingApi(false)

        if (result.success) {
            loadRates()
            alert("✅ Rates berhasil diperbarui dari API!")
        } else {
            alert("❌ " + (result.error || "Gagal mengambil data"))
        }
    }

    const handleSaveApiKey = async () => {
        const result = await saveCurrencyApiKey(apiKey)
        if (result.success) {
            setApiKeyDialogOpen(false)
            alert("API Key tersimpan!")
        }
    }

    const handleConvert = async () => {
        if (!amount || !fromCurrency) return

        const biayaPersen = parseFloat(biayaAdmin) || 0
        const result = await convertToIDR(parseFloat(amount), fromCurrency, biayaPersen)
        setConvertedAmount(result)
    }

    const getSourceBadge = (sumber: string | null) => {
        if (sumber === "api") return <span className="text-xs px-1.5 py-0.5 bg-blue-500/20 text-blue-500 rounded">API</span>
        if (sumber === "manual") return <span className="text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-500 rounded">Manual</span>
        return <span className="text-xs px-1.5 py-0.5 bg-muted text-muted-foreground rounded">Default</span>
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Globe className="w-5 h-5 text-primary" />
                        Mata Uang Asing
                    </CardTitle>
                    <div className="flex gap-2">
                        {/* Converter Button */}
                        <Dialog open={converterOpen} onOpenChange={setConverterOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Calculator className="w-4 h-4 mr-2" />
                                    Konverter
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Konverter Mata Uang</DialogTitle>
                                    <DialogDescription>
                                        Konversi nominal ke Rupiah (dengan simulasi biaya bank)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Dari</Label>
                                            <Select value={fromCurrency} onValueChange={setFromCurrency}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {SUPPORTED_CURRENCIES.filter(c => c.kode !== "IDR").map(c => (
                                                        <SelectItem key={c.kode} value={c.kode}>
                                                            {c.flag} {c.kode}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Nominal</Label>
                                            <Input
                                                type="number"
                                                placeholder="100"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Biaya Admin Bank */}
                                    <div className="space-y-2">
                                        <Label>Biaya Admin Bank (%)</Label>
                                        <div className="flex gap-2">
                                            {["0", "1", "2", "2.5", "3"].map(persen => (
                                                <Button
                                                    key={persen}
                                                    variant={biayaAdmin === persen ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setBiayaAdmin(persen)}
                                                >
                                                    {persen}%
                                                </Button>
                                            ))}
                                            <Input
                                                type="number"
                                                className="w-20"
                                                placeholder="Custom"
                                                value={!["0", "1", "2", "2.5", "3"].includes(biayaAdmin) ? biayaAdmin : ""}
                                                onChange={(e) => setBiayaAdmin(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Bank biasanya memotong 1-3% untuk konversi mata uang
                                        </p>
                                    </div>

                                    <Button onClick={handleConvert} className="w-full">
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Konversi ke IDR
                                    </Button>
                                    {convertedAmount !== null && (
                                        <div className="p-4 bg-muted rounded-lg text-center">
                                            <p className="text-sm text-muted-foreground mb-1">
                                                {formatCurrency(parseFloat(amount) || 0, fromCurrency)}
                                                {parseFloat(biayaAdmin) > 0 && ` - ${biayaAdmin}% biaya`}
                                            </p>
                                            <p className="text-2xl font-bold text-primary">
                                                {formatRupiah(convertedAmount)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Fetch API Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleFetchLiveRates}
                            disabled={fetchingApi}
                        >
                            <Cloud className={`w-4 h-4 mr-2 ${fetchingApi ? 'animate-pulse' : ''}`} />
                            {fetchingApi ? "..." : "Update"}
                        </Button>

                        {/* API Key Button */}
                        <Dialog open={apiKeyDialogOpen} onOpenChange={setApiKeyDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Key className="w-4 h-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>API Key - CurrencyApi.net</DialogTitle>
                                    <DialogDescription>
                                        Masukkan API key dari currencyapi.net untuk update rates otomatis
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <Input
                                            type="password"
                                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Dapatkan API key gratis di{" "}
                                        <a
                                            href="https://currencyapi.net"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary underline"
                                        >
                                            currencyapi.net
                                        </a>
                                    </p>
                                    <Button onClick={handleSaveApiKey} className="w-full">
                                        <Save className="w-4 h-4 mr-2" />
                                        Simpan API Key
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>

                        {/* Refresh Button */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadRates} disabled={loading}>
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Rate konversi ke Rupiah (IDR). Klik nominal untuk edit manual.
                </p>

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                        ))}
                    </div>
                ) : rates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Globe className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Belum ada data rate</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={loadRates}>
                            Muat Ulang
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {rates.map(rate => {
                            const currencyInfo = getCurrencyInfo(rate.kodeAsal)
                            const isEditing = editingRate === rate.kodeAsal

                            return (
                                <div
                                    key={rate.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{currencyInfo?.flag}</span>
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                {rate.kodeAsal}
                                                {getSourceBadge(rate.sumber)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{currencyInfo?.nama}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isEditing ? (
                                            <>
                                                <Input
                                                    type="number"
                                                    className="w-32 h-8"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    autoFocus
                                                />
                                                <Button
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleSaveRate(rate.kodeAsal)}
                                                    disabled={saving}
                                                >
                                                    <Save className="w-4 h-4" />
                                                </Button>
                                            </>
                                        ) : (
                                            <button
                                                className="text-right hover:bg-muted p-2 rounded transition-colors"
                                                onClick={() => {
                                                    setEditingRate(rate.kodeAsal)
                                                    setEditValue(rate.rate.toString())
                                                }}
                                            >
                                                <p className="font-bold">
                                                    Rp {rate.rate.toLocaleString('id-ID')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    per 1 {rate.kodeAsal}
                                                </p>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Note */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm">
                    <p className="font-medium mb-1">💡 Tentang Konversi Bank</p>
                    <ul className="text-muted-foreground text-xs space-y-1">
                        <li>• Rate bank biasanya berbeda dari rate pasar (spread 1-3%)</li>
                        <li>• Ada biaya admin tambahan per transaksi</li>
                        <li>• Gunakan Konverter untuk simulasi biaya sebenarnya</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    )
}
