import { db } from "./db"
import { settings, type Setting, type NewSetting } from "./schema"
import { eq } from "drizzle-orm"
import { getCached, setCache, hasCached, invalidateCache } from "./cache"

export async function getSetting(key: string): Promise<string | null> {
    const cacheKey = `setting:${key}`
    if (hasCached(cacheKey)) return getCached<string | null>(cacheKey)

    const result = await db.select().from(settings).where(eq(settings.key, key))
    const value = result.length > 0 ? result[0].value : null
    setCache(cacheKey, value, 300_000)
    return value
}

export async function setSetting(key: string, value: string): Promise<void> {
    invalidateCache(`setting:${key}`)
    const result = await db.select().from(settings).where(eq(settings.key, key))
    if (result.length > 0) {
        await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
    } else {
        await db.insert(settings).values({ key, value })
    }
    setCache(`setting:${key}`, value, 300_000)
}
