import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { privateKey } = authResult

  try {
    const friends = await handcashService.getFriends(privateKey)

    return NextResponse.json({ friends })
  } catch (error: any) {
    console.error("[v0] Friends error:", error)
    return NextResponse.json({ error: "Failed to fetch friends", details: error.message }, { status: 500 })
  }
}
