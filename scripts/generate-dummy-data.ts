// Script untuk generate dummy data
// Jalankan dengan: npx tsx scripts/generate-dummy-data.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Kategori pengeluaran
const KATEGORI_EXPENSE = [
    "Makan & Minum", "Transportasi", "Belanja", "Hiburan", "Kesehatan",
    "Pendidikan", "Tagihan", "Internet", "Listrik", "Air", "Pulsa"
]

// Kategori pemasukan
const KATEGORI_INCOME = ["Gaji", "Bonus", "Freelance", "Investasi", "Hadiah"]

// Deskripsi sample
const DESKRIPSI_EXPENSE: Record<string, string[]> = {
    "Makan & Minum": ["Makan siang", "Beli kopi", "Dinner", "Groceries", "Snack"],
    "Transportasi": ["Grab", "Gojek", "Bensin", "Parkir", "Tol"],
    "Belanja": ["Beli baju", "Sepatu", "Elektronik", "Aksesoris", "Peralatan"],
    "Hiburan": ["Nonton film", "Konser", "Game", "Netflix", "Spotify"],
    "Kesehatan": ["Obat", "Dokter", "Vitamin", "Gym membership"],
    "Tagihan": ["Tagihan CC", "Asuransi", "Cicilan"],
    "Internet": ["Tagihan internet", "Top up data"],
    "Listrik": ["Tagihan listrik", "Token listrik"],
    "Pulsa": ["Top up pulsa", "Paket data"],
}

