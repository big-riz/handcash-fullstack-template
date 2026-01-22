import { db } from "./db"
import { settings, type Setting, type NewSetting } from "./schema"
import { eq } from "drizzle-orm"

export async function getSetting(key: string): Promise<string | null> {
    const result = await db.select().from(settings).where(eq(settings.key, key))
    return result.length > 0 ? result[0].value : null
}

export async function setSetting(key: string, value: string): Promise<void> {
    const existing = await getSetting(key)
    if (existing !== null) {
        await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
    } else {
        await db.insert(settings).values({ key, value })
    }
}
