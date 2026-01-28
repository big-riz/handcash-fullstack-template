# Draw Call Optimization Guide

## Problem Identified

**Current State:** 400+ draw calls after a few seconds of gameplay

**Root Cause Analysis:**

Each enemy creates **3 separate meshes**:
1. Body mesh (sphere/capsule) - 1 draw call
2. Health bar background - 1 draw call
3. Health bar fill - 1 draw call

**Math:**
- 100 enemies × 3 meshes = **300 draw calls**
- Plus projectiles, particles, XP gems, environment
- **Total: 400+ draw calls**

**Target:** <100 draw calls for 60 FPS

## Immediate Quick Fixes

### Fix 1: Hide Health Bars by Default (QUICKEST)

Only show health bars when enemy is damaged.

**Location:** `components/game/entities/Enemy.ts`

**In `update()` method, add:**
```typescript
// Only show health bar when damaged
const isDamaged = this.stats.currentHp < this.stats.maxHp
if (this.healthBarBg) this.healthBarBg.visible = isDamaged && this.isActive
if (this.healthBarFill) this.healthBarFill.visible = isDamaged && this.isActive
```

**Expected Impact:** Reduces draw calls by ~66% for undamaged enemies
- 100 enemies, all full HP: 100 draw calls (vs 300)
- 100 enemies, 50% damaged: 200 draw calls (vs 300)

### Fix 2: Disable Health Bars Entirely (FASTEST)

For maximum performance during testing/benchmarking.

**Location:** `components/game/entities/Enemy.ts` in `createMesh()`

**Comment out health bar creation:**
```typescript
// TEMPORARY: Disable health bars for performance
// Create health bar (background - dark)
// ... (comment out all health bar code)
```

**Expected Impact:** Reduces draw calls by 66%
- 100 enemies: 100 draw calls (vs 300)

### Fix 3: Increase Health Bar Height

Reduce overdraw by making health bars render less frequently.

**Location:** `components/game/entities/Enemy.ts`

**Change:**
```typescript
// Raise health bars higher to reduce overlap
const barYOffset = 1.2 // Was embedded in position calculation
this.healthBarBg.position.y = this.position.y + barYOffset
```

## Medium-Term Solutions

### Solution 1: Merge Health Bars into One Mesh

Use a single quad with a custom shader that renders both background and fill.

**Benefits:** Reduces 2 draw calls per enemy to 1
- 100 enemies: 200 draw calls (vs 300)

**Implementation:**
1. Create custom shader material for health bars
2. Pass HP percentage as uniform
3. Shader draws background + fill in one pass

### Solution 2: Batch Health Bars by Material

Group all health bar backgrounds into one draw call, all fills into another.

**Benefits:** 2 draw calls total for all health bars
- 100 enemies: 102 draw calls (100 bodies + 2 health bars)

**Implementation:**
1. Use `THREE.InstancedMesh` for health bar backgrounds
2. Use `THREE.InstancedMesh` for health bar fills
3. Update instance matrices each frame

## Long-Term Solutions (Best Performance)

### Solution 1: Full Instanced Rendering (Recommended)

Use `THREE.InstancedMesh` for all enemy types.

**Benefits:** 1 draw call per enemy TYPE (not per enemy)
- 5 enemy types × 3 meshes = **15 draw calls** for 100 enemies
- Reduction: 300 → 15 (95% improvement!)

**Implementation:**
Use `InstancedRenderer.ts` (already created):
```typescript
// Initialize
const renderer = new InstancedRenderer(scene)
renderer.registerEnemyType('drifter', geometry, material)
renderer.initHealthBars(1500)

// Each frame
renderer.updateEnemies(enemies.map(e => ({
    type: e.type,
    position: e.position,
    radius: e.radius,
    color: e.getColor(),
    isActive: e.isActive
})))

renderer.updateHealthBars(enemies.map(e => ({
    position: e.position,
    hpPercent: e.stats.currentHp / e.stats.maxHp,
    width: e.radius * 1.5,
    isActive: e.isActive
})))
```

**Expected Results:**
- 100 enemies of 5 types: ~7 draw calls
  - 5 enemy body types
  - 1 health bar background
  - 1 health bar fill
- 1000 enemies: Still ~7 draw calls!

### Solution 2: Sprite-Based Rendering

Use billboarded sprites instead of 3D meshes.

**Benefits:** Lower poly count, easier batching
- Can batch multiple sprites into texture atlas
- Potentially 1-2 draw calls for all enemies

**Implementation:**
Already partially implemented via `SpriteSystem.ts`, but needs:
1. Enable sprite mode for all enemies
2. Create sprite atlas for batching
3. Use instanced billboards

### Solution 3: Level-of-Detail (LOD) System

Reduce mesh complexity for distant enemies.

**Benefits:** Reduces triangles, allows simpler batching

