import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { privateKey } = authResult

  console.log("[v0] Inventory - privateKey exists:", !!privateKey)

  try {
    const items = await handcashService.getInventory(privateKey)
    console.log("[v0] Inventory items count:", items?.length || 0)

    return NextResponse.json({
      success: true,
      items,
    })
  } catch (error) {
    console.error("[v0] Inventory error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch inventory",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
