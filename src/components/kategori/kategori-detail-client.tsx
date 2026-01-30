"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { ChevronLeft, Pencil, Save, Plus, Trash2, MoreVertical } from "lucide-react"
import * as LucideIcons from "lucide-react"
import {
    getKategoriById,
    getSubKategori,
    updateKategori,
    deleteKategori,
    type KategoriRecord,
} from "@/lib/db/kategori-repo"
import { CreateKategoriDialog } from "@/components/kategori/create-kategori-dialog"
import { toast } from "sonner"
import Link from "next/link"

const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308",
    "#84cc16", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
]

const POPULAR_ICONS = [
    "Utensils", "ShoppingCart", "Car", "Home", "Heart", "Sparkles",
    "Banknote", "Gift", "Plane", "Tv", "ShoppingBag", "GraduationCap",
    "Smartphone", "FileText", "Palette", "TrendingUp", "Tag", "MoreHorizontal"
]

function KategoriDetailContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get("id")

    const [kategori, setKategori] = useState<KategoriRecord | null>(null)
    const [subKategori, setSubKategori] = useState<KategoriRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [showCreateSub, setShowCreateSub] = useState(false)
    const [editingSubData, setEditingSubData] = useState<KategoriRecord | null>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

    // Form states
    const [nama, setNama] = useState("")
    const [icon, setIcon] = useState("Tag")
    const [warna, setWarna] = useState("#3b82f6")
    const [nature, setNature] = useState("NEED")
    const [show, setShow] = useState(true)

    useEffect(() => {
        if (id) {
            loadData(id)
        }
    }, [id])

    async function loadData(targetId: string) {
        setLoading(true)
        const data = await getKategoriById(targetId)
        if (!data) {
            toast.error("Kategori tidak ditemukan")
            router.push("/kategori")
            return
        }

        setKategori(data)
        setNama(data.nama)
        setIcon(data.icon)
        setWarna(data.warna)
        setNature(data.nature)
        setShow(data.show)

        // Load subcategories
        const subs = await getSubKategori(targetId)
        setSubKategori(subs)

        setLoading(false)
    }

    async function handleSave() {
        if (!id) return;
        const toastId = toast.loading("Menyimpan perubahan...")

        const result = await updateKategori(id, {
            nama,
            icon,
            warna,
            nature,
            show,
        })
        // ...(removed redundant reloading) logic same as before... could just reload

        if (result.success) {
            toast.success("Perubahan berhasil disimpan", { id: toastId })
            setIsEditing(false)
            if (id) loadData(id)
        } else {
            toast.error(result.error || "Gagal menyimpan", { id: toastId })
        }
    }

    async function handleDelete(targetId: string) {
        const toastId = toast.loading("Menghapus kategori...")

        const result = await deleteKategori(targetId)
        if (result.success) {
            toast.success("Kategori berhasil dihapus", { id: toastId })
            if (targetId === id) {
                router.push("/kategori")
            } else {
                if (id) loadData(id)
            }
        } else {
            toast.error(result.error || "Gagal menghapus kategori", { id: toastId })
        }

        setShowDeleteDialog(false)
        setDeleteTargetId(null)
    }

    function confirmDelete(confirmId: string) {
        setDeleteTargetId(confirmId)
        setShowDeleteDialog(true)
    }

    function handleEditSub(sub: KategoriRecord) {
        setEditingSubData(sub)
        setShowCreateSub(true)
    }

    function handleCreateNewSub() {
        setEditingSubData(null)
        setShowCreateSub(true)
    }

    if (!id) return null

    if (loading) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Memuat data kategori...
            </div>
        )
    }

    if (!kategori) return null

    const IconComponent = (LucideIcons as any)[isEditing ? icon : kategori.icon] || LucideIcons.Tag

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/kategori">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold">
                        {isEditing ? "Edit Kategori" : kategori.nama}
                    </h2>
                </div>
                {!isEditing ? (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => confirmDelete(id)}
                            className="text-red-500 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                            Batal
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            <Save className="w-4 h-4 mr-2" />
                            Simpan
                        </Button>
                    </div>
                )}
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    {/* Icon Display */}
                    <div className="flex flex-col items-center gap-4 pb-4 border-b">
                        <div
                            className="w-24 h-24 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: isEditing ? warna : kategori.warna }}
                        >
                            <IconComponent className="w-12 h-12 text-white" />
                        </div>

                        {isEditing && (
                            <div className="w-full space-y-3">
                                <Label>Pilih Ikon</Label>
                                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                                    {POPULAR_ICONS.map((iconName) => {
                                        const Ico = (LucideIcons as any)[iconName] || LucideIcons.Tag
                                        return (
                                            <button
                                                key={iconName}
                                                type="button"
                                                onClick={() => {
                                                    setIcon(iconName)
                                                }}
                                                className={`p-2 rounded border transition-all ${icon === iconName
                                                    ? 'border-primary bg-primary/10'
                                                    : 'border-border hover:border-primary/50'
                                                    }`}
                                            >
                                                <Ico className="w-4 h-4 mx-auto" />
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label>Nama</Label>
                        {isEditing ? (
                            <Input
                                value={nama}
                                onChange={(e) => setNama(e.target.value)}
                                placeholder="Nama kategori"
                            />
                        ) : (
                            <div className="text-sm font-medium">{kategori.nama}</div>
                        )}
                    </div>

                    {/* Category Nature */}
                    <div className="space-y-2">
                        <Label>Category Nature</Label>
                        {isEditing ? (
                            <Select value={nature || "NEED"} onValueChange={setNature}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MUST">Must (Kebutuhan Wajib)</SelectItem>
                                    <SelectItem value="NEED">Need (Kebutuhan Penting)</SelectItem>
                                    <SelectItem value="WANT">Want (Keinginan)</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="text-sm font-medium capitalize">{kategori.nature.toLowerCase()}</div>
                        )}
                    </div>

                    {/* Color */}
                    {isEditing && (
                        <div className="space-y-2">
                            <Label>Warna</Label>
                            <div className="grid grid-cols-8 gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setWarna(color)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${warna === color ? 'ring-2 ring-primary ring-offset-2 scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Show Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label>Show</Label>
                            <p className="text-xs text-muted-foreground">Tampilkan kategori di daftar</p>
                        </div>
                        <Switch checked={show} onCheckedChange={setShow} disabled={!isEditing} />
                    </div>
                </CardContent>
            </Card>

            {/* Subcategories */}
            <div className="space-y-3">
                <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-1">
                    Subkategori
                </div>
                {!kategori.parentId && (
                    <Button size="sm" variant="outline" onClick={handleCreateNewSub}>
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Subkategori
                    </Button>
                )}
            </div>

            {subKategori.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        Belum ada subkategori
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {subKategori.map((sub) => {
                        const SubIcon = (LucideIcons as any)[sub.icon] || LucideIcons.Tag
                        return (
                            <Card key={sub.id} className="hover:bg-accent/40 transition-colors">
                                <CardContent className="p-3">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: sub.warna }}
                                        >
                                            <SubIcon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium truncate">{sub.nama}</div>
                                                {!sub.show && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Hidden</span>}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{sub.nature}</div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditSub(sub)}>
                                                    <Pencil className="w-4 h-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => confirmDelete(sub.id)}>
                                                    <Trash2 className="w-4 h-4 mr-2" /> Hapus
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
            {/* Create/Edit Sub Dialog */}
            <CreateKategoriDialog
                open={showCreateSub}
                onOpenChange={setShowCreateSub}
                onCreated={() => {
                    setShowCreateSub(false)
                    if (id) loadData(id)
                }}
                parentId={id}
                initialData={editingSubData}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Kategori akan dihapus permanen.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deleteTargetId && handleDelete(deleteTargetId)}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

export function KategoriDetailClient() {
    return (
        <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
            <KategoriDetailContent />
        </Suspense>
    )
}
