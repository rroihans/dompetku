"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Trash2 } from "lucide-react"

interface ConfirmDeleteDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title?: string
    description?: string
    itemName?: string
    loading?: boolean
    destructive?: boolean
}

export function ConfirmDeleteDialog({
    open,
    onOpenChange,
    onConfirm,
    title = "Konfirmasi Hapus",
    description,
    itemName,
    loading = false,
    destructive = true,
}: ConfirmDeleteDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {destructive ? (
                            <Trash2 className="w-5 h-5 text-destructive" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                        )}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>
                            {description || (
                                <>
                                    Apakah Anda yakin ingin menghapus
                                    {itemName && <strong className="mx-1">{itemName}</strong>}?
                                    <span className="block mt-2 text-destructive font-medium">
                                        Tindakan ini tidak dapat dibatalkan.
                                    </span>
                                </>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={loading}
                        className={destructive ? "bg-destructive hover:bg-destructive/90" : ""}
                    >
                        {loading ? "Menghapus..." : "Hapus"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

interface ConfirmActionDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => void
    title: string
    description: React.ReactNode
    confirmText?: string
    cancelText?: string
    loading?: boolean
    variant?: "default" | "destructive" | "warning"
}

export function ConfirmActionDialog({
    open,
    onOpenChange,
    onConfirm,
    title,
    description,
    confirmText = "Konfirmasi",
    cancelText = "Batal",
    loading = false,
    variant = "default",
}: ConfirmActionDialogProps) {
    const variantStyles = {
        default: "",
        destructive: "bg-destructive hover:bg-destructive/90",
        warning: "bg-amber-500 hover:bg-amber-600",
    }

    const icons = {
        default: null,
        destructive: <Trash2 className="w-5 h-5 text-destructive" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {icons[variant]}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>{description}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={loading}>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault()
                            onConfirm()
                        }}
                        disabled={loading}
                        className={variantStyles[variant]}
                    >
                        {loading ? "Memproses..." : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
