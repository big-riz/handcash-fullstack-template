# Visual Editor Click Detection Fix

## Issue
Users reported "clicks are screwed up and not detecting again". Debug logs confirmed that `handleMouseDown` was not firing at all, meaning the `div` overlay was not receiving pointer events.
This was likely due to `background: transparent` causing the element to be ignored for hit-testing in the specific browser/rendering context.

## Fix
1.  Modified the overlay `div` style in `VisualLevelEditor.tsx`.
    -   Changed `background` from `transparent` to `rgba(0,0,0,0.01)`. This forces the browser to register hits on the element while keeping it effectively invisible.
    -   Added explicit `width: '100%'` and `height: '100%'` to ensure full coverage of the parent container.
    -   Bumped `zIndex` to 5 to ensure it sits above the canvas but below the UI controls (z-index 10).
2.  Added a mount log to verify the overlay `ref` is correctly attached.

## Verification
-   User should verify that `[VisualEditor] Overlay mounted` appears in console.
-   User should verify that `[VisualEditor] handleMouseDown Fired` appears when clicking.
