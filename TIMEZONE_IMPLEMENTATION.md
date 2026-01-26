# Timezone and DateTime Implementation

## Overview
This document describes how date and time are properly stored and displayed across the application, ensuring accurate timestamp recording in the database and proper localized display on clients.

## Implementation Summary

### 1. Database Storage (UTC)
- **Database**: PostgreSQL (Neon)
- **Column Type**: `timestamp` with `DEFAULT now()`
- **Timezone**: All timestamps are stored in UTC
- **Tables Affected**:
  - `replays.created_at` - Game session timestamps
  - `comments.created_at` - Comment timestamps
  - `payments.paid_at` - Payment timestamps
  - `collections.created_at` - Collection creation timestamps
  - And other timestamp columns across the schema

### 2. API Serialization (ISO 8601 UTC)
- **Method**: `NextResponse.json()`
- **Format**: Automatically serializes JavaScript Date objects to ISO 8601 strings in UTC
- **Example**: `"2026-01-25T15:30:45.123Z"`
- **API Endpoints**:
  - `GET /api/replays` - Returns replay data with createdAt timestamps
  - `GET /api/comments` - Returns comments with createdAt timestamps
  - Other endpoints that return timestamp data

### 3. Client Display (Localized)
- **Utility File**: `lib/date-utils.ts`
- **Functions**:
  - `formatDateTime(timestamp)` - Shows full date and time in user's locale
    - Example: "1/25/2026, 3:30 PM"
  - `formatDate(timestamp)` - Shows only date in user's locale
    - Example: "1/25/2026"
  - `formatRelativeTime(timestamp)` - Shows relative time for recent items
    - Examples: "2h ago", "5d ago", or falls back to absolute time for older items

### 4. Updated Components

#### Leaderboard Display
- **File**: `components/game/screens/Leaderboard.tsx`
- **Change**: Uses `formatDateTime()` to show when each score was achieved
- **Display**: Shows localized date and time for each leaderboard entry

#### User History
- **Files**:
  - `components/game/screens/History.tsx`
  - `components/game/ui/HistoryBoard.tsx`
- **Change**: Uses `formatDateTime()` to show session timestamps
- **Display**: Shows localized date and time for each personal game session

#### Comments Section
- **File**: `components/game/screens/CommentsSection.tsx`
- **Change**: Uses `formatRelativeTime()` for both comments and replies
- **Display**: Shows relative time (e.g., "2h ago") for recent comments, falls back to full datetime for older ones

#### Admin Interface
- **File**: `components/admin/payment-request-management.tsx`
- **Change**: Updated to use user's locale instead of hardcoded "en-US"
- **Display**: Shows localized date and time for payment requests and payment timestamps

## How It Works

### Data Flow
```
1. Game/User Action
   ↓
2. Server Receives Request → Database stores timestamp in UTC
   ↓
3. Database Query → Returns timestamp as Date object
   ↓
4. API Response → NextResponse.json() serializes to ISO 8601 UTC string
   ↓
5. Client Receives → "2026-01-25T15:30:45.123Z"
   ↓
6. Display Component → formatDateTime() converts to local timezone
   ↓
7. User Sees → "1/25/2026, 3:30 PM" (in their timezone)
```

### Timezone Conversion
- **Browser API**: Uses JavaScript's `toLocaleString()` with `undefined` locale
- **Automatic Detection**: Browser automatically detects user's timezone
- **No Configuration**: No need for users to set their timezone
- **DST Handling**: Automatically handles daylight saving time

## Benefits

1. **Accurate Storage**: All timestamps stored in UTC prevents timezone ambiguity
2. **Automatic Localization**: Users see times in their local timezone automatically
3. **Consistency**: Centralized date formatting utilities ensure consistent display
4. **Maintainability**: Easy to update date formatting across the entire app
5. **No Server Config**: No need to configure server timezone settings

## Testing

To verify correct implementation:

1. **Check Database**:
   ```sql
   SELECT created_at FROM replays ORDER BY created_at DESC LIMIT 5;
   -- Should show timestamps in UTC
   ```

2. **Check API Response**:
   ```javascript
   fetch('/api/replays?limit=1')
     .then(r => r.json())
     .then(data => console.log(data[0].createdAt))
   // Should output: "2026-01-25T15:30:45.123Z" (ISO 8601 UTC)
   ```

3. **Check Display**:
   - Open leaderboard or history in browser
   - Verify times show in your local timezone
   - Change system timezone and refresh page
   - Verify times update to new timezone

## Future Improvements

- [ ] Consider adding timezone indicator to displays (e.g., "3:30 PM PST")
- [ ] Add user preference for date format (12h/24h, date format)
- [ ] Add "time ago" format for very recent items (< 1 minute)
- [ ] Consider migrating to `timestamptz` column type for explicit timezone storage

## Related Files

- `lib/date-utils.ts` - Date formatting utilities
- `lib/schema.ts` - Database schema definitions
- `app/api/replays/route.ts` - Replay API endpoints
- `app/api/comments/route.ts` - Comments API endpoints
- `components/game/screens/Leaderboard.tsx` - Leaderboard display
- `components/game/screens/History.tsx` - History display
- `components/game/screens/CommentsSection.tsx` - Comments display
