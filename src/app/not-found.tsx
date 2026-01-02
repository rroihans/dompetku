import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileQuestion, Home, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] p-4">
            <Card className="max-w-md w-full">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted">
                            <FileQuestion className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold">Halaman Tidak Ditemukan</h2>
                        <p className="text-muted-foreground text-sm">
                            Halaman yang Anda cari tidak ada atau telah dipindahkan.
                        </p>
                        <div className="text-8xl font-bold text-muted-foreground/30">
                            404
                        </div>
                        <div className="flex gap-2 pt-4">
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
    )
}
