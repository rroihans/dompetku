"use client"

import { useEffect, useState, useCallback } from "react"
import { getNotifications, type NotificationDTO } from "@/lib/db/notifications-repo"
import { NotificationList } from "./notification-list"
import { Loader2 } from "lucide-react"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationDTO[]>([])
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        setLoading(true)
        const result = await getNotifications(50)
        if (result.success && result.data) {
            setNotifications(result.data)
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadData()
    }, [loadData])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Notifikasi</h2>
                    <p className="text-muted-foreground">
                        Riwayat alert sistem dan pengingat aktivitas keuangan Anda.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <NotificationList initialNotifications={notifications} />
            )}
        </div>
    )
}