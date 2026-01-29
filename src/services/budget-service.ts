import { db } from '@/lib/db/app-db'
import { upsertBudget } from '@/lib/db/budget-repo'
import { NotificationService } from './notification-service'
import { ValidationError } from './errors'
import type { BudgetInput } from './types/budget.types'

export class BudgetService {
    private notificationService: NotificationService

    constructor() {
        this.notificationService = new NotificationService()
    }

    /**
     * Check if transaction exceeds budget and send alert
     */
    async checkAndAlert(category: string, amount: number) {
        // 1. Get current month budget
        const currentMonth = new Date().toISOString().slice(0, 7) // '2026-01'

        // Parse month and year from ISO string
        const [yearStr, monthStr] = currentMonth.split('-')
        const bulan = parseInt(monthStr, 10)
        const tahun = parseInt(yearStr, 10)

        const budget = await db.budget
            .where({ bulan, tahun })
            .filter(b => b.kategori === category)
            .first()

        if (!budget) {
            return // No budget set for this category
        }

        // 2. Calculate current spending
        const spent = await this.getCurrentSpending(currentMonth, category)
        const newTotal = spent + amount

        // 3. Check thresholds
        const percentUsed = (newTotal / budget.nominal) * 100 // budget.nominal is the limit

        // Alert at 80% threshold
        if (percentUsed >= 80 && percentUsed < 100) {
            await this.notificationService.sendWarning(
                `Budget Alert: ${category}`,
                {
                    message: `You've used ${percentUsed.toFixed(0)}% of your budget`,
                    spent: newTotal,
                    limit: budget.nominal,
                    remaining: budget.nominal - newTotal
                }
            )
        }

        // Alert at 100% threshold (exceeded)
        if (percentUsed >= 100) {
            await this.notificationService.sendError(
                `Budget Exceeded: ${category}`,
                {
                    message: `You've exceeded your budget by ${this.formatRupiah(newTotal - budget.nominal)}`,
                    spent: newTotal,
                    limit: budget.nominal,
                    overspent: newTotal - budget.nominal
                }
            )
        }
    }

    /**
     * Set or update budget for a category
     */
    async setBudget(data: BudgetInput) {
        // 1. Validate
        if (data.limitInt <= 0) {
            throw new ValidationError('Budget limit must be positive')
        }

        // 2. Upsert
        await upsertBudget({
            kategori: data.kategori,
            bulan: data.bulan,
            tahun: data.tahun,
            nominal: data.limitInt
        })

        // 3. Notify
        await this.notificationService.sendSuccess(
            `Budget set: ${data.kategori} - ${this.formatRupiah(data.limitInt)}/month`
        )
    }

    /**
     * Get budget status for dashboard
     */
    async getBudgetStatus(month: string) { // month format YYYY-MM
        const [yearStr, monthStr] = month.split('-')
        const bulan = parseInt(monthStr, 10)
        const tahun = parseInt(yearStr, 10)

        const budgets = await db.budget
            .where({ bulan, tahun })
            .toArray()

        const status = await Promise.all(
            budgets.map(async (budget) => {
                const spent = await this.getCurrentSpending(month, budget.kategori)
                const remaining = budget.nominal - spent
                const percentUsed = (spent / budget.nominal) * 100

                return {
                    kategori: budget.kategori,
                    limit: budget.nominal,
                    spent,
                    remaining,
                    percentUsed,
                    status: percentUsed >= 100 ? 'exceeded' : percentUsed >= 80 ? 'warning' : 'ok'
                }
            })
        )

        return status
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private async getCurrentSpending(month: string, category: string): Promise<number> {
        const id = `${month}|${category}`
        const summary = await db.summaryCategoryMonth.get(id)
        return summary?.totalOut || 0
    }

    private formatRupiah(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }
}
