"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import * as LucideIcons from "lucide-react"
import { createKategori, getKategoriById, updateKategori, type KategoriRecord } from "@/lib/db/kategori-repo"
import { toast } from "sonner"

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

interface CreateKategoriDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: () => void
    parentId?: string | null
    initialData?: KategoriRecord | null
}

export function CreateKategoriDialog({ open, onOpenChange, onCreated, parentId, initialData }: CreateKategoriDialogProps) {
    const isEdit = !!initialData
    const [nama, setNama] = useState("")
    const [icon, setIcon] = useState("Tag")
    const [warna, setWarna] = useState("#3b82f6")
    const [nature, setNature] = useState("NEED")
    const [show, setShow] = useState(true)
    const [loading, setLoading] = useState(false)

    // Reset or Load Data
    useEffect(() => {
        if (open) {
            if (initialData) {
                setNama(initialData.nama)
                setIcon(initialData.icon)
                setWarna(initialData.warna)
                setNature(initialData.nature)
                setShow(initialData.show ?? true)
            } else {
                setNama("")
                setIcon("Tag")
                setWarna("#3b82f6")
                setShow(true)

                // Inherit nature from parent only if creating new
                if (parentId) {
                    getKategoriById(parentId).then(parent => {
                        if (parent) {
                            setNature(parent.nature)
                        }
                    })
                } else {
                    setNature("NEED")
                }
            }
        }
    }, [open, initialData, parentId])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const toastId = toast.loading(isEdit ? "Menyimpan perubahan..." : "Membuat kategori...")

        let result;

        if (isEdit && initialData) {
            result = await updateKategori(initialData.id, {
                nama,
                icon,
                warna,
                nature,
                show
            })
        } else {
            result = await createKategori({
                nama,
                icon,
                warna,
                nature,
                parentId: parentId ?? null,
                show
            })
        }

        if (result.success) {
            toast.success(isEdit ? "Perubahan berhasil disimpan" : "Kategori berhasil dibuat", { id: toastId })
            if (!isEdit) {
                setNama("")
                setIcon("Tag")
                // Keep nature/color for ease of repeated entry? or reset?
                // reset
            }
            onCreated()
        } else {
            toast.error(result.error || "Gagal menyimpan", { id: toastId })
        }

        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md h-[90vh] sm:h-auto overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit
                            ? "Edit Kategori"
                            : (parentId ? "Tambah Subkategori" : "Tambah Kategori Baru")
                        }
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit ? "Ubah detail kategori ini" : `Buat ${parentId ? "subkategori" : "kategori"} dengan ikon dan warna kustom`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nama */}
                    <div className="space-y-2">
                        <Label htmlFor="nama">Nama</Label>
                        <Input
                            id="nama"
                            value={nama}
                            onChange={(e) => setNama(e.target.value)}
                            placeholder="Contoh: Makan & Minum"
                            required
                        />
                    </div>

                    {/* Nature - Always visible now */}
                    <div className="space-y-2">
                        <Label>Category Nature</Label>
                        <Select value={nature} onValueChange={setNature}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MUST">Must (Kebutuhan Wajib)</SelectItem>
                                <SelectItem value="NEED">Need (Kebutuhan Penting)</SelectItem>
                                <SelectItem value="WANT">Want (Keinginan)</SelectItem>
                            </SelectContent>
                        </Select>
                        {parentId && !isEdit && <p className="text-[10px] text-muted-foreground">*Otomatis mengikuti parent, tapi bisa diubah</p>}
                    </div>

                    {/* Show Toggle */}
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                            <Label>Show</Label>
                            <p className="text-xs text-muted-foreground">Tampilkan kategori di daftar</p>
                        </div>
                        <Switch checked={show} onCheckedChange={setShow} />
                    </div>

                    {/* Icon */}
                    <div className="space-y-2">
                        <Label>Ikon</Label>
                        <div className="grid grid-cols-6 gap-2">
                            {POPULAR_ICONS.map((iconName) => {
                                const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Tag
                                return (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setIcon(iconName)}
                                        className={`p-3 rounded-lg border-2 transition-all ${icon === iconName
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <IconComponent className="w-5 h-5 mx-auto" />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Warna */}
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

                    {/* Preview */}
                    <div className="p-4 border rounded-lg bg-muted/20">
                        <div className="text-xs text-muted-foreground mb-2">Preview:</div>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: warna }}
                            >
                                {(() => {
                                    const IconComponent = (LucideIcons as any)[icon] || LucideIcons.Tag
                                    return <IconComponent className="w-6 h-6 text-white" />
                                })()}
                            </div>
                            <div>
                                <div className="font-medium">{nama || "(Nama kategori)"}</div>
                                <div className="text-xs text-muted-foreground capitalize">{nature.toLowerCase()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Batal
                        </Button>
                        <Button type="submit" className="flex-1" disabled={loading || !nama}>
                            {loading ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
