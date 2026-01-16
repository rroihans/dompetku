import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backdateAccount() {
  const bca = await prisma.akun.findFirst({ where: { nama: { contains: 'BCA' } } })
  if (bca) {
    await prisma.akun.update({
      where: { id: bca.id },
      data: { createdAt: new Date(Date.UTC(2025, 10, 1)) } // Mundurkan ke 1 Nov 2025
    })
    console.log(`[SUCCESS] Tanggal pembuatan akun ${bca.nama} telah dimundurkan ke November 2025.`)
  }
}

backdateAccount().finally(() => prisma.$disconnect())
