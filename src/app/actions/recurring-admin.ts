"use server"

import prisma from "@/lib/prisma"
import { logSistem } from "@/lib/logger"
import { calculateNextBillingDate, getApplicableInterestRate, TierBunga } from "@/lib/template-utils"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

function safeRevalidate(path: string) {
  try { revalidatePath(path) } catch { }
}

export async function getMinimumBalanceForMonth(akunId: string, year: number, month: number) {
  const startTime = performance.now();
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const akun = await prisma.akun.findUnique({
    where: { id: akunId },
    select: { createdAt: true, saldoSekarang: true, saldoAwal: true }
  });

  if (!akun) throw new Error("Akun tidak ditemukan");
  if (akun.createdAt > endDate) return { minBalance: 0, executionTime: performance.now() - startTime, notExists: true };

  const [totalDebit, totalKredit] = await Promise.all([
    prisma.transaksi.aggregate({ where: { tanggal: { gte: startDate }, debitAkunId: akunId }, _sum: { nominal: true } }),
    prisma.transaksi.aggregate({ where: { tanggal: { gte: startDate }, kreditAkunId: akunId }, _sum: { nominal: true } })
  ]);

  const debitSum = totalDebit._sum.nominal ?? BigInt(0)
  const kreditSum = totalKredit._sum.nominal ?? BigInt(0)
  const sumMutations = debitSum - kreditSum
  
  let runningBalance = akun.saldoSekarang - sumMutations;

  if (akun.createdAt > startDate && akun.createdAt <= endDate) {
    runningBalance = akun.saldoAwal;
  }

  let minBalance = runningBalance;
  const transactions = await prisma.transaksi.findMany({
    where: { tanggal: { gte: startDate, lte: endDate }, OR: [{ debitAkunId: akunId }, { kreditAkunId: akunId }] },
    orderBy: { tanggal: 'asc' }
  });

  for (const tx of transactions) {
    if (tx.debitAkunId === akunId) runningBalance += tx.nominal;
    else runningBalance -= tx.nominal;
    if (runningBalance < minBalance) minBalance = runningBalance;
  }

  return { minBalance: Money.toFloat(Number(minBalance)), executionTime: performance.now() - startTime };
}

