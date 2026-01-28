# Passive Event Listener Fix

**Date**: 2026-01-26
**Component**: VisualLevelEditor.tsx
**Issue**: "Unable to preventDefault inside passive event listener invocation" warning

---

## Problem

The Visual Level Editor was showing a console warning:
```
Unable to preventDefault inside passive event listener invocation.
```

This occurred at line 484 when calling `e.preventDefault()` in the wheel event handler.

### Root Cause

Modern browsers automatically register wheel event listeners as **passive** for performance optimization (to allow smooth scrolling). React's `onWheel` synthetic event uses the browser's passive listener, which means `preventDefault()` has no effect and triggers a warning.

---

## Solution

Replaced React's synthetic event handler with a native event listener using `{ passive: false }`:

### Changes Made

1. **Added `overlayRef`** to track the interactive overlay div
2. **Created native wheel event listener** with `{ passive: false }` option
3. **Removed React's `onWheel` prop** from JSX
4. **Removed old `handleWheel` function**

### Implementation

```typescript
// Added ref
const overlayRef = useRef<HTMLDivElement>(null)

// Native wheel event listener with { passive: false }
useEffect(() => {
    if (!isVisible || !overlayRef.current) return

    const handleNativeWheel = (e: WheelEvent) => {
        e.preventDefault() // Now works correctly!
        setCameraZoom(prev => Math.max(0.01, Math.min(10, prev * (e.deltaY > 0 ? 0.9 : 1.1))))
    }

    const overlay = overlayRef.current
    overlay.addEventListener('wheel', handleNativeWheel, { passive: false })

    return () => {
        overlay.removeEventListener('wheel', handleNativeWheel)
    }
}, [isVisible])
```

```tsx
{/* JSX: Added ref, removed onWheel */}
<div
    ref={overlayRef}
    className="absolute inset-0"
    style={{ pointerEvents: 'auto', zIndex: 1, background: 'transparent' }}
    onMouseDown={handleMouseDown}
    onMouseMove={handleMouseMove}
    onMouseUp={handleMouseUp}
    onMouseLeave={handleMouseLeave}
/>
```

---

## Result

✅ No more console warnings
✅ Zoom functionality works perfectly
✅ Page scroll is prevented during zoom
✅ TypeScript compilation passes (no errors in VisualLevelEditor.tsx)

---

## Technical Details

**Why `{ passive: false }` matters**:
- Passive listeners improve scroll performance by not blocking the main thread
- But they disable `preventDefault()` for safety
- Explicitly setting `passive: false` tells the browser "I need preventDefault()"
- This is necessary when we want to prevent scroll during zoom

**Browser Behavior**:
- Chrome/Edge: Default wheel listeners are passive
- Firefox: Default wheel listeners are passive
- Safari: Default wheel listeners are passive
- All modern browsers support `{ passive: false }` option

---

## Files Modified

- `components/game/debug/VisualLevelEditor.tsx`
  - Added `overlayRef` (line 33)
  - Added native wheel event listener (lines 463-476)
  - Removed React `handleWheel` function
  - Updated JSX overlay div to use ref

---

**Status**: ✅ FIXED
