"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import {
    getBillingPeriod,
    getDueDateInfo,
    calculateLateFee,
    calculateMinimumPayment
} from "@/lib/decimal-utils"
import { Money } from "@/lib/money"

// Interface untuk hasil kalkulasi pembayaran
export interface PaymentCalculation {
    fullPayment: number
    minimumPayment: number
    lateFee: number
    breakdown: {
        purchases: number
        installments: number
        fees: number
        previousBalance: number
    }
    billingPeriod: { start: Date; end: Date }
    dueDate: Date
    daysUntilDue: number
    isPastDue: boolean
    isValid: boolean
    validationError?: string
}

// Kategori yang dianggap sebagai biaya/denda
const FEE_CATEGORIES = ["Biaya", "Denda", "Admin", "Bunga", "Late Fee"]

/**
 * Validate credit card has all mandatory fields
 */
export async function validateCreditCardMandatoryFields(akunId: string): Promise<{
    isValid: boolean
    error?: string
}> {
    try {
        const akun = await prisma.akun.findUnique({
            where: { id: akunId }
        })

        if (!akun) {
            return { isValid: false, error: "Akun tidak ditemukan" }
        }

        if (akun.tipe !== "CREDIT_CARD") {
            return { isValid: false, error: "Akun bukan kartu kredit" }
        }

        const missingFields: string[] = []

        if (akun.isSyariah === null || akun.isSyariah === undefined) {
            missingFields.push("Tipe Kartu (Syariah/Konvensional)")
        }
        if (!akun.billingDate) {
            missingFields.push("Tanggal Billing")
        }
        if (!akun.dueDate) {
            missingFields.push("Tanggal Jatuh Tempo")
        }
        if (!akun.minPaymentFixed) {
            missingFields.push("Minimum Payment")
        }

        if (missingFields.length > 0) {
            return {
                isValid: false,
                error: `Field wajib belum diisi: ${missingFields.join(", ")}`
            }
        }

        return { isValid: true }
    } catch (error) {
        await logSistem("ERROR", "CREDIT_CARD", "Gagal validasi field kartu kredit", (error as Error).stack)
        return { isValid: false, error: "Gagal memvalidasi kartu kredit" }
    }
}

/**
 * Calculate credit card payment with full breakdown
 */
