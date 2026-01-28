import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { replays } from "@/lib/schema"
import { requireAuth } from "@/lib/auth-middleware"
import { getSetting } from "@/lib/settings-storage"
import { handcashService } from "@/lib/handcash-service"
import { desc, eq, and } from "drizzle-orm"

export async function POST(req: NextRequest) {
    try {
        // Require authentication - no anonymous score submissions
        const authResult = await requireAuth(req)
        if (!authResult.success) {
            return NextResponse.json(
                { error: "Authentication required to submit scores" },
                { status: 401 }
            )
        }

        const { privateKey } = authResult

        // Check if user has required collection item (if configured)
        const requiredCollectionId = await getSetting("access_collection_id")
        if (requiredCollectionId) {
            try {
                const inventory = await handcashService.getInventory(privateKey)
                const hasItem = inventory.some((item: any) =>
                    item.collection?.id === requiredCollectionId
                )

                if (!hasItem) {
                    return NextResponse.json(
                        { error: "Missing required collection item to submit scores" },
                        { status: 403 }
                    )
                }
            } catch (error) {
                console.error("Failed to check collection access:", error)
                return NextResponse.json(
                    { error: "Failed to verify collection access" },
                    { status: 500 }
                )
            }
        }

        // Get user profile from HandCash - use same ID extraction as auth callback
        const profile = await handcashService.getUserProfile(privateKey)
        const userId = profile?.userId || profile?.publicProfile?.userId || profile?.publicProfile?.handle

        if (!userId) {
            return NextResponse.json({ error: "Could not determine user ID" }, { status: 400 })
        }

        const body = await req.json()
        const { playerName, seed, events, finalLevel, finalTime, gameVersion, handle, avatarUrl, characterId, worldId } = body

        if (!playerName || !seed || !events || finalLevel === undefined || finalTime === undefined || !gameVersion) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Normalize worldId - default to 'dark_forest' if not provided
        const normalizedWorldId = worldId || 'dark_forest'

        // Check for existing score for this user on this world
        // Each player can only have ONE entry per world on the leaderboard
        const existingScore = await db.select().from(replays)
            .where(and(
                eq(replays.userId, userId),
                eq(replays.worldId, normalizedWorldId)
            ))
            .limit(1)

        if (existingScore.length > 0) {
            const existing = existingScore[0]
            // Determine if new score is better
            // Better = higher level, or same level with faster time
            const isBetterScore = finalLevel > existing.finalLevel ||
                (finalLevel === existing.finalLevel && finalTime < existing.finalTime)

            if (isBetterScore) {
                // Update existing entry with new best score
                await db.update(replays)
                    .set({
                        playerName,
                        seed,
                        events,
                        finalLevel,
                        finalTime,
                        gameVersion,
                        handle: handle || null,
                        avatarUrl: avatarUrl || null,
                        characterId: characterId || null,
                    })
                    .where(eq(replays.id, existing.id))

                return NextResponse.json({ success: true, id: existing.id, updated: true })
            } else {
                // Score is not better, don't update
                return NextResponse.json({
                    success: true,
                    id: existing.id,
                    updated: false,
                    message: "Existing score is better or equal"
                })
            }
        }

        // No existing score for this world, insert new entry
        const result = await db.insert(replays).values({
            playerName,
            seed,
            events,
            finalLevel,
            finalTime,
            gameVersion,
            userId, // Always use authenticated user's ID
            handle: handle || null,
            avatarUrl: avatarUrl || null,
            characterId: characterId || null,
            worldId: normalizedWorldId,
        }).returning()

        return NextResponse.json({ success: true, id: result[0].id })
    } catch (error: any) {
        console.error("Failed to save replay:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "10")
        const handle = searchParams.get("handle")
        const worldId = searchParams.get("worldId")

        let mapped = []

        if (handle) {
            // Fetch personal history for a specific handle
            const result = await db.select().from(replays)
                .where(eq(replays.handle, handle))
                .orderBy(desc(replays.createdAt))
                .limit(limit)

            mapped = result.map(r => ({
                id: r.id,
                userId: r.userId,
                playerName: r.playerName,
                handle: r.handle,
                avatarUrl: r.avatarUrl,
                seed: r.seed,
                events: r.events,
                finalLevel: r.finalLevel,
                finalTime: r.finalTime,
                gameVersion: r.gameVersion,
                characterId: r.characterId,
                worldId: r.worldId,
                createdAt: r.createdAt
            }))
        } else if (worldId) {
            // Fetch leaderboard for a specific world
            // Each player appears only once per world (enforced by POST logic)
            // Sort by level DESC, then time ASC (faster is better at same level)
            const result = await db.select().from(replays)
                .where(eq(replays.worldId, worldId))
                .orderBy(desc(replays.finalLevel), replays.finalTime)
                .limit(limit)

            mapped = result.map(r => ({
                id: r.id,
                userId: r.userId,
                playerName: r.playerName,
                handle: r.handle,
                avatarUrl: r.avatarUrl,
                seed: r.seed,
                events: r.events,
                finalLevel: r.finalLevel,
                finalTime: r.finalTime,
                gameVersion: r.gameVersion,
                characterId: r.characterId,
                worldId: r.worldId,
                createdAt: r.createdAt
            }))
        } else {
            // Fetch all scores (for backwards compatibility / global view)
            // Returns all entries across all worlds, sorted by level then time
            const result = await db.select().from(replays)
                .orderBy(desc(replays.finalLevel), replays.finalTime)
                .limit(limit)

            mapped = result.map(r => ({
                id: r.id,
                userId: r.userId,
                playerName: r.playerName,
                handle: r.handle,
                avatarUrl: r.avatarUrl,
                seed: r.seed,
                events: r.events,
                finalLevel: r.finalLevel,
                finalTime: r.finalTime,
                gameVersion: r.gameVersion,
                characterId: r.characterId,
                worldId: r.worldId,
                createdAt: r.createdAt
            }))
        }

        return NextResponse.json(mapped)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
