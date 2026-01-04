import { type NextRequest, NextResponse } from "next/server"
import { logAuditEvent, AuditEventType } from "@/lib/audit-logger"

export async function POST(request: NextRequest) {
  const sessionData = request.cookies.get("session_metadata")?.value
  let sessionId: string | undefined

  if (sessionData) {
    try {
      const session = JSON.parse(sessionData)
      sessionId = session.sessionId
    } catch (err) {
      console.error("[v0] Session parse error on logout:", err)
    }
  }

  logAuditEvent({
    type: AuditEventType.LOGOUT,
    success: true,
    sessionId,
    ipAddress: request.ip || null,
    userAgent: request.headers.get("user-agent"),
  })

  const response = NextResponse.json({ success: true })

  response.cookies.delete("private_key")
  response.cookies.delete("session_metadata")

  return response
}
