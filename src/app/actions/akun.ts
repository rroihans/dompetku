"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

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

        const dataMapped = akuns.map(akun => ({
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
        }))

        return {
            data: dataMapped,
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
        const akuns = await prisma.akun.findMany({
            where: {
                tipe: { in: USER_ACCOUNT_TYPES }
            },
            orderBy: { createdAt: "desc" },
        })

        return akuns.map(akun => ({
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
        }))
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
    templateId?: string | null
    templateSource?: string | null
    biayaAdminAktif?: boolean
    biayaAdminNominal?: number | null
    biayaAdminPola?: string | null
    biayaAdminTanggal?: number | null
    bungaAktif?: boolean
    bungaTiers?: string | null
    setoranAwal?: number | null
    icon?: string
    warna?: string
    // Credit Card fields (v0.5.0)
    isSyariah?: boolean | null
    billingDate?: number | null
    dueDate?: number | null
    minPaymentFixed?: number | null
    minPaymentPercent?: number | null
    minInstallmentAmount?: number | null
    useDecimalFormat?: boolean
}) {
    try {
        // Validasi nama unik
        const existingAkun = await prisma.akun.findFirst({
            where: { nama: data.nama }
        })

        if (existingAkun) {
            return { success: false, error: `Akun dengan nama "${data.nama}" sudah ada` }
        }

        const saldoAwalInt = BigInt(Money.fromFloat(data.saldoAwal))
        const limitKreditInt = data.limitKredit ? BigInt(Money.fromFloat(data.limitKredit)) : null
        const setoranAwalInt = data.setoranAwal ? BigInt(Money.fromFloat(data.setoranAwal)) : null
        const minPaymentFixedInt = data.minPaymentFixed ? BigInt(Money.fromFloat(data.minPaymentFixed)) : null
        const minInstallmentAmountInt = data.minInstallmentAmount ? BigInt(Money.fromFloat(data.minInstallmentAmount)) : null

        const akun = await prisma.akun.create({
            data: {
                ...data,
                // Int mappings (Single Source)
                saldoAwal: saldoAwalInt,
                saldoSekarang: saldoAwalInt, // Start same as saldoAwal
                limitKredit: limitKreditInt,
                setoranAwal: setoranAwalInt,
                minPaymentFixed: minPaymentFixedInt,
                minInstallmentAmount: minInstallmentAmountInt,

                settingsLastModified: new Date(),
            },
        })

        await logSistem("INFO", "AKUN", `Akun baru dibuat: ${akun.nama}`)
        revalidatePath("/akun")
        revalidatePath("/")
        
        // Map back to float for return
        const mappedAkun = {
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
        }
        
        return { success: true, data: mappedAkun }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal membuat akun baru", (error as Error).stack)
        return { success: false, error: "Gagal membuat akun baru" }
    }
}

export async function updateAkun(id: string, data: {
    nama?: string
    tipe?: string
    limitKredit?: number
    templateId?: string | null
    templateSource?: string | null
    biayaAdminAktif?: boolean
    biayaAdminNominal?: number | null
    biayaAdminPola?: string | null
    biayaAdminTanggal?: number | null
    bungaAktif?: boolean
    bungaTiers?: string | null
    templateOverrides?: string | null
    setoranAwal?: number | null
    icon?: string
    warna?: string
    // Credit Card fields (v0.5.0)
    isSyariah?: boolean | null
    billingDate?: number | null
    dueDate?: number | null
    minPaymentFixed?: number | null
    minPaymentPercent?: number | null
    minInstallmentAmount?: number | null
    useDecimalFormat?: boolean
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

        const updateData: any = { ...data }

        if (data.biayaAdminAktif !== undefined || data.bungaAktif !== undefined) {
            updateData.settingsLastModified = new Date()
        }

        // Int Mappings
        if (data.limitKredit !== undefined) updateData.limitKredit = data.limitKredit ? BigInt(Money.fromFloat(data.limitKredit)) : null
        if (data.setoranAwal !== undefined) updateData.setoranAwal = data.setoranAwal ? BigInt(Money.fromFloat(data.setoranAwal)) : null
        if (data.minPaymentFixed !== undefined) updateData.minPaymentFixed = data.minPaymentFixed ? BigInt(Money.fromFloat(data.minPaymentFixed)) : null
        if (data.minInstallmentAmount !== undefined) updateData.minInstallmentAmount = data.minInstallmentAmount ? BigInt(Money.fromFloat(data.minInstallmentAmount)) : null


        const akun = await prisma.akun.update({
            where: { id },
            data: updateData,
        })

        await logSistem("INFO", "AKUN", `Akun diperbarui: ${akun.nama}`)
        revalidatePath("/akun")
        revalidatePath(`/akun/${id}`)
        revalidatePath("/")
        
        const mappedAkun = {
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
        }

        return { success: true, data: mappedAkun }
    } catch (error) {
        await logSistem("ERROR", "AKUN", "Gagal memperbarui akun", (error as Error).stack)
        return { success: false, error: "Gagal memperbarui akun" }
    }
}

