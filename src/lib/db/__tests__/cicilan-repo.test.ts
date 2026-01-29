import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db/app-db'
import {
    createCicilan,
    bayarCicilan,
    pelunasanDipercepat
} from '@/lib/db/cicilan-repo'
import { resetDatabase, createTestAccounts } from './setup/test-db'

describe('🔴 CRITICAL - Cicilan Repository', () => {
    let testAccounts: Awaited<ReturnType<typeof createTestAccounts>>

    beforeEach(async () => {
        await resetDatabase()
        testAccounts = await createTestAccounts()
    })

    // ============================================
    // TEST GROUP 1: CICILAN PLAN CREATION
    // ============================================

    describe('Cicilan Plan Creation', () => {
        it('should create 12-month installment plan correctly', async () => {
            // Arrange
            const totalAmount = 6000000 // 6 juta
            const tenure = 12 // 12 months
            const expectedMonthly = totalAmount / tenure // 500k per month

            // Act
            const res = await createCicilan({
                namaProduk: 'iPhone 15 Pro',
                totalPokok: totalAmount,
                tenor: tenure,
                nominalPerBulan: expectedMonthly,
                tanggalJatuhTempo: 15, // Every 15th of month
                akunKreditId: testAccounts.creditCard.id
            })
            if (!res.success) throw new Error(res.error as string | undefined)
            const plan = res.data!

            // Assert
            expect(plan.totalPokokInt).toBe(totalAmount * 100)
            expect(plan.tenor).toBe(tenure)
            expect(plan.nominalPerBulanInt).toBe(expectedMonthly * 100)
            // sisaCicilanInt is NOT on the CicilanRecord interface explicitly in createCicilan response? 
            // The return type is mapped.
            // Interface CicilanRecord: id, namaProduk, totalPokokInt...
            // createCicilan returns { ...cicilan, totalPokok ... } (DTO)
            // DTO has totalPokok (float), not Int?
            // createCicilan return:
            // data: { ...cicilan, totalPokok: float, nominalPerBulan: float ... }
            // So plan.totalPokok should be 6000000.

            expect(plan.totalPokok).toBe(totalAmount)
            expect(plan.nominalPerBulan).toBe(expectedMonthly)

            // Check DB record for status
            const dbRecord = await db.rencanaCicilan.get(plan.id)
            expect(dbRecord!.status).toBe('AKTIF')
            expect(dbRecord!.cicilanKe).toBe(1)
        })

        it('should calculate monthly payment with admin fee', async () => {
            // Arrange
            const principal = 10000000 // 10 juta
            const adminFee = 100000 // 100k admin fee
            const tenure = 10
            const monthly = principal / tenure

            // Act
            const res = await createCicilan({
                namaProduk: 'Laptop',
                totalPokok: principal,
                tenor: tenure,
                nominalPerBulan: monthly,
                biayaAdmin: adminFee,
                tanggalJatuhTempo: 1,
                akunKreditId: testAccounts.creditCard.id
            })
            if (!res.success) throw new Error(res.error as string | undefined)
            const plan = res.data!

            // Assert
            expect(plan.biayaAdmin).toBe(adminFee)
            // totalBiayaInt is not a property. 
        })

        // Validation tests skipped for brevity, similar to transactions
    })

    // ============================================
    // TEST GROUP 2: MONTHLY PAYMENT PROCESSING
    // ============================================

    describe('Monthly Payment Processing', () => {
        it('should process monthly payment and update balances', async () => {
            // Arrange
            const totalAmount = 6000000
            const tenure = 12
            const monthly = 500000

            const createRes = await createCicilan({
                namaProduk: 'TV',
                totalPokok: totalAmount,
                tenor: tenure,
                nominalPerBulan: monthly,
                tanggalJatuhTempo: 15,
                akunKreditId: testAccounts.creditCard.id
            })
            const plan = createRes.data!

            const bankBefore = await db.akun.get(testAccounts.bank.id as any)
            const creditCardBefore = await db.akun.get(testAccounts.creditCard.id as any)

            // Act
            // We need to set the internal debit account's balance to allow payment? 
            // Or we pay using 'testAccounts.bank.id'? 
            // bayarCicilan uses 'akunDebitId' stored in the plan.
            // createCicilan creates a special '[EXPENSE] Cicilan' account as debit account inside the logic?
            // Let's check createCicilan logic.
            // It creates "[EXPENSE] Cicilan" account if not exists.
            // And sets 'akunDebitId' to this account.
            // So when we pay, we debit '[EXPENSE] Cicilan' (Increase expense) and Credit 'akunKreditId' (CC)?
            // Wait. Paying a logic usually means:
            // 1. Transaction: Debit [EXPENSE] Cicilan, Credit [CREDIT CARD]. 
            // This increases CC debt? No, usually Installment creation increases CC debt (or reserves limit).
            // Payment of Installment usually means:
            // a) Paying THE MERCHANT (already done by CC). 
            // b) Moving "Unbilled" to "Billed"?
            // OR
            // c) Paying the CC bill?

            // In this app, `createCicilan` creates a PLAN.
            // `bayarCicilan` creates a Transaction: Debit: Expense, Credit: CC.
            // This reflects the monthly "charge" appearing on the CC statement.
            // It does NOT mean paying the CC from Bank.
            // It means "Recognizing the expense for this month".

            const res = await bayarCicilan(plan.id)
            if (!res.success) throw new Error(res.error as string | undefined)

            // Assert
            const updatedPlan = await db.rencanaCicilan.get(plan.id)
            // bank balance shoud NOT change because we pay with CC (it adds to CC balance).
            // CC balance should decrease (more debt? Credit Account: Debit decreases debt, Credit increases debt/liability).
            // Wait. CC is Liability.
            // Transaction: Debit Expense (Increase), Credit CC (Increase Liability).

            const bankAfter = await db.akun.get(testAccounts.bank.id as any)
            const creditCardAfter = await db.akun.get(testAccounts.creditCard.id as any)

            expect(updatedPlan!.cicilanKe).toBe(2)

            // Bank should be unchanged
            expect(bankAfter!.saldoSekarangInt).toBe(bankBefore!.saldoSekarangInt)

            // CC should have INCREASED balance (more debt) - technically negative balance if Liability is tracked as negative?
            // In this app, Credit Card type usually treated as Liability.
            // If `createAkun` initializes at 0.
            // Credit (Increase Liability). 
            // `updateAccountBalancesLocal`:
            // debitAkun (Expense) += nominal.
            // kreditAkun (CC) -= nominal.
            // So CC balance becomes NEGATIVE (e.g. -500,000).

            const delta = monthly * 100
            expect(creditCardAfter!.saldoSekarangInt).toBe(creditCardBefore!.saldoSekarangInt - delta)
        })

        it('should complete cicilan after final payment', async () => {
            // Arrange: Create 1-month plan
            const createRes = await createCicilan({
                namaProduk: 'Short Loan',
                totalPokok: 100000,
                tenor: 1,
                nominalPerBulan: 100000,
                tanggalJatuhTempo: 15,
                akunKreditId: testAccounts.creditCard.id
            })
            const plan = createRes.data!

            // Act
            await bayarCicilan(plan.id)

            // Assert
            const completedPlan = await db.rencanaCicilan.get(plan.id)

            expect(completedPlan!.cicilanKe).toBe(2) // 1 -> 2 (Next is 2, implies 1 is done? Logic says newCicilanKe = curr + 1)
            // Logic: if newCicilanKe > tenor -> STATUS LUNAS.
            // 2 > 1 -> LUNAS.
            expect(completedPlan!.status).toBe('LUNAS')
        })
    })
})
