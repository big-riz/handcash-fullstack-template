import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { requireAuth } from "@/lib/auth-middleware"
import { logAuditEvent, AuditEventType } from "@/lib/audit-logger"

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)

  if (!authResult.success) {
    return authResult.response
  }

  const { privateKey, session } = authResult

  try {
    const profile = await handcashService.getUserProfile(privateKey)

    const response = NextResponse.json(profile)
    response.cookies.set("session_metadata", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })

    logAuditEvent({
      type: AuditEventType.PROFILE_ACCESS,
      success: true,
      sessionId: session.sessionId,
      userId: profile.publicProfile.handle,
      ipAddress: request.ip || null,
      userAgent: request.headers.get("user-agent"),
    })

    return response
  } catch (error) {
    console.error("[v0] Profile route error:", error)

    logAuditEvent({
      type: AuditEventType.PROFILE_ACCESS,
      success: false,
      sessionId: session.sessionId,
      ipAddress: request.ip || null,
      userAgent: request.headers.get("user-agent"),
      details: { error: String(error) },
    })

    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
