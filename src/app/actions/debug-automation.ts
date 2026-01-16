"use server"

import prisma from "@/lib/prisma"

// Debug function to check automation status
export async function debugAutomationStatus() {
    try {
        const today = new Date()

        // Get all Bank/E-Wallet accounts
        const accounts = await prisma.akun.findMany({
            where: {
                tipe: { in: ['BANK', 'E_WALLET'] }
            },
            select: {
                id: true,
                nama: true,
                tipe: true,
                biayaAdminAktif: true,
                biayaAdminNominal: true,
                biayaAdminPola: true,
                biayaAdminTanggal: true,
                lastAdminChargeDate: true,
                bungaAktif: true,
                bungaTiers: true,
                lastInterestCreditDate: true,
            }
        })

        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

        const analysis = accounts.map(akun => {
            const lastChargeStr = akun.lastAdminChargeDate
                ? `${akun.lastAdminChargeDate.getFullYear()}-${String(akun.lastAdminChargeDate.getMonth() + 1).padStart(2, '0')}`
                : null

            const lastInterestStr = akun.lastInterestCreditDate
                ? `${akun.lastInterestCreditDate.getFullYear()}-${String(akun.lastInterestCreditDate.getMonth() + 1).padStart(2, '0')}`
                : null

            return {
                nama: akun.nama,
                tipe: akun.tipe,
                adminFee: {
                    aktif: akun.biayaAdminAktif,
                    nominal: akun.biayaAdminNominal,
                    pola: akun.biayaAdminPola,
                    tanggal: akun.biayaAdminTanggal,
                    lastCharged: lastChargeStr,
                    alreadyChargedThisMonth: lastChargeStr === currentMonthStr,
                    willProcess: akun.biayaAdminAktif && akun.biayaAdminNominal && lastChargeStr !== currentMonthStr
                },
                interest: {
                    aktif: akun.bungaAktif,
                    hasTiers: !!akun.bungaTiers,
                    lastCredited: lastInterestStr,
                }
            }
        })

        // Get last 10 automation logs
        const logs = await prisma.logSistem.findMany({
            where: {
                modul: "AUTOMASI"
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        return {
            success: true,
            currentMonth: currentMonthStr,
            totalAccounts: accounts.length,
            withAdminFeeActive: accounts.filter(a => a.biayaAdminAktif).length,
            withInterestActive: accounts.filter(a => a.bungaAktif).length,
            accounts: analysis,
            recentLogs: logs.map(l => ({
                level: l.level,
                pesan: l.pesan,
                createdAt: l.createdAt
            }))
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
