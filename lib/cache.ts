interface CacheEntry<T> {
    data: T
    expiresAt: number
}

const store = new Map<string, CacheEntry<unknown>>()

export function getCached<T>(key: string): T | null {
    const entry = store.get(key) as CacheEntry<T> | undefined
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return null
    }
    return entry.data
}

export function setCache<T>(key: string, data: T, ttlMs: number): void {
    store.set(key, { data, expiresAt: Date.now() + ttlMs })
}

export function hasCached(key: string): boolean {
    const entry = store.get(key)
    if (!entry) return false
    if (Date.now() > entry.expiresAt) {
        store.delete(key)
        return false
    }
    return true
}

export function invalidateCache(key: string): void {
    store.delete(key)
}
