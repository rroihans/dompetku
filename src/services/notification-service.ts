import { db } from '@/lib/db/app-db'
import { toast } from 'sonner'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export class NotificationService {
    /**
     * Send success notification
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendSuccess(message: string, metadata?: any) {
        await this.createNotification(message, 'success', metadata)
        toast.success(message)
    }

    /**
     * Send error notification
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendError(message: string, metadata?: any) {
        await this.createNotification(message, 'error', metadata)
        toast.error(message)
    }

    /**
     * Send warning notification
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendWarning(message: string, metadata?: any) {
        await this.createNotification(message, 'warning', metadata)
        toast.warning(message)
    }

    /**
     * Send info notification
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendInfo(message: string, metadata?: any) {
        await this.createNotification(message, 'info', metadata)
        toast.info(message)
    }

    /**
     * Schedule reminder for future date
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async scheduleReminder(message: string, dueDate: Date, metadata?: any) {
        // metadata ignored as not in schema yet
        await db.notification.add({
            id: crypto.randomUUID(),
            title: 'Reminder',
            message: `${message} (Due: ${dueDate.toLocaleDateString()})`,
            type: 'INFO',
            severity: 'INFO',
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        })
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    private async createNotification(
        message: string,
        type: NotificationType,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata?: any
    ) {
        try {
            await db.notification.add({
                id: crypto.randomUUID(),
                title: type.toUpperCase(),
                message,
                type: type,
                severity: type === 'error' ? 'ERROR' : type === 'warning' ? 'WARNING' : 'INFO',
                read: false,
                createdAt: new Date(),
                updatedAt: new Date()
            })
        } catch (err) {
            console.error('Failed to create notification:', err)
        }
    }
}
