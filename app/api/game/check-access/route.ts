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

        console.log("[Access Check] Required Collection ID:", requiredCollectionId)

        // If no collection ID is set, deny access
        if (!requiredCollectionId) {
            return NextResponse.json({
                success: true,
                authorized: false,
                reason: "No collection requirement configured. Please contact admin."
            })
        }

        const inventory = await handcashService.getInventory(privateKey)
        console.log("[Access Check] User inventory item count:", inventory.length)
        console.log("[Access Check] Collection IDs in inventory:", inventory.map((item: any) => item.collection?.id).filter(Boolean))

        const hasItem = inventory.some((item: any) => {
            const matches = item.collection?.id === requiredCollectionId
            if (matches) {
                console.log("[Access Check] Found matching item:", item.name, "from collection:", item.collection?.name)
            }
            return matches
        })

        console.log("[Access Check] Has required item:", hasItem)

        return NextResponse.json({
            success: true,
            authorized: hasItem,
            requiredCollectionId,
            reason: hasItem ? null : "Missing required item from collection"
        })
    } catch (error: any) {
        console.error("[Access Check] Error:", error)
        return NextResponse.json({ success: false, authorized: false, error: "Failed to check access", details: error.message }, { status: 500 })
    }
}
