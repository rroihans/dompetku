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
import { deleteTemplate } from "@/app/actions/template"
import { useRouter } from "next/navigation"

interface DeleteTemplateButtonProps {
    id: string
    nama: string
}

export function DeleteTemplateButton({ id, nama }: DeleteTemplateButtonProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        setLoading(true)
        const result = await deleteTemplate(id)
        setLoading(false)

        if (result.success) {
            router.refresh()
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
                    <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Template &quot;{nama}&quot; akan dihapus permanen. Transaksi yang sudah dibuat dari template ini tidak akan terpengaruh.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {loading ? "Menghapus..." : "Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
