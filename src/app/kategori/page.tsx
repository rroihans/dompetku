"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { getAllKategori, seedDefaultKategori, type KategoriRecord } from "@/lib/db/kategori-repo"
import { CreateKategoriDialog } from "@/components/kategori/create-kategori-dialog"
import Link from "next/link"

export default function KategoriPage() {
    const router = useRouter()
    const [kategoriList, setKategoriList] = useState<KategoriRecord[]>([])
    // Store full data to calculate children counts
    const [fullData, setFullData] = useState<KategoriRecord[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)

    const loadKategori = useState(() => async () => {
        setLoading(true)
        await seedDefaultKategori()
        const data = await getAllKategori()
        setFullData(data)
        setKategoriList(data.filter(k => k.parentId === null))
        setLoading(false)
    })[0]

    useEffect(() => {
        loadKategori()
    }, [loadKategori])

    function handleCreated() {
        setShowCreate(false)
        loadKategori()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kelola Kategori</h2>
                    <p className="text-muted-foreground">
                        Atur kategori dan subkategori transaksi Anda
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Tambah Kategori
                </Button>
            </div>

            {/* Section Title */}
            <div className="text-xs uppercase tracking-wider font-semibold text-muted-foreground px-1">
                Semua Kategori
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                    Memuat kategori...
                </div>
            ) : kategoriList.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                    Belum ada kategori. Klik tombol &quot;Tambah Kategori&quot; untuk mulai.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {kategoriList.map((kategori) => {
                        const IconName = kategori.icon as keyof typeof LucideIcons
                        const IconComponent = (LucideIcons[IconName] as React.ElementType) || LucideIcons.Tag
                        const childrenCount = fullData.filter(k => k.parentId === kategori.id).length

                        return (
                            <Link key={kategori.id} href={`/kategori/edit?id=${kategori.id}`}>
                                <Card className="hover:bg-accent/40 transition-colors cursor-pointer border-l-4" style={{ borderLeftColor: kategori.warna }}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div
                                            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm"
                                            style={{ backgroundColor: kategori.warna }}
                                        >
                                            <IconComponent className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-lg leading-tight mb-1 truncate">{kategori.nama}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${kategori.nature === 'MUST' ? 'bg-red-100 text-red-700' :
                                                    kategori.nature === 'NEED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                    {kategori.nature}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{childrenCount} Subkategori</span>
                                            </div>
                                        </div>
                                        <div className="text-muted-foreground">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <CreateKategoriDialog
                open={showCreate}
                onOpenChange={setShowCreate}
                onCreated={handleCreated}
            />
        </div>
    )
}
