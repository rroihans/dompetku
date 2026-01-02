// Form validation utilities untuk real-time validation

export interface ValidationRule {
    validate: (value: any) => boolean
    message: string
}

export interface FieldValidation {
    [key: string]: ValidationRule[]
}

// Validasi wajib diisi
export const required = (message = "Wajib diisi"): ValidationRule => ({
    validate: (value) => {
        if (typeof value === "string") return value.trim().length > 0
        if (typeof value === "number") return !isNaN(value)
        return value !== null && value !== undefined
    },
    message,
})

// Validasi minimal karakter
export const minLength = (min: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "string" && value.trim().length >= min,
    message: message || `Minimal ${min} karakter`,
})

// Validasi maksimal karakter
export const maxLength = (max: number, message?: string): ValidationRule => ({
    validate: (value) => typeof value === "string" && value.length <= max,
    message: message || `Maksimal ${max} karakter`,
})

// Validasi angka positif
export const positiveNumber = (message = "Harus angka positif"): ValidationRule => ({
    validate: (value) => {
        const num = typeof value === "string" ? parseFloat(value) : value
        return !isNaN(num) && num > 0
    },
    message,
})

// Validasi minimal angka
export const minValue = (min: number, message?: string): ValidationRule => ({
    validate: (value) => {
        const num = typeof value === "string" ? parseFloat(value) : value
        return !isNaN(num) && num >= min
    },
    message: message || `Minimal ${min.toLocaleString("id-ID")}`,
})

// Validasi maksimal angka
export const maxValue = (max: number, message?: string): ValidationRule => ({
    validate: (value) => {
        const num = typeof value === "string" ? parseFloat(value) : value
        return !isNaN(num) && num <= max
    },
    message: message || `Maksimal ${max.toLocaleString("id-ID")}`,
})

// Validasi email
export const email = (message = "Email tidak valid"): ValidationRule => ({
    validate: (value) => {
        if (!value) return true // Allow empty (use required for mandatory)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(value)
    },
    message,
})

// Validasi pilihan dari list
export const oneOf = (options: string[], message = "Pilihan tidak valid"): ValidationRule => ({
    validate: (value) => options.includes(value),
    message,
})

// Validasi tanggal tidak di masa lalu
export const futureDate = (message = "Tanggal harus di masa depan"): ValidationRule => ({
    validate: (value) => {
        if (!value) return true
        const date = new Date(value)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return date >= today
    },
    message,
})

// Validasi tanggal tidak di masa depan
export const pastDate = (message = "Tanggal harus di masa lalu"): ValidationRule => ({
    validate: (value) => {
        if (!value) return true
        const date = new Date(value)
        const today = new Date()
        today.setHours(23, 59, 59, 999)
        return date <= today
    },
    message,
})

// Helper function untuk validasi satu field
export function validateField(value: any, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
        if (!rule.validate(value)) {
            return rule.message
        }
    }
    return null
}

// Helper function untuk validasi semua fields
export function validateForm(
    values: Record<string, any>,
    validation: FieldValidation
): Record<string, string> {
    const errors: Record<string, string> = {}

    for (const [field, rules] of Object.entries(validation)) {
        const error = validateField(values[field], rules)
        if (error) {
            errors[field] = error
        }
    }

    return errors
}

// Check apakah form valid
export function isFormValid(errors: Record<string, string>): boolean {
    return Object.keys(errors).length === 0
}
