"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveFilterPreset } from "@/lib/db/filter-preset-repo"
import { toast } from "sonner"
import { Save } from "lucide-react"

interface Props {
    currentFilters: any
    onSave: () => void
}

export function SavePresetDialog({ currentFilters, onSave }: Props) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [icon, setIcon] = useState("📌")
    const [loading, setLoading] = useState(false)

    const handleSave = async () => {
        if (!name) {
            toast.error("Nama preset wajib diisi");
            return;
        }
        setLoading(true);
        const res = await saveFilterPreset(name, currentFilters, icon);
        if (res.success) {
            toast.success("Preset berhasil disimpan");
            setOpen(false);
            onSave();
            setName("");
        } else {
            toast.error("Gagal menyimpan preset");
        }
        setLoading(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Preset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Simpan Preset Filter</DialogTitle>
                    <DialogDescription>
                        Simpan konfigurasi filter saat ini untuk digunakan kembali nanti.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nama
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="Contoh: Pengeluaran Besar"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="icon" className="text-right">
                            Icon
                        </Label>
                        <Input
                            id="icon"
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            className="col-span-1"
                            maxLength={2}
                        />
                        <span className="col-span-2 text-xs text-muted-foreground">Emoji (opsional)</span>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleSave} disabled={loading}>
                        {loading ? "Menyimpan..." : "Simpan"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
