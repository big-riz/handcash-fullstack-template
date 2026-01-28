# localStorage Level Loading Fix

## Issue
Custom levels saved in localStorage were not appearing in the Level Editor's Levels tab after server restart. The editor would show 0 custom levels even though they existed in localStorage.

## Root Cause
The LevelEditor had its own `loadCustomLevels` function that only used localStorage as a fallback when the API call **failed** (catch block). When the API returned successfully with an empty array (after server restart), it wouldn't check localStorage.

```typescript
// OLD - BROKEN
const loadCustomLevels = async () => {
    try {
        const response = await fetch('/api/levels/list')
        if (response.ok) {
            const data = await response.json()
            setCustomLevels(data.levels || [])  // ❌ Uses empty array from API
        }
    } catch (error) {
        // Only uses localStorage if API call FAILS
        const stored = localStorage.getItem('customLevels')
        if (stored) {
            setCustomLevels(JSON.parse(stored))
        }
    }
}
```

## Solution
Updated LevelEditor to use the shared `loadCustomLevels` function from `lib/custom-levels-storage.ts`, which has proper fallback logic:

```typescript
// CORRECT - from lib/custom-levels-storage.ts
export async function loadCustomLevels(): Promise<CustomLevelData[]> {
    let apiLevels: CustomLevelData[] = []
    let localLevels: CustomLevelData[] = []

    // Try API first
    const response = await fetch('/api/levels/list')
    if (response.ok) {
        apiLevels = (await response.json()).levels || []
    }

    // ALWAYS check localStorage
    const stored = localStorage.getItem('customLevels')
    if (stored) {
        localLevels = JSON.parse(stored)
    }

    // ✅ Use localStorage if API is empty
    if (apiLevels.length > 0) {
        return apiLevels
    } else if (localLevels.length > 0) {
        console.log('[Storage] Using localStorage levels (API was empty)')
        return localLevels
    } else {
        return []
    }
}
```

## Changes Made

### File: `components/game/debug/LevelEditor.tsx`

1. **Import shared storage functions:**
```typescript
import {
    loadCustomLevels as loadCustomLevelsFromStorage,
    saveCustomLevel as saveToStorage
} from "@/lib/custom-levels-storage"
```

2. **Removed local `loadCustomLevels` function** - Now uses shared module

3. **Updated useEffect to use shared function:**
```typescript
useEffect(() => {
    if (isLocalhost) {
        loadCustomLevelsFromStorage().then(levels => {
            setCustomLevels(levels)
            console.log('[LevelEditor] Loaded', levels.length, 'custom levels')
        })
    }
}, [isLocalhost])
```

4. **Simplified `saveCustomLevel`:**
```typescript
const saveCustomLevel = async (level: CustomLevelData) => {
    console.log('[LevelEditor] Saving level:', level.id, level.name)

    // Use shared storage module (saves to both API and localStorage)
    await saveToStorage(level)

    // Reload from storage
    const reloaded = await loadCustomLevelsFromStorage()
    setCustomLevels(reloaded)
    console.log('[LevelEditor] ✅ Editor list updated with', reloaded.length, 'levels')

    // Notify parent
    if (onLevelsChanged) {
        onLevelsChanged()
        console.log('[LevelEditor] ✅ Notified parent - Main menu will update')
    }
}
```

5. **Updated `deleteLevel` to use localStorage:**
```typescript
const deleteLevel = async (levelId: string) => {
    if (!confirm('Are you sure you want to delete this level?')) return

    // Try API delete
    await fetch(`/api/levels/${levelId}`, { method: 'DELETE' })

    // ALWAYS update localStorage
    const updated = customLevels.filter(l => l.id !== levelId)
    localStorage.setItem('customLevels', JSON.stringify(updated))

    // Reload from storage
    const reloaded = await loadCustomLevelsFromStorage()
    setCustomLevels(reloaded)

    if (onLevelsChanged) onLevelsChanged()

    if (selectedLevelId === levelId) {
        setSelectedLevelId(null)
        setEditingLevel(null)
    }
}
```

## Testing

### Before Fix:
1. Create and save a custom level
2. Restart dev server (`npm run dev`)
3. Open Level Editor → Levels tab
4. ❌ Shows 0 custom levels (only default worlds visible)

### After Fix:
1. Create and save a custom level
2. Restart dev server (`npm run dev`)
3. Open Level Editor → Levels tab
4. ✅ Shows custom level (loaded from localStorage)
5. Console log: `[Storage] Using localStorage levels (API was empty)`

## Expected Console Logs

### On Initial Load:
```
[Storage] Loaded 0 levels from API
[Storage] Loaded 1 levels from localStorage
[Storage] Using localStorage levels (API was empty)
[LevelEditor] Loaded 1 custom levels
```

### After Saving:
```
[LevelEditor] Saving level: custom_1234567 My Level
[Storage] Saved level custom_1234567 to API
[Storage] Saved level custom_1234567 to localStorage (backup)
[LevelEditor] ✅ Editor list updated with 1 levels
[LevelEditor] ✅ Notified parent - Main menu will update
[GameEngine] Updated cache with 1 custom level(s): My Level (custom_1234567)
[MainMenu] Displaying 2 default + 1 custom = 3 total worlds
```

## Status
✅ FIXED - Custom levels now persist across server restarts and appear in both:
- Level Editor → Levels tab
- Main Menu level selection

The fix ensures localStorage is always used as a reliable fallback when the in-memory API storage is empty (which happens after every server restart during development).
