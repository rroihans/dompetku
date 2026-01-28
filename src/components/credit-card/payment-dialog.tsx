"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CreditCard, Wallet } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { payCreditCardBill } from "@/lib/db/credit-card-repo"
import { getAkun } from "@/lib/db/accounts-repo"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { formatRupiahDecimal } from "@/lib/decimal-utils"
import type { AccountDTO } from "@/lib/account-dto"

const paymentSchema = z.object({
    amount: z.coerce.number().min(1, "Jumlah pembayaran tidak valid"),
    sourceId: z.string().min(1, "Pilih sumber dana"),
    type: z.enum(["FULL", "MINIMUM", "CUSTOM"])
})

type PaymentFormValues = z.infer<typeof paymentSchema>


interface PaymentDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    akunId: string
    akunNama: string
    defaultAmount: number
    defaultType: "FULL" | "MINIMUM" | "CUSTOM"
    minAmount: number // For validation
}

export function PaymentDialog({
    open,
    onOpenChange,
    akunId,
    akunNama,
    defaultAmount,
    defaultType,
    minAmount
}: PaymentDialogProps) {
    const [loading, setLoading] = useState(false)
    const [sourceList, setSourceList] = useState<AccountDTO[]>([])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isValid },
        reset
    } = useForm<PaymentFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(paymentSchema) as any,
        defaultValues: {
            amount: defaultAmount,
            sourceId: "",
            type: defaultType
        }
    })

    const amountValue = watch("amount")
    const typeValue = watch("type")

    // Update defaults when props change
    useEffect(() => {
        if (open) {
            setValue("amount", defaultAmount)
            setValue("type", defaultType)
            // Load accounts
            getAkun().then((akuns) => {
                const sources = akuns.filter((a: AccountDTO) =>
                    ["BANK", "E_WALLET", "CASH"].includes(a.tipe) && a.id !== akunId
                )
                setSourceList(sources)
            })
        }
    }, [open, defaultAmount, defaultType, akunId, setValue])

    async function onSubmit(values: PaymentFormValues) {
        setLoading(true)
        try {
            if (values.amount < minAmount && values.type === "CUSTOM") {
                if (values.amount < minAmount) { // Strict
                    toast.error(`Pembayaran minimal Rp ${formatRupiahDecimal(minAmount)}`)
                    setLoading(false)
                    return
                }
            }

            const res = await payCreditCardBill(
                akunId,
                values.amount,
                values.sourceId,
                values.type
            )

            if (res.success) {
                toast.success("Pembayaran berhasil!")
                onOpenChange(false)
                reset()
            } else {
                toast.error(res.error || "Gagal melakukan pembayaran")
            }
        } catch (error) {
            toast.error("Terjadi kesalahan sistem")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bayar Tagihan {akunNama}</DialogTitle>
                    <DialogDescription>
                        Pilih sumber dana untuk pembayaran kartu kredit.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    {/* Amount */}
                    <div className="space-y-2">
                        <Label>Jumlah Pembayaran</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">Rp</span>
                            <Input
                                type="number"
                                className={cn("pl-10 text-lg font-bold", errors.amount && "border-red-500")}
                                {...register("amount", { valueAsNumber: true })}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}

                        <div className="flex gap-2 text-xs">
                            <Badge
                                variant={typeValue === "FULL" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => {
                                    setValue("type", "FULL")
                                }}
                            >
                                Full
                            </Badge>
                            <Badge
                                variant={typeValue === "MINIMUM" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setValue("type", "MINIMUM")}
                            >
                                Minimum
                            </Badge>
                            <Badge
                                variant={typeValue === "CUSTOM" ? "default" : "outline"}
                                className="cursor-pointer"
                                onClick={() => setValue("type", "CUSTOM")}
                            >
                                Custom
                            </Badge>
                        </div>
                    </div>

                    {/* Source Account */}
                    <div className="space-y-2">
                        <Label>Sumber Dana</Label>
                        <Select
                            onValueChange={(val) => setValue("sourceId", val, { shouldValidate: true })}
                        >
                            <SelectTrigger className={cn(errors.sourceId && "border-red-500")}>
                                <SelectValue placeholder="Pilih akun sumber" />
                            </SelectTrigger>
                            <SelectContent>
                                {sourceList.map((akun) => (
                                    <SelectItem key={akun.id} value={akun.id}>
                                        <div className="flex items-center gap-2">
                                            {akun.tipe === "E_WALLET" ? <Wallet className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                                            <span>{akun.nama}</span>
                                            <span className="text-muted-foreground ml-auto text-xs">
                                                ({formatRupiahDecimal(akun.saldoSekarang)})
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.sourceId && <p className="text-xs text-red-500">{errors.sourceId.message}</p>}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="submit" disabled={loading || !isValid} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Bayar Sekarang
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
