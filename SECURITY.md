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
- **Automatic session refresh**: Activity timestamps updated on each request

**Implementation:**
- `lib/session-utils.ts` - Session lifecycle management
- Sessions stored in httpOnly cookies alongside auth tokens
- Middleware validates session integrity on every protected route

### 3. Centralized Authentication Context

**React Context-based auth state** eliminates redundant API calls:

- **Single source of truth**: Shared auth state across entire app
- **Automatic profile fetching**: Loads user on mount
- **Auto-refresh**: Re-validates every 5 minutes
- **Unified login/logout**: Consistent flow across all components
- **Error handling**: Centralized error state management

**Implementation:**
- `lib/auth-context.tsx` - AuthProvider and useAuth hook
- Wraps entire app in `app/layout.tsx`
- All components use `useAuth()` instead of direct API calls

### 4. Unified Authentication Middleware

**Consistent auth validation** across all protected routes:

- **Single entry point**: All routes use `requireAuth()` helper
- **Automatic token validation**: Verifies with HandCash service
- **Session hijacking detection**: Validates IP and User-Agent consistency
- **Session expiration checks**: Rejects expired sessions
- **Bearer token support**: Accepts both cookies and Authorization headers
- **Automatic cookie updates**: Refreshes session activity timestamps

**Implementation:**
- `lib/auth-middleware.ts` - `requireAuth()` function
- Applied to all protected API routes:
  - `/api/auth/profile`
  - `/api/payments/send`
  - `/api/payments/balance`
  - `/api/inventory`
  - `/api/items/transfer`
  - `/api/friends`

### 5. Comprehensive Audit Logging

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
- Additional context details

**Implementation:**
- `lib/audit-logger.ts` - Logging framework
- Console output for development
- Ready for production logging service integration (Sentry, DataDog, etc.)

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
- **Temporary keys expire** - 10-minute window for OAuth flow
- **Validated before persistence** - HandCash verification required

### Session Lifecycle

1. **Login**: Generate CSRF token + ephemeral key pair
2. **OAuth Redirect**: Include state parameter for validation
3. **Callback**: Validate CSRF, verify token, create session
4. **Requests**: Middleware validates session + refreshes activity
5. **Logout**: Clear all cookies, log event

## 🔧 Environment Variables Required

```bash
# HandCash OAuth Credentials (Required)
HANDCASH_APP_ID=your_app_id_here
HANDCASH_APP_SECRET=your_app_secret_here
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
│  └─ Return HandCash OAuth URL                              │
│                                                              │
│  /api/auth/callback                                         │
│  ├─ Validate CSRF token                                     │
│  ├─ Verify auth token with HandCash                        │
│  ├─ Create session with metadata                           │
│  ├─ Store session + private key                            │
│  └─ Log audit event                                        │
│                                                              │
│  Protected Routes                                           │
│  ├─ requireAuth() middleware                               │
│  ├─ Validate session consistency                           │
│  ├─ Check expiration                                       │
│  ├─ Update activity timestamp                             │
│  └─ Log access events                                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Security Utilities                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ CSRF Utils   │  │Session Utils │  │ Audit Logger │    │
│  │              │  │              │  │              │    │
│  │ - Generate   │  │ - Create     │  │ - Log events │    │
│  │ - Validate   │  │ - Validate   │  │ - Track IPs  │    │
│  │ - Timing-    │  │ - Expire     │  │ - Monitor    │    │
│  │   safe       │  │ - Hijack     │  │   attempts   │    │
│  │   compare    │  │   detection  │  │              │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Security Monitoring

### Watch for these audit log events:

1. **CSRF_VIOLATION**: Potential CSRF attack
2. **SESSION_HIJACK_ATTEMPT**: IP/User-Agent mismatch
3. **Repeated LOGIN_FAILED**: Brute force attempts
4. **Unusual access patterns**: Multiple IPs for same session

### Production Recommendations:

1. **Enable audit log forwarding** to security monitoring service
2. **Set up alerts** for security violations
3. **Implement rate limiting** on auth endpoints
4. **Add IP allowlisting** for sensitive operations (optional)
5. **Enable 2FA** for admin accounts (if applicable)
6. **Regular security audits** of auth flows

## 🔄 Migration from Old Template

If upgrading from the previous template version:

1. **Add new dependencies**: No additional packages required
2. **Wrap app in AuthProvider**: Done in `app/layout.tsx`
3. **Update components**: Use `useAuth()` instead of direct fetch
4. **No data migration**: Existing sessions will be recreated on next login

## 📝 Testing Security Features

### Manual Testing Checklist:

- [ ] Login creates CSRF token in cookies
- [ ] Callback rejects without valid state parameter
- [ ] Session tracks IP address and User-Agent
- [ ] Protected routes require authentication
- [ ] Session expires after 30 days of inactivity
- [ ] Logout clears all cookies
- [ ] Audit logs capture all auth events
- [ ] Multiple devices can maintain separate sessions
- [ ] Invalid tokens are rejected

### Security Test Scenarios:

```javascript
// 1. Test CSRF protection
// - Clear state cookie before callback
// - Expect: Redirect to /?error=csrf_failed

// 2. Test session hijacking detection
// - Login, copy session cookie
// - Use from different IP/User-Agent
// - Expect: Session validation failure (in production)

// 3. Test session expiration
// - Mock Date.now() to +31 days
// - Access protected route
// - Expect: 401 Unauthorized

// 4. Test concurrent sessions
// - Login from two devices
// - Both should work independently
```

## 📚 Additional Resources

- [RFC 9700: OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/rfc9700/)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [HandCash SDK Documentation](https://docs.handcash.io/)

## 🤝 Contributing

Found a security issue? Please report it responsibly:
1. Do NOT open a public GitHub issue
2. Contact the maintainers directly
3. Allow reasonable time for patching before disclosure

---

**Last Updated**: January 2025  
**Security Standards**: RFC 9700, OWASP Top 10  
**Compliance**: SOC 2 Ready, GDPR Compatible
