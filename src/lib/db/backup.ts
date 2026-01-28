import { db } from "./app-db";

export interface BackupData {
    version: number;
    timestamp: string;
    data: Record<string, any[]>;
    stats?: {
        totalAkun: number;
        totalTransaksi: number;
        totalCicilan: number;
        totalBudget: number;
    }
}

export async function exportData(): Promise<BackupData> {
    const data: Record<string, any[]> = {};

    // Iterate all tables dynamically
    for (const table of db.tables) {
        data[table.name] = await table.toArray();
    }

    const stats = {
        totalAkun: (data['akun'] || []).length,
        totalTransaksi: (data['transaksi'] || []).length,
        totalCicilan: (data['rencanaCicilan'] || []).length,
        totalBudget: (data['budget'] || []).length,
    }

    return {
        version: 1,
        timestamp: new Date().toISOString(),
        data,
        stats
    };
}

export async function importData(backup: BackupData, clearBeforeImport: boolean = false) {
    if (!backup.data) throw new Error("Invalid backup data");

    const stats = {
        imported: { akun: 0, transaksi: 0, cicilan: 0, recurring: 0, budget: 0 },
        skipped: { akun: 0, transaksi: 0 }
    }

    await db.transaction('rw', db.tables, async () => {
        if (clearBeforeImport) {
            for (const table of db.tables) {
                await table.clear();
            }
        }

        for (const tableName of Object.keys(backup.data)) {
            const table = db.table(tableName);
            if (table) {
                const rows = backup.data[tableName];
                if (Array.isArray(rows)) {
                    // Use bulkPut for speed and upsert behavior
                    await table.bulkPut(rows);

                    // Update stats (approximate)
                    if (tableName === 'akun') stats.imported.akun = rows.length;
                    if (tableName === 'transaksi') stats.imported.transaksi = rows.length;
                    if (tableName === 'rencanaCicilan') stats.imported.cicilan = rows.length;
                    if (tableName === 'recurringTransaction') stats.imported.recurring = rows.length;
                    if (tableName === 'budget') stats.imported.budget = rows.length;
                }
            }
        }
    });

    return { success: true, stats };
}

export async function resetAllData() {
    try {
        await db.transaction('rw', db.tables, async () => {
            for (const table of db.tables) {
                await table.clear();
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Reset data error:", error);
        return { success: false, error: "Gagal menghapus data" };
    }
}

export async function exportSelective(types: string[]) {
    const data: Record<string, any[]> = {};

    for (const type of types) {
        const tableName = type === 'cicilan' ? 'rencanaCicilan' :
            type === 'recurring' ? 'recurringTransaction' : type;

        const table = db.table(tableName);
        if (table) {
            data[tableName] = await table.toArray();
        }
    }

    return { success: true, data };
}
