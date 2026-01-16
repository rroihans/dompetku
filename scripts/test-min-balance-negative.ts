import { PrismaClient } from '@prisma/client'
import { getMinimumBalanceForMonth } from '../src/app/actions/recurring-admin'

const prisma = new PrismaClient()

async function negativeTests() {
  console.log('=== STARTING NEGATIVE & EDGE CASE TESTS ===')
  
  const targetYear = 2025
  const targetMonth = 12
  const results = []

  // Helper to create account
  const createAccount = async (name: string, balance: number, createdAt: Date) => {
    return await prisma.akun.create({
      data: { nama: name, tipe: 'BANK', saldoAwal: balance, saldoSekarang: balance, createdAt }
    })
  }

  // Helper to add transaction
  const addTx = async (accId: string, amount: number, date: Date, isOut: boolean) => {
    const expense = await prisma.akun.findFirst({ where: { tipe: 'PENGELUARAN' } })
    await prisma.transaksi.create({
      data: {
        tanggal: date,
        deskripsi: 'Test Tx',
        nominal: amount,
        kategori: 'Test',
        debitAkunId: isOut ? expense!.id : accId,
        kreditAkunId: isOut ? accId : expense!.id
      }
    })
    // Update balance
    await prisma.akun.update({
      where: { id: accId },
      data: { saldoSekarang: { [isOut ? 'decrement' : 'increment']: amount } }
    })
  }

  try {
    // 1. Akun baru dibuat mid-month (15 Des)
    console.log('\nTest 1: Mid-month account...')
    const acc1 = await createAccount('MID_MONTH', 1000000, new Date(Date.UTC(2025, 11, 15)))
    // Add tx on 20 Des
    await addTx(acc1.id, 500000, new Date(Date.UTC(2025, 11, 20)), true)
    const res1 = await getMinimumBalanceForMonth(acc1.id, 2025, 12)
    console.log(`Expected: 500.000, Actual: ${res1.minBalance}`)
    results.push(res1.minBalance === 500000)

    // 2. Akun tanpa transaksi sama sekali
    console.log('\nTest 2: No transactions...')
    const acc2 = await createAccount('NO_TX', 2000000, new Date(Date.UTC(2025, 10, 1)))
    const res2 = await getMinimumBalanceForMonth(acc2.id, 2025, 12)
    console.log(`Expected: 2.000.000, Actual: ${res2.minBalance}`)
    results.push(res2.minBalance === 2000000)

    // 3. Saldo negatif sepanjang bulan
    console.log('\nTest 3: Negative balance...')
    const acc3 = await createAccount('NEG_BAL', -100000, new Date(Date.UTC(2025, 10, 1)))
    await addTx(acc3.id, 50000, new Date(Date.UTC(2025, 11, 5)), true)
    const res3 = await getMinimumBalanceForMonth(acc3.id, 2025, 12)
    console.log(`Expected: -150.000, Actual: ${res3.minBalance}`)
    results.push(res3.minBalance === -150000)

    // 4. Transaksi di luar target month
    console.log('\nTest 4: Transactions outside target month...')
    const acc4 = await createAccount('OUTSIDE_TX', 1000000, new Date(Date.UTC(2025, 10, 1)))
    await addTx(acc4.id, 500000, new Date(Date.UTC(2025, 10, 15)), true) // Nov (Before)
    await addTx(acc4.id, 200000, new Date(Date.UTC(2026, 0, 5)), true)   // Jan (After)
    const res4 = await getMinimumBalanceForMonth(acc4.id, 2025, 12)
    console.log(`Expected: 500.000, Actual: ${res4.minBalance}`) // Nov end balance was 500k
    results.push(res4.minBalance === 500000)

  } finally {
    console.log('\nCleaning up...')
    await prisma.transaksi.deleteMany({ where: { deskripsi: 'Test Tx' } })
    await prisma.akun.deleteMany({ where: { nama: { in: ['MID_MONTH', 'NO_TX', 'NEG_BAL', 'OUTSIDE_TX'] } } })
  }

  const allPassed = results.every(r => r === true)
  console.log(`\nOVERALL RESULT: ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)
}

negativeTests()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
