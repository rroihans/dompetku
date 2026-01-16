import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const templates = await prisma.accountTemplate.findMany()
  console.log('Templates found:', templates.length)
  templates.forEach(t => console.log(`- ${t.nama} (${t.id})`))

  const accountsWithTemplate = await prisma.akun.findMany({
    where: {
      templateId: { not: null }
    }
  })
  console.log('\nAccounts with Template:', accountsWithTemplate.length)
  accountsWithTemplate.forEach(a => console.log(`- ${a.nama} (templateId: ${a.templateId})`))

  const allAccounts = await prisma.akun.findMany({ take: 5 })
  console.log('\nSample Accounts:', allAccounts.map(a => ({ id: a.id, nama: a.nama, templateId: a.templateId })))
}

main().finally(() => prisma.$disconnect())
