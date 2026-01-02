"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2, CheckCircle, Zap, Calendar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { bayarCicilan, pelunasanDipercepat, updateCicilan, deleteCicilan } from "@/app/actions/cicilan"
import { formatRupiah } from "@/lib/format"

interface CicilanActionsProps {
    cicilan: {
        id: string
        namaProduk: string
        totalPokok: number
        tenor: number
        cicilanKe: number
        nominalPerBulan: number
        tanggalJatuhTempo: number
        biayaAdmin: number
        bungaPersen: number
        status: string
    }
}

export function CicilanActions({ cicilan }: CicilanActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Dialog states
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [bayarOpen, setBayarOpen] = useState(false)
    const [lunasOpen, setLunasOpen] = useState(false)

    // Edit form state
    const [namaProduk, setNamaProduk] = useState(cicilan.namaProduk)
    const [tanggalJatuhTempo, setTanggalJatuhTempo] = useState(cicilan.tanggalJatuhTempo)

    const sisaTenor = cicilan.tenor - cicilan.cicilanKe + 1
    const sisaNominal = sisaTenor * cicilan.nominalPerBulan
    const isAktif = cicilan.status === "AKTIF"

    async function handleBayar() {
        setLoading(true)
        setError("")
        try {
            const res = await bayarCicilan(cicilan.id)
            if (res.success) {
                setBayarOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal membayar cicilan")
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    async function handlePelunasan() {
        setLoading(true)
        setError("")
        try {
            const res = await pelunasanDipercepat(cicilan.id)
            if (res.success) {
                setLunasOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal pelunasan dipercepat")
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")
        try {
            const res = await updateCicilan(cicilan.id, {
                namaProduk,
                tanggalJatuhTempo,
            })
            if (res.success) {
                setEditOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal memperbarui cicilan")
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        setLoading(true)
        setError("")
        try {
            const res = await deleteCicilan(cicilan.id)
            if (res.success) {
                setDeleteOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal menghapus cicilan")
            }
        } catch (err) {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    {isAktif && (
                        <>
                            <DropdownMenuItem onClick={() => setBayarOpen(true)} className="text-emerald-600">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Bayar Cicilan
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLunasOpen(true)} className="text-blue-600">
                                <Zap className="mr-2 h-4 w-4" />
                                Pelunasan Dipercepat
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                        </>
                    )}
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Dialog Bayar Cicilan */}
            <AlertDialog open={bayarOpen} onOpenChange={setBayarOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            Bayar Cicilan
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Anda akan mencatat pembayaran cicilan:</p>
                                <div className="bg-muted rounded-lg p-4 space-y-2">
                                    <p className="font-semibold">{cicilan.namaProduk}</p>
                                    <p className="text-sm">
                                        Pembayaran ke-{cicilan.cicilanKe} dari {cicilan.tenor}
                                    </p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatRupiah(cicilan.nominalPerBulan)}
                                    </p>
                                </div>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBayar}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {loading ? "Memproses..." : "Konfirmasi Bayar"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Pelunasan Dipercepat */}
            <AlertDialog open={lunasOpen} onOpenChange={setLunasOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-blue-500" />
                            Pelunasan Dipercepat
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>Anda akan melunasi sisa cicilan sekaligus:</p>
                                <div className="bg-muted rounded-lg p-4 space-y-2">
                                    <p className="font-semibold">{cicilan.namaProduk}</p>
                                    <p className="text-sm">
                                        Sisa {sisaTenor} bulan × {formatRupiah(cicilan.nominalPerBulan)}
                                    </p>
                                    <p className="text-xl font-bold text-primary">
                                        Total: {formatRupiah(sisaNominal)}
                                    </p>
                                </div>
                                <p className="text-sm text-amber-600 dark:text-amber-400">
                                    ⚠️ Tindakan ini tidak dapat dibatalkan.
                                </p>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePelunasan}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {loading ? "Memproses..." : "Konfirmasi Pelunasan"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Dialog Edit */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Cicilan</DialogTitle>
                        <DialogDescription>
                            Ubah informasi cicilan. Nominal dan tenor tidak dapat diubah.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="editNama">Nama Produk</Label>
                            <Input
                                id="editNama"
                                value={namaProduk}
                                onChange={(e) => setNamaProduk(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tanggal Jatuh Tempo</Label>
                            <Select
                                value={String(tanggalJatuhTempo)}
                                onValueChange={(v) => setTanggalJatuhTempo(Number(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                                        <SelectItem key={d} value={String(d)}>Tanggal {d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                                {error}
                            </p>
                        )}
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="w-full">
                                {loading ? "Menyimpan..." : "Simpan"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Dialog Hapus */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Cicilan?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    Anda yakin ingin menghapus rencana cicilan &quot;{cicilan.namaProduk}&quot;?
                                </p>
                                <p className="text-amber-600 dark:text-amber-400">
                                    Cicilan hanya bisa dihapus jika belum ada pembayaran yang tercatat.
                                </p>
                                {error && <p className="text-sm text-red-500">{error}</p>}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={loading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? "Menghapus..." : "Hapus"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
