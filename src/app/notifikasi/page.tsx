"use client"

import { useEffect, useState, useCallback } from "react"
import { getNotifications, type NotificationDTO } from "@/lib/db/notifications-repo"
import { NotificationList } from "./notification-list"
import { Loader2 } from "lucide-react"

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationDTO[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function loadData() {
            if (!cancelled) {
                setLoading(true)
            }
            try {
                const result = await getNotifications(50)
                if (!cancelled && result.success && result.data) {
                    setNotifications(result.data)
                }
            } catch (error) {
                console.error("Failed to load notifications:", error)
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        loadData()

        return () => {
            cancelled = true
        }
    }, [refreshKey])

    const loadData = useCallback(() => {
        setRefreshKey(k => k + 1)
    }, [])

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