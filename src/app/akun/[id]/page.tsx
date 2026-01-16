
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
    Info,
    Clock
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
import { calculateNextBillingDate } from "@/lib/template-utils"
import { ExternalLink } from "lucide-react"

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
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                            <Receipt className="w-4 h-4 text-primary" />
                                            Informasi Automasi Aktif
                                        </CardTitle>
                                        <Link href={`/recurring?highlight=${akun.id}`}>
                                            <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2">
                                                <ExternalLink className="w-3 h-3" /> Lihat di Recurring
                                            </Button>
                                        </Link>
                                    </div>
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
                                                <Clock className="w-3 h-3" /> Billing Berikutnya
                                            </p>
                                            <p className="font-bold text-primary">
                                                {calculateNextBillingDate(
                                                    (akun.biayaAdminPola as any) || 'FIXED_DATE',
                                                    akun.biayaAdminTanggal || 1,
                                                    new Date()
                                                ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
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
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                                {akun.bungaAktif ? 'Aktif' : 'Nonaktif'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <History className="w-4 h-4 text-muted-foreground" />
                                        Riwayat Biaya Admin (6 Bln Terakhir)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {adminFees.length === 0 ? (
                                        <p className="text-xs text-muted-foreground py-4 text-center italic">Belum ada riwayat biaya admin.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {adminFees.map((fee) => (
                                                <div key={fee.id} className="flex justify-between items-center text-xs p-2 rounded bg-muted/30">
                                                    <span>{new Date(fee.tanggal).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                                                    <span className="font-bold text-red-500" data-private="true">-{formatRupiah(fee.nominal)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <History className="w-5 h-5 text-primary" />
                                10 Transaksi Terakhir
                            </CardTitle>
                            <Link href={`/transaksi?akunId=${akun.id}&search=${encodeURIComponent(akun.nama)}`}>
                                <Button variant="ghost" size="sm">Lihat Semua</Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentTransactions.length === 0 ? (
                                    <p className="text-center py-8 text-muted-foreground italic">Belum ada transaksi di akun ini.</p>
                                ) : (
                                    recentTransactions.map((tx: any) => {
                                        const isDebit = tx.debitAkunId === akun.id
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full ${isDebit ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                        {isDebit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{tx.deskripsi}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(tx.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} • {tx.kategori}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${isDebit ? 'text-emerald-500' : 'text-red-500'}`} data-private="true">
                                                        {isDebit ? '+' : '-'}{formatRupiah(tx.nominal)}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground">
                                                        {isDebit ? `Dari: ${tx.kreditAkun.nama}` : `Ke: ${tx.debitAkun.nama}`}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pengaturan" className="pt-4 space-y-6">
                    {/* Edit Account Form */}
                    <EditAccountForm akun={akun} />

                    {/* Automation Settings */}
                    <AccountSettingsClient akun={akun} templates={templates} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
