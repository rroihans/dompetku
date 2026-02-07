"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, MoreHorizontal, RefreshCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateTransaksi, deleteTransaksi } from "@/lib/db"
import { formatRupiah } from "@/lib/format"
import { ConvertToInstallmentDialog } from "./convert-to-installment-dialog"

interface Transaksi {
    id: string
    deskripsi: string
    nominal: number
    kategori: string
    catatan: string | null
    tanggal: Date
    convertedToInstallment?: boolean
    kreditAkun?: {
        id: string
        nama: string
        tipe: string
        isSyariah?: boolean
    } | null
}

interface TransaksiActionsProps {
    transaksi: Transaksi
}

export function TransaksiActions({ transaksi }: TransaksiActionsProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [convertOpen, setConvertOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Edit form state
    const [deskripsi, setDeskripsi] = useState(transaksi.deskripsi)
    const [catatan, setCatatan] = useState(transaksi.catatan || "")
    const [nominal, setNominal] = useState(transaksi.nominal)

    // Check if can convert to installment
    const isCreditCardTx = transaksi.kreditAkun?.tipe === "CREDIT_CARD"
    const canConvert = isCreditCardTx && !transaksi.convertedToInstallment

    async function handleEdit() {
        setLoading(true)
        setError("")
        try {
            const res = await updateTransaksi(transaksi.id, {
                deskripsi,
                catatan: catatan || undefined,
                nominal: nominal !== transaksi.nominal ? nominal : undefined,
            })

            if (res.success) {
                setEditOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal memperbarui transaksi")
            }
        } catch {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    async function handleDelete() {
        setLoading(true)
        setError("")
        try {
            const res = await deleteTransaksi(transaksi.id)

            if (res.success) {
                setDeleteOpen(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal menghapus transaksi")
            }
        } catch {
            setError("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center gap-1">
            {/* Convert Button - Visible directly for CC transactions */}
            {canConvert && (
                <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Ubah transaksi menjadi cicilan kartu kredit"
                    className="h-7 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => setConvertOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setConvertOpen(true);
                        }
                    }}
                >
                    <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                    <span className="text-xs">Cicilan</span>
                </Button>
            )}

            {/* Menu Dropdown for Edit/Delete */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => setDeleteOpen(true)}
                        className="text-red-500 focus:text-red-500"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Transaksi</DialogTitle>
                        <DialogDescription>
                            Perbarui detail transaksi. Saldo akun akan otomatis disesuaikan jika nominal berubah.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nominal">Nominal (Rp)</Label>
                            <Input
                                id="nominal"
                                type="number"
                                value={nominal || ""}
                                onChange={(e) => setNominal(e.target.value === "" ? 0 : Number(e.target.value))}
                                min={1}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Kategori</Label>
                            <div className="text-sm text-muted-foreground bg-secondary/50 px-3 py-2 rounded">
                                {transaksi.kategori}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deskripsi">Deskripsi</Label>
                            <Input
                                id="deskripsi"
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="catatan">Catatan (opsional)</Label>
                            <Input
                                id="catatan"
                                value={catatan}
                                onChange={(e) => setCatatan(e.target.value)}
                                placeholder="Catatan tambahan..."
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-500">{error}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)}>
                            Batal
                        </Button>
                        <Button onClick={handleEdit} disabled={loading}>
                            {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Hapus Transaksi</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus transaksi ini?
                            <br /><br />
                            <strong>{transaksi.deskripsi}</strong>
                            <br />
                            <span className="text-lg font-bold">{formatRupiah(transaksi.nominal)}</span>
                            <br /><br />
                            <span className="text-xs text-amber-500">
                                ⚠️ Saldo akun terkait akan dikembalikan ke kondisi sebelum transaksi ini dibuat.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <p className="text-sm text-red-500">{error}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                            {loading ? "Menghapus..." : "Hapus"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Convert to Installment Dialog */}
            {canConvert && transaksi.kreditAkun && convertOpen && (
                <ConvertToInstallmentDialog
                    transaksiId={transaksi.id}
                    transaksiDeskripsi={transaksi.deskripsi}
                    transaksiNominal={transaksi.nominal}
                    akunNama={transaksi.kreditAkun.nama}
                    onSuccess={() => {
                        setConvertOpen(false)
                        router.refresh()
                    }}
                />
            )}
        </div>
    )
}