export async function calculateCreditCardPayment(akunId: string): Promise<PaymentCalculation> {
    try {
        // Get account details
        const akun = await prisma.akun.findUnique({
            where: { id: akunId }
        })

        if (!akun) {
            return {
                fullPayment: 0,
                minimumPayment: 0,
                lateFee: 0,
                breakdown: { purchases: 0, installments: 0, fees: 0, previousBalance: 0 },
                billingPeriod: { start: new Date(), end: new Date() },
                dueDate: new Date(),
                daysUntilDue: 0,
                isPastDue: false,
                isValid: false,
                validationError: "Akun tidak ditemukan"
            }
        }

        const saldoSekarangFloat = Money.toFloat(Number(akun.saldoSekarang))

        // Validate mandatory fields
        const validation = await validateCreditCardMandatoryFields(akunId)
        if (!validation.isValid) {
            return {
                fullPayment: Math.abs(saldoSekarangFloat),
                minimumPayment: 0,
                lateFee: 0,
                breakdown: { purchases: 0, installments: 0, fees: 0, previousBalance: Math.abs(saldoSekarangFloat) },
                billingPeriod: { start: new Date(), end: new Date() },
                dueDate: new Date(),
                daysUntilDue: 0,
                isPastDue: false,
                isValid: false,
                validationError: validation.error
            }
        }

        // Get billing period
        const billingPeriod = getBillingPeriod(akun.billingDate!)

        // Get due date info
        const dueDateInfo = getDueDateInfo(akun.dueDate!, akun.billingDate!)

        // Fetch transactions in billing period where this account is credited (money out = debt increases)
        const transactions = await prisma.transaksi.findMany({
            where: {
                kreditAkunId: akunId,
                tanggal: {
                    gte: billingPeriod.start,
                    lte: billingPeriod.end
                }
            },
            include: {
                rencanaCicilan: true
            }
        })

        // Categorize transactions
        let purchases = 0
        let installments = 0
        let fees = 0

        for (const tx of transactions) {
            const nominal = Money.toFloat(Number(tx.nominal))

            // Check if it's an installment payment
            if (tx.rencanaCicilanId) {
                installments += nominal
                continue
            }

            // Check if it's a fee/penalty
            const isFee = FEE_CATEGORIES.some(cat =>
                tx.kategori.toLowerCase().includes(cat.toLowerCase())
            )
            if (isFee) {
                fees += nominal
                continue
            }

            // Regular purchase
            purchases += nominal
        }

        // Previous balance = current balance - this period's transactions
        // In credit cards, saldoSekarang is typically negative (debt)
        const thisMonthTotal = purchases + installments + fees
        const previousBalance = Math.max(0, Math.abs(saldoSekarangFloat) - thisMonthTotal)

        // Calculate full payment
        const fullPayment = purchases + installments + fees + previousBalance

        // Calculate minimum payment
        const minPaymentFixedFloat = akun.minPaymentFixed ? Money.toFloat(Number(akun.minPaymentFixed)) : 50000
        const minimumPayment = calculateMinimumPayment(
            fullPayment,
            akun.minPaymentPercent || 5,
            minPaymentFixedFloat
        )

        // Calculate late fee (only if past due)
        const daysPastDue = dueDateInfo.isPastDue ? Math.abs(dueDateInfo.daysUntilDue) : 0
        const lateFee = calculateLateFee(fullPayment, akun.isSyariah || false, daysPastDue)

        await logSistem("INFO", "CREDIT_CARD",
            `Kalkulasi tagihan ${akun.nama}: Total ${fullPayment.toLocaleString('id-ID')}`)

        return {
            fullPayment,
            minimumPayment,
            lateFee,
            breakdown: {
                purchases,
                installments,
                fees,
                previousBalance
            },
            billingPeriod,
            dueDate: dueDateInfo.dueDateTime,
            daysUntilDue: dueDateInfo.daysUntilDue,
            isPastDue: dueDateInfo.isPastDue,
            isValid: true
        }
    } catch (error) {
        await logSistem("ERROR", "CREDIT_CARD", "Gagal menghitung tagihan kartu kredit", (error as Error).stack)
        return {
            fullPayment: 0,
            minimumPayment: 0,
            lateFee: 0,
            breakdown: { purchases: 0, installments: 0, fees: 0, previousBalance: 0 },
            billingPeriod: { start: new Date(), end: new Date() },
            dueDate: new Date(),
            daysUntilDue: 0,
            isPastDue: false,
            isValid: false,
            validationError: "Terjadi kesalahan saat menghitung tagihan"
        }
    }
}

/**
 * Get credit card account with full details
 */
export async function getCreditCardDetail(akunId: string) {
    try {
        const akun = await prisma.akun.findUnique({
            where: { id: akunId },
            include: {
                adminFees: {
                    where: { isActive: true },
                    include: {
                        recurringTx: true
                    }
                }
            }
        })

        if (!akun || akun.tipe !== "CREDIT_CARD") {
            return { success: false, error: "Akun kartu kredit tidak ditemukan" }
        }
        
        const mappedAkun = {
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
            minPaymentFixed: akun.minPaymentFixed ? Money.toFloat(Number(akun.minPaymentFixed)) : null,
            minInstallmentAmount: akun.minInstallmentAmount ? Money.toFloat(Number(akun.minInstallmentAmount)) : null,
        }

        return { success: true, data: mappedAkun }
    } catch (error) {
        await logSistem("ERROR", "CREDIT_CARD", "Gagal mengambil detail kartu kredit", (error as Error).stack)
        return { success: false, error: "Gagal mengambil detail kartu kredit" }
    }
}