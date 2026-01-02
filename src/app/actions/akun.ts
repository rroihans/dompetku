"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

// Tipe akun yang ditampilkan ke user (bukan internal)
const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

// Untuk pagination
const PAGE_SIZE = 8

// Mendapatkan akun user (bukan akun kategori internal)
export async function getAkunUser(page: number = 1) {
    try {
        const skip = (page - 1) * PAGE_SIZE

        const [akuns, total] = await Promise.all([
            prisma.akun.findMany({
                where: {
                    tipe: { in: USER_ACCOUNT_TYPES }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: PAGE_SIZE,
            }),
            prisma.akun.count({
                where: {
                    tipe: { in: USER_ACCOUNT_TYPES }
                }
            }),
        ])

        return {
            data: akuns,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE),
            },
        }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal mengambil data akun user", (error as Error).stack)
        throw new Error("Gagal mengambil data akun")
    }
}

// Mendapatkan semua akun (termasuk internal) - untuk dropdown, dll
export async function getAkun() {
    try {
        return await prisma.akun.findMany({
            where: {
                tipe: { in: USER_ACCOUNT_TYPES }
            },
            orderBy: { createdAt: "desc" },
        })
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal mengambil data akun", (error as Error).stack)
        throw new Error("Gagal mengambil data akun")
    }
}

export async function createAkun(data: {
    nama: string
    tipe: string
    saldoAwal: number
    limitKredit?: number
    icon?: string
    warna?: string
}) {
    try {
        // Validasi nama unik
        const existingAkun = await prisma.akun.findFirst({
            where: { nama: data.nama }
        })

        if (existingAkun) {
            return { success: false, error: `Akun dengan nama "${data.nama}" sudah ada` }
        }

        const akun = await prisma.akun.create({
            data: {
                ...data,
                saldoSekarang: data.saldoAwal,
            },
        })

        await logSistem("INFO", "AKUN", `Akun baru dibuat: ${akun.nama}`)
        revalidatePath("/akun")
        revalidatePath("/")
        return { success: true, data: akun }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal membuat akun baru", (error as Error).stack)
        return { success: false, error: "Gagal membuat akun baru" }
    }
}

export async function updateAkun(id: string, data: {
    nama?: string
    tipe?: string
    limitKredit?: number
    icon?: string
    warna?: string
}) {
    try {
        // Validasi nama unik (jika nama berubah)
        if (data.nama) {
            const existingAkun = await prisma.akun.findFirst({
                where: {
                    nama: data.nama,
                    NOT: { id } // Exclude current akun
                }
            })

            if (existingAkun) {
                return { success: false, error: `Akun dengan nama "${data.nama}" sudah ada` }
            }
        }

        const akun = await prisma.akun.update({
            where: { id },
            data,
        })

        await logSistem("INFO", "AKUN", `Akun diperbarui: ${akun.nama}`)
        revalidatePath("/akun")
        revalidatePath("/")
        return { success: true, data: akun }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal memperbarui akun", (error as Error).stack)
        return { success: false, error: "Gagal memperbarui akun" }
    }
}

export async function deleteAkun(id: string) {
    try {
        // Cek apakah ada transaksi terkait
        const transaksiCount = await prisma.transaksi.count({
            where: {
                OR: [
                    { debitAkunId: id },
                    { kreditAkunId: id },
                ]
            }
        })

        if (transaksiCount > 0) {
            return {
                success: false,
                error: `Tidak dapat menghapus akun. Masih ada ${transaksiCount} transaksi terkait.`
            }
        }

        const akun = await prisma.akun.delete({
            where: { id },
        })

        await logSistem("INFO", "AKUN", `Akun dihapus: ${akun.nama}`)
        revalidatePath("/akun")
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal menghapus akun", (error as Error).stack)
        return { success: false, error: "Gagal menghapus akun" }
    }
}

export async function getAkunById(id: string) {
    try {
        return await prisma.akun.findUnique({
            where: { id }
        })
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal mengambil detail akun", (error as Error).stack)
        return null
    }
}

export async function getAkunDetail(id: string, days: number = 30) {
    try {
        const now = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - days)
        startDate.setHours(0, 0, 0, 0)

        // 1. Ambil info akun
        const akun = await prisma.akun.findUnique({
            where: { id }
        })

        if (!akun) return { success: false, error: "Akun tidak ditemukan" }

        // 2. Ambil transaksi terakhir (spesifik untuk akun ini)
        const recentTransactions = await prisma.transaksi.findMany({
            where: {
                OR: [{ debitAkunId: id }, { kreditAkunId: id }]
            },
            orderBy: { tanggal: 'desc' },
            take: 10,
            include: {
                debitAkun: { select: { nama: true, tipe: true } },
                kreditAkun: { select: { nama: true, tipe: true } }
            }
        })

        // 3. Kalkulasi Trend Saldo Akun ini
        const [pastDebit, pastKredit] = await Promise.all([
            prisma.transaksi.aggregate({
                where: { tanggal: { lt: startDate }, debitAkunId: id },
                _sum: { nominal: true }
            }),
            prisma.transaksi.aggregate({
                where: { tanggal: { lt: startDate }, kreditAkunId: id },
                _sum: { nominal: true }
            })
        ])

        let runningBalance = akun.saldoAwal + (pastDebit._sum.nominal || 0) - (pastKredit._sum.nominal || 0)

        const dailyTransactions = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startDate, lte: now },
                OR: [{ debitAkunId: id }, { kreditAkunId: id }]
            },
            select: { tanggal: true, nominal: true, debitAkunId: true },
            orderBy: { tanggal: 'asc' }
        })

        const dailyMutations: Record<string, number> = {}
        for (const tx of dailyTransactions) {
            const dateStr = tx.tanggal.toISOString().split('T')[0]
            const mutation = tx.debitAkunId === id ? tx.nominal : -tx.nominal
            dailyMutations[dateStr] = (dailyMutations[dateStr] || 0) + mutation
        }

        const trendData = []
        for (let i = 0; i <= days; i++) {
            const targetDate = new Date(startDate)
            targetDate.setDate(startDate.getDate() + i)
            const dateStr = targetDate.toISOString().split('T')[0]

            runningBalance += (dailyMutations[dateStr] || 0)
            trendData.push({ tanggal: dateStr, saldo: runningBalance })
        }

        return {
            success: true,
            data: {
                akun,
                recentTransactions,
                trendData
            }
        }
    } catch (error) {
        await logSistem("ERROR", "AKUN", `Gagal mengambil detail akun ${id}`, (error as Error).stack)
        return { success: false, error: "Gagal mengambil detail akun" }
    }
}
