"use server"

import prisma from "@/lib/prisma"

export interface CalendarEvent {
    id: string
    date: Date
    type: 'cicilan' | 'recurring' | 'transaksi'
    title: string
    nominal: number
    description?: string
    color: string
}

// Ambil event untuk kalender (cicilan, recurring, transaksi)
export async function getCalendarEvents(bulan: number, tahun: number) {
    try {
        const startDate = new Date(tahun, bulan - 1, 1)
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

        // Ambil cicilan aktif
        const cicilanAktif = await prisma.rencanaCicilan.findMany({
            where: {
                status: "AKTIF",
            }
        })

        // Ambil recurring transactions (tanpa include karena tidak ada relasi)
        const recurring = await prisma.recurringTransaction.findMany({
            where: {
                aktif: true
            }
        })

        // Ambil transaksi bulan ini
        const transaksi = await prisma.transaksi.findMany({
            where: {
                tanggal: { gte: startDate, lte: endDate }
            },
            include: {
                kreditAkun: true,
                debitAkun: true
            },
            orderBy: { tanggal: 'asc' }
        })

        const events: CalendarEvent[] = []

        // Process cicilan - tanggal jatuh tempo
        for (const cicilan of cicilanAktif) {
            // Gunakan tanggalJatuhTempo (1-31)
            const tanggal = cicilan.tanggalJatuhTempo
            const lastDayOfMonth = new Date(tahun, bulan, 0).getDate()
            const jatuhTempo = new Date(tahun, bulan - 1, Math.min(tanggal, lastDayOfMonth))

            // Pastikan tanggal masih dalam bulan ini
            if (jatuhTempo >= startDate && jatuhTempo <= endDate) {
                const sisaBulan = cicilan.tenor - cicilan.cicilanKe + 1
                events.push({
                    id: `cicilan-${cicilan.id}`,
                    date: jatuhTempo,
                    type: 'cicilan',
                    title: cicilan.namaProduk,
                    nominal: cicilan.nominalPerBulan,
                    description: `Cicilan ke-${cicilan.cicilanKe} dari ${cicilan.tenor} - Sisa ${sisaBulan} bulan`,
                    color: '#f59e0b' // amber
                })
            }
        }

        // Process recurring transactions
        for (const rec of recurring) {
            switch (rec.frekuensi) {
                case 'HARIAN':
                    // Tampilkan untuk tanggal 1, 15, dan akhir bulan (simplified)
                    const lastDay = new Date(tahun, bulan, 0).getDate()
                        ;[1, 15, lastDay].forEach(day => {
                            events.push({
                                id: `recurring-${rec.id}-${day}`,
                                date: new Date(tahun, bulan - 1, day),
                                type: 'recurring',
                                title: rec.nama,
                                nominal: rec.nominal,
                                description: `${rec.kategori} - Harian`,
                                color: '#8b5cf6' // violet
                            })
                        })
                    break

                case 'MINGGUAN':
                    // Tampilkan setiap minggu
                    [1, 8, 15, 22, 29].forEach(day => {
                        if (day <= new Date(tahun, bulan, 0).getDate()) {
                            events.push({
                                id: `recurring-${rec.id}-${day}`,
                                date: new Date(tahun, bulan - 1, day),
                                type: 'recurring',
                                title: rec.nama,
                                nominal: rec.nominal,
                                description: `${rec.kategori} - Mingguan`,
                                color: '#8b5cf6'
                            })
                        }
                    })
                    break

                case 'BULANAN':
                    // Gunakan hariDalamBulan atau tanggal 1
                    const tanggalBulanan = rec.hariDalamBulan || 1
                    const maxDay = new Date(tahun, bulan, 0).getDate()
                    events.push({
                        id: `recurring-${rec.id}`,
                        date: new Date(tahun, bulan - 1, Math.min(tanggalBulanan, maxDay)),
                        type: 'recurring',
                        title: rec.nama,
                        nominal: rec.nominal,
                        description: `${rec.kategori} - Bulanan`,
                        color: '#8b5cf6'
                    })
                    break

                case 'TAHUNAN':
                    // Cek apakah bulan ini sesuai dengan tanggal mulai
                    const startMonth = rec.tanggalMulai.getMonth() + 1
                    if (startMonth === bulan) {
                        events.push({
                            id: `recurring-${rec.id}`,
                            date: new Date(tahun, bulan - 1, rec.tanggalMulai.getDate()),
                            type: 'recurring',
                            title: rec.nama,
                            nominal: rec.nominal,
                            description: `${rec.kategori} - Tahunan`,
                            color: '#8b5cf6'
                        })
                    }
                    break
            }
        }

        // Process transaksi
        for (const tx of transaksi) {
            // Skip internal transfers
            const isExpense = tx.debitAkun?.tipe === 'EXPENSE'
            const isIncome = tx.kreditAkun?.tipe === 'INCOME'

            if (isExpense || isIncome) {
                events.push({
                    id: `transaksi-${tx.id}`,
                    date: tx.tanggal,
                    type: 'transaksi',
                    title: tx.deskripsi,
                    nominal: tx.nominal,
                    description: isExpense ? `Pengeluaran - ${tx.kategori}` : `Pemasukan - ${tx.kategori}`,
                    color: isExpense ? '#ef4444' : '#22c55e' // red for expense, green for income
                })
            }
        }

        // Sort by date
        events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        return { success: true, data: events }
    } catch (error) {
        console.error('Error fetching calendar events:', error)
        return { success: false, data: [] }
    }
}

// Ambil ringkasan untuk header kalender
export async function getCalendarSummary(bulan: number, tahun: number) {
    try {
        const startDate = new Date(tahun, bulan - 1, 1)
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

        // Hitung total cicilan bulan ini
        const cicilanAktif = await prisma.rencanaCicilan.count({
            where: { status: "AKTIF" }
        })

        const totalCicilan = await prisma.rencanaCicilan.aggregate({
            where: { status: "AKTIF" },
            _sum: { nominalPerBulan: true }
        })

        // Hitung recurring aktif
        const recurringCount = await prisma.recurringTransaction.count({
            where: { aktif: true }
        })

        // Hitung transaksi bulan ini
        const transaksiCount = await prisma.transaksi.count({
            where: {
                tanggal: { gte: startDate, lte: endDate }
            }
        })

        return {
            success: true,
            data: {
                cicilanAktif,
                totalCicilan: totalCicilan._sum.nominalPerBulan || 0,
                recurringCount,
                transaksiCount
            }
        }
    } catch (error) {
        return {
            success: false,
            data: { cicilanAktif: 0, totalCicilan: 0, recurringCount: 0, transaksiCount: 0 }
        }
    }
}
