import { PrismaClient } from '@prisma/client'
import { processMonthlyAdminFees, processMonthlyInterest } from '../src/app/actions/recurring-admin'

const prisma = new PrismaClient()

interface AutomationTransaction {
  namaAkun: string;
  nominal: number;
  tanggal: Date;
}

async function testAutomation() {
  console.log('=== TESTING AUTOMATION ENGINE (DRY RUN) ===')
  
  // 1. Cek Data Akun Aktif
  const adminActiveCount = await prisma.akun.count({ 
    where: { 
      biayaAdminAktif: true,
      biayaAdminNominal: { not: null }
    } 
  })
  const interestActiveCount = await prisma.akun.count({ 
    where: { 
      bungaAktif: true,
      bungaTiers: { not: null }
    } 
  })
  
  console.log(`Jumlah akun dengan otomasi admin aktif: ${adminActiveCount}`)
  console.log(`Jumlah akun dengan otomasi bunga aktif: ${interestActiveCount}`)

  // 2. Test Biaya Admin
  console.log('\n--- Processing Admin Fees ---')
  const adminResult = await processMonthlyAdminFees(true)
  if (adminResult.success) {
    console.log(`Success! Terdeteksi ${adminResult.processed} tagihan admin.`)
  } else {
    console.error('Error:', adminResult.error)
  }

  // 3. Test Bunga
  console.log('\n--- Processing Interest Credits ---')
  const interestResult = await processMonthlyInterest(true)
  if (interestResult.success) {
    console.log(`Success! Terdeteksi ${interestResult.processed} bunga dikreditkan.`)
  } else {
    console.error('Error:', interestResult.error)
  }

  console.log('\n=== TESTING COMPLETED ===')
}

testAutomation()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
