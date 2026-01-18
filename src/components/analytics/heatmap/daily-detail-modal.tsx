"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { getDailyTransactions } from "@/app/actions/analytics-heatmap"
import { formatRupiah } from "@/lib/format"
import { Loader2 } from "lucide-react"

interface Props {
    date: string | null
    onClose: () => void
}

export function DailyDetailModal({ date, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => {
        if (date) {
            setLoading(true);
            getDailyTransactions(date).then(res => {
                if (res.success && res.data) setTransactions(res.data);
                setLoading(false);
            });
        }
    }, [date]);

    if (!date) return null;

    const total = transactions.reduce((sum, t) => sum + t.nominal, 0);

    return (
        <Dialog open={!!date} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{new Date(date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</DialogTitle>
                    <DialogDescription>
                        Total Pengeluaran: <span className="font-bold text-primary">{formatRupiah(total)}</span>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground">Tidak ada pengeluaran.</p>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-muted/50">
                                    <div>
                                        <div className="font-medium">{tx.deskripsi}</div>
                                        <div className="text-xs text-muted-foreground">{tx.kategori} • {tx.debitAkun.nama}</div>
                                    </div>
                                    <div className="font-bold text-red-500">
                                        -{formatRupiah(tx.nominal)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}