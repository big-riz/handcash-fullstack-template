import { db } from "./db"
import { users } from "./schema"
import { eq } from "drizzle-orm"

export interface UserData {
    id: string
    handle: string
    displayName?: string
    avatarUrl?: string
    email?: string
    preferences?: Record<string, any>
    metadata?: Record<string, any>
}

/**
 * Create or update a user record
 * This should be called when a user logs in to cache their HandCash profile data
 */
export async function upsertUser(userData: UserData): Promise<void> {
    try {
        const existing = await db
            .select()
            .from(users)
            .where(eq(users.id, userData.id))
            .limit(1)

        if (existing.length > 0) {
            // Update existing user
            await db
                .update(users)
                .set({
                    handle: userData.handle,
                    displayName: userData.displayName,
                    avatarUrl: userData.avatarUrl,
                    email: userData.email,
                    lastActiveAt: new Date(),
                    preferences: userData.preferences,
                    metadata: userData.metadata,
                })
                .where(eq(users.id, userData.id))
        } else {
            // Insert new user
            await db.insert(users).values({
                id: userData.id,
                handle: userData.handle,
                displayName: userData.displayName,
                avatarUrl: userData.avatarUrl,
                email: userData.email,
                preferences: userData.preferences || {},
                metadata: userData.metadata || {},
            })
        }
    } catch (error) {
        console.error("[UsersStorage] Error upserting user:", error)
        throw error
    }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserData | null> {
    try {
        const results = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1)

        if (results.length === 0) return null

        const u = results[0]
        return {
            id: u.id,
            handle: u.handle,
            displayName: u.displayName || undefined,
            avatarUrl: u.avatarUrl || undefined,
            email: u.email || undefined,
            preferences: u.preferences as Record<string, any> | undefined,
            metadata: u.metadata as Record<string, any> | undefined,
        }
    } catch (error) {
        console.error("[UsersStorage] Error getting user by ID:", error)
        return null
    }
}

/**
 * Get user by handle
 */
export async function getUserByHandle(handle: string): Promise<UserData | null> {
    try {
        const results = await db
            .select()
            .from(users)
            .where(eq(users.handle, handle.toLowerCase()))
            .limit(1)

        if (results.length === 0) return null

        const u = results[0]
        return {
            id: u.id,
            handle: u.handle,
            displayName: u.displayName || undefined,
            avatarUrl: u.avatarUrl || undefined,
            email: u.email || undefined,
            preferences: u.preferences as Record<string, any> | undefined,
            metadata: u.metadata as Record<string, any> | undefined,
        }
    } catch (error) {
        console.error("[UsersStorage] Error getting user by handle:", error)
        return null
    }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
    userId: string,
    preferences: Record<string, any>
): Promise<void> {
    try {
        await db
            .update(users)
            .set({
                preferences,
                lastActiveAt: new Date(),
            })
            .where(eq(users.id, userId))
    } catch (error) {
        console.error("[UsersStorage] Error updating user preferences:", error)
        throw error
    }
}
