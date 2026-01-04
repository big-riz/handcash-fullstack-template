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
    const response = await handcashService.getBalance(privateKey)
    return NextResponse.json(response)
  } catch (error: any) {
    console.error("[v0] Balance fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch balance", details: error.message }, { status: 500 })
  }
}
