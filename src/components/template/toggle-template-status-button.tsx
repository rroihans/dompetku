"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, XCircle } from "lucide-react"
import { toggleAccountTemplateStatus } from "@/app/actions/template"
import { useRouter } from "next/navigation"

interface ToggleTemplateStatusButtonProps {
    id: string
    isActive: boolean
}

export function ToggleTemplateStatusButton({ id, isActive }: ToggleTemplateStatusButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleToggle = async () => {
        setLoading(true)
        await toggleAccountTemplateStatus(id)
        setLoading(false)
        router.refresh()
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
