"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
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
import { AdvancedFilterPanel } from "@/components/transaksi/advanced-filter-panel"
import { getTransaksi } from "@/lib/db/transactions-repo"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"

export default function TransaksiPage() {
    const searchParams = useSearchParams()
    const [transactions, setTransactions] = useState<any[]>([])
    const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 })
    const [loading, setLoading] = useState(true)

    const params = useMemo(() => {
        const kategoriList = searchParams.getAll("kategori")
        const akunIdList = searchParams.getAll("akunId")
        const kategori = kategoriList.length > 1 ? kategoriList : kategoriList[0]
        const akunId = akunIdList.length > 1 ? akunIdList : akunIdList[0]

        return {
            page: searchParams.get("page") ?? undefined,
            search: searchParams.get("search") ?? undefined,
            kategori: kategori ?? undefined,
            tipe: searchParams.get("tipe") ?? undefined,
            dateFrom: searchParams.get("dateFrom") ?? undefined,
            dateTo: searchParams.get("dateTo") ?? undefined,
            minNominal: searchParams.get("minNominal") ?? undefined,
            maxNominal: searchParams.get("maxNominal") ?? undefined,
            sort: searchParams.get("sort") ?? undefined,
            sortDir: searchParams.get("sortDir") ?? undefined,
            akunId: akunId ?? undefined,
            complexFilter: searchParams.get("complexFilter") ?? undefined,
        }
    }, [searchParams])

    const currentPage = Number(params.page) || 1
    const currentAkunId = params.akunId

    useEffect(() => {
        let active = true
        setLoading(true)
        getTransaksi({
            page: currentPage,
            search: params.search,
            kategori: params.kategori as any,
            tipe: params.tipe,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            minNominal: params.minNominal ? Number(params.minNominal) : undefined,
            maxNominal: params.maxNominal ? Number(params.maxNominal) : undefined,
            sort: params.sort,
            sortDir: params.sortDir,
            akunId: params.akunId as any,
            complexFilter: params.complexFilter,
        }).then((result) => {
            if (!active) return
            setTransactions(result.data)
            setPagination(result.pagination)
            setLoading(false)
        }).catch(() => {
            if (!active) return
            setTransactions([])
            setPagination({ page: currentPage, pageSize: 25, total: 0, totalPages: 0 })
            setLoading(false)
        })

        return () => {
            active = false
        }
    }, [currentPage, params])

    // Tampilkan kolom Saldo jika sedang memfilter per akun (single)
    const showSaldoColumn = Boolean(currentAkunId && !Array.isArray(currentAkunId) && (params.sort === "tanggal" || !params.sort))

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

            <AdvancedFilterPanel />

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
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                            Memuat transaksi...
                                        </td>
                                    </tr>
                                ) : transactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
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
                                                        {(() => {
                                                            const isTransfer = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.debitAkun?.tipe) &&
                                                                ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe);

                                                            if (isTransfer) {
                                                                return (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-primary font-bold truncate max-w-[80px]" title={tx.kreditAkun?.nama}>{tx.kreditAkun?.nama}</span>
                                                                        <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                                                                        <span className="text-primary font-bold truncate max-w-[80px]" title={tx.debitAkun?.nama}>{tx.debitAkun?.nama}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return <span className="text-primary font-bold">{tx.kreditAkun?.nama || tx.debitAkun?.nama}</span>;
                                                        })()}
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
                                                            {formatRupiah(tx.saldoSetelah ?? 0)}
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
                        {loading ? (
                            <div className="px-4 py-12 text-center text-muted-foreground">
                                Memuat transaksi...
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="px-4 py-12 text-center text-muted-foreground">
                                Belum ada transaksi tercatat.
                            </div>
                        ) : (
                            transactions.map((tx: any) => {
                                const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe)

                                return (
                                    <div key={tx.id} className="p-4 hover:bg-accent/40 transition-colors">
                                        {/* Row 1: Icon + Deskripsi + Nominal */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                                <div className={`p-2 rounded-full shrink-0 ${isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-medium truncate">{tx.deskripsi}</div>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                        <CalendarIcon className="w-3 h-3 shrink-0" />
                                                        {tx.tanggal.toLocaleDateString('id-ID')}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`font-bold text-right shrink-0 ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
                                                {isExpense ? '-' : '+'}{formatRupiah(tx.nominal)}
                                            </div>
                                        </div>

                                        {/* Row 2: Kategori + Akun + Aksi */}
                                        <div className="flex items-center justify-between mt-3 pl-11">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="flex items-center gap-1 bg-secondary/50 px-2 py-1 rounded">
                                                        <Tag className="w-3 h-3" />
                                                        {tx.kategori}
                                                    </span>
                                                    <span className="text-muted-foreground">•</span>
                                                    <span className="text-primary font-medium truncate max-w-[150px]">
                                                        {(() => {
                                                            const isTransfer = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.debitAkun?.tipe) &&
                                                                ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe);

                                                            if (isTransfer) {
                                                                return `${tx.kreditAkun?.nama} -> ${tx.debitAkun?.nama}`;
                                                            }
                                                            return tx.kreditAkun?.nama || tx.debitAkun?.nama;
                                                        })()}
                                                    </span>
                                                </div>
                                                {showSaldoColumn && (
                                                    <div className="text-[10px] text-muted-foreground font-mono">
                                                        Saldo: <span data-private="true">{formatRupiah(tx.saldoSetelah ?? 0)}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <TransaksiActions transaksi={tx} />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                        Menampilkan {transactions.length} dari {pagination.total} transaksi
                    </span>
                    <div className="flex items-center gap-2">
                        {currentPage > 1 ? (
                            <Link href={`/transaksi?page=${currentPage - 1}${params.search ? `&search=${params.search}` : ''}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    <ChevronLeft className="w-4 h-4" /> Sebelumnya
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" className="gap-1" disabled>
                                <ChevronLeft className="w-4 h-4" /> Sebelumnya
                            </Button>
                        )}
                        <span className="text-sm px-2">
                            {pagination.page} / {pagination.totalPages}
                        </span>
                        {currentPage < pagination.totalPages ? (
                            <Link href={`/transaksi?page=${currentPage + 1}${params.search ? `&search=${params.search}` : ''}`}>
                                <Button variant="outline" size="sm" className="gap-1">
                                    Berikutnya <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" className="gap-1" disabled>
                                Berikutnya <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
