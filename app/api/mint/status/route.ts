
import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { mintIntents } from "@/lib/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const intentId = searchParams.get("intentId")

    if (!intentId) {
        return NextResponse.json({ error: "Missing intentId" }, { status: 400 })
    }

    try {
        const intent = await db.query.mintIntents.findFirst({
            where: eq(mintIntents.id, intentId)
        })

        if (!intent) {
            return NextResponse.json({ error: "Intent not found" }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            status: intent.status,
            paidAt: intent.paidAt,
            activationTime: intent.activationTime
        })

    } catch (error: any) {
        console.error("[Mint Status] Error:", error)
        return NextResponse.json(
            { error: error.message || "Failed to check status" },
            { status: 500 }
        )
    }
}
