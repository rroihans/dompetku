"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const router = useRouter()

    useEffect(() => {
        // Log error untuk debugging
        console.error("[DOMPETKU ERROR]", error)
    }, [error])

    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-lg w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                            <AlertTriangle className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold">Terjadi Kesalahan</h2>
                        <p className="text-muted-foreground text-sm">
                            Halaman ini mengalami error. Silakan coba lagi atau kembali ke halaman sebelumnya.
                        </p>
                        {process.env.NODE_ENV === "development" && (
                            <div className="w-full text-left">
                                <p className="text-xs font-mono text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded overflow-auto max-h-32">
                                    {error.message}
                                </p>
                            </div>
                        )}
                        {error.digest && (
                            <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                ID: {error.digest}
                            </p>
                        )}
                        <div className="flex flex-wrap justify-center gap-2 pt-4">
                            <Button onClick={reset} variant="outline" size="sm" className="gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Coba Lagi
                            </Button>
                            <Button onClick={() => router.back()} variant="outline" size="sm" className="gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Kembali
                            </Button>
                            <Link href="/">
                                <Button size="sm" className="gap-2">
                                    <Home className="w-4 h-4" />
                                    Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
