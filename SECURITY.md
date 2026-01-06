# Security Architecture Documentation

This HandCash app template implements enterprise-grade security practices for OAuth authentication and session management.

## 🔒 Security Features Implemented

### 1. CSRF Protection (RFC 9700 Compliant)

**Cross-Site Request Forgery Protection** using OAuth 2.0 `state` parameter:

- **Cryptographically secure tokens**: Generated using 32-byte random values
- **Time-limited validation**: 10-minute expiration on CSRF tokens
- **Timing-safe comparison**: Prevents timing attacks on token validation
- **Automatic cleanup**: Expired tokens rejected, cookies cleared on validation

**Implementation:**
- `lib/csrf-utils.ts` - Token generation and validation
- Login flow stores CSRF token in httpOnly cookie
- Callback validates state parameter matches stored token
- All mismatches logged as security violations

### 2. Session Management with Metadata Tracking

**Enhanced session security** with cross-reference protection:

- **Unique session IDs**: 32-byte cryptographically secure identifiers
- **Session metadata tracking**:
  - IP address (for session hijacking detection)
  - User-Agent (for device fingerprinting)
  - Creation timestamp
  - Last activity timestamp
- **Session validation**:
  - 30-day inactivity expiration
  - IP address consistency checks
  - User-Agent consistency checks
  - Strict enforcement in production (with migration grace period)
- **Automatic session refresh**: Activity timestamps updated on each request

**Implementation:**
- `lib/session-utils.ts` - Session lifecycle management
- Sessions stored in httpOnly cookies alongside auth tokens
- Middleware validates session integrity on every protected route

### 3. Centralized Authentication Middleware

**Consistent auth validation** across all protected routes:

- **Single entry point**: All routes use `requireAuth()` helper
- **Automatic token validation**: Verifies with HandCash service
- **Session hijacking detection**: Validates IP and User-Agent consistency
- **Session expiration checks**: Rejects expired sessions
- **Bearer token support**: Accepts both cookies and Authorization headers
- **Automatic cookie updates**: Refreshes session activity timestamps

**Implementation:**
- `lib/auth-middleware.ts` - `requireAuth()` function
- Applied to all protected API routes

### 4. Admin Access Control

**Strict admin authorization** enforced at middleware level:

- **Handle-based verification**: Validates authenticated user's handle against `ADMIN_HANDLE` env var
- **Real-time validation**: Fetches user profile on each admin request
- **No frontend-only checks**: All admin routes protected server-side
- **Audit logging**: All admin access attempts logged

**Implementation:**
- `lib/admin-middleware.ts` - `requireAdmin()` function
- Applied to all `/api/admin/*` routes
- Configuration validation on startup

### 5. Comprehensive Rate Limiting

**Protection against brute force and abuse**:

- **In-memory rate limiting**: Configurable limits per endpoint type
- **IP-based tracking**: Uses x-forwarded-for header for accurate identification
- **Endpoint-specific limits**:
  - Admin endpoints: 1,000 requests/minute
  - Auth endpoints: 100 requests/minute
  - Payment endpoints: 500 requests/minute
  - Item transfer: 500 requests/minute
  - General endpoints: 1,000 requests/minute
- **Applied to all routes**: Every API endpoint protected

**Implementation:**
- `lib/rate-limit.ts` - Rate limiting utility
- Presets for different endpoint types
- Automatic cleanup of expired entries

**Note**: For multi-instance deployments, consider Redis-based rate limiting.

### 6. Persistent Audit Logging

**Security event tracking** for compliance and monitoring:

**Events logged:**
- `LOGIN_INITIATED` - User starts OAuth flow
- `LOGIN_SUCCESS` - Successful authentication
- `LOGIN_FAILED` - Authentication failure
- `LOGOUT` - User logout
- `SESSION_EXPIRED` - Session timeout
- `CSRF_VIOLATION` - CSRF attack attempt
- `SESSION_HIJACK_ATTEMPT` - Session validation failure
- `PROFILE_ACCESS` - Profile API access
- `PAYMENT_INITIATED` - Payment started
- `PAYMENT_SUCCESS` - Payment completed
- `PAYMENT_FAILED` - Payment error

**Audit data captured:**
- Event type and timestamp
- Session ID
- User ID (when available)
- IP address
- User-Agent
- Success/failure status
- Additional context details (sensitive data redacted)

**Log storage:**
- File-based with daily rotation
- 30-day retention policy
- JSON lines format for easy parsing
- Sensitive data automatically redacted

**Implementation:**
- `lib/audit-logger.ts` - Logging framework
- `lib/audit-storage.ts` - File-based persistence
- Automatic redaction of sensitive fields (handles, amounts, etc.)

### 7. Input Validation

