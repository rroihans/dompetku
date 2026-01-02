"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { saveNetWorthSnapshot } from "@/app/actions/networth"

// Untuk pagination - 25 item per halaman untuk tampilan lebih lengkap
const PAGE_SIZE = 25

// Tipe akun user
const USER_ACCOUNT_TYPES = ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"]

interface TransaksiFilter {
    page?: number
    search?: string
    kategori?: string
    tipe?: string // "expense" | "income"
    dateFrom?: string
    dateTo?: string
    minNominal?: number
    maxNominal?: number
    sort?: string // "tanggal" | "nominal" | "kategori"
    sortDir?: string // "asc" | "desc"
    akunId?: string // Tambahkan filter akunId
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
        akunId
    } = filters

    try {
        const skip = (page - 1) * PAGE_SIZE

        // Build where clause dynamically
        const where: any = {}

        if (akunId) {
            where.OR = [
                { debitAkunId: akunId },
                { kreditAkunId: akunId }
            ]
        }

        if (search) {
            where.OR = [
                { deskripsi: { contains: search } },
                { kategori: { contains: search } },
                { catatan: { contains: search } },
                // Support search by akun name
                { debitAkun: { nama: { contains: search } } },
                { kreditAkun: { nama: { contains: search } } },
            ]
        }

        if (kategori) {
            where.kategori = kategori
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
                where.nominal.gte = minNominal
            }
            if (maxNominal !== undefined && maxNominal > 0) {
                where.nominal.lte = maxNominal
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
        let dataWithBalance = transaksi
        if (akunId && sort === "tanggal") {
            // Ambil saldo saat ini dari akun tersebut
            const akun = await prisma.akun.findUnique({
                where: { id: akunId },
                select: { saldoSekarang: true }
            })

            if (akun) {
                let currentRunningBalance = akun.saldoSekarang

                // Perbaikan: Jika bukan halaman pertama, sesuaikan saldo awal running balance
                // dengan menghitung total perubahan dari transaksi di halaman-halaman sebelumnya
                if (page > 1) {
                    const skippedTx = await prisma.transaksi.findMany({
                        where,
                        orderBy,
                        take: skip,
                        select: {
                            nominal: true,
                            debitAkunId: true,
                        }
                    })

                    for (const tx of skippedTx) {
                        const isDebit = tx.debitAkunId === akunId
                        if (isDebit) {
                            currentRunningBalance -= tx.nominal
                        } else {
                            currentRunningBalance += tx.nominal
                        }
                    }
                }

                // Karena data sorted by tanggal DESC, transaksi pertama di array adalah yang TERBARU
                // Jadi kita hitung mundur dari saldo yang sudah disesuaikan
                dataWithBalance = transaksi.map((tx) => {
                    const txWithBalance = {
                        ...tx,
                        saldoSetelah: currentRunningBalance
                    }
                    
                    // Hitung saldo sebelum transaksi ini untuk baris berikutnya
                    const isDebit = tx.debitAkunId === akunId
                    if (isDebit) {
                        currentRunningBalance -= tx.nominal
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
                saldoAwal: 0,
                saldoSekarang: 0,
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

export async function createTransaksiSimple(data: SimpleTransaksiData) {
    try {
        // 1. Cek idempotency key jika ada
        if (data.idempotencyKey) {
            const existing = await prisma.transaksi.findUnique({
                where: { idempotencyKey: data.idempotencyKey }
            })
            if (existing) return { success: true, data: existing, duplicated: true }
        }

        // 2. Jalankan transaksi database (Atomic)
        const result = await prisma.$transaction(async (tx: any) => {
            // Ambil atau buat akun kategori internal
            const kategoriTipe = data.tipeTransaksi === "KELUAR" ? "EXPENSE" : "INCOME"
            const kategoriAkun = await getOrCreateKategoriAkun(tx, data.kategori, kategoriTipe)

            // Tentukan debit dan kredit berdasarkan tipe transaksi
            // KELUAR: Uang keluar dari akun user -> masuk ke kategori pengeluaran
            //   Debit: Kategori Pengeluaran (bertambah), Kredit: Akun User (berkurang)
            // MASUK: Uang masuk ke akun user -> dari kategori pemasukan
            //   Debit: Akun User (bertambah), Kredit: Kategori Pemasukan (berkurang)

            const debitAkunId = data.tipeTransaksi === "KELUAR" ? kategoriAkun.id : data.akunId
            const kreditAkunId = data.tipeTransaksi === "KELUAR" ? data.akunId : kategoriAkun.id

            // Buat record transaksi
            const transaksi = await tx.transaksi.create({
                data: {
                    deskripsi: data.deskripsi || data.kategori,
                    nominal: data.nominal,
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
                data: { saldoSekarang: { increment: data.nominal } }
            })

            // Update saldo akun kredit (berkurang)
            await tx.akun.update({
                where: { id: kreditAkunId },
                data: { saldoSekarang: { decrement: data.nominal } }
            })

            return transaksi
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi baru dicatat: ${result.deskripsi}`)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        return { success: true, data: result }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal mencatat transaksi", (error as Error).stack)
        return { success: false, error: "Gagal mencatat transaksi" }
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
}) {
    try {
        if (data.idempotencyKey) {
            const existing = await prisma.transaksi.findUnique({
                where: { idempotencyKey: data.idempotencyKey }
            })
            if (existing) return { success: true, data: existing, duplicated: true }
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const transaksi = await tx.transaksi.create({
                data: {
                    deskripsi: data.deskripsi,
                    nominal: data.nominal,
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
                data: { saldoSekarang: { increment: data.nominal } }
            })

            await tx.akun.update({
                where: { id: data.kreditAkunId },
                data: { saldoSekarang: { decrement: data.nominal } }
            })

            return transaksi
        })

        await logSistem("INFO", "TRANSAKSI", `Transaksi baru dicatat: ${result.deskripsi}`)
        
        // Trigger background snapshot (non-blocking)
        void saveNetWorthSnapshot()

        revalidatePath("/transaksi")
        revalidatePath("/akun")
        revalidatePath("/")

        return { success: true, data: result }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal mencatat transaksi", (error as Error).stack)
        return { success: false, error: "Gagal mencatat transaksi" }
    }
}

export async function deleteTransaksi(id: string) {
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
            // Rollback saldo: kebalikan dari create
            // Debit akun: kurangi (sebelumnya ditambah)
            await tx.akun.update({
                where: { id: transaksi.debitAkunId },
                data: { saldoSekarang: { decrement: transaksi.nominal } }
            })

            // Kredit akun: tambah (sebelumnya dikurangi)
            await tx.akun.update({
                where: { id: transaksi.kreditAkunId },
                data: { saldoSekarang: { increment: transaksi.nominal } }
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

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal menghapus transaksi", (error as Error).stack)
        return { success: false, error: "Gagal menghapus transaksi" }
    }
}

export async function updateTransaksi(id: string, data: {
    deskripsi?: string
    kategori?: string
    catatan?: string
    nominal?: number // Support edit nominal
}) {
    try {
        // Jika nominal berubah, perlu adjust saldo akun
        if (data.nominal !== undefined) {
            // Ambil transaksi lama
            const oldTransaksi = await prisma.transaksi.findUnique({
                where: { id },
            })

            if (!oldTransaksi) {
                return { success: false, error: "Transaksi tidak ditemukan" }
            }

            const selisih = data.nominal - oldTransaksi.nominal

            // Jalankan dalam transaction
            const transaksi = await prisma.$transaction(async (tx: any) => {
                // Update saldo akun sesuai selisih
                // Debit akun: tambah selisih
                await tx.akun.update({
                    where: { id: oldTransaksi.debitAkunId },
                    data: { saldoSekarang: { increment: selisih } }
                })

                // Kredit akun: kurang selisih
                await tx.akun.update({
                    where: { id: oldTransaksi.kreditAkunId },
                    data: { saldoSekarang: { decrement: selisih } }
                })

                // Update transaksi
                return await tx.transaksi.update({
                    where: { id },
                    data,
                })
            })

            await logSistem("INFO", "TRANSAKSI", `Transaksi diperbarui (dengan nominal): ${transaksi.deskripsi}`)
            
            // Trigger background snapshot (non-blocking)
            void saveNetWorthSnapshot()

            revalidatePath("/transaksi")
            revalidatePath("/akun")
            revalidatePath("/")

            return { success: true, data: transaksi }
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

        return { success: true, data: transaksi }
    } catch (error) {
        await logSistem("ERROR", "TRANSAKSI", "Gagal memperbarui transaksi", (error as Error).stack)
        return { success: false, error: "Gagal memperbarui transaksi" }
    }
}

