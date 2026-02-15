import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-middleware"
import { db } from "@/lib/db"
import { collections } from "@/lib/schema"
import { getAccountClient, Connect } from "@/lib/items-client"
import { setSetting } from "@/lib/settings-storage"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
    if (rateLimitResponse) return rateLimitResponse

    const adminResult = await requireAdmin(request)
    if (!adminResult.success) return adminResult.response

    try {
        const businessAuthToken = process.env.BUSINESS_AUTH_TOKEN
        if (!businessAuthToken) {
            return NextResponse.json({ error: "BUSINESS_AUTH_TOKEN not configured" }, { status: 500 })
        }

        const validCollectionIds = new Set<string>()

        // 1. Fetch from Business Inventory
        try {
            const accountClient = getAccountClient(businessAuthToken)
            const { data, error } = await Connect.getItemsInventory({
                client: accountClient as any,
                body: {},
            })

            if (!error) {
                const items = (data as any)?.items || (Array.isArray(data) ? data : [])
                for (const item of items) {
                    if (item?.collection?.id) {
                        validCollectionIds.add(item.collection.id)
                    }
                }
            }
        } catch (err) {
            console.error("[Sync API] Inventory fetch failed:", err)
        }

        // 2. Fetch from local database
        try {
            const dbCollections = await db.select().from(collections)
            for (const c of dbCollections) {
                validCollectionIds.add(c.id)
            }
        } catch (err) {
            console.error("[Sync API] DB fetch failed:", err)
        }

        const idList = Array.from(validCollectionIds)
        await setSetting("authorized_collection_ids", JSON.stringify(idList))

        return NextResponse.json({
            success: true,
            count: idList.length,
            ids: idList
        })
    } catch (error: any) {
        console.error("[Sync API] Critical error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
