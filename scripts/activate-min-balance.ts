import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function activateFeature() {
  console.log('Mengaktifkan fitur Minimum Balance...')
  await prisma.appSetting.upsert({
    where: { kunci: 'USE_MIN_BALANCE_METHOD' },
    update: { nilai: 'true' },
    create: {
      kunci: 'USE_MIN_BALANCE_METHOD',
      nilai: 'true'
    }
  })
  
  const check = await prisma.appSetting.findUnique({ where: { kunci: 'USE_MIN_BALANCE_METHOD' } })
  console.log('Status fitur saat ini:', check?.nilai === 'true' ? 'AKTIF (TRUE)' : 'MATI (FALSE)')
}

activateFeature().finally(() => prisma.$disconnect())
