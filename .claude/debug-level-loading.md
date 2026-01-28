# Debug: Level Loading Flow

## Added Debug Logging

I've added extensive console logging to trace the entire flow of custom level loading:

### 1. When Levels Are Loaded/Updated

**Location**: `SlavicSurvivors.tsx` → `onLevelsChanged` callback

**Logs**:
```javascript
[LevelEditor] Levels changed, reloading...
[LevelEditor] Reloaded X custom levels
```

### 2. When Cache Is Updated

**Location**: `useGameEngine.ts` → `updateCustomLevelsCache()`

**Logs**:
```javascript
[GameEngine] Updated custom levels cache: X levels
[GameEngine] Cache contains level: { id, name, hasTimeline, timelineLength, disableBackgroundSpawning }
```

### 3. When Testing a Level

**Location**: `SlavicSurvivors.tsx` → `onTestLevel` callback

**Logs**:
```javascript
[LevelEditor] Testing level: { id, name, timeline, disableBackgroundSpawning }
[LevelEditor] Loaded levels for test: [{ id, name }, ...]
[LevelEditor] Setting selectedWorldId to: custom_xxxxx
```

### 4. When Game Engine Looks Up World

**Location**: `useGameEngine.ts` → `getWorldData()`

**Logs**:
```javascript
[GameEngine] getWorldData called with worldId: custom_xxxxx
[GameEngine] Custom levels cache contains X levels: [id1, id2, ...]
[GameEngine] Using custom level: custom_xxxxx { ...full level data... }
```
OR if not found:
```javascript
[GameEngine] World custom_xxxxx not found in defaults or cache (X custom levels), using default
```

### 5. When SpawnSystem Receives World

**Location**: `SpawnSystem.ts` → `setWorld()`

**Logs**:
```javascript
[SpawnSystem] setWorld called with: {
  id: "custom_xxxxx",
  name: "My Custom Level",
  hasTimeline: true,
  timelineLength: 5,
  disableBackgroundSpawning: true
}
[SpawnSystem] Using custom timeline with 5 events: [...]
```

## How to Debug

### Step 1: Open Browser Console
1. Open the game at `http://localhost:3000/play`
2. Press F12 to open DevTools
3. Go to Console tab

### Step 2: Create and Test a Level
1. Click "Create Level" in main menu
2. Add some timeline events (Timeline tab)
3. Check "Timeline-Only Spawning" in Settings tab
4. Click "Save"
5. Click "Test"

### Step 3: Check Console Logs

You should see this flow:

```
[LevelEditor] Testing level: { id: "custom_1234567890", name: "...", timeline: [...], disableBackgroundSpawning: true }
[LevelEditor] Loaded levels for test: [{ id: "custom_1234567890", name: "..." }]
[LevelEditor] Setting selectedWorldId to: custom_1234567890
[GameEngine] Updated custom levels cache: 1 levels
[GameEngine] Cache contains level: { id: "custom_1234567890", name: "...", hasTimeline: true, timelineLength: 3, disableBackgroundSpawning: true }
[GameEngine] getWorldData called with worldId: custom_1234567890
[GameEngine] Custom levels cache contains 1 levels: ["custom_1234567890"]
[GameEngine] Using custom level: custom_1234567890 { ...full level object... }
[SpawnSystem] setWorld called with: { id: "custom_1234567890", name: "...", hasTimeline: true, timelineLength: 3, disableBackgroundSpawning: true }
[SpawnSystem] Using custom timeline with 3 events: [...]
```

## Common Issues to Check

### Issue 1: Cache is Empty
If you see:
```
[GameEngine] Custom levels cache contains 0 levels: []
```

**Problem**: Cache wasn't updated before game started
**Solution**: The `onTestLevel` callback should reload and update cache

### Issue 2: Level Not in Cache
If you see:
```
[GameEngine] Custom levels cache contains 1 levels: ["custom_OTHER"]
[GameEngine] World custom_1234567890 not found in defaults or cache
```

**Problem**: Wrong level ID or cache has different level
**Solution**: Check if the level was saved with a different ID

### Issue 3: Timeline is Empty
If you see:
```
[SpawnSystem] setWorld called with: { ..., timelineLength: 0, ... }
```

**Problem**: Level was saved with no timeline events
**Solution**: Add events in Timeline tab before testing

### Issue 4: Background Spawning Still Active
If you see:
```
[SpawnSystem] setWorld called with: { ..., disableBackgroundSpawning: false, ... }
```

**Problem**: Setting wasn't enabled or saved
**Solution**: Check "Timeline-Only Spawning" in Settings tab and save

### Issue 5: Default World Being Used
If you see:
```
[GameEngine] Found default world: dark_forest
```

**Problem**: selectedWorldId is "dark_forest" instead of custom level ID
**Solution**: Check if setSelectedWorldId was called with correct custom level ID

## What to Look For

### ✅ Good Flow:
1. Testing level logs show correct ID
2. Cache update shows 1+ levels
3. Cache contains the level ID you're testing
4. getWorldData finds the custom level
5. SpawnSystem receives custom level with timeline
6. Timeline events logged correctly

### ❌ Bad Flow:
1. Cache is empty when getWorldData is called
2. getWorldData can't find the custom level
3. Falls back to default world (dark_forest)
4. SpawnSystem gets default world data

## Next Steps

After you test a level, share the console logs and we can identify exactly where the flow breaks.
