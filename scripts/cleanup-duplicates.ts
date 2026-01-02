// Script untuk menghapus akun duplikat
// Jalankan dengan: npx ts-node scripts/cleanup-duplicates.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDuplicates() {
    console.log("Mencari akun duplikat...")

    // Ambil semua akun user (non-internal)
    const akuns = await prisma.akun.findMany({
        where: {
            tipe: { in: ["BANK", "E_WALLET", "CASH", "CREDIT_CARD"] }
        },
        orderBy: { createdAt: 'asc' }
    })

    const namaMap = new Map<string, string>() // nama -> first id
    const toDelete: string[] = []

    for (const akun of akuns) {
        if (namaMap.has(akun.nama)) {
            // Duplikat ditemukan
            console.log(`Duplikat ditemukan: ${akun.nama} (ID: ${akun.id})`)
            toDelete.push(akun.id)
        } else {
            namaMap.set(akun.nama, akun.id)
        }
    }

    console.log(`\nTotal akun: ${akuns.length}`)
    console.log(`Akun duplikat: ${toDelete.length}`)

    if (toDelete.length > 0) {
        // Hapus transaksi terkait terlebih dahulu
        for (const id of toDelete) {
            await prisma.transaksi.deleteMany({
                where: {
                    OR: [
                        { debitAkunId: id },
                        { kreditAkunId: id }
                    ]
                }
            })
        }

        // Hapus akun duplikat
        await prisma.akun.deleteMany({
            where: { id: { in: toDelete } }
        })

        console.log(`\n✅ Berhasil menghapus ${toDelete.length} akun duplikat`)
    } else {
        console.log("\n✅ Tidak ada akun duplikat")
    }

    await prisma.$disconnect()
}

cleanupDuplicates()
