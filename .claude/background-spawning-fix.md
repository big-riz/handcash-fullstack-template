# Background Spawning Control - Fix

## 🐛 Issue Reported

**User**: "why does it give enemies spawning even when none specified in level timeline"

## Problem

The SpawnSystem had **two independent spawning mechanisms**:

1. **Timeline-based spawning** - Executes events from the custom timeline
2. **Background spawning** - Continuous automatic spawning every 5 seconds

The background spawning was **always active**, spawning enemies even when the timeline was empty. This made it impossible to create levels with precise spawn control.

### Background Spawning Behavior

Located in `SpawnSystem.ts` lines 78-128:
- Spawns enemies every 5 seconds (decreasing over time to 0.8s)
- Count starts at 3 and grows exponentially (25% per minute)
- After 5 minutes, can spawn elites
- After 8-15 minutes, spawns tougher enemy types
- Designed for endless survival gameplay

This was fine for default worlds but problematic for custom levels that wanted **timeline-only control**.

## Solution

Added a new optional setting: `disableBackgroundSpawning`

### 1. Updated WorldData Interface

**File**: `components/game/data/worlds.ts`

```typescript
export interface WorldData {
    // ... existing fields ...
    disableBackgroundSpawning?: boolean // If true, only timeline events spawn enemies
}
```

### 2. Modified SpawnSystem

**File**: `components/game/systems/SpawnSystem.ts`

```typescript
// --- Background Spawning ---
// Skip background spawning if disabled for this world
if (this.currentWorld.disableBackgroundSpawning) {
    return // Only timeline events will spawn enemies
}

// ... rest of background spawning code ...
```

### 3. Updated LevelEditor

**File**: `components/game/debug/LevelEditor.tsx`

**New levels default to timeline-only:**
```typescript
const createNewLevel = () => {
    const newLevel: CustomLevelData = {
        // ... other fields ...
        disableBackgroundSpawning: true, // Custom levels default to timeline-only
        timeline: [],
        // ...
    }
}
```

**Added UI control in Settings tab:**
```tsx
<div className="flex items-center gap-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
    <input
        type="checkbox"
        id="disableBackgroundSpawning"
        checked={level.disableBackgroundSpawning ?? false}
        onChange={(e) => onUpdate({ ...level, disableBackgroundSpawning: e.target.checked })}
        className="w-4 h-4 accent-purple-500"
    />
    <label htmlFor="disableBackgroundSpawning" className="text-xs text-white/80 flex-1">
        <div className="font-bold">Timeline-Only Spawning</div>
        <div className="text-white/50 mt-0.5">
            Disable automatic background spawning. Only timeline events will spawn enemies.
            (Recommended for custom levels with precise spawn control)
        </div>
    </label>
</div>
```

## Behavior

### Default Worlds (Dark Forest, Frozen Waste)
- `disableBackgroundSpawning`: undefined (false)
- **Result**: Both timeline events AND background spawning active
- **Why**: Designed for endless survival with continuous pressure

### New Custom Levels
- `disableBackgroundSpawning`: true (default)
- **Result**: ONLY timeline events spawn enemies
- **Why**: Allows precise control over spawn timing and composition

### User Control
Users can toggle this setting in the Level Editor's Settings tab to choose:
- ✅ **Checked**: Timeline-only (precise control)
- ❌ **Unchecked**: Timeline + background (continuous pressure)

## Use Cases

### Timeline-Only Mode (disableBackgroundSpawning = true)
Perfect for:
- **Puzzle levels** - Specific challenges with exact enemy counts
- **Boss fights** - Single encounter with no adds
- **Wave-based** - Discrete waves with breaks between
- **Scripted encounters** - Cinematic sequences
- **Testing** - Controlled environment

Example timeline:
```typescript
[
  { time: 10, enemyType: 'drifter', count: 5, isElite: false },
  { time: 30, enemyType: 'bruiser', count: 1, isElite: true, message: "BOSS INCOMING!" },
  { time: 60, enemyType: 'drifter', count: 10, isElite: false }
]
```

Result: Exactly these spawns, nothing else.

### Timeline + Background Mode (disableBackgroundSpawning = false)
Perfect for:
- **Endless survival** - Continuous challenge
- **Horde mode** - Overwhelming numbers
- **Resource farming** - Constant enemy flow
- **Default gameplay** - Classic bullet heaven experience

Example timeline:
```typescript
[
  { time: 60, enemyType: 'hulk', count: 3, isElite: true, message: "ELITE SQUAD!" }
]
```

Result: Special timeline events PLUS continuous background spawning.

## Testing

### Test 1: Empty Timeline with Flag
```typescript
{
  disableBackgroundSpawning: true,
  timeline: []
}
```
**Expected**: No enemies spawn ✅
**Actual**: No enemies spawn ✅

### Test 2: Empty Timeline without Flag
```typescript
{
  disableBackgroundSpawning: false, // or undefined
  timeline: []
}
```
**Expected**: Background enemies spawn every 5s ✅
**Actual**: Background enemies spawn every 5s ✅

### Test 3: Timeline Events with Flag
```typescript
{
  disableBackgroundSpawning: true,
  timeline: [
    { time: 10, enemyType: 'drifter', count: 3 }
  ]
}
```
**Expected**: ONLY the 3 drifters at 10s ✅
**Actual**: ONLY the 3 drifters at 10s ✅

### Test 4: Timeline Events without Flag
```typescript
{
  disableBackgroundSpawning: false,
  timeline: [
    { time: 10, enemyType: 'drifter', count: 3 }
  ]
}
```
**Expected**: 3 drifters at 10s + background spawning ✅
**Actual**: 3 drifters at 10s + background spawning ✅

## Files Modified

1. `components/game/data/worlds.ts` - Added interface field
2. `components/game/systems/SpawnSystem.ts` - Added check to skip background spawning
3. `components/game/debug/LevelEditor.tsx` - Added UI control and default value

## Backwards Compatibility

✅ **Fully backwards compatible**

- Existing default worlds: `disableBackgroundSpawning` is undefined → treated as false → no change
- Existing custom levels: `disableBackgroundSpawning` is undefined → treated as false → background spawning stays on
- New custom levels: `disableBackgroundSpawning` defaults to true → timeline-only

Users with existing custom levels that want timeline-only control just need to:
1. Open level in editor
2. Go to Settings tab
3. Check "Timeline-Only Spawning"
4. Save

## Console Logging

When background spawning is disabled, you'll see in console:
```
[SpawnSystem] Using custom timeline with X events
```

When background spawning is active (after 10 minutes), you'll see:
```
[SPAWN] Level 10: 15 enemies every 1.23s (Elite: false)
[SPAWN] Level 11: 17 enemies every 1.15s (Elite: true)
```

## Conclusion

Custom levels can now have **precise spawn control**:
- ✅ Empty timelines work (no unwanted spawns)
- ✅ Timeline-only mode available
- ✅ Background spawning optional
- ✅ User-controllable via Settings tab
- ✅ Backwards compatible
- ✅ Default to timeline-only for new levels

**Status**: 🎉 **FIXED**
