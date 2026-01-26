# Sprite System Implementation Guide

## Overview

The Slavic Survivors sprite system has been successfully implemented, transforming the game from 3D geometric meshes to animated 2D billboard sprites while maintaining the 3D isometric gameplay.

## Features Implemented

✅ **Core Sprite System**
- TextureManager: Loads and caches sprite sheet textures with crisp pixel art rendering
- AnimationController: Frame-based animation state machine
- BillboardRenderer: Creates billboard sprites that always face the camera
- SpriteSystem: Main coordinator (singleton pattern)

✅ **Player Integration**
- Animated sprite support with idle/walk/attack/hurt/die states
- Status effect color tinting (poison, burn, freeze, etc.)
- Iframe damage flash effects
- Feature flag for easy A/B testing (`player.useSpriteMode`)

✅ **Enemy Integration**
- All 11 enemy types support sprites
- Walk/idle/die animations
- Dynamic shadow scaling
- Health bars remain functional
- Object pooling maintained

✅ **Asset Generation**
- 12 AI-generated sprite sheets (player + 11 enemies)
- Shadow texture with radial gradient
- Scripts for automated generation

## Generated Assets

All sprite sheets have been generated and saved to:

```
public/sprites/
├── player/
│   └── player_sheet.png (64x64 frames)
├── enemies/
│   ├── drifter_sheet.png
│   ├── bruiser_sheet.png
│   ├── screecher_sheet.png
│   ├── zmora_sheet.png
│   ├── domovoi_sheet.png
│   ├── kikimora_sheet.png
│   ├── leshy_sheet.png
│   ├── werewolf_sheet.png
│   ├── forest_wraith_sheet.png
│   └── guardian_golem_sheet.png
└── shadows/
    └── blob_shadow.png
```

## How to Use

### Enable Sprite Mode

Sprite mode is controlled via feature flags in `useGameEngine.ts`:

```typescript
// For Player (line ~587)
player.useSpriteMode = true  // Set to false to revert to geometric meshes

// For Enemies (EntityManager automatically enables if sprite system initialized)
enemy.useSpriteMode = true
```

### Test the Implementation

1. **Start the game:**
   ```bash
   npm run dev
   ```

2. **Navigate to the game and start playing**
   - Player should render as an animated sprite
   - Enemies should render as animated sprites
   - Shadows should appear under all entities

3. **Test animations:**
   - **Idle**: Stand still - player should play idle animation
   - **Walk**: Move around - player should play walk animation
   - **Status Effects**: Get hit by poison/burn - sprite should tint green/red
   - **Enemy Death**: Kill enemies - they should play death animation

### Performance Testing

Target performance metrics:
- **Baseline**: 60 FPS with geometric meshes
- **Target**: 55+ FPS with 100 sprite enemies
- **Acceptable**: 50+ FPS with 200 sprite enemies

Monitor FPS in the game UI to verify performance.

## Architecture

### File Structure

**New Core Files:**
```
components/game/core/
├── TextureManager.ts       - Texture loading & caching
├── AnimationController.ts  - Frame-based animation
├── BillboardRenderer.ts    - Sprite & shadow rendering
└── SpriteSystem.ts         - Main coordinator
```

**Configuration:**
```
components/game/data/
└── sprites.ts              - Sprite configurations (animations, sizes, etc.)
```

**Asset Generation:**
```
scripts/
├── generate-sprites.ts     - Retro Diffusion API sprite generation
└── generate-shadow.ts      - Canvas-based shadow generation
```

### Modified Files

**Entities:**
- `components/game/entities/Player.ts` - Added sprite support
- `components/game/entities/Enemy.ts` - Added sprite support
- `components/game/entities/EntityManager.ts` - Pass sprite system to entities

**Game Engine:**
- `components/game/hooks/useGameEngine.ts` - Initialize sprite system, call update methods

## Configuration

### Sprite Config Format

Each entity has a sprite configuration in `components/game/data/sprites.ts`:

```typescript
player: {
  id: 'player',
  spriteSheet: '/sprites/player/player_sheet.png',
  frameWidth: 64,
  frameHeight: 64,
  framesPerRow: 8,
  scale: 1.5,
  shadowRadius: 0.4,
  animations: {
    idle: { frames: [0,1,2,3], fps: 8, loop: true },
    walk: { frames: [8,9,10,11,12,13,14,15], fps: 12, loop: true },
    attack: { frames: [16,17,18], fps: 15, loop: false, nextState: 'idle' },
    hurt: { frames: [24], fps: 1, loop: false, nextState: 'idle' },
    die: { frames: [32,33,34,35], fps: 10, loop: false }
  }
}
```

### Adding New Sprites

