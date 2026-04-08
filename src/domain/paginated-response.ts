
export interface PaginatedResponse<T> {
    token: string | null,
    value: T[]
}