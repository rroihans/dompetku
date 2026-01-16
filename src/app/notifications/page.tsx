import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bell, Check, Trash2, Calendar, AlertTriangle, Info, XCircle } from "lucide-react"
import { getNotifications, markAllAsRead } from "@/app/actions/notifications"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { NotificationList } from "./notification-list"

export default async function NotificationsPage() {
    const result = await getNotifications(50)
    const notifications = result.data || []

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

            <NotificationList initialNotifications={notifications} />
        </div>
    )
}