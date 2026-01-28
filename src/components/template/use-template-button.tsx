"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"
import { useTemplate } from "@/lib/db/templates-repo"
import { useRouter } from "next/navigation"
import { formatRupiah } from "@/lib/format"

interface Template {
    id: string
    nama: string
    deskripsi: string
    nominal: number
    kategori: string
    tipeTransaksi: string
}

interface UseTemplateButtonProps {
    template: Template
    variant?: "default" | "quick"
}

export function UseTemplateButton({ template, variant = "default" }: UseTemplateButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleUse = async () => {
        setLoading(true)
        const result = await useTemplate(template.id)
        setLoading(false)

        if (result.success) {
            router.refresh()
        } else {
            alert(result.error || "Gagal menggunakan template")
        }
    }

    if (variant === "quick") {
        return (
            <Button
                variant="outline"
                size="sm"
                onClick={handleUse}
                disabled={loading}
                className="h-auto py-2 px-3"
            >
                <div className="flex flex-col items-start text-left">
                    <span className="flex items-center gap-1 text-xs font-medium">
                        <Zap className="w-3 h-3 text-amber-500" />
                        {template.nama}
                    </span>
                    <span className="text-xs text-muted-foreground" data-private="true">
                        {formatRupiah(template.nominal)}
                    </span>
                </div>
            </Button>
        )
    }

    return (
        <Button
            size="sm"
            onClick={handleUse}
            disabled={loading}
        >
            <Zap className="w-4 h-4 mr-1" />
            {loading ? "..." : "Gunakan"}
        </Button>
    )
}
