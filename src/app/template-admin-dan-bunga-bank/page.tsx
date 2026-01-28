"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    LayoutGrid,
    Building2,
    Calendar,
    Receipt,
    Percent,
    ArrowLeft,
} from "lucide-react"
import Link from "next/link"
import { getAccountTemplates, type AccountTemplateDTO } from "@/lib/db/templates-repo"
import { formatRupiah } from "@/lib/format"
import { AddAccountTemplateForm } from "@/components/forms/add-account-template-form"
import { ToggleTemplateStatusButton } from "@/components/template/toggle-template-status-button"
import { DeleteAccountTemplateButton } from "@/components/template/delete-account-template-button"
import { useEffect, useState } from "react"

// Helper to format Interest Tiers
function formatInterestTiers(jsonStr: string | null) {
    if (!jsonStr) return 'Tidak ada';
    try {
        const tiers = JSON.parse(jsonStr);
        if (!Array.isArray(tiers) || tiers.length === 0) return 'Tidak ada';
        const rates = tiers.map((t: any) => t.bunga_pa);
        const min = Math.min(...rates);
        const max = Math.max(...rates);

        if (min === max) {
            return min === 0 ? 'Nol (0%)' : `${min}% p.a.`;
        }
        return `${min}% - ${max}% p.a.`;
    } catch (e) {
        return 'Format Salah';
    }
}

// Helper to get Min Saldo from tiers
function formatMinSaldo(jsonStr: string | null) {
    if (!jsonStr) return null;
    try {
        const tiers = JSON.parse(jsonStr);
        if (!Array.isArray(tiers) || tiers.length === 0) return null;
        // Assuming sorted or we need to find min
        const minSaldos = tiers.map((t: any) => t.min_saldo);
        const min = Math.min(...minSaldos);
        return formatRupiah(min);
    } catch {
        return null;
    }
}

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function AccountTemplatePage() {
    const [templates, setTemplates] = useState<AccountTemplateDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplateDTO | null>(null)

    const loadData = () => {
        getAccountTemplates().then(res => {
            if (res.success && res.data) {
                setTemplates(res.data)
            }
            setLoading(false)
        })
    }

    useEffect(() => {
        loadData()
    }, [])

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Memuat template...</div>
    }

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
                            Template Admin & Bunga Bank
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Konfigurasi biaya admin dan bunga otomatis untuk akun bank
                        </p>
                    </div>
                </div>
                <AddAccountTemplateForm onSuccess={loadData} />
            </div>

            {/* Template List */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card
                            key={template.id}
                            className={`hover:shadow-md transition-all cursor-pointer ${!template.isActive ? 'opacity-60 grayscale' : ''}`}
                            onClick={() => setSelectedTemplate(template)}
                        >
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

                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <ToggleTemplateStatusButton id={template.id} nama={template.nama} isActive={template.isActive} onSuccess={loadData} />
                                        <DeleteAccountTemplateButton id={template.id} nama={template.nama} onSuccess={loadData} />
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
                                        <div className="text-right">
                                            <span className="font-medium text-emerald-600 dark:text-emerald-400 block">
                                                {formatInterestTiers(template.bungaTier)}
                                            </span>
                                            {template.bungaTier && formatMinSaldo(template.bungaTier) && (
                                                <span className="text-[10px] text-muted-foreground block">
                                                    Min. {formatMinSaldo(template.bungaTier)}
                                                </span>
                                            )}
                                        </div>
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

            {/* Detail Dialog */}
            <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            {selectedTemplate?.nama}
                        </DialogTitle>
                        <DialogDescription>
                            Detail konfigurasi template bank
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4 pt-2">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Tipe Akun</p>
                                    <p className="font-medium">{selectedTemplate.tipeAkun}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Biaya Admin</p>
                                    <p className="font-medium">{selectedTemplate.biayaAdmin ? formatRupiah(selectedTemplate.biayaAdmin) : 'Gratis'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Pola Tagihan</p>
                                    <p className="font-medium">
                                        {selectedTemplate.polaTagihan === 'TANGGAL_TETAP' ? 'Tanggal Tetap' :
                                            selectedTemplate.polaTagihan === 'JUMAT_MINGGU_KETIGA' ? 'Jumat ke-3' : 'Hari Kerja Terakhir'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Tanggal Tagihan</p>
                                    <p className="font-medium">
                                        {selectedTemplate.polaTagihan === 'TANGGAL_TETAP' ? `Tanggal ${selectedTemplate.tanggalTagihan}` : '-'}
                                    </p>
                                </div>
                            </div>

                            <div className="border rounded-lg overflow-hidden">
                                <div className="bg-muted px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    Tier Bunga Tabungan
                                </div>
                                {selectedTemplate.bungaTier ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="h-8 text-xs">Min Saldo</TableHead>
                                                <TableHead className="h-8 text-xs text-right">Bunga (p.a.)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(() => {
                                                try {
                                                    const tiers = JSON.parse(selectedTemplate.bungaTier);
                                                    return tiers.map((tier: any, i: number) => (
                                                        <TableRow key={i} className="hover:bg-muted/50">
                                                            <TableCell className="py-2 text-xs font-medium">
                                                                {formatRupiah(tier.min_saldo)}
                                                            </TableCell>
                                                            <TableCell className="py-2 text-xs text-right text-emerald-600">
                                                                {tier.bunga_pa}%
                                                            </TableCell>
                                                        </TableRow>
                                                    ));
                                                } catch {
                                                    return <TableRow><TableCell colSpan={2} className="text-center text-xs">Error parsing data</TableCell></TableRow>
                                                }
                                            })()}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="p-4 text-xs text-muted-foreground text-center">Tidak ada konfigurasi bunga.</p>
                                )}
                            </div>

                            {selectedTemplate.deskripsi && (
                                <div className="bg-muted/30 p-3 rounded-lg text-sm text-muted-foreground">
                                    {selectedTemplate.deskripsi}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
