"use client"

import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    ArrowUpRight,
    ArrowDownLeft,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search
} from "lucide-react"
import { AddTransactionForm } from "@/components/forms/add-transaction-form"
import { TransaksiActions } from "@/components/transaksi/transaksi-actions"
import { AdvancedFilterPanel } from "@/components/transaksi/advanced-filter-panel"
import { getTransaksi } from "@/lib/db/transactions-repo"
import { formatRupiah } from "@/lib/format"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { MappedTransaksi } from "@/types/transaksi"

// Helper to group transactions by date
function groupTransactionsByDate(transactions: MappedTransaksi[]) {
    const grouped: { [key: string]: MappedTransaksi[] } = {}
    transactions.forEach(tx => {
        const dateKey = tx.tanggal.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        if (!grouped[dateKey]) {
            grouped[dateKey] = []
        }
        grouped[dateKey].push(tx)
    })
    return grouped
}

export default function TransaksiPage() {
    const searchParams = useSearchParams()
    const [transactions, setTransactions] = useState<MappedTransaksi[]>([])
    const [pagination, setPagination] = useState({ page: 1, pageSize: 25, total: 0, totalPages: 0 })
    const [loading, setLoading] = useState(true)
    const [showFilter, setShowFilter] = useState(false)

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

    useEffect(() => {
        let active = true
        // Defer to avoid cascading render warning
        Promise.resolve().then(() => setLoading(true))
        getTransaksi({
            page: currentPage,
            search: params.search,
            kategori: params.kategori as string | string[],
            tipe: params.tipe,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
            minNominal: params.minNominal ? Number(params.minNominal) : undefined,
            maxNominal: params.maxNominal ? Number(params.maxNominal) : undefined,
            sort: params.sort,
            sortDir: params.sortDir,
            akunId: params.akunId as string | string[],
            complexFilter: params.complexFilter,
        }).then((result) => {
            if (!active) return
            setTransactions(result.data as MappedTransaksi[])
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

    const groupedTransactions = groupTransactionsByDate(transactions)

    return (
        <div className="space-y-4 pb-20">
            <div className="flex flex-col gap-4 sticky top-14 bg-background z-20 pt-2 pb-2">
                 <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold tracking-tight">Riwayat</h2>
                         <p className="text-xs text-muted-foreground">
                            {pagination.total} transaksi tercatat.
                        </p>
                    </div>
                    <AddTransactionForm />
                 </div>

                 {/* Mobile Search & Filter Bar */}
                 <div className="flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder="Cari transaksi..."
                          aria-label="Cari transaksi berdasarkan deskripsi atau catatan"
                          className="pl-8 h-9 text-sm bg-muted/50 border-none"
                          defaultValue={params.search}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  const val = e.currentTarget.value
                                  const newParams = new URLSearchParams(searchParams.toString())
                                  if (val) newParams.set('search', val)
                                  else newParams.delete('search')
                                  window.history.pushState(null, '', `?${newParams.toString()}`)
                              }
                          }}
                        />
                     </div>
                     <Button
                        variant={showFilter ? "secondary" : "outline"}
                        size="icon"
                        aria-label={showFilter ? "Sembunyikan filter" : "Tampilkan filter lanjutan"}
                        className="h-9 w-9 shrink-0"
                        onClick={() => setShowFilter(!showFilter)}
                    >
                        <Filter className="w-4 h-4" />
                    </Button>
                 </div>
            </div>

            {showFilter && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                     <AdvancedFilterPanel />
                </div>
            )}

            {/* Transaction List */}
            <div className="space-y-4">
                {loading ? (
                     <div className="space-y-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                        ))}
                     </div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Belum ada transaksi.</p>
                    </div>
                ) : (
                    Object.entries(groupedTransactions).map(([date, txs]) => (
                        <div key={date} className="space-y-1" role="region" aria-label={`Transaksi pada ${date}`}>
                            <div className="sticky top-[130px] z-10 bg-background/95 backdrop-blur py-1 px-2 text-xs font-semibold text-muted-foreground border-b w-full">
                                {date}
                            </div>
                            <div className="bg-card rounded-lg border shadow-sm divide-y" role="list">
                                {txs.map((tx) => {
                                    const isExpense = tx.debitAkun?.tipe === "EXPENSE" ||
                                        ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(tx.kreditAkun?.tipe || "")

                                    return (
                                        <div key={tx.id} role="listitem" className="p-3 hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 relative group">
                                            {/* Left: Icon & Main Info */}
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                 <div 
                                                    aria-hidden="true"
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isExpense ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {isExpense ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                 </div>
                                                 <div className="min-w-0 flex-1">
                                                     <div className="text-sm font-medium truncate">{tx.deskripsi}</div>
                                                     <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                         <span className="bg-secondary px-1.5 py-0.5 rounded text-[9px] font-medium">{tx.kategori}</span>
                                                         <span>•</span>
                                                         <span className="truncate max-w-[100px]">{tx.kreditAkun?.nama || tx.debitAkun?.nama}</span>
                                                     </div>
                                                 </div>
                                            </div>

                                            {/* Right: Amount & Action */}
                                            <div className="text-right shrink-0">
                                                <div className={`text-sm font-bold ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} data-private="true">
                                                    {isExpense ? '-' : '+'}{formatRupiah(tx.nominal)}
                                                </div>
                                                <div 
                                                    aria-hidden="true" 
                                                    tabIndex={-1} 
                                                    className="hidden md:block absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 p-1 rounded-md shadow-sm"
                                                >
                                                    <TransaksiActions transaksi={tx} />
                                                </div>
                                                {/* Mobile visible action trigger area */}
                                                 <div className="md:hidden mt-1 flex justify-end">
                                                      <TransaksiActions transaksi={tx} />
                                                 </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination - Compact */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 pt-4">
                     <Link href={`/transaksi?page=${currentPage - 1}${params.search ? `&search=${params.search}` : ''}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage <= 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <span className="text-xs text-muted-foreground">
                        {pagination.page} / {pagination.totalPages}
                    </span>
                    <Link href={`/transaksi?page=${currentPage + 1}${params.search ? `&search=${params.search}` : ''}`}>
                        <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage >= pagination.totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
