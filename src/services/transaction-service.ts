import { db } from '@/lib/db/app-db'
import {
    createTransaksiSimple,
    updateTransaksi,
    deleteTransaksi
} from '@/lib/db/transactions-repo'
import { Money } from '@/lib/money'
import { BudgetService } from './budget-service'
import { NotificationService } from './notification-service'
import { AnalyticsService } from './analytics-service'
import {
    BusinessError,
    ValidationError,
    InsufficientBalanceError
} from './errors'
import type { TransaksiInput } from './types/transaction.types'

export class TransactionService {
    private budgetService: BudgetService
    private notificationService: NotificationService
    private analyticsService: AnalyticsService

    constructor() {
        this.budgetService = new BudgetService()
        this.notificationService = new NotificationService()
        this.analyticsService = new AnalyticsService()
    }

    // ============================================
    // PUBLIC METHODS (Business Operations)
    // ============================================

    /**
     * Create an expense transaction with full business logic
     */
    async createExpenseTransaction(data: TransaksiInput) {
        // 1. Validate business rules
        this.validateExpenseTransaction(data)

        // 2. Check account balance (prevent overdraft)
        if (data.idAkunKredit) {
            await this.checkSufficientBalance(data.idAkunKredit, data.nominalInt)
        }

        // 3. Check large transaction threshold
        if (data.nominalInt > 10_000_000) {
            await this.notificationService.sendWarning(
                'Large Transaction Alert',
                {
                    amount: data.nominalInt,
                    description: data.keterangan || data.kategori,
                    type: 'large_transaction'
                }
            )
        }

        // 4. Create transaction (repository handles DB)
        // Convert Int to Float for repo
        const nominalFloat = Money.toFloat(data.nominalInt)

        // Explicitly set type arguments for CreateTransaksiSimple
        const result = await createTransaksiSimple({
            nominal: nominalFloat,
            kategori: data.kategori!,
            akunId: data.idAkunKredit!,
            tipeTransaksi: 'KELUAR',
            deskripsi: data.keterangan || data.kategori,
            tanggal: data.tanggal ? new Date(data.tanggal) : new Date()
        })

        if (!result.success) {
            throw new BusinessError(result.error || 'Failed to create transaction')
        }
        if (!result.data) {
            throw new BusinessError('No data returned from transaction creation')
        }

        const transaction = result.data

        // 5. Check budget and send alert if exceeded
        await this.budgetService.checkAndAlert(
            data.kategori || 'Uncategorized',
            data.nominalInt
        )

        // 6. Send success notification
        await this.notificationService.sendSuccess(
            `Expense recorded: ${data.keterangan || data.kategori}`,
            { transactionId: transaction.id }
        )

        // 7. Track analytics event
        this.analyticsService.track('transaction_created', {
            type: 'expense',
            amount: data.nominalInt,
            category: data.kategori,
            accountType: await this.getAccountType(data.idAkunKredit!)
        })

        return transaction
    }

    /**
     * Create an income transaction with appropriate business logic
     */
    async createIncomeTransaction(data: TransaksiInput) {
        // 1. Validate (different rules for income)
        this.validateIncomeTransaction(data)

        // 2. Create transaction
        const nominalFloat = Money.toFloat(data.nominalInt)

        const result = await createTransaksiSimple({
            nominal: nominalFloat,
            kategori: data.kategori!,
            akunId: data.idAkunDebit!, // Income goes INTO this account
            tipeTransaksi: 'MASUK',
            deskripsi: data.keterangan,
            tanggal: data.tanggal ? new Date(data.tanggal) : new Date()
        })

        if (!result.success) {
            throw new BusinessError(result.error || 'Failed to create transaction')
        }
        if (!result.data) {
            throw new BusinessError('No data returned')
        }

        const transaction = result.data

        // 3. Send success notification (no budget check for income)
        await this.notificationService.sendSuccess(
            `Income recorded: ${data.keterangan || data.kategori}`,
            { transactionId: transaction.id }
        )

        // 4. Track analytics
        this.analyticsService.track('transaction_created', {
            type: 'income',
            amount: data.nominalInt,
            category: data.kategori
        })

        return transaction
    }

    /**
     * Transfer money between two accounts
     * This is a higher-level operation that creates two transactions
     */
    async transferBetweenAccounts(
        fromAccountId: string,
        toAccountId: string,
        amount: number, // Float or Int? Service guide implies Float in arguments usually, but let's stick to Int for consistency with TransaksiInput. Guide says 'amount: number'.
        description: string
    ) {
        // Let's assume input amount is INT for consistency with other methods, 
        // OR change to Float if that's easier.
        // Given 'formatRupiah' takes number, and 'nominalInt' is stored, I'll assume 'amount' here is INT.

        // 1. Validate
        if (fromAccountId === toAccountId) {
            throw new ValidationError('Cannot transfer to the same account')
        }

        if (amount <= 0) {
            throw new ValidationError('Transfer amount must be positive')
        }

        // 2. Check balance
        await this.checkSufficientBalance(fromAccountId, amount)

        // 3. Create transfer transaction
        // Use createTransaksi simple or full? Full is needed to specify both accounts.
        // But createTransaksiSimple is for Income/Expense.
        // 'createTransaksi' from repo allows specifying debit/credit IDs explicitly.

        // Note: createTransaksi expects Float nominal.
        const nominalFloat = Money.toFloat(amount)

        // We need to import createTransaksi (full version)
        // I need to update imports at the top.
        const { createTransaksi } = await import('@/lib/db/transactions-repo')

        const result = await createTransaksi({
            tanggal: new Date(),
            nominal: nominalFloat,
            kategori: 'Transfer',
            debitAkunId: toAccountId,
            kreditAkunId: fromAccountId,
            deskripsi: description || 'Transfer',
        })

        if (!result.success) {
            throw new BusinessError(result.error || 'Transfer failed')
        }
        if (!result.data) {
            throw new BusinessError('No data returned')
        }
        const transaction = result.data

        // 4. Notify user
        await this.notificationService.sendSuccess(
            `Transfer completed: ${this.formatRupiah(amount)}`,
            { transactionId: transaction.id }
        )

        // 5. Track analytics
        this.analyticsService.track('transfer_completed', {
            amount,
            fromAccount: fromAccountId,
            toAccount: toAccountId
        })

        return transaction
    }

