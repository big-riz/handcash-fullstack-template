import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"
import { getMintedItemsByUserId } from "@/lib/minted-items-storage"

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimit(request, RateLimitPresets.general)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { privateKey } = authResult

  try {
    // 1. Fetch items from HandCash
    const handcashItems = await handcashService.getInventory(privateKey)

    // 2. Fetch locally recorded items for this user as a fallback/merge
    // Get user profile to get their ID for lookup
    const profile = await handcashService.getUserProfile(privateKey)
    const userId = profile?.publicProfile?.id

    let localItems: any[] = []
    if (userId) {
      localItems = await getMintedItemsByUserId(userId)
    }

    // Combine items - prioritizing HandCash items (using origin to de-duplicate)
    const itemsByOrigin = new Map()

    // Add local items first
    localItems.forEach((item: any) => {
      itemsByOrigin.set(item.origin, {
        id: item.id,
        origin: item.origin,
        name: item.itemName,
        imageUrl: item.imageUrl,
        multimediaUrl: item.multimediaUrl,
        rarity: item.rarity,
        collection: { id: item.collectionId },
        isLocal: true, // Mark as local for internal tracking if needed
      })
    })

    // Add/overwrite with HandCash items (they are the source of truth for on-chain)
    handcashItems.forEach((item: any) => {
      itemsByOrigin.set(item.origin || item.id, {
        ...item,
        isLocal: false
      })
    })

    const finalItems = Array.from(itemsByOrigin.values())

    return NextResponse.json({
      success: true,
      items: finalItems,
    })
  } catch (error) {
    console.error("[Inventory] Inventory error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch inventory",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
