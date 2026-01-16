"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { revalidatePath } from "next/cache"

// Struktur backup data
interface BackupData {
    version: string
    createdAt: string
    data: {
        akun: any[]
        transaksi: any[]
        rencanaCicilan: any[]
        recurringTransaction: any[]
        budget: any[]
        logSistem: any[]
    }
    stats: {
        totalAkun: number
        totalTransaksi: number
        totalCicilan: number
        totalRecurring: number
        totalBudget: number
    }
}

// Ekspor semua data ke JSON
export async function exportBackup(): Promise<{ success: boolean; data?: BackupData; error?: string }> {
    try {
        await logSistem("INFO", "BACKUP", "Memulai proses backup data")

        // Ambil semua data dari database
        const [akun, transaksi, rencanaCicilan, recurringTransaction, budget, logData] = await Promise.all([
            prisma.akun.findMany({ orderBy: { createdAt: "asc" } }),
            prisma.transaksi.findMany({ orderBy: { tanggal: "asc" } }),
            prisma.rencanaCicilan.findMany({ orderBy: { createdAt: "asc" } }),
            prisma.recurringTransaction.findMany({ orderBy: { createdAt: "asc" } }),
            prisma.budget.findMany({ orderBy: { createdAt: "asc" } }),
            prisma.logSistem.findMany({ orderBy: { createdAt: "asc" }, take: 1000 }), // Limit 1000 log
        ])

        const backup: BackupData = {
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            data: {
                akun,
                transaksi,
                rencanaCicilan,
                recurringTransaction,
                budget,
                logSistem: logData,
            },
            stats: {
                totalAkun: akun.length,
                totalTransaksi: transaksi.length,
                totalCicilan: rencanaCicilan.length,
                totalRecurring: recurringTransaction.length,
                totalBudget: budget.length,
            }
        }

        await logSistem("INFO", "BACKUP", `Backup berhasil: ${transaksi.length} transaksi, ${akun.length} akun`)

        return { success: true, data: backup }
    } catch (error) {
        await logSistem("ERROR", "BACKUP", "Gagal melakukan backup", (error as Error).stack)
        return { success: false, error: "Gagal melakukan backup data" }
    }
}

/**
 * Selective export of specific data types
 */
export async function exportSelective(types: string[]): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        await logSistem("INFO", "BACKUP", `Memulai export selektif: ${types.join(', ')}`)

        const result: any = {
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            data: {},
            types: types
        }

        const promises = []

        if (types.includes('akun')) promises.push(prisma.akun.findMany().then(data => result.data.akun = data))
        if (types.includes('transaksi')) promises.push(prisma.transaksi.findMany().then(data => result.data.transaksi = data))
        if (types.includes('cicilan')) promises.push(prisma.rencanaCicilan.findMany().then(data => result.data.rencanaCicilan = data))
        if (types.includes('recurring')) promises.push(prisma.recurringTransaction.findMany().then(data => result.data.recurringTransaction = data))
        if (types.includes('budget')) promises.push(prisma.budget.findMany().then(data => result.data.budget = data))
        if (types.includes('template')) promises.push(prisma.accountTemplate.findMany().then(data => result.data.accountTemplate = data))

        await Promise.all(promises)

        return { success: true, data: result }
    } catch (error) {
        await logSistem("ERROR", "BACKUP", "Gagal melakukan export selektif", (error as Error).stack)
        return { success: false, error: "Gagal melakukan export selektif" }
    }
}

