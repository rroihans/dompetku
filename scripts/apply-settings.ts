import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Applying app settings...')
  await prisma.appSetting.upsert({
    where: { kunci: 'USE_MIN_BALANCE_METHOD' },
    update: {},
    create: {
      kunci: 'USE_MIN_BALANCE_METHOD',
      nilai: 'false'
    }
  })
  console.log('Done.')
}

main().finally(() => prisma.$disconnect())
