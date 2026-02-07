"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Bell,
    Check,
    Trash2,
    AlertTriangle,
    Info,
    XCircle,
    ExternalLink,
    CheckCheck
} from "lucide-react"
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/db/notifications-repo"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { NotificationDTO } from "@/lib/db/notifications-repo"

export function NotificationList({ initialNotifications }: { initialNotifications: NotificationDTO[] }) {
    const router = useRouter()
    const [notifications, setNotifications] = useState(initialNotifications)

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id)
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
        router.refresh()
    }

    const handleMarkAllRead = async () => {
        const res = await markAllAsRead()
        if (res.success) {
            setNotifications(notifications.map(n => ({ ...n, read: true })))
            toast.success("Semua notifikasi ditandai sebagai dibaca")
            router.refresh()
        }
    }

    const handleDelete = async (id: string) => {
        const res = await deleteNotification(id)
        if (res.success) {
            setNotifications(notifications.filter(n => n.id !== id))
            toast.success("Notifikasi dihapus")
            router.refresh()
        }
    }

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'ERROR': return 'text-red-500 bg-red-500/10 border-red-200 dark:border-red-800'
            case 'WARNING': return 'text-amber-500 bg-amber-500/10 border-amber-200 dark:border-amber-800'
            default: return 'text-blue-500 bg-blue-500/10 border-blue-200 dark:border-blue-800'
        }
    }

    const getIcon = (type: string, severity: string) => {
        if (severity === 'ERROR') return <XCircle className="w-5 h-5" />
        if (severity === 'WARNING') return <AlertTriangle className="w-5 h-5" />
        return <Info className="w-5 h-5" />
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                {notifications.some(n => !n.read) && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleMarkAllRead}>
                        <CheckCheck className="w-4 h-4" /> Tandai Semua Dibaca
                    </Button>
                )}
            </div>

            {notifications.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Bell className="w-16 h-16 text-muted-foreground mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Belum Ada Notifikasi</h3>
                        <p className="text-muted-foreground">Alert dan pengingat akan muncul di sini.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3">
                    {notifications.map((notif) => (
                        <Card
                            key={notif.id}
                            className={`transition-all ${!notif.read ? 'border-l-4 border-l-primary bg-primary/5' : 'opacity-80'}`}
                        >
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <div className={`p-2 rounded-full h-fit shrink-0 ${getSeverityColor(notif.severity)}`}>
                                        {getIcon(notif.type, notif.severity)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex justify-between items-start gap-2">
                                            <h4 className={`font-bold ${!notif.read ? 'text-primary' : ''}`}>{notif.title}</h4>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{notif.message}</p>
                                        <div className="flex items-center gap-2 mt-3">
                                            {notif.actionUrl && (
                                                <Link href={notif.actionUrl}>
                                                    <Button size="sm" variant="secondary" className="h-8 gap-1">
                                                        <ExternalLink className="w-3 h-3" /> Buka Halaman
                                                    </Button>
                                                </Link>
                                            )}
                                            {!notif.read && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 gap-1 text-primary"
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                >
                                                    <Check className="w-3 h-3" /> Tandai Dibaca
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 gap-1 text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(notif.id)}
                                            >
                                                <Trash2 className="w-3 h-3" /> Hapus
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}