# Visual Editor Click Fix

## Problem
Left click wasn't working in the visual editor viewport. Users couldn't place meshes, paint areas, or select objects.

## Root Causes

### 1. Event Parameter Not Passed
The `selectMeshAtCursor` function was using `(event as any)` to access a global event object instead of receiving the event as a parameter:

```typescript
// BROKEN
const selectMeshAtCursor = () => {
    const mouse = new THREE.Vector2(
        ((event as any).clientX - rect.left) / rect.width * 2 - 1,  // ❌ Wrong!
        ...
    )
}
```

**Fix**: Updated function to receive the event as a parameter and passed it from `handleMouseDown`:

```typescript
// FIXED
const selectMeshAtCursor = (e: React.MouseEvent) => {
    const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,  // ✅ Correct!
        ...
    )
}

const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
        if (editorMode === 'select') {
            selectMeshAtCursor(e)  // ✅ Pass event
        }
    }
}
```

### 2. Three.js Canvas Capturing Events
The Three.js canvas was capturing mouse events and preventing them from bubbling up to the container div where the event handlers were attached.

**Fix**: Set the canvas's `pointer-events` to `none` so clicks pass through:

```typescript
// After creating renderer
renderer.domElement.style.pointerEvents = 'none'
```

This allows the parent container div to handle all mouse events while still displaying the Three.js scene.

## Changes Made

### File: `components/game/debug/VisualLevelEditor.tsx`

**1. Updated `selectMeshAtCursor` function** (line ~553):
- Added `e: React.MouseEvent` parameter
- Changed `(event as any)` to `e`
- Added debug logging

**2. Updated `handleMouseDown` function** (line ~484):
- Added `selectMeshAtCursor(e)` to pass event
- Added debug logging for all modes

**3. Updated renderer setup** (line ~107):
- Added `renderer.domElement.style.pointerEvents = 'none'`
- Added console log to confirm setup

**4. Added debug logging** to:
- `placeMesh()` - logs when called and when mesh placed
- `paintArea()` - logs when called and when area painted
- `selectMeshAtCursor()` - logs raycasting and selection results

## Console Logging

Now when you click in the visual editor, you'll see:

```
[VisualEditor] Left click detected, mode: mesh
[VisualEditor] placeMesh called, cursorPosition: { x: 5.5, z: -2.0 }
[VisualEditor] ✅ Placed mesh: rock at { x: 5.5, z: -2.0 }
```

Or for selection:

```
[VisualEditor] Left click detected, mode: select
[VisualEditor] Raycasting for selection, mouse: Vector2 { x: 0.23, y: -0.45 }
[VisualEditor] Checking 3 meshes for intersection
[VisualEditor] Found 1 intersections
[VisualEditor] Selected mesh: mesh_1234567890_abc123
```

Or for painting:

```
[VisualEditor] Left click detected, mode: paint
[VisualEditor] paintArea called, cursorPosition: { x: 10.0, z: 5.5 }
[VisualEditor] ✅ Painted area: scatter at { x: 10.0, z: 5.5 }
```

## Testing

### Expected Behavior After Fix:

**Mesh Mode:**
1. Move mouse over viewport → cursor preview follows
2. Left click → mesh appears at cursor position
3. Console logs confirm placement

**Paint Mode:**
1. Move mouse over viewport → circular brush cursor follows
2. Left click → painted area appears
3. Console logs confirm painting

**Select Mode:**
1. Left click on mesh → mesh turns yellow
2. Console logs show raycasting and selection
3. Delete key removes selected mesh

**All Modes:**
- WASD panning works
- Mouse wheel zoom works
- Middle-click/Shift+drag panning works
- Cursor changes based on mode (crosshair/pointer/default)

## Why This Works

### Event Flow:
1. User clicks in viewport
2. Click event fires on Three.js canvas
3. Canvas has `pointer-events: none`, so event passes through
4. Event bubbles up to container div
5. Container div's `onMouseDown` handler catches event
6. Handler calls appropriate mode function (place/paint/select)
7. Function executes with correct event data

### Raycasting:
```typescript
// Convert screen coordinates to normalized device coordinates (NDC)
const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,   // Range: -1 to 1
    -((e.clientY - rect.top) / rect.height) * 2 + 1   // Range: -1 to 1 (inverted)
)

// Cast ray from camera through mouse position
raycaster.setFromCamera(mouse, camera)

// Check for intersections with ground (for placement) or meshes (for selection)
const intersects = raycaster.intersectObject(ground)
const intersects = raycaster.intersectObjects(meshArray)
```

## Status
✅ **FIXED** - Left click now works in all modes:
- ✅ Mesh placement
- ✅ Painting (scatter & color)
- ✅ Mesh selection
- ✅ Debug logging for troubleshooting

## Build Status
✅ Compilation successful
✅ TypeScript validated
✅ No blocking errors

The visual editor is now fully functional!