// Import/Restore data dari backup
export async function importBackup(backupJson: string): Promise<{
    success: boolean
    message?: string
    stats?: { imported: any; skipped: any }
    error?: string
}> {
    try {
        await logSistem("INFO", "RESTORE", "Memulai proses restore data")

        // Parse backup JSON
        let backup: BackupData
        try {
            backup = JSON.parse(backupJson)
        } catch {
            return { success: false, error: "Format backup tidak valid (bukan JSON)" }
        }

        // Validasi struktur backup
        if (!backup.version || !backup.data) {
            return { success: false, error: "Struktur backup tidak valid" }
        }

        const imported = { akun: 0, transaksi: 0, cicilan: 0, recurring: 0, budget: 0 }
        const skipped = { akun: 0, transaksi: 0, cicilan: 0, recurring: 0, budget: 0 }
        const updated = { akun: 0 }

        // Mapping dari old ID ke new ID (untuk akun yang sudah ada)
        const akunIdMap = new Map<string, string>()

        // Restore akun terlebih dahulu (karena ada relasi)
        for (const akun of backup.data.akun || []) {
            try {
                // Cek duplikat berdasarkan NAMA dan TIPE (bukan id)
                const existing = await prisma.akun.findFirst({
                    where: {
                        nama: akun.nama,
                        tipe: akun.tipe
                    }
                })

                if (existing) {
                    // Akun dengan nama dan tipe sama sudah ada
                    // Update saldo dari backup dan simpan mapping
                    await prisma.akun.update({
                        where: { id: existing.id },
                        data: {
                            saldoSekarang: akun.saldoSekarang,
                            saldoAwal: akun.saldoAwal,
                            warna: akun.warna,
                            limitKredit: akun.limitKredit,
                        }
                    })
                    akunIdMap.set(akun.id, existing.id)
                    updated.akun++
                    continue
                }

                // Cek apakah ID sudah ada (untuk menghindari conflict)
                const existingById = await prisma.akun.findUnique({ where: { id: akun.id } })

                if (existingById) {
                    // ID sama tapi nama/tipe beda = skip
                    akunIdMap.set(akun.id, existingById.id)
                    skipped.akun++
                    continue
                }

                // Buat akun baru dengan ID dari backup
                await prisma.akun.create({
                    data: {
                        id: akun.id,
                        nama: akun.nama,
                        tipe: akun.tipe,
                        saldoAwal: akun.saldoAwal,
                        saldoSekarang: akun.saldoSekarang,
                        warna: akun.warna,
                        limitKredit: akun.limitKredit,
                        createdAt: new Date(akun.createdAt),
                    }
                })
                akunIdMap.set(akun.id, akun.id)
                imported.akun++
            } catch (err) {
                skipped.akun++
            }
        }

        // Restore transaksi
        for (const tx of backup.data.transaksi || []) {
            try {
                const existing = await prisma.transaksi.findUnique({ where: { id: tx.id } })
                if (existing) {
                    skipped.transaksi++
                    continue
                }

                await prisma.transaksi.create({
                    data: {
                        id: tx.id,
                        deskripsi: tx.deskripsi,
                        nominal: tx.nominal,
                        kategori: tx.kategori,
                        tanggal: new Date(tx.tanggal),
                        catatan: tx.catatan,
                        debitAkunId: tx.debitAkunId,
                        kreditAkunId: tx.kreditAkunId,
                        idempotencyKey: tx.idempotencyKey,
                        rencanaCicilanId: tx.rencanaCicilanId,
                        createdAt: new Date(tx.createdAt),
                    }
                })
                imported.transaksi++
            } catch (err) {
                skipped.transaksi++
            }
        }

        // Restore cicilan
        for (const cicilan of backup.data.rencanaCicilan || []) {
            try {
                const existing = await prisma.rencanaCicilan.findUnique({ where: { id: cicilan.id } })
                if (existing) {
                    skipped.cicilan++
                    continue
                }

                await prisma.rencanaCicilan.create({
                    data: {
                        id: cicilan.id,
                        namaProduk: cicilan.namaProduk,
                        totalPokok: cicilan.totalPokok,
                        tenor: cicilan.tenor,
                        cicilanKe: cicilan.cicilanKe,
                        nominalPerBulan: cicilan.nominalPerBulan,
                        biayaAdmin: cicilan.biayaAdmin,
                        bungaPersen: cicilan.bungaPersen,
                        tanggalJatuhTempo: cicilan.tanggalJatuhTempo,
                        status: cicilan.status,
                        akunKreditId: cicilan.akunKreditId,
                        akunDebitId: cicilan.akunDebitId,
                        createdAt: new Date(cicilan.createdAt),
                        updatedAt: new Date(cicilan.updatedAt),
                    }
                })
                imported.cicilan++
            } catch (err) {
                skipped.cicilan++
            }
        }

        // Restore recurring
        for (const recurring of backup.data.recurringTransaction || []) {
            try {
                const existing = await prisma.recurringTransaction.findUnique({ where: { id: recurring.id } })
                if (existing) {
                    skipped.recurring++
                    continue
                }

                await prisma.recurringTransaction.create({
                    data: {
                        id: recurring.id,
                        nama: recurring.nama,
                        nominal: recurring.nominal,
                        kategori: recurring.kategori,
                        tipeTransaksi: recurring.tipeTransaksi,
                        akunId: recurring.akunId,
                        frekuensi: recurring.frekuensi,
                        hariDalamBulan: recurring.hariDalamBulan,
                        hariDalamMinggu: recurring.hariDalamMinggu,
                        aktif: recurring.aktif,
                        createdAt: new Date(recurring.createdAt),
                    }
                })
                imported.recurring++
            } catch (err) {
                skipped.recurring++
            }
        }

        // Restore budget
        for (const budget of backup.data.budget || []) {
            try {
                const existing = await prisma.budget.findUnique({ where: { id: budget.id } })
                if (existing) {
                    skipped.budget++
                    continue
                }

                await prisma.budget.create({
                    data: {
                        id: budget.id,
                        kategori: budget.kategori,
                        bulan: budget.bulan,
                        tahun: budget.tahun,
                        nominal: budget.nominal,
                        createdAt: new Date(budget.createdAt),
                        updatedAt: new Date(budget.updatedAt),
                    }
                })
                imported.budget++
            } catch (err) {
                skipped.budget++
            }
        }

        await logSistem("INFO", "RESTORE", `Restore selesai: ${imported.transaksi} transaksi, ${imported.akun} akun diimpor`)

        revalidatePath("/")
        revalidatePath("/akun")
        revalidatePath("/transaksi")
        revalidatePath("/cicilan")
        revalidatePath("/recurring")
        revalidatePath("/anggaran")

        return {
            success: true,
            message: "Restore berhasil!",
            stats: { imported, skipped }
        }
    } catch (error) {
        await logSistem("ERROR", "RESTORE", "Gagal melakukan restore", (error as Error).stack)
        return { success: false, error: "Gagal melakukan restore data" }
    }
}

