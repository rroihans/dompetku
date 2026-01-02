"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, Filter, X, Calendar, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Kategori pengeluaran
const KATEGORI_PENGELUARAN = [
    "Makan & Minum",
    "Transportasi",
    "Belanja",
    "Hiburan",
    "Tagihan",
    "Kesehatan",
    "Pendidikan",
    "Internet",
    "Air",
    "Listrik",
    "Lainnya (Pengeluaran)",
]

// Kategori pemasukan
const KATEGORI_PEMASUKAN = [
    "Gaji",
    "Bonus",
    "Transfer Masuk",
    "Investasi",
    "Lainnya (Pemasukan)",
]

// Deduplicate using Set
const ALL_KATEGORI = [...new Set([...KATEGORI_PENGELUARAN, ...KATEGORI_PEMASUKAN])]

// Quick filter presets
const QUICK_FILTERS = [
    { label: "Hari Ini", value: "today" },
    { label: "Minggu Ini", value: "week" },
    { label: "Bulan Ini", value: "month" },
    { label: "Bulan Lalu", value: "lastmonth" },
]

// Nominal presets
const NOMINAL_PRESETS = [
    { label: "< 100rb", min: 0, max: 100000 },
    { label: "100rb - 500rb", min: 100000, max: 500000 },
    { label: "500rb - 1jt", min: 500000, max: 1000000 },
    { label: "> 1jt", min: 1000000, max: null },
]

interface TransaksiFilterProps {
    currentSearch?: string
    currentKategori?: string
    currentTipe?: string
    currentDateFrom?: string
    currentDateTo?: string
    currentMinNominal?: string
    currentMaxNominal?: string
    currentSort?: string
    currentSortDir?: string
}

