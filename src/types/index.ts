export type ServerActionResult<T> = 
    | { success: true; data: T; duplicated?: boolean }
    | { success: false; error: string; errors?: Record<string, string[]> }

export interface PaginationInfo {
    page: number
    pageSize: number
    total: number
    totalPages: number
}
