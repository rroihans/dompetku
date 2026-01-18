"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { saveNetWorthSnapshot } from "@/app/actions/networth"
import { createNotification } from "@/app/actions/notifications"
import { Money } from "@/lib/money"
import { ErrorMessages } from "@/lib/constants/error-messages"
import { TransaksiSchema } from "@/lib/validations/transaksi"
import { ServerActionResult } from "@/types"
import { checkBudgetAlert } from "@/lib/budget-alert"
import { buildPrismaQuery, RuleGroup } from "@/lib/query-builder"

// Untuk pagination - 25 item per halaman untuk tampilan lebih lengkap
const PAGE_SIZE = 25

// Tipe akun user
const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

/**
 * Helper to check large transactions
 */
async function checkLargeTransactionNotification(deskripsi: string, nominal: number) {
    // Threshold can be dynamic, using fixed 10M for now or should be from settings
    const THRESHOLD = 10000000 
    if (nominal >= THRESHOLD) {
        await createNotification({
            type: "LARGE_TX",
            title: "💰 Transaksi Besar Terdeteksi",
            message: `Transaksi "${deskripsi}" sebesar Rp ${nominal.toLocaleString('id-ID')} telah dicatat.`,
            severity: "INFO",
            actionUrl: "/transaksi"
        })
    }
}

interface TransaksiFilter {
    page?: number
    search?: string
    kategori?: string | string[]
    tipe?: string // "expense" | "income"
    dateFrom?: string
    dateTo?: string
    minNominal?: number
    maxNominal?: number
    sort?: string // "tanggal" | "nominal" | "kategori"
    sortDir?: string // "asc" | "desc"
    akunId?: string | string[] // Tambahkan filter akunId
    complexFilter?: string // JSON string
}

