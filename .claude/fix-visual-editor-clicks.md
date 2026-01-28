# Visual Level Editor Click Fix

## Issue
The Visual Level Editor had unreliable mesh placement and painting interactions. The code contained multiple conflicting event handling mechanisms:
1. A `useEffect` hook adding native `mousedown` event listeners to the overlay element.
2. An `onClick` prop on the overlay element with inline logic.
3. A `handleMouseDown` function defined in the component but not used by the overlay.

This complexity likely led to race conditions, double-firing of events, or stale closures, causing clicks to be ignored or behave unpredictably.

## Fix
1. Removed the `useEffect` block that manually attached native event listeners.
2. Removed the `onClick` prop and its inline logic from the overlay `div`.
3. Wired up the React `onMouseDown`, `onMouseMove`, `onMouseUp`, and `onMouseLeave` props of the overlay `div` to the existing (but previously unused) handler functions (`handleMouseDown`, etc.).
4. Added `onContextMenu={(e) => e.preventDefault()}` to prevent the context menu from interfering with right-click panning (if implemented later) or just generally cleaning up the UX.

## Result
- Mesh placement and painting should now work reliably on left-click.
- Panning (middle click or shift+click) logic remains preserved.
- Code is significantly cleaner and easier to maintain.
