import { db } from "./app-db";
import { type NotificationRecord } from "./app-db";
import { Money } from "@/lib/money";

export async function getNotifications(limit: number = 20) {
    try {
        const notifications = await db.notification
            .orderBy("createdAt")
            .reverse()
            .limit(limit)
            .toArray();
        return { success: true, data: notifications.map(mapNotificationToDTO) };
    } catch (error) {
        console.error("getNotifications error", error);
        return { success: false, data: [], error: "Gagal mengambil notifikasi" };
    }
}

export async function getUnreadCount() {
    try {
        const count = await db.notification
            .where("read")
            .equals(0 as any) // Dexie boolean mapping
            .count();
        return { success: true, count };
    } catch (error) {
        console.error("getUnreadCount error", error);
        return { success: false, count: 0 };
    }
}

export async function markAsRead(id: string) {
    try {
        await db.notification.update(id, { read: true });
        return { success: true };
    } catch (error) {
        console.error("markAsRead error", error);
        return { success: false };
    }
}

export async function markAllAsRead() {
    try {
        // Find all unread
        const unreadIds = await db.notification
            .where("read")
            .equals(0 as any)
            .primaryKeys();

        await db.notification.bulkUpdate(unreadIds.map(id => ({ key: id, changes: { read: true } })));
        return { success: true };
    } catch (error) {
        console.error("markAllAsRead error", error);
        return { success: false };
    }
}

export async function deleteNotification(id: string) {
    try {
        await db.notification.delete(id);
        return { success: true };
    } catch (error) {
        console.error("deleteNotification error", error);
        return { success: false };
    }
}

export async function createNotification(data: {
    type: string;
    title: string;
    message: string;
    severity: "INFO" | "WARNING" | "ERROR";
    actionUrl?: string;
}) {
    try {
        const notification: NotificationRecord = {
            id: crypto.randomUUID(),
            type: data.type,
            title: data.title,
            message: data.message,
            severity: data.severity,
            read: false,
            actionUrl: data.actionUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.notification.add(notification);
        return { success: true, data: mapNotificationToDTO(notification) };
    } catch (error) {
        console.error("createNotification error", error);
        return { success: false };
    }
}

export async function runSystemAlertChecks() {
    try {
        const now = new Date();
        const today = now.getDate();
        const month = now.getMonth();
        const year = now.getFullYear();

        // 1. Check Cicilan Due Soon
        const activeCicilan = await db.rencanaCicilan
            .where("status")
            .equals("AKTIF")
            .toArray();

        for (const cicilan of activeCicilan) {
            // Cicilan jatuh tempo calculation is simple based on 'hari' ?
            // In server implementation: cicilan.tanggalJatuhTempo - today
            // But `tanggalJatuhTempo` in DB is DAY OF MONTH (number)?
            // app-db.ts: tanggalJatuhTempo: number;

            // Server implementation used: const diff = cicilan.tanggalJatuhTempo - today

            const diff = cicilan.tanggalJatuhTempo - today;

            // Only notify if current date is close to due date (0-3 days before)
            // What if due date is 2nd, and today is 30th? (End of month)
            // Simple logic for now matching server action.

            if (diff >= 0 && diff <= 3) {
                const idempotencyKey = `notif-cicilan-${cicilan.id}-${month}-${year}`;

                // Check duplicate notification
                // We can use a special "check log" or search existing notifications
                // Searching existing notifications by Title/Message is inefficient.
                // Maybe we tag them? Notification doesn't have tags.
                // We can rely on existing check: if we already notified today?

                // Simpler: Just create it. The user will see it. 
                // Or we can check if a notification with this type/title exists created today?

                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const duplicate = await db.notification
                    .where("type")
                    .equals("CICILAN_DUE")
                    .filter(n => n.title.includes(cicilan.namaProduk) && n.createdAt >= startOfDay)
                    .first();

                if (!duplicate) {
                    await createNotification({
                        type: "CICILAN_DUE",
                        title: `💳 Cicilan ${cicilan.namaProduk} Segera Jatuh Tempo`,
                        message: diff === 0
                            ? `Tagihan ${cicilan.namaProduk} jatuh tempo HARI INI!`
                            : `Tagihan ${cicilan.namaProduk} akan jatuh tempo dalam ${diff} hari.`,
                        severity: diff === 0 ? "ERROR" : "WARNING",
                        actionUrl: "/cicilan"
                    });
                }
            }
        }

        // 2. Check Low Balance
        const accounts = await db.akun
            .where("tipe")
            .anyOf(["BANK", "E_WALLET"])
            .toArray();

        for (const akun of accounts) {
            const saldo = Money.toFloat(akun.saldoSekarangInt);
            if (saldo > 0 && saldo < 100000) {
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const duplicate = await db.notification
                    .where("type")
                    .equals("LOW_BALANCE")
                    .filter(n => n.title.includes(akun.nama) && n.createdAt >= startOfDay)
                    .first();

                if (!duplicate) {
                    await createNotification({
                        type: "LOW_BALANCE",
                        title: `⚠️ Saldo Rendah: ${akun.nama}`,
                        message: `Saldo akun ${akun.nama} saat ini Rp ${saldo.toLocaleString('id-ID')}. Segera lakukan top-up jika diperlukan.`,
                        severity: "WARNING",
                        actionUrl: "/akun"
                    });
                }
            }
        }

        return { success: true };
    } catch (error) {
        console.error("runSystemAlertChecks error", error);
        return { success: false };
    }
}

function mapNotificationToDTO(n: NotificationRecord) {
    return {
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        severity: n.severity as "INFO" | "WARNING" | "ERROR",
        read: n.read,
        actionUrl: n.actionUrl || undefined,
        createdAt: n.createdAt
    };
}
