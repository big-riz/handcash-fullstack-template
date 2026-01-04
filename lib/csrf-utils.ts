import { randomBytes } from "crypto"

/**
 * CSRF Protection Utilities for OAuth Flow
 * Implements RFC 9700 best practices for OAuth 2.0 security
 */

export interface CSRFToken {
  value: string
  expiresAt: number
}

/**
 * Generate a cryptographically secure CSRF token (state parameter)
 */
export function generateCSRFToken(): string {
  return randomBytes(32).toString("hex")
}

/**
 * Create a signed CSRF token with expiration
 */
export function createCSRFToken(expiresInMinutes = 10): CSRFToken {
  return {
    value: generateCSRFToken(),
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
  }
}

/**
 * Validate CSRF token matches and hasn't expired
 */
export function validateCSRFToken(stored: CSRFToken | null, received: string | null): boolean {
  if (!stored || !received) {
    return false
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return timingSafeEqual(stored.value, received)
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}
