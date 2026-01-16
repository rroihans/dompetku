"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

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