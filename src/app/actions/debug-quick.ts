"use server"

import prisma from "@/lib/prisma"
import { calculateNextBillingDate } from "@/lib/template-utils"

// Quick debug to understand why 0 accounts are processed
export async function quickDebugAdminFee() {
    const today = new Date()
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    // Step 1: Get ALL Bank/E-Wallet accounts
    const allAccounts = await prisma.akun.findMany({
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
        }
    })

    // Step 2: Filter accounts with biayaAdminAktif = true
    const activeAccounts = allAccounts.filter(a => a.biayaAdminAktif)

    // Step 3: Check each active account
    const analysis = activeAccounts.map(akun => {
        const billingDate = calculateNextBillingDate(
            akun.biayaAdminPola || 'FIXED_DATE',
            akun.biayaAdminTanggal || 1,
            new Date(today.getFullYear(), today.getMonth(), 1)
        )

        const lastChargeStr = akun.lastAdminChargeDate
            ? `${akun.lastAdminChargeDate.getFullYear()}-${String(akun.lastAdminChargeDate.getMonth() + 1).padStart(2, '0')}`
            : null

        const issues: string[] = []
        if (!akun.biayaAdminNominal) issues.push("Tidak ada nominal")
        if (billingDate > today) issues.push(`Tanggal belum tiba (${billingDate.toLocaleDateString('id-ID')})`)
        if (lastChargeStr === currentMonthStr) issues.push("Sudah diproses bulan ini")

        return {
            nama: akun.nama,
            nominal: akun.biayaAdminNominal,
            pola: akun.biayaAdminPola,
            tanggalPola: akun.biayaAdminTanggal,
            calculatedBillingDate: billingDate.toLocaleDateString('id-ID'),
            lastCharged: lastChargeStr,
            willProcess: issues.length === 0,
            issues
        }
    })

    const recent5Logs = await prisma.logSistem.findMany({
        where: { modul: "AUTOMASI" },
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    return {
        today: today.toISOString(),
        currentMonth: currentMonthStr,
        totalBankEWallet: allAccounts.length,
        withAdminFeeActive: activeAccounts.length,
        willBeProcessed: analysis.filter(a => a.willProcess).length,
        accounts: analysis,
        recentLogs: recent5Logs
    }
}
