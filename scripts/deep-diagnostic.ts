import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function diagnostic() {
  console.log('=== DEEP DIAGNOSTIC: AUTOMATION ENGINE ===')
  
  const now = new Date()
  console.log('Current Server Time:', now.toISOString())
  console.log('Local Time:', now.toLocaleString())

  // 1. Check App Settings
  const settings = await prisma.appSetting.findMany()
  console.log('\n[SETTINGS]')
  console.table(settings.map(s => ({ key: s.kunci, value: s.nilai })))

  // 2. Check Bank Accounts details
  const bankAccounts = await prisma.akun.findMany({
    where: { tipe: 'BANK' }
  })

  console.log('\n[BANK ACCOUNTS STATUS]')
  const tableData = bankAccounts.map(a => ({
    Nama: a.nama,
    'Admin Aktif': a.biayaAdminAktif,
    'Nominal Admin': a.biayaAdminNominal,
    'Pola Admin': a.biayaAdminPola,
    'Bunga Aktif': a.bungaAktif,
    'Has Tiers': !!a.bungaTiers,
    'Last Admin': a.lastAdminChargeDate ? a.lastAdminChargeDate.toISOString().split('T')[0] : 'Never',
    'Last Interest': a.lastInterestCreditDate ? a.lastInterestCreditDate.toISOString().split('T')[0] : 'Never'
  }))
  console.table(tableData)

  // 3. Logic Simulation for Admin Fee
  console.log('\n[SIMULATION: ADMIN FEE]')
  for (const a of bankAccounts) {
    if (!a.biayaAdminAktif) {
        console.log(`- ${a.nama}: SKIP (biayaAdminAktif is false)`)
        continue
    }
    console.log(`- ${a.nama}: Pola=${a.biayaAdminPola}, Tgl=${a.biayaAdminTanggal}`)
  }

  // 4. Logic Simulation for Interest
  console.log('\n[SIMULATION: INTEREST]')
  for (const a of bankAccounts) {
    if (!a.bungaAktif) {
        console.log(`- ${a.nama}: SKIP (bungaAktif is false)`)
        continue
    }
    console.log(`- ${a.nama}: Tiers Available`)
  }

  // 5. Check Transaction Table for Idempotency blockers
  const count = await prisma.transaksi.count({
    where: {
        OR: [
            { deskripsi: { contains: 'Biaya admin' } },
            { deskripsi: { contains: 'Bunga tabungan' } }
        ]
    }
  })
  console.log(`\nTotal automation transactions in DB: ${count}`)
}

diagnostic().finally(() => prisma.$disconnect())
