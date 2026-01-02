// Script untuk generate dummy data cicilan
// Jalankan dengan: npx tsx scripts/generate-cicilan-dummy.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Template cicilan
const CICILAN_TEMPLATES = [
    {
        namaProduk: "iPhone 15 Pro Max",
        totalPokok: 22000000,
        tenor: 12,
        bungaPersen: 2.5,
        biayaAdmin: 100000,
        tanggalJatuhTempo: 5,
        cicilanKe: 3,  // Sudah bayar 2x
    },
    {
        namaProduk: "MacBook Air M3",
        totalPokok: 18500000,
        tenor: 6,
        bungaPersen: 0,
        biayaAdmin: 0,
        tanggalJatuhTempo: 10,
        cicilanKe: 6,  // Sudah lunas
    },
    {
        namaProduk: "Samsung Galaxy S24 Ultra",
        totalPokok: 19500000,
        tenor: 12,
        bungaPersen: 1.99,
        biayaAdmin: 50000,
        tanggalJatuhTempo: 15,
        cicilanKe: 1,  // Baru mulai
    },
    {
        namaProduk: "PlayStation 5 Pro",
        totalPokok: 12000000,
        tenor: 6,
        bungaPersen: 0,
        biayaAdmin: 0,
        tanggalJatuhTempo: 20,
        cicilanKe: 4,  // Setengah jalan
    },
    {
        namaProduk: "LG OLED TV 55\"",
        totalPokok: 25000000,
        tenor: 24,
        bungaPersen: 3.5,
        biayaAdmin: 150000,
        tanggalJatuhTempo: 25,
        cicilanKe: 8,
    },
]

async function generateCicilanDummy() {
    console.log("🚀 Generating cicilan dummy data...\n")

    // 1. Cek akun kartu kredit
    let kartuKredit = await prisma.akun.findFirst({
        where: { tipe: "CREDIT_CARD" }
    })

    // Jika belum ada, buat kartu kredit
    if (!kartuKredit) {
        console.log("📁 Creating credit card account...")
        kartuKredit = await prisma.akun.create({
            data: {
                nama: "Kartu Kredit BCA",
                tipe: "CREDIT_CARD",
                saldoAwal: 0,
                saldoSekarang: 0,
                limitKredit: 50000000,
                warna: "#1d4ed8"
            }
        })
        console.log("   ✅ Created: Kartu Kredit BCA (Limit: Rp 50.000.000)\n")
    } else {
        console.log(`📋 Found credit card: ${kartuKredit.nama}\n`)
    }

    // 2. Cari atau buat akun pengeluaran cicilan
    let akunCicilan = await prisma.akun.findFirst({
        where: { nama: "[EXPENSE] Cicilan" }
    })

    if (!akunCicilan) {
        akunCicilan = await prisma.akun.create({
            data: {
                nama: "[EXPENSE] Cicilan",
                tipe: "EXPENSE",
                saldoAwal: 0,
                saldoSekarang: 0,
            }
        })
    }

    // 3. Generate cicilan
    console.log("💳 Generating cicilan...\n")

    for (const tpl of CICILAN_TEMPLATES) {
        // Cek apakah sudah ada
        const existing = await prisma.rencanaCicilan.findFirst({
            where: { namaProduk: tpl.namaProduk }
        })

        if (existing) {
            console.log(`   ⏭️ ${tpl.namaProduk} (already exists)`)
            continue
        }

        // Hitung nominal per bulan
        const totalBunga = (tpl.totalPokok * tpl.bungaPersen) / 100
        const totalDenganBunga = tpl.totalPokok + totalBunga + tpl.biayaAdmin
        const nominalPerBulan = Math.ceil(totalDenganBunga / tpl.tenor)

        // Tentukan status
        const isLunas = tpl.cicilanKe > tpl.tenor
        const status = isLunas ? "LUNAS" : "AKTIF"

        // Buat cicilan
        const cicilan = await prisma.rencanaCicilan.create({
            data: {
                namaProduk: tpl.namaProduk,
                totalPokok: tpl.totalPokok,
                tenor: tpl.tenor,
                cicilanKe: tpl.cicilanKe,
                nominalPerBulan,
                biayaAdmin: tpl.biayaAdmin,
                bungaPersen: tpl.bungaPersen,
                tanggalJatuhTempo: tpl.tanggalJatuhTempo,
                status,
                akunKreditId: kartuKredit.id,
                akunDebitId: akunCicilan.id,
            }
        })

        // Buat transaksi untuk pembayaran yang sudah terjadi
        const pembayaranDone = tpl.cicilanKe - 1
        if (pembayaranDone > 0) {
            const now = new Date()
            for (let i = 0; i < pembayaranDone; i++) {
                const tanggal = new Date(now.getFullYear(), now.getMonth() - (pembayaranDone - i), tpl.tanggalJatuhTempo)

                await prisma.transaksi.create({
                    data: {
                        deskripsi: `Cicilan ${tpl.namaProduk} (${i + 1}/${tpl.tenor})`,
                        nominal: nominalPerBulan,
                        kategori: "Cicilan",
                        tanggal,
                        debitAkunId: akunCicilan.id,
                        kreditAkunId: kartuKredit.id,
                        rencanaCicilanId: cicilan.id,
                        catatan: `Pembayaran cicilan ke-${i + 1}`,
                    }
                })
            }

            // Update saldo kartu kredit
            const totalDibayar = pembayaranDone * nominalPerBulan
            await prisma.akun.update({
                where: { id: kartuKredit.id },
                data: { saldoSekarang: { decrement: totalDibayar } }
            })
        }

        const sisaTenor = tpl.tenor - tpl.cicilanKe + 1
        const sisaNominal = sisaTenor * nominalPerBulan

        console.log(`   ✅ ${tpl.namaProduk}`)
        console.log(`      Total: Rp ${tpl.totalPokok.toLocaleString("id-ID")}`)
        console.log(`      Cicilan: Rp ${nominalPerBulan.toLocaleString("id-ID")}/bulan × ${tpl.tenor}x`)
        console.log(`      Progress: ${tpl.cicilanKe - 1}/${tpl.tenor} (${status})`)
        if (!isLunas) {
            console.log(`      Sisa: Rp ${sisaNominal.toLocaleString("id-ID")}`)
        }
        console.log()
    }

    // 4. Tampilkan ringkasan
    const stats = await prisma.rencanaCicilan.findMany()
    const aktif = stats.filter(c => c.status === "AKTIF")
    const lunas = stats.filter(c => c.status === "LUNAS")

    let totalHutang = 0
    for (const c of aktif) {
        const sisaTenor = c.tenor - c.cicilanKe + 1
        totalHutang += sisaTenor * c.nominalPerBulan
    }

    console.log("📊 Summary:")
    console.log(`   Total Cicilan: ${stats.length}`)
    console.log(`   Aktif: ${aktif.length}`)
    console.log(`   Lunas: ${lunas.length}`)
    console.log(`   Total Hutang: Rp ${totalHutang.toLocaleString("id-ID")}`)

    console.log("\n🎉 Cicilan dummy data generation complete!")
    console.log("   Visit /cicilan to see the result")

    await prisma.$disconnect()
}

generateCicilanDummy().catch(console.error)
