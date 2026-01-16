"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { 
    Receipt, 
    Percent, 
    Info, 
    AlertTriangle, 
    Save, 
    RefreshCcw,
    Clock,
    History
} from "lucide-react"
import { 
    PatternBuilderUI, 
    TierEditor, 
    InterestCalculator, 
    ComparisonTable 
} from "@/components/akun/account-settings-components"
import { updateAkunSettings } from "@/app/actions/akun"
import { resetAccountToTemplate } from "@/app/actions/recurring-admin"
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface AccountData {
    id: string;
    nama: string;
    biayaAdminAktif: boolean;
    biayaAdminNominal: number | null;
    biayaAdminPola: string | null;
    biayaAdminTanggal: number | null;
    bungaAktif: boolean;
    bungaTiers: string | null;
    templateSource: string | null;
    templateId: string | null;
    templateOverrides: string | null;
}

interface TemplateData {
    id: string;
    nama: string;
    biayaAdmin: number | null;
    polaTagihan: string;
    tanggalTagihan: number | null;
    bungaTier: string | null;
}

export function AccountSettingsClient({ akun, templates }: { akun: AccountData, templates: TemplateData[] }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [biayaAdminAktif, setBiayaAdminAktif] = useState(akun.biayaAdminAktif || false)
    const [biayaAdminNominal, setBiayaAdminNominal] = useState<number | null>(akun.biayaAdminNominal)
    const [biayaAdminPola, setBiayaAdminPola] = useState<string>(akun.biayaAdminPola || "MANUAL")
    const [biayaAdminTanggal, setBiayaAdminTanggal] = useState<number | null>(akun.biayaAdminTanggal)
    
    const [bungaAktif, setBungaAktif] = useState(akun.bungaAktif || false)
    const [bungaTiers, setBungaTiers] = useState<string | null>(akun.bungaTiers)
    
    const template = templates.find(t => t.id === (akun.templateSource || akun.templateId))
    const overrides = akun.templateOverrides ? JSON.parse(akun.templateOverrides) : null

    const handleSave = async () => {
        setLoading(true)
        try {
            const result = await updateAkunSettings(akun.id, {
                biayaAdminAktif,
                biayaAdminNominal,
                biayaAdminPola,
                biayaAdminTanggal,
                bungaAktif,
                bungaTiers
            })
            if (result.success) {
                router.refresh()
                alert("Pengaturan berhasil disimpan")
            } else {
                alert(result.error || "Gagal menyimpan pengaturan")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
            alert(msg)
        } finally {
            setLoading(false)
        }
    }

    const handleReset = async () => {
        setLoading(true)
        try {
            const result = await resetAccountToTemplate(akun.id)
            if (result.success) {
                router.refresh()
                alert("Pengaturan telah direset ke default template")
            } else {
                alert(result.error || "Gagal mereset pengaturan")
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Terjadi kesalahan sistem";
            alert(msg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Biaya Admin Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Receipt className="w-4 h-4 text-primary" />
                                Automasi Biaya Admin
                            </CardTitle>
                            <CardDescription>
                                Atur nominal dan jadwal penarikan biaya admin bulanan.
                            </CardDescription>
                        </div>
                        <Switch 
                            checked={biayaAdminAktif} 
                            onCheckedChange={setBiayaAdminAktif} 
                        />
                    </div>
                </CardHeader>
                {biayaAdminAktif && (
                    <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1">
                        <div className="space-y-2">
                            <Label>Nominal Biaya Admin (Rp)</Label>
                            <Input 
                                type="number" 
                                value={biayaAdminNominal || ""} 
                                onChange={(e) => setBiayaAdminNominal(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="Contoh: 10000"
                            />
                        </div>
                        <PatternBuilderUI 
                            pola={biayaAdminPola}
                            tanggal={biayaAdminTanggal}
                            onPolaChange={setBiayaAdminPola}
                            onTanggalChange={setBiayaAdminTanggal}
                        />
                    </CardContent>
                )}
            </Card>

            {/* Bunga Tabungan Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Percent className="w-4 h-4 text-emerald-500" />
                                Bunga Tabungan
                            </CardTitle>
                            <CardDescription>
                                Konfigurasi bunga berjenjang berdasarkan saldo akhir bulan.
                            </CardDescription>
                        </div>
                        <Switch 
                            checked={bungaAktif} 
                            onCheckedChange={setBungaAktif} 
                        />
                    </div>
                </CardHeader>
                {bungaAktif && (
                    <CardContent className="space-y-6 animate-in fade-in slide-in-from-top-1">
                        <TierEditor 
                            tiers={bungaTiers ? JSON.parse(bungaTiers) : []} 
                            onChange={(newTiers) => setBungaTiers(JSON.stringify(newTiers))} 
                        />
                        <InterestCalculator tiers={bungaTiers ? JSON.parse(bungaTiers) : []} />
                    </CardContent>
                )}
            </Card>

            {/* Info Template & Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Informasi Template
                    </CardTitle>
                    <CardDescription>
                        Perbandingan antara nilai kustom Anda dengan standar template asli.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ComparisonTable 
                        template={template || null} 
                        current={{
                            biayaAdminNominal,
                            biayaAdminPola,
                            biayaAdminTanggal,
                            bungaTiers
                        }} 
                    />

                    {overrides?.history && (
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold flex items-center gap-2">
                                <History className="w-3 h-3" /> 
                                Histori Perubahan Terakhir
                            </Label>
                            <div className="space-y-2">
                                {overrides.history.map((h: { timestamp: string }, i: number) => (
                                    <div key={i} className="text-[10px] p-2 bg-muted/50 rounded flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(h.timestamp).toLocaleString('id-ID')}
                                        </div>
                                        <div className="font-medium text-primary">
                                            Pengaturan diperbarui
                                        </div>
                                    </div>
                                )).reverse()}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-xs">
                                    <RefreshCcw className="w-3 h-3 mr-2" />
                                    Reset ke Default Template
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Reset Pengaturan?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini akan menghapus semua nilai kustom Anda dan mengembalikannya ke standar template {template?.nama}. Perubahan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleReset}>Ya, Reset</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/50 bg-destructive/5">
                <CardHeader>
                    <CardTitle className="text-base text-destructive flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Danger Zone
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg bg-background">
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-destructive">Nonaktifkan Semua Automasi</p>
                            <p className="text-xs text-muted-foreground">Matikan biaya admin dan bunga secara permanen.</p>
                        </div>
                        <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => {
                                setBiayaAdminAktif(false)
                                setBungaAktif(false)
                            }}
                        >
                            Matikan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Floating Save Button */}
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[500px] px-4">
                <Button 
                    className="w-full shadow-lg h-12 text-base font-bold gap-2" 
                    onClick={handleSave}
                    disabled={loading}
                >
                    <Save className="w-5 h-5" />
                    {loading ? "Menyimpan..." : "Simpan Pengaturan"}
                </Button>
            </div>
        </div>
    )
}
