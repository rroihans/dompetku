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

function formatCell(row: any, col: string): string {
    const value = row[col]

    if (value === null || value === undefined) return "-"
    if (col === "debitAkun" || col === "kreditAkun") {
        return value?.nama ? `${value.nama} (${value.tipe})` : "-"
    }
    if (value instanceof Date) {
        return value.toLocaleString("id-ID")
    }
    if (typeof value === "object") {
        return JSON.stringify(value).substring(0, 50)
    }
    if (typeof value === "boolean") {
        return value ? "✓" : "✗"
    }
    if (typeof value === "number") {
        return value.toLocaleString("id-ID")
    }
    if (typeof value === "string" && value.length > 30) {
        return value.substring(0, 30) + "..."
    }
    return String(value)
}
