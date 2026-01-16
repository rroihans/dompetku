"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { saveNetWorthSnapshot } from "@/app/actions/networth"
import { createNotification } from "@/app/actions/notifications"
import { Money } from "@/lib/money"

export interface RecurringTransactionData {
    nama: string
    nominal: number
    kategori: string
    tipeTransaksi: "KELUAR" | "MASUK"
    akunId: string
    frekuensi: "HARIAN" | "MINGGUAN" | "BULANAN" | "TAHUNAN"
    hariDalamBulan?: number // 1-31 untuk bulanan
    hariDalamMinggu?: number // 0-6 untuk mingguan (0=Minggu)
    tanggalSelesai?: Date
}

export async function createRecurringTransaction(data: RecurringTransactionData) {
    try {
        // Validasi
        if (data.nominal <= 0) {
            return { success: false, error: "Nominal harus lebih dari 0" }
        }

        const recurring = await prisma.recurringTransaction.create({
            data: {
                nama: data.nama,
                nominal: data.nominal,
                kategori: data.kategori,
                tipeTransaksi: data.tipeTransaksi,
                akunId: data.akunId,
                frekuensi: data.frekuensi,
                hariDalamBulan: data.hariDalamBulan,
                hariDalamMinggu: data.hariDalamMinggu,
                tanggalSelesai: data.tanggalSelesai,
                aktif: true,
            },
        })

        await logSistem("INFO", "RECURRING", `Transaksi berulang dibuat: ${recurring.nama}`)
        revalidatePath("/recurring")

        return { success: true, data: recurring }
    } catch (error) {
        await logSistem("ERROR", "RECURRING", "Gagal membuat transaksi berulang", (error as Error).stack)
        return { success: false, error: "Gagal membuat transaksi berulang" }
    }
}

export async function getRecurringTransactions() {
    try {
        const recurring = await prisma.recurringTransaction.findMany({
            orderBy: { createdAt: "desc" }
        })
        return { success: true, data: recurring }
    } catch (error) {
        return { success: false, data: [], error: "Gagal mengambil data" }
    }
}

export async function toggleRecurringTransaction(id: string, aktif: boolean) {
    try {
        const recurring = await prisma.recurringTransaction.update({
            where: { id },
            data: { aktif },
        })

        await logSistem("INFO", "RECURRING", `Transaksi berulang ${aktif ? 'diaktifkan' : 'dinonaktifkan'}: ${recurring.nama}`)
        revalidatePath("/recurring")

        return { success: true, data: recurring }
    } catch (error) {
        return { success: false, error: "Gagal mengubah status" }
    }
}

export async function deleteRecurringTransaction(id: string) {
    try {
        const recurring = await prisma.recurringTransaction.findUnique({
            where: { id },
            include: { adminFee: true }
        })

        if (!recurring) return { success: false, error: "Transaksi berulang tidak ditemukan" }

        await prisma.$transaction(async (tx) => {
            // Jika ini adalah automasi bank (admin fee), sinkronkan ke Akun
            if (recurring.adminFee) {
                await tx.akun.update({
                    where: { id: recurring.akunId },
                    data: {
                        biayaAdminAktif: false,
                        biayaAdminNominal: null,
                        biayaAdminPola: null,
                        biayaAdminTanggal: null
                    }
                })

                // Hapus AdminFee record
                await tx.adminFee.delete({
                    where: { id: recurring.adminFee.id }
                })
            }

            // Hapus RecurringTransaction record
            await tx.recurringTransaction.delete({
                where: { id },
            })
        })

        await logSistem("INFO", "RECURRING", `Transaksi berulang dihapus: ${recurring.nama}`)
        revalidatePath("/recurring")
        if (recurring.adminFee) {
            revalidatePath(`/akun/${recurring.akunId}`)
        }

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "RECURRING", "Gagal menghapus transaksi berulang", (error as Error).stack)
        return { success: false, error: "Gagal menghapus" }
    }
}

/**
 * Skip recurring transaction for a specific month
 */
export async function skipRecurringForMonth(id: string, yearMonth: string) {
    try {
        // Simple implementation: Use LogSistem to record skipped months
        // and check against it in execution loop.
        // A better way would be a dedicated table or a field in RecurringTransaction.
        // Since we cannot change schema easily, we'll use a specific CATATAN format
        // or just update terakhirDieksekusi to a date in that month.
        
        const recurring = await prisma.recurringTransaction.findUnique({
            where: { id }
        })

        if (!recurring) return { success: false, error: "Tidak ditemukan" }

        // Set terakhirDieksekusi to the end of the skipped month
        const [year, month] = yearMonth.split('-').map(Number)
        const skipDate = new Date(year, month, 0) // Last day of month

        await prisma.recurringTransaction.update({
            where: { id },
            data: {
                terakhirDieksekusi: skipDate
            }
        })

        await logSistem("INFO", "RECURRING", `Transaksi berulang diskip untuk bulan ${yearMonth}: ${recurring.nama}`)
        revalidatePath("/recurring")

        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal skip transaksi" }
    }
}

// Jalankan transaksi berulang yang pending
export async function executeRecurringTransactions() {
    try {
        const now = new Date()
        const today = now.getDate()
        const dayOfWeek = now.getDay() // 0 = Minggu

        // Ambil semua recurring yang aktif
        const activeRecurring = await prisma.recurringTransaction.findMany({
            where: {
                aktif: true,
                OR: [
                    { tanggalSelesai: null },
                    { tanggalSelesai: { gte: now } }
                ]
            }
        })

        let executed = 0

        for (const recurring of activeRecurring) {
            let shouldExecute = false

            // Cek apakah sudah dieksekusi hari ini
            if (recurring.terakhirDieksekusi) {
                const lastExec = new Date(recurring.terakhirDieksekusi)
                if (lastExec.toDateString() === now.toDateString()) {
                    continue // Sudah dieksekusi hari ini
                }
            }

            switch (recurring.frekuensi) {
                case "HARIAN":
                    shouldExecute = true
                    break
                case "MINGGUAN":
                    shouldExecute = recurring.hariDalamMinggu === dayOfWeek
                    break
                case "BULANAN":
                    shouldExecute = recurring.hariDalamBulan === today
                    break
                case "TAHUNAN":
                    // Untuk tahunan, cek bulan dan tanggal
                    const startDate = new Date(recurring.tanggalMulai)
                    shouldExecute =
                        startDate.getMonth() === now.getMonth() &&
                        startDate.getDate() === today
                    break
            }

            if (shouldExecute) {
                // Generate idempotency key: recurring_{id}_{YYYY-MM-DD}
                const dateKey = now.toISOString().split('T')[0]
                const idempotencyKey = `recurring_${recurring.id}_${dateKey}`

                // Fix Idempotency Check: Check BEFORE starting transaction
                const existing = await prisma.transaksi.findUnique({
                    where: { idempotencyKey }
                })
                
                if (existing) {
                    await logSistem("WARN", "RECURRING", `Skip duplikasi eksekusi: ${recurring.nama} (${idempotencyKey})`)
                    continue
                }

                // Buat transaksi
                const kategoriTipe = recurring.tipeTransaksi === "KELUAR" ? "EXPENSE" : "INCOME"

                // Cari atau buat akun kategori
                const namaAkun = `[${kategoriTipe}] ${recurring.kategori}`
                let kategoriAkun = await prisma.akun.findFirst({
                    where: { nama: namaAkun }
                })

                if (!kategoriAkun) {
                    kategoriAkun = await prisma.akun.create({
                        data: {
                            nama: namaAkun,
                            tipe: kategoriTipe,
                            saldoAwal: BigInt(0),
                            saldoSekarang: BigInt(0),
                        }
                    })
                }

                const debitAkunId = recurring.tipeTransaksi === "KELUAR" ? kategoriAkun.id : recurring.akunId
                const kreditAkunId = recurring.tipeTransaksi === "KELUAR" ? recurring.akunId : kategoriAkun.id

                try {
                    const nominalInt = BigInt(Money.fromFloat(recurring.nominal))

                    await prisma.$transaction(async (tx: any) => {
                        // Buat transaksi
                        await tx.transaksi.create({
                            data: {
                                deskripsi: `[Auto] ${recurring.nama}`,
                                nominal: nominalInt, // BigInt from Float
                                kategori: recurring.kategori,
                                debitAkunId,
                                kreditAkunId,
                                tanggal: now,
                                catatan: "Dibuat otomatis dari transaksi berulang",
                                idempotencyKey,
                            }
                        })

                        // Update saldo
                        await tx.akun.update({
                            where: { id: debitAkunId },
                            data: { saldoSekarang: { increment: nominalInt } }
                        })
                        await tx.akun.update({
                            where: { id: kreditAkunId },
                            data: { saldoSekarang: { decrement: nominalInt } }
                        })

                        // Update terakhirDieksekusi
                        await tx.recurringTransaction.update({
                            where: { id: recurring.id },
                            data: { terakhirDieksekusi: now }
                        })
                    })

                    executed++
                } catch (txError: any) {
                     // Catch race condition if any
                    if (txError.code === 'P2002') {
                        await logSistem("WARN", "RECURRING", `Skip duplikasi eksekusi (Race): ${recurring.nama} (${idempotencyKey})`)
                        continue
                    }
                    
                    await createNotification({
                        type: "RECURRING_FAILED",
                        title: "❌ Transaksi Berulang Gagal",
                        message: `Gagal mengeksekusi "${recurring.nama}": ${txError.message}`,
                        severity: "ERROR",
                        actionUrl: "/recurring"
                    })
                    
                    throw txError // Re-throw if other error
                }
            }
        }

        if (executed > 0) {
            await logSistem("INFO", "RECURRING", `Eksekusi transaksi berulang: ${executed} transaksi`)
            
            // Trigger background snapshot (non-blocking)
            void saveNetWorthSnapshot()
            
            revalidatePath("/")
            revalidatePath("/transaksi")
            revalidatePath("/akun")
        }

        return { success: true, executed }
    } catch (error) {
        await logSistem("ERROR", "RECURRING", "Gagal eksekusi transaksi berulang", (error as Error).stack)
        return { success: false, error: "Gagal eksekusi transaksi berulang" }
    }
}
