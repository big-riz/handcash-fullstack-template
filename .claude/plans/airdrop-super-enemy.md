# Implementation Plan: Airdrop System & Enemy Combination System

## Overview
Two new game systems for Slavic Survivors:
1. **Airdrop System** - Supply drops falling from the sky after level 10, granting upgrades
2. **Enemy Combination System** - Merge 10 nearby same-type enemies into a super enemy

---

## System 1: Airdrop System

### Requirements
- Starts after player reaches level 10
- Airdrops occur every 60 seconds
- Each airdrop provides 1 upgrade choice
- Large crate mesh falls from the sky with a small timer
- On-screen direction indicators flash showing airdrop location
- Timer displays on the direction arrow indicator

### New Files
1. `components/game/systems/AirdropSystem.ts` - Main airdrop logic
2. `components/game/entities/Airdrop.ts` - Airdrop entity class
3. `components/game/ui/AirdropIndicator.tsx` - React component for direction arrows

### Implementation Details

#### `AirdropSystem.ts`
```typescript
interface AirdropConfig {
  minLevel: number          // 10
  interval: number          // 60 seconds
  fallDuration: number      // 5 seconds (timer shown on indicator)
  spawnDistance: number     // 30-50 units from player
  crateScale: number        // 2.5 (large crate)
}

class AirdropSystem {
  private airdrops: Airdrop[] = []
  private inactiveAirdrops: Airdrop[] = []
  private timeSinceLastDrop: number = 0
  private enabled: boolean = false
  private onAirdropSpawned: ((airdrop: Airdrop) => void) | null = null
  private onAirdropLanded: ((x: number, z: number) => void) | null = null

  constructor(scene: THREE.Scene, player: Player, rng: SeededRandom)

  update(deltaTime: number, playerLevel: number): void
  // Enable system when playerLevel >= 10
  // Spawn airdrop every 60s at random position 30-50 units from player
  // Update falling airdrops
  // Detect player collision with landed airdrops

  spawnAirdrop(): Airdrop
  // Create/reuse Airdrop entity
  // Position at random angle, 30-50 units from player
  // Set fall timer (5 seconds)
  // Call onAirdropSpawned callback

  getActiveAirdrops(): Airdrop[]
  // Return active airdrops for UI indicators

  cleanup(): void
}
```

#### `Airdrop.ts`
```typescript
class Airdrop {
  position: THREE.Vector3      // Ground position (target)
  currentY: number             // Current height during fall
  isActive: boolean
  isFalling: boolean
  fallTimer: number            // Countdown during fall
  fallDuration: number         // Total fall time
  collectionRadius: number     // 2.0 units
  mesh: THREE.Group | null     // Large crate mesh

  constructor()

  spawn(x: number, z: number, fallDuration: number): void
  // Set position, start falling from height 50
  // Create crate mesh if not exists

  update(deltaTime: number): boolean
  // Update fall animation (lerp Y from 50 to ground)
  // Return true when landed

  createMesh(scene: THREE.Scene): void
  // Use existing 'crate' mesh from meshUtils.ts
  // Scale up to 2.5x
  // Add parachute visual (optional - 4 lines + canopy)

  despawn(): void
  // Hide mesh, mark inactive
}
```

#### `AirdropIndicator.tsx`
```typescript
interface AirdropIndicatorProps {
  airdrops: Array<{
    worldX: number
    worldZ: number
    fallTimer: number
    isFalling: boolean
  }>
  playerX: number
  playerZ: number
  screenWidth: number
  screenHeight: number
}

// Renders edge-of-screen arrows pointing to off-screen airdrops
// Arrow positioned at screen edge in direction of airdrop
// Timer countdown displayed on arrow
// Flashing animation (pulse opacity/scale)
// Arrow disappears when airdrop lands and is visible on screen
```

### Integration Points
1. **useGameEngine.ts**:
   - Create `AirdropSystem` instance
   - Call `update()` in game loop
   - Pass active airdrops to UI component
   - Handle airdrop collection → trigger level-up screen with single choice

2. **Game UI (SlavicSurvivors.tsx)**:
   - Add `<AirdropIndicator>` component
   - Pass airdrop positions from game engine

3. **LevelUp.tsx** or new **AirdropUpgrade.tsx**:
   - Show single upgrade choice when collecting airdrop
   - Same card UI, but only 1 choice

---

## System 2: Enemy Combination System

### Requirements
- When 10 enemies of the same type are within close proximity
- Combine them into a "Super" version
- Super enemy has 10x base HP
- Current health of combined enemies sums to super enemy's current HP
- Super enemy uses same AI but larger model and enhanced visuals

### New Files
1. `components/game/systems/EnemyCombinationSystem.ts` - Detection and merging logic

### Implementation Details