**Robust input sanitization and validation**:

- **Schema-based validation**: Using Zod for type-safe validation
- **Handle/ID resolution**: Centralized utilities for parsing various input types
- **URL validation**: Ensures valid webhook URLs
- **Type checking**: Validates data types before processing

**Implementation:**
- `lib/input-validation.ts` - Validation utilities
- Applied to critical admin routes
- Clear error messages for invalid inputs

### 8. Webhook Security

**Secure webhook endpoint protection**:

- **Header-based authentication**: Validates `app-id` and `app-secret` headers
- **Rate limiting**: 100 requests/minute
- **Timestamp validation**: Prevents replay attacks (5-minute window)
- **IP-based tracking**: Logs source IP for all webhook requests

**Implementation:**
- `app/api/webhooks/payment/route.ts`
- Validates against environment variables
- Rejects expired timestamps

### 9. Configuration Validation

**Startup validation** for essential environment variables:

- **Required variables checked**: `HANDCASH_APP_ID`, `HANDCASH_APP_SECRET`, `ADMIN_HANDLE`
- **Fails fast in production**: Prevents misconfigured deployments
- **Clear error messages**: Identifies missing or invalid configuration

**Implementation:**
- `lib/config-validator.ts` - Configuration checker
- Validates on admin route access (first time only)

## 🛡️ Security Best Practices

### Cookie Security

All authentication cookies use secure settings:

```typescript
{
  httpOnly: true,        // Prevents XSS access
  secure: true,          // HTTPS only in production
  sameSite: "lax",       // CSRF protection
  maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
}
```

### Private Key Storage

- **Never stored in localStorage** - Prevents XSS theft
- **httpOnly cookies only** - Not accessible to JavaScript
- **Separate from session metadata** - Private key isolated from other session data
- **Temporary keys expire** - 10-minute window for OAuth flow
- **Validated before persistence** - HandCash verification required

### Session Lifecycle

1. **Login**: Generate CSRF token + ephemeral key pair
2. **OAuth Redirect**: Include state parameter for validation
3. **Callback**: Validate CSRF, verify token, create session with metadata
4. **Requests**: Middleware validates session + refreshes activity
5. **Logout**: Clear all cookies, log event

### IP Address Detection

