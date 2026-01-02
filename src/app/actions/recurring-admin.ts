"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { calculateNextBillingDate, getApplicableInterestRate, TierBunga } from "@/lib/template-utils"
import { revalidatePath } from "next/cache"

/**
 * Memproses biaya admin bulanan untuk semua akun yang menggunakan template.
 */
export async function processMonthlyAdminFees(dryRun: boolean = false) {
  try {
    const today = new Date()
    const processedTransactions = []
    const errors = []

    // 1. Ambil semua akun yang punya template dan biaya admin
    const akunList = await prisma.akun.findMany({
      where: {
        templateId: { not: null },
        template: { biayaAdmin: { not: null, gt: 0 } }
      },
      include: { template: true }
    })

    for (const akun of akunList) {
      if (!akun.template || !akun.template.biayaAdmin) continue

      // 2. Hitung tanggal tagihan bulan ini
      // Kita hitung berdasarkan bulan berjalan
      const billingDate = calculateNextBillingDate(
        akun.template.polaTagihan,
        akun.template.tanggalTagihan,
        new Date(today.getFullYear(), today.getMonth(), 1) // Start from 1st of this month
      )

      // 3. Cek apakah sudah waktunya charge (tanggal tagihan <= hari ini)
      if (billingDate > today) continue

      // 4. Cek apakah bulan ini sudah pernah di-charge (avoid duplikasi)
      if (akun.lastAdminChargeDate) {
        const lastCharge = new Date(akun.lastAdminChargeDate)
        if (lastCharge.getMonth() === billingDate.getMonth() && 
            lastCharge.getFullYear() === billingDate.getFullYear()) {
          continue
        }
      }

      // 5. Siapkan transaksi
      const nominal = akun.template.biayaAdmin
      const deskripsi = `Biaya admin bulanan ${akun.template.nama}`
      const kategori = "Biaya Admin Bank"

      if (dryRun) {
        processedTransactions.push({
          akunId: akun.id,
          namaAkun: akun.nama,
          nominal,
          tanggal: billingDate,
          deskripsi
        })
        continue
      }

      // 6. Eksekusi dengan Transaction & Locking
      try {
        await prisma.$transaction(async (tx) => {
          // Re-fetch with lock (SQLite doesn't support forUpdate, but we can check the date again)
          const currentAkun = await tx.akun.findUnique({
            where: { id: akun.id },
            select: { lastAdminChargeDate: true, saldoSekarang: true }
          })

          if (currentAkun?.lastAdminChargeDate) {
            const lastChargeCheck = new Date(currentAkun.lastAdminChargeDate)
            if (lastChargeCheck.getMonth() === billingDate.getMonth() && 
                lastChargeCheck.getFullYear() === billingDate.getFullYear()) {
              return
            }
          }

          // Cari/Buat kategori akun (Expense)
          let kategoriAkun = await tx.akun.findFirst({
            where: { nama: `[EXPENSE] ${kategori}`, tipe: "PENGELUARAN" }
          })

          if (!kategoriAkun) {
            kategoriAkun = await tx.akun.create({
              data: { nama: `[EXPENSE] ${kategori}`, tipe: "PENGELUARAN", warna: "#ef4444" }
            })
          }

          // Buat transaksi
          const transaksi = await tx.transaksi.create({
            data: {
              tanggal: billingDate,
              deskripsi,
              nominal,
              kategori,
              debitAkunId: kategoriAkun.id,
              kreditAkunId: akun.id,
              idempotencyKey: `admin-fee-${akun.id}-${billingDate.toISOString().slice(0, 7)}`
            }
          })

          // Update Akun
          await tx.akun.update({
            where: { id: akun.id },
            data: {
              saldoSekarang: { decrement: nominal },
              lastAdminChargeDate: billingDate
            }
          })

          processedTransactions.push(transaksi)
          await logSistem("INFO", "ADMIN_FEE", `Biaya admin ${akun.nama} diproses: ${nominal}`, undefined)
        })
      } catch (err) {
        errors.push({ akunId: akun.id, error: (err as Error).message })
        await logSistem("ERROR", "ADMIN_FEE", `Gagal proses biaya admin ${akun.nama}`, (err as Error).stack)
      }
    }

    revalidatePath("/")
    revalidatePath("/akun")
    return { success: true, processed: processedTransactions.length, transactions: processedTransactions, errors }
  } catch (error) {
    await logSistem("ERROR", "ADMIN_FEE", "Fatal error processing admin fees", (error as Error).stack)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Memproses bunga tabungan bulanan.
 */
export async function processMonthlyInterest(dryRun: boolean = false) {
  try {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0) // Hari terakhir bulan lalu
    const processedTransactions = []
    const errors = []

    // 1. Ambil semua akun yang punya tier bunga
    const akunList = await prisma.akun.findMany({
      where: {
        templateId: { not: null },
        template: { bungaTier: { not: null } }
      },
      include: { template: true }
    })

    for (const akun of akunList) {
      if (!akun.template || !akun.template.bungaTier) continue

      // 2. Cek apakah bulan lalu sudah pernah dikreditkan
      if (akun.lastInterestCreditDate) {
        const lastCredit = new Date(akun.lastInterestCreditDate)
        if (lastCredit.getMonth() === lastMonth.getMonth() && 
            lastCredit.getFullYear() === lastMonth.getFullYear()) {
          continue
        }
      }

      // 3. Hitung bunga
      const tiers: TierBunga[] = JSON.parse(akun.template.bungaTier)
      const bungaPa = getApplicableInterestRate(akun.saldoSekarang, tiers)
      
      if (bungaPa <= 0) continue

      // Rumus: Saldo * (BungaPa / 100) / 12 bulan
      const bungaGross = (akun.saldoSekarang * (bungaPa / 100)) / 12
      const bungaBersih = bungaGross * 0.8 // Potong pajak 20%
      
      if (bungaBersih < 1) continue // Abaikan jika terlalu kecil (misal < Rp1)

      const deskripsi = `Bunga tabungan bulanan ${akun.template.nama}`
      const kategori = "Bunga Tabungan"

      if (dryRun) {
        processedTransactions.push({
          akunId: akun.id,
          namaAkun: akun.nama,
          nominal: bungaBersih,
          tanggal: lastMonth,
          deskripsi
        })
        continue
      }

      // 4. Eksekusi
      try {
        await prisma.$transaction(async (tx) => {
          // Cari/Buat kategori akun (Income)
          let kategoriAkun = await tx.akun.findFirst({
            where: { nama: `[INCOME] ${kategori}`, tipe: "PENDAPATAN" }
          })

          if (!kategoriAkun) {
            kategoriAkun = await tx.akun.create({
              data: { nama: `[INCOME] ${kategori}`, tipe: "PENDAPATAN", warna: "#10b981" }
            })
          }

          // Buat transaksi
          const transaksi = await tx.transaksi.create({
            data: {
              tanggal: lastMonth,
              deskripsi,
              nominal: bungaBersih,
              kategori,
              debitAkunId: akun.id,
              kreditAkunId: kategoriAkun.id,
              idempotencyKey: `interest-${akun.id}-${lastMonth.toISOString().slice(0, 7)}`
            }
          })

          // Update Akun
          await tx.akun.update({
            where: { id: akun.id },
            data: {
              saldoSekarang: { increment: bungaBersih },
              lastInterestCreditDate: lastMonth
            }
          })

          processedTransactions.push(transaksi)
          await logSistem("INFO", "INTEREST", `Bunga tabungan ${akun.nama} dikreditkan: ${bungaBersih}`, undefined)
        })
      } catch (err) {
        errors.push({ akunId: akun.id, error: (err as Error).message })
        await logSistem("ERROR", "INTEREST", `Gagal proses bunga ${akun.nama}`, (err as Error).stack)
      }
    }

    revalidatePath("/")
    revalidatePath("/akun")
    return { success: true, processed: processedTransactions.length, transactions: processedTransactions, errors }
  } catch (error) {
    await logSistem("ERROR", "INTEREST", "Fatal error processing interest", (error as Error).stack)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Mendapatkan daftar tagihan admin yang akan datang dalam 7 hari.
 */
export async function getUpcomingAdminFees() {
  try {
    const today = new Date()
    const nextWeek = new Date()
    nextWeek.setDate(today.getDate() + 7)
    
    const upcoming = []

    const akunList = await prisma.akun.findMany({
      where: {
        templateId: { not: null },
        template: { biayaAdmin: { not: null, gt: 0 } }
      },
      include: { template: true }
    })

    for (const akun of akunList) {
      if (!akun.template) continue

      const nextDate = calculateNextBillingDate(
        akun.template.polaTagihan,
        akun.template.tanggalTagihan,
        today
      )

      if (nextDate <= nextWeek) {
        // Cek apakah sudah pernah dicharge bulan ini
        if (akun.lastAdminChargeDate) {
            const lastCharge = new Date(akun.lastAdminChargeDate)
            if (lastCharge.getMonth() === nextDate.getMonth() && 
                lastCharge.getFullYear() === nextDate.getFullYear()) {
              continue
            }
        }

        upcoming.push({
          akunId: akun.id,
          namaAkun: akun.nama,
          nominal: akun.template.biayaAdmin,
          tanggal: nextDate,
          namaTemplate: akun.template.nama
        })
      }
    }

    return { success: true, data: upcoming.sort((a, b) => a.tanggal.getTime() - b.tanggal.getTime()) }
  } catch (error) {
    return { success: false, data: [] }
  }
}
