import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function setupTestScenario() {
  console.log('=== SETUP SKENARIO UJI DESEMBER ===')
  
  const testName = 'BANK UJI MINBAL'
  
  // 1. Bersihkan data lama jika ada
  await prisma.transaksi.deleteMany({ where: { kategori: 'Test Minbal' } })
  await prisma.akun.deleteMany({ where: { nama: testName } })

  // 2. Buat Akun yang seolah-olah sudah ada sejak November
  const account = await prisma.akun.create({
    data: {
      nama: testName,
      tipe: 'BANK',
      saldoAwal: 100000000, // Mulai dengan 100jt
      saldoSekarang: 100000000,
      createdAt: new Date(Date.UTC(2025, 10, 1)), // 1 Nov 2025
      biayaAdminAktif: true,
      biayaAdminNominal: 15000,
      biayaAdminPola: 'TANGGAL_TETAP',
      biayaAdminTanggal: 1,
      bungaAktif: true,
      bungaTiers: JSON.stringify([
        { min_saldo: 0, max_saldo: 999999, bunga_pa: 0 },
        { min_saldo: 1000000, max_saldo: null, bunga_pa: 0.03 }
      ])
    }
  })
  console.log('Akun dibuat dengan saldo awal 100jt.')

  // 3. Tambahkan transaksi TARIK 95jt di tengah Desember
  await prisma.transaksi.create({
    data: {
      tanggal: new Date(Date.UTC(2025, 11, 15, 10, 0, 0)), // 15 Des 2025
      deskripsi: 'Penarikan Besar (Test Minbal)',
      nominal: 95000000,
      kategori: 'Test Minbal',
      debitAkunId: (await prisma.akun.findFirst({ where: { tipe: 'EXPENSE' } }))!.id,
      kreditAkunId: account.id
    }
  })
  
  // 4. Tambahkan transaksi SETOR 100jt di akhir Desember (Saldo akhir jadi 105jt)
  await prisma.transaksi.create({
    data: {
      tanggal: new Date(Date.UTC(2025, 11, 25, 10, 0, 0)), // 25 Des 2025
      deskripsi: 'Setoran Kembali (Test Minbal)',
      nominal: 100000000,
      kategori: 'Test Minbal',
      debitAkunId: account.id,
      kreditAkunId: (await prisma.akun.findFirst({ where: { tipe: 'INCOME' } }))!.id
    }
  })

  // Update saldo sekarang
  await prisma.akun.update({
    where: { id: account.id },
    data: { saldoSekarang: 105000000 }
  })

  console.log('Skenario siap: Saldo Awal 100jt -> Drop ke 5jt (Min) -> Akhir 105jt.')
  console.log('Silakan ke halaman Pengaturan dan klik "Proses Bunga".')
  console.log('Hasil yang diharapkan: Bunga dihitung dari 5jt (Sekitar Rp 100).')
}

setupTestScenario().finally(() => prisma.$disconnect())
