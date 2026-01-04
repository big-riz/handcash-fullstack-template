import { randomBytes } from "crypto"

/**
 * Session Management Utilities
 * Provides secure session tracking with metadata for audit logging
 */

export interface SessionMetadata {
  sessionId: string
  privateKey: string
  createdAt: number
  lastActivity: number
  ipAddress: string | null
  userAgent: string | null
}

/**
 * Generate a secure session ID
 */
export function generateSessionId(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Create a new session with metadata
 */
export function createSession(privateKey: string, ipAddress: string | null, userAgent: string | null): SessionMetadata {
  const now = Date.now()
  return {
    sessionId: generateSessionId(),
    privateKey,
    createdAt: now,
    lastActivity: now,
    ipAddress,
    userAgent,
  }
}

/**
 * Update session activity timestamp
 */
export function updateSessionActivity(session: SessionMetadata): SessionMetadata {
  return {
    ...session,
    lastActivity: Date.now(),
  }
}

/**
 * Check if session has expired (30 days of inactivity)
 */
export function isSessionExpired(session: SessionMetadata, maxAgeMs = 30 * 24 * 60 * 60 * 1000): boolean {
  return Date.now() - session.lastActivity > maxAgeMs
}

/**
 * Validate session consistency (IP and User-Agent matching)
 */
export function validateSessionConsistency(
  session: SessionMetadata,
  currentIp: string | null,
  currentUserAgent: string | null,
): boolean {
  // Allow null values (e.g., in development)
  if (!session.ipAddress || !session.userAgent) {
    return true
  }

  // In production, enforce strict matching
  return session.ipAddress === currentIp && session.userAgent === currentUserAgent
}