export async function getTransaksi(filters: TransaksiFilter = {}) {
    const {
        page = 1,
        search,
        kategori,
        tipe,
        dateFrom,
        dateTo,
        minNominal,
        maxNominal,
        sort = "tanggal",
        sortDir = "desc",
        akunId,
        complexFilter
    } = filters

    try {
        const skip = (page - 1) * PAGE_SIZE

        // Build where clause dynamically
        const where: any = {}

        if (akunId) {
            const akuns = Array.isArray(akunId) ? akunId : [akunId];
            if (akuns.length > 0) {
                where.OR = [
                    { debitAkunId: { in: akuns } },
                    { kreditAkunId: { in: akuns } }
                ]
            }
        }

        if (search) {
            const searchClause = [
                { deskripsi: { contains: search } },
                { kategori: { contains: search } },
                { catatan: { contains: search } },
                // Support search by akun name
                { debitAkun: { nama: { contains: search } } },
                { kreditAkun: { nama: { contains: search } } },
            ];
            
            if (where.OR) {
                where.AND = [
                    ...(where.AND || []),
                    { OR: searchClause }
                ]
            } else {
                where.OR = searchClause;
            }
        }

        if (kategori) {
            if (Array.isArray(kategori)) {
                if (kategori.length > 0) where.kategori = { in: kategori }
            } else {
                where.kategori = kategori
            }
        }

        if (tipe === "expense") {
            // Pengeluaran: debitAkun adalah EXPENSE atau kreditAkun adalah akun user
            where.debitAkun = { tipe: "EXPENSE" }
        } else if (tipe === "income") {
            // Pemasukan: kreditAkun adalah INCOME atau debitAkun adalah akun user
            where.kreditAkun = { tipe: "INCOME" }
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.tanggal = {}
            if (dateFrom) {
                where.tanggal.gte = new Date(dateFrom)
            }
            if (dateTo) {
                // Set to end of day
                const endDate = new Date(dateTo)
                endDate.setHours(23, 59, 59, 999)
                where.tanggal.lte = endDate
            }
        }

        // Nominal range filter
        if (minNominal !== undefined || maxNominal !== undefined) {
            where.nominal = {}
            if (minNominal !== undefined && minNominal > 0) {
                where.nominal.gte = BigInt(Money.fromFloat(minNominal))
            }
            if (maxNominal !== undefined && maxNominal > 0) {
                where.nominal.lte = BigInt(Money.fromFloat(maxNominal))
            }
        }

        // Complex Filter (Logic Builder)
        if (complexFilter) {
            try {
                const group = JSON.parse(complexFilter) as RuleGroup;
                const prismaQuery = buildPrismaQuery(group);
                
                if (Object.keys(prismaQuery).length > 0) {
                    if (where.AND) {
                        if (!Array.isArray(where.AND)) where.AND = [where.AND];
                        where.AND.push(prismaQuery);
                    } else {
                        where.AND = [prismaQuery];
                    }
                }
            } catch (e) {
                console.error("Invalid complex filter JSON", e);
            }
        }

        // Build orderBy
        const orderBy: any[] = []
        const validSort = ["tanggal", "nominal", "kategori"].includes(sort) ? sort : "tanggal"
        const validDir = sortDir === "asc" ? "asc" : "desc"
        
        orderBy.push({ [validSort]: validDir })
        
        // Add stable secondary sort for deterministic results
        if (validSort !== "id") {
            orderBy.push({ id: "desc" })
        }

        const [transaksi, total] = await Promise.all([
            prisma.transaksi.findMany({
                where,
                include: {
                    debitAkun: true,
                    kreditAkun: true,
                },
                orderBy,
                skip,
                take: PAGE_SIZE,
            }),
            prisma.transaksi.count({ where }),
        ])

        // Kalkulasi Running Balance jika memfilter per akun
        let dataWithBalance = transaksi.map(tx => ({
             ...tx,
             // CAST BigInt to Number (Float) for UI
             nominal: Money.toFloat(Number(tx.nominal)),
             _nominalBigInt: tx.nominal
        }))

        // Only calculate running balance if filtering by SINGLE account and sorted by date
        if (akunId && !Array.isArray(akunId) && sort === "tanggal") {
            // Ambil saldo saat ini dari akun tersebut (BigInt)
            const akun = await prisma.akun.findUnique({
                where: { id: akunId },
                select: { saldoSekarang: true }
            })

            if (akun) {
                // Convert BigInt -> Number (Float) for calculation logic
                let currentRunningBalance = Money.toFloat(Number(akun.saldoSekarang))

                // Perbaikan: Jika bukan halaman pertama, sesuaikan saldo awal running balance
                if (page > 1) {
                    const skippedTx = await prisma.transaksi.findMany({
                        where,
                        orderBy,
                        take: skip,
                        select: {
                            nominal: true, // BigInt
                            debitAkunId: true,
                        }
                    })

                    for (const tx of skippedTx) {
                        const nominal = Money.toFloat(Number(tx.nominal))
                        const isDebit = tx.debitAkunId === akunId
                        if (isDebit) {
                            currentRunningBalance -= nominal
                        } else {
                            currentRunningBalance += nominal
                        }
                    }
                }

                // Hitung mundur
                dataWithBalance = dataWithBalance.map((tx) => {
                    const txWithBalance = {
                        ...tx,
                        saldoSetelah: currentRunningBalance
                    }
                    
                    const isDebit = tx.debitAkunId === akunId
                    if (isDebit) {
                        currentRunningBalance -= tx.nominal // tx.nominal is Float here (mapped above)
                    } else {
                        currentRunningBalance += tx.nominal
                    }

                    return txWithBalance
                })
            }
        }

        return {
            data: dataWithBalance,
            pagination: {
                page,
                pageSize: PAGE_SIZE,
                total,
                totalPages: Math.ceil(total / PAGE_SIZE),
            },
        }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal mengambil data transaksi", (error as Error).stack)
        throw new Error("Gagal mengambil data transaksi")
    }
}


// Helper untuk mendapatkan atau membuat akun kategori internal
async function getOrCreateKategoriAkun(tx: any, kategori: string, tipe: "EXPENSE" | "INCOME") {
    const namaAkun = `[${tipe}] ${kategori}`

    let akun = await tx.akun.findFirst({
        where: { nama: namaAkun, tipe }
    })

    if (!akun) {
        akun = await tx.akun.create({
            data: {
                nama: namaAkun,
                tipe,
                saldoAwal: BigInt(0),
                saldoSekarang: BigInt(0),
            }
        })
    }

    return akun
}

// Interface untuk createTransaksiSimple
interface SimpleTransaksiData {
    nominal: number
    kategori: string
    akunId: string // Akun uang user (Bank, E-Wallet, dll)
    tipeTransaksi: "KELUAR" | "MASUK"
    deskripsi?: string
    tanggal?: Date // Custom date, default hari ini
    idempotencyKey?: string
}