- **Proxy-aware**: Properly extracts IP from `x-forwarded-for` header
- **Fallback handling**: Gracefully handles missing headers
- **First IP in chain**: Uses first IP from forwarded header (client's origin IP)

## 🔧 Environment Variables Required

```bash
# HandCash OAuth Credentials (Required)
HANDCASH_APP_ID=your_app_id_here
HANDCASH_APP_SECRET=your_app_secret_here

# Admin Configuration (Required for admin features)
ADMIN_HANDLE=your_handcash_handle

# Business Wallet (Required for admin item operations)
BUSINESS_AUTH_TOKEN=your_business_wallet_auth_token

# Webhook Configuration (Optional but recommended)
WEBSITE_URL=https://your-domain.com
```

Get credentials from: [HandCash Developer Dashboard](https://dashboard.handcash.io)

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AuthProvider (React Context)                         │  │
│  │  - Centralized auth state                            │  │
│  │  - Auto profile refresh                              │  │
│  │  - useAuth() hook                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes (Server)                       │
│                                                              │
│  /api/auth/login                                            │
│  ├─ Generate CSRF token                                     │
│  ├─ Generate key pair                                       │
│  ├─ Store in httpOnly cookies                              │
│  ├─ Rate limit: 100/min                                     │
│  └─ Return HandCash OAuth URL                              │
│                                                              │
│  /api/auth/callback                                         │
│  ├─ Rate limit: 200/min                                     │
│  ├─ Validate CSRF token                                     │
│  ├─ Verify auth token with HandCash                        │
│  ├─ Create session with metadata                           │
│  ├─ Store session + private key                            │
│  └─ Log audit event                                        │
│                                                              │
│  Protected User Routes                                      │
│  ├─ requireAuth() middleware                               │
│  ├─ Rate limiting                                          │
│  ├─ Validate session consistency                           │
│  ├─ Check expiration                                       │
│  ├─ Update activity timestamp                             │
│  └─ Log access events                                      │
│                                                              │
│  Admin Routes (/api/admin/*)                               │
│  ├─ requireAdmin() middleware                              │
│  ├─ Rate limiting (1000/min)                               │
│  ├─ Verify handle matches ADMIN_HANDLE                     │
│  ├─ Input validation                                       │
│  └─ Audit logging                                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Security Utilities                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ CSRF Utils   │  │Session Utils │  │ Audit Logger │    │
│  │              │  │              │  │              │    │
│  │ - Generate   │  │ - Create     │  │ - Log events │    │
│  │ - Validate   │  │ - Validate   │  │ - Redact     │    │
│  │ - Timing-    │  │ - Expire     │  │ - Persist    │    │
│  │   safe       │  │ - Hijack     │  │ - Rotate     │    │
│  │   compare    │  │   detection  │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │Rate Limiting │  │Input Valid.  │  │Config Valid. │    │
│  │              │  │              │  │              │    │
│  │ - In-memory  │  │ - Zod schemas│  │ - Env check  │    │
│  │ - IP-based   │  │ - Type safe  │  │ - Format     │    │
│  │ - Presets    │  │ - Sanitize   │  │   validate   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Security Monitoring

### Watch for these audit log events:

1. **CSRF_VIOLATION**: Potential CSRF attack
2. **SESSION_HIJACK_ATTEMPT**: IP/User-Agent mismatch
3. **Repeated LOGIN_FAILED**: Brute force attempts
4. **Unusual access patterns**: Multiple IPs for same session
5. **Rate limit exceeded**: Potential DoS attempt

### Audit Log Location

- **Current log**: `data/audit.log`
- **Rotated logs**: `data/audit-YYYY-MM-DD.log`
- **Retention**: 30 days
- **Format**: JSON Lines (one event per line)

### Production Recommendations:

1. **Enable audit log forwarding** to security monitoring service (Sentry, DataDog, etc.)
2. **Set up alerts** for security violations
3. **Monitor rate limit hits** to detect abuse patterns
4. **Review session hijack attempts** regularly
5. **Consider IP allowlisting** for sensitive operations (optional)
6. **Enable 2FA** for admin HandCash accounts (if applicable)
7. **Regular security audits** of auth flows

## 🔄 Security Posture Summary

### ✅ Strengths

- **Comprehensive authentication**: CSRF protection, session management, admin controls
- **Rate limiting**: All endpoints protected against abuse
- **Audit logging**: Complete security event tracking with persistence
- **Input validation**: Schema-based validation on critical routes
- **Secure storage**: Private keys properly isolated, httpOnly cookies
- **Session hijacking detection**: IP/User-Agent validation
- **Configuration validation**: Fails fast on misconfiguration

### ⚠️ Considerations

- **In-memory rate limiting**: For multi-instance deployments, consider Redis
- **Webhook authentication**: Currently header-based; consider HMAC signatures if HandCash supports them
- **Session validation**: Migration grace period for existing sessions with null IP/UA

### 🔒 Security Standards Compliance

- **RFC 9700**: OAuth 2.0 Security Best Practices ✅
- **OWASP Top 10**: Most vulnerabilities addressed ✅
- **SOC 2 Ready**: Audit logging meets requirements ✅
- **GDPR Compatible**: Sensitive data redacted from logs ✅

## 📝 Testing Security Features

### Manual Testing Checklist:

- [ ] Login creates CSRF token in cookies
- [ ] Callback rejects without valid state parameter
- [ ] Session tracks IP address and User-Agent
- [ ] Protected routes require authentication
- [ ] Admin routes require matching handle
- [ ] Session expires after 30 days of inactivity
- [ ] Logout clears all cookies
- [ ] Audit logs capture all auth events
- [ ] Rate limiting blocks excessive requests
- [ ] Multiple devices can maintain separate sessions
- [ ] Invalid tokens are rejected
- [ ] Session hijacking detected (IP/UA mismatch)

### Security Test Scenarios:

```javascript
// 1. Test CSRF protection
// - Clear state cookie before callback
// - Expect: Redirect to /?error=csrf_failed

// 2. Test session hijacking detection
// - Login, copy session cookie
// - Use from different IP/User-Agent
// - Expect: Session validation failure

// 3. Test session expiration
// - Mock Date.now() to +31 days
// - Access protected route
// - Expect: 401 Unauthorized

// 4. Test rate limiting
// - Send 100+ requests in 1 minute
// - Expect: 429 Too Many Requests

// 5. Test admin access
// - Login as non-admin user
// - Attempt admin endpoint
// - Expect: 403 Forbidden

// 6. Test input validation
// - Send malformed JSON to admin endpoints
// - Expect: 400 Bad Request with clear error
```

## 📚 Additional Resources

- [RFC 9700: OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/rfc9700/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [HandCash SDK Documentation](https://docs.handcash.io/)

## 🤝 Security Reporting

Found a security issue? Please report it responsibly:
1. Do NOT open a public GitHub issue
2. Contact the maintainers directly
3. Allow reasonable time for patching before disclosure

---

**Last Updated**: January 2025  
**Security Standards**: RFC 9700, OWASP Top 10  
**Compliance**: SOC 2 Ready, GDPR Compatible  
**Status**: ✅ Production Ready