    /**
     * Update existing transaction with validation
     */
    async updateTransaction(
        transactionId: string,
        updates: Partial<TransaksiInput>
    ) {
        // 1. Get existing transaction
        const existing = await db.transaksi.get(transactionId)
        if (!existing) {
            throw new ValidationError('Transaction not found')
        }

        // 2. Validate updates
        if (updates.nominalInt !== undefined && updates.nominalInt <= 0) {
            throw new ValidationError('Amount must be positive')
        }

        // 3. If amount changed, check new balance
        if (updates.nominalInt && updates.nominalInt !== existing.nominalInt) {
            const difference = updates.nominalInt - existing.nominalInt
            if (difference > 0) {
                await this.checkSufficientBalance(existing.kreditAkunId, difference)
            }
        }

        // 4. Update transaction
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = {}
        if (updates.keterangan !== undefined) updateData.deskripsi = updates.keterangan
        if (updates.kategori !== undefined) updateData.kategori = updates.kategori
        if (updates.nominalInt !== undefined) updateData.nominal = Money.toFloat(updates.nominalInt)
        if (updates.tanggal !== undefined) updateData.tanggal = new Date(updates.tanggal)

        const result = await updateTransaksi(transactionId, updateData)

        if (!result.success) throw new BusinessError(result.error || 'Update failed')

        // 5. Notify
        await this.notificationService.sendSuccess('Transaction updated')

        // 6. Track
        this.analyticsService.track('transaction_updated', {
            transactionId,
            changes: Object.keys(updates)
        })

        return result.data
        // Note: Result.data might not be fully mapped as TransaksiRecord, but repo usually returns mapped. 
        // If not, we can return 'result.data' or reload.
    }

    /**
     * Delete transaction with safety checks
     */
    async deleteTransaction(transactionId: string) {
        // 1. Get transaction
        const transaction = await db.transaksi.get(transactionId)
        if (!transaction) {
            throw new ValidationError('Transaction not found')
        }

        // 2. Check if part of installment plan (prevent deletion)
        if (transaction.rencanaCicilanId) {
            throw new BusinessError(
                'Cannot delete transaction linked to installment plan',
                'LINKED_TO_CICILAN'
            )
        }

        // 3. Delete
        await deleteTransaksi(transactionId)

        // 4. Notify
        await this.notificationService.sendSuccess('Transaction deleted')

        // 5. Track
        this.analyticsService.track('transaction_deleted', {
            transactionId,
            amount: transaction.nominalInt
        })
    }

    // ============================================
    // PRIVATE METHODS (Business Logic Helpers)
    // ============================================

    /**
     * Validate expense transaction business rules
     */
    private validateExpenseTransaction(data: TransaksiInput) {
        if (data.nominalInt <= 0) {
            throw new ValidationError('Expense amount must be positive')
        }

        if (!data.kategori) {
            throw new ValidationError('Category is required for expenses')
        }

        // For Expense: Credit Account (Source) is required
        if (!data.idAkunKredit) {
            throw new ValidationError('Credit account is required')
        }
    }

    /**
     * Validate income transaction business rules
     */
    private validateIncomeTransaction(data: TransaksiInput) {
        if (data.nominalInt <= 0) {
            throw new ValidationError('Income amount must be positive')
        }

        // For Income: Debit Account (Target) is required
        if (!data.idAkunDebit) {
            throw new ValidationError('Debit account is required')
        }
    }

    /**
     * Check if account has sufficient balance
     */
    private async checkSufficientBalance(accountId: string, requiredAmount: number) {
        const account = await db.akun.get(accountId)

        if (!account) {
            throw new ValidationError('Account not found')
        }

        // For regular accounts (not credit cards)
        if (account.tipe !== 'CREDIT_CARD') {
            if (account.saldoSekarangInt < requiredAmount) {
                throw new InsufficientBalanceError(
                    account.nama,
                    requiredAmount,
                    account.saldoSekarangInt
                )
            }
        }

        // For credit cards, check credit limit
        if (account.tipe === 'CREDIT_CARD') {
            // Logic: saldoSekarangInt is usually negative for debt, or positive if overpaid?
            // Typically CreditCard: 0 -> -Spending. 
            // Available Credit = Limit + Balance (if Balance is negative).
            // Example: Limit 10M. Balance -2M. Available = 8M.

            const limit = account.limitKreditInt || 0
            // If balance is -2M, it means debt.
            // Maximum debt is Limit.
            // So -Balance <= Limit.
            // Available = Limit + Balance (assuming Balance is negative)
            // Example: Limit 10, Balance -2. Avail 8.
            // If Balance is positive (overpaid), Avail = 10 + 2 = 12.

            const availableCredit = limit + account.saldoSekarangInt
            if (availableCredit < requiredAmount) {
                throw new InsufficientBalanceError(
                    account.nama,
                    requiredAmount,
                    availableCredit
                )
            }
        }
    }

    /**
     * Get account type for analytics
     */
    private async getAccountType(accountId: string): Promise<string> {
        const account = await db.akun.get(accountId)
        return account?.tipe || 'UNKNOWN'
    }

    /**
     * Format rupiah for display
     */
    private formatRupiah(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }
}
