import { db } from "./db"
import { auditLogs } from "./schema"
import type { AuditEvent } from "./audit-logger"

/**
 * Write audit event to database
 */
export async function writeAuditEvent(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      timestamp: new Date(event.timestamp),
      eventType: event.type, // Map 'type' to 'eventType'
      userId: event.userId,
      sessionId: event.sessionId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      resource: undefined, // Not in AuditEvent interface
      action: undefined, // Not in AuditEvent interface
      details: event.details,
      success: event.success,
    })
  } catch (error) {
    // Log error but don't throw - we don't want to break the application
    console.error("[AuditStorage] Failed to write audit event:", error)
  }
}


/**
 * Initialize audit storage (call on app startup)
 * With database storage, this is a no-op but kept for API compatibility
 */
export async function initializeAuditStorage(): Promise<void> {
  // Database handles initialization automatically
  // This function is kept for backward compatibility
  console.log("[AuditStorage] Using database storage - no initialization needed")
}