export async function processMonthlyAdminFees(dryRun: boolean = false) {
  try {
    const today = new Date()
    const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

    // Get accounts with biayaAdminAktif=true (Bank, E-Wallet only - NOT Credit Card)
    // Credit Card has its own billing system via statement
    const akunList = await prisma.akun.findMany({
      where: {
        biayaAdminAktif: true,
        tipe: { in: ['BANK', 'E_WALLET'] }
      }
    })

    const processedTransactions = []
    const failedAccounts = []
    const skippedAccounts = []

    for (const akun of akunList) {
      // Skip if no admin fee nominal
      if (!akun.biayaAdminNominal) {
        skippedAccounts.push({ name: akun.nama, reason: "Tidak ada nominal biaya admin" })
        continue
      }

      // Calculate billing date
      const billingDate = calculateNextBillingDate(
        akun.biayaAdminPola || 'FIXED_DATE',
        akun.biayaAdminTanggal || 1,
        new Date(today.getFullYear(), today.getMonth(), 1)
      )

      // Skip if billing date hasn't come yet
      if (billingDate > today) {
        skippedAccounts.push({ name: akun.nama, reason: `Tanggal tagihan belum tiba (${billingDate.toLocaleDateString('id-ID')})` })
        continue
      }

      // Check if already processed this month
      const lastChargeStr = akun.lastAdminChargeDate ?
        `${akun.lastAdminChargeDate.getFullYear()}-${String(akun.lastAdminChargeDate.getMonth() + 1).padStart(2, '0')}` : null

      if (lastChargeStr === currentMonthStr) {
        skippedAccounts.push({ name: akun.nama, reason: "Sudah diproses bulan ini" })
        continue
      }

      const nominal = akun.biayaAdminNominal
      const deskripsi = `Biaya admin bulanan ${akun.nama}`

      if (dryRun) {
        processedTransactions.push({ akunId: akun.id, namaAkun: akun.nama, nominal, tanggal: billingDate })
        continue
      }

      try {
        const nominalSen = BigInt(Money.fromFloat(nominal))

        await prisma.$transaction(async (tx) => {
          let kategoriAkun = await tx.akun.findFirst({ where: { nama: "[EXPENSE] Biaya Admin Bank" } })
          if (!kategoriAkun) kategoriAkun = await tx.akun.create({ data: { nama: "[EXPENSE] Biaya Admin Bank", tipe: "PENGELUARAN", warna: "#ef4444" } })

          const txData = await tx.transaksi.create({
            data: {
              tanggal: billingDate, deskripsi, nominal: nominalSen, kategori: "Biaya Admin Bank",
              debitAkunId: kategoriAkun.id, kreditAkunId: akun.id,
              idempotencyKey: `admin-${akun.id}-${currentMonthStr}`
            }
          })
          await tx.akun.update({ where: { id: akun.id }, data: { saldoSekarang: { decrement: nominalSen }, lastAdminChargeDate: billingDate } })
          processedTransactions.push(txData)
        }, { timeout: 15000 })
      } catch (e: any) {
        failedAccounts.push({ name: akun.nama, error: e.message })
      }
    }

    // Always log the result
    const logMessage = dryRun
      ? `[SIMULASI] Biaya admin: ${processedTransactions.length} akun terdeteksi (dari ${akunList.length} akun aktif)`
      : `Biaya admin diproses: ${processedTransactions.length} berhasil, ${failedAccounts.length} gagal (dari ${akunList.length} akun aktif)`

    await logSistem("INFO", "AUTOMASI", logMessage)

    // Log skipped accounts for debugging if nothing was processed
    if (processedTransactions.length === 0 && skippedAccounts.length > 0) {
      await logSistem("INFO", "AUTOMASI", `Akun di-skip: ${skippedAccounts.map(a => `${a.name} (${a.reason})`).slice(0, 3).join(', ')}${skippedAccounts.length > 3 ? '...' : ''}`)
    }

    safeRevalidate("/")
    safeRevalidate("/pengaturan")

    return { success: true, processed: processedTransactions.length, failed: failedAccounts.length }
  } catch (error: any) {
    await logSistem("ERROR", "AUTOMASI", `Gagal proses biaya admin: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export async function processMonthlyInterest(dryRun: boolean = false) {
  try {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const targetMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    const useMinBalanceFlag = await prisma.appSetting.findUnique({ where: { kunci: "USE_MIN_BALANCE_METHOD" } })
    const useMinBalance = useMinBalanceFlag?.nilai === "true"

    // Include Bank and E-Wallet for interest calculation
    const akunList = await prisma.akun.findMany({
      where: {
        tipe: { in: ['BANK', 'E_WALLET'] },
        bungaAktif: true
      }
    })

    const processedTransactions = []
    const skippedAccounts = []
    const failedAccounts = []

    for (const akun of akunList) {
      const lastCreditStr = akun.lastInterestCreditDate ?
        `${akun.lastInterestCreditDate.getFullYear()}-${String(akun.lastInterestCreditDate.getMonth() + 1).padStart(2, '0')}` : null

      if (lastCreditStr === targetMonthStr) {
        skippedAccounts.push({ name: akun.nama, reason: "Sudah dikreditkan bulan ini" })
        continue
      }

      let basisBunga = akun.saldoSekarang
      let methodUsed = "Saldo Akhir"

      if (useMinBalance) {
        const res = await getMinimumBalanceForMonth(akun.id, lastMonth.getFullYear(), lastMonth.getMonth() + 1)
        if (res.notExists) {
          skippedAccounts.push({ name: akun.nama, reason: "Akun belum ada di bulan lalu" })
          continue
        }
        // Min Balance is returned as Float, convert back to BigInt
        const minBalanceBig = BigInt(Money.fromFloat(res.minBalance))
        basisBunga = minBalanceBig > BigInt(0) ? minBalanceBig : BigInt(0)
        methodUsed = "Saldo Terendah"
      }

      const tiers: TierBunga[] = JSON.parse(akun.bungaTiers || "[]")
      const basisBungaFloat = Money.toFloat(Number(basisBunga))
      const bungaPa = getApplicableInterestRate(basisBungaFloat, tiers)

      if (bungaPa <= 0) {
        skippedAccounts.push({ name: akun.nama, reason: "Bunga tidak berlaku untuk saldo ini" })
        continue
      }

      const bungaBersih = Math.floor((basisBungaFloat * (bungaPa / 100) / 12) * 0.8)
      if (bungaBersih < 1) {
        skippedAccounts.push({ name: akun.nama, reason: "Bunga terlalu kecil (< Rp 1)" })
        continue
      }

      if (dryRun) {
        processedTransactions.push({ name: akun.nama, nominal: bungaBersih })
        continue
      }

      try {
        const bungaBersihSen = BigInt(Money.fromFloat(bungaBersih))

        await prisma.$transaction(async (tx) => {
          let kategoriAkun = await tx.akun.findFirst({ where: { nama: "[INCOME] Bunga Tabungan" } })
          if (!kategoriAkun) kategoriAkun = await tx.akun.create({ data: { nama: "[INCOME] Bunga Tabungan", tipe: "PENDAPATAN", warna: "#10b981" } })

          await tx.transaksi.create({
            data: {
              tanggal: lastMonthEnd, deskripsi: `Bunga tabungan ${akun.nama} (${methodUsed})`, nominal: bungaBersihSen, kategori: "Bunga Tabungan",
              debitAkunId: akun.id, kreditAkunId: kategoriAkun.id,
              idempotencyKey: `interest-${akun.id}-${targetMonthStr}`
            }
          })
          await tx.akun.update({ where: { id: akun.id }, data: { saldoSekarang: { increment: bungaBersihSen }, lastInterestCreditDate: lastMonthEnd } })
          processedTransactions.push({ name: akun.nama })
        }, { timeout: 15000 })
      } catch (e: any) {
        failedAccounts.push({ name: akun.nama, error: e.message })
      }
    }

    // Always log the result
    const logMessage = dryRun
      ? `[SIMULASI] Bunga tabungan: ${processedTransactions.length} akun terdeteksi (dari ${akunList.length} akun aktif)`
      : `Bunga tabungan diproses: ${processedTransactions.length} berhasil (dari ${akunList.length} akun aktif)`

    await logSistem("INFO", "AUTOMASI", logMessage)

    // Log skipped accounts for debugging if nothing was processed
    if (processedTransactions.length === 0 && skippedAccounts.length > 0) {
      await logSistem("INFO", "AUTOMASI", `Akun di-skip: ${skippedAccounts.map(a => `${a.name} (${a.reason})`).slice(0, 3).join(', ')}${skippedAccounts.length > 3 ? '...' : ''}`)
    }

    safeRevalidate("/")
    safeRevalidate("/pengaturan")

    return { success: true, processed: processedTransactions.length, failed: 0 }
  } catch (error: any) {
    await logSistem("ERROR", "AUTOMASI", `Gagal proses bunga: ${error.message}`)
    return { success: false, error: error.message }
  }
}

export async function getUpcomingAdminFees() {
  try {
    const today = new Date()
    const nextWeek = new Date(); nextWeek.setDate(today.getDate() + 7);
    const upcoming = []
    const akunList = await prisma.akun.findMany({ where: { biayaAdminAktif: true, tipe: 'BANK' } })
    for (const akun of akunList) {
      const nextDate = calculateNextBillingDate(akun.biayaAdminPola!, akun.biayaAdminTanggal, today)
      if (nextDate <= nextWeek) upcoming.push({ akunId: akun.id, namaAkun: akun.nama, nominal: akun.biayaAdminNominal, tanggal: nextDate })
    }
    return { success: true, data: upcoming }
  } catch { return { success: false, data: [] } }
}

export async function resetAccountToTemplate(akunId: string) {
  try {
    const akun = await prisma.akun.findUnique({ where: { id: akunId }, include: { template: true } })
    if (!akun || !akun.template) return { success: false, error: "Akun/Template tidak ditemukan" }
    await prisma.akun.update({
      where: { id: akunId },
      data: {
        biayaAdminAktif: true, biayaAdminNominal: Math.round(akun.template.biayaAdmin || 0),
        biayaAdminPola: akun.template.polaTagihan, biayaAdminTanggal: akun.template.tanggalTagihan,
        bungaAktif: true, bungaTiers: akun.template.bungaTier, lastInterestCreditDate: null, lastAdminChargeDate: null
      }
    })
    safeRevalidate(`/akun/${akunId}`); return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}