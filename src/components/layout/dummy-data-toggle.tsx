"use client"

import { useState, useEffect } from "react"
import { Database, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { 
    toggleDummyData, 
    isDummyDataActive 
} from "@/lib/db/dummy-data-repo"
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

export function DummyDataToggle() {
    const [isLoading, setIsLoading] = useState(false)
    const [isActive, setIsActive] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        checkStatus()
    }, [])

    const checkStatus = async () => {
        try {
            const status = await isDummyDataActive()
            setIsActive(status)
        } catch (error) {
            console.error("Failed to check dummy status", error)
        }
    }

    const handleToggle = async () => {
        setIsLoading(true)
        setOpen(false) // Close dialog
        
        try {
            const toastId = toast.loading(
                isActive 
                    ? "Menghapus data dummy..." 
                    : "Men-generate data dummy... (Mohon tunggu ±10 detik)"
            )

            const newStatus = await toggleDummyData()
            setIsActive(newStatus)
            
            toast.dismiss(toastId)
            toast.success(
                newStatus 
                    ? "Mode Demo Aktif! Data dummy berhasil ditambahkan." 
                    : "Mode Demo Nonaktif! Data dummy berhasil dihapus.",
                {
                    duration: 3000,
                    icon: newStatus ? <CheckCircle2 className="text-green-500" /> : <CheckCircle2 className="text-blue-500" />
                }
            )

            // Reload to refresh all data views
            setTimeout(() => {
                window.location.reload()
            }, 1500)

        } catch (error) {
            console.error("Toggle error", error)
            toast.error("Gagal mengubah mode dummy data", {
                description: "Silakan coba lagi atau cek console logs."
            })
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "w-full justify-start gap-3 px-3 relative transition-all",
                        isActive 
                            ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:text-yellow-500 dark:hover:bg-yellow-950/30" 
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    {isActive && (
                        <div className="absolute left-0 w-1 h-6 bg-yellow-500 rounded-r-full" />
                    )}
                    
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Database className="w-4 h-4" />
                    )}
                    
                    <span className="flex-1 text-left">
                        {isLoading ? "Memproses..." : (isActive ? "Mode Demo (ON)" : "Mode Demo")}
                    </span>
                </Button>
            </AlertDialogTrigger>
            
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {isActive ? (
                            <>
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Nonaktifkan Mode Demo?
                            </>
                        ) : (
                            <>
                                <Database className="w-5 h-5 text-blue-500" />
                                Aktifkan Mode Demo?
                            </>
                        )}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isActive 
                            ? "Tindakan ini akan MENGHAPUS SEMUA data dummy yang telah digenerate. Data asli Anda tidak akan terpengaruh."
                            : "Sistem akan men-generate ribuan data dummy (Transaksi, Akun, Cicilan, dll) untuk keperluan testing. Data ini akan ditandai sebagai 'Dummy' dan bisa dihapus kapan saja."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={(e) => {
                            e.preventDefault()
                            handleToggle()
                        }}
                        className={isActive ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"}
                    >
                        {isActive ? "Ya, Hapus Dummy Data" : "Ya, Generate Data"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
