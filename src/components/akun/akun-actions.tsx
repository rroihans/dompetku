"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Trash2, MoreVertical, ExternalLink } from "lucide-react"
import Link from "next/link"

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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { updateAkun, deleteAkun } from "@/lib/db"
import type { AccountDTO } from "@/lib/account-dto"

interface TemplateItem {
    id: string;
    nama: string;
}

interface AkunActionsProps {
    akun: AccountDTO
    templates?: TemplateItem[]
}

export function AkunActions({ akun, templates = [] }: AkunActionsProps) {
    const router = useRouter()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [showTemplateWarning, setShowTemplateWarning] = useState(false)

    // Edit form state
    const [nama, setNama] = useState(akun.nama)
    const [tipe, setTipe] = useState(akun.tipe)
    const [limitKredit, setLimitKredit] = useState(akun.limitKredit || 0)
    const [templateId, setTemplateId] = useState<string | null>(akun.templateId || null)

    const handleTemplateChange = (val: string) => {
        const newVal = val === "none" ? null : val
        if (newVal !== akun.templateId) {
            setShowTemplateWarning(true)
        } else {
            setShowTemplateWarning(false)
        }
        setTemplateId(newVal)
    }

    async function handleEdit() {
        setLoading(true)
        setError("")
        try {
            const res = await updateAkun(akun.id, {
                nama,
                tipe,
                limitKredit: tipe === "CREDIT_CARD" ? limitKredit : undefined,
                templateId,
            })

            if (res.success) {
                setEditOpen(false)
                setShowTemplateWarning(false)
                router.refresh()
            } else {
                setError(res.error || "Gagal memperbarui akun")
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
            const res = await deleteAkun(akun.id)

            if (res.success) {
                setDeleteOpen(false)
                window.dispatchEvent(new Event('account-updated')) // Trigger instant UI update
                router.refresh()
            } else {
                setError(res.error || "Gagal menghapus akun")
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
                    <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/akun/detail?id=${akun.id}`} className="flex items-center">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Lihat Detail
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </DropdownMenuItem>
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
                        <DialogTitle>Edit Akun</DialogTitle>
                        <DialogDescription>
                            Perbarui informasi akun Anda.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nama">Nama Akun</Label>
                            <Input
                                id="nama"
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tipe">Tipe Akun</Label>
                            <Select value={tipe} onValueChange={setTipe}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="BANK">Bank Transfer</SelectItem>
                                    <SelectItem value="E_WALLET">E-Wallet</SelectItem>
                                    <SelectItem value="CASH">Tunai</SelectItem>
                                    <SelectItem value="CREDIT_CARD">Kartu Kredit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="template">Template Automasi</Label>
                            <Select value={templateId || "none"} onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Tanpa Template</SelectItem>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>{t.nama}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {showTemplateWarning && (
                                <p className="text-[10px] text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
                                    ⚠️ Mengganti template akan mempengaruhi perhitungan biaya admin ke depan. Transaksi sebelumnya tidak akan terpengaruh.
                                </p>
                            )}
                        </div>
                        {tipe === "CREDIT_CARD" && (
                            <div className="grid gap-2">
                                <Label htmlFor="limitKredit">Limit Kredit (Rp)</Label>
                                <Input
                                    id="limitKredit"
                                    type="number"
                                    value={limitKredit}
                                    onChange={(e) => setLimitKredit(Number(e.target.value))}
                                />
                            </div>
                        )}
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
                <DialogContent className="sm:max-w-[400px] w-[calc(100%-2rem)] mx-4 rounded-2xl p-6">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl font-semibold">Hapus Akun</DialogTitle>
                        <DialogDescription className="text-base leading-relaxed">
                            Apakah Anda yakin ingin menghapus akun <strong className="text-foreground">{akun.nama}</strong>?
                            <br /><br />
                            <span className="text-red-500 font-medium">Tindakan ini tidak dapat dibatalkan.</span>
                        </DialogDescription>
                    </DialogHeader>
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                            <p className="text-sm text-red-500">{error}</p>
                        </div>
                    )}
                    <DialogFooter className="flex-col gap-3 sm:flex-col mt-6">
                        <Button 
                            variant="destructive" 
                            onClick={handleDelete} 
                            disabled={loading}
                            className="w-full h-12 text-base font-semibold rounded-xl"
                        >
                            {loading ? "Menghapus..." : "Ya, Hapus Akun"}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteOpen(false)}
                            className="w-full h-12 text-base rounded-xl border-2"
                        >
                            Batal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
