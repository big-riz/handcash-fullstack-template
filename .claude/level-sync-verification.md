# Level Sync Verification

## ✅ Complete Save Flow

When you save a level in the editor, here's what happens now:

### 1. LevelEditor.saveCustomLevel()
```javascript
// Save to API
POST /api/levels/save

// Save to localStorage (backup)
localStorage.setItem('customLevels', JSON.stringify(updated))

// Update editor's own list
const reloaded = await loadCustomLevels()
setCustomLevels(reloaded)  // ✅ Editor list updates

// Notify parent
onLevelsChanged()  // ✅ Main menu updates
```

### 2. Parent (SlavicSurvivors) via onLevelsChanged
```javascript
// Reload from storage
const levels = await loadCustomLevels()

// Update parent's state
setCustomLevels(levels)  // ✅ MainMenu receives new prop

// Update game engine cache
updateCustomLevelsCache(levels)  // ✅ Game can load custom level
```

### 3. MainMenu Component
```javascript
// Receives customLevels as prop
customLevels={customLevels}  // ✅ From parent

// Combines with default worlds
const allWorlds = [...WORLDS, ...customLevels]  // ✅ Shows all levels

// Displays with purple border for custom
{allWorlds.map(world => ...)}
```

### 4. LevelEditor's Levels Tab
```javascript
// Shows both types
levels={[...WORLDS, ...customLevels]}  // ✅ All levels visible

// Separates into sections:
// - Default Worlds
// - Custom Levels

// Custom levels have Delete/Export buttons
// Default worlds have Duplicate button only
```

## Console Logs You Should See

### When Saving:
```javascript
[LevelEditor] Saving level: custom_123456789 My Level
[LevelEditor] ✅ Saved to API
[LevelEditor] ✅ Saved to localStorage
[Storage] Saved level custom_123456789 to API
[Storage] Saved level custom_123456789 to localStorage (backup)
[LevelEditor] ✅ Editor list updated
[LevelEditor] ✅ Notified parent - Main menu will update
[GameEngine] Updated cache with 1 custom level(s): My Level (custom_123456789)
```

### When Main Menu Displays:
```javascript
[MainMenu] Displaying 2 default + 1 custom = 3 total worlds
```

## Testing Checklist

### Test 1: Create and See in Editor
1. Click "Create Level" in main menu
2. Editor opens with "Levels" tab
3. ✅ Should see: "Default Worlds" (Dark Forest, Frozen Waste)
4. ✅ Should see: "Custom Levels" (empty initially)
5. Configure level (name, timeline, etc.)
6. Click "Save" button
7. ✅ Should see console logs confirming save
8. ✅ Should see your level appear in "Custom Levels" section
9. ✅ Still on editor screen, not kicked out

### Test 2: See in Main Menu
1. Close editor (X button)
2. Return to main menu
3. ✅ Should see: Dark Forest
4. ✅ Should see: Frozen Waste
5. ✅ Should see: Your custom level (purple border, wrench icon)
6. ✅ Console: `[MainMenu] Displaying 2 default + 1 custom = 3 total worlds`

### Test 3: localStorage Persistence
1. Press F12 → Application → Local Storage → localhost:3000
2. ✅ Should see: `customLevels` key with JSON array
3. Restart dev server
4. Refresh page
5. Open editor
6. ✅ Should see: Your custom level still in "Custom Levels"
7. ✅ Console: `[Storage] Loaded 0 levels from API` (API empty after restart)
8. ✅ Console: `[Storage] Loaded 1 levels from localStorage`
9. ✅ Console: `[Storage] Using localStorage levels (API was empty)`

### Test 4: Edit Existing Level
1. Open editor
2. Go to "Levels" tab
3. Click on your custom level
4. ✅ Should see: Level loads into editor
5. Make changes (e.g., change name)
6. Click "Save"
7. ✅ Should see: Updated name in "Custom Levels" list
8. Close editor
9. ✅ Should see: Updated name in main menu

### Test 5: Duplicate Default World
1. Open editor
2. Go to "Levels" tab
3. Find "Dark Forest" in "Default Worlds"
4. Click "Duplicate" button
5. ✅ Should see: New custom level created with Dark Forest settings
6. ✅ Should appear in "Custom Levels" section
7. Edit the duplicate (change name to "Dark Forest Copy")
8. Click "Save"
9. Close editor
10. ✅ Should see: "Dark Forest Copy" in main menu with purple border

## Level Counts

### Editor - Levels Tab:
- **Default Worlds**: 2 (Dark Forest, Frozen Waste)
- **Custom Levels**: 0-N (your created/duplicated levels)
- **Total visible**: 2 + N

### Main Menu:
- **Default Worlds**: 2 (white border)
- **Custom Levels**: N (purple border + wrench icon)
- **Create Level Button**: 1 (dashed purple border)
- **Total visible**: 2 + N + 1

### Verification:
If Editor shows 2+3 = 5 levels,
Main Menu should show 2+3 = 5 + 1 button = 6 cards total

## What's Synced

### ✅ Synced Between Editor and Main Menu:
- Custom level count
- Custom level names
- Custom level settings
- Timeline events
- Theme colors

### ✅ Synced Between Sessions (localStorage):
- All custom levels
- Survives page refresh
- Survives browser restart
- Survives dev server restart

### ✅ Synced to Game Engine:
- Level data (theme, settings, timeline)
- Background spawning setting
- Available enemies
- Win conditions

## Common Issues

### Issue: "Custom level doesn't appear in editor after save"
**Expected Logs**: `[LevelEditor] ✅ Editor list updated`
**Missing**: Editor's `setCustomLevels()` not called
**Status**: ✅ FIXED - Now calls `setCustomLevels(reloaded)` after save

### Issue: "Custom level doesn't appear in main menu"
**Expected Logs**: `[LevelEditor] ✅ Notified parent - Main menu will update`
**Missing**: Parent's `onLevelsChanged` not called
**Status**: ✅ FIXED - Callback is called after save

### Issue: "Levels lost after server restart"
**Expected Logs**: `[Storage] Using localStorage levels (API was empty)`
**Missing**: localStorage not being used as fallback
**Status**: ✅ FIXED - Always saves to localStorage, loads from it if API empty

### Issue: "Main menu not updating"
**Expected Logs**: `[MainMenu] Displaying X default + Y custom = Z total worlds`
**Missing**: MainMenu not receiving updated customLevels prop
**Status**: ✅ FIXED - Parent updates state, MainMenu receives as prop

## Status

🎉 **ALL SYSTEMS INTEGRATED**

- ✅ Editor saves to API + localStorage
- ✅ Editor updates its own list after save
- ✅ Editor notifies parent after save
- ✅ Parent updates state
- ✅ Main menu receives updated prop
- ✅ Main menu displays all levels
- ✅ Game engine can load custom levels
- ✅ localStorage persists across restarts
- ✅ Console logging confirms each step
