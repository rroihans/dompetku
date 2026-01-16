import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixEverything() {
  console.log('=== FIXING SYSTEM & DATA ===')
  
  // 1. Paksa aktifkan Feature Flag di database
  console.log('1. Mengatur Feature Flag...')
  const setting = await prisma.appSetting.upsert({
    where: { kunci: 'USE_MIN_BALANCE_METHOD' },
    update: { nilai: 'true' },
    create: { kunci: 'USE_MIN_BALANCE_METHOD', nilai: 'true' }
  })
  console.log('Feature Flag:', setting)

  // 2. Aktifkan otomasi bunga untuk SEMUA akun tipe BANK
  console.log('\n2. Mengaktifkan flag bungaAktif pada akun BANK...')
  const defaultTiers = JSON.stringify([
    { min_saldo: 0, max_saldo: 999999, bunga_pa: 0 },
    { min_saldo: 1000000, max_saldo: null, bunga_pa: 0.03 }
  ])

  const updatedAccounts = await prisma.akun.updateMany({
    where: { 
      tipe: 'BANK'
    },
    data: { 
      bungaAktif: true,
      lastInterestCreditDate: null // Reset agar bisa diproses ulang
    }
  })
  console.log(`Berhasil mengupdate ${updatedAccounts.count} akun.`)

  // 3. Pastikan akun "BCA Tahapan" punya tier bunga (untuk test Anda)
  const bca = await prisma.akun.findFirst({ where: { nama: { contains: 'BCA' } } })
  if (bca) {
    await prisma.akun.update({
      where: { id: bca.id },
      data: { bungaTiers: defaultTiers }
    })
    console.log(`Tier bunga ditambahkan ke akun: ${bca.nama}`)
  }

  console.log('\n=== SELESAI ===')
  console.log('Sekarang silakan klik "Proses Bunga" kembali di halaman Pengaturan.')
}

fixEverything().finally(() => prisma.$disconnect())
