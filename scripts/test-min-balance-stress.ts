import { PrismaClient } from '@prisma/client'
import { getMinimumBalanceForMonth } from '../src/app/actions/recurring-admin'

const prisma = new PrismaClient()

async function stressTest() {
  console.log('=== STARTING STRESS TEST: MINIMUM BALANCE CALCULATION ===')
  
  const testAccountName = `STRESS_TEST_${Date.now()}`
  const targetYear = 2025
  const targetMonth = 12 // Desember 2025
  const initialBalance = 100000000 // 100jt
  
  // 1. Create Test Account
  const account = await prisma.akun.create({
    data: {
      nama: testAccountName,
      tipe: 'BANK',
      saldoAwal: BigInt(Math.round(initialBalance * 100)),
      saldoSekarang: BigInt(Math.round(initialBalance * 100)),
      createdAt: new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0)) // 1 Des 2025 UTC
    }
  })
  
  console.log(`Created test account: ${account.nama} (ID: ${account.id})`)

  try {
    // 2. Generate 1000 Transactions
    console.log('Generating 1000 transactions...')
    const transactions = []
    let currentSimulatedBalance = initialBalance
    let expectedMinBalance = initialBalance

    // Create a special category for stress test
    const categoryName = "[STRESS] Testing"
    let expenseAccount = await prisma.akun.findFirst({ where: { nama: `[EXPENSE] ${categoryName}` } })
    if (!expenseAccount) {
      expenseAccount = await prisma.akun.create({
        data: { 
            nama: `[EXPENSE] ${categoryName}`, 
            tipe: 'PENGELUARAN',
            saldoAwal: BigInt(0),
            saldoSekarang: BigInt(0)
        }
      })
    }

    for (let i = 0; i < 1000; i++) {
      const isOut = Math.random() > 0.3
      const amount = Math.floor(Math.random() * 1000000)
      const day = Math.floor(Math.random() * 28) + 1
      
      if (isOut) {
        currentSimulatedBalance -= amount
      } else {
        currentSimulatedBalance += amount
      }

      if (currentSimulatedBalance < expectedMinBalance) {
        expectedMinBalance = currentSimulatedBalance
      }

      transactions.push({
        tanggal: new Date(Date.UTC(targetYear, targetMonth - 1, day, 12, 0, 0)),
        deskripsi: `Stress Test Tx #${i}`,
        nominal: amount,
        kategori: categoryName,
        debitAkunId: isOut ? expenseAccount.id : account.id,
        kreditAkunId: isOut ? account.id : expenseAccount.id
      })
    }

    // Update real balance
    await prisma.akun.update({
      where: { id: account.id },
      data: { saldoSekarang: BigInt(Math.round(currentSimulatedBalance * 100)) }
    })

    // Individually create transactions (SQLite fallback)
    console.log('Inserting transactions to DB...')
    for (const tx of transactions) {
      await prisma.transaksi.create({ 
          data: {
              ...tx,
              nominal: BigInt(Math.round(tx.nominal * 100))
          }
      })
    }
    console.log('1000 transactions generated and saved.')

    // 3. Run Engine
    console.log('\n--- Running Calculation Engine ---')
    const result = await getMinimumBalanceForMonth(account.id, targetYear, targetMonth)
    
    // Convert BigInt minBalance if needed, but getMinimumBalanceForMonth returns Float now
    console.log(`Execution Time: ${result.executionTime.toFixed(2)}ms`)
    console.log(`Expected Min Balance: Rp ${expectedMinBalance.toLocaleString()}`)
    console.log(`Actual Min Balance:   Rp ${result.minBalance.toLocaleString()}`)

    const diff = Math.abs(result.minBalance - expectedMinBalance)
    if (diff < 0.01) {
      console.log('✅ TEST PASSED: Accuracy is 100%')
    } else {
      console.error(`❌ TEST FAILED: Difference of ${diff}`)
    }

    if (result.executionTime < 200) {
      console.log('✅ PERFORMANCE PASSED: < 200ms')
    } else {
      console.error('❌ PERFORMANCE FAILED: > 200ms')
    }

    // 4. Timezone Edge Case Test (23:59 vs 00:01)
    console.log('\n--- Running Timezone Edge Case Test ---')
    const lateTxDate = new Date(targetYear, targetMonth - 1, 1, 23, 59, 59)
    const earlyTxDate = new Date(targetYear, targetMonth - 1, 2, 0, 1, 0)
    
    // Just verify they stay in the same month if target is that month
    console.log(`Late Tx: ${lateTxDate.toISOString()} -> month ${lateTxDate.getMonth() + 1}`)
    console.log(`Early Tx: ${earlyTxDate.toISOString()} -> month ${earlyTxDate.getMonth() + 1}`)

  } finally {
    // Cleanup
    console.log('\nCleaning up stress test data...')
    await prisma.transaksi.deleteMany({ where: { deskripsi: { startsWith: 'Stress Test Tx' } } })
    await prisma.akun.delete({ where: { id: account.id } })
    console.log('Done.')
  }
}

stressTest()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
