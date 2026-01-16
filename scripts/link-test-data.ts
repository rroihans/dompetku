import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const template = await prisma.accountTemplate.findFirst({
    where: { nama: 'BCA Tahapan' }
  })

  if (!template) {
    console.error('Template BCA Tahapan not found')
    return
  }

  const account = await prisma.akun.findFirst({
    where: { nama: 'BCA Tahapan' }
  })

  if (!account) {
    console.error('Account BCA Tahapan not found')
    return
  }

  await prisma.akun.update({
    where: { id: account.id },
    data: { templateId: template.id }
  })

  console.log(`Linked account "${account.nama}" to template "${template.nama}"`)
}

main().finally(() => prisma.$disconnect())
