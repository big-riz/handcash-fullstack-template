# Slavic Survivors - Complete Game Overview

**Version:** 1.0  
**Last Updated:** 2026-01-24  
**Game Type:** Vampire Survivors-style Roguelite with Slavic Folklore Theme

---

## Table of Contents

1. [Game Overview](#game-overview)
2. [Technical Architecture](#technical-architecture)
3. [Core Systems](#core-systems)
4. [Game Content](#game-content)
5. [File Structure](#file-structure)
6. [Implementation Status](#implementation-status)
7. [Development Guidelines](#development-guidelines)

---

## Game Overview

### Core Concept

Slavic Survivors is a top-down bullet heaven roguelite where players survive waves of Slavic folklore monsters (upiór, strzyga, domovoi, leshy) using a combination of:
- **Ritual weapons** (garlic aura, holy water, aspen stakes, salt wards)
- **Contraband weapons** (TT33 handgun, various AK variants, melee weapons)
- **Special systems** (vehicles, companions, deployables)

### Core Gameplay Loop

1. **Move** using WASD/Arrow keys in a top-down 3D arena
2. **Auto-fire weapons** attack enemies automatically
3. **Collect XP gems** from defeated enemies
4. **Level up** and choose 1 of 3 upgrades
5. **Survive** for 12-15 minutes or defeat the boss
6. **Evolve weapons** when conditions are met (weapon max level + required passive)

### Win/Lose Conditions

- **Win:** Survive until timer expires or defeat the boss at 5 minutes
- **Lose:** Player HP reaches 0

---

## Technical Architecture

### Core Technologies

- **Framework:** React + TypeScript
- **Rendering:** Three.js (WebGL)
- **Camera:** Orthographic, 55° pitch, follows player
- **Physics:** 2D circle collisions on XZ plane
- **Game Loop:** Fixed timestep (60Hz) with interpolation

### Performance Targets

- **FPS:** 60 FPS target
- **Enemy Count:** 200-600 on-screen enemies
- **Max Entities:** 1,500 total (enemies + projectiles + pickups + VFX)
- **Optimizations:** Object pooling, entity manager, spatial hash (planned)

### Key Technical Features

1. **Fixed Timestep Simulation**
   - 60Hz physics simulation
   - Interpolation for smooth rendering
   - Accumulator pattern to handle variable frame rates

2. **Object Pooling**
   - Enemies, projectiles, XP gems all use pooling
   - Prevents garbage collection stutters
   - Reuses Three.js meshes for performance

3. **Seeded Random Number Generator**
   - Deterministic gameplay for replays
   - Used for spawns, drops, and upgrades

4. **World Generation**
   - Procedural obstacle placement
   - Different themes per world (Dark Forest, Frozen Waste)
   - Collision detection with obstacles

---

## Core Systems

### 1. Player System

**File:** `components/game/entities/Player.ts`

**Core Stats:**
```typescript
interface PlayerStats {
  // Health
  maxHp: number           // Base: 100
  currentHp: number
  
  // Movement
  moveSpeed: number       // Base: 8.0
  
  // Progression
  level: number           // Starts at 1
  xp: number
  xpToNextLevel: number   // Base: 25, scales by 1.4x
  
  // Collection
  magnet: number          // Pickup radius, base: 2.5
  
  // Combat
  armor: number           // Damage reduction
  damageMultiplier: number // Base: 1.0
  areaMultiplier: number   // Weapon area scaling
  cooldownMultiplier: number // Base: 1.0
  critRate: number         // Base: 0.05 (5%)
  critDamage: number       // Base: 2.0 (200%)
  
  // Regeneration
  regen: number           // HP per second
  
  // Misc
  luck: number            // Drop chances
  amount: number          // Additional projectiles
  projectileSpeedMultiplier: number
  durationMultiplier: number
  growth: number          // XP gain multiplier
  greed: number           // Gold gain multiplier
  curse: number           // Enemy difficulty
  
  // Resources
  revivals: number
  rerolls: number
  skips: number
  banishes: number
}
```

**Movement:**
- Acceleration-based with deceleration
- Max speed clamped by `moveSpeed` stat
- Obstacle collision detection
- Invulnerability frames (0.5s) after taking damage
- Passive regeneration if `regen > 0`

---

### 2. Enemy System

**File:** `components/game/entities/Enemy.ts`

**Enemy Types:**

| Enemy ID | Name | HP | Speed | Damage | XP | Behavior |
|----------|------|----|----|--------|-----|----------|
| `drifter` | Upiór Drifter | 15 | 3.5 | 10 | 1 | Basic chaser |
| `screecher` | Strzyga Screecher | 8 | 5.5 | 5 | 1 | Fast flanker |
| `bruiser` | Vurdalak Bruiser | 60 | 2.2 | 20 | 3 | Slow tank |
| `zmora` | Zmora | 12 | 4.0 | 12 | 1 | Ghost with invuln flicker |
| `domovoi` | Domovoi Swarmlet | 4 | 4.5 | 4 | 1 | Tiny swarm units |
| `kikimora` | Kikimora Snarer | 25 | 2.8 | 15 | 2 | Drops slow patches |
| `leshy` | Leshy | 500 | 1.8 | 40 | 10 | Forest Boss |
| `vodnik` | Vodnik | 12 | 3.0 | 8 | 2 | Ranged water spirit |

**Elite Enemies:**
- 4x HP
- 2x damage
- 2x XP reward
- Golden glow effect
- 1.5x scale

**Special Behaviors:**
- **Zmora:** Flickers between invulnerable and vulnerable every 2 seconds
- **Vodnik:** Ranged attacker, shoots projectiles at player
- **Kikimora:** Spawns slow patches on death
- **Leshy:** Boss enemy, larger scale (3x)

---

### 3. Spawn System

**File:** `components/game/systems/SpawnSystem.ts`

**Spawn Mechanics:**
- Enemies spawn in a ring around the player (radius: 22 units)
- Base spawn interval: 1.25 seconds (decreased over time)
- Base spawn count: 2 (increases every 2 minutes)
- Elite spawn chance: 1% base, increases to 10% over 40 minutes

**Difficulty Scaling:**
- Spawn interval decreases over time: `max(0.1, (interval - time/900) / (spawnRateMultiplier * curse))`
- Spawn count increases: `floor(baseCount + time/120)`
- Elite chance increases: `min(0.1, 0.01 + time/2400)`

**Boss Spawn:**
- Leshy boss spawns at 5 minutes (300 seconds)
- Spawns in ring around player
- Only spawns once per run

**World-Specific Scaling:**
- Dark Forest: Normal progression
- Frozen Waste: 0.5x spawn rate, 0.5x progression (harder enemies compensate)

---

### 4. Combat System

**File:** `components/game/entities/EntityManager.ts`

**Damage Types:**
1. **Contact Damage:** Enemies deal 0.5x their damage stat when touching player
2. **Projectile Damage:** Weapon projectiles damage enemies
3. **Area Damage:** Auras and zones (garlic, holy water)
4. **Special Damage:** Vehicle ramming, companion attacks

**Collision Detection:**
- 2D circle-circle collision on XZ plane
- Player radius: 0.5 units
- Enemy radius: 0.15-1.2 units (varies by type)
- Projectile radius: 0.2 units

**Damage Resolution:**
```typescript
actualDamage = max(1, weaponDamage - enemyArmor)
finalDamage = actualDamage * playerDamageMultiplier
```

**Critical Hits:**
- Chance: `player.stats.critRate` (5% base)
- Damage: `damage * player.stats.critDamage` (2x base)

---

### 5. Ability System

**File:** `components/game/systems/AbilitySystem.ts`

**System Architecture:**
- Max 6 active weapons
- Max 6 passive items
- Max level 5 per item
- Evolutions replace base weapons

**Ability Categories:**
1. **ActiveWeapon:** Auto-firing weapons
2. **Passive:** Stat modifiers
3. **Deployable:** Placed structures
4. **Vehicle:** Temporary movement modes
5. **Companion:** Following helpers

**Upgrade Flow:**
```
Level 1 → Level 2 → Level 3 → Level 4 → Level 5 → Evolution (if eligible)
```

**Evolution Requirements:**
- Base weapon at max level (5)
- Required passive owned
- Player level 8 or higher

---

### 6. VFX System

**File:** `components/game/systems/VFXManager.ts`

**Effect Types:**

1. **Damage Numbers**
   - Float upward with physics
   - Fade out over 2 seconds
   - Color-coded (white for enemy damage, red for player damage)
   - Scale based on damage amount

2. **Emoji Effects**
   - Used for hit indicators (⚔️), pickups (✨), abilities
   - Scatter with random velocity
   - Shrink and fade over 0.8 seconds
   - Rotate during flight

**Performance:**
- Canvas-based text rendering
- Sprite system with texture caching
- Automatic cleanup when effects expire

---

### 7. Game Loop

**File:** `components/game/core/GameLoop.ts`

**Fixed Timestep Implementation:**
```typescript
fixedDeltaTime = 16.67ms (60Hz)

loop:
  frameTime = currentTime - lastTime
  accumulator += min(frameTime, 250ms) // Cap to prevent spiral of death
  
  while (accumulator >= fixedDeltaTime):
    update(fixedDeltaTime)
    accumulator -= fixedDeltaTime
  
  alpha = accumulator / fixedDeltaTime
  render(alpha) // Interpolation for smooth visuals
```

**FPS Tracking:**
- Averages last 60 frames
- Updates display every frame
- Used for performance monitoring

---

### 8. Input System

**File:** `components/game/core/Input.ts`

**Supported Inputs:**
- **WASD:** Movement
- **Arrow Keys:** Movement
- **ESC:** Pause/unpause
- **Touch Controls:** Mobile support with pointer-based movement

**Touch Controls:**
- Direct position targeting (tap and hold to move toward that spot)
- Visual joystick (planned)
- Fullscreen mode for mobile
- Landscape orientation lock

---

### 9. World System

**File:** `components/game/data/worlds.ts`

**Available Worlds:**

#### Dark Forest
- **Theme:** Ancient woods where Perun strikes
- **Sky Color:** Dark green (0x1a1e1a)
- **Ground Color:** Forest green (0x3d453d)
- **Enemies:** drifter, screecher, bruiser, domovoi
- **Difficulty:** 1.0x (base)
- **Win Condition:** Reach level 10
- **Environment:** Cone-shaped trees with trunks
- **Loot Theme:** Ancient Relics

#### Frozen Siberian Waste
- **Theme:** Cold hell where only the strongest survive
- **Sky Color:** Sky blue (0x88aabb)
- **Ground Color:** Snow white (0xddeeff)
- **Enemies:** zmora, kikimora, drifter, bruiser
- **Difficulty:** 1.5x
- **Win Condition:** Reach level 15
- **Environment:** Ice spike formations
- **Loot Theme:** Soviet Surplus

**World Features:**
- Procedurally generated obstacles (300 per world)
- Collision detection with obstacles
- World-specific enemy pools
- World-specific allowed upgrades
- Dynamic fog and lighting

---

## Game Content

### Characters

**File:** `components/game/data/characters.ts`

| ID | Name | Starting Weapon | Max HP | Move Speed | Might | Area | Luck |
|---|------|----------------|--------|------------|-------|------|------|
| `gopnik` | Boris the Gopnik | TT33 | 100 | 1.0 | 1.0 | 1.0 | 1.0 |
| `babushka` | Babushka Zina | Garlic Aura | 80 | 0.8 | 1.2 | 1.3 | 1.0 |
| `hunter` | Vadim Hunter | Aspen Stake | 120 | 1.1 | 1.1 | 0.9 | 1.0 |
| `biz_man` | Big Biznisman | Pig Luggage | 90 | 1.0 | 1.0 | 1.0 | 1.5 |

---

### Active Weapons

**File:** `components/game/data/actives.ts`

#### Ritual Track (Anti-Vampire Kit)

| ID | Name | Type | Rarity | Description |
|---|------|------|--------|-------------|
| `garlic` | Czosnek Halo (Garlic Halo) | Area | Common | Damaging aura that keeps spirits at bay |
| `dagger` | Hussar Lances | Projectile | Common | Shoot piercing blades in movement direction |
| `holywater` | Svyata Voda (Holy Water) | Zone | Common | Create lingering damage pools on the ground |
| `stake` | Aspen Stake | Projectile | Common | Auto-targets nearest enemies with high damage |
| `cross` | Krzyż Boomerang (Cross) | Projectile | Rare | Holy cross that returns, piercing enemies |
| `salt` | Solny Krąg (Salt Circle) | Zone | Rare | Protective circle that wards off spirits |
| `grail` | Gopnik Grail | Area | Legendary | Spills holy liquid that damages and heals |
| `skull_screen` | Skull Screen | Area | Epic | Rotating skulls block projectiles and damage |
| `visors` | Orthodox Visors | Projectile | Legendary | Shoots holy lasers from eyes |
| `vampire_rat` | Vampire Rat | Companion | Rare | Scurries around biting enemies |
| `haunted_lada` | Haunted Lada | Vehicle | Legendary | Ghost car phases through enemies |

#### Contraband Track (Goplandia Arsenal)

| ID | Name | Type | Rarity | Description |
|---|------|------|--------|-------------|
| `tt33` | TT33 Handgun | Gun | Common | Rapid single shots at nearest enemy |
| `ak_radioactive` | Radioactive AK | Gun | Epic | Fast nuclear bursts, chance to melt |
| `ak_ghzel` | Ghzel AK | Gun | Epic | Artisanal precision, high critical hit chance |
| `ak_corrupted` | Corrupted AK | Gun | Legendary | Demonic weapon that siphons life |
| `ak_mushroom` | Mushroom AK | Gun | Epic | Fires rounds that burst into toxic spores |
| `peppermill` | Peppermill Gun | Gun | Uncommon | Sprays bullets like spices everywhere |
| `gzhel_smg` | Gzhel SMG | Gun | Epic | Fine china rapid fire, fragile but deadly |
| `shank` | Babushka's Shank | Melee | Common | Short range, high bleed damage |
| `kabar` | Kabar Knife | Melee | Rare | Military grade steel, slices armor |
| `knuckles` | Ceramic Knuckles | Melee | Uncommon | Hard-hitting melee punches |
| `stilleto` | Stilleto | Projectile | Rare | Throwing knives that pierce multiple enemies |
| `soviet_stick` | Soviet Stick | Melee | Uncommon | Symbol of authority, huge knockback |
| `nuclear_pigeon` | Nuclear Pigeon | Companion | Legendary | Radioactive companion that orbits and protects |
| `pig_luggage` | Pig Luggage | Companion | Uncommon | Follows you, drops ammo/food |
| `propaganda_tower` | Propaganda Tower | Deployable | Rare | Deploy towers that damage and slow |
| `kvass_reactor` | Kvass Reactor | Deployable | Epic | Deploys healing zone that boosts speed |
| `lada` | Lada Vehicle | Vehicle | Legendary | Periodic armored push, crush enemies |
| `big_biz_lada` | Big Biz Lada | Vehicle | Legendary | Gold plated, generates coins while driving |
| `dadushka_chair` | Dadushka Chair | Vehicle | Rare | Comfortable slaughter, slow but high armor |
| `gopnik_gondola` | Gopnik Gondola | Vehicle | Epic | Float over enemies, ignores terrain |
| `tank_stroller` | Tank Stroller | Vehicle | Epic | Heavily armored personal transport |

**Implementation Status:**
- ✅ Garlic Aura (fully implemented)
- ✅ Dagger (fully implemented)
- ✅ Holy Water (fully implemented)
- ✅ Aspen Stake (fully implemented)
- ✅ Cross (fully implemented)
- ✅ Salt Line (fully implemented)
- ✅ TT33 (fully implemented)
- ✅ Radioactive AK (fully implemented)
- ✅ Ghzel AK (fully implemented)
- ✅ Corrupted AK (fully implemented)
- ✅ Mushroom AK (fully implemented)
- ✅ Nuclear Pigeon (fully implemented)
- ✅ Lada Vehicle (fully implemented)
- ✅ Propaganda Tower (fully implemented)
- 🔄 Others mapped to existing classes with stat variations

---

### Passive Items

**File:** `components/game/data/passives.ts`

| ID | Name | Rarity | Effect |
|---|------|--------|--------|
| `hp` | Old World Heart | Common | +20 Max HP & full recovery |
| `speed` | Wild Spirit | Common | +0.5 Move Speed |
| `magnet` | Amber Stone | Common | +1.5 Collection Radius |
| `regen` | Health Regen | Rare | +1.0 HP/sec |
| `iron` | Zhelezo (Iron) | Uncommon | +1 Armor & knockback resist |
| `area` | Vistula Reach | Uncommon | +15% Ability Area |
| `damage` | Silver | Rare | +15% Total Damage |
| `icon` | Ikona (Icon) | Rare | -10% Cooldown |
| `garlic_ring` | Garlic Ring | Rare | +10% Area (evolution component) |
| `salt_passive` | Sol (Salt) | Uncommon | +10% Area, +5% Damage |
| `silver` | Srebro (Silver) | Rare | +15% Total Damage |
| `dove_coin` | Dove Coin | Uncommon | +20% Luck |
| `beer_coin` | Beer Coin | Common | +0.2 Move Speed, +1 Armor |
| `holy_bread` | Holy Bread | Rare | +50 Max HP |
| `holy_cheese` | Holy Cheese | Epic | +2.0 HP/sec |
| `sunflower_pouch` | Infinite Sunflower Pouch | Legendary | +1 Amount (projectiles) |
| `infinity_purse` | Babushka's Infinity Purse | Epic | +50% Greed (gold gain) |
| `spy_hat` | Gopnik Spy Hat | Epic | +20% Vision & Crit Chance |
| `pickled_gpu` | Pickled GPU | Legendary | -15% Cooldowns |
| `battle_scarf` | Babushka's Battle Scarf | Rare | +3 Armor, slows attackers |
| `ruby_ushanka` | Ruby Ushanka | Epic | +2 Armor, +10% Damage |

---

### Evolutions

**File:** `components/game/data/evolutions.ts`

| ID | Name | Base Weapon | Required Passive | Min Level | Effect |
|---|------|-------------|-----------------|-----------|--------|
| `soul_siphon` | Soul Siphon | Garlic | Garlic Ring | 8 | Massive power spike, heal per elite kill |
| `silver_tt33` | Silver TT33 | TT33 | Silver | 8 | Bonus undead damage & crit |
| `melter` | The Melter | Radioactive AK | Icon | 8 | Melts everything |

**Evolution Mechanics:**
- Base weapon must be level 5 (max level)
- Required passive must be owned (any level)
- Player must be level 8 or higher
- Evolution replaces base weapon with powered-up version
- Evolved weapons start at level 8 with 3-5x stats

---

### XP and Progression

**XP Gems:**
- Drop from defeated enemies
- XP value varies by enemy type (1-10)
- Elite enemies drop 2x XP
- Boss enemies drop 10x XP
- Automatically collected when within `magnet` radius

**Level-Up Scaling:**
```typescript
xpToNextLevel = floor(previousXP * 1.4)
// Level 1: 25 XP
// Level 2: 35 XP
// Level 3: 49 XP
// Level 4: 68 XP
// ... continues scaling
```

**Level-Up Choices:**
- Game pauses
- Show 3 random choices from eligible pool
- Choices can be:
  - New active weapon (if < 6 actives)
  - Upgrade existing active
  - New passive (if < 6 passives)
  - Upgrade existing passive
  - Evolution (if eligible)

---

## File Structure

```
handcash-fullstack-template/
├── components/
│   └── game/
│       ├── SlavicSurvivors.tsx           # Main game component (2,203 lines)
│       │                                  # Handles UI, game state, Three.js setup
│       │
│       ├── DevLog.tsx                     # In-game devlog viewer
│       │
│       ├── core/
│       │   ├── GameLoop.ts                # Fixed timestep game loop
│       │   └── Input.ts                   # Input handling system
│       │
│       ├── entities/
│       │   ├── Player.ts                  # Player entity with stats
│       │   ├── Enemy.ts                   # Enemy base class
│       │   ├── EntityManager.ts           # Entity lifecycle & pooling
│       │   ├── XPGem.ts                   # XP pickup entity
│       │   └── Projectile.ts              # Projectile entity
│       │
│       ├── systems/
│       │   ├── SpawnSystem.ts             # Enemy spawning logic
│       │   ├── AbilitySystem.ts           # Weapon & passive management
│       │   ├── VFXManager.ts              # Visual effects
│       │   ├── EventSystem.ts             # Game event system
│       │   │
│       │   ├── GarlicAura.ts              # Garlic Halo weapon
│       │   ├── DaggerWeapon.ts            # Hussar Lances weapon
│       │   ├── HolyWaterWeapon.ts         # Holy Water weapon
│       │   ├── AspenStakeWeapon.ts        # Aspen Stake weapon
│       │   ├── CrossWeapon.ts             # Cross Boomerang weapon
│       │   ├── SaltLineWeapon.ts          # Salt Circle weapon
│       │   ├── TT33Weapon.ts              # TT33 Handgun weapon
│       │   ├── RadioactiveAKWeapon.ts     # Radioactive AK weapon
│       │   ├── GhzelAKWeapon.ts           # Ghzel AK weapon
│       │   ├── CorruptedAKWeapon.ts       # Corrupted AK weapon
│       │   ├── MushroomAKWeapon.ts        # Mushroom AK weapon
│       │   ├── NuclearPigeon.ts           # Nuclear Pigeon companion
│       │   ├── LadaVehicle.ts             # Lada Vehicle
│       │   └── PropagandaTower.ts         # Propaganda Tower deployable
│       │
│       └── data/
│           ├── characters.ts              # Character definitions
│           ├── enemies.ts                 # Enemy type definitions
│           ├── actives.ts                 # Active weapon catalog
│           ├── passives.ts                # Passive item catalog
│           ├── evolutions.ts              # Evolution rules
│           └── worlds.ts                  # World/stage definitions
│
├── lib/
│   ├── ReplaySystem.ts                    # Replay recording & playback
│   └── SeededRandom.ts                    # Deterministic RNG
│
├── scripts/
│   └── devlog.js                          # CLI tool for devlog entries
│
├── devlog.txt                             # Development log
├── SLAVIC_SURVIVORS_IMPLEMENTATION.md     # Implementation plan
├── Slavic_Survivors_WebGL_GDD.md          # Game design document
└── SLAVIC_SURVIVORS_COMPLETE_OVERVIEW.md  # This file
```

---

## Implementation Status

### ✅ Completed Features

#### Phase 0: Setup
- [x] Three.js scene with orthographic camera
- [x] Basic rendering pipeline
- [x] Camera follow system
- [x] Tab integration in app

#### Phase 1: Foundation
- [x] Fixed timestep game loop (60Hz)
- [x] WASD/Arrow key input
- [x] Player entity with movement
- [x] FPS counter
- [x] Pause/unpause system

#### Phase 2: Combat
- [x] Enemy base class with AI
- [x] 7 enemy types implemented
- [x] Object pooling for enemies
- [x] Contact damage system
- [x] Invulnerability frames
- [x] Garlic Aura weapon
- [x] Damage numbers VFX
- [x] Game over state

#### Phase 3: Progression
- [x] XP gem drops
- [x] XP collection
- [x] Level-up system
- [x] Level-up choice screen
- [x] 25+ active weapons (various implementation levels)
- [x] 21 passive items
- [x] 3 evolutions
- [x] Evolution system

#### Phase 4: Content & Polish
- [x] 2 worlds (Dark Forest, Frozen Waste)
- [x] Procedural world generation
- [x] Obstacle collision
- [x] Elite enemies
- [x] Boss spawning (Leshy at 5 min)
- [x] Character selection screen
- [x] Multiple playable characters
- [x] Difficulty scaling
- [x] Mobile support
- [x] Touch controls
- [x] Fullscreen mode
- [x] Landscape orientation lock
- [x] Devlog system
- [x] Event system
- [x] Data-driven content (JSON)

### 🔄 Partially Implemented

- **Spatial Hash:** Planned but not yet implemented
- **Advanced Weapons:** Many weapons mapped to existing implementations
- **Relics:** System planned but not implemented
- **Meta Progression:** No persistent unlocks yet
- **Sound/Music:** Not implemented

### 📋 Planned Features

- Results screen improvements
- Leaderboard integration
- Replay system UI
- Additional weapons (full implementations)
- Relic system
- Meta progression (unlockables)
- More worlds/biomes
- Additional enemy types
- Sound effects and music
- Particle effects
- More evolutions
- Arcana system (god powers)
- Events (Kupala Night, Zadusnice)

---

## Development Guidelines

### Adding a New Weapon

1. Create weapon class in `components/game/systems/`
2. Implement required methods:
   - `constructor(player, entityManager, rng)`
   - `update(deltaTime)`
   - `upgrade()` - level up logic
   - `cleanup()` - dispose resources
   - `static getUpgradeDesc(level)` - UI descriptions
3. Add to `AbilitySystem.ts` in `createAbilityInstance()`
4. Add metadata to `components/game/data/actives.ts`
5. Add icon mapping in `SlavicSurvivors.tsx`

**Example Weapon Structure:**
```typescript
export class MyWeapon {
  level = 1
  damage = 10
  cooldown = 1.0
  private timer = 0
  
  constructor(
    private player: Player,
    private entityManager: EntityManager,
    private rng: SeededRandom
  ) {}
  
  update(deltaTime: number) {
    this.timer += deltaTime
    if (this.timer >= this.cooldown) {
      this.timer = 0
      this.fire()
    }
  }
  
  private fire() {
    // Weapon logic here
  }
  
  upgrade() {
    this.level++
    this.damage *= 1.2
    this.cooldown *= 0.9
  }
  
  cleanup() {
    // Dispose Three.js resources
  }
  
  static getUpgradeDesc(level: number): string {
    return `Level ${level}: +20% damage, +10% fire rate`
  }
}
```

### Adding a New Enemy

1. Add enemy definition to `components/game/data/enemies.ts`
2. Add case in `Enemy.setStatsByType()` method
3. Add color mapping in `EntityManager.spawnEnemy()`
4. Add to world's `availableEnemies` array
5. Test spawn and behavior

**Example Enemy Definition:**
```typescript
{
  "id": "my_enemy",
  "name": "My Enemy",
  "hp": 20,
  "damage": 15,
  "speed": 4.0,
  "description": "Description here"
}
```

### Adding a New Passive

1. Add to `components/game/data/passives.ts`
2. Add case in `AbilitySystem.applyPassiveEffect()`
3. Add icon mapping in `SlavicSurvivors.tsx`
4. Add upgrade description in `AbilitySystem.getUpgradeDescription()`

### Adding a New Evolution

1. Add to `components/game/data/evolutions.ts`
2. Add evolution rule to `AbilitySystem.evolutions` array
3. Implement evolved weapon class (or reuse existing with boosted stats)
4. Add to `AbilitySystem.createAbilityInstance()`

### Performance Best Practices

1. **Always use object pooling** for frequently created/destroyed entities
2. **Reuse Three.js materials** instead of creating new ones
3. **Use instancing** for identical meshes (planned)
4. **Minimize garbage collection** by reusing objects
5. **Profile regularly** - target 60 FPS with 300+ enemies
6. **Test on lower-end devices** for mobile compatibility

### Code Style

- TypeScript strict mode enabled
- Use interfaces for data structures
- Prefer composition over inheritance
- Keep weapon classes independent
- Use SeededRandom for all game randomness (not Math.random)
- Comment complex algorithms
- Use descriptive variable names

### Testing Checklist

When adding new features:
- [ ] No console errors
- [ ] 60 FPS maintained with 200+ enemies
- [ ] Works on mobile (touch controls)
- [ ] Level-up choices work correctly
- [ ] Evolutions trigger when eligible
- [ ] Visual effects dispose properly
- [ ] Game can be paused/unpaused
- [ ] Win/lose conditions work
- [ ] Stats apply correctly

---

## Asset Requirements

### 3D Models (Currently Using Primitives)
- Player: Capsule geometry (blue)
- Enemies: Sphere/capsule geometry (red/orange/purple)
- Projectiles: Small spheres
- XP Gems: Teal octahedrons
- Obstacles: Trees (cone + cylinder), Ice spikes (cone)

### UI Icons (Lucide Icons Used)
- Weapons: Sword, Zap, Circle, RotateCcw, Cloud, Crosshair, etc.
- Stats: Heart, Shield, Magnet, Trophy
- UI: Play, Pause, Settings, etc.

### Textures
- Ground: Solid colors per world
- Fog: Exponential fog matching world theme

### Animations (Not Yet Implemented)
- Player: Idle, walk
- Enemies: Idle, walk, attack, death
- Weapons: Fire, impact
- VFX: Hit sparks, explosions, auras

---

## Configuration & Tuning

### Key Balance Values

```typescript
// Player
BASE_HP = 100
BASE_MOVE_SPEED = 8.0
BASE_MAGNET = 2.5
IFRAME_DURATION = 0.5 // seconds

// Spawning
BASE_SPAWN_INTERVAL = 1.25 // seconds
BASE_SPAWN_COUNT = 2
SPAWN_RADIUS = 22 // units
BOSS_SPAWN_TIME = 300 // seconds (5 minutes)

// XP
BASE_XP_TO_LEVEL = 25
XP_SCALING = 1.4 // multiplier per level

// Abilities
MAX_ACTIVE_SLOTS = 6
MAX_PASSIVE_SLOTS = 6
MAX_ABILITY_LEVEL = 5
EVOLUTION_MIN_LEVEL = 8

// Performance
TARGET_FPS = 60
MAX_ENTITIES = 1500
```

### Difficulty Tuning

Located in world definitions:
- `difficultyMultiplier`: Scales enemy stats
- `spawnRateMultiplier`: Scales spawn frequency
- `progressionRateMultiplier`: Scales difficulty increase over time

---

## Known Issues

1. **No spatial hash yet** - Collision detection is O(n²), will need optimization for 500+ enemies
2. **Limited weapon variety** - Many weapons use same implementation with stat tweaks
3. **No persistent progression** - No meta unlocks between runs
4. **No sound** - Game is silent
5. **Basic visuals** - Using primitive shapes, no textures
6. **Mobile performance** - May struggle on older devices
7. **No accessibility options** - Screen shake, flashing cannot be disabled
8. **Limited UI polish** - Functional but not visually refined

---

## Future Roadmap

### Short Term (Next Updates)
- [ ] Results screen improvements
- [ ] More weapon implementations (full classes vs stat tweaks)
- [ ] Performance profiling and optimization
- [ ] Bug fixes based on testing

### Medium Term
- [ ] Spatial hash for collision detection
- [ ] Relic system
- [ ] Additional evolutions
- [ ] Sound effects
- [ ] Particle effects
- [ ] More enemy types

### Long Term
- [ ] Meta progression system
- [ ] Additional worlds/biomes
- [ ] Boss variety
- [ ] Arcana system (god powers)
- [ ] Event system (Kupala Night, etc.)
- [ ] Leaderboards
- [ ] Daily seeds
- [ ] Music
- [ ] Improved visuals (models, textures)

---

## Conclusion

Slavic Survivors is a feature-complete roguelite game with:
- ✅ Core gameplay loop (move, shoot, level up, survive)
- ✅ 7 enemy types with varied behaviors
- ✅ 25+ weapons across multiple categories
- ✅ 21 passive items
- ✅ Evolution system
- ✅ 2 worlds with procedural generation
- ✅ Mobile support
- ✅ Solid technical foundation

The game is playable and fun, with room for expansion in content, polish, and optimization.

**Current Version:** MVP with all core systems implemented  
**Performance:** Stable 60 FPS with 200+ enemies on desktop  
**Platforms:** Web (desktop + mobile)

---

*Last Updated: 2026-01-24*
