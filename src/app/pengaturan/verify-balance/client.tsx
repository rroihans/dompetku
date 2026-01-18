"use client"

import { useState } from "react"
import { verifyAccountBalances, fixAccountBalance, AccountBalanceError } from "@/app/actions/integrity"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/utils" // Assuming this exists or I'll implement inline

export function BalanceVerificationClient() {
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState<AccountBalanceError[]>([])
    const [result, setResult] = useState<{ checked: boolean, isValid: boolean } | null>(null)
    const [selectedError, setSelectedError] = useState<AccountBalanceError | null>(null)
    const [fixing, setFixing] = useState(false)

    async function runVerification() {
        setLoading(true)
        setErrors([])
        setResult(null)
        try {
            const res = await verifyAccountBalances()
            if (res.success && res.errors) {
                setErrors(res.errors)
                setResult({ checked: true, isValid: res.isValid })
                if (res.isValid) {
                    toast.success("Semua saldo akun valid!")
                } else {
                    toast.warning(`${res.errors.length} akun memiliki selisih saldo.`)
                }
            } else {
                toast.error("Gagal menjalankan verifikasi")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    async function handleFix() {
        if (!selectedError) return
        setFixing(true)
        try {
            const res = await fixAccountBalance(selectedError.id)
            if (res.success) {
                toast.success(`Saldo ${selectedError.nama} berhasil diperbaiki`)
                setSelectedError(null)
                // Re-run verification to update list
                runVerification()
            } else {
                toast.error(res.error || "Gagal memperbaiki saldo")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setFixing(false)
        }
    }

    // Helper formatter
    const fmt = (val: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(val)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div>
                    <h4 className="font-semibold">Jalankan Verifikasi</h4>
                    <p className="text-sm text-muted-foreground">
                        Sistem akan menghitung ulang saldo berdasarkan semua transaksi.
                    </p>
                </div>
                <Button onClick={runVerification} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Memverifikasi..." : "Cek Sekarang"}
                </Button>
            </div>

            {result && result.isValid && (
                <div className="flex items-center gap-2 p-4 text-green-700 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-medium">Semua saldo akun konsisten dengan histori transaksi.</span>
                </div>
            )}

            {errors.length > 0 && (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Akun</TableHead>
                                <TableHead>Expected</TableHead>
                                <TableHead>Actual</TableHead>
                                <TableHead>Selisih</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {errors.map((err) => (
                                <TableRow key={err.id}>
                                    <TableCell className="font-medium">
                                        {err.nama}
                                        <div className="text-xs text-muted-foreground">{err.tipe}</div>
                                    </TableCell>
                                    <TableCell>{fmt(err.expected)}</TableCell>
                                    <TableCell>{fmt(err.actual)}</TableCell>
                                    <TableCell className="text-red-600 font-bold">
                                        {fmt(err.difference)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setSelectedError(err)}
                                        >
                                            Review
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={!!selectedError} onOpenChange={(open) => !open && setSelectedError(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Mismatch Details: {selectedError?.nama}</DialogTitle>
                        <DialogDescription>
                            Ditemukan perbedaan antara saldo tercatat dan hasil kalkulasi transaksi.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {selectedError && (
                        <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Expected Balance</span>
                                    <div className="font-mono font-medium text-green-600 bg-green-50 p-2 rounded">
                                        {fmt(selectedError.expected)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Based on transactions</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-muted-foreground">Actual Balance</span>
                                    <div className="font-mono font-medium text-red-600 bg-red-50 p-2 rounded">
                                        {fmt(selectedError.actual)}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Database record</p>
                                </div>
                            </div>

                            <div className="p-3 bg-muted rounded-md text-sm">
                                <span className="font-semibold block mb-1">Difference: {fmt(selectedError.difference)}</span>
                                <p className="text-muted-foreground">
                                    {selectedError.difference > 0 
                                        ? "Saldo tercatat lebih RENDAH dari seharusnya." 
                                        : "Saldo tercatat lebih TINGGI dari seharusnya."}
                                </p>
                            </div>

                            <div className="text-sm text-muted-foreground">
                                <p>Possible Causes:</p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                    <li>Missing debit/credit transaction record.</li>
                                    <li>Race condition during concurrent updates.</li>
                                    <li>Manual database modification.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedError(null)}>
                            Dismiss
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={handleFix} 
                            disabled={fixing}
                        >
                            {fixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Auto-Fix Balance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