export async function updateAkunSettings(id: string, settings: {
    biayaAdminAktif: boolean
    biayaAdminNominal: number | null
    biayaAdminPola: string | null
    biayaAdminTanggal: number | null
    bungaAktif: boolean
    bungaTiers: string | null
}) {
    try {
        const currentAkun = await prisma.akun.findUnique({
            where: { id },
            include: { template: true }
        })

        if (!currentAkun) return { success: false, error: "Akun tidak ditemukan" }

        // Track overrides if templateSource exists
        const overrides = currentAkun.templateOverrides ? JSON.parse(currentAkun.templateOverrides) : {}

        // Simple override tracking logic
        const timestamp = new Date().toISOString()
        overrides.history = overrides.history || []
        overrides.history.push({
            timestamp,
            changes: settings
        })

        // Limit history to last 10 changes
        if (overrides.history.length > 10) {
            overrides.history = overrides.history.slice(-10)
        }

        const updated = await prisma.akun.update({
            where: { id },
            data: {
                ...settings,
                templateOverrides: JSON.stringify(overrides),
                settingsLastModified: new Date()
            }
        })

        await logSistem("INFO", "AKUN", `Pengaturan akun "${updated.nama}" diperbarui`)
        revalidatePath(`/akun/${id}`)
        
         const mappedAkun = {
            ...updated,
            saldoSekarang: Money.toFloat(Number(updated.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(updated.saldoAwal)),
            limitKredit: updated.limitKredit ? Money.toFloat(Number(updated.limitKredit)) : null,
        }
        
        return { success: true, data: mappedAkun }
    } catch (error) {
        await logSistem("ERROR", "AKUN", `Gagal memperbarui pengaturan akun ${id}`, (error as Error).stack)
        return { success: false, error: "Gagal memperbarui pengaturan" }
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
        const akun = await prisma.akun.findUnique({
            where: { id }
        })
        if (!akun) return null
        
        return {
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
            setoranAwal: akun.setoranAwal ? Money.toFloat(Number(akun.setoranAwal)) : null,
            minPaymentFixed: akun.minPaymentFixed ? Money.toFloat(Number(akun.minPaymentFixed)) : null,
            minInstallmentAmount: akun.minInstallmentAmount ? Money.toFloat(Number(akun.minInstallmentAmount)) : null,
        }
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
            where: { id },
            include: { template: true }
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
        
        // Map recent transactions
        const recentMapped = recentTransactions.map(tx => ({
            ...tx,
            nominal: Money.toFloat(Number(tx.nominal))
        }))

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

        // Calculate running balance using BigInt (Source of Truth: Int)
        let runningBalanceInt = akun.saldoAwal // BigInt
        
        const debitSum = pastDebit._sum.nominal ?? BigInt(0)
        const kreditSum = pastKredit._sum.nominal ?? BigInt(0)
        
        runningBalanceInt = runningBalanceInt + debitSum - kreditSum
        
        // let runningBalance = Money.toFloat(Number(runningBalanceInt))

        const dailyTransactions = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startDate, lte: now },
                OR: [{ debitAkunId: id }, { kreditAkunId: id }]
            },
            select: { tanggal: true, nominal: true, debitAkunId: true },
            orderBy: { tanggal: 'asc' }
        })

        const dailyMutations: Record<string, bigint> = {}
        for (const tx of dailyTransactions) {
            const dateStr = tx.tanggal.toISOString().split('T')[0]
            // Nominal is BigInt
            const mutation = tx.debitAkunId === id ? tx.nominal : -tx.nominal
            dailyMutations[dateStr] = (dailyMutations[dateStr] || BigInt(0)) + mutation
        }

        const trendData = []
        for (let i = 0; i <= days; i++) {
            const targetDate = new Date(startDate)
            targetDate.setDate(startDate.getDate() + i)
            const dateStr = targetDate.toISOString().split('T')[0]

            runningBalanceInt += (dailyMutations[dateStr] || BigInt(0))
            trendData.push({ 
                tanggal: dateStr, 
                saldo: Money.toFloat(Number(runningBalanceInt)) 
            })
        }
        
        const akunMapped = {
            ...akun,
            saldoSekarang: Money.toFloat(Number(akun.saldoSekarang)),
            saldoAwal: Money.toFloat(Number(akun.saldoAwal)),
            limitKredit: akun.limitKredit ? Money.toFloat(Number(akun.limitKredit)) : null,
            setoranAwal: akun.setoranAwal ? Money.toFloat(Number(akun.setoranAwal)) : null,
            minPaymentFixed: akun.minPaymentFixed ? Money.toFloat(Number(akun.minPaymentFixed)) : null,
            minInstallmentAmount: akun.minInstallmentAmount ? Money.toFloat(Number(akun.minInstallmentAmount)) : null,
        }

        return {
            success: true,
            data: {
                akun: akunMapped,
                recentTransactions: recentMapped,
                trendData
            }
        }
    } catch (error) {
        await logSistem("ERROR", "AKUN", `Gagal mengambil detail akun ${id}`, (error as Error).stack)
        return { success: false, error: "Gagal mengambil detail akun" }
    }
}