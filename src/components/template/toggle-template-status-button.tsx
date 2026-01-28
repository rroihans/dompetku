"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { toggleAccountTemplateStatus } from "@/lib/db/templates-repo"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ToggleTemplateStatusButtonProps {
    id: string
    nama: string
    isActive: boolean
    onSuccess?: () => void
}

export function ToggleTemplateStatusButton({ id, nama, isActive, onSuccess }: ToggleTemplateStatusButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        const result = await toggleAccountTemplateStatus(id)
        setLoading(false)

        if (result.success) {
            toast.success(`Template ${nama} berhasil ${isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
            router.refresh()
            if (onSuccess) onSuccess()
        } else {
            toast.error("Gagal mengubah status template")
        }
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`}
            onClick={handleToggle}
            disabled={loading}
            title={isActive ? 'Nonaktifkan Template' : 'Aktifkan Template'}
        >
            {isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </Button>
    )
}
