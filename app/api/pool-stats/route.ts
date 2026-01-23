import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { itemTemplates, mintedItems } from "@/lib/schema"
import { eq, sql } from "drizzle-orm"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, RateLimitPresets.general)
    if (rateLimitResponse) {
        return rateLimitResponse
    }

    try {
        // 1. Fetch all templates
        const allTemplates = await db.select().from(itemTemplates)

        // 2. Fetch mint counts per template from local DB (excluding archived)
        const mintCounts = await db
            .select({
                templateId: mintedItems.templateId,
                count: sql<number>`count(*)`.mapWith(Number),
            })
            .from(mintedItems)
            .where(eq(mintedItems.isArchived, false))
            .groupBy(mintedItems.templateId)

        const mintCountMap = new Map(mintCounts.map((mc) => [mc.templateId, mc.count]))

        // 3. Group by pool (exclude archived templates)
        const poolStats: Record<string, any> = {}

        allTemplates.forEach((template) => {
            // Skip archived templates
            if (template.isArchived) {
                return
            }
            const pool = template.pool || "default"
            if (!poolStats[pool]) {
                poolStats[pool] = {
                    poolName: pool,
                    totalTemplates: 0,
                    totalSupplyLimit: 0,
                    totalMinted: 0,
                    items: [],
                }
            }

            const minted = mintCountMap.get(template.id) || 0
            poolStats[pool].totalTemplates += 1
            poolStats[pool].totalSupplyLimit += template.supplyLimit || 0
            poolStats[pool].totalMinted += minted

            poolStats[pool].items.push({
                id: template.id,
                name: template.name,
                rarity: template.rarity,
                supplyLimit: template.supplyLimit || 0,
                minted: minted,
                remaining: (template.supplyLimit || 0) > 0 ? Math.max(0, (template.supplyLimit || 0) - minted) : "Unlimited",
                imageUrl: template.imageUrl,
            })
        })

        return NextResponse.json({
            success: true,
            pools: Object.values(poolStats),
        })
    } catch (error: unknown) {
        console.error("[PoolStats] Error:", error)
        return NextResponse.json(
            { error: "Failed to fetch pool stats", details: error instanceof Error ? error.message : String(error) },
            { status: 500 },
        )
    }
}
