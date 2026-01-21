import { type NextRequest, NextResponse } from "next/server"
import { handcashService } from "@/lib/handcash-service"
import { validateCSRFToken } from "@/lib/csrf-utils"
import { createSession } from "@/lib/session-utils"
import { logAuditEvent, AuditEventType } from "@/lib/audit-logger"
import { rateLimit, RateLimitPresets } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  // Apply rate limiting (more permissive for OAuth callback)
  const rateLimitResponse = rateLimit(request, RateLimitPresets.authCallback)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  try {
    const stateParam = request.nextUrl.searchParams.get("state")
    const csrfTokenCookie = request.cookies.get("handcash_csrf_token")?.value

    let storedCSRFToken = null
    if (csrfTokenCookie) {
      try {
        storedCSRFToken = JSON.parse(csrfTokenCookie)
      } catch (err) {
        console.error("[Auth] CSRF token parse error:", err)
      }
    }

    if (!validateCSRFToken(storedCSRFToken, stateParam)) {

      const forwardedFor = request.headers.get("x-forwarded-for")
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null
      const userAgent = request.headers.get("user-agent") || request.headers.get("x-forwarded-user-agent")

      logAuditEvent({
        type: AuditEventType.CSRF_VIOLATION,
        success: false,
        ipAddress,
        userAgent,
        details: {
          receivedState: stateParam,
          hasStoredToken: !!storedCSRFToken,
        },
      })

      return NextResponse.redirect(new URL("/?error=csrf_failed", request.url))
    }

    const privateKey = request.cookies.get("handcash_temp_private_key")?.value

    if (!privateKey) {

      const forwardedFor = request.headers.get("x-forwarded-for")
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null
      const userAgent = request.headers.get("user-agent") || request.headers.get("x-forwarded-user-agent")

      logAuditEvent({
        type: AuditEventType.LOGIN_FAILED,
        success: false,
        ipAddress,
        userAgent,
        details: { reason: "Missing private key" },
      })

      return NextResponse.redirect(new URL("/?error=missing_key", request.url))
    }

    const appId = process.env.HANDCASH_APP_ID
    const appSecret = process.env.HANDCASH_APP_SECRET

    if (!appId || !appSecret) {
      return NextResponse.redirect(new URL("/?error=config_error", request.url))
    }

    const isValid = await handcashService.validateAuthToken(privateKey)

    if (!isValid) {
      const forwardedFor = request.headers.get("x-forwarded-for")
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null
      const userAgent = request.headers.get("user-agent") || request.headers.get("x-forwarded-user-agent")

      logAuditEvent({
        type: AuditEventType.LOGIN_FAILED,
        success: false,
        ipAddress,
        userAgent,
        details: { reason: "Invalid auth token" },
      })

      throw new Error("Invalid auth token")
    }

    // Get IP from x-forwarded-for header (for proxies/load balancers)
    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null
    const userAgent = request.headers.get("user-agent") || request.headers.get("x-forwarded-user-agent")

    // Fetch user profile from HandCash
    let userProfile: any = null
    let userId: string | undefined = undefined
    try {
      userProfile = await handcashService.getUserProfile(privateKey)

      // Store/update user in database
      if (userProfile?.publicProfile) {
        const { upsertUser } = await import("@/lib/users-storage")

        // Extract user ID - try multiple possible locations
        userId = userProfile.userId || userProfile.publicProfile.userId || userProfile.publicProfile.handle

        if (!userId) {
          console.error("[Auth] Could not extract user ID from profile")
          throw new Error("No user ID found in profile")
        }

        await upsertUser({
          id: userId,
          handle: userProfile.publicProfile.handle.toLowerCase(),
          displayName: userProfile.publicProfile.displayName || userProfile.publicProfile.handle,
          avatarUrl: userProfile.publicProfile.avatarUrl,
          email: userProfile.privateProfile?.email,
        })

        console.log("[Auth] User upserted:", userId, userProfile.publicProfile.handle)
      }
    } catch (err) {
      console.error("[Auth] Error fetching/storing user profile:", err)
      // Continue with login even if profile fetch fails
    }

    const session = createSession(ipAddress, userAgent)

    // Store session in database
    try {
      const { upsertSession } = await import("@/lib/sessions-storage")
      await upsertSession({
        id: session.sessionId,
        userId: userId, // Link to user if we have it
        ipAddress: session.ipAddress || undefined,
        userAgent: session.userAgent || undefined,
        createdAt: new Date(session.createdAt),
        lastActivityAt: new Date(session.lastActivity),
        expiresAt: new Date(session.createdAt + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      console.log("[Auth] Session stored in database:", session.sessionId, "for user:", userId || "unknown")
    } catch (err) {
      console.error("[Auth] Error storing session in database:", err)
      // Continue with login even if session storage fails
    }

    const response = NextResponse.redirect(new URL("/", request.url))

    response.cookies.set("private_key", privateKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    response.cookies.set("session_metadata", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    })

    response.cookies.delete("handcash_temp_private_key")
    response.cookies.delete("handcash_csrf_token")

    logAuditEvent({
      type: AuditEventType.LOGIN_SUCCESS,
      success: true,
      sessionId: session.sessionId,
      userId: userProfile?.id,
      ipAddress,
      userAgent,
    })

    return response
  } catch (error) {
    console.error("[Auth] Callback validation error:", error)

    const forwardedFor = request.headers.get("x-forwarded-for")
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : null
    const userAgent = request.headers.get("user-agent") || request.headers.get("x-forwarded-user-agent")

    logAuditEvent({
      type: AuditEventType.LOGIN_FAILED,
      success: false,
      ipAddress,
      userAgent,
      details: { error: String(error) },
    })

    const response = NextResponse.redirect(new URL("/?error=auth_failed", request.url))
    response.cookies.delete("handcash_temp_private_key")
    response.cookies.delete("handcash_csrf_token")

    return response
  }
}
