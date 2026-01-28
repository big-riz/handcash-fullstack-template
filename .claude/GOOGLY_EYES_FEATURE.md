# Googly Eyes Feature - Boss Enemies

## Overview

Added animated googly eyes to boss enemies that react to their movement, giving them personality and making them more visually interesting. Each boss has a unique expression that fits their character.

## Features

### Movement-Reactive Pupils
- Pupils follow the enemy's velocity direction
- When stationary, pupils center in the eyes
- Creates a "googly" bouncing effect during movement
- Smooth tracking based on normalized velocity

### Emotional Expressions
Different eyebrow styles convey personality:

| Expression | Description | Used By |
|------------|-------------|---------|
| **Evil** | Sharp angled V-shape | Leshy, Chernobog |
| **Angry** | Angled down towards center | Guardian Golem, Golem Destroyer |
| **Tired** | Droopy curved brows | Ancient Treant |
| **Sad** | Angled down towards outside | (Reserved) |
| **Surprised** | High arched brows | (Reserved) |
| **Normal** | Straight brows | (Default) |

### Boss Eye Assignments

| Boss | Scale | Expression | Rationale |
|------|-------|------------|-----------|
| **Leshy** (Forest Lord) | 1.5x | Evil | Malevolent forest spirit |
| **Ancient Treant** (Tree Boss) | 1.8x | Tired | Ancient, weary guardian |
| **Guardian Golem** | 1.2x | Angry | Aggressive stone protector |
| **Golem Destroyer** | 1.6x | Angry | Massive angry construct |
| **Chernobog** (Final Boss) | 2.0x | Evil | Ultimate evil entity |

## Implementation

### New File: `components/game/core/GooglyEyes.ts`

**Class:** `GooglyEyes`

Creates a set of animated eyes with:
- 2 white eye sprites with black borders
- 2 black pupil sprites with subtle highlights
- Optional eyebrow sprites (2) for expressions
- All sprites are billboarded (face camera)

**Methods:**
```typescript
constructor(scene: THREE.Scene, scale: number, expression: EyeExpression)
update(position: THREE.Vector3, velocity: THREE.Vector3, yOffset: number)
setVisible(visible: boolean)
dispose()
```

**Render Order:**
- Enemy body: renderOrder = 10
- Eye whites: renderOrder = 11
- Pupils & eyebrows: renderOrder = 12
- Health bars: renderOrder = 999-1000

### Modified: `components/game/entities/Enemy.ts`

**Added:**
- `googlyEyes: GooglyEyes | null` property
- `getBossEyeConfig()` method - determines which enemies get eyes
- Eye creation in `createMesh()`
- Eye update in `update()` - animates pupils based on velocity
- Eye visibility in `spawn()` and `die()`

**Boss Detection:**
```typescript
private getBossEyeConfig(): { scale: number; expression: EyeExpression } | null {
    switch (this.type) {
        case 'leshy': return { scale: 1.5, expression: 'evil' }
        case 'ancient_treant': return { scale: 1.8, expression: 'tired' }
        case 'guardian_golem': return { scale: 1.2, expression: 'angry' }
        case 'golem_destroyer': return { scale: 1.6, expression: 'angry' }
        case 'chernobog': return { scale: 2.0, expression: 'evil' }
        default: return null // Non-bosses don't get eyes
    }
}
```

### Modified: `components/game/entities/EntityManager.ts`

**Updated cleanup():**
- Added disposal of `enemy.billboard`
- Added disposal of `enemy.googlyEyes`
- Proper memory cleanup for all boss eye components

## Visual Design

### Eye Structure

**Eye White (64×64 canvas):**
- White circle with black border
- Border width: 3px
- Gives crisp, cartoon appearance

**Pupil (32×32 canvas):**
- Black circle with subtle highlight
- Radial gradient from gray center to black
- Simulates depth and glossiness

**Eyebrow (64×32 canvas):**
- Black stroke, 4px width, rounded caps
- Different shapes per expression:
  - **Angry:** Line from low-outer to high-inner (\ /)
  - **Sad:** Line from high-outer to low-inner (/ \)
  - **Evil:** Sharp V-shape (∧)
  - **Tired:** Droopy curve (⌣)
  - **Surprised:** High arch (⌢)

### Positioning

```
        [Eyebrow]         [Eyebrow]
           ●                 ●          ← Eye whites (separated by radius × 1.5)
           ○                 ○          ← Pupils (follow velocity)

           [Enemy Body]                 ← Billboard sprite
```

