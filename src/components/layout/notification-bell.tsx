"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from "@/app/actions/notifications"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [open, setOpen] = useState(false)

    const fetchNotifications = async () => {
        const [notifRes, countRes] = await Promise.all([
            getNotifications(5),
            getUnreadCount()
        ])
        if (notifRes.success) setNotifications(notifRes.data || [])
        if (countRes.success) setUnreadCount(countRes.count)
    }

    useEffect(() => {
        fetchNotifications()
        // Poll every 30 seconds
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleMarkAsRead = async (id: string) => {
        await markAsRead(id)
        fetchNotifications()
    }

    const handleMarkAllRead = async () => {
        await markAllAsRead()
        fetchNotifications()
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] border-2 border-background"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px] sm:w-[380px]">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifikasi</h3>
                    {unreadCount > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs text-primary"
                            onClick={handleMarkAllRead}
                        >
                            Tandai semua dibaca
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Tidak ada notifikasi baru</p>
                        </div>
                    ) : (
                        notifications.map((notif) => (
                            <div 
                                key={notif.id}
                                className={`p-4 border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer relative ${!notif.read ? 'bg-primary/5' : ''}`}
                                onClick={() => handleMarkAsRead(notif.id)}
                            >
                                {!notif.read && (
                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                                )}
                                <div className="flex flex-col gap-1">
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`text-sm font-semibold ${!notif.read ? 'text-primary' : ''}`}>
                                            {notif.title}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: id })}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {notif.message}
                                    </p>
                                    {notif.actionUrl && (
                                        <Link href={notif.actionUrl} onClick={() => setOpen(false)}>
                                            <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold gap-1 mt-1">
                                                Lihat Detail <ExternalLink className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <DropdownMenuSeparator />
                <Link href="/notifications" onClick={() => setOpen(false)}>
                    <div className="p-2 text-center text-xs text-primary font-semibold hover:underline cursor-pointer">
                        Lihat Semua Notifikasi
                    </div>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}