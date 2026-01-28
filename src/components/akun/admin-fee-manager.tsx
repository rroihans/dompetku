"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Link, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    createAdminFee,
    deleteAdminFee,
    getAdminFeesByAkun
} from "@/lib/db/admin-fee-repo"
import { formatRupiah } from "@/lib/format"
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

interface AdminFee {
    id: string
    deskripsi: string
    nominal: number
    isActive: boolean
    recurringTxId: string | null
    recurringTx: {
        id: string
        nama: string
    } | null
}

interface AdminFeeManagerProps {
    akunId: string
    akunNama: string
}

export function AdminFeeManager({ akunId, akunNama }: AdminFeeManagerProps) {
    const [showForm, setShowForm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingFees, setLoadingFees] = useState(true)
    const [adminFees, setAdminFees] = useState<AdminFee[]>([])
    const [deskripsi, setDeskripsi] = useState("")
    const [nominal, setNominal] = useState("")
    const [deleteId, setDeleteId] = useState<string | null>(null)

    // Load admin fees on mount
    useEffect(() => {
        loadAdminFees()
    }, [akunId])

    async function loadAdminFees() {
        setLoadingFees(true)
        const result = await getAdminFeesByAkun(akunId)
        if (result.success && result.data) {
            setAdminFees(result.data as AdminFee[])
        }
        setLoadingFees(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!deskripsi.trim()) {
            toast.error("Deskripsi wajib diisi")
            return
        }

        const nominalValue = parseFloat(nominal)
        if (isNaN(nominalValue) || nominalValue <= 0) {
            toast.error("Nominal harus lebih dari 0")
            return
        }

        setLoading(true)
        const result = await createAdminFee(akunId, deskripsi.trim(), nominalValue)

        if (result.success) {
            toast.success(result.message || "Admin fee berhasil dibuat")
            setDeskripsi("")
            setNominal("")
            setShowForm(false)
            loadAdminFees()
        } else {
            toast.error(result.error || "Gagal membuat admin fee")
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!deleteId) return

        const result = await deleteAdminFee(deleteId)

        if (result.success) {
            toast.success(result.message || "Admin fee berhasil dihapus")
            loadAdminFees()
        } else {
            toast.error(result.error || "Gagal menghapus admin fee")
        }
        setDeleteId(null)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">Biaya Admin</CardTitle>
                        <CardDescription>
                            Kelola biaya admin bulanan untuk {akunNama}
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        variant={showForm ? "secondary" : "default"}
                        onClick={() => setShowForm(!showForm)}
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        {showForm ? "Batal" : "Tambah Admin Fee"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Add Form */}
                {showForm && (
                    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/20 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label>Deskripsi</Label>
                            <Input
                                placeholder="Contoh: Biaya Admin Bulanan BCA"
                                value={deskripsi}
                                onChange={(e) => setDeskripsi(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Nominal (Rp)</Label>
                            <Input
                                type="number"
                                placeholder="15000"
                                value={nominal}
                                onChange={(e) => setNominal(e.target.value)}
                            />
                        </div>
                        <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                            <Link className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                💡 Admin fee ini akan otomatis membuat recurring transaction bulanan yang terhubung.
                            </p>
                        </div>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                "Simpan & Buat Recurring"
                            )}
                        </Button>
                    </form>
                )}

                {/* List of Admin Fees */}
                {loadingFees ? (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                        Memuat...
                    </div>
                ) : adminFees.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        Belum ada biaya admin terdaftar
                    </div>
                ) : (
                    <div className="space-y-2">
                        {adminFees.map((fee) => (
                            <div
                                key={fee.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{fee.deskripsi}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-muted-foreground" data-private="true">
                                            {formatRupiah(fee.nominal)}
                                        </span>
                                        {fee.recurringTxId && (
                                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" />
                                                Linked to recurring
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                    onClick={() => setDeleteId(fee.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Admin Fee?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Admin fee dan recurring transaction yang terhubung akan dihapus. Transaksi yang sudah terjadi tidak akan terpengaruh.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}
