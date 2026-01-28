# Authorization Check Timing Fix (v2)

**Date**: 2026-01-26
**Component**: SlavicSurvivors.tsx
**Issue**: Unauthorized alert flashing briefly even for authenticated users

---

## Problem

The unauthorized "ACCESS DENIED" alert was flashing briefly even for authenticated users due to React's asynchronous state updates. Users would see:
1. Loading screen appears
2. Brief flash of "ACCESS DENIED"
3. Game continues (if authorized)

This created a confusing and jarring UX experience.

---

## Root Cause

The authorization flow had only two states:
- `isAuthorized === null` → Show loading
- `isAuthorized === false` → Show unauthorized immediately

There was no way to distinguish between:
- "Check hasn't started yet" (null)
- "Check is in progress" (should show loading)
- "Check completed and user is unauthorized" (show alert)

---

## Solution

Added an `isCheckingAuth` state to track when the authorization check is actively running:

### Changes Made

1. **Added `isCheckingAuth` state**
```typescript
const [isCheckingAuth, setIsCheckingAuth] = useState(false)
```

2. **Updated `checkAccess` function**
```typescript
useEffect(() => {
    const checkAccess = async () => {
        if (!user) {
            setIsCheckingAuth(false)
            return
        }

        setIsCheckingAuth(true)  // ✅ Start checking

        const hostname = typeof window !== "undefined" ? window.location.hostname : ""
        if (hostname === "localhost" || hostname === "127.0.0.1") {
            setIsAuthorized(true)
            setIsCheckingAuth(false)  // ✅ Done checking
            return
        }

        try {
            const response = await fetch("/api/game/check-access")
            const data = await response.json()
            if (data.success) {
                setIsAuthorized(data.authorized)
                setAuthReason(data.reason)
            }
        } catch (err) {
            console.error("Access check failed:", err)
        } finally {
            setIsCheckingAuth(false)  // ✅ Done checking (even if error)
        }
    }
    checkAccess()
}, [user])
```

3. **Updated unauthorized alert condition**
```typescript
// Before:
{isAuthorized === false && (
    <div>ACCESS DENIED</div>
)}

// After:
{!isCheckingAuth && isAuthorized === false && (  // ✅ Only show when NOT checking
    <div>ACCESS DENIED</div>
)}
```

4. **Updated loading state condition**
```typescript
// Before:
{isAuthorized === null && user && (
    <div>VERIFYING RELICS...</div>
)}

// After:
{(isCheckingAuth || (isAuthorized === null && user)) && (  // ✅ Show while checking
    <div>VERIFYING RELICS...</div>
)}
```

---

## Result

✅ Unauthorized alert only shows AFTER check completes and user is confirmed unauthorized
✅ Loading state shows during the entire check process
✅ No more confusing flash of ACCESS DENIED screen
✅ TypeScript compilation passes

---

## User Flow (Before)

1. Page loads → `isAuthorized = null` → Shows loading
2. Check completes → `isAuthorized = false` → **Immediately shows ACCESS DENIED**
3. (If user becomes authorized) → `isAuthorized = true` → ACCESS DENIED disappears

**Problem**: Step 2 happens instantly, creating a flash

---

## User Flow (After)

1. Page loads → `isCheckingAuth = false`, `isAuthorized = null` → Shows loading
2. Check starts → `isCheckingAuth = true` → **Continues showing loading**
3. Check completes → `isCheckingAuth = false`, `isAuthorized = false/true`
   - If `false` → Shows ACCESS DENIED
   - If `true` → Continues to game

**Fix**: Loading state persists through entire check, unauthorized only shows when definitively false

---

## Edge Cases Handled

1. **No user**: `setIsCheckingAuth(false)` immediately, stays on loading/menu
2. **Localhost**: Skips API check, sets authorized immediately
3. **API error**: `finally` block ensures `isCheckingAuth` is reset even on error
4. **User changes**: `useEffect` re-runs, check restarts with `isCheckingAuth = true`

---

## Files Modified

- `components/game/SlavicSurvivors.tsx`
  - Added `isCheckingAuth` state (line 62)
  - Updated `checkAccess` useEffect (lines 497-522)
  - Updated unauthorized condition (line 793)
  - Updated loading condition (line 818)

---

**Status**: ✅ FIXED
