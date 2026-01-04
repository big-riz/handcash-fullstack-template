import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const currencyCode = searchParams.get("currency") || "USD"

    const rate = await handcashService.getExchangeRate(currencyCode)

    return NextResponse.json({ rate })
  } catch (error: any) {
    console.error("[v0] Exchange rate error:", error)
    return NextResponse.json({ error: "Failed to fetch exchange rate", details: error.message }, { status: 500 })
  }
}
