import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { privateKey } = authResult

  try {
    const body = await request.json()
    const { origins, destination } = body

    const itemOrigins = Array.isArray(origins) ? origins : [origins || body.itemOrigin]

    if (!itemOrigins.length || !destination) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await handcashService.transferItems(privateKey, {
      origins: itemOrigins,
      destination,
    })

    return NextResponse.json({ success: true, transaction: result })
  } catch (error: any) {
    console.error("[v0] Transfer item error:", error)
    return NextResponse.json({ error: "Failed to transfer item", details: error.message }, { status: 500 })
  }
}