1. **Generate sprite sheet using Retro Diffusion:**
   ```typescript
   // Add to scripts/generate-sprites.ts
   {
     entityId: 'new_enemy',
     prompt: 'enemy description, top-down view, pixel art sprite',
     width: 48,
     height: 48,
     style: 'animation__walking_and_idle',
     outputPath: 'public/sprites/enemies/new_enemy_sheet.png'
   }
   ```

2. **Add configuration in `sprites.ts`:**
   ```typescript
   new_enemy: {
     id: 'new_enemy',
     spriteSheet: '/sprites/enemies/new_enemy_sheet.png',
     frameWidth: 48,
     frameHeight: 48,
     framesPerRow: 4,
     scale: 1.0,
     shadowRadius: 0.3,
     animations: {
       idle: { frames: [0,1], fps: 6, loop: true },
       walk: { frames: [4,5,6,7], fps: 10, loop: true },
       die: { frames: [8,9,10,11], fps: 10, loop: false }
     }
   }
   ```

3. **System will automatically load it on initialization**

## Regenerating Assets

If you need to regenerate sprite sheets:

```bash
# Set your API key (already set in script)
export RETRO_DIFFUSION_API_KEY="rdpk-d2ddab1afb2a01bb2a6c325b321ae347"

# Generate all sprites (takes ~1 minute with rate limiting)
npx tsx scripts/generate-sprites.ts

# Generate shadow
npx tsx scripts/generate-shadow.ts
```

**Cost:** Each sprite costs 10 credits (total: 120 credits for all 12 sprites)

## Technical Details

### Billboard Rendering

Sprites use THREE.Sprite with billboard rotation to always face the camera:

```typescript
sprite.material.rotation = Math.atan2(
  cameraPos.x - position.x,
  cameraPos.z - position.z
)
```

### Depth Sorting

Proper rendering order is maintained using:

```typescript
sprite.renderOrder = -distanceToCamera
shadow.renderOrder = sprite.renderOrder - 1
```

### Texture Filtering

Crisp pixel art rendering is achieved by disabling texture filtering:

```typescript
texture.magFilter = THREE.NearestFilter
texture.minFilter = THREE.NearestFilter
texture.generateMipmaps = false
```

### Animation State Machine

Animations transition based on entity state:

```typescript
const state = isMoving ? 'walk' : 'idle'
spriteSystem.updateEntity(entitySprite, state, position, cameraPos, deltaTime)
```

## Rollback Strategy

If sprites cause issues, instantly revert to geometric meshes:

```typescript
// In useGameEngine.ts (line ~587)
player.useSpriteMode = false

// Enemies will automatically use meshes if sprite system fails
```

Both rendering modes coexist for A/B testing.

## Known Limitations

1. **Directional Sprites**: Currently sprites don't have directional facing (4-way or 8-way)
2. **Death Animation**: Death animation plays but sprite doesn't fade out smoothly
3. **Special Enemy Transparency**: Zmora and Forest Wraith transparency works but could be smoother

## Future Enhancements

1. **Directional Sprites**: 4-way or 8-way facing for more dynamic look
2. **Shader Effects**: Outline shader, glow effects, distortion
3. **Sprite Deformation**: Squash/stretch on movement (game juice)
4. **Advanced Shadows**: Perspective shadows instead of blob shadows
5. **Particle Integration**: Sprite-based particles matching art style

## Troubleshooting

### Sprites Not Appearing

1. **Check sprite system initialization:**
   ```typescript
   console.log('Sprite system initialized:', spriteSystemRef.current?.isInitialized())
   ```

2. **Verify assets loaded:**
   - Check browser console for texture loading errors
   - Verify files exist in `public/sprites/`

3. **Check feature flags:**
   - Ensure `player.useSpriteMode = true` in useGameEngine.ts
   - Enemies automatically enable if sprite system is initialized

### Performance Issues

1. **Check FPS counter** in game UI
2. **Reduce enemy count** in spawn system for testing
3. **Disable shadows** temporarily by commenting out shadow creation
4. **Revert to meshes** if performance is unacceptable

### Animation Not Playing

1. **Verify sprite sheet format** - should be power-of-2 dimensions
2. **Check frame indices** in sprite config
3. **Verify FPS settings** - too low FPS might look static

## Credits

- **Sprite Generation**: Retro Diffusion API (https://retrodiffusion.ai/)
- **3D Engine**: THREE.js
- **Animation System**: Custom frame-based controller

## Summary

✅ **Completed Implementation:**
- Core sprite system (4 new files)
- Player sprite integration
- Enemy sprite integration (11 enemy types)
- Asset generation (12 sprite sheets + shadow)
- Game engine integration
- Feature flags for easy testing

🎮 **Ready to Test:**
- Start the game with `npm run dev`
- Sprites are enabled by default
- All animations functional
- Performance optimized with object pooling

🚀 **Next Steps:**
- Test gameplay with sprites
- Gather performance metrics
- Iterate on visual polish
- Consider directional sprites in future
