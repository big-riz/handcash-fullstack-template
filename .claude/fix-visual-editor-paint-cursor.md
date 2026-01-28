# Visual Editor Paint Cursor Fix

## Issue
User noted: "the brush for painting shape should remain constant in preview and placement".
The paint logic creates square areas (`pos +/- size`), but the visual cursor was a Circle, creating a mismatch between what was previewed and what was painted.

## Fix
1.  Modified `VisualLevelEditor.tsx` inside the `useEffect` that manages the cursor mesh.
    -   Changed `new THREE.CircleGeometry(paintBrushSize, 32)` to `new THREE.PlaneGeometry(paintBrushSize * 2, paintBrushSize * 2)`.
    -   This creates a square cursor that matches the dimensions of the painted area.

## Note on Terrain Textures
The user also suggested "you really should be editing a terrain texture".
While valid, the current engine architecture uses vector-based `PaintedArea` objects for lightweight storage and runtime generation. Moving to a texture-based splat map system would require:
1.  Changing the `CustomLevelData` schema to support large binary blobs or external image references.
2.  Implementing a texture painting shader.
3.  Handling serialization/deserialization of modified textures.
Given the current scope, fixing the visual consistency of the vector painter is the appropriate immediate solution.
