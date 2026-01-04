import { NextResponse } from "next/server"
import { generateAuthenticationKeyPair } from "@/lib/auth-utils"
import { createCSRFToken } from "@/lib/csrf-utils"
import { logAuditEvent, AuditEventType } from "@/lib/audit-logger"

export async function GET(request: Request) {
  try {
    const appId = process.env.HANDCASH_APP_ID

    if (!appId) {
      return NextResponse.json({ error: "HandCash credentials not configured" }, { status: 500 })
    }

    const csrfToken = createCSRFToken(10) // 10 minute expiration
    const { privateKey, publicKey } = generateAuthenticationKeyPair()

    const redirectUrl = `https://handcash.io/connect?appId=${appId}&publicKey=${publicKey}&state=${csrfToken.value}`

    const response = NextResponse.json({
      redirectUrl,
      publicKey,
    })

    response.cookies.set("handcash_temp_private_key", privateKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    response.cookies.set("handcash_csrf_token", JSON.stringify(csrfToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10, // 10 minutes
      path: "/",
    })

    logAuditEvent({
      type: AuditEventType.LOGIN_INITIATED,
      success: true,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
    })

    return response
  } catch (error) {
    console.error("[v0] Login route error:", error)

    logAuditEvent({
      type: AuditEventType.LOGIN_INITIATED,
      success: false,
      ipAddress: request.headers.get("x-forwarded-for") || null,
      userAgent: request.headers.get("user-agent"),
      details: { error: String(error) },
    })

    return NextResponse.json({ error: "Failed to generate login URL" }, { status: 500 })
  }
}
