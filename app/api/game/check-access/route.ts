import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"
import { getSetting } from "@/lib/settings-storage"

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
        return NextResponse.json({ success: false, authorized: false, reason: "Unauthorized" })
    }

    const { privateKey } = authResult

    try {
        const requiredCollectionId = await getSetting("access_collection_id")

        // If no collection ID is set, access is granted by default (or you can change this)
        if (!requiredCollectionId) {
            return NextResponse.json({ success: true, authorized: true })
        }

        const inventory = await handcashService.getInventory(privateKey)
        const hasItem = inventory.some((item: any) => item.collection?.id === requiredCollectionId)

        return NextResponse.json({
            success: true,
            authorized: hasItem,
            requiredCollectionId,
            reason: hasItem ? null : "Missing required item from collection"
        })
    } catch (error) {
        return NextResponse.json({ success: false, authorized: false, error: "Failed to check access" }, { status: 500 })
    }
}
