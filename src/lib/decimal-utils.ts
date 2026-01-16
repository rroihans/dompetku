// Decimal formatting utilities for credit card display
// CIMB Niaga uses 2 decimal places (1.203.930,88), others use whole numbers

/**
 * Format rupiah with optional decimal places
 * @param amount - Amount to format
 * @param useDecimals - If true, use 2 decimal places (CIMB style)
 */
export function formatRupiahDecimal(amount: number, useDecimals: boolean = false): string {
    const isNegative = amount < 0
    const absAmount = Math.abs(amount)

    if (useDecimals) {
        // CIMB style: 1.203.930,88
        const formatted = absAmount.toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
        return `${isNegative ? '-' : ''}Rp ${formatted}`
    }

    // Standard style: 1.203.931 (rounded)
    return `${isNegative ? '-' : ''}Rp ${Math.round(absAmount).toLocaleString('id-ID')}`
}

/**
 * Check if account name indicates CIMB bank (uses 2 decimal format)
 */
export function usesCimbFormat(akunNama: string): boolean {
    return akunNama.toLowerCase().includes("cimb")
}

/**
 * Calculate late fee based on card type and days past due
 * @param fullPayment - Total payment amount
 * @param isSyariah - Card type (true = Syariah)
 * @param daysPastDue - Days past due date (0 if not yet due)
 */
export function calculateLateFee(
    fullPayment: number,
    isSyariah: boolean,
    daysPastDue: number
): number {
    if (daysPastDue <= 0) return 0

    if (isSyariah) {
        // Ta'widh: Rp 75.000 (≤30 hari) atau Rp 100.000 (>30 hari)
        return daysPastDue <= 30 ? 75000 : 100000
    }

    // Konvensional: 1% dari total tagihan, max Rp 100.000
    const fee = fullPayment * 0.01
    return Math.min(fee, 100000)
}

/**
 * Calculate minimum payment based on full payment and account settings
 */
export function calculateMinimumPayment(
    fullPayment: number,
    minPaymentPercent: number = 5,
    minPaymentFixed: number = 50000
): number {
    const percentBased = fullPayment * (minPaymentPercent / 100)
    return Math.max(percentBased, minPaymentFixed)
}

/**
 * Get billing period dates for a credit card
 * Billing period: day 1 to billingDate of current month
 */
export function getBillingPeriod(billingDate: number): { start: Date; end: Date } {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Start of billing period (1st of current month)
    const start = new Date(currentYear, currentMonth, 1)
    start.setHours(0, 0, 0, 0)

    // End of billing period (billingDate of current month)
    const end = new Date(currentYear, currentMonth, billingDate)
    end.setHours(23, 59, 59, 999)

    return { start, end }
}

/**
 * Get due date and calculate days until/past due
 */
export function getDueDateInfo(dueDate: number, billingDate: number): {
    dueDateTime: Date
    daysUntilDue: number
    isPastDue: boolean
} {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Due date can be in same month or next month based on configuration
    // If dueDate < billingDate, due date is in next month
    let dueDateObj: Date
    if (dueDate >= billingDate) {
        dueDateObj = new Date(currentYear, currentMonth, dueDate)
    } else {
        dueDateObj = new Date(currentYear, currentMonth + 1, dueDate)
    }

    dueDateObj.setHours(23, 59, 59, 999)

    const timeDiff = dueDateObj.getTime() - now.getTime()
    const daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24))

    return {
        dueDateTime: dueDateObj,
        daysUntilDue,
        isPastDue: daysUntilDue < 0
    }
}
