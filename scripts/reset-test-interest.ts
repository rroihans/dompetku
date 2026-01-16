import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetAndCheck() {
  console.log('=== VERIFIKASI DATA UJI ===')
  
  // 1. Cari akun yang Anda gunakan untuk uji coba
  const akun = await prisma.akun.findFirst({
    where: { nama: { contains: 'BCA' } } // Ganti jika nama akunnya beda
  })

  if (!akun) {
    console.log('Akun tidak ditemukan. Pastikan nama akun benar.')
    return
  }

  console.log(`Akun: ${akun.nama} (ID: ${akun.id})`)
  console.log(`Saldo Sekarang: ${akun.saldoSekarang}`)
  console.log(`Terakhir Bunga: ${akun.lastInterestCreditDate}`)

  // 2. Riset status bunga agar bisa diproses ulang
  await prisma.akun.update({
    where: { id: akun.id },
    data: { lastInterestCreditDate: null }
  })
  console.log('\n[RESET] Status lastInterestCreditDate telah dikosongkan.')

  // 3. Cek Transaksi di Bulan Desember
  const startDate = new Date(Date.UTC(2025, 11, 1))
  const endDate = new Date(Date.UTC(2025, 11, 31, 23, 59, 59))
  
  const txDec = await prisma.transaksi.findMany({
    where: {
      tanggal: { gte: startDate, lte: endDate },
      OR: [{ debitAkunId: akun.id }, { kreditAkunId: akun.id }]
    }
  })

  console.log(`\nJumlah transaksi di Desember 2025: ${txDec.length}`)
  txDec.forEach(t => console.log(`- ${t.tanggal.toISOString()} | ${t.deskripsi} | ${t.nominal}`))

  if (txDec.length < 2) {
    console.log('\n[WARNING] Transaksi uji coba Anda mungkin tidak berada di bulan Desember 2025.')
    console.log('Ingat: Engine bunga menghitung untuk "Bulan Lalu". Jika sekarang Januari, targetnya adalah Desember.')
  }
}

resetAndCheck().finally(() => prisma.$disconnect())
