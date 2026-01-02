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
                                                    className="bg-primary h-full transition-all duration-1000"
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Terbayar: <span data-private="true">{formatRupiah(sudahBayar)}</span></span>
                                                <span>{sisaTenor} pembayaran tersisa</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </>
            )}

            {/* Cicilan Lunas */}
            {cicilanLunas.length > 0 && (
                <>
                    <h3 className="text-xl font-semibold mt-8 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Sudah Lunas ({cicilanLunas.length})
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {cicilanLunas.map((item: any) => (
                            <Card key={item.id} className="opacity-70 border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {item.namaProduk}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {akunMap.get(item.akunKreditId) || "Kartu Kredit"}
                                        </CardDescription>
                                    </div>
                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                        LUNAS
                                    </span>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total: {formatRupiah(item.totalPokok)}</span>
                                        <span className="text-muted-foreground">{item.tenor}x cicilan</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            {/* Empty State */}
            {cicilan.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <CreditCard className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Rencana Cicilan</h3>
                        <p className="text-muted-foreground text-center mb-4 max-w-md">
                            Catat cicilan kartu kredit Anda untuk tracking otomatis pembayaran bulanan, jatuh tempo, dan progres pelunasan.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
