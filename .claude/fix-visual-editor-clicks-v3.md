# Visual Editor Click/Performance Fix (v3)

## Issue
Users reported issues with mouse clicks not registering in the Visual Level Editor.
Investigation revealed that `handleMouseMove` was triggering a state update (`setCursorPosition`) on *every* mouse movement pixel, creating a new object `{x, z}` even if the grid-snapped position hadn't changed.
This caused the entire `VisualLevelEditor` component (and the Three.js scene overlay) to re-render on every mouse event, likely starving the main thread and causing input events (like `mousedown`) to be dropped or delayed.

## Fix
1.  **Optimized `handleMouseMove`**:
    -   Implemented a check inside `setCursorPosition` updater.
    -   If the calculated grid position (`x`, `z`) matches the previous state, we return the `prev` state object reference.
    -   This allows React to bail out of the re-render process entirely when the cursor hasn't moved to a new grid cell.

2.  **Enhanced Logging**:
    -   Added detailed logs to `handleMouseDown` to verify button state, shift key, and editor mode.
    -   Added logs to `placeMesh` and `paintArea` to confirm actions are taken.

3.  **Code Structure**:
    -   Refactored mouse handlers to be more robust against missing refs.

## Verification
-   Mouse movement should feel smoother.
-   Clicks should register reliably.
-   Console should show `[VisualEditor] handleMouseDown Fired` when clicking.
