import { type NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-middleware"
import { getSetting, setSetting } from "@/lib/settings-storage"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
    if (rateLimitResponse) return rateLimitResponse

    const adminResult = await requireAdmin(request)
    if (!adminResult.success) return adminResult.response

    const accessCollectionId = await getSetting("access_collection_id")
    return NextResponse.json({ success: true, settings: { access_collection_id: accessCollectionId } })
}

export async function POST(request: NextRequest) {
    const rateLimitResponse = rateLimit(request, RateLimitPresets.admin)
    if (rateLimitResponse) return rateLimitResponse

    const adminResult = await requireAdmin(request)
    if (!adminResult.success) return adminResult.response

    try {
        const { access_collection_id } = await request.json()
        await setSetting("access_collection_id", access_collection_id || "")
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
    }
}
