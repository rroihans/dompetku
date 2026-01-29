export class BusinessError extends Error {
    constructor(
        message: string,
        public code?: string,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        public details?: any
    ) {
        super(message)
        this.name = 'BusinessError'
    }
}

export class ValidationError extends BusinessError {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(message: string, details?: any) {
        super(message, 'VALIDATION_ERROR', details)
        this.name = 'ValidationError'
    }
}

export class InsufficientBalanceError extends BusinessError {
    constructor(
        public accountName: string,
        public required: number,
        public available: number
    ) {
        super(
            `Insufficient balance in ${accountName}. Required: ${required}, Available: ${available}`,
            'INSUFFICIENT_BALANCE'
        )
        this.name = 'InsufficientBalanceError'
    }
}

export class BudgetExceededError extends BusinessError {
    constructor(
        public category: string,
        public limit: number,
        public spent: number
    ) {
        super(
            `Budget exceeded for ${category}. Limit: ${limit}, Spent: ${spent}`,
            'BUDGET_EXCEEDED'
        )
        this.name = 'BudgetExceededError'
    }
}

export class DuplicateTransactionError extends BusinessError {
    constructor() {
        super('Transaction already exists', 'DUPLICATE_TRANSACTION')
        this.name = 'DuplicateTransactionError'
    }
}