#### `EnemyCombinationSystem.ts`
```typescript
interface CombinationConfig {
  requiredCount: number       // 10 enemies
  proximityRadius: number     // 3.0 units (enemies must be within this distance of cluster center)
  checkInterval: number       // 0.5 seconds (don't check every frame)
  minEnemiesForType: number   // Only combine if type has at least 10 active
}

class EnemyCombinationSystem {
  private checkTimer: number = 0
  private scene: THREE.Scene
  private entityManager: EntityManager
  private vfx: VFXManager

  constructor(scene: THREE.Scene, entityManager: EntityManager, vfx: VFXManager)

  update(deltaTime: number): void
  // Increment checkTimer
  // Every 0.5s, scan for combination candidates

  private findCombinationCandidates(): Map<EnemyType, Enemy[]>
  // Group active enemies by type
  // Filter to types with 10+ active
  // For each type, find clusters of 10 within proximity

  private findCluster(enemies: Enemy[], proximityRadius: number): Enemy[] | null
  // Find 10 enemies all within proximityRadius of each other
  // Use centroid-based clustering
  // Return first valid cluster found, or null

  private combineEnemies(enemies: Enemy[], type: EnemyType): void
  // Calculate combined current HP (sum of all currentHp)
  // Calculate cluster center position
  // Despawn all 10 enemies
  // Spawn new "super" enemy at center
  // Set super enemy's currentHp to combined total
  // Set super enemy's maxHp to 10x base
  // Create VFX burst at location

  cleanup(): void
}
```

### Super Enemy Implementation

Rather than creating new enemy types, modify existing spawn logic:

1. **EntityManager.spawnEnemy** modification:
   - Add `isSuperEnemy: boolean` parameter
   - When true:
     - Scale mesh to 2x
     - Set maxHp to 10x base
     - Apply golden/glowing emissive effect
     - Increase XP value by 5x

2. **Enemy.ts** modification:
   - Add `isSuperEnemy: boolean` property
   - Modify `spawn()` to accept super enemy flag
   - Super enemies get:
     - 2x radius
     - Golden emissive glow
     - "SUPER" prefix in any UI

### Combination Algorithm
```typescript
function findCluster(enemies: Enemy[], radius: number): Enemy[] | null {
  // For each enemy as potential cluster seed
  for (const seed of enemies) {
    const cluster: Enemy[] = [seed]

    // Find all enemies within radius of seed
    for (const other of enemies) {
      if (other === seed) continue
      const dist = seed.position.distanceTo(other.position)
      if (dist <= radius) {
        cluster.push(other)
      }
    }

    // Check if all cluster members are within radius of EACH OTHER
    if (cluster.length >= 10) {
      // Verify tight clustering
      const centroid = calculateCentroid(cluster)
      const allClose = cluster.every(e =>
        e.position.distanceTo(centroid) <= radius
      )
      if (allClose) {
        return cluster.slice(0, 10) // Return exactly 10
      }
    }
  }
  return null
}
```

### Integration Points
1. **useGameEngine.ts**:
   - Create `EnemyCombinationSystem` instance
   - Call `update()` in game loop after enemy updates

2. **EntityManager.ts**:
   - Modify `spawnEnemy()` to support `isSuperEnemy` parameter
   - Handle super enemy scaling and effects

3. **Enemy.ts**:
   - Add `isSuperEnemy` flag
   - Modify visual appearance when super

---

## File Change Summary

### New Files (4)
- `components/game/systems/AirdropSystem.ts`
- `components/game/entities/Airdrop.ts`
- `components/game/ui/AirdropIndicator.tsx`
- `components/game/systems/EnemyCombinationSystem.ts`

### Modified Files (4)
- `components/game/hooks/useGameEngine.ts` - Add systems, pass airdrop data to UI
- `components/game/entities/EntityManager.ts` - Super enemy spawning
- `components/game/entities/Enemy.ts` - Super enemy flag and visuals
- Game UI component (likely `app/page.tsx` or similar) - Render AirdropIndicator

---

## Implementation Order

1. **Phase 1: Airdrop Entity & Mesh**
   - Create `Airdrop.ts` with crate mesh (reuse existing meshUtils)
   - Falling animation with parachute

2. **Phase 2: Airdrop System**
   - Create `AirdropSystem.ts`
   - Level 10+ activation, 60s intervals
   - Spawn and update logic

3. **Phase 3: Airdrop UI**
   - Create `AirdropIndicator.tsx`
   - Direction arrows with timers
   - Flashing animation

4. **Phase 4: Airdrop Integration**
   - Wire into useGameEngine
   - Collection triggers upgrade screen
   - Single-choice upgrade UI

5. **Phase 5: Super Enemy Foundation**
   - Modify `Enemy.ts` for super enemy flag
   - Modify `EntityManager.ts` for super enemy spawning
   - Visual effects (scale, glow)

6. **Phase 6: Combination System**
   - Create `EnemyCombinationSystem.ts`
   - Clustering algorithm
   - HP summation logic

7. **Phase 7: Integration & Testing**
   - Wire combination system into game loop
   - Test with various enemy types
   - Balance HP thresholds

---

## Performance Considerations

- Airdrop system: Max 3 active airdrops (unlikely to have more)
- Combination check: Only every 0.5s, only for types with 10+ enemies
- Cluster algorithm: O(n²) but capped by early exit on first valid cluster
- Super enemies: Same rendering as regular enemies (instanced)

---

## Visual Design Notes

### Airdrop Crate
- Use existing 'crate' mesh from meshUtils.ts
- Scale to 2.5x
- Optional: Add 4 rope lines + simple parachute canopy mesh above

### Direction Indicator
- Arrow icon pointing toward airdrop
- Pulsing/flashing animation (0.5s cycle)
- Timer text showing seconds until landing
- Positioned at screen edge
- Color: Bright yellow/orange (#FFD700)

### Super Enemy
- 2x scale of base enemy type
- Golden emissive glow (0xffd700, intensity 0.6)
- Possible crown/halo particle effect (optional)
- Same instanced rendering as regular enemies
