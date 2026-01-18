export type ServerActionResult<T> = 
    | { success: true; data?: T; duplicated?: boolean; alert?: any; message?: string }
    | { success: false; error: string; errors?: Record<string, string[]> | Record<string, string> } // Errors can be simple key-value or array

export interface PaginationInfo {
    page: number
    pageSize: number
    total: number
    totalPages: number
}