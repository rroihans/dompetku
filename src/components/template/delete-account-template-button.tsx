"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { deleteAccountTemplate } from "@/lib/db/templates-repo"
import { useRouter } from "next/navigation"

interface DeleteAccountTemplateButtonProps {
    id: string
    nama: string
    onSuccess?: () => void
}

export function DeleteAccountTemplateButton({ id, nama, onSuccess }: DeleteAccountTemplateButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        const result = await deleteAccountTemplate(id)
        setLoading(false)

        if (result.success) {
            router.refresh()
            if (onSuccess) onSuccess()
        } else {
            alert(result.error || "Gagal menghapus template")
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Template Akun?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Template &quot;{nama}&quot; akan dihapus. Jika ada akun yang sedang menggunakan template ini, template hanya akan dinonaktifkan agar tidak mempengaruhi riwayat akun tersebut.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {loading ? "Memproses..." : "Hapus/Nonaktifkan"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
