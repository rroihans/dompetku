"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

export interface IntegrityReport {
    orphanedRecurring: number
    orphanedCicilan: number
    mismatchedAdminFees: number
    totalIssues: number
}

export async function checkDatabaseIntegrity() {
    try {
        const [recurring, cicilan, accounts, adminFees] = await Promise.all([
            prisma.recurringTransaction.findMany({ select: { id: true, akunId: true } }),
            prisma.rencanaCicilan.findMany({ select: { id: true, akunKreditId: true } }),
            prisma.akun.findMany({ select: { id: true, biayaAdminAktif: true } }),
            prisma.adminFee.findMany({ select: { id: true, akunId: true } })
        ])

        const accountIds = new Set(accounts.map(a => a.id))
        const accountsWithAdminFeeRecord = new Set(adminFees.map(af => af.akunId))

        const orphanedRecurring = recurring.filter(r => !accountIds.has(r.akunId)).length
        const orphanedCicilan = cicilan.filter(c => !accountIds.has(c.akunKreditId)).length
        const mismatchedAdminFees = accounts.filter(a => a.biayaAdminAktif && !accountsWithAdminFeeRecord.has(a.id)).length

        const totalIssues = orphanedRecurring + orphanedCicilan + mismatchedAdminFees

        return {
            success: true,
            data: {
                orphanedRecurring,
                orphanedCicilan,
                mismatchedAdminFees,
                totalIssues
            } as IntegrityReport
        }
    } catch (error) {
        await logSistem("ERROR", "INTEGRITY", "Gagal melakukan cek integritas", (error as Error).stack)
        return { success: false, error: "Gagal melakukan cek integritas" }
    }
}

export async function fixDatabaseIntegrity() {
    try {
        const [recurring, cicilan, accounts, adminFees] = await Promise.all([
            prisma.recurringTransaction.findMany({ select: { id: true, akunId: true } }),
            prisma.rencanaCicilan.findMany({ select: { id: true, akunKreditId: true } }),
            prisma.akun.findMany({ select: { id: true, biayaAdminAktif: true } }),
            prisma.adminFee.findMany({ select: { id: true, akunId: true } })
        ])

        const accountIds = new Set(accounts.map(a => a.id))
        const accountsWithAdminFeeRecord = new Set(adminFees.map(af => af.akunId))

        const orphanedRecurringIds = recurring.filter(r => !accountIds.has(r.akunId)).map(r => r.id)
        const orphanedCicilanIds = cicilan.filter(c => !accountIds.has(c.akunKreditId)).map(c => c.id)
        const accountsToFixIds = accounts.filter(a => a.biayaAdminAktif && !accountsWithAdminFeeRecord.has(a.id)).map(a => a.id)

        let fixedCount = 0

        await prisma.$transaction(async (tx) => {
            if (orphanedRecurringIds.length > 0) {
                const res = await tx.recurringTransaction.deleteMany({
                    where: { id: { in: orphanedRecurringIds } }
                })
                fixedCount += res.count
            }

            if (orphanedCicilanIds.length > 0) {
                const res = await tx.rencanaCicilan.deleteMany({
                    where: { id: { in: orphanedCicilanIds } }
                })
                fixedCount += res.count
            }

            if (accountsToFixIds.length > 0) {
                const res = await tx.akun.updateMany({
                    where: { id: { in: accountsToFixIds } },
                    data: {
                        biayaAdminAktif: false,
                        biayaAdminNominal: null,
                        biayaAdminPola: null,
                        biayaAdminTanggal: null
                    }
                })
                fixedCount += res.count
            }
        })

        await logSistem("INFO", "INTEGRITY", `Integritas database diperbaiki: ${fixedCount} record disinkronkan/dihapus`)
        
        revalidatePath("/")
        revalidatePath("/akun")
        revalidatePath("/recurring")
        revalidatePath("/cicilan")

        return { success: true, fixedCount }
    } catch (error) {
        await logSistem("ERROR", "INTEGRITY", "Gagal memperbaiki integritas database", (error as Error).stack)
        return { success: false, error: "Gagal memperbaiki integritas database" }
    }
}

// ==========================================
// BALANCE VERIFICATION TOOL
// ==========================================

export interface AccountBalanceError {
    id: string
    nama: string
    tipe: string
    expected: number // Float
    actual: number   // Float
    difference: number // Float
}

