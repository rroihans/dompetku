"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Filter, Save, Trash, Clock, ChevronDown, ChevronUp, Database, X } from "lucide-react"
import { getFilterPresets, saveFilterPreset, deleteFilterPreset, incrementPresetUsage } from "@/app/actions/filter-preset"
import { getAkun } from "@/app/actions/akun"
import { getAvailableCategories } from "@/app/actions/anggaran"
import { ActiveFilterChips } from "./active-filter-chips"
import { FilterLogicBuilder } from "./filter-logic-builder"
import { RuleGroup } from "@/lib/query-builder"
import { SavePresetDialog } from "./save-preset-dialog"

export function AdvancedFilterPanel() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isExpanded, setIsExpanded] = useState(true)
    const [mode, setMode] = useState<'standard' | 'advanced'>('standard')
    
    // Standard Filter States
    const [dateFrom, setDateFrom] = useState("")
    const [dateTo, setDateTo] = useState("")
    const [minNominal, setMinNominal] = useState("")
    const [maxNominal, setMaxNominal] = useState("")
    const [kategori, setKategori] = useState<string[]>([])
    const [akunId, setAkunId] = useState<string[]>([])
    const [tipe, setTipe] = useState("")

    // Data options
    const [akuns, setAkuns] = useState<any[]>([])
    const [categories, setCategories] = useState<string[]>([])
    const [presets, setPresets] = useState<any[]>([])

    // Advanced Logic
    const [logicGroup, setLogicGroup] = useState<RuleGroup>({ combinator: 'AND', rules: [] })

    useEffect(() => {
        // Load options
        getAkun().then(setAkuns)
        getAvailableCategories().then(res => setCategories(res.data || []))
        getFilterPresets().then(res => setPresets(res.data || []))

        // Parse Params
        setDateFrom(searchParams.get("dateFrom") || "")
        setDateTo(searchParams.get("dateTo") || "")
        setMinNominal(searchParams.get("minNominal") || "")
        setMaxNominal(searchParams.get("maxNominal") || "")
        setTipe(searchParams.get("tipe") || "")
        
        const kat = searchParams.getAll("kategori")
        setKategori(kat)
        
        const acc = searchParams.getAll("akunId")
        setAkunId(acc)

        const complex = searchParams.get("complexFilter")
        if (complex) {
            setMode('advanced')
            setIsExpanded(true)
            try {
                setLogicGroup(JSON.parse(complex))
            } catch (e) {}
        }
    }, [searchParams])

    const applyFilters = () => {
        const params = new URLSearchParams()
        
        if (mode === 'standard') {
            if (dateFrom) params.set("dateFrom", dateFrom)
            if (dateTo) params.set("dateTo", dateTo)
            if (minNominal) params.set("minNominal", minNominal)
            if (maxNominal) params.set("maxNominal", maxNominal)
            if (tipe) params.set("tipe", tipe)
            kategori.forEach(k => params.append("kategori", k))
            akunId.forEach(a => params.append("akunId", a))
        } else {
            if (logicGroup.rules.length > 0) {
                params.set("complexFilter", JSON.stringify(logicGroup))
            }
        }

        // Keep sort/page if exists? Or reset page?
        // Reset page is safer
        router.push(`?${params.toString()}`)
        // setIsExpanded(false) // Keep expanded if user wants to tweak? Better collapse on mobile.
    }

    const loadPreset = async (preset: any) => {
        await incrementPresetUsage(preset.id);
        const filters = JSON.parse(preset.filters);
        
        // Check if complex
        if (filters.complexFilter) {
            setMode('advanced');
            try {
                setLogicGroup(JSON.parse(filters.complexFilter));
            } catch (e) {}
        } else {
            setMode('standard');
            // Restore standard states
            setDateFrom(filters.dateFrom || "");
            setDateTo(filters.dateTo || "");
            setMinNominal(filters.minNominal || "");
            setMaxNominal(filters.maxNominal || "");
            setTipe(filters.tipe || "");
            setKategori(filters.kategori || []);
            setAkunId(filters.akunId || []);
        }

        // Apply immediately
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            const val = filters[key];
            if (Array.isArray(val)) {
                val.forEach(v => params.append(key, v));
            } else if (val) {
                params.set(key, val);
            }
        });
        router.push(`?${params.toString()}`);
    }

    const deletePreset = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm("Hapus preset ini?")) {
            await deleteFilterPreset(id);
            getFilterPresets().then(res => setPresets(res.data || []));
        }
    }

    const getCurrentFiltersObj = () => {
        if (mode === 'advanced') {
            return { complexFilter: JSON.stringify(logicGroup) };
        }
        return {
            dateFrom, dateTo, minNominal, maxNominal, tipe, kategori, akunId
        };
    }

    return (
        <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                    <Filter className="w-5 h-5" /> Filter Transaksi
                </h3>
                <div className="flex items-center gap-2">
                    <Select onValueChange={(val) => loadPreset(presets.find(p => p.id === val))}>
                        <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Load Preset" />
                        </SelectTrigger>
                        <SelectContent>
                            {presets.length === 0 && <SelectItem value="none" disabled>Belum ada preset</SelectItem>}
                            {presets.map(p => (
                                <SelectItem key={p.id} value={p.id} className="flex justify-between items-center group">
                                    <span className="flex items-center gap-2">
                                        {p.icon || '📌'} {p.name}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Hide' : 'Expand'}
                    </Button>
                </div>
            </div>

            <ActiveFilterChips />

            {isExpanded && (
                <Card className="border-dashed">
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-base">Konfigurasi Filter</CardTitle>
                            <div className="flex gap-2">
                                <Button 
                                    variant={mode === 'standard' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setMode('standard')}
                                >
                                    Standard
                                </Button>
                                <Button 
                                    variant={mode === 'advanced' ? 'secondary' : 'ghost'} 
                                    size="sm" 
                                    onClick={() => setMode('advanced')}
                                >
                                    <Database className="w-3 h-3 mr-1" /> Logic Builder
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {mode === 'standard' ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-2">
                                    <Label>Periode</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                                        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                                    </div>
                                    <div className="flex gap-1">
                                        <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => {
                                            const now = new Date();
                                            setDateFrom(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
                                            setDateTo(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]);
                                        }}>This Month</Badge>
                                        <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => {
                                            const now = new Date();
                                            setDateTo(now.toISOString().split('T')[0]);
                                            now.setMonth(now.getMonth() - 3);
                                            setDateFrom(now.toISOString().split('T')[0]);
                                        }}>Last 3M</Badge>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Nominal (Rp)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input placeholder="Min" type="number" value={minNominal} onChange={e => setMinNominal(e.target.value)} />
                                        <span>-</span>
                                        <Input placeholder="Max" type="number" value={maxNominal} onChange={e => setMaxNominal(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Tipe & Akun</Label>
                                    <Select value={tipe} onValueChange={setTipe}>
                                        <SelectTrigger><SelectValue placeholder="Semua Tipe" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua</SelectItem>
                                            <SelectItem value="income">Pemasukan</SelectItem>
                                            <SelectItem value="expense">Pengeluaran</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select onValueChange={(val) => !akunId.includes(val) && setAkunId([...akunId, val])}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Akun (+)" /></SelectTrigger>
                                        <SelectContent>
                                            {akuns.map(a => <SelectItem key={a.id} value={a.id}>{a.nama}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-wrap gap-1">
                                        {akunId.map(id => {
                                            const a = akuns.find(x => x.id === id);
                                            return (
                                                <Badge key={id} variant="secondary" className="px-1 text-[10px]">
                                                    {a?.nama} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setAkunId(akunId.filter(x => x !== id))} />
                                                </Badge>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Kategori</Label>
                                    <Select onValueChange={(val) => !kategori.includes(val) && setKategori([...kategori, val])}>
                                        <SelectTrigger><SelectValue placeholder="Pilih Kategori (+)" /></SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                                        {kategori.map(cat => (
                                            <Badge key={cat} variant="secondary" className="px-1 text-[10px]">
                                                {cat} <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setKategori(kategori.filter(x => x !== cat))} />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <FilterLogicBuilder value={logicGroup} onChange={setLogicGroup} />
                        )}

                        <div className="flex justify-between pt-4 border-t">
                            <SavePresetDialog 
                                currentFilters={getCurrentFiltersObj()} 
                                onSave={() => getFilterPresets().then(res => setPresets(res.data || []))}
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={() => {
                                    setKategori([]); setAkunId([]); setDateFrom(""); setDateTo(""); setMinNominal(""); setMaxNominal(""); setTipe(""); setLogicGroup({ combinator: 'AND', rules: [] });
                                }}>Reset</Button>
                                <Button onClick={applyFilters}>Terapkan Filter</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}