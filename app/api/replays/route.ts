import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { replays } from "@/lib/schema"
import { requireAuth } from "@/lib/auth-middleware"
import { getSetting } from "@/lib/settings-storage"
import { handcashService } from "@/lib/handcash-service"
import { desc, sql, eq, and } from "drizzle-orm"

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

        // Get user profile from HandCash
        const profile = await handcashService.getUserProfile(privateKey)
        const userId = profile.userId || profile.publicProfile.userId || profile.publicProfile.handle

        const body = await req.json()
        const { playerName, seed, events, finalLevel, finalTime, gameVersion, handle, avatarUrl, characterId, worldId } = body

        if (!playerName || !seed || !events || finalLevel === undefined || finalTime === undefined || !gameVersion) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Check for duplicate replay (same user, seed, character, and world)
        const existingReplay = await db.select().from(replays)
            .where(and(
                eq(replays.userId, userId),
                eq(replays.seed, seed),
                characterId ? eq(replays.characterId, characterId) : sql`${replays.characterId} IS NULL`,
                worldId ? eq(replays.worldId, worldId) : sql`${replays.worldId} IS NULL`
            ))
            .limit(1)

        if (existingReplay.length > 0) {
            return NextResponse.json(
                { error: "Duplicate replay - you have already submitted a replay for this seed, character, and world combination" },
                { status: 409 }
            )
        }

        // Insert into database with authenticated user's ID
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
            worldId: worldId || null,
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
        } else {
            // Use raw SQL to handle DISTINCT ON and ensure we get the best run per player
            const result = await db.execute(sql`
                SELECT * FROM (
                    SELECT DISTINCT ON (${replays.playerName}) *
                    FROM ${replays}
                    ORDER BY ${replays.playerName}, ${replays.finalLevel} DESC, ${replays.finalTime} DESC
                ) t
                ORDER BY final_level DESC, final_time DESC
                LIMIT ${limit}
            `);

            // Handle result safely (array or object with rows)
            const rows = Array.isArray(result) ? result : (result as any).rows || [];

            // Map snake_case database results to CamelCase for frontend
            mapped = (rows as any[]).map(r => ({
                id: r.id,
                userId: r.user_id,
                playerName: r.player_name,
                handle: r.handle,
                avatarUrl: r.avatar_url,
                seed: r.seed,
                events: r.events,
                finalLevel: r.final_level,
                finalTime: r.final_time,
                gameVersion: r.game_version,
                characterId: r.character_id,
                worldId: r.world_id,
                createdAt: r.created_at
            }));
        }

        return NextResponse.json(mapped)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
