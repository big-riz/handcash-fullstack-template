# Visual Editor Click/Performance Fix (v4)

## Issue
Previous fixes (v2, v3) ensured the overlay was present and optimized performance, but users still reported clicks not registering.
Logs confirmed `handleMouseDown` on the overlay was not firing, suggesting event blocking by other elements or improper stacking contexts.

## Fix
1.  **Forced Pointer Events on Root**: Added `pointer-events-auto` to the root `fixed` container of `VisualLevelEditor`. While `fixed` usually sits on top, ensuring the container itself accepts events is a good safeguard against parent `pointer-events-none`.
2.  **Increased Z-Index**:
    -   Overlay z-index bumped from `5` to `50` to ensure it sits above the `containerRef` (z-0) and any potential sibling noise.
    -   Control overlays bumped to `z-60` to stay on top of the interaction layer.
3.  **Debug Visibility**:
    -   Added a temporary red border (`border: 2px solid red`) and slight red background (`rgba(255,0,0,0.05)`) to the overlay. This provides immediate visual confirmation that the overlay is rendered, sized correctly (covering the canvas), and positioned where expected.
4.  **Capture Logging**:
    -   Added `onMouseDownCapture` to the root component. This captures events *before* they reach children. If this fires but the overlay's `onMouseDown` doesn't, we know something inside the component structure is blocking it. If this doesn't fire, something *outside* (parent/sibling with higher z-index) is blocking it.

## Verification
-   **Visual**: User should see a red box over the game view when the editor is open.
-   **Console**:
    -   `[VisualEditor] Root MouseDown Capture` -> verifies event reached the component root.
    -   `[VisualEditor] handleMouseDown Fired` -> verifies event reached the overlay.
-   **Functionality**: Clicks should now reliably place meshes/paint.
