"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { quickDebugAdminFee } from "@/lib/db/debug-repo"
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
