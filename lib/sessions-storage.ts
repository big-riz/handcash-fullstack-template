import { db } from "./db"
import { sessions } from "./schema"
import { eq } from "drizzle-orm"

export interface SessionData {
    id: string
    userId?: string
    ipAddress?: string
    userAgent?: string
    createdAt?: Date
    lastActivityAt?: Date
    expiresAt?: Date
    isActive?: boolean
}

/**
 * Create or update a session record in the database
 */
export async function upsertSession(sessionData: SessionData): Promise<void> {
    try {
        const existing = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionData.id))
            .limit(1)

        if (existing.length > 0) {
            // Update existing session
            await db
                .update(sessions)
                .set({
                    userId: sessionData.userId,
                    ipAddress: sessionData.ipAddress,
                    userAgent: sessionData.userAgent,
                    lastActivityAt: new Date(),
                    expiresAt: sessionData.expiresAt,
                    isActive: sessionData.isActive !== undefined ? sessionData.isActive : true,
                })
                .where(eq(sessions.id, sessionData.id))
        } else {
            // Insert new session
            await db.insert(sessions).values({
                id: sessionData.id,
                userId: sessionData.userId,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent,
                createdAt: sessionData.createdAt || new Date(),
                lastActivityAt: new Date(),
                expiresAt: sessionData.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                isActive: sessionData.isActive !== undefined ? sessionData.isActive : true,
            })
        }
    } catch (error) {
        console.error("[SessionStorage] Error upserting session:", error)
        throw error
    }
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId: string): Promise<SessionData | null> {
    try {
        const results = await db
            .select()
            .from(sessions)
            .where(eq(sessions.id, sessionId))
            .limit(1)

        if (results.length === 0) return null

        const s = results[0]
        return {
            id: s.id,
            userId: s.userId || undefined,
            ipAddress: s.ipAddress || undefined,
            userAgent: s.userAgent || undefined,
            createdAt: s.createdAt || undefined,
            lastActivityAt: s.lastActivityAt || undefined,
            expiresAt: s.expiresAt,
            isActive: s.isActive || undefined,
        }
    } catch (error) {
        console.error("[SessionStorage] Error getting session by ID:", error)
        return null
    }
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    try {
        await db.delete(sessions).where(eq(sessions.id, sessionId))
    } catch (error) {
        console.error("[SessionStorage] Error deleting session:", error)
        throw error
    }
}

/**
 * Update session activity timestamp
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
    try {
        await db
            .update(sessions)
            .set({
                lastActivityAt: new Date(),
            })
            .where(eq(sessions.id, sessionId))
    } catch (error) {
        console.error("[SessionStorage] Error updating session activity:", error)
        // Don't throw - this is not critical
    }
}
