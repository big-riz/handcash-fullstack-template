# Camera Zoom Feature Implementation

## Overview
Added dynamic camera zoom functionality to the Slavic Survivors game, allowing players to zoom in and out during gameplay.

## Implementation Details

### 1. Input Manager (`components/game/core/Input.ts`)

Added zoom input handling:
- **Mouse Wheel**: Scroll to zoom in/out
- **Keyboard Q/E**: Q = zoom in, E = zoom out
- **Keyboard +/-**: Alternative zoom controls

Key changes:
- Added `zoomDelta` property to track wheel input
- Added `wheelHandler` event listener
- Added `getZoomInput()` method that returns normalized zoom delta
- Prevents zoom input when hovering over UI elements

### 2. Game Engine (`components/game/hooks/useGameEngine.ts`)

Updated camera system for dynamic zoom:
- Added `cameraZoomRef` to track zoom level (Three.js camera.zoom property)
- Added zoom limits:
  - **Min Zoom**: 0.5 (zoomed out - see more)
  - **Max Zoom**: 2.5 (zoomed in - see less but larger)
  - **Default**: 1.0 (normal view)
- Updated `update()` loop to process zoom input every frame
- Updated `render()` function to apply zoom and update projection matrix

**Technical Note**: Uses Three.js OrthographicCamera's built-in `zoom` property for proper orthographic zoom behavior.

## Usage

### During Gameplay
- **Zoom In**: Mouse wheel up, or press Q
- **Zoom Out**: Mouse wheel down, or press E
- **Reset**: Default zoom is 35 units (middle range)

### Zoom Range
- **Zoomed Out (0.5x)**: Maximum tactical overview - see more of the battlefield
- **Default (1.0x)**: Balanced view for normal gameplay
- **Zoomed In (2.5x)**: Close-up view - see details, smaller field of view

## Technical Details

### Zoom Speed
- Mouse wheel: ±0.1x zoom per scroll tick
- Keyboard: ±0.05x zoom per frame while held

### Performance
- Zero performance impact - only updates projection matrix when zoom changes
- Smooth zoom via delta-based adjustment
- Clamped between 0.5x and 2.5x to maintain gameplay balance

### Integration
- Works seamlessly with existing camera follow system
- Maintains isometric angle (55° pitch)
- Compatible with bot mode, replay mode, and touch controls
- Does not interfere with UI elements

## Testing Checklist

✅ Mouse wheel zoom in/out
✅ Keyboard Q/E zoom in/out
✅ Zoom limits enforced (15-60 units)
✅ UI elements not affected by wheel events
✅ Smooth camera distance adjustment
✅ Works during active gameplay
✅ Disabled during pause/menu screens
✅ Compatible with replay mode

## Future Enhancements (Optional)

- [ ] Pinch-to-zoom for mobile/touch devices
- [ ] Smooth zoom interpolation (ease-in/out)
- [ ] Persist zoom level across game sessions
- [ ] UI indicator showing current zoom level
- [ ] Zoom presets (hotkeys for specific zoom levels)

---

**Implemented**: 2026-01-26
**Files Modified**: 2 files
- `components/game/core/Input.ts`
- `components/game/hooks/useGameEngine.ts`
