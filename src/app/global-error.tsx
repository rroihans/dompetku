"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error untuk debugging
        console.error("[DOMPETKU ERROR]", error)
    }, [error])

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                    <Card className="max-w-md w-full">
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20">
                                    <AlertTriangle className="w-12 h-12 text-red-500" />
                                </div>
                                <h1 className="text-2xl font-bold">Terjadi Kesalahan</h1>
                                <p className="text-muted-foreground">
                                    Maaf, terjadi kesalahan yang tidak terduga. Tim kami telah diberitahu tentang masalah ini.
                                </p>
                                {error.digest && (
                                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                        Error ID: {error.digest}
                                    </p>
                                )}
                                <div className="flex gap-3 pt-4">
                                    <Button onClick={reset} variant="outline" className="gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Coba Lagi
                                    </Button>
                                    <Link href="/">
                                        <Button className="gap-2">
                                            <Home className="w-4 h-4" />
                                            Kembali ke Beranda
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </body>
        </html>
    )
}