export async function verifyAccountBalances() {
    try {
        const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]
        
        // 1. Get all relevant accounts
        const accounts = await prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } }
        })

        const errors: AccountBalanceError[] = []

        // 2. Iterate and check
        for (const account of accounts) {
            // Sum Debits (Incoming for Asset accounts, Outgoing for Expense accounts - but here we only check USER ACCOUNTS)
            // For USER ACCOUNTS (Asset/Liability):
            // Debit = Tambah Saldo (Uang Masuk ke Akun)
            // Kredit = Kurang Saldo (Uang Keluar dari Akun)
            
            // Wait, standard accounting:
            // Asset (Bank): Debit increases, Credit decreases.
            // Liability (CC): Credit increases liability (balance becomes more negative?), Debit decreases liability.
            
            // In Dompetku DB Schema "saldoSekarang" seems to be treated as a signed integer.
            // Transaksi logic:
            // debitAkun: saldoSekarang increment
            // kreditAkun: saldoSekarang decrement
            
            // So for ANY account type in this system:
            // Expected = SaldoAwal + Sum(Debit) - Sum(Kredit)
            
            const [debitAgg, kreditAgg] = await Promise.all([
                prisma.transaksi.aggregate({
                    where: { debitAkunId: account.id },
                    _sum: { nominal: true }
                }),
                prisma.transaksi.aggregate({
                    where: { kreditAkunId: account.id },
                    _sum: { nominal: true }
                })
            ])
            
            const totalDebit = debitAgg._sum.nominal || BigInt(0)
            const totalKredit = kreditAgg._sum.nominal || BigInt(0)
            
            const expectedBalance = account.saldoAwal + totalDebit - totalKredit
            const actualBalance = account.saldoSekarang
            
            if (expectedBalance !== actualBalance) {
                errors.push({
                    id: account.id,
                    nama: account.nama,
                    tipe: account.tipe,
                    expected: Money.toFloat(Number(expectedBalance)),
                    actual: Money.toFloat(Number(actualBalance)),
                    difference: Money.toFloat(Number(expectedBalance - actualBalance))
                })
            }
        }

        return { success: true, isValid: errors.length === 0, errors }
    } catch (error) {
        await logSistem("ERROR", "INTEGRITY", "Gagal memverifikasi saldo akun", (error as Error).stack)
        return { success: false, error: "Gagal memverifikasi saldo" }
    }
}

export async function fixAccountBalance(accountId: string) {
    try {
        // Recalculate to be safe
        const account = await prisma.akun.findUnique({
            where: { id: accountId }
        })

        if (!account) return { success: false, error: "Akun tidak ditemukan" }

        const [debitAgg, kreditAgg] = await Promise.all([
            prisma.transaksi.aggregate({
                where: { debitAkunId: accountId },
                _sum: { nominal: true }
            }),
            prisma.transaksi.aggregate({
                where: { kreditAkunId: accountId },
                _sum: { nominal: true }
            })
        ])

        const totalDebit = debitAgg._sum.nominal || BigInt(0)
        const totalKredit = kreditAgg._sum.nominal || BigInt(0)
        
        const expectedBalance = account.saldoAwal + totalDebit - totalKredit
        const oldBalance = account.saldoSekarang

        if (expectedBalance === oldBalance) {
            return { success: true, message: "Saldo sudah sesuai" }
        }

        // Update
        await prisma.akun.update({
            where: { id: accountId },
            data: { saldoSekarang: expectedBalance }
        })

        // Audit Log
        const oldFloat = Money.toFloat(Number(oldBalance)).toLocaleString('id-ID')
        const newFloat = Money.toFloat(Number(expectedBalance)).toLocaleString('id-ID')
        
        await logSistem("WARN", "INTEGRITY", 
            `Auto-Fix Balance: ${account.nama} updated from ${oldFloat} to ${newFloat}`)
        
        revalidatePath("/pengaturan/verify-balance")
        revalidatePath("/akun")
        
        return { success: true, message: "Saldo berhasil diperbaiki" }

    } catch (error) {
        await logSistem("ERROR", "INTEGRITY", "Gagal memperbaiki saldo akun", (error as Error).stack)
        return { success: false, error: "Gagal memperbaiki saldo" }
    }
}
