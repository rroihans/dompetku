"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getAkun, createTransfer } from "@/lib/db"
import { formatRupiah } from "@/lib/format"
import type { AccountDTO } from "@/lib/account-dto"

interface TransferFormProps {
    trigger?: React.ReactNode;
}

export function TransferForm({ trigger }: TransferFormProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [akunList, setAkunList] = useState<AccountDTO[]>([])
    const [error, setError] = useState("")

    // Form state
    const [dariAkunId, setDariAkunId] = useState("")
    const [keAkunId, setKeAkunId] = useState("")
    const [nominal, setNominal] = useState<number>(0)
    const [catatan, setCatatan] = useState("")
    const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0])

    // Load daftar akun saat dialog dibuka
    useEffect(() => {
        if (open) {
            getAkun().then((akuns) => {
                // Hanya tampilkan akun uang (bukan kategori internal)
                const filtered = akuns.filter((a: AccountDTO) =>
                    ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"].includes(a.tipe)
                )
                setAkunList(filtered)
            }).catch(console.error)
        }
    }, [open])

    // Hitung saldo yang dipilih
    const dariAkun = akunList.find(a => a.id === dariAkunId)
    const keAkun = akunList.find(a => a.id === keAkunId)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            if (!dariAkunId || !keAkunId) {
                setError("Pilih akun asal dan tujuan")
                setLoading(false)
                return
            }

            if (dariAkunId === keAkunId) {
                setError("Akun asal dan tujuan tidak boleh sama")
                setLoading(false)
                return
            }

            if (nominal <= 0) {
                setError("Nominal harus lebih dari 0")
                setLoading(false)
                return
            }

            const idempotencyKey = `transfer_${Date.now()}_${Math.random().toString(36).substring(7)}`

            const res = await createTransfer({
                dariAkunId,
                keAkunId,
                nominal,
                catatan: catatan || undefined,
                tanggal: tanggal ? new Date(tanggal) : undefined,
                idempotencyKey,
            })

            if (res.success) {
                setOpen(false)
                toast.success("Transfer berhasil")
                // Reset form
                setDariAkunId("")
                setKeAkunId("")
                setNominal(0)
                setCatatan("")
                setTanggal(new Date().toISOString().split('T')[0])
                router.push('/transaksi')
                router.refresh()
            } else {
                setError(res.error || "Gagal melakukan transfer")
            }
        } catch (err) {
            console.error(err)
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    // Filter akun tujuan (tidak boleh sama dengan akun asal)
    const akunTujuanList = akunList.filter(a => a.id !== dariAkunId)
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger ? trigger : (
                    <Button variant="outline" className="gap-2">
                        <ArrowRightLeft className="h-4 w-4" /> Transfer
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5" />
                        Transfer Antar Akun
                    </DialogTitle>
                    <DialogDescription>
                        Pindahkan saldo dari satu akun ke akun lainnya.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Akun Asal */}
                    <div className="grid gap-2">
                        <Label htmlFor="dariAkun">Dari Akun</Label>
                        <Select value={dariAkunId} onValueChange={setDariAkunId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih akun asal" />
                            </SelectTrigger>
                            <SelectContent>
                                {akunList.map((akun) => (
                                    <SelectItem key={akun.id} value={akun.id}>
                                        <div className="flex items-center justify-between gap-4">
                                            <span>{akun.nama}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatRupiah(akun.saldoSekarang)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {dariAkun && (
                            <p className="text-xs text-muted-foreground">
                                Saldo: <span className="font-medium">{formatRupiah(dariAkun.saldoSekarang)}</span>
                            </p>
                        )}
                    </div>

                    {/* Arrow indicator */}
                    <div className="flex justify-center">
                        <div className="p-2 rounded-full bg-primary/10">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </div>

                    {/* Akun Tujuan */}
                    <div className="grid gap-2">
                        <Label htmlFor="keAkun">Ke Akun</Label>
                        <Select value={keAkunId} onValueChange={setKeAkunId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih akun tujuan" />
                            </SelectTrigger>
                            <SelectContent>
                                {akunTujuanList.map((akun) => (
                                    <SelectItem key={akun.id} value={akun.id}>
                                        <div className="flex items-center justify-between gap-4">
                                            <span>{akun.nama}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatRupiah(akun.saldoSekarang)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {keAkun && (
                            <p className="text-xs text-muted-foreground">
                                Saldo: <span className="font-medium">{formatRupiah(keAkun.saldoSekarang)}</span>
                            </p>
                        )}
                    </div>

                    {/* Nominal */}
                    <div className="grid gap-2">
                        <Label htmlFor="nominal">Nominal (Rp)</Label>
                        <Input
                            id="nominal"
                            type="number"
                            placeholder="0"
                            value={nominal || ""}
                            onChange={(e) => setNominal(e.target.value === "" ? 0 : Number(e.target.value))}
                            min={1}
                        />
                    </div>

                    {/* Tanggal */}
                    <div className="grid gap-2">
                        <Label htmlFor="tanggal">Tanggal</Label>
                        <Input
                            id="tanggal"
                            type="date"
                            value={tanggal}
                            onChange={(e) => setTanggal(e.target.value)}
                        />
                    </div>

                    {/* Catatan */}
                    <div className="grid gap-2">
                        <Label htmlFor="catatan" className="text-muted-foreground">
                            Catatan (opsional)
                        </Label>
                        <Input
                            id="catatan"
                            placeholder="Contoh: Top up e-wallet"
                            value={catatan}
                            onChange={(e) => setCatatan(e.target.value)}
                        />
                    </div>

                    {/* Preview Transfer */}
                    {dariAkun && keAkun && nominal > 0 && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm">
                                <span className="font-medium">{dariAkun.nama}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">{keAkun.nama}</span>
                            </p>
                            <p className="text-lg font-bold text-primary mt-1">
                                {formatRupiah(nominal)}
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}

                    <DialogFooter>
                        <Button
                            type="submit"
                            disabled={loading || !dariAkunId || !keAkunId || nominal <= 0}
                            className="w-full"
                        >
                            {loading ? "Memproses..." : "Transfer Sekarang"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
