"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { upsertBudget, deleteBudget } from "@/lib/db/budget-repo"
import { formatRupiah } from "@/lib/format"

interface BudgetActionsProps {
    budget: {
        id: string
        kategori: string
        bulan: number
        tahun: number
        nominal: number
        realisasi: number
    }
    onRefresh?: () => void
}

export function BudgetActions({ budget, onRefresh }: BudgetActionsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Dialog states
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    // Edit form state
    const [nominal, setNominal] = useState(budget.nominal)

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await upsertBudget({
                kategori: budget.kategori,
                bulan: budget.bulan,
                tahun: budget.tahun,
                nominal,
            })

            if (res.success) {
                setEditOpen(false)
                if (onRefresh) onRefresh()
                else router.refresh()
            } else {
                setError(res.error || "Gagal memperbarui budget")
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
            const res = await deleteBudget(budget.id)
            if (res.success) {
                setDeleteOpen(false)
                if (onRefresh) onRefresh()
                else router.refresh()
            } else {
                setError(res.error || "Gagal menghapus budget")
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
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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

            {/* Dialog Edit */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Edit Anggaran</DialogTitle>
                        <DialogDescription>
                            Ubah batas anggaran untuk kategori {budget.kategori}.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Kategori</Label>
                            <p className="text-sm font-medium">{budget.kategori}</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="editNominal">Batas Anggaran (Rp)</Label>
                            <Input
                                id="editNominal"
                                type="number"
                                value={nominal || ""}
                                onChange={(e) => setNominal(e.target.value === "" ? 0 : Number(e.target.value))}
                                min={1}
                            />
                        </div>
                        <div className="bg-muted rounded-lg p-3 text-sm">
                            <p className="text-muted-foreground">Realisasi saat ini:</p>
                            <p className="font-semibold">{formatRupiah(budget.realisasi)}</p>
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
                        <AlertDialogTitle>Hapus Anggaran?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Anda yakin ingin menghapus anggaran untuk kategori &quot;{budget.kategori}&quot;?
                            Ini tidak akan menghapus transaksi yang sudah tercatat.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-2 rounded">
                            {error}
                        </p>
                    )}
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