**Vertical Offsets:**
- Eyes: `enemy.position.y + (enemy.radius × 2)`
- Eyebrows: `eye.position.y + (eyeRadius × 1.2)`
- Pupils: Dynamic based on velocity

**Horizontal Separation:**
- Eye spacing: `eyeRadius × 1.5`
- Centered on enemy position

### Pupil Movement

```typescript
const maxPupilOffset = eyeRadius × 0.5
const offsetX = (velocity.x / speed) × maxPupilOffset
const offsetY = (velocity.z / speed) × maxPupilOffset // z becomes y for screen

pupil.position = eye.position + offset
```

**Result:** Pupils stay within eye bounds while following movement direction

## Performance Impact

### Per Boss Enemy:
- **6 sprites** (2 eyes + 2 pupils + 2 eyebrows)
- **6 draw calls** (negligible compared to hundreds of regular enemies)
- **6 canvas textures** (cached, reused across spawns)
- **~12 triangles** (6 sprites × 2 triangles each)

### Memory:
- Eye white texture: 64×64 × 4 bytes = 16 KB
- Pupil texture: 32×32 × 4 bytes = 4 KB
- Eyebrow texture: 64×32 × 4 bytes = 8 KB
- **Total per boss type:** ~28 KB (textures are shared)

**Impact:** Minimal - only 5 boss types, textures are reused

## Gameplay Impact

### Visual Benefits:
1. **Boss Recognition** - Instantly identify bosses by their eyes
2. **Movement Feedback** - Pupils show boss movement intent
3. **Personality** - Expressions give bosses character
4. **Humor** - Googly eyes add charm to intimidating enemies

### No Mechanical Changes:
- Eyes are purely cosmetic
- No collision detection
- No gameplay effects
- Doesn't affect boss stats or abilities

## Testing

### Manual Test:
1. Start game: `npm run dev`
2. Navigate to `/play`
3. Spawn boss enemies (e.g., Leshy at 5 minutes in Frozen Waste)
4. Observe:
   - Eyes appear above boss bodies
   - Pupils track movement direction
   - Eyebrows show correct expression
   - Eyes hide when boss dies

### Boss Spawn Times (Frozen Waste):
- **5:00** - Leshy (evil eyes, 1.5x scale)
- **10:00** - Ancient Treant (tired eyes, 1.8x scale)
- **15:00** - Golem Destroyer (angry eyes, 1.6x scale)
- **20:00** - Chernobog (evil eyes, 2.0x scale)

### Console Commands:
```javascript
// Spawn boss for testing (via SpawnSystem if exposed)
// Or wait for natural boss spawn events
```

## Future Enhancements

### Potential Additions:
1. **Blinking animation** - Occasional eye blinks
2. **Damage reaction** - Eyes briefly X-shape when hit
3. **Death animation** - Eyes spiral or cross when boss dies
4. **Elite enemy eyes** - Smaller eyes for elite variants
5. **Eye color variation** - Red eyes for enraged state
6. **Winking** - Random wink for personality
7. **Focus targeting** - Eyes look at player occasionally

### Code Ready For:
- Easy to add new expressions via `EyeExpression` type
- Eye visibility can be toggled per boss instance
- Scale can be adjusted dynamically for size changes
- Additional sprites can be added (e.g., eyelids for blinking)

## Known Limitations

1. **Always billboarded** - Eyes always face camera (by design)
2. **No depth testing with body** - Eyes render above body sprite
3. **Simple animation** - Pupils follow velocity, no smoothing/easing
4. **Static expressions** - Eyebrows don't change during gameplay
5. **No collision** - Eyes are purely visual, no hitboxes

## Files Modified Summary

### Created:
- ✅ `components/game/core/GooglyEyes.ts` - Main eyes system

### Modified:
- ✅ `components/game/entities/Enemy.ts` - Added eye creation and updates
- ✅ `components/game/entities/EntityManager.ts` - Added cleanup logic

### Documentation:
- ✅ `.claude/GOOGLY_EYES_FEATURE.md` - This file

## Conclusion

The googly eyes feature adds personality and visual interest to boss enemies with minimal performance cost. The movement-reactive pupils create a dynamic, humorous effect that makes boss encounters more memorable while maintaining the game's action-focused gameplay.

**Status:** ✅ COMPLETE - Ready for testing