// Reset semua data (DANGER!)
export async function resetAllData(): Promise<{ success: boolean; error?: string }> {
    try {
        await logSistem("WARN", "RESET", "Memulai proses reset seluruh data")

        // Hapus dalam urutan yang benar (karena relasi)
        await prisma.$transaction([
            prisma.transaksi.deleteMany(),
            prisma.rencanaCicilan.deleteMany(),
            prisma.recurringTransaction.deleteMany(),
            prisma.budget.deleteMany(),
            prisma.akun.deleteMany(),
            // Jangan hapus log sistem
        ])

        await logSistem("WARN", "RESET", "Reset data berhasil - semua data telah dihapus")

        revalidatePath("/")
        revalidatePath("/akun")
        revalidatePath("/transaksi")
        revalidatePath("/cicilan")
        revalidatePath("/recurring")
        revalidatePath("/anggaran")

        return { success: true }
    } catch (error) {
        await logSistem("ERROR", "RESET", "Gagal melakukan reset data", (error as Error).stack)
        return { success: false, error: "Gagal melakukan reset data" }
    }
}

// Mendapatkan info backup terakhir
export async function getBackupInfo() {
    try {
        const [
            akunCount,
            transaksiCount,
            cicilanCount,
            recurringCount,
            budgetCount,
            lastLog
        ] = await Promise.all([
            prisma.akun.count(),
            prisma.transaksi.count(),
            prisma.rencanaCicilan.count(),
            prisma.recurringTransaction.count(),
            prisma.budget.count(),
            prisma.logSistem.findFirst({
                where: { modul: "BACKUP" },
                orderBy: { createdAt: "desc" }
            })
        ])

        return {
            success: true,
            data: {
                totalAkun: akunCount,
                totalTransaksi: transaksiCount,
                totalCicilan: cicilanCount,
                totalRecurring: recurringCount,
                totalBudget: budgetCount,
                lastBackup: lastLog?.createdAt || null,
            }
        }
    } catch (error) {
        return { success: false, data: null }
    }
}
