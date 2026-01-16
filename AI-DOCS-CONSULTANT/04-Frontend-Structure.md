# Frontend Architecture (Next.js App Router)


## File: src\app\akun\loading.tsx
```typescript
import { AccountCardSkeleton } from "@/components/ui/skeleton"

export default function AkunLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>
            </div>

            {/* Account Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
                <AccountCardSkeleton />
                <AccountCardSkeleton />
                <AccountCardSkeleton />
                <AccountCardSkeleton />
            </div>
        </div>
    )
}

```

## File: src\app\akun\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Wallet,
    CreditCard,
    Smartphone,
    Banknote,
    MoreVertical,
    ArrowUpRight,
    History,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { AddAccountForm } from "@/components/forms/add-account-form"
import { TransferForm } from "@/components/forms/transfer-form"
import { AkunActions } from "@/components/akun/akun-actions"
import { getAkunUser } from "@/app/actions/akun"
import { getActiveAccountTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { calculateNextBillingDate } from "@/lib/template-utils"
import Link from "next/link"

interface PageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function AkunPage({ searchParams }: PageProps) {
    const params = await searchParams
    const currentPage = Number(params.page) || 1
    const [result, templatesResult] = await Promise.all([
        getAkunUser(currentPage),
        getActiveAccountTemplates()
    ])
    const accounts = result.data
    const { pagination } = result
    const templates = templatesResult.data || []

    const getIcon = (type: string) => {
        switch (type) {
            case 'BANK': return Wallet
            case 'E_WALLET': return Smartphone
            case 'CREDIT_CARD': return CreditCard
            case 'CASH': return Banknote
            default: return Wallet
        }
    }

    const getDefaultColor = (type: string) => {
        switch (type) {
            case 'BANK': return '#3b82f6' // blue
            case 'E_WALLET': return '#8b5cf6' // purple
            case 'CREDIT_CARD': return '#ef4444' // red
            case 'CASH': return '#22c55e' // green
            default: return '#6b7280' // gray
        }
    }

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'BANK': return { label: 'Bank', bg: '#dbeafe', text: '#1d4ed8' }
            case 'E_WALLET': return { label: 'E-Wallet', bg: '#ede9fe', text: '#7c3aed' }
            case 'CREDIT_CARD': return { label: 'Kartu Kredit', bg: '#fee2e2', text: '#dc2626' }
            case 'CASH': return { label: 'Tunai', bg: '#dcfce7', text: '#16a34a' }
            default: return { label: type, bg: '#f3f4f6', text: '#4b5563' }
        }
    }


    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Manajemen Akun</h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Kelola semua rekening bank, e-wallet, dan kartu kredit Anda.
                    </p>
                </div>
                <div className="flex gap-2">
                    <TransferForm />
                    <AddAccountForm templates={templates} />
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {accounts.map((account: any) => {
                    const Icon = getIcon(account.tipe)
                    const isNegative = account.saldoSekarang < 0
                    // Use custom color or default based on type
                    const accentColor = account.warna || getDefaultColor(account.tipe)
                    const typeBadge = getTypeBadge(account.tipe)

                    return (
                        <Card
                            key={account.id}
                            className="overflow-hidden hover:shadow-md transition-shadow"
                            style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
                        >
                            <div className="flex flex-row items-center justify-between pr-4">
                                <Link href={`/akun/${account.id}`} className="flex-1">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="p-2 rounded-lg"
                                                style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg">{account.nama}</CardTitle>
                                                    <span
                                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                                        style={{
                                                            backgroundColor: typeBadge.bg,
                                                            color: typeBadge.text
                                                        }}
                                                    >
                                                        {typeBadge.label}
                                                    </span>
                                                </div>
                                                {account.template && (
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Wallet className="w-3 h-3 text-primary" />
                                                        <span className="text-[10px] text-muted-foreground font-medium">
                                                            {account.template.nama} • Next: {calculateNextBillingDate(
                                                                account.template.polaTagihan,
                                                                account.template.tanggalTagihan,
                                                                new Date()
                                                            ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Link>
                                <AkunActions akun={account} templates={templates} />
                            </div>
                            <Link href={`/akun/${account.id}`}>
                                <CardContent>
                                    <div className="mt-2 flex items-baseline justify-between">
                                        <div className={`text-2xl font-bold ${isNegative ? 'text-destructive' : ''}`} data-private="true">
                                            {formatRupiah(account.saldoSekarang)}
                                            {isNegative && <span className="text-sm ml-1 font-normal">(Hutang)</span>}
                                        </div>
                                    </div>

                                    {account.limitKredit && (
                                        <div className="mt-4 space-y-1">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>Penggunaan Limit</span>
                                                <span>{Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all"
                                                    style={{
                                                        width: `${Math.round((Math.abs(account.saldoSekarang) / account.limitKredit) * 100)}%`,
                                                        backgroundColor: accentColor
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-[10px] text-muted-foreground overflow-hidden">
                                                <span className="truncate">Limit: <span data-private="true">{formatRupiah(account.limitKredit)}</span></span>
                                                <span className="truncate text-right">Tersedia: <span data-private="true">{formatRupiah(account.limitKredit + account.saldoSekarang)}</span></span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Link>
                            <CardContent className="pt-0">
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Link href={`/transaksi?akunId=${account.id}&search=${encodeURIComponent(account.nama)}`}>
                   
... (truncated)
```

## File: src\app\akun\[id]\account-settings-client.tsx
```typescript
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
    Receipt, 
    Percent, 
    Info, 
    AlertTriangle, 
    Save, 
    RefreshCcw,
    Clock,
    History
} from "lucide-react"
import { 
    PatternBuilderUI, 
    TierEditor, 
    InterestCalculator, 
    ComparisonTable 
} from "@/components/akun/account-settings-components"
import { updateAkunSettings } from "@/app/actions/akun"
import { resetAccountToTemplate } from "@/app/actions/recurring-admin"
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AccountData {
    id: string;
    nama: string;
    biayaAdminAktif: boolean;
    biayaAdminNominal: number | null;
    biayaAdminPola: string | null;
    biayaAdminTanggal: number | null;
    bungaAktif: boolean;
    bungaTiers: string | null;
    templateSource: string | null;
    templateId: string | null;
    templateOverrides: string | null;
}

interface TemplateData {
    id: string;
    nama: string;
    biayaAdmin: number | null;
    polaTagihan: string;
    tanggalTagihan: number | null;
    bungaTier: string | null;
}

export function AccountSettingsClient({ akun, templates }: { akun: AccountData, templates: TemplateData[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [biayaAdminAktif, setBiayaAdminAktif] = useState(akun.biayaAdminAktif || false)
    const [biayaAdminNominal, setBiayaAdminNominal] = useState<number | null>(akun.biayaAdminNominal)
    const [biayaAdminPola, setBiayaAdminPola] = useState<string>(akun.biayaAdminPola || "MANUAL")
    const [biayaAdminTanggal, setBiayaAdminTanggal] = useState<number | null>(akun.biayaAdminTanggal)
    
    const [bungaAktif, setBungaAktif] = useState(akun.bungaAktif || false)
    const [bungaTiers, setBungaTiers] = useState<string | null>(akun.bungaTiers)
    
    const template = templates.find(t => t.id === (akun.templateSource || akun.templateId))
    const overrides = akun.templateOverrides ? JSON.parse(akun.templateOverrides) : null

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateAkunSettings(akun.id, {
                biayaAdminAktif,
                biayaAdminNominal,
                biayaAdminPola,
                biayaAdminTanggal,
                bungaAktif,
                bungaTiers
            })
            if (result.success) {
                router.refresh()
                alert("Pengaturan berhasil disimpan")
            } else {
                alert(result.error || "Gagal menyimpan pengaturan")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
            alert(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        setLoading(true)
        try {
            const result = await resetAccountToTemplate(akun.id)
            if (result.success) {
                router.refresh()
                alert("Pengaturan telah direset ke default template")
            } else {
                alert(result.error || "Gagal mereset pengaturan")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
            alert(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Biaya Admin Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-primary" />
                                Automasi Biaya Admin
                            </CardTitle>
                            <CardDescription>
                                Atur nominal dan jadwal penarikan biaya admin bulanan.
                            </CardDescription>
                        </div>
                        <Switch 
                            checked={biayaAdminAktif} 
                            onCheckedChange={setBiayaAdminAktif} 
                        />
                    </div>
                </CardHeader>
                {biayaAdminAktif && (
                    <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <Label>Nominal Biaya Admin (Rp)</Label>
                            <Input 
                                type="number" 
                                value={biayaAdminNominal || ""} 
                                onChange={(e) => setBiayaAdminNominal(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Contoh: 10000"
                            />
                        </div>
                        <PatternBuilderUI 
                            pola={biayaAdminPola}
                            tanggal={biayaAdminTanggal}
                            onPolaChange={setBiayaAdminPola}
                            onTanggalChange={setBiayaAdminTanggal}
                        />
                    </CardContent>
                )}
            </Card>

            {/* Bunga Tabungan Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Percent className="w-4 h-4 text-emerald-500" />
                                Bunga Tabungan
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi bunga berjenjang berdasarkan saldo akhir bulan.
                            </CardDescription>
                        </div>
                        <Switch 
                            checked={bungaAktif} 
                            onCheckedChange={setBungaAktif} 
                        />
                    </div>
                </CardHeader>
                {bungaAktif && (
                    <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1">
                        <TierEditor 
                            tiers={bungaTiers ? JSON.parse(bungaTiers) : []} 
                            onChange={(newTiers) => setBungaTiers(JSON.stringify(newTiers))} 
                        />
                        <InterestCalculator tiers={bungaTiers ? JSON.parse(bungaTiers) : []} />
                    </CardContent>
                )}
            </Card>

            {/* Info Template & Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Informasi Template
                    </CardTitle>
                    <CardDescription>
                        Perbandingan antara nilai kustom Anda dengan standar template asli.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ComparisonTable 
                        template={template || null} 
                        current={{
                            biayaAdminNominal,
                            biayaAdminPola,
                            biayaAdminTanggal,
                            bungaTiers
                        }} 
                    />

                    {overrides?.history && (
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold flex items-center gap-2">
                                <History className="w-3 h-3" /> 
                                Histori Perubahan Terakhir
                            </Label>
                            <div className="space-y-2">
                                {overrides.history.map((h: { timestamp: string }, i: number) => (
                                    <div key={i} className="text-[10px] p-2 bg-muted/50 rounded flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(h.timestamp).toLocaleString('id-ID')}
                                        </div>
                                        <div className="font-medium text-primary">
                                            Pengaturan diperbarui
                                        </div>
                                    </div>
                                )).reverse()}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs">
                                    <RefreshCcw className="w-3 h-3 mr-2" />
                                    Reset ke Default Template
                          
... (truncated)
```

## File: src\app\akun\[id]\page.tsx
```typescript

import { notFound } from "next/navigation"
import { getAkunDetail } from "@/app/actions/akun"
import { getActiveAccountTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { Money } from "@/lib/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowLeft,
    Wallet,
    Smartphone,
    CreditCard,
    Banknote,
    History,
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Receipt,
    Percent,
    Calendar,
    Info
} from "lucide-react"
import Link from "next/link"
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart"
import { AkunActions } from "@/components/akun/akun-actions"
import prisma from "@/lib/prisma"

interface PageProps {
    params: Promise<{ id: string }>
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AccountSettingsClient } from "./account-settings-client"
import { PaymentCalculator } from "@/components/credit-card/payment-calculator"
import { AdminFeeManager } from "@/components/akun/admin-fee-manager"
import { EditAccountForm } from "@/components/akun/edit-account-form"

const ICON_MAP: Record<string, any> = {
    'BANK': Wallet,
    'E_WALLET': Smartphone,
    'CREDIT_CARD': CreditCard,
    'CASH': Banknote,
};

export default async function AkunDetailPage({ params }: PageProps) {
    const { id } = await params
    const [result, templatesResult] = await Promise.all([
        getAkunDetail(id),
        getActiveAccountTemplates()
    ])

    if (!result.success || !result.data) {
        return notFound()
    }

    const { akun, recentTransactions, trendData } = result.data
    const templates = templatesResult.data || []

    // Fetch riwayat biaya admin (6 bulan terakhir)
    const adminFeesData = await prisma.transaksi.findMany({
        where: {
            kreditAkunId: id,
            kategori: "Biaya Admin Bank"
        },
        orderBy: { tanggal: 'desc' },
        take: 6
    })
    
    const adminFees = adminFeesData.map(fee => ({
        ...fee,
        nominal: Money.toFloat(Number(fee.nominal))
    }))

    const SelectedIcon = ICON_MAP[akun.tipe] || Wallet
    const accentColor = akun.warna || '#3b82f6'

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/akun">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">{akun.nama}</h2>
                    <p className="text-muted-foreground text-sm">
                        Detail informasi dan pengaturan akun
                    </p>
                </div>
                <div className="flex gap-2">
                    <AkunActions akun={akun} templates={templates} />
                </div>
            </div>

            <Tabs defaultValue="ringkasan" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="ringkasan">Ringkasan</TabsTrigger>
                    <TabsTrigger value="pengaturan">Pengaturan</TabsTrigger>
                </TabsList>

                <TabsContent value="ringkasan" className="space-y-6 pt-4">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Account Summary Card */}
                        <Card className="lg:col-span-1" style={{ borderTop: `4px solid ${accentColor}` }}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Saat Ini</CardTitle>
                                <SelectedIcon className="w-5 h-5" style={{ color: accentColor }} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold" data-private="true">
                                    {formatRupiah(akun.saldoSekarang)}
                                </div>
                                <div className="mt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tipe Akun</span>
                                        <span className="font-medium uppercase">{akun.tipe.replace("_", " ")}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Saldo Awal</span>
                                        <span className="font-medium" data-private="true">{formatRupiah(akun.saldoAwal)}</span>
                                    </div>
                                    {akun.limitKredit && (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Limit Kredit</span>
                                                <span className="font-medium" data-private="true">{formatRupiah(akun.limitKredit)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Tersedia</span>
                                                <span className="font-medium text-emerald-500" data-private="true">
                                                    {formatRupiah(akun.limitKredit + akun.saldoSekarang)}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trend Chart */}
                        <div className="lg:col-span-2">
                            <SaldoTrendChart
                                data={trendData}
                                title={`Trend Saldo: ${akun.nama}`}
                            />
                        </div>
                    </div>

                    {/* Credit Card Specific: Payment Calculator & Admin Fee Manager */}
                    {akun.tipe === "CREDIT_CARD" && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <PaymentCalculator
                                akunId={akun.id}
                                akunNama={akun.nama}
                            />
                            <AdminFeeManager
                                akunId={akun.id}
                                akunNama={akun.nama}
                            />
                        </div>
                    )}

                    {/* Template Information Section (Legacy UI, will be replaced by Settings tab functionality but kept for now) */}
                    {(akun.biayaAdminAktif || akun.bungaAktif) && (
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border-primary/20 bg-primary/5">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <Receipt className="w-4 h-4 text-primary" />
                                        Informasi Automasi Aktif
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <Calendar className="w-3 h-3" /> Pola Tagihan
                                            </p>
                                            <p className="font-bold">
                                                {akun.biayaAdminPola === 'TANGGAL_TETAP' ? `Setiap tanggal ${akun.biayaAdminTanggal}` :
                                                    akun.biayaAdminPola === 'JUMAT_MINGGU_KETIGA' ? 'Jumat minggu ketiga' :
                                                        akun.biayaAdminPola === 'HARI_KERJA_TERAKHIR' ? 'Hari kerja terakhir' : 'Manual'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <Receipt className="w-3 h-3" /> Biaya Admin
                                            </p>
                                            <p className="font-bold" data-private="true">
                                                {akun.biayaAdminNominal ? formatRupiah(akun.biayaAdminNominal) : 'Gratis'}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-muted-foreground flex items-center gap-1">
                                                <Percent className="w-3 h-3" /> Bunga Tabungan
                                            </p>
         
... (truncated)
```

## File: src\app\anggaran\loading.tsx
```typescript
import { CardSkeleton, BudgetItemSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function AnggaranLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-36" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Progress Bar */}
            <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
            </div>

            {/* Section Title */}
            <div className="h-6 w-40 bg-muted rounded animate-pulse" />

            {/* Budget Items */}
            <div className="grid gap-4">
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
                <BudgetItemSkeleton />
            </div>
        </div>
    )
}

```

## File: src\app\anggaran\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Target,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Copy
} from "lucide-react"
import { getBudgetWithRealization, getAvailableCategories, copyBudgetFromPreviousMonth } from "@/app/actions/anggaran"
import { formatRupiah } from "@/lib/format"
import { AddBudgetForm } from "@/components/forms/add-budget-form"
import { BudgetActions } from "@/components/anggaran/budget-actions"
import { BudgetChart } from "@/components/charts/budget-chart"
import Link from "next/link"
import { redirect } from "next/navigation"

const BULAN_LABEL = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
]

interface AnggaranPageProps {
    searchParams: Promise<{ bulan?: string; tahun?: string }>
}

export default async function AnggaranPage({ searchParams }: AnggaranPageProps) {
    const params = await searchParams
    const now = new Date()
    const bulan = params.bulan ? parseInt(params.bulan) : now.getMonth() + 1
    const tahun = params.tahun ? parseInt(params.tahun) : now.getFullYear()

    // Hitung bulan sebelum dan sesudah
    let prevBulan = bulan - 1
    let prevTahun = tahun
    if (prevBulan < 1) {
        prevBulan = 12
        prevTahun = tahun - 1
    }

    let nextBulan = bulan + 1
    let nextTahun = tahun
    if (nextBulan > 12) {
        nextBulan = 1
        nextTahun = tahun + 1
    }

    const [budgetResult, categoriesResult] = await Promise.all([
        getBudgetWithRealization(bulan, tahun),
        getAvailableCategories()
    ])

    const data = budgetResult.data
    const categories = categoriesResult.data || []

    // Hitung statistik
    const totalBudget = data.totalBudget
    const totalRealisasi = data.totalRealisasi
    const sisaTotal = totalBudget - totalRealisasi
    const persentaseTotal = totalBudget > 0 ? Math.round((totalRealisasi / totalBudget) * 100) : 0

    // Kategori yang melebihi budget
    const overBudget = data.budgets.filter((b: any) => b.persentase > 100)
    const nearLimit = data.budgets.filter((b: any) => b.persentase >= 80 && b.persentase <= 100)

    return (
        <div className="space-y-6">
            {/* Header dengan navigasi bulan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Anggaran Bulanan</h2>
                    <p className="text-muted-foreground">
                        Kontrol pengeluaran dengan batas anggaran per kategori.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/anggaran?bulan=${prevBulan}&tahun=${prevTahun}`}>
                        <Button variant="outline" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="px-4 py-2 bg-muted rounded-md font-medium min-w-[150px] text-center">
                        {BULAN_LABEL[bulan - 1]} {tahun}
                    </div>
                    <Link href={`/anggaran?bulan=${nextBulan}&tahun=${nextTahun}`}>
                        <Button variant="outline" size="icon">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                    <AddBudgetForm categories={categories} bulan={bulan} tahun={tahun} />
                </div>
            </div>

            {/* Statistik Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            Total Anggaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">{formatRupiah(totalBudget)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {data.budgets.length} kategori
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-destructive" />
                            Total Realisasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">{formatRupiah(totalRealisasi)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {persentaseTotal}% dari anggaran
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {sisaTotal >= 0 ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            Sisa Anggaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${sisaTotal >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                            {formatRupiah(sisaTotal)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {sisaTotal >= 0 ? "Masih dalam batas" : "Melebihi anggaran!"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Peringatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{overBudget.length + nearLimit.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {overBudget.length} melebihi, {nearLimit.length} hampir limit
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar Total */}
            {totalBudget > 0 && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span>Progress Keseluruhan</span>
                            <span className={persentaseTotal > 100 ? 'text-red-500' : ''}>
                                {persentaseTotal}%
                            </span>
                        </div>
                        <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${persentaseTotal > 100 ? 'bg-red-500' : persentaseTotal > 80 ? 'bg-amber-500' : 'bg-primary'
                                    }`}
                                style={{ width: `${Math.min(persentaseTotal, 100)}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Budget Chart Visualization */}
            {data.budgets.length > 0 && (
                <BudgetChart
                    budgets={data.budgets}
                    unbudgeted={data.unbudgeted}
                    totalBudget={totalBudget}
                    totalRealisasi={totalRealisasi}
                />
            )}

            {/* Daftar Budget */}
            {data.budgets.length > 0 ? (
                <div className="grid gap-4">
                    <h3 className="text-lg font-semibold">Detail per Kategori</h3>
                    {data.budgets.map((budget: any) => {
                        const isOver = budget.persentase > 100
                        const isNear = budget.persentase >= 80 && budget.persentase <= 100

                        return (
                            <Card key={budget.id} className={`border-l-4 ${isOver ? 'border-l-red-500' : isNear ? 'border-l-amber-500' : 'border-l-primary'
                                }`}>
                                <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="font-semibold flex items-center gap-2">
                                                {budget.kategori}
                                                {isOver && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                {isNear && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                                            </h
... (truncated)
```

## File: src\app\cicilan\loading.tsx
```typescript
import { CardSkeleton, CicilanCardSkeleton } from "@/components/ui/skeleton"

export default function CicilanLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-44 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-36 bg-muted rounded animate-pulse" />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-2 mt-8">
                <div className="h-6 w-6 bg-muted rounded animate-pulse" />
                <div className="h-6 w-48 bg-muted rounded animate-pulse" />
            </div>

            {/* Cicilan Cards */}
            <div className="grid gap-6">
                <CicilanCardSkeleton />
                <CicilanCardSkeleton />
                <CicilanCardSkeleton />
            </div>
        </div>
    )
}

```

## File: src\app\cicilan\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    CreditCard,
    Calendar,
    CheckCircle2,
    TrendingDown,
    AlertTriangle,
    Clock
} from "lucide-react"
import { getCicilan, getCicilanStats } from "@/app/actions/cicilan"
import { getAkun } from "@/app/actions/akun"
import { formatRupiah } from "@/lib/format"
import { AddCicilanForm } from "@/components/forms/add-cicilan-form"
import { CicilanActions } from "@/components/cicilan/cicilan-actions"

export default async function CicilanPage() {
    const [cicilanResult, statsResult, accounts] = await Promise.all([
        getCicilan(),
        getCicilanStats(),
        getAkun()
    ])

    const cicilan = cicilanResult.data || []
    const stats = statsResult.data

    // Buat map akun untuk menampilkan nama
    const akunMap = new Map(accounts.map((a: any) => [a.id, a.nama]))

    // Pisahkan cicilan aktif dan lunas
    const cicilanAktif = cicilan.filter((c: any) => c.status === "AKTIF")
    const cicilanLunas = cicilan.filter((c: any) => c.status === "LUNAS")

    // Ambil bulan & tahun sekarang untuk jatuh tempo
    const now = new Date()
    const tanggalSekarang = now.getDate()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mesin Cicilan</h2>
                    <p className="text-muted-foreground">
                        Otomatisasi pencatatan tagihan kartu kredit dan tenor.
                    </p>
                </div>
                <AddCicilanForm accounts={accounts} />
            </div>

            {/* Statistik Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <TrendingDown className="h-4 w-4 text-destructive" />
                            Total Hutang Cicilan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive" data-private="true">
                            {formatRupiah(stats.totalHutang)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Sisa pokok dari {stats.jumlahCicilanAktif} rencana aktif
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            Tagihan Bulan Ini
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">{formatRupiah(stats.tagihanBulanIni)}</div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Dari {stats.jumlahCicilanAktif} cicilan aktif
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {stats.rasioHutang > 50 ? (
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                            Rasio Hutang
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.rasioHutang > 50 ? 'text-amber-500' : 'text-emerald-500'
                            }`}>
                            {stats.rasioHutang}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Dari total limit kartu kredit</p>
                    </CardContent>
                </Card>
            </div>

            {/* Cicilan Aktif */}
            {cicilanAktif.length > 0 && (
                <>
                    <h3 className="text-xl font-semibold mt-8 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Rencana Berjalan ({cicilanAktif.length})
                    </h3>
                    <div className="grid gap-6">
                        {cicilanAktif.map((item: any) => {
                            const progress = ((item.cicilanKe - 1) / item.tenor) * 100
                            const sisaTenor = item.tenor - item.cicilanKe + 1
                            const sisaNominal = sisaTenor * item.nominalPerBulan
                            const sudahBayar = (item.cicilanKe - 1) * item.nominalPerBulan
                            const isJatuhTempoDekat = item.tanggalJatuhTempo - tanggalSekarang <= 3 && item.tanggalJatuhTempo >= tanggalSekarang

                            return (
                                <Card key={item.id} className={`relative overflow-hidden border-l-4 ${isJatuhTempoDekat ? 'border-l-amber-500' : 'border-l-primary'
                                    }`}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <CreditCard className="w-5 h-5 text-primary" />
                                                {item.namaProduk}
                                            </CardTitle>
                                            <CardDescription>
                                                Sumber: {akunMap.get(item.akunKreditId) || "Kartu Kredit"}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isJatuhTempoDekat && (
                                                <span className="px-2 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                                    Jatuh Tempo Dekat
                                                </span>
                                            )}
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/20 text-primary">
                                                AKTIF
                                            </span>
                                            <CicilanActions cicilan={item} />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid md:grid-cols-4 gap-6">
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Pinjaman</p>
                                                <p className="font-bold text-lg" data-private="true">{formatRupiah(item.totalPokok)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cicilan Bulanan</p>
                                                <p className="font-bold text-lg" data-private="true">{formatRupiah(item.nominalPerBulan)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tenor</p>
                                                <p className="font-bold text-lg">{item.cicilanKe} / {item.tenor} Bulan</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Jatuh Tempo</p>
                                                <p className={`font-bold text-lg ${isJatuhTempoDekat ? 'text-amber-500' : 'text-primary'}`}>
                                                    Tanggal {item.tanggalJatuhTempo}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-2">
                                            <div className="flex justify-between text-xs font-medium">
                                                <span>Progres Pembayaran ({Math.round(progress)}%)</span>
                                                <span>Sisa: <span data-private="true">{formatRupiah(sisaNominal)}</span></span>
                                            </div>
                                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
                                                <div
                       
... (truncated)
```

## File: src\app\debug-automation\page.tsx
```typescript
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { quickDebugAdminFee } from "@/app/actions/debug-quick"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function DebugAutomationPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        setLoading(true)
        try {
            const result = await quickDebugAdminFee()
            setData(result)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/pengaturan">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold">Debug Automasi Keuangan</h1>
                    <p className="text-muted-foreground">Analisis kenapa proses biaya admin mengembalikan 0</p>
                </div>
                <Button onClick={fetchData} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {loading ? (
                <p>Memuat...</p>
            ) : data ? (
                <div className="space-y-6">
                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-muted rounded">
                                <div className="text-3xl font-bold">{data.totalBankEWallet}</div>
                                <div className="text-xs text-muted-foreground">Total Bank/E-Wallet</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded">
                                <div className="text-3xl font-bold">{data.withAdminFeeActive}</div>
                                <div className="text-xs text-muted-foreground">dengan biayaAdminAktif=true</div>
                            </div>
                            <div className="text-center p-4 bg-emerald-500/20 rounded">
                                <div className="text-3xl font-bold text-emerald-600">{data.willBeProcessed}</div>
                                <div className="text-xs text-muted-foreground">Akan Diproses</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded">
                                <div className="text-sm font-mono">{data.currentMonth}</div>
                                <div className="text-xs text-muted-foreground">Bulan Saat Ini</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Account Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail Akun dengan biayaAdminAktif=true</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.accounts.length === 0 ? (
                                <p className="text-amber-600 font-medium">
                                    ⚠️ Tidak ada akun Bank/E-Wallet dengan biayaAdminAktif=true!<br />
                                    Pastikan Anda mengaktifkan &quot;Biaya Admin Bulanan&quot; saat membuat/edit akun.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {data.accounts.map((acc: any, i: number) => (
                                        <div key={i} className={`p-4 rounded border ${acc.willProcess ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-amber-500 bg-amber-50 dark:bg-amber-950/20'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold">{acc.nama}</div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Nominal: Rp {acc.nominal?.toLocaleString('id-ID') || 'Tidak diset'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Pola: {acc.pola || 'Tidak diset'} | Tanggal: {acc.tanggalPola || '-'}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Billing Date Kalkulasi: {acc.calculatedBillingDate}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        Last Charged: {acc.lastCharged || 'Belum pernah'}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {acc.willProcess ? (
                                                        <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded">AKAN DIPROSES</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-amber-500 text-white text-xs rounded">SKIP</span>
                                                    )}
                                                </div>
                                            </div>
                                            {acc.issues.length > 0 && (
                                                <div className="mt-2 text-sm text-amber-700 dark:text-amber-400">
                                                    <strong>Alasan Skip:</strong>
                                                    <ul className="list-disc list-inside">
                                                        {acc.issues.map((issue: string, j: number) => (
                                                            <li key={j}>{issue}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Logs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>5 Log Automasi Terakhir</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.recentLogs.length === 0 ? (
                                <p className="italic text-muted-foreground">Belum ada log automasi.</p>
                            ) : (
                                <div className="space-y-2">
                                    {data.recentLogs.map((log: any) => (
                                        <div key={log.id} className="p-2 bg-muted rounded text-sm">
                                            <div className="flex justify-between">
                                                <span className={log.level === 'ERROR' ? 'text-red-500' : 'text-emerald-500'}>
                                                    [{log.level}]
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    {new Date(log.createdAt).toLocaleString('id-ID')}
                                                </span>
                                            </div>
                                            <p>{log.pesan}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <p>Error loading data</p>
            )}
        </div>
    )
}

```

## File: src\app\devdb\page.tsx
```typescript
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Database,
    Table2,
    RefreshCw,
    FileText,
    Wallet,
    ArrowLeftRight,
    Settings,
} from "lucide-react"
import {
    getAkunData,
    getTransaksiData,
    getRecurringData,
    getLogData,
    getDatabaseStats,
    getAppSettingsData
} from "@/app/actions/debug"
import Link from "next/link"

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{
        tab?: string
        page?: string
    }>
}

export default async function DebugDatabasePage({ searchParams }: PageProps) {
    const params = await searchParams
    const tab = params.tab || "stats"
    const page = Number(params.page) || 1

    const stats = await getDatabaseStats()

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b pb-4">
                <Database className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-2xl font-bold">Database Inspector</h1>
                    <p className="text-sm text-muted-foreground">
                        🔒 Halaman rahasia - Direct access only
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Link href="/devdb?tab=akun">
                    <Card className={`cursor-pointer hover:border-primary transition ${tab === 'akun' ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Wallet className="w-4 h-4" /> Akun
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.akun}</p>
                            <p className="text-xs text-muted-foreground">
                                {stats.akunUser} user
                            </p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/devdb?tab=transaksi">
                    <Card className={`cursor-pointer hover:border-primary transition ${tab === 'transaksi' ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <ArrowLeftRight className="w-4 h-4" /> Transaksi
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.transaksi}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/devdb?tab=recurring">
                    <Card className={`cursor-pointer hover:border-primary transition ${tab === 'recurring' ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Recurring
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.recurring}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/devdb?tab=log">
                    <Card className={`cursor-pointer hover:border-primary transition ${tab === 'log' ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.log}</p>
                        </CardContent>
                    </Card>
                </Link>
                <Link href="/devdb?tab=setting">
                    <Card className={`cursor-pointer hover:border-primary transition ${tab === 'setting' ? 'border-primary' : ''}`}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.setting}</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Data Table */}
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                <DataTable tab={tab} page={page} />
            </Suspense>
        </div>
    )
}

async function DataTable({ tab, page }: { tab: string; page: number }) {
    if (tab === "stats") {
        return (
            <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                    <Table2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Klik salah satu tabel di atas untuk melihat isinya</p>
                </CardContent>
            </Card>
        )
    }

    let result: any
    let columns: string[] = []

    switch (tab) {
        case "akun":
            result = await getAkunData(page)
            columns = ["id", "nama", "tipe", "saldoSekarang", "saldoAwal", "warna", "createdAt"]
            break
        case "transaksi":
            result = await getTransaksiData(page)
            columns = ["id", "deskripsi", "nominal", "kategori", "tanggal", "debitAkun", "kreditAkun"]
            break
        case "recurring":
            result = await getRecurringData(page)
            columns = ["id", "nama", "nominal", "kategori", "frekuensi", "aktif", "terakhirDieksekusi"]
            break
        case "log":
            result = await getLogData(page)
            columns = ["id", "level", "modul", "pesan", "createdAt"]
            break
        case "setting":
            result = await getAppSettingsData(page)
            columns = ["id", "kunci", "nilai", "updatedAt"]
            break
        default:
            return null
    }

    const { data, pagination } = result

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Table2 className="w-5 h-5" />
                    Tabel: {tab.toUpperCase()}
                </CardTitle>
                <div className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
                </div>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">Tidak ada data</p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        {columns.map((col) => (
                                            <th key={col} className="text-left p-2 font-medium bg-secondary">
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((row: any, i: number) => (
                                        <tr key={row.id || i} className="border-b hover:bg-secondary/50">
                                            {columns.map((col) => (
                                                <td key={col} className="p-2 max-w-xs truncate">
                                                    {formatCell(row, col)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-center gap-2 mt-4">
                            {pagination.page > 1 && (
                                <Link href={`/devdb?tab=${tab}&page=${pagination.page - 1}`}>
                                    <Button variant="outline" size="sm">← Prev</Button>
                                </Link>
                            )}
                            {pagination.page < pagination.totalPages && (
                                <Link href={`/devdb?tab=${tab}&page=${pagination.page + 1}`}>
                                    <Button variant="outline" size="sm">Next →</Button>
                                </Link>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}

function formatCell(row: any, col:
... (truncated)
```

## File: src\app\error.tsx
```typescript
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        // Log error untuk debugging
        console.error("[DOMPETKU ERROR]", error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-lg w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
                        <p className="text-muted-foreground text-sm">
                            Halaman ini mengalami error. Silakan coba lagi atau kembali ke halaman sebelumnya.
                        </p>
                        {process.env.NODE_ENV === "development" && (
                            <div className="w-full text-left">
                                <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-auto max-h-32">
                                    {error.message}
                                </p>
                            </div>
                        )}
                        {error.digest && (
                            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                ID: {error.digest}
                            </p>
                        )}
                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                            <Button onClick={reset} variant="outline" size="sm" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </Button>
                            <Button onClick={() => router.back()} variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Kembali
                            </Button>
                            <Link href="/">
                                <Button size="sm" className="gap-2">
                                    <Home className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

```

## File: src\app\global-error.tsx
```typescript
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error untuk debugging
        console.error("[DOMPETKU ERROR]", error)
    }, [error])

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <Card className="max-w-md w-full">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                                    <AlertTriangle className="w-12 h-12 text-red-500" />
                                </div>
                                <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
                                <p className="text-muted-foreground">
                                    Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu tentang masalah ini.
                                </p>
                                {error.digest && (
                                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                        Error ID: {error.digest}
                                    </p>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={reset} variant="outline" className="gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Coba Lagi
                                    </Button>
                                    <Link href="/">
                                        <Button className="gap-2">
                                            <Home className="w-4 h-4" />
                                            Kembali ke Beranda
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    )
}

```

## File: src\app\kalender\calendar-client.tsx
```typescript
"use client"

import { useRouter } from "next/navigation"
import { FinancialCalendar } from "@/components/calendar/financial-calendar"

interface CalendarEvent {
    id: string
    date: Date | string
    type: 'cicilan' | 'recurring' | 'transaksi'
    title: string
    nominal: number
    description?: string
    color: string
}

interface CalendarClientProps {
    events: CalendarEvent[]
    bulan: number
    tahun: number
}

export function CalendarClient({ events, bulan, tahun }: CalendarClientProps) {
    const router = useRouter()

    const handleMonthChange = (newBulan: number, newTahun: number) => {
        router.push(`/kalender?bulan=${newBulan}&tahun=${newTahun}`)
    }

    return (
        <FinancialCalendar
            events={events}
            bulan={bulan}
            tahun={tahun}
            onMonthChange={handleMonthChange}
        />
    )
}

```

## File: src\app\kalender\page.tsx
```typescript
import { Suspense } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Calendar as CalendarIcon,
    CreditCard,
    RefreshCw,
    Receipt,
    ChevronLeft,
    ChevronRight,
    ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { formatRupiah } from "@/lib/format"
import { getCalendarEvents, getCalendarSummary } from "@/app/actions/calendar"
import { CalendarClient } from "./calendar-client"

interface PageProps {
    searchParams: Promise<{ bulan?: string; tahun?: string }>
}

export default async function KalenderPage({ searchParams }: PageProps) {
    const params = await searchParams
    const now = new Date()
    const bulan = params.bulan ? parseInt(params.bulan) : now.getMonth() + 1
    const tahun = params.tahun ? parseInt(params.tahun) : now.getFullYear()

    const [eventsResult, summaryResult] = await Promise.all([
        getCalendarEvents(bulan, tahun),
        getCalendarSummary(bulan, tahun)
    ])

    const events = eventsResult.data || []
    const summary = summaryResult.data

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <CalendarIcon className="w-6 h-6 text-primary" />
                            Kalender Keuangan
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Lihat jadwal pembayaran cicilan, recurring, dan transaksi
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Cicilan Aktif</p>
                                <p className="text-xl font-bold">{summary.cicilanAktif}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                                <CreditCard className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Cicilan/Bulan</p>
                                <p className="text-xl font-bold text-amber-600" data-private="true">
                                    {formatRupiah(summary.totalCicilan)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-900">
                                <RefreshCw className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Recurring Aktif</p>
                                <p className="text-xl font-bold">{summary.recurringCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900">
                                <Receipt className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Transaksi Bulan Ini</p>
                                <p className="text-xl font-bold">{summary.transaksiCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calendar Component */}
            <CalendarClient events={events} bulan={bulan} tahun={tahun} />
        </div>
    )
}

```

## File: src\app\laporan\loading.tsx
```typescript
import { CardSkeleton, ChartSkeleton, RowSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function LaporanLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10" />
                    <Skeleton className="h-10 w-40" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Top Transactions */}
            <div className="rounded-lg border bg-card p-6 space-y-4">
                <Skeleton className="h-5 w-52" />
                <div className="space-y-3">
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            </div>
        </div>
    )
}

```

## File: src\app\laporan\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    TrendingUp,
    TrendingDown,
    Calendar,
    BarChart3,
    ArrowLeft,
    ArrowRight,
    Wallet,
    Target,
    ArrowUpRight
} from "lucide-react"
import { getRingkasanBulanan, getAvailableMonths } from "@/app/actions/laporan"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"

interface PageProps {
    searchParams: Promise<{ bulan?: string; tahun?: string }>
}

export default async function LaporanPage({ searchParams }: PageProps) {
    const params = await searchParams
    const now = new Date()
    const bulan = Number(params.bulan) || now.getMonth() + 1
    const tahun = Number(params.tahun) || now.getFullYear()

    const ringkasan = await getRingkasanBulanan(bulan, tahun)
    const availableMonths = await getAvailableMonths()

    // Calculate prev/next month
    const prevMonth = bulan === 1 ? 12 : bulan - 1
    const prevYear = bulan === 1 ? tahun - 1 : tahun
    const nextMonth = bulan === 12 ? 1 : bulan + 1
    const nextYear = bulan === 12 ? tahun + 1 : tahun

    const isCurrentMonth = bulan === now.getMonth() + 1 && tahun === now.getFullYear()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Laporan Bulanan</h2>
                    <p className="text-muted-foreground">
                        Ringkasan keuangan Anda untuk {ringkasan.bulanNama} {ringkasan.tahun}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/laporan?bulan=${prevMonth}&tahun=${prevYear}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div className="px-4 py-2 bg-secondary rounded-lg font-medium">
                        {ringkasan.bulanNama} {ringkasan.tahun}
                    </div>
                    {!isCurrentMonth && (
                        <Link href={`/laporan?bulan=${nextMonth}&tahun=${nextYear}`}>
                            <Button variant="outline" size="icon">
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-emerald-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pemasukan</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500" data-private="true">
                            +{formatRupiah(ringkasan.totalPemasukan)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500" data-private="true">
                            -{formatRupiah(ringkasan.totalPengeluaran)}
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 ${ringkasan.selisih >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Selisih</CardTitle>
                        <Wallet className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${ringkasan.selisih >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                            {ringkasan.selisih >= 0 ? '+' : ''}{formatRupiah(ringkasan.selisih)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rata-rata Harian</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold" data-private="true">
                            {formatRupiah(ringkasan.rataRataHarian)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {ringkasan.jumlahTransaksi} transaksi
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Pengeluaran per Kategori */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-500">
                            <TrendingDown className="w-5 h-5" />
                            Pengeluaran per Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ringkasan.pengeluaranPerKategori.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Tidak ada pengeluaran
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {ringkasan.pengeluaranPerKategori.map((item) => (
                                    <div key={item.kategori}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.kategori}</span>
                                            <span className="text-sm font-bold" data-private="true">{formatRupiah(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-red-500 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.persentase.toFixed(1)}% dari total
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pemasukan per Kategori */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-500">
                            <TrendingUp className="w-5 h-5" />
                            Pemasukan per Kategori
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {ringkasan.pemasukanPerKategori.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">
                                Tidak ada pemasukan
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {ringkasan.pemasukanPerKategori.map((item) => (
                                    <div key={item.kategori}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm font-medium">{item.kategori}</span>
                                            <span className="text-sm font-bold" data-private="true">{formatRupiah(item.total)}</span>
                                        </div>
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div
                                                className="bg-emerald-500 h-2 rounded-full transition-all"
                                                style={{ width: `${Math.min(item.persentase, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {item.persentase.toFixed(1)}% dari total
                                        </p>
                     
... (truncated)
```

## File: src\app\layout.tsx
```typescript
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PrivacyToggle } from "@/components/layout/privacy-toggle";
import { DebugMenu } from "@/components/layout/debug-menu";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dompetku - Personal Finance",
  description: "Aplikasi pembukuan mandiri dengan sistem Double-Entry",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background overflow-x-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen w-full max-w-[100vw] overflow-x-hidden">
            {/* Sidebar - Fixed on desktop */}
            <Sidebar />

            {/* Main Content - Scrollable */}
            <main className="flex-1 pb-20 md:pb-0 relative overflow-x-hidden w-full max-w-full md:h-screen md:overflow-y-auto">
              <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-14 items-center justify-between px-4 w-full">
                  <div className="md:hidden font-bold text-primary text-xl">Dompetku</div>
                  <div className="flex-1"></div>
                  <div className="flex items-center gap-1 shrink-0">
                    <DebugMenu />
                    <PrivacyToggle />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <div className="p-4 md:p-6 w-full max-w-full overflow-x-hidden">
                {children}
              </div>
            </main>
          </div>
          <BottomNav />
          <Toaster position="top-center" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}


```

## File: src\app\loading.tsx
```typescript
import {
    CardSkeleton,
    ChartSkeleton,
    RowSkeleton
} from "@/components/ui/skeleton"

export default function DashboardLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-48 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-72 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-2">
                <ChartSkeleton />
                <ChartSkeleton />
            </div>

            {/* Bottom Grid */}
            <div className="grid gap-4 md:grid-cols-7">
                <div className="md:col-span-4 rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                    </div>
                </div>
                <div className="md:col-span-3 rounded-lg border bg-card p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                        <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="space-y-3">
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                        <RowSkeleton />
                    </div>
                </div>
            </div>
        </div>
    )
}

```

## File: src\app\not-found.tsx
```typescript
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted">
                            <FileQuestion className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">Halaman Tidak Ditemukan</h2>
                        <p className="text-muted-foreground text-sm">
                            Halaman yang Anda cari tidak ada atau telah dipindahkan.
                        </p>
                        <div className="text-8xl font-bold text-muted-foreground/30">
                            404
                        </div>
                        <div className="flex gap-2 pt-4">
                            <Link href="/">
                                <Button className="gap-2">
                                    <Home className="w-4 h-4" />
                                    Kembali ke Beranda
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

```

## File: src\app\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  PieChart as PieChartIcon,
  BarChart3,
  Plus,
  ArrowRight,
  Target,
  RefreshCw,
  Settings,
} from "lucide-react"
import { getAkun } from "@/app/actions/akun"
import { getTransaksi } from "@/app/actions/transaksi"
import { getDashboardAnalytics, getSaldoTrend, getMonthlyComparison, getAccountComposition, getEnhancedStats } from "@/app/actions/analytics"
import { getCicilanStats } from "@/app/actions/cicilan"
import { getUpcomingAdminFees } from "@/app/actions/recurring-admin"
import { getNetWorthChange, getNetWorthHistory, saveNetWorthSnapshot } from "@/app/actions/networth"
import { seedInitialData, seedInstallmentTemplates } from "@/app/actions/seed"
import { pruneOldLogs } from "@/app/actions/debug"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { ExpensePieChart } from "@/components/charts/expense-pie-chart"
import { MonthlyTrendChart } from "@/components/charts/monthly-trend-chart"
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart"
import { MonthlyComparisonChart } from "@/components/charts/monthly-comparison-chart"
import { AssetCompositionChart } from "@/components/charts/asset-composition-chart"
import { DrilldownPieChart } from "@/components/charts/drilldown-pie-chart"
import { NetWorthChart } from "@/components/charts/net-worth-chart"
import { AdminFeeReminder } from "@/components/charts/admin-fee-reminder"

export default async function Dashboard() {
  // Auto-prune logs > 30 hari
  await pruneOldLogs(30)

  // Auto-seed installment templates if not exists
  await seedInstallmentTemplates()

  let accounts = await getAkun()
  if (accounts.length === 0) {
    await seedInitialData()
    accounts = await getAkun()
  }

  // Ambil data analytics (parallel fetch untuk performa)
  const [
    analytics,
    transactionsResult,
    cicilanStats,
    upcomingFeesResult,
    saldoTrendResult,
    monthlyComparisonResult,
    assetCompositionResult,
    enhancedStatsResult,
    netWorthResult,
    netWorthHistoryResult
  ] = await Promise.all([
    getDashboardAnalytics(),
    getTransaksi(),
    getCicilanStats(),
    getUpcomingAdminFees(),
    getSaldoTrend(30),
    getMonthlyComparison(),
    getAccountComposition(),
    getEnhancedStats(),
    getNetWorthChange(),
    getNetWorthHistory(30)
  ])
  const transactions = transactionsResult.data
  const upcomingFees = upcomingFeesResult.data || []
  const saldoTrend = saldoTrendResult.data || []
  const monthlyComparison = monthlyComparisonResult.data || []
  const assetComposition = assetCompositionResult.data || []
  const assetTotal = assetCompositionResult.total || 0
  const enhancedStats = enhancedStatsResult.data
  const netWorth = netWorthResult.data
  const netWorthHistory = netWorthHistoryResult.data || []

  // Save snapshot jika belum ada hari ini (simple implementation)
  if (netWorthHistory.length === 0) {
    await saveNetWorthSnapshot()
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan keuangan Anda bulan ini.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/transaksi">
            <Button variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Transaksi
            </Button>
          </Link>
          <Link href="/laporan">
            <Button className="gap-2">
              <BarChart3 className="w-4 h-4" /> Laporan
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/akun">
          <Card className="border-l-4 border-l-primary hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Saldo</CardTitle>
              <Wallet className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-private="true">{formatRupiah(analytics.totalSaldo)}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                {accounts.length} akun terdaftar
                <ArrowRight className="w-3 h-3" />
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/transaksi?tipe=MASUK">
          <Card className="border-l-4 border-l-emerald-500 hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemasukan Bulan Ini</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500" data-private="true">
                +{formatRupiah(analytics.pemasukanBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total pemasukan
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/transaksi?tipe=KELUAR">
          <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pengeluaran Bulan Ini</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500" data-private="true">
                -{formatRupiah(analytics.pengeluaranBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total pengeluaran
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/anggaran">
          <Card className={`border-l-4 hover:shadow-md transition-all hover:scale-[1.02] ${analytics.selisihBulanIni >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Selisih Bulan Ini</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${analytics.selisihBulanIni >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                {analytics.selisihBulanIni >= 0 ? '+' : ''}{formatRupiah(analytics.selisihBulanIni)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cek anggaran →
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* NEW: Admin Fee Reminder */}
      <AdminFeeReminder fees={upcomingFees} />

      {/* Alert jika ada cicilan */}
      {cicilanStats.data.jumlahCicilanAktif > 0 && (
        <Link href="/cicilan" className="block mb-4">
          <Card className="border-l-4 border-l-amber-500 hover:shadow-md transition-all bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-900">
                  <CreditCard className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium">Cicilan Aktif: {cicilanStats.data.jumlahCicilanAktif}</p>
                  <p className="text-sm text-muted-foreground">
                    Tagihan bulan ini: <span data-private="true">{formatRupiah(cicilanStats.data.tagihanBulanIni)}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Hutang</p>
                <p className="font-bold text-amber-600" data-private="true">{formatRupiah(cicilanStats.data.totalHutang)}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <CardTitle>Pengeluaran per Kategori</CardTitle>
            </div>
            <Link href="/anggaran">
              <Button variant="ghost" size="sm" className="text-xs">
                Atur Anggaran →
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <ExpensePieChart data={analytics.pengeluaranPerKategori} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>Trend 6 Bulan Terakhir</CardTitle>
            </div>
            <Link href="/laporan">
              <Button variant="ghost" size="sm" className="text-xs">
                Detail Laporan →
              </Button>
     
... (truncated)
```

## File: src\app\pengaturan\page.tsx
```typescript
"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Settings,
    Database,
    Shield,
    Palette,
    Info,
    ExternalLink,
    ChevronRight,
    Download,
    Upload,
    Trash2,
    RefreshCw,
    CreditCard,
    Target,
    Wallet,
    AlertTriangle,
    CheckCircle2,
    Loader2
} from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { exportBackup, importBackup, resetAllData, getBackupInfo } from "@/app/actions/backup"
import { getLogData } from "@/app/actions/debug"
import { CurrencySettings } from "@/components/settings/currency-settings"
import { FinancialAutomationCard } from "@/components/settings/financial-automation-card"
import { useEffect, useCallback } from "react"

interface LogEntry {
    id: string
    level: string
    pesan: string
    createdAt: Date | string
}

export default function PengaturanPage() {
    const router = useRouter()
    const fileInputRef = useRef<HTMLInputElement>(null)

    const [loading, setLoading] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)
    const [resultDialogOpen, setResultDialogOpen] = useState(false)
    const [resultMessage, setResultMessage] = useState("")
    const [resultSuccess, setResultSuccess] = useState(false)
    const [lastLogs, setLastLogs] = useState<LogEntry[]>([])

    const fetchLogs = useCallback(async () => {
        try {
            // Fetch logs for AUTOMASI context (used by recurring-admin.ts)
            const res = await getLogData(1, "AUTOMASI")

            const allLogs = (res.data || [])
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 8)

            setLastLogs(allLogs)
        } catch (err) {
            console.error("Failed to fetch logs:", err)
        }
    }, [])

    // Load logs for automation card
    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    // Handler untuk ekspor backup
    const handleExport = async () => {
        setLoading(true)
        try {
            const result = await exportBackup()

            if (result.success && result.data) {
                // Buat dan download file JSON
                const jsonString = JSON.stringify(result.data, null, 2)
                const blob = new Blob([jsonString], { type: "application/json" })
                const url = URL.createObjectURL(blob)

                const date = new Date().toISOString().split('T')[0]
                const filename = `dompetku-backup-${date}.json`

                const a = document.createElement("a")
                a.href = url
                a.download = filename
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)

                setResultSuccess(true)
                setResultMessage(`Backup berhasil! File ${filename} telah diunduh.\n\nStatistik:\n• ${result.data.stats.totalAkun} akun\n• ${result.data.stats.totalTransaksi} transaksi\n• ${result.data.stats.totalCicilan} cicilan\n• ${result.data.stats.totalBudget} anggaran`)
                setResultDialogOpen(true)
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal melakukan backup")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
        }
    }

    // Handler untuk import restore
    const handleImport = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        try {
            const content = await file.text()
            const result = await importBackup(content)

            if (result.success) {
                const stats = result.stats
                setResultSuccess(true)
                setResultMessage(
                    `Restore berhasil!\n\nDiimpor:\n• ${stats?.imported.akun} akun\n• ${stats?.imported.transaksi} transaksi\n• ${stats?.imported.cicilan} cicilan\n• ${stats?.imported.recurring} recurring\n• ${stats?.imported.budget} anggaran\n\nDilewati (sudah ada):\n• ${stats?.skipped.akun} akun\n• ${stats?.skipped.transaksi} transaksi`
                )
                setResultDialogOpen(true)
                router.refresh()
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal melakukan restore")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    // Handler untuk reset data
    const handleReset = async () => {
        setLoading(true)
        try {
            const result = await resetAllData()

            if (result.success) {
                setResetDialogOpen(false)
                setResultSuccess(true)
                setResultMessage("Reset berhasil! Semua data telah dihapus.\n\nAnda akan dialihkan ke halaman utama dalam 3 detik...")
                setResultDialogOpen(true)

                // Redirect ke halaman utama setelah 3 detik
                setTimeout(() => {
                    router.push("/")
                    router.refresh()
                }, 3000)
            } else {
                setResultSuccess(false)
                setResultMessage(result.error || "Gagal melakukan reset")
                setResultDialogOpen(true)
            }
        } catch (err) {
            setResultSuccess(false)
            setResultMessage("Terjadi kesalahan: " + (err as Error).message)
            setResultDialogOpen(true)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-full overflow-hidden">
            {/* Hidden file input */}
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
            />

            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Pengaturan</h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                    Konfigurasi aplikasi dan preferensi pembukuan Anda.
                </p>
            </div>

            <div className="grid gap-6 max-w-full">
                {/* Tampilan & Tema */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5" />
                            Tampilan & Tema
                        </CardTitle>
                        <CardDescription>Sesuaikan bagaimana Dompetku terlihat di perangkat Anda.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="font-medium">Mode Gelap / Terang</div>
                                <div className="text-xs text-muted-foreground">Ubah skema warna aplikasi.</div>
                            </div>
                            <div className="shrink-0">
                                <ThemeToggle />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pintasan Cepat */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            Pintasan Cepat
                        </CardTitle>
                        <CardDescription>Akses cepat ke fitur-fitur utama.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2 md:grid-cols-2">
                        <Link href="/akun">
                            <Button variant="outline" className="w-full justify-start h-auto py-3 hover:bg-primary/5">
                                <Wallet className="w-4 h-4 mr-3" />
                                <div className="text-left">
                                    <div className="font-medium">Kelola Akun</div>
                                    <div className="text-xs text-muted-foreground">Bank, E-Wallet, Kartu 
... (truncated)
```

## File: src\app\recurring\loading.tsx
```typescript
import { Skeleton } from "@/components/ui/skeleton"

export default function RecurringLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Recurring Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="rounded-lg border bg-card p-6 space-y-4 border-l-4 border-l-primary">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-5" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-8 w-8" />
                        </div>
                        <Skeleton className="h-8 w-28" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-14 rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

```

## File: src\app\recurring\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    RefreshCw,
    Calendar,
    Wallet,
    TrendingUp,
    TrendingDown,
    ToggleLeft,
    ToggleRight,
    Trash2,
    Plus
} from "lucide-react"
import { getRecurringTransactions } from "@/app/actions/recurring"
import { getAkun } from "@/app/actions/akun"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { AddRecurringForm } from "@/components/forms/add-recurring-form"
import { RecurringActions } from "@/components/recurring/recurring-actions"

const FREKUENSI_LABEL: Record<string, string> = {
    HARIAN: "Setiap Hari",
    MINGGUAN: "Setiap Minggu",
    BULANAN: "Setiap Bulan",
    TAHUNAN: "Setiap Tahun",
}

const HARI_LABEL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]

export default async function RecurringPage() {
    const result = await getRecurringTransactions()
    const recurring = result.data || []
    const accounts = await getAkun()

    // Buat map akun
    const akunMap = new Map(accounts.map((a: any) => [a.id, a.nama]))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaksi Berulang</h2>
                    <p className="text-muted-foreground">
                        Kelola transaksi otomatis yang berjalan secara berkala.
                    </p>
                </div>
                <AddRecurringForm accounts={accounts.filter((a: any) =>
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                )} />
            </div>

            {recurring.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <RefreshCw className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Transaksi Berulang</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Buat transaksi berulang untuk otomatisasi pencatatan seperti gaji, tagihan bulanan, atau langganan.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {recurring.map((item: any) => (
                        <Card
                            key={item.id}
                            className={`relative overflow-hidden border-l-4 ${item.aktif
                                ? item.tipeTransaksi === "MASUK"
                                    ? "border-l-emerald-500"
                                    : "border-l-red-500"
                                : "border-l-gray-400 opacity-60"
                                }`}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {item.tipeTransaksi === "MASUK" ? (
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                        ) : (
                                            <TrendingDown className="w-5 h-5 text-red-500" />
                                        )}
                                        <CardTitle className="text-lg">{item.nama}</CardTitle>
                                    </div>
                                    <RecurringActions recurring={item} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className={`text-2xl font-bold ${item.tipeTransaksi === "MASUK" ? "text-emerald-500" : "text-red-500"
                                    }`} data-private="true">
                                    {item.tipeTransaksi === "MASUK" ? "+" : "-"}{formatRupiah(item.nominal)}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <RefreshCw className="w-4 h-4" />
                                    <span>{FREKUENSI_LABEL[item.frekuensi] || item.frekuensi}</span>
                                    {item.frekuensi === "BULANAN" && item.hariDalamBulan && (
                                        <span className="text-foreground font-medium">
                                            • Tanggal {item.hariDalamBulan}
                                        </span>
                                    )}
                                    {item.frekuensi === "MINGGUAN" && item.hariDalamMinggu !== null && (
                                        <span className="text-foreground font-medium">
                                            • {HARI_LABEL[item.hariDalamMinggu]}
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Wallet className="w-4 h-4" />
                                    <span>{akunMap.get(item.akunId) || "Akun tidak ditemukan"}</span>
                                </div>

                                <div className="flex items-center gap-2 text-sm">
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary">
                                        {item.kategori}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.aktif
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                        }`}>
                                        {item.aktif ? "Aktif" : "Nonaktif"}
                                    </span>
                                </div>

                                {item.terakhirDieksekusi && (
                                    <div className="text-xs text-muted-foreground pt-2 border-t">
                                        Terakhir: {new Date(item.terakhirDieksekusi).toLocaleDateString("id-ID")}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

```

## File: src\app\statistik\page.tsx
```typescript
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Wallet,
    ArrowUpDown,
    Share2,
    DollarSign,
    PieChart,
    Calendar,
    Lightbulb,
    AlertTriangle
} from "lucide-react"
import { formatRupiah } from "@/lib/format"
import { getCashFlowTable, getIncomeExpenseBook, getSpendingInsights, type CashFlowData, type IncomeExpenseBook as IEBook } from "@/app/actions/analytics"

type PeriodType = '7D' | '30D' | '12W' | '6M' | '1Y'

interface SpendingInsight {
    kategori: string
    nominal: number
    count: number
    persentase: number
    avgPerTransaction: number
    trend: number
    status: string
}

interface SpendingData {
    topCategories: SpendingInsight[]
    spendingByDay: { hari: string; nominal: number }[]
    totalSpending: number
    avgDaily: number
    transactionCount: number
}

export default function StatisticsPage() {
    const [period, setPeriod] = useState<PeriodType>('30D')
    const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
    const [vsLastPeriod, setVsLastPeriod] = useState<{ income: number; expense: number } | null>(null)
    const [incomeExpense, setIncomeExpense] = useState<IEBook | null>(null)
    const [spending, setSpending] = useState<SpendingData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchData() {
            setLoading(true)
            try {
                const [cfResult, ieResult, spResult] = await Promise.all([
                    getCashFlowTable(period),
                    getIncomeExpenseBook(period),
                    getSpendingInsights(period)
                ])

                if (cfResult.success && cfResult.data) {
                    setCashFlow(cfResult.data)
                    setVsLastPeriod(cfResult.vsLastPeriod)
                }
                if (ieResult.success && ieResult.data) {
                    setIncomeExpense(ieResult.data)
                }
                if (spResult.success && spResult.data) {
                    setSpending(spResult.data as SpendingData)
                }
            } catch (error) {
                console.error("Error fetching statistics:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [period])

    const periods: { value: PeriodType; label: string }[] = [
        { value: '7D', label: '7H' },
        { value: '30D', label: '30H' },
        { value: '12W', label: '12M' },
        { value: '6M', label: '6B' },
        { value: '1Y', label: '1T' }
    ]

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl sm:text-3xl font-bold">Statistik</h2>
                </div>
                <div className="grid gap-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-muted rounded-lg"></div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-primary" />
                        Statistik
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Insight keuangan untuk keputusan lebih baik.
                    </p>
                </div>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center">
                <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
                    {periods.map(p => (
                        <Button
                            key={p.value}
                            variant={period === p.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setPeriod(p.value)}
                            className="px-4"
                        >
                            {p.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Cash Flow Table */}
            {cashFlow && (
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ArrowUpDown className="w-5 h-5 text-primary" />
                                Cash Flow Table
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">Apakah saya terlalu boros?</p>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">{cashFlow.periode.toUpperCase()}</p>

                        {/* Quick Overview Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 font-medium text-muted-foreground">Ringkasan</th>
                                        <th className="text-right py-2 font-medium text-emerald-500">Pemasukan</th>
                                        <th className="text-right py-2 font-medium text-red-500">Pengeluaran</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Jumlah Transaksi</td>
                                        <td className="py-2 text-right">{cashFlow.income.count}</td>
                                        <td className="py-2 text-right">{cashFlow.expense.count}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Rata-rata/Hari</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.avgPerDay)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.avgPerDay)}</td>
                                    </tr>
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Rata-rata/Transaksi</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.avgPerRecord)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.avgPerRecord)}</td>
                                    </tr>
                                    <tr className="font-bold">
                                        <td className="py-2">Total</td>
                                        <td className="py-2 text-right" data-private="true">{formatRupiah(cashFlow.income.total)}</td>
                                        <td className="py-2 text-right text-red-500" data-private="true">-{formatRupiah(cashFlow.expense.total)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Cash Flow Summary */}
                        <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                            <span className="font-medium">Cash Flow</span>
                            <span className={`text-xl font-bold ${cashFlow.cashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                                {cashFlow.cashFlow >= 0 ? '+' : ''}{formatRupiah(cashFlow.cashFlow)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Income & Expense Book */}
            {incomeExpense && (
                <Card className="border-l-4 border-l-amber-500">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="w-5 h-5 text-amber-500" />
                                Buku Pemasukan & Pengeluaran
                            </CardTitle>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Share2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs t
... (truncated)
```

## File: src\app\template\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    FileText,
    Plus,
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowLeft,
    Trash2
} from "lucide-react"
import Link from "next/link"
import { getTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { AddTemplateForm } from "@/components/forms/add-template-form"
import { UseTemplateButton } from "@/components/template/use-template-button"
import { DeleteTemplateButton } from "@/components/template/delete-template-button"
import prisma from "@/lib/prisma"

const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

export default async function TemplatePage() {
    const [templatesResult, akuns] = await Promise.all([
        getTemplates(),
        prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } },
            orderBy: { nama: "asc" }
        })
    ])

    const templates = templatesResult.data || []

    // Get kategori from expense accounts
    const expenseAkuns = await prisma.akun.findMany({
        where: { tipe: "EXPENSE" },
        select: { nama: true }
    })
    const kategoris = expenseAkuns.map(a => a.nama.replace("[EXPENSE] ", ""))

    // Get kategori income
    const incomeAkuns = await prisma.akun.findMany({
        where: { tipe: "INCOME" },
        select: { nama: true }
    })
    const kategoriIncome = incomeAkuns.map(a => a.nama.replace("[INCOME] ", ""))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <FileText className="w-6 h-6 text-primary" />
                            Template Transaksi
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Buat transaksi cepat dengan template tersimpan
                        </p>
                    </div>
                </div>
                <AddTemplateForm
                    akuns={akuns}
                    kategoriExpense={kategoris}
                    kategoriIncome={kategoriIncome}
                />
            </div>

            {/* Quick Use Templates */}
            {templates.length > 0 && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Zap className="w-5 h-5 text-amber-500" />
                            Quick Add
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {templates.slice(0, 6).map(template => (
                                <UseTemplateButton
                                    key={template.id}
                                    template={template}
                                    variant="quick"
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Template List */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className="hover:shadow-md transition-all">
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`p-2 rounded-full ${template.tipeTransaksi === "KELUAR"
                                                    ? 'bg-red-100 dark:bg-red-900'
                                                    : 'bg-emerald-100 dark:bg-emerald-900'
                                                }`}
                                        >
                                            {template.tipeTransaksi === "KELUAR"
                                                ? <TrendingDown className="w-4 h-4 text-red-500" />
                                                : <TrendingUp className="w-4 h-4 text-emerald-500" />
                                            }
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{template.nama}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {template.kategori}
                                            </p>
                                        </div>
                                    </div>
                                    <DeleteTemplateButton id={template.id} nama={template.nama} />
                                </div>

                                <p className="text-sm text-muted-foreground mb-2">
                                    {template.deskripsi}
                                </p>

                                <div className="flex items-center justify-between">
                                    <p className={`font-bold ${template.tipeTransaksi === "KELUAR" ? 'text-red-500' : 'text-emerald-500'
                                        }`} data-private="true">
                                        {template.tipeTransaksi === "KELUAR" ? '-' : '+'}{formatRupiah(template.nominal)}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {template.usageCount}x digunakan
                                        </span>
                                        <UseTemplateButton template={template} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <FileText className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Template</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Buat template untuk transaksi yang sering Anda lakukan, seperti beli kopi, bayar parkir, atau terima gaji.
                        </p>
                        <AddTemplateForm
                            akuns={akuns}
                            kategoriExpense={kategoris}
                            kategoriIncome={kategoriIncome}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Tips */}
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                        💡 Tips
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Template paling sering digunakan muncul di Quick Add</li>
                        <li>• Anda juga bisa simpan transaksi yang sudah ada sebagai template</li>
                        <li>• Nominal bisa diubah saat menggunakan template</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    )
}

```

## File: src\app\template-akun\page.tsx
```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    LayoutGrid,
    Plus,
    Building2,
    Calendar,
    Receipt,
    Percent,
    ArrowLeft,
    CheckCircle2,
    XCircle
} from "lucide-react"
import Link from "next/link"
import { getAccountTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { AddAccountTemplateForm } from "@/components/forms/add-account-template-form"
import { ToggleTemplateStatusButton } from "@/components/template/toggle-template-status-button"
import { DeleteAccountTemplateButton } from "@/components/template/delete-account-template-button"

export default async function AccountTemplatePage() {
    const templatesResult = await getAccountTemplates()
    const templates = templatesResult.data || []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link href="/pengaturan">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <LayoutGrid className="w-6 h-6 text-primary" />
                            Template Akun
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Konfigurasi biaya admin dan bunga otomatis untuk akun bank
                        </p>
                    </div>
                </div>
                <AddAccountTemplateForm />
            </div>

            {/* Template List */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className={`hover:shadow-md transition-all ${!template.isActive ? 'opacity-60 grayscale' : ''}`}>
                            <CardContent className="pt-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-full bg-primary/10">
                                            <Building2 className="w-4 h-4 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{template.nama}</h3>
                                            <p className="text-xs text-muted-foreground uppercase">
                                                {template.tipeAkun}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ToggleTemplateStatusButton id={template.id} isActive={template.isActive} />
                                        <DeleteAccountTemplateButton id={template.id} nama={template.nama} />
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Receipt className="w-4 h-4" />
                                            <span>Biaya Admin</span>
                                        </div>
                                        <span className="font-medium" data-private="true">
                                            {template.biayaAdmin ? formatRupiah(template.biayaAdmin) : 'Gratis'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>Tagihan</span>
                                        </div>
                                        <span className="font-medium">
                                            {template.polaTagihan === 'TANGGAL_TETAP' ? `Tgl ${template.tanggalTagihan}` : 
                                             template.polaTagihan === 'JUMAT_MINGGU_KETIGA' ? 'Jumat ke-3' : 'Hari Kerja Akhir'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Percent className="w-4 h-4" />
                                            <span>Bunga</span>
                                        </div>
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {template.bungaTier ? 'Tersedia' : 'Tidak ada'}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-xs text-muted-foreground line-clamp-2 bg-muted/50 p-2 rounded">
                                    {template.deskripsi || "Tidak ada deskripsi."}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <LayoutGrid className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Template Akun</h3>
                        <p className="text-muted-foreground text-center mb-6 max-w-md">
                            Gunakan template untuk mengotomatiskan pencatatan biaya admin bank dan perhitungan bunga bulanan.
                        </p>
                        <AddAccountTemplateForm />
                    </CardContent>
                </Card>
            )}

            {/* Info Automasi */}
            <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="pt-6">
                    <h3 className="font-semibold flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300">
                        <Receipt className="w-5 h-5" />
                        Cara Kerja Automasi
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm text-emerald-700/80 dark:text-emerald-400/80">
                        <div className="space-y-1">
                            <p className="font-medium text-emerald-900 dark:text-emerald-200">• Biaya Admin</p>
                            <p>Sistem menghitung tanggal tagihan bulan berjalan dan membuat transaksi pengeluaran otomatis saat Anda memicu proses di Dashboard.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="font-medium text-emerald-900 dark:text-emerald-200">• Bunga Tabungan</p>
                            <p>Sistem menghitung bunga berdasarkan saldo akhir bulan dan tier bunga, lalu mengkreditkan bunga bersih (setelah pajak 20%) ke akun Anda.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

```

## File: src\app\transaksi\loading.tsx
```typescript
import { TransactionRowSkeleton, Skeleton } from "@/components/ui/skeleton"

export default function TransaksiLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-9 w-52 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-80 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-10 w-40 bg-muted rounded animate-pulse" />
            </div>

            {/* Filter */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 h-10 bg-muted rounded animate-pulse" />
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-muted rounded animate-pulse" />
                        <div className="h-10 w-20 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <Skeleton key={i} className="h-8 w-24" />
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="rounded-lg border bg-card">
                <table className="w-full">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="px-6 py-4 text-left">
                                <Skeleton className="h-4 w-32" />
                            </th>
                            <th className="px-6 py-4 text-left">
                                <Skeleton className="h-4 w-20" />
                            </th>
                            <th className="px-6 py-4 text-center">
                                <Skeleton className="h-4 w-16 mx-auto" />
                            </th>
                            <th className="px-6 py-4 text-right">
                                <Skeleton className="h-4 w-20 ml-auto" />
                            </th>
                            <th className="px-6 py-4 text-center">
                                <Skeleton className="h-4 w-12 mx-auto" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                            <TransactionRowSkeleton key={i} />
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-center gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
            </div>
        </div>
    )
}

```

## File: src\app\transaksi\page.tsx
```typescript
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    ArrowUpRight,
    ArrowDownLeft,
    Calendar as CalendarIcon,
    Tag,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { TransaksiActions } from "@/components/transaksi/transaksi-actions"
import { TransaksiFilter } from "@/components/transaksi/transaksi-filter"
import { getTransaksi } from "@/app/actions/transaksi"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"

interface PageProps {
    searchParams: Promise<{
        page?: string
        search?: string
        kategori?: string
        tipe?: string
        dateFrom?: string
        dateTo?: string
        minNominal?: string
        maxNominal?: string
        sort?: string
        sortDir?: string
        akunId?: string // Tambahkan akunId
    }>
}

export default async function TransaksiPage({ searchParams }: PageProps) {
    const params = await searchParams
    const currentPage = Number(params.page) || 1
    const currentAkunId = params.akunId

    const result = await getTransaksi({
        page: currentPage,
        search: params.search,
        kategori: params.kategori,
        tipe: params.tipe,
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        minNominal: params.minNominal ? Number(params.minNominal) : undefined,
        maxNominal: params.maxNominal ? Number(params.maxNominal) : undefined,
        sort: params.sort,
        sortDir: params.sortDir,
        akunId: currentAkunId, // Pass akunId ke action
    })
    const transactions = result.data
    const { pagination } = result

    // Tampilkan kolom Saldo jika sedang memfilter per akun
    const showSaldoColumn = Boolean(currentAkunId && (params.sort === "tanggal" || !params.sort))

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Riwayat Transaksi</h2>
                    <p className="text-muted-foreground">
                        Catatan detail setiap pemasukan dan pengeluaran Anda.
                    </p>
                </div>
                <AddTransactionForm />
            </div>

            <TransaksiFilter
                currentSearch={params.search}
                currentKategori={params.kategori}
                currentTipe={params.tipe}
                currentDateFrom={params.dateFrom}
                currentDateTo={params.dateTo}
                currentMinNominal={params.minNominal}
                currentMaxNominal={params.maxNominal}
                currentSort={params.sort}
                currentSortDir={params.sortDir}
            />

            <Card>
                <CardContent className="p-0">
                    {/* Desktop: Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tanggal / Deskripsi</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kategori</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Akun</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Nominal</th>
                                    {showSaldoColumn && (
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo</th>
                                    )}
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                            Belum ada transaksi tercatat.
                                        </td>
                                    </tr>
                                ) : (
                                    transactions.map((tx: any) => {
                                        const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                                            ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe)

                                        return (
                                            <tr key={tx.id} className="hover:bg-accent/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-full ${isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                            {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{tx.deskripsi}</div>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                <CalendarIcon className="w-3 h-3" />
                                                                {tx.tanggal.toLocaleDateString('id-ID')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1 text-sm bg-secondary/50 px-2 py-1 rounded w-fit">
                                                        <Tag className="w-3 h-3" />
                                                        {tx.kategori}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
                                                        <span className="text-primary font-bold">{tx.kreditAkun?.nama || tx.debitAkun?.nama}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className={`font-bold ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
                                                        {isExpense ? '-' : '+'}{formatRupiah(tx.nominal)}
                                                    </div>
                                                </td>
                                                {showSaldoColumn && (
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="font-mono text-xs text-muted-foreground" data-private="true">
                                                            {formatRupiah(tx.saldoSetelah)}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 text-center">
                                                    <TransaksiActions transaksi={tx} />
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile: Card List View */}
                    <div className="md:hidden divide-y">
                        {transactions.length === 0 ? (
                            <div className="px-4 py-12 text-center text-muted-foreground">
                                Belum ada transaksi tercatat.
                            </div>
                        ) : (
                            transactions.map((tx: any) => {
                                const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe)

                                return (
                                    <div key={tx.id} className="p-4 hover:bg-accent/40 transition-colors">

... (truncated)
```