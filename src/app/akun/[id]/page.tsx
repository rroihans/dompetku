
import { notFound } from "next/navigation"
import { getAkunDetail } from "@/app/actions/akun"
import { formatRupiah } from "@/lib/format"
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
    ArrowDownLeft
} from "lucide-react"
import Link from "next/link"
import { SaldoTrendChart } from "@/components/charts/saldo-trend-chart"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function AkunDetailPage({ params }: PageProps) {
    const { id } = await params
    const result = await getAkunDetail(id)

    if (!result.success || !result.data) {
        return notFound()
    }

    const { akun, recentTransactions, trendData } = result.data

    const getIcon = (type: string) => {
        switch (type) {
            case 'BANK': return Wallet
            case 'E_WALLET': return Smartphone
            case 'CREDIT_CARD': return CreditCard
            case 'CASH': return Banknote
            default: return Wallet
        }
    }

    const Icon = getIcon(akun.tipe)
    const accentColor = akun.warna || '#3b82f6'

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/akun">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{akun.nama}</h2>
                    <p className="text-muted-foreground text-sm">
                        Detail informasi dan riwayat akun
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Account Summary Card */}
                <Card className="lg:col-span-1" style={{ borderTop: `4px solid ${accentColor}` }}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Saldo Saat Ini</CardTitle>
                        <Icon className="w-5 h-5" style={{ color: accentColor }} />
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

            {/* Recent Transactions */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
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
        </div>
    )
}
