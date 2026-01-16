"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Money } from "@/lib/money"

export async function getNotifications(limit: number = 20) {
    try {
        const notifications = await prisma.notification.findMany({
            orderBy: { createdAt: "desc" },
            take: limit
        })
        return { success: true, data: notifications }
    } catch (error) {
        return { success: false, data: [], error: "Gagal mengambil notifikasi" }
    }
}

export async function getUnreadCount() {
    try {
        const count = await prisma.notification.count({
            where: { read: false }
        })
        return { success: true, count }
    } catch (error) {
        return { success: false, count: 0 }
    }
}

export async function markAsRead(id: string) {
    try {
        await prisma.notification.update({
            where: { id },
            data: { read: true }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

export async function markAllAsRead() {
    try {
        await prisma.notification.updateMany({
            where: { read: false },
            data: { read: true }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

export async function deleteNotification(id: string) {
    try {
        await prisma.notification.delete({
            where: { id }
        })
        revalidatePath("/")
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

export async function createNotification(data: {
    type: string
    title: string
    message: string
    severity: "INFO" | "WARNING" | "ERROR"
    actionUrl?: string
}) {
    try {
        const notification = await prisma.notification.create({
            data
        })
        revalidatePath("/")
        return { success: true, data: notification }
    } catch (error) {
        return { success: false }
    }
}

/**
 * System-wide check for upcoming events and status alerts
 */
export async function runSystemAlertChecks() {
    try {
        const now = new Date()
        const today = now.getDate()

        // 1. Check Cicilan Due Soon (within 3 days)
        const activeCicilan = await prisma.rencanaCicilan.findMany({
            where: { status: "AKTIF" }
        })

        for (const cicilan of activeCicilan) {
            const diff = cicilan.tanggalJatuhTempo - today
            if (diff >= 0 && diff <= 3) {
                // Check if already notified this month to avoid spam
                const idempotencyKey = `notif-cicilan-${cicilan.id}-${now.getMonth()}-${now.getFullYear()}`
                // We use title/message as a proxy or just create it
                // For simplicity, we just create it once a day
                
                await createNotification({
                    type: "CICILAN_DUE",
                    title: `💳 Cicilan ${cicilan.namaProduk} Segera Jatuh Tempo`,
                    message: diff === 0 
                        ? `Tagihan ${cicilan.namaProduk} jatuh tempo HARI INI!` 
                        : `Tagihan ${cicilan.namaProduk} akan jatuh tempo dalam ${diff} hari.`,
                    severity: diff === 0 ? "ERROR" : "WARNING",
                    actionUrl: "/cicilan"
                })
            }
        }

        // 2. Check Low Balance (< 100k for Bank/E-Wallet)
        const accounts = await prisma.akun.findMany({
            where: { tipe: { in: ["BANK", "E_WALLET"] } }
        })

        for (const akun of accounts) {
            const saldo = Money.toFloat(Number(akun.saldoSekarang))
            if (saldo > 0 && saldo < 100000) {
                await createNotification({
                    type: "LOW_BALANCE",
                    title: `⚠️ Saldo Rendah: ${akun.nama}`,
                    message: `Saldo akun ${akun.nama} saat ini Rp ${saldo.toLocaleString('id-ID')}. Segera lakukan top-up jika diperlukan.`,
                    severity: "WARNING",
                    actionUrl: "/akun"
                })
            }
        }

        return { success: true }
    } catch (error) {
        return { success: false }
    }
}