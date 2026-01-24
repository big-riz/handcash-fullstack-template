import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { replays } from "@/lib/schema"
import { getUserById } from "@/lib/users-storage"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { playerName, seed, events, finalLevel, finalTime, gameVersion, userId, handle, avatarUrl, characterId, worldId } = body

        if (!playerName || !seed || !events || finalLevel === undefined || finalTime === undefined || !gameVersion) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Verify user exists if userId is provided, otherwise set to null
        let validUserId: string | null = null
        if (userId) {
            const user = await getUserById(userId)
            if (user) {
                validUserId = userId
            } else {
                console.warn(`[Replays] User ${userId} not found in database, saving replay without user_id`)
            }
        }

        // Insert into database
        const result = await db.insert(replays).values({
            playerName,
            seed,
            events,
            finalLevel,
            finalTime,
            gameVersion,
            userId: validUserId,
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

import { desc, sql, eq } from "drizzle-orm"

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