export async function createTransaksiSimple(data: SimpleTransaksiData): Promise<ServerActionResult<any>> {
    // 1. Validation with Zod
    const validation = TransaksiSchema.safeParse({
        ...data,
        tanggal: data.tanggal || new Date()
    })

    if (!validation.success) {
        return { 
            success: false, 
            error: "Data transaksi tidak valid", 
            errors: validation.error.flatten().fieldErrors 
        }
    }

    try {
        // 2. Cek idempotency key jika ada
        if (data.idempotencyKey) {
            const existing = await prisma.transaksi.findUnique({
                where: { idempotencyKey: data.idempotencyKey }
            })
            if (existing) {
                // Convert BigInt to Float for return
                const mapped = {
                    ...existing,
                    nominal: Money.toFloat(Number(existing.nominal))
                }
                return { success: true, data: mapped, duplicated: true }
            }
        }

        // 3. Jalankan transaksi database (Atomic)
        const result = await prisma.$transaction(async (tx: any) => {
            // Ambil atau buat akun kategori internal
            const kategoriTipe = data.tipeTransaksi === "KELUAR" ? "EXPENSE" : "INCOME"
            const kategoriAkun = await getOrCreateKategoriAkun(tx, data.kategori, kategoriTipe)

            const debitAkunId = data.tipeTransaksi === "KELUAR" ? kategoriAkun.id : data.akunId
            const kreditAkunId = data.tipeTransaksi === "KELUAR" ? data.akunId : kategoriAkun.id

            const nominalInt = BigInt(Money.fromFloat(data.nominal))

            // Buat record transaksi
            const transaksi = await tx.transaksi.create({
                data: {
                    deskripsi: data.deskripsi || data.kategori,
                    nominal: nominalInt, // BigInt
                    kategori: data.kategori,
                    debitAkunId,
                    kreditAkunId,
                    tanggal: data.tanggal || new Date(),
                    idempotencyKey: data.idempotencyKey,
                },
            })

            // Update saldo akun debit (bertambah)
            await tx.akun.update({
                where: { id: debitAkunId },
                data: { 
                    saldoSekarang: { increment: nominalInt } // BigInt
                }
            })

            // Update saldo akun kredit (berkurang)
            await tx.akun.update({
                where: { id: kreditAkunId },
                data: { 
                    saldoSekarang: { decrement: nominalInt } // BigInt
                }
            })

            return transaksi
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi baru dicatat: ${result.deskripsi}`)
        
        // Trigger non-blocking checks
        const alertResult = await checkBudgetAlert(data.kategori, data.tanggal || new Date())
        
        void checkLargeTransactionNotification(data.deskripsi || data.kategori, data.nominal)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        const mappedResult = {
            ...result,
            nominal: Money.toFloat(Number(result.nominal))
        }

        return { success: true, data: mappedResult, alert: alertResult }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal mencatat transaksi", (error as Error).stack)
        return { success: false, error: ErrorMessages.GENERAL_ERROR }
    }
}

// Legacy function untuk backward compatibility
export async function createTransaksi(data: {
    deskripsi: string
    nominal: number
    kategori: string
    debitAkunId: string
    kreditAkunId: string
    tanggal?: Date
    catatan?: string
    idempotencyKey?: string
}): Promise<ServerActionResult<any>> {
    // Basic validation
    if (data.nominal <= 0) {
        return { success: false, error: ErrorMessages.INVALID_AMOUNT(data.nominal) }
    }

    try {
        if (data.idempotencyKey) {
            const existing = await prisma.transaksi.findUnique({
                where: { idempotencyKey: data.idempotencyKey }
            })
            if (existing) {
                 const mapped = {
                    ...existing,
                    nominal: Money.toFloat(Number(existing.nominal))
                }
                return { success: true, data: mapped, duplicated: true }
            }
        }

        const nominalInt = BigInt(Money.fromFloat(data.nominal))

        const result = await prisma.$transaction(async (tx: any) => {
            const transaksi = await tx.transaksi.create({
                data: {
                    deskripsi: data.deskripsi,
                    nominal: nominalInt, // BigInt
                    kategori: data.kategori,
                    debitAkunId: data.debitAkunId,
                    kreditAkunId: data.kreditAkunId,
                    tanggal: data.tanggal ?? new Date(),
                    catatan: data.catatan,
                    idempotencyKey: data.idempotencyKey,
                },
            })

            await tx.akun.update({
                where: { id: data.debitAkunId },
                data: { 
                    saldoSekarang: { increment: nominalInt }
                }
            })

            await tx.akun.update({
                where: { id: data.kreditAkunId },
                data: { 
                    saldoSekarang: { decrement: nominalInt }
                }
            })

            return transaksi
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi baru dicatat: ${result.deskripsi}`)
        
        // Trigger checks
        const alertResult = await checkBudgetAlert(data.kategori, data.tanggal || new Date())
        
        void checkLargeTransactionNotification(data.deskripsi || data.kategori, data.nominal)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        const mappedResult = {
            ...result,
            nominal: Money.toFloat(Number(result.nominal))
        }

        return { success: true, data: mappedResult, alert: alertResult }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal mencatat transaksi", (error as Error).stack)
        return { success: false, error: ErrorMessages.GENERAL_ERROR }
    }
}

export async function deleteTransaksi(id: string): Promise<ServerActionResult<void>> {
    try {
        // Ambil data transaksi terlebih dahulu
        const transaksi = await prisma.transaksi.findUnique({
            where: { id },
            include: {
                debitAkun: true,
                kreditAkun: true,
            }
        })

        if (!transaksi) {
            return { success: false, error: "Transaksi tidak ditemukan" }
        }

        // Jalankan penghapusan dengan rollback saldo (Atomic)
        await prisma.$transaction(async (tx: any) => {
            // transaksi.nominal is BigInt
            const nominalInt = transaksi.nominal

            // Rollback saldo: kebalikan dari create
            // Debit akun: kurangi (sebelumnya ditambah)
            await tx.akun.update({
                where: { id: transaksi.debitAkunId },
                data: { 
                    saldoSekarang: { decrement: nominalInt }
                }
            })

            // Kredit akun: tambah (sebelumnya dikurangi)
            await tx.akun.update({
                where: { id: transaksi.kreditAkunId },
                data: { 
                    saldoSekarang: { increment: nominalInt }
                }
            })

            // Hapus transaksi
            await tx.transaksi.delete({
                where: { id }
            })
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi dihapus: ${transaksi.deskripsi}`)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        return { success: true, data: undefined }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal menghapus transaksi", (error as Error).stack)
        return { success: false, error: ErrorMessages.GENERAL_ERROR }
    }
}

export async function updateTransaksi(id: string, data: {
    deskripsi?: string
    kategori?: string
    catatan?: string
    nominal?: number // Support edit nominal
}): Promise<ServerActionResult<any>> {
    try {
        // Jika nominal berubah, perlu adjust saldo akun
        if (data.nominal !== undefined) {
            
            if (data.nominal <= 0) {
                return { success: false, error: ErrorMessages.INVALID_AMOUNT(data.nominal) }
            }

            // Ambil transaksi lama
            const oldTransaksi = await prisma.transaksi.findUnique({
                where: { id },
            })

            if (!oldTransaksi) {
                return { success: false, error: "Transaksi tidak ditemukan" }
            }

            // Calculate Int diff
            const oldNominalInt = oldTransaksi.nominal // BigInt
            const newNominalInt = BigInt(Money.fromFloat(data.nominal))
            const selisihInt = newNominalInt - oldNominalInt

            // Jalankan dalam transaction
            const transaksi = await prisma.$transaction(async (tx: any) => {
                // Update saldo akun sesuai selisih
                // Debit akun: tambah selisih
                await tx.akun.update({
                    where: { id: oldTransaksi.debitAkunId },
                    data: { 
                        saldoSekarang: { increment: selisihInt }
                    }
                })

                // Kredit akun: kurang selisih
                await tx.akun.update({
                    where: { id: oldTransaksi.kreditAkunId },
                    data: { 
                        saldoSekarang: { decrement: selisihInt }
                    }
                })

                // Update transaksi
                return await tx.transaksi.update({
                    where: { id },
                    data: {
                        ...data,
                        nominal: newNominalInt // Update BigInt column
                    },
                })
            })

            await logSistem("INFO", "TRANSAKSI", `Transaksi diperbarui (dengan nominal): ${transaksi.deskripsi}`)
            
            // Trigger background snapshot (non-blocking)
            void saveNetWorthSnapshot()

            revalidatePath("/transaksi")
            revalidatePath("/akun")
            revalidatePath("/")

            const mappedResult = {
                ...transaksi,
                nominal: Money.toFloat(Number(transaksi.nominal))
            }

            return { success: true, data: mappedResult }
        }

        // Jika nominal tidak berubah, update biasa
        const transaksi = await prisma.transaksi.update({
            where: { id },
            data,
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi diperbarui: ${transaksi.deskripsi}`)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/")

        const mappedResult = {
            ...transaksi,
            nominal: Money.toFloat(Number(transaksi.nominal))
        }

        return { success: true, data: mappedResult }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal memperbarui transaksi", (error as Error).stack)
        return { success: false, error: ErrorMessages.GENERAL_ERROR }
    }
}