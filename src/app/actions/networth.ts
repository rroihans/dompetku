"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { Money } from "@/lib/money"

// ============================================
// NET WORTH TRACKING
// ============================================

const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

export interface NetWorthData {
    tanggal: Date
    totalAset: number
    totalHutang: number
    totalCicilan: number
    netWorth: number
    breakdown: Record<string, number>
}

// Hitung net worth saat ini
export async function calculateCurrentNetWorth(): Promise<NetWorthData> {
    try {
        const akuns = await prisma.akun.findMany({
            where: { tipe: { in: USER_ACCOUNT_TYPES } }
        })

        // Hitung total per tipe
        const breakdown: Record<string, number> = {}
        let totalAset = 0
        let totalHutang = 0
        let totalCicilan = 0

        for (const akun of akuns) {
            if (!breakdown[akun.tipe]) {
                breakdown[akun.tipe] = 0
            }
            const saldo = Money.toFloat(Number(akun.saldoSekarang))
            breakdown[akun.tipe] += saldo

            if (akun.tipe === "CREDIT_CARD") {
                // Kartu kredit: saldo negatif = hutang
                if (saldo < 0) {
                    totalHutang += Math.abs(saldo)
                }
            } else {
                // Aset normal
                if (saldo > 0) {
                    totalAset += saldo
                }
            }
        }

        // Hitung hutang cicilan aktif (untuk informasi saja, tidak ditambahkan ke totalHutang)
        const cicilanAktif = await prisma.rencanaCicilan.findMany({
            where: { status: "AKTIF" }
        })

        for (const cicilan of cicilanAktif) {
            const sisaBulan = cicilan.tenor - cicilan.cicilanKe + 1
            const nominal = Money.toFloat(Number(cicilan.nominalPerBulan))
            const sisaHutang = nominal * sisaBulan
            totalCicilan += sisaHutang
        }

        const netWorth = totalAset - totalHutang

        return {
            tanggal: new Date(),
            totalAset,
            totalHutang,
            totalCicilan,
            netWorth,
            breakdown
        }
    } catch (error) {
        console.error("Error calculating net worth:", error)
        return {
            tanggal: new Date(),
            totalAset: 0,
            totalHutang: 0,
            totalCicilan: 0,
            netWorth: 0,
            breakdown: {}
        }
    }
}

// Simpan snapshot net worth (bisa dipanggil daily via cron atau real-time)
export async function saveNetWorthSnapshot() {
    try {
        const data = await calculateCurrentNetWorth()

        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        
        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        // Cari snapshot hari ini untuk di-upsert
        const existingSnapshot = await prisma.netWorthSnapshot.findFirst({
            where: {
                tanggal: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        let snapshot
        if (existingSnapshot) {
            snapshot = await prisma.netWorthSnapshot.update({
                where: { id: existingSnapshot.id },
                data: {
                    totalAset: data.totalAset,
                    totalHutang: data.totalHutang,
                    netWorth: data.netWorth,
                    breakdown: JSON.stringify(data.breakdown),
                    tanggal: new Date() // Refresh timestamp ke detik terbaru
                }
            })
        } else {
            snapshot = await prisma.netWorthSnapshot.create({
                data: {
                    tanggal: data.tanggal,
                    totalAset: data.totalAset,
                    totalHutang: data.totalHutang,
                    netWorth: data.netWorth,
                    breakdown: JSON.stringify(data.breakdown)
                }
            })
        }

        await logSistem("INFO", "NETWORTH", `Snapshot ${existingSnapshot ? 'diperbarui' : 'disimpan'}: ${data.netWorth}`)
        return { success: true, data: snapshot }
    } catch (error) {
        await logSistem("ERROR", "NETWORTH", "Gagal menyimpan snapshot", (error as Error).stack)
        return { success: false, error: "Gagal menyimpan snapshot" }
    }
}

// Ambil histori net worth untuk chart
export async function getNetWorthHistory(days: number = 30) {
    try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)

        let snapshots = await prisma.netWorthSnapshot.findMany({
            where: {
                tanggal: { gte: startDate }
            },
            orderBy: { tanggal: "asc" }
        })

        // Jika tidak ada snapshot, buat satu untuk hari ini
        if (snapshots.length === 0) {
            await saveNetWorthSnapshot()
            snapshots = await prisma.netWorthSnapshot.findMany({
                where: {
                    tanggal: { gte: startDate }
                },
                orderBy: { tanggal: "asc" }
            })
        }

        // Parse breakdown JSON
        const parsed = snapshots.map(s => ({
            ...s,
            breakdown: s.breakdown ? JSON.parse(s.breakdown) : {}
        }))

        return { success: true, data: parsed }
    } catch (error) {
        return { success: false, data: [] }
    }
}

// Ambil perubahan net worth
export async function getNetWorthChange() {
    try {
        const current = await calculateCurrentNetWorth()

        // Ambil snapshot 30 hari lalu
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const oldSnapshot = await prisma.netWorthSnapshot.findFirst({
            where: {
                tanggal: { lte: thirtyDaysAgo }
            },
            orderBy: { tanggal: "desc" }
        })

        const change = oldSnapshot ? current.netWorth - oldSnapshot.netWorth : 0
        const changePercent = oldSnapshot && oldSnapshot.netWorth !== 0
            ? ((current.netWorth - oldSnapshot.netWorth) / Math.abs(oldSnapshot.netWorth)) * 100
            : 0

        return {
            success: true,
            data: {
                current: current.netWorth,
                previous: oldSnapshot?.netWorth || current.netWorth,
                change,
                changePercent: Math.round(changePercent * 10) / 10,
                totalAset: current.totalAset,
                totalHutang: current.totalHutang,
                totalCicilan: current.totalCicilan,
                breakdown: current.breakdown
            }
        }
    } catch (error) {
        return {
            success: false,
            data: {
                current: 0,
                previous: 0,
                change: 0,
                changePercent: 0,
                totalAset: 0,
                totalHutang: 0,
                totalCicilan: 0,
                breakdown: {}
            }
        }
    }
}