**Implementation:**
```typescript
// Close enemies: Full detail mesh
// Medium distance: Simple sphere
// Far distance: Billboard sprite
const distance = enemy.position.distanceTo(player.position)
if (distance > 30) {
    enemy.useLOD = 'billboard'
} else if (distance > 15) {
    enemy.useLOD = 'simple'
} else {
    enemy.useLOD = 'full'
}
```

## Recommended Implementation Plan

### Phase 1: Quick Wins (Today)

1. ✅ **Hide health bars when full HP**
   - Edit `Enemy.ts` update method
   - Test with 100 enemies
   - Expected: 200 draw calls

2. ✅ **Disable health bars during benchmarking**
   - Add flag to disable health bars
   - Test with 500 enemies
   - Expected: 100-150 draw calls

### Phase 2: Instanced Rendering (This Week)

1. ✅ **Integrate InstancedRenderer** (file already created)
   - Modify EntityManager to use InstancedRenderer
   - Update Enemy class to work with instanced rendering
   - Test with 100 enemies
   - Expected: 10-20 draw calls

2. **Test and optimize**
   - Benchmark all scenarios
   - Verify visual quality
   - Profile performance gains

### Phase 3: Additional Optimizations (Next Sprint)

1. **Batch projectiles**
   - Use InstancedMesh for projectiles
   - Expected: 1 draw call for all projectiles

2. **Batch XP gems**
   - Use InstancedMesh for gems
   - Expected: 1 draw call for all gems

3. **Batch particles**
   - Use InstancedMesh or point sprites
   - Expected: 1 draw call for all particles

## Expected Performance Improvements

| Optimization | Draw Calls (100 enemies) | Draw Calls (500 enemies) |
|--------------|--------------------------|--------------------------|
| Current | 300+ | 1500+ |
| Quick Fix (hide full HP bars) | 200 | 1000 |
| Disable health bars | 100 | 500 |
| Instanced rendering | 10-20 | 10-20 |
| Full optimization | 5-10 | 5-10 |

## Implementation Instructions

### Quick Fix 1: Hide Full HP Bars

Edit `components/game/entities/Enemy.ts`:

```typescript
// In update() method, after health calculations:
updateHealthBar() {
    if (!this.healthBarBg || !this.healthBarFill) return

    const isDamaged = this.stats.currentHp < this.stats.maxHp

    // Only show health bar when damaged
    this.healthBarBg.visible = isDamaged && this.isActive
    this.healthBarFill.visible = isDamaged && this.isActive

    if (!isDamaged) return

    // Update fill width based on current HP
    const hpPercent = Math.max(0, this.stats.currentHp / this.stats.maxHp)
    this.healthBarFill.scale.x = hpPercent
    this.healthBarFill.position.x = this.position.x - (this.healthBarWidth * (1 - hpPercent)) / 2

    // Color based on HP
    const material = this.healthBarFill.material as THREE.MeshBasicMaterial
    if (hpPercent > 0.6) {
        material.color.setHex(0x00ff00) // Green
    } else if (hpPercent > 0.3) {
        material.color.setHex(0xffff00) // Yellow
    } else {
        material.color.setHex(0xff0000) // Red
    }

    // Position health bars above enemy
    const barY = this.position.y + (this.radius * 2) + 0.3
    this.healthBarBg.position.set(this.position.x, barY, this.position.z)
    this.healthBarFill.position.set(
        this.position.x - (this.healthBarWidth * (1 - hpPercent)) / 2,
        barY + 0.01,
        this.position.z
    )
}
```

Then call `this.updateHealthBar()` at the end of the `update()` method.

### Quick Fix 2: Add Health Bar Toggle

Add a flag to EntityManager:

```typescript
// In EntityManager.ts
export class EntityManager {
    private renderHealthBars = true // Set to false for benchmarking

    setHealthBarsEnabled(enabled: boolean) {
        this.renderHealthBars = enabled
    }

    // In update loop, only update health bars if enabled
}
```

Then in console:
```javascript
// Disable health bars for benchmarking
entityManager.setHealthBarsEnabled(false)

// Re-enable
entityManager.setHealthBarsEnabled(true)
```

## Testing Checklist

After implementing optimizations:

- [ ] Run profiler overlay (F3)
- [ ] Check draw calls with 100 enemies
- [ ] Check draw calls with 500 enemies
- [ ] Verify FPS improvement
- [ ] Ensure health bars still visible when damaged
- [ ] Test all enemy types render correctly
- [ ] Verify colors update properly
- [ ] Run benchmark suite
- [ ] Export performance report (F4)

## Monitoring Draw Calls

The profiler already tracks draw calls. Watch for:

- **Good:** <100 draw calls at 100 enemies
- **Acceptable:** 100-200 draw calls
- **Poor:** 200-400 draw calls
- **Critical:** >400 draw calls

## Next Steps

1. Implement Quick Fix 1 (hide full HP bars)
2. Test and measure improvement
3. If still too high, implement Quick Fix 2 (disable health bars)
4. Plan instanced rendering integration
5. Benchmark and iterate
