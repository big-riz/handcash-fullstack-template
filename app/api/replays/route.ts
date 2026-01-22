import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { replays } from "@/lib/schema"

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { playerName, seed, events, finalLevel, finalTime, gameVersion, userId, handle, avatarUrl } = body

        if (!playerName || !seed || !events || finalLevel === undefined || finalTime === undefined || !gameVersion) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Insert into database
        const result = await db.insert(replays).values({
            playerName,
            seed,
            events,
            finalLevel,
            finalTime,
            gameVersion,
            userId: userId || null,
            handle: handle || null,
            avatarUrl: avatarUrl || null,
        }).returning()

        return NextResponse.json({ success: true, id: result[0].id })
    } catch (error: any) {
        console.error("Failed to save replay:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

import { desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get("limit") || "10")

        const results = await db.select()
            .from(replays)
            .orderBy(desc(replays.finalLevel), desc(replays.finalTime))
            .limit(limit)

        return NextResponse.json(results)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
