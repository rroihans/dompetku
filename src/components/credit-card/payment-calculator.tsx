"use client"

import { useState, useEffect } from "react"
import { Calculator, Clock, AlertTriangle, Sparkles, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { calculateCreditCardPayment, type PaymentCalculation } from "@/lib/db/credit-card-repo"
import { formatRupiahDecimal, usesCimbFormat } from "@/lib/decimal-utils"
import { PaymentDialog } from "./payment-dialog"

interface PaymentCalculatorProps {
    akunId: string
    akunNama: string
    onPaymentSelect?: (amount: number) => void // Legacy prop, kept for compatibility
}

export function PaymentCalculator({ akunId, akunNama }: PaymentCalculatorProps) {
    const [loading, setLoading] = useState(true)
    const [calculation, setCalculation] = useState<PaymentCalculation | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [paymentConfig, setPaymentConfig] = useState<{ amount: number, type: "FULL" | "MINIMUM" | "CUSTOM" }>({ amount: 0, type: "CUSTOM" })

    const useCimb = usesCimbFormat(akunNama)

    useEffect(() => {
        async function loadCalculation() {
            setLoading(true)
            const result = await calculateCreditCardPayment(akunId)
            setCalculation(result)
            setLoading(false)
        }
        loadCalculation()
    }, [akunId])

    const handlePaymentClick = (amount: number, type: "FULL" | "MINIMUM" | "CUSTOM") => {
        setPaymentConfig({ amount, type })
        setDialogOpen(true)
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!calculation) {
        return null
    }

    if (!calculation.isValid) {
        return (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle className="h-5 w-5" />
                        Pengaturan Belum Lengkap
                    </CardTitle>
                    <CardDescription className="text-amber-600 dark:text-amber-300">
                        {calculation.validationError}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Silakan lengkapi pengaturan kartu kredit (Jenis Kartu, Tanggal Billing, Tanggal Jatuh Tempo, Min Payment) untuk menggunakan kalkulator tagihan.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const { breakdown, fullPayment, minimumPayment, lateFee, daysUntilDue, isPastDue } = calculation

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Calculator className="h-5 w-5" />
                                Kalkulator Tagihan
                            </CardTitle>
                            <CardDescription>
                                Periode: {calculation.billingPeriod.start.toLocaleDateString('id-ID')} - {calculation.billingPeriod.end.toLocaleDateString('id-ID')}
                            </CardDescription>
                        </div>
                        <DueDateBadge daysUntilDue={daysUntilDue} isPastDue={isPastDue} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Breakdown */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Belanja Retail</span>
                            <span data-private="true">{formatRupiahDecimal(breakdown.purchases, useCimb)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cicilan Berjalan</span>
                            <span data-private="true">{formatRupiahDecimal(breakdown.installments, useCimb)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Biaya/Denda</span>
                            <span data-private="true">{formatRupiahDecimal(breakdown.fees, useCimb)}</span>
                        </div>
                        {breakdown.previousBalance > 0 && (
                            <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                <span>Saldo Bulan Lalu</span>
                                <span data-private="true">{formatRupiahDecimal(breakdown.previousBalance, useCimb)}</span>
                            </div>
                        )}
                        {lateFee > 0 && (
                            <div className="flex justify-between text-red-600 dark:text-red-400">
                                <span>Denda Keterlambatan</span>
                                <span data-private="true">{formatRupiahDecimal(lateFee, useCimb)}</span>
                            </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold">
                            <span>Total Tagihan</span>
                            <span data-private="true">{formatRupiahDecimal(fullPayment + lateFee, useCimb)}</span>
                        </div>
                    </div>

                    {/* Payment Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            className="h-auto py-4 flex-col gap-1"
                            onClick={() => handlePaymentClick(minimumPayment, "MINIMUM")}
                        >
                            <span className="text-xs text-muted-foreground">Minimum Payment</span>
                            <span className="font-bold" data-private="true">
                                {formatRupiahDecimal(minimumPayment, useCimb)}
                            </span>
                        </Button>
                        <Button
                            className="h-auto py-4 flex-col gap-1 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handlePaymentClick(fullPayment + lateFee, "FULL")}
                        >
                            <span className="text-xs flex items-center gap-1 text-emerald-100">
                                <Sparkles className="h-3 w-3" />
                                Full Payment
                            </span>
                            <span className="font-bold" data-private="true">
                                {formatRupiahDecimal(fullPayment + lateFee, useCimb)}
                            </span>
                        </Button>

                        {/* Custom Amount Button (Full Width) */}
                        <Button
                            variant="secondary"
                            className="col-span-2 gap-2"
                            onClick={() => handlePaymentClick(0, "CUSTOM")}
                        >
                            <MoreHorizontal className="h-4 w-4" />
                            Bayar Nominal Lain
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <PaymentDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                akunId={akunId}
                akunNama={akunNama}
                defaultAmount={paymentConfig.amount}
                defaultType={paymentConfig.type}
                minAmount={minimumPayment}
            />
        </>
    )
}

function DueDateBadge({ daysUntilDue, isPastDue }: { daysUntilDue: number; isPastDue: boolean }) {
    if (isPastDue) {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Terlambat {Math.abs(daysUntilDue)} hari
            </Badge>
        )
    }

    if (daysUntilDue <= 7) {
        return (
            <Badge variant="default" className="bg-amber-500 hover:bg-amber-600 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {daysUntilDue} hari lagi
            </Badge>
        )
    }

    return (
        <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {daysUntilDue} hari lagi
        </Badge>
    )
}