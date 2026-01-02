"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import { saveNetWorthSnapshot } from "@/app/actions/networth"

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
        const recurring = await prisma.recurringTransaction.delete({
            where: { id },
        })

        await logSistem("INFO", "RECURRING", `Transaksi berulang dihapus: ${recurring.nama}`)
        revalidatePath("/recurring")

        return { success: true }
    } catch (error) {
        return { success: false, error: "Gagal menghapus" }
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
                            saldoAwal: 0,
                            saldoSekarang: 0,
                        }
                    })
                }

                const debitAkunId = recurring.tipeTransaksi === "KELUAR" ? kategoriAkun.id : recurring.akunId
                const kreditAkunId = recurring.tipeTransaksi === "KELUAR" ? recurring.akunId : kategoriAkun.id

                try {
                    await prisma.$transaction(async (tx: any) => {
                        // Buat transaksi
                        await tx.transaksi.create({
                            data: {
                                deskripsi: `[Auto] ${recurring.nama}`,
                                nominal: recurring.nominal,
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
                            data: { saldoSekarang: { increment: recurring.nominal } }
                        })
                        await tx.akun.update({
                            where: { id: kreditAkunId },
                            data: { saldoSekarang: { decrement: recurring.nominal } }
                        })

                        // Update terakhirDieksekusi
                        await tx.recurringTransaction.update({
                            where: { id: recurring.id },
                            data: { terakhirDieksekusi: now }
                        })
                    })

                    executed++
                } catch (txError: any) {
                    // Jika error karena P2002 (Unique constraint failed), berarti sudah pernah dieksekusi
                    // Kita anggap sukses/skip
                    if (txError.code === 'P2002') {
                        await logSistem("WARN", "RECURRING", `Skip duplikasi eksekusi: ${recurring.nama} (${idempotencyKey})`)
                        continue
                    }
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
