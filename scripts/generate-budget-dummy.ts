// Script untuk generate dummy data budget/anggaran
// Jalankan dengan: npx tsx scripts/generate-budget-dummy.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Template budget bulanan
const BUDGET_TEMPLATES = [
    { kategori: "Makan & Minum", nominal: 2500000 },
    { kategori: "Transportasi", nominal: 800000 },
    { kategori: "Belanja", nominal: 1500000 },
    { kategori: "Hiburan", nominal: 500000 },
    { kategori: "Kesehatan", nominal: 300000 },
    { kategori: "Tagihan", nominal: 1000000 },
    { kategori: "Internet", nominal: 400000 },
    { kategori: "Listrik", nominal: 350000 },
    { kategori: "Pulsa", nominal: 200000 },
]

async function generateBudgetDummy() {
    console.log("🚀 Generating budget dummy data...\n")

    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Generate budget untuk 3 bulan: bulan lalu, bulan ini, bulan depan
    const months = [
        { bulan: currentMonth - 1 <= 0 ? 12 : currentMonth - 1, tahun: currentMonth - 1 <= 0 ? currentYear - 1 : currentYear },
        { bulan: currentMonth, tahun: currentYear },
        { bulan: currentMonth + 1 > 12 ? 1 : currentMonth + 1, tahun: currentMonth + 1 > 12 ? currentYear + 1 : currentYear },
    ]

    const BULAN_LABEL = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ]

    for (const { bulan, tahun } of months) {
        console.log(`📅 ${BULAN_LABEL[bulan - 1]} ${tahun}:`)

        for (const tpl of BUDGET_TEMPLATES) {
            // Cek apakah sudah ada
            const existing = await prisma.budget.findFirst({
                where: { kategori: tpl.kategori, bulan, tahun }
            })

            if (existing) {
                console.log(`   ⏭️ ${tpl.kategori} (already exists)`)
                continue
            }

            // Random variasi nominal ±10%
            const variasi = 1 + (Math.random() * 0.2 - 0.1)
            const nominal = Math.round(tpl.nominal * variasi / 10000) * 10000

            await prisma.budget.create({
                data: {
                    kategori: tpl.kategori,
                    bulan,
                    tahun,
                    nominal,
                }
            })

            console.log(`   ✅ ${tpl.kategori}: Rp ${nominal.toLocaleString("id-ID")}`)
        }
        console.log()
    }

    // Tampilkan ringkasan
    const totalBudgets = await prisma.budget.count()
    const totalNominal = await prisma.budget.aggregate({
        _sum: { nominal: true }
    })

    console.log("📊 Summary:")
    console.log(`   Total Budget Entries: ${totalBudgets}`)
    console.log(`   Total Nominal: Rp ${(totalNominal._sum.nominal || 0).toLocaleString("id-ID")}`)

    console.log("\n🎉 Budget dummy data generation complete!")
    console.log("   Visit /anggaran to see the result")

    await prisma.$disconnect()
}

generateBudgetDummy().catch(console.error)
