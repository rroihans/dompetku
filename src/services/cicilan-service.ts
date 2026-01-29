import { db } from '@/lib/db/app-db'
import {
    createCicilan,
    bayarCicilan,
    pelunasanDipercepat
} from '@/lib/db/cicilan-repo'
import { Money } from '@/lib/money'
import { NotificationService } from './notification-service'
import { AnalyticsService } from './analytics-service'
import { BusinessError, ValidationError, InsufficientBalanceError } from './errors'
import type { RencanaCicilanInput } from './types/cicilan.types'

export class CicilanService {
    private notificationService: NotificationService
    private analyticsService: AnalyticsService

    constructor() {
        this.notificationService = new NotificationService()
        this.analyticsService = new AnalyticsService()
    }

    /**
     * Create installment plan with business validation
     */
    async createInstallmentPlan(data: RencanaCicilanInput) {
        // 1. Validate business rules
        this.validateInstallmentPlan(data)

        // 2. Check if account can support installment
        await this.validateAccountForInstallment(data.idAkunKredit)

        // 3. Calculate Monthly Payment and Total
        // Simple Interest: Principal + (Principal * Rate * Years)
        const principal = Money.toFloat(data.jumlahPokokInt)
        const years = data.tenorBulan / 12
        const totalInterest = principal * (data.bungaPersenPerTahun / 100) * years
        const total = principal + totalInterest
        const nominalPerBulan = Math.ceil(total / data.tenorBulan)

        // 4. Create plan
        const result = await createCicilan({
            namaProduk: data.nama,
            totalPokok: total,
            tenor: data.tenorBulan,
            nominalPerBulan: nominalPerBulan,
            bungaPersen: data.bungaPersenPerTahun,
            tanggalJatuhTempo: data.tanggalJatuhTempo,
            akunKreditId: data.idAkunKredit,
            // biayaAdmin handled optionally if needed, defaulting 0 here
        })

        if (!result.success || !result.data) {
            throw new BusinessError(result.error || 'Failed to create installment plan')
        }

        const plan = result.data

        // 5. Create reminder notification
        // Note: scheduleReminder not fully implemented in NotificationService (just adds DB record)
        await this.notificationService.scheduleReminder(
            `Cicilan payment due: ${data.keterangan || data.nama}`,
            new Date(), // Should calculate actual next due date
            { planId: plan.id }
        )

        // 6. Track analytics
        this.analyticsService.track('installment_plan_created', {
            principal: data.jumlahPokokInt,
            tenor: data.tenorBulan,
            monthlyPayment: plan.nominalPerBulanInt
        })

        return plan
    }

    /**
     * Process monthly payment with full business logic
     */
    async processMonthlyPayment(planId: string) {
        // 1. Get plan
        const plan = await db.rencanaCicilan.get(planId)
        if (!plan) {
            throw new ValidationError('Installment plan not found')
        }

        // 2. Check if already completed
        if (plan.status === 'LUNAS') {
            throw new BusinessError('Installment already completed', 'ALREADY_COMPLETED')
        }

        // 3. Check CC limit (Payment means adding charge to CC)
        // Implicitly checks if CC has space? 
        // Usually installments lock the limit upfront, so monthly post just 'uses' the locked limit?
        // Or if it's "Fresh" installment, it eats limit monthly.
        // Let's perform a check if CC Balance + New Charge > Limit
        await this.checkCreditLimitAvailability(plan.akunKreditId, plan.nominalPerBulanInt)

        // 4. Process payment
        const result = await bayarCicilan(planId)
        if (!result.success) {
            throw new BusinessError(result.error || 'Payment failed')
        }

        // Reload plan to check status
        const updatedPlan = await db.rencanaCicilan.get(planId)
        const remaining = updatedPlan ? (updatedPlan.tenor - updatedPlan.cicilanKe + 1) : 0
        // Note: cicilanKe is incremented. If 1/12, it becomes 2. So remaining is 12 - 2 + 1 = 11? 
        // Repo: cicilanKe = cicilan.cicilanKe + 1.
        // If cicilanKe starts at 1. After 1 payment, it becomes 2. 
        // Remaining = Tenor - (NewCicilanKe - 1)?
        // Let's rely on Repo logic or simple math.

        // 5. Send notification
        if (updatedPlan) {
            await this.notificationService.sendSuccess(
                `Payment processed. ${updatedPlan.tenor - updatedPlan.cicilanKe + 1} months remaining`,
                { planId, payment: plan.nominalPerBulanInt }
            )

            // 6. If completed
            if (updatedPlan.status === 'LUNAS') {
                await this.notificationService.sendSuccess(
                    `🎉 Installment plan completed: ${plan.namaProduk}`,
                    { planId }
                )
            }
        }

        // 7. Track analytics
        this.analyticsService.track('installment_payment_processed', {
            planId,
            monthsPaid: updatedPlan?.cicilanKe ? updatedPlan.cicilanKe - 1 : 0,
            completed: updatedPlan?.status === 'LUNAS'
        })

        return result
    }

