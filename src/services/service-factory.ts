import { TransactionService } from './transaction-service'
import { CicilanService } from './cicilan-service'
import { BudgetService } from './budget-service'
import { NotificationService } from './notification-service'
import { AnalyticsService } from './analytics-service'

export class ServiceFactory {
    private static instances: Map<string, any> = new Map()

    static getTransactionService(): TransactionService {
        if (!this.instances.has('TransactionService')) {
            this.instances.set(
                'TransactionService',
                new TransactionService()
            )
        }
        return this.instances.get('TransactionService')
    }

    static getCicilanService(): CicilanService {
        if (!this.instances.has('CicilanService')) {
            this.instances.set(
                'CicilanService',
                new CicilanService()
            )
        }
        return this.instances.get('CicilanService')
    }

    static getBudgetService(): BudgetService {
        if (!this.instances.has('BudgetService')) {
            this.instances.set(
                'BudgetService',
                new BudgetService()
            )
        }
        return this.instances.get('BudgetService')
    }

    static getNotificationService(): NotificationService {
        if (!this.instances.has('NotificationService')) {
            this.instances.set('NotificationService', new NotificationService())
        }
        return this.instances.get('NotificationService')
    }

    static getAnalyticsService(): AnalyticsService {
        if (!this.instances.has('AnalyticsService')) {
            this.instances.set('AnalyticsService', new AnalyticsService())
        }
        return this.instances.get('AnalyticsService')
    }
}
