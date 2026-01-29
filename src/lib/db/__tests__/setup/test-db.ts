import { db } from '@/lib/db/app-db'

/**
 * Reset database to clean state before each test
 */
export async function resetDatabase() {
    try {
        await db.delete()
        await db.open()
    } catch (error) {
        console.error('Failed to reset database:', error)
        throw error
    }
}

/**
 * Create test accounts with predefined data
 */
export async function createTestAccounts() {
    const { createAkun } = await import('@/lib/db/accounts-repo')

    const walletRes = await createAkun({
        nama: 'Test Wallet',
        tipe: 'DOMPET',
        saldoAwal: 10000000, // 10 juta
    })
    if (!walletRes.success) throw new Error(walletRes.error as string)
    const wallet = walletRes.data!

    const bankRes = await createAkun({
        nama: 'Test Bank',
        tipe: 'BANK',
        saldoAwal: 50000000, // 50 juta
    })
    if (!bankRes.success) throw new Error(bankRes.error as string)
    const bank = bankRes.data!

    const creditCardRes = await createAkun({
        nama: 'Test Credit Card',
        tipe: 'CREDIT_CARD',
        saldoAwal: 0,
        limitKredit: 20000000, // 20 juta limit
    })
    if (!creditCardRes.success) throw new Error(creditCardRes.error as string)
    const creditCard = creditCardRes.data!

    const foodExpenseRes = await createAkun({
        nama: '[EXPENSE] Food',
        tipe: 'EXPENSE',
        saldoAwal: 0,
    })
    if (!foodExpenseRes.success) throw new Error(foodExpenseRes.error as string)
    const foodExpense = foodExpenseRes.data!

    const salaryIncomeRes = await createAkun({
        nama: '[INCOME] Salary',
        tipe: 'INCOME',
        saldoAwal: 0,
    })
    if (!salaryIncomeRes.success) throw new Error(salaryIncomeRes.error as string)
    const salaryIncome = salaryIncomeRes.data!

    return {
        wallet,
        bank,
        creditCard,
        foodExpense,
        salaryIncome
    }
}

/**
 * Get total of all debit and credit balances
 * Used to verify double-entry integrity
 */
export async function getDoubleEntryTotals() {
    const accounts = await db.akun.toArray()

    let totalDebits = 0
    let totalCredits = 0

    for (const account of accounts) {
        if (account.saldoSekarangInt > 0) {
            totalDebits += account.saldoSekarangInt
        } else {
            totalCredits += Math.abs(account.saldoSekarangInt)
        }
    }

    return { totalDebits, totalCredits }
}