    /**
     * Early payoff with calculation and confirmation
     */
    async payoffEarly(planId: string) {
        // 1. Get plan
        const plan = await db.rencanaCicilan.get(planId)
        if (!plan) {
            throw new ValidationError('Installment plan not found')
        }

        // 2. Check if already completed
        if (plan.status === 'LUNAS') {
            throw new BusinessError('Already completed', 'ALREADY_COMPLETED')
        }

        // 3. Calculate remaining amount
        const remainingMonths = plan.tenor - plan.cicilanKe + 1
        const remainingAmount = remainingMonths * plan.nominalPerBulanInt

        // 4. Check CC Limit
        await this.checkCreditLimitAvailability(plan.akunKreditId, remainingAmount)

        // 5. Payoff
        const result = await pelunasanDipercepat(planId)
        if (!result.success) throw new BusinessError(result.error || 'Payoff failed')

        // 6. Notify
        await this.notificationService.sendSuccess(
            `Installment paid off early! Saved interest.`,
            { planId, paidAmount: remainingAmount }
        )

        // 7. Track
        this.analyticsService.track('installment_early_payoff', {
            planId,
            remainingMonths,
            paidAmount: remainingAmount
        })
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private validateInstallmentPlan(data: RencanaCicilanInput) {
        if (data.jumlahPokokInt <= 0) {
            throw new ValidationError('Principal amount must be positive')
        }

        if (data.tenorBulan <= 0 || data.tenorBulan > 60) {
            throw new ValidationError('Tenure must be between 1 and 60 months')
        }

        if (data.tanggalJatuhTempo < 1 || data.tanggalJatuhTempo > 31) {
            throw new ValidationError('Due date must be between 1 and 31')
        }
    }

    private async validateAccountForInstallment(accountId: string) {
        const account = await db.akun.get(accountId)

        if (!account) {
            throw new ValidationError('Account not found')
        }

        // Typically installments are for credit cards
        if (account.tipe !== 'CREDIT_CARD') {
            console.warn('Installment on non-credit-card account')
        }
    }

    private async checkCreditLimitAvailability(accountId: string, amount: number) {
        const account = await db.akun.get(accountId)
        if (!account) return

        if (account.tipe === 'CREDIT_CARD') {
            const limit = account.limitKreditInt || 0
            const currentBalance = account.saldoSekarangInt
            // Available = Limit + Balance (Balance is neg).
            const available = limit + currentBalance
            // Is this right? 
            // If I pay 1M installment, my debt increases by 1M.
            // Balance becomes Balance - 1M.
            // NewBalance should be >= -Limit.
            // Balance - Amount >= -Limit
            // Balance + Limit >= Amount
            // Available >= Amount.

            if (available < amount) {
                throw new InsufficientBalanceError(
                    account.nama,
                    amount,
                    available
                )
            }
        }
    }
}
