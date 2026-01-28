# Visual Editor Enhancements: Custom Meshes & Texture Painting

## Custom Mesh Imports
-   **Data Structure:** Updated `CustomLevelData` to include `customMeshDefinitions` (id, name, url, scale).
-   **UI:** Added "Import Mesh (GLB)" section to the Mesh Mode panel.
-   **Rendering:** Updated `VisualLevelEditor` to load GLTF models from URLs using `GLTFLoader`. Models are cached in memory to prevent re-fetching during editing.
-   **Fallback:** If a model fails to load, a red placeholder box is displayed.

## Terrain Texture Painting
-   **Concept:** Moved from creating individual mesh objects for painted areas to a single blended texture approach for the ground.
-   **Implementation:**
    -   Uses an in-memory HTML `<canvas>` (2048x2048) to generate the ground texture.
    -   Base color is filled first.
    -   Painted areas (type: 'color') are drawn as polygons onto this canvas.
    -   A `THREE.CanvasTexture` is created from the canvas and applied to the ground mesh's material map.
-   **Benefits:**
    -   **Performance:** Hundreds of painted areas result in a single texture draw call rather than hundreds of overlapping transparent planes (reducing overdraw and z-fighting).
    -   **Visuals:** Allows for smoother blending and composite terrain looks (future extensibility for actual texture splatting).

## Usage
1.  **Import Mesh:** In "Meshes" tab, enter a name and a URL (e.g., to a .glb file in `public/` or external). Click "Add to Library". The mesh appears in the dropdown.
2.  **Paint:** In "Paint" tab, select "Color", pick a color, and paint on the ground. The texture updates in real-time.
