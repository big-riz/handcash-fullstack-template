# Procedural Mesh Testing Guide

## Quick Test: Browser Inspection

1. Open game at `http://localhost:3000`
2. Click "Play" or navigate to `/play`
3. Select any character

### Dark Forest Test
1. Click "Dark Forest" world
2. Game should load with:
   - **Dense forest atmosphere** with ~250 obstacles
   - **Primary meshes**: Trees (majority), Rocks (scattered)
   - **Secondary meshes**: Dead trees, small shrubs (no collision)
   - **Props**: Barrels, crates scattered throughout
   - **Visual**: Dark green leaves and brown tree trunks
3. **Collision test**: Try moving player into trees/rocks - should be blocked
4. **Decorative test**: Walk into shrubs - should pass through freely
5. **Consistency test**: Restart level (game over → replay) → mesh layout identical

### Frozen Waste Test
1. Click "Frozen Waste" world
2. Game should load with:
   - **Arctic atmosphere** with ~200 obstacles (sparser than forest)
   - **Primary meshes**: Glowing cyan crystals (majority), icy rocks
   - **Secondary meshes**: Dead trees, rare shrubs
   - **Props**: Barrels, crates for cover
   - **Visual**: Bright cyan/blue landscape, shimmering crystals
   - **Lighting**: Emissive crystals glow naturally
3. **Collision test**: Try moving through crystals - should be blocked
4. **Aesthetics**: Crystals should emit light (0x00ffff emissive)
5. **Consistency test**: Restart multiple times → identical layout

### Catacombs Test
1. Click "Underground Catacombs" world
2. Game should load with:
   - **Underground atmosphere** with ~180 obstacles
   - **Primary meshes**: Stone pillars (majority), broken pillars
   - **Secondary meshes**: Ancient statues, rocks
   - **Props**: Barrels, crates, decorative brick piles (no collision)
   - **Visual**: Dark gray/brown stone, no vegetation
   - **Lighting**: Darker overall, shadowy environment
3. **Collision test**: Pillars/statues block movement
4. **Decorative test**: Brick piles (ruins_brick) allow passage
5. **Ambiance**: Should feel dungeon-like and ominous

## Console Logging

Open browser DevTools (F12) and check Console tab while playing:

**Expected logs:**
```
[ProceduralMesh] dark_forest: Placed 250/250 meshes
[ProceduralMesh] Attempts: 743, Collisions: 165
[ProceduralMesh] Distribution: { tree: 87, rock: 37, tree_dead: 25, barrel: 12, crate: 7, shrub: 5 }

[ProceduralMesh] frozen_waste: Placed 200/200 meshes
[ProceduralMesh] Attempts: 591, Collisions: 120
[ProceduralMesh] Distribution: { crystal: 60, rock: 20, tree_dead: 24, barrel: 16, crate: 14, shrub: 6 }

[ProceduralMesh] catacombs: Placed 180/180 meshes
[ProceduralMesh] Attempts: 523, Collisions: 105
[ProceduralMesh] Distribution: { pillar: 63, pillar_broken: 36, statue: 18, rock: 21, barrel: 16, crate: 10, ruins_brick: 14 }
```

The "Attempts" number will vary but should be reasonable (target count × 5 max attempts).

## Performance Monitoring

### Frame Rate Test
1. Open DevTools Performance tab
2. Start game on Dark Forest
3. Record for 10 seconds of gameplay
4. Check FPS - should maintain 60 FPS consistently

### Mesh Count Verification
In DevTools Console, run:
```javascript
// Count all Three.js meshes in scene
console.log(scene.children.filter(c => c.type === 'Group').length)
// Should show ~250+ for dark_forest, ~200 for frozen_waste, ~180 for catacombs
```

## Determinism Verification

**Same seed = Same layout** test:

1. Start Dark Forest, take note of tree positions
2. Play for 10 seconds, die
3. Game ends, click "Replay"
4. Watch replay - meshes should be in EXACT same positions as original run
5. Restart game, select Dark Forest again
6. First meshes you see should be in same positions as step 1

The determinism is automatic - `SeededRandom` uses world ID as seed.

## Collision Accuracy Test

1. Position player next to a tree/pillar/crystal
2. Try to walk into it - should stop at collision radius edge
3. Try to walk around it - should succeed
4. Verify shrubs/ruins_brick:
   - Walk directly into them - should pass through freely
   - No collision blocking expected

## Visual Theme Verification

| World | Expected Colors | Lighting | Mood |
|-------|-----------------|----------|------|
| Dark Forest | Dark greens (0x1b5e20), browns (0x3e2723), gray rocks (0x888888) | Ambient shadows | Mysterious ancient woods |
| Frozen Waste | Bright cyan (0xa5f3fc), blue sky (0x88aabb), light ground (0xddeeff) | Cyan emissive crystals | Harsh arctic wasteland |
| Catacombs | Gray stone (0x888888), red bricks (0x7b1f1f), dark sky (0x0a0a15) | Very dark, shadowy | Eerie underground tombs |

## Troubleshooting

### No meshes visible
- Check browser console for errors
- Verify `generateProceduralMeshes` is being called (should see logs)
- Check that THREE.js imports are available

### Meshes too dense/sparse
- Adjust `totalMeshCount` in `proceduralMeshConfigs.ts`
- Adjust `minSpacing` to spread them further apart
- Adjust `maxRadius` to change spawn area size

### Meshes clipping through player
- Increase `minDistanceFromSpawn` (default 10-12 units)
- Adjust `collisionRadius` multiplier in collision validation

### Performance issues (low FPS)
- Reduce `totalMeshCount` in config
- Increase `minSpacing` to use fewer meshes
- Check Three.js memory usage in DevTools

### Meshes not blocking movement
- Verify `hasCollision: true` in spawn rules
- Check that collision data is being returned from `generateProceduralMeshes`
- Ensure SpawnSystem is using `currentObstacles` array

## File Locations for Quick Reference

- Config: `components/game/data/proceduralMeshConfigs.ts`
- Generator: `components/game/utils/proceduralMeshGenerator.ts`
- Usage: `components/game/hooks/useGameEngine.ts` lines 570-571
- Mesh types: `components/game/utils/meshUtils.ts`
- World data: `components/game/data/worlds.ts`

## Expected Mesh Counts

**Dark Forest (250 total):**
- ~87 trees (35%)
- ~37 rocks (15%)
- ~25 dead trees (10%)
- ~12 barrels (5%)
- ~7 crates (3%)
- ~5 shrubs (5%, NO collision)

**Frozen Waste (200 total):**
- ~60 crystals (30%)
- ~20 rocks (10%)
- ~24 dead trees (12%)
- ~16 barrels (8%)
- ~14 crates (7%)
- ~6 shrubs (3%, NO collision)

**Catacombs (180 total):**
- ~63 pillars (35%)
- ~36 broken pillars (20%)
- ~18 statues (10%)
- ~21 rocks (12%)
- ~16 barrels (9%)
- ~10 crates (6%)
- ~14 ruins bricks (8%, NO collision)

Note: Actual counts vary by ±5% due to random placement and collision rejection.
