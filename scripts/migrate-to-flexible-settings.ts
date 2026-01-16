import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const isDryRun = process.argv.includes('--dry-run')
  console.log(isDryRun ? '--- DRY RUN MODE ---' : '--- LIVE MIGRATION MODE ---')

  const accounts = await prisma.akun.findMany({
    include: {
      template: true
    }
  })

  console.log(`Found ${accounts.length} accounts to process.`)

  let successCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const account of accounts) {
    if (!account.template) {
      console.log(`[SKIP] Account "${account.nama}" (${account.id}) has no template.`) 
      skippedCount++
      continue
    }

    const template = account.template
    
    const updateData = {
      templateSource: template.id,
      biayaAdminAktif: true,
      biayaAdminNominal: template.biayaAdmin ? Math.round(template.biayaAdmin) : null,
      biayaAdminPola: template.polaTagihan,
      biayaAdminTanggal: template.tanggalTagihan,
      bungaAktif: template.bungaTier ? JSON.parse(template.bungaTier).length > 0 : false,
      bungaTiers: template.bungaTier,
      templateOverrides: JSON.stringify({
        initial_migration: true,
        migrated_at: new Date().toISOString(),
        original_template_id: template.id
      }),
      settingsLastModified: new Date(),
      // We keep templateId for now to avoid breaking relations until we are sure, 
      // but the spec says "hapus relasi accountTemplateId karena sekarang data ownership di Akun sendiri"
      // However, usually it's safer to just null it out in the update.
      templateId: null 
    }

    if (isDryRun) {
      console.log(`[DRY-RUN] Would update account "${account.nama}" (${account.id}) with:`, updateData)
      successCount++
    } else {
      try {
        await prisma.akun.update({
          where: { id: account.id },
          data: updateData
        })
        console.log(`[SUCCESS] Migrated account "${account.nama}" (${account.id}).`)
        successCount++
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[ERROR] Failed to migrate account "${account.nama}" (${account.id}):`, errorMessage)
        errorCount++
      }
    }
  }

  console.log('\nMigration Summary:')
  console.log(`Total: ${accounts.length}`)
  console.log(`Success: ${successCount}`)
  console.log(`Skipped: ${skippedCount}`)
  console.log(`Error: ${errorCount}`)

  if (isDryRun) {
    console.log('\nNo changes were made to the database.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
