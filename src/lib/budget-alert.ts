import prisma from "@/lib/prisma"
import { createNotification } from "@/lib/db/notifications-repo"
import { Money } from "@/lib/money"

export type AlertLevel = "SAFE" | "WARNING" | "DANGER" | "CRITICAL"

export interface BudgetAlertResult {
    level: AlertLevel
    percentage: number
    message?: string
}

/**
 * Checks budget status for a category and creates notification if threshold reached.
 * Returns the alert status for immediate UI feedback.
 */
export async function checkBudgetAlert(
    kategori: string,
    tanggal: Date
): Promise<BudgetAlertResult> {
    try {
        const bulan = tanggal.getMonth() + 1
        const tahun = tanggal.getFullYear()

        const budget = await prisma.budget.findFirst({
            where: { kategori, bulan, tahun }
        })

        if (!budget) return { level: "SAFE", percentage: 0 }

        // Get total realization for this category
        const startDate = new Date(tahun, bulan - 1, 1)
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

        const result = await prisma.transaksi.aggregate({
            where: {
                kategori,
                tanggal: { gte: startDate, lte: endDate },
                debitAkun: { tipe: "EXPENSE" }
            },
            _sum: { nominal: true }
        })

        const realization = Money.toFloat(Number(result._sum.nominal || 0))
        const percentage = (realization / budget.nominal) * 100
        const overAmount = realization - budget.nominal

        let level: AlertLevel = "SAFE"
        let title = ""
        let message = ""
        let severity: "INFO" | "WARNING" | "ERROR" = "INFO"

        if (percentage >= 120) {
            level = "CRITICAL"
            title = "🚨 Budget Critical Alert"
            message = `Pengeluaran ${kategori} melebihi 120%! (Over Rp ${overAmount.toLocaleString('id-ID')})`
            severity = "ERROR"
        } else if (percentage >= 100) {
            level = "DANGER"
            title = "🔴 Budget Habis"
            message = `Budget ${kategori} HABIS! Anda sudah over Rp ${overAmount.toLocaleString('id-ID')}`
            severity = "ERROR"
        } else if (percentage >= 80) {
            level = "WARNING"
            title = "🟡 Warning Budget"
            message = `Hati-hati! Budget ${kategori} sudah ${Math.round(percentage)}% terpakai`
            severity = "WARNING"
        }

        if (level !== "SAFE") {
            // Create persistent notification
            // Check if we recently sent a similar notification to avoid spam? 
            // For now, just create it as per spec.
            await createNotification({
                type: "BUDGET_WARNING",
                title,
                message,
                severity,
                actionUrl: "/anggaran"
            })

            return { level, percentage, message }
        }

        return { level: "SAFE", percentage }

    } catch (error) {
        console.error("Failed to check budget alert", error)
        return { level: "SAFE", percentage: 0 }
    }
}