export function TransaksiFilter({
    currentSearch = "",
    currentKategori = "",
    currentTipe = "",
    currentDateFrom = "",
    currentDateTo = "",
    currentMinNominal = "",
    currentMaxNominal = "",
    currentSort = "tanggal",
    currentSortDir = "desc"
}: TransaksiFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const [search, setSearch] = useState(currentSearch)
    const [kategori, setKategori] = useState(currentKategori)
    const [tipe, setTipe] = useState(currentTipe)
    const [dateFrom, setDateFrom] = useState(currentDateFrom)
    const [dateTo, setDateTo] = useState(currentDateTo)
    const [minNominal, setMinNominal] = useState(currentMinNominal)
    const [maxNominal, setMaxNominal] = useState(currentMaxNominal)
    const [sort, setSort] = useState(currentSort)
    const [sortDir, setSortDir] = useState(currentSortDir)
    const [showFilters, setShowFilters] = useState(
        Boolean(currentKategori || currentTipe || currentDateFrom || currentDateTo || currentMinNominal || currentMaxNominal)
    )

    function applyFilters() {
        const params = new URLSearchParams()

        if (search) params.set("search", search)
        if (kategori && kategori !== "all") params.set("kategori", kategori)
        if (tipe && tipe !== "all") params.set("tipe", tipe)
        if (dateFrom) params.set("dateFrom", dateFrom)
        if (dateTo) params.set("dateTo", dateTo)
        if (minNominal) params.set("minNominal", minNominal)
        if (maxNominal) params.set("maxNominal", maxNominal)
        if (sort && sort !== "tanggal") params.set("sort", sort)
        if (sortDir && sortDir !== "desc") params.set("sortDir", sortDir)

        startTransition(() => {
            router.push(`/transaksi?${params.toString()}`)
        })
    }

    function clearFilters() {
        setSearch("")
        setKategori("")
        setTipe("")
        setDateFrom("")
        setDateTo("")
        setMinNominal("")
        setMaxNominal("")
        setSort("tanggal")
        setSortDir("desc")
        startTransition(() => {
            router.push("/transaksi")
        })
    }

    function removeFilter(filterType: string) {
        const params = new URLSearchParams(searchParams.toString())

        switch (filterType) {
            case "search":
                setSearch("")
                params.delete("search")
                break
            case "kategori":
                setKategori("")
                params.delete("kategori")
                break
            case "tipe":
                setTipe("")
                params.delete("tipe")
                break
            case "date":
                setDateFrom("")
                setDateTo("")
                params.delete("dateFrom")
                params.delete("dateTo")
                break
            case "nominal":
                setMinNominal("")
                setMaxNominal("")
                params.delete("minNominal")
                params.delete("maxNominal")
                break
        }

        params.delete("page")
        startTransition(() => {
            router.push(`/transaksi?${params.toString()}`)
        })
    }


    function applyQuickFilter(preset: string) {
        const today = new Date()
        let from = ""
        let to = today.toISOString().split("T")[0]

        switch (preset) {
            case "today":
                from = to
                break
            case "week":
                const weekAgo = new Date(today)
                weekAgo.setDate(weekAgo.getDate() - 7)
                from = weekAgo.toISOString().split("T")[0]
                break
            case "month":
                from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0]
                break
            case "lastmonth":
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split("T")[0]
                to = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split("T")[0]
                break
        }

        setDateFrom(from)
        setDateTo(to)

        const params = new URLSearchParams(searchParams.toString())
        params.set("dateFrom", from)
        params.set("dateTo", to)
        params.delete("page")

        startTransition(() => {
            router.push(`/transaksi?${params.toString()}`)
        })
    }

    function applyNominalPreset(min: number, max: number | null) {
        setMinNominal(min.toString())
        setMaxNominal(max ? max.toString() : "")

        const params = new URLSearchParams(searchParams.toString())
        params.set("minNominal", min.toString())
        if (max) {
            params.set("maxNominal", max.toString())
        } else {
            params.delete("maxNominal")
        }
        params.delete("page")

        startTransition(() => {
            router.push(`/transaksi?${params.toString()}`)
        })
    }

    function toggleSort(field: string) {
        let newDir = "desc"
        if (sort === field) {
            newDir = sortDir === "desc" ? "asc" : "desc"
        }
        setSort(field)
        setSortDir(newDir)

        const params = new URLSearchParams(searchParams.toString())
        params.set("sort", field)
        params.set("sortDir", newDir)
        params.delete("page")

        startTransition(() => {
            router.push(`/transaksi?${params.toString()}`)
        })
    }

    const hasActiveFilters = currentSearch || currentKategori || currentTipe ||
        currentDateFrom || currentDateTo || currentMinNominal || currentMaxNominal

    return (
        <div className="space-y-4">
            {/* Search dan tombol utama */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                        type="text"
                        placeholder="Cari transaksi, akun..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={showFilters ? "secondary" : "outline"}
                        className="flex items-center gap-2"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="w-4 h-4" />
                        Filter
                        {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </Button>
                    <Button onClick={applyFilters} disabled={isPending}>
                        {isPending ? "..." : "Cari"}
                    </Button>
                </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
                {QUICK_FILTERS.map((qf) => (
                    <Button
                        key={qf.value}
                        variant="outline"
                        size="sm"
                        onClick={() => applyQuickFilter(qf.value)}
                        className="text-xs"
                    >
                        {qf.label}
                    </Button>
                ))}
                <div className="border-l mx-2" />
                {NOMINAL_PRESETS.map((np) => (
                    <Button
                        key={np.label}
                        variant="outline"
                        size="sm"
                        onClick={() => applyNominalPreset(np.min, np.max)}
                        className="text-xs"
                    >
                        {np.label}
                    </Button>
                ))}
            </div>

            {/* Filter Panel yang diperluas */}
            {showFilters && (
                <div className="p-4 bg-muted/30 rounded-lg space-y-4">
                    {/* Row 1: Kategori & Tipe */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Kategori</label>
                            <Select value={kategori} onValueChange={setKategori}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {ALL_KATEGORI.map((kat) => (
                                        <SelectItem key={kat} value={kat}>
                                            {kat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Tipe</label>
                            <Select value={tipe} onValueChange={setTipe}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semua Tipe" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Tipe</SelectItem>
                                    <SelectItem value="expense">Pengeluaran</SelectItem>
                                    <SelectItem value="income">Pemasukan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Dari Tanggal</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Sampai Tanggal</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Row 2: Nominal Range & Sorting */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Nominal Min</label>
                            <Input
                                type="number"
                                placeholder="0"
                                value={minNominal}
                                onChange={(e) => setMinNominal(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Nominal Max</label>
                            <Input
                                type="number"
                                placeholder="Tidak terbatas"
                                value={maxNominal}
                                onChange={(e) => setMaxNominal(e.target.value)}
                            />
                        </div>

                        {/* Sorting */}
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Urutkan</label>
                            <Select value={sort} onValueChange={setSort}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tanggal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="tanggal">Tanggal</SelectItem>
                                    <SelectItem value="nominal">Nominal</SelectItem>
                                    <SelectItem value="kategori">Kategori</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Arah</label>
                            <Select value={sortDir} onValueChange={setSortDir}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Terbaru" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="desc">Terbaru / Terbesar</SelectItem>
                                    <SelectItem value="asc">Terlama / Terkecil</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-2 border-t">
                        {hasActiveFilters && (
                            <Button variant="ghost" size="sm" onClick={clearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Reset Semua
                            </Button>
                        )}
                        <Button size="sm" onClick={applyFilters} disabled={isPending}>
                            Terapkan Filter
                        </Button>
                    </div>
                </div>
            )}

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Filter aktif:</span>
                    {currentSearch && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1">
                            "{currentSearch}"
                            <button onClick={() => removeFilter("search")} className="hover:bg-primary/20 rounded p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {currentKategori && (
                        <span className="bg-secondary px-2 py-0.5 rounded inline-flex items-center gap-1">
                            {currentKategori}
                            <button onClick={() => removeFilter("kategori")} className="hover:bg-muted rounded p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {currentTipe && (
                        <span className="bg-secondary px-2 py-0.5 rounded inline-flex items-center gap-1">
                            {currentTipe === "expense" ? "Pengeluaran" : "Pemasukan"}
                            <button onClick={() => removeFilter("tipe")} className="hover:bg-muted rounded p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(currentDateFrom || currentDateTo) && (
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            📅 {currentDateFrom || "..."} - {currentDateTo || "..."}
                            <button onClick={() => removeFilter("date")} className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {(currentMinNominal || currentMaxNominal) && (
                        <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            💰 {currentMinNominal ? `Rp${Number(currentMinNominal).toLocaleString()}` : "0"} - {currentMaxNominal ? `Rp${Number(currentMaxNominal).toLocaleString()}` : "∞"}
                            <button onClick={() => removeFilter("nominal")} className="hover:bg-green-200 dark:hover:bg-green-800 rounded p-0.5">
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-6 px-2 text-xs text-muted-foreground"
                        title="Reset Semua"
                    >
                        Reset Semua
                    </Button>
                </div>
            )}
        </div>
    )
}
