import { PrismaClient } from '@prisma/client'
import { processMonthlyAdminFees, processMonthlyInterest } from '../src/app/actions/recurring-admin'

const prisma = new PrismaClient()

async function testAutomation() {
  console.log('=== TESTING AUTOMATION ENGINE (DRY RUN) ===')
  
  // 1. Cek Data Akun & Template
  const akunCount = await prisma.akun.count({ where: { templateId: { not: null } } })
  console.log(`Jumlah akun dengan template: ${akunCount}`)

  if (akunCount === 0) {
    console.log('WARN: Tidak ada akun dengan template. Silakan buat akun di UI atau seeder.')
  }

  // 2. Test Biaya Admin
  console.log('\n--- Processing Admin Fees ---')
  const adminResult = await processMonthlyAdminFees(true)
  if (adminResult.success) {
    console.log(`Success! Terdeteksi ${adminResult.processed} tagihan admin: `)
    adminResult.transactions?.forEach((t: any) => {
      console.log(`- ${t.namaAkun}: Rp ${t.nominal.toLocaleString()} pada ${t.tanggal.toDateString()}`)
    })
  } else {
    console.error('Error:', adminResult.error)
  }

  // 3. Test Bunga
  console.log('\n--- Processing Interest Credits ---')
  const interestResult = await processMonthlyInterest(true)
  if (interestResult.success) {
    console.log(`Success! Terdeteksi ${interestResult.processed} bunga dikreditkan: `)
    interestResult.transactions?.forEach((t: any) => {
      console.log(`- ${t.namaAkun}: Rp ${t.nominal.toLocaleString()} pada ${t.tanggal.toDateString()}`)
    })
  } else {
    console.error('Error:', interestResult.error)
  }

  console.log('\n=== TESTING COMPLETED ===')
}

testAutomation()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
