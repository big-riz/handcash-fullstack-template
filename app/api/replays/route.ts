import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { replays } from "@/lib/schema"
import { requireAuth } from "@/lib/auth-middleware"
import { getSetting } from "@/lib/settings-storage"
import { handcashService } from "@/lib/handcash-service"
import { desc, eq, and } from "drizzle-orm"
import { getCached, setCache } from "@/lib/cache"

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
        const { playerName, finalLevel, finalTime, gameVersion, handle, avatarUrl, characterId, worldId } = body

        if (!playerName || finalLevel === undefined || finalTime === undefined || !gameVersion) {
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
            finalLevel,
            finalTime,
            gameVersion,
            userId,
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

const replayColumns = {
    id: replays.id,
    userId: replays.userId,
    playerName: replays.playerName,
    handle: replays.handle,
    avatarUrl: replays.avatarUrl,
    finalLevel: replays.finalLevel,
    finalTime: replays.finalTime,
    gameVersion: replays.gameVersion,
    characterId: replays.characterId,
    worldId: replays.worldId,
    createdAt: replays.createdAt,
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50)
        const handle = searchParams.get("handle")
        const worldId = searchParams.get("worldId")

        let result

        if (handle) {
            result = await db.select(replayColumns).from(replays)
                .where(eq(replays.handle, handle))
                .orderBy(desc(replays.createdAt))
                .limit(limit)
        } else if (worldId) {
            const cacheKey = `scores:${worldId}:${limit}`
            const cached = getCached<any[]>(cacheKey)
            if (cached) return NextResponse.json(cached)
            result = await db.select(replayColumns).from(replays)
                .where(eq(replays.worldId, worldId))
                .orderBy(desc(replays.finalLevel), replays.finalTime)
                .limit(limit)
            setCache(cacheKey, result, 30_000)
        } else {
            result = await db.select(replayColumns).from(replays)
                .orderBy(desc(replays.finalLevel), replays.finalTime)
                .limit(limit)
        }

        return NextResponse.json(result)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