const DESKRIPSI_INCOME: Record<string, string[]> = {
    "Gaji": ["Gaji bulan ini", "Gaji pokok"],
    "Bonus": ["Bonus tahunan", "THR", "Bonus project"],
    "Freelance": ["Project freelance", "Konsultasi", "Design job"],
    "Investasi": ["Dividen saham", "Return deposito", "Jual saham"],
    "Hadiah": ["Hadiah ulang tahun", "Angpao", "Cashback"],
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomChoice<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(start: Date, end: Date): Date {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function generateDummyData() {
    console.log("🚀 Generating dummy data...\n")

    // 1. Get user accounts
    const userAccounts = await prisma.akun.findMany({
        where: { tipe: { in: ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"] } }
    })

    if (userAccounts.length === 0) {
        console.log("❌ Tidak ada akun user. Buat akun terlebih dahulu.")
        return
    }

    console.log(`📋 Found ${userAccounts.length} user accounts:`)
    userAccounts.forEach(a => console.log(`   - ${a.nama} (${a.tipe})`))
    console.log()

    // 2. Ensure category accounts exist
    const allCategories = [...KATEGORI_EXPENSE, ...KATEGORI_INCOME]
    for (const kat of KATEGORI_EXPENSE) {
        const nama = `[EXPENSE] ${kat}`
        const existing = await prisma.akun.findFirst({ where: { nama } })
        if (!existing) {
            await prisma.akun.create({
                data: { nama, tipe: "EXPENSE", saldoAwal: 0, saldoSekarang: 0 }
            })
        }
    }
    for (const kat of KATEGORI_INCOME) {
        const nama = `[INCOME] ${kat}`
        const existing = await prisma.akun.findFirst({ where: { nama } })
        if (!existing) {
            await prisma.akun.create({
                data: { nama, tipe: "INCOME", saldoAwal: 0, saldoSekarang: 0 }
            })
        }
    }
    console.log("✅ Category accounts created\n")

    // 3. Generate transactions for last 6 months
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    console.log("📊 Generating transactions for last 6 months...")

    let totalExpense = 0
    let totalIncome = 0
    let txCount = 0

    // Generate 50-100 transactions per month
    for (let month = 0; month < 6; month++) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - month, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - month + 1, 0)

        const txPerMonth = randomInt(40, 80)

        for (let i = 0; i < txPerMonth; i++) {
            const isExpense = Math.random() > 0.25 // 75% expense, 25% income

            if (isExpense) {
                const kategori = randomChoice(KATEGORI_EXPENSE)
                const deskripsiList = DESKRIPSI_EXPENSE[kategori] || [kategori]
                const deskripsi = randomChoice(deskripsiList)
                const nominal = randomInt(5, 500) * 1000 // 5rb - 500rb

                const userAkun = randomChoice(userAccounts)
                const expenseAkun = await prisma.akun.findFirst({
                    where: { nama: `[EXPENSE] ${kategori}` }
                })

                if (expenseAkun) {
                    const nominalInt = BigInt(Math.round(nominal * 100))
                    await prisma.transaksi.create({
                        data: {
                            deskripsi,
                            nominal: nominalInt,
                            kategori,
                            tanggal: randomDate(monthStart, monthEnd),
                            debitAkunId: expenseAkun.id,
                            kreditAkunId: userAkun.id,
                        }
                    })
                    totalExpense += nominal
                    txCount++
                }
            } else {
                const kategori = randomChoice(KATEGORI_INCOME)
                const deskripsiList = DESKRIPSI_INCOME[kategori] || [kategori]
                const deskripsi = randomChoice(deskripsiList)

                // Income biasanya lebih besar
                const nominal = kategori === "Gaji"
                    ? randomInt(3000, 15000) * 1000
                    : randomInt(100, 2000) * 1000

                const userAkun = randomChoice(userAccounts)
                const incomeAkun = await prisma.akun.findFirst({
                    where: { nama: `[INCOME] ${kategori}` }
                })

                if (incomeAkun) {
                    const nominalInt = BigInt(Math.round(nominal * 100))
                    await prisma.transaksi.create({
                        data: {
                            deskripsi,
                            nominal: nominalInt,
                            kategori,
                            tanggal: randomDate(monthStart, monthEnd),
                            debitAkunId: userAkun.id,
                            kreditAkunId: incomeAkun.id,
                        }
                    })
                    totalIncome += nominal
                    txCount++
                }
            }
        }

        console.log(`   Month -${month}: ${txPerMonth} transactions`)
    }

    console.log(`\n✅ Created ${txCount} transactions`)
    console.log(`   Total Income: Rp ${totalIncome.toLocaleString("id-ID")}`)
    console.log(`   Total Expense: Rp ${totalExpense.toLocaleString("id-ID")}`)

    // 4. Generate recurring transactions
    console.log("\n📅 Generating recurring transactions...")

    const recurringTemplates = [
        { nama: "Gaji Bulanan", nominal: 8500000, kategori: "Gaji", tipe: "MASUK", frekuensi: "BULANAN", hari: 25 },
        { nama: "Tagihan Internet", nominal: 350000, kategori: "Internet", tipe: "KELUAR", frekuensi: "BULANAN", hari: 5 },
        { nama: "Tagihan Listrik", nominal: 250000, kategori: "Listrik", tipe: "KELUAR", frekuensi: "BULANAN", hari: 20 },
        { nama: "Netflix", nominal: 54000, kategori: "Hiburan", tipe: "KELUAR", frekuensi: "BULANAN", hari: 15 },
        { nama: "Spotify", nominal: 54990, kategori: "Hiburan", tipe: "KELUAR", frekuensi: "BULANAN", hari: 15 },
        { nama: "Gym Membership", nominal: 500000, kategori: "Kesehatan", tipe: "KELUAR", frekuensi: "BULANAN", hari: 1 },
    ]

    for (const tpl of recurringTemplates) {
        // Cek apakah sudah ada
        const existing = await prisma.recurringTransaction.findFirst({
            where: { nama: tpl.nama }
        })

        if (!existing) {
            const userAkun = randomChoice(userAccounts)
            await prisma.recurringTransaction.create({
                data: {
                    nama: tpl.nama,
                    nominal: tpl.nominal,
                    kategori: tpl.kategori,
                    tipeTransaksi: tpl.tipe as "MASUK" | "KELUAR",
                    akunId: userAkun.id,
                    frekuensi: tpl.frekuensi as any,
                    hariDalamBulan: tpl.hari,
                    aktif: true,
                }
            })
            console.log(`   ✅ ${tpl.nama}`)
        } else {
            console.log(`   ⏭️ ${tpl.nama} (already exists)`)
        }
    }

    // 5. Update saldo akun berdasarkan transaksi
    console.log("\n💰 Updating account balances...")

    for (const akun of userAccounts) {
        // Hitung total debit (masuk) dan kredit (keluar)
        const transactions = await prisma.transaksi.findMany({
            where: {
                OR: [
                    { debitAkunId: akun.id },
                    { kreditAkunId: akun.id }
                ]
            }
        })

        let balance = BigInt(Math.round(Number(akun.saldoAwal) * 100))
        for (const tx of transactions) {
            if (tx.debitAkunId === akun.id) {
                balance += tx.nominal // Masuk ke akun ini
            }
            if (tx.kreditAkunId === akun.id) {
                balance -= tx.nominal // Keluar dari akun ini
            }
        }

        await prisma.akun.update({
            where: { id: akun.id },
            data: { saldoSekarang: balance }
        })

        console.log(`   ${akun.nama}: Rp ${(Number(balance) / 100).toLocaleString("id-ID")}`)
    }

    console.log("\n🎉 Dummy data generation complete!")
    console.log("   Visit /devdb to inspect the database")

    await prisma.$disconnect()
}

generateDummyData().catch(console.error)
