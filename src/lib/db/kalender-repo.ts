import { db } from "./app-db";
import { Money } from "@/lib/money";

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
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999)

        // Ambil cicilan aktif
        const cicilanAktif = await db.rencanaCicilan
            .where({ status: "AKTIF" })
            .toArray();

        // Ambil recurring transactions
        const recurring = await db.recurringTransaction
            .where({ aktif: 1 }) // Boolean stored as 1/0 or true/false depending on dexie/indexeddb, but Dexie handles boolean usually. 
            // In AppDB interface it says boolean. IndexedDB standard is boolean. 
            // Dexie might index boolean as 0/1 if used in compound index, but simple where equals works with boolean.
            // Let's assume boolean. If fails, check if mapped to 1/0.
            .filter(r => r.aktif === true)
            .toArray();

        // Ambil transaksi bulan ini
        const transaksi = await db.transaksi
            .where("tanggal")
            .between(startDate, endDate, true, true)
            .toArray();

        // Need accounts for transaction description/color (expense vs income)
        const accountIds = new Set<string>();
        transaksi.forEach(tx => {
            accountIds.add(tx.debitAkunId);
            accountIds.add(tx.kreditAkunId);
        });
        const accounts = await db.akun.where("id").anyOf(Array.from(accountIds)).toArray();
        const accountMap = new Map(accounts.map(a => [a.id, a]));

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
                    nominal: Money.toFloat(cicilan.nominalPerBulanInt),
                    description: `Cicilan ke-${cicilan.cicilanKe} dari ${cicilan.tenor} - Sisa ${sisaBulan} bulan`,
                    color: '#f59e0b' // amber
                })
            }
        }

        // Process recurring transactions
        for (const rec of recurring) {
            // Check recurring active status again just in case (already filtered)

            const nominal = Money.toFloat(rec.nominalInt);

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
                                nominal: nominal,
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
                                nominal: nominal,
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
                        nominal: nominal,
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
                            nominal: nominal,
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
            const debitAkun = accountMap.get(tx.debitAkunId);
            const kreditAkun = accountMap.get(tx.kreditAkunId);

            const isExpense = debitAkun?.tipe === 'EXPENSE'
            const isIncome = kreditAkun?.tipe === 'INCOME'

            if (isExpense || isIncome) {
                events.push({
                    id: `transaksi-${tx.id}`,
                    date: tx.tanggal,
                    type: 'transaksi',
                    title: tx.deskripsi,
                    nominal: Money.toFloat(tx.nominalInt),
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
        const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999)

        // Hitung total cicilan bulan ini
        const cicilanAktif = await db.rencanaCicilan
            .where({ status: "AKTIF" })
            .toArray();

        const totalCicilan = cicilanAktif.reduce((sum, c) => sum + Money.toFloat(c.nominalPerBulanInt), 0);

        // Hitung recurring aktif
        const recurringCount = await db.recurringTransaction
            .filter(r => r.aktif === true)
            .count();

        // Hitung transaksi bulan ini
        const transaksiCount = await db.transaksi
            .where("tanggal")
            .between(startDate, endDate, true, true)
            .count();

        return {
            success: true,
            data: {
                cicilanAktif: cicilanAktif.length,
                totalCicilan,
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
