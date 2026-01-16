import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding account templates...')

  const templates = [
    {
      nama: 'BCA Tahapan Xpresi',
      tipeAkun: 'BANK',
      biayaAdmin: 10000,
      polaTagihan: 'JUMAT_MINGGU_KETIGA',
      bungaTier: JSON.stringify([
        { min_saldo: 0, max_saldo: 999999, bunga_pa: 0 },
        { min_saldo: 1000000, max_saldo: null, bunga_pa: 0.03 }
      ]),
      deskripsi: 'Biaya admin Rp10.000/bulan ditagih setiap Jumat minggu ketiga. Bunga 0% untuk saldo <1jt, 0.03%pa untuk ≥1jt. Setoran awal Rp50.000 (Rp25rb tabungan + Rp25rb cetak kartu).',
    },
    {
      nama: 'BCA Tahapan',
      tipeAkun: 'BANK',
      biayaAdmin: 15000,
      polaTagihan: 'TANGGAL_TETAP',
      tanggalTagihan: 1,
      bungaTier: JSON.stringify([
        { min_saldo: 0, max_saldo: 9999999, bunga_pa: 0 },
        { min_saldo: 10000000, max_saldo: 50000000, bunga_pa: 0.05 },
        { min_saldo: 50000001, max_saldo: null, bunga_pa: 0.10 }
      ]),
      deskripsi: 'Biaya admin Rp15.000 (Silver) ditagih tanggal 1 setiap bulan.',
    },
    {
      nama: 'Mandiri Tabungan Now',
      tipeAkun: 'BANK',
      biayaAdmin: 12000,
      polaTagihan: 'TANGGAL_TETAP',
      tanggalTagihan: 5,
      bungaTier: JSON.stringify([
        { min_saldo: 0, max_saldo: 1000000, bunga_pa: 0 },
        { min_saldo: 1000001, max_saldo: null, bunga_pa: 0.10 }
      ]),
      deskripsi: 'Biaya admin Rp12.000 ditagih tanggal 5 setiap bulan.',
    },
    {
      nama: 'BNI Taplus',
      tipeAkun: 'BANK',
      biayaAdmin: 15000,
      polaTagihan: 'TANGGAL_TETAP',
      tanggalTagihan: 10,
      bungaTier: JSON.stringify([
        { min_saldo: 0, max_saldo: 1000000, bunga_pa: 0 },
        { min_saldo: 1000001, max_saldo: null, bunga_pa: 0.05 }
      ]),
      deskripsi: 'Biaya admin Rp15.000 ditagih tanggal 10 setiap bulan.',
    },
    {
      nama: 'Custom (Tanpa Template)',
      tipeAkun: 'BANK',
      biayaAdmin: null,
      polaTagihan: 'TANGGAL_TETAP',
      tanggalTagihan: null,
      bungaTier: null,
      deskripsi: 'Template kosong untuk konfigurasi manual.',
    }
  ]

  for (const t of templates) {
    await prisma.accountTemplate.upsert({
      where: { id: t.nama }, // Temporary, should use a unique field if possible, but names are unique enough for seed
      update: t,
      create: {
        ...t,
        id: undefined // Let Prisma generate CUID
      }
    })
  }

  console.log('Seeding app settings...')
  await prisma.appSetting.upsert({
    where: { kunci: 'USE_MIN_BALANCE_METHOD' },
    update: {},
    create: {
      kunci: 'USE_MIN_BALANCE_METHOD',
      nilai: 'false' // Default false for safe rollout
    }
  })

  console.log('Seeding completed.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
