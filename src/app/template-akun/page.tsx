import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    LayoutGrid,
    Plus,
    Building2,
    Calendar,
    Receipt,
    Percent,
    ArrowLeft,
    CheckCircle2,
    XCircle
} from "lucide-react"
import Link from "next/link"
import { getAccountTemplates } from "@/app/actions/template"
import { formatRupiah } from "@/lib/format"
import { AddAccountTemplateForm } from "@/components/forms/add-account-template-form"
import { ToggleTemplateStatusButton } from "@/components/template/toggle-template-status-button"
import { DeleteAccountTemplateButton } from "@/components/template/delete-account-template-button"

export default async function AccountTemplatePage() {
    const templatesResult = await getAccountTemplates()
    const templates = templatesResult.data || []

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
                            Template Akun
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Konfigurasi biaya admin dan bunga otomatis untuk akun bank
                        </p>
                    </div>
                </div>
                <AddAccountTemplateForm />
            </div>

            {/* Template List */}
            {templates.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className={`hover:shadow-md transition-all ${!template.isActive ? 'opacity-60 grayscale' : ''}`}>
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
                                    <div className="flex items-center gap-1">
                                        <ToggleTemplateStatusButton id={template.id} isActive={template.isActive} />
                                        <DeleteAccountTemplateButton id={template.id} nama={template.nama} />
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
                                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                            {template.bungaTier ? 'Tersedia' : 'Tidak ada'}
                                        </span>
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
        </div>
    )
}
