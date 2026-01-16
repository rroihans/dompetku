"use server"

import prisma from "@/lib/prisma"

const PAGE_SIZE = 50 // Limit per halaman untuk keamanan

export async function getAkunData(page: number = 1) {
    const skip = (page - 1) * PAGE_SIZE

    const [data, total] = await Promise.all([
        prisma.akun.findMany({
            take: PAGE_SIZE,
            skip,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.akun.count()
    ])

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    }
}

export async function getTransaksiData(page: number = 1) {
    const skip = (page - 1) * PAGE_SIZE

    const [data, total] = await Promise.all([
        prisma.transaksi.findMany({
            take: PAGE_SIZE,
            skip,
            orderBy: { tanggal: 'desc' },
            include: {
                debitAkun: { select: { nama: true, tipe: true } },
                kreditAkun: { select: { nama: true, tipe: true } }
            }
        }),
        prisma.transaksi.count()
    ])

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    }
}

export async function getRecurringData(page: number = 1) {
    const skip = (page - 1) * PAGE_SIZE

    const [data, total] = await Promise.all([
        prisma.recurringTransaction.findMany({
            take: PAGE_SIZE,
            skip,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.recurringTransaction.count()
    ])

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    }
}

export async function getLogData(page: number = 1, module?: string) {
    const skip = (page - 1) * PAGE_SIZE

    const where = module ? { modul: module } : {}

    const [data, total] = await Promise.all([
        prisma.logSistem.findMany({
            where,
            take: PAGE_SIZE,
            skip,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.logSistem.count({ where })
    ])

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    }
}

export async function getAppSettingsData(page: number = 1) {
    const skip = (page - 1) * PAGE_SIZE

    const [data, total] = await Promise.all([
        prisma.appSetting.findMany({
            take: PAGE_SIZE,
            skip,
            orderBy: { kunci: 'asc' }
        }),
        prisma.appSetting.count()
    ])

    return {
        data,
        pagination: {
            page,
            pageSize: PAGE_SIZE,
            total,
            totalPages: Math.ceil(total / PAGE_SIZE)
        }
    }
}

export async function getDatabaseStats() {
    const USER_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

    const [akunTotal, akunUser, transaksiCount, recurringCount, logCount, settingCount] = await Promise.all([
        prisma.akun.count(),
        prisma.akun.count({ where: { tipe: { in: USER_TYPES } } }),
        prisma.transaksi.count(),
        prisma.recurringTransaction.count(),
        prisma.logSistem.count(),
        prisma.appSetting.count()
    ])

    return {
        akun: akunTotal,
        akunUser: akunUser,
        akunInternal: akunTotal - akunUser,
        transaksi: transaksiCount,
        recurring: recurringCount,
        log: logCount,
        setting: settingCount
    }
}

export async function pruneOldLogs(days: number = 30) {
    try {
        const thresholdDate = new Date()
        thresholdDate.setDate(thresholdDate.getDate() - days)

        const result = await prisma.logSistem.deleteMany({
            where: {
                createdAt: {
                    lt: thresholdDate
                }
            }
        })

        if (result.count > 0) {
            console.log(`[SYSTEM] Pruned ${result.count} old system logs (older than ${days} days)`)
        }

        return { success: true, count: result.count }
    } catch (error) {
        console.error("Failed to prune logs:", error)
        return { success: false, error: "Gagal menghapus log lama" }
    }
}
