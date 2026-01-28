# Timeline Regeneration Summary

## Overview

The level timelines for Slavic Survivors have been regenerated using the mathematical balance system documented in `MATHEMATICAL_BALANCE_SYSTEM.md`. This ensures that enemy spawn rates and difficulty curves follow scientifically-designed formulas that maintain the power fantasy while preserving challenge.

## Changes Made

### 1. Mathematical Balance System

Created comprehensive balance formulas with three distinct game phases:

- **Early Game (0-5 min)**: Near-linear scaling, player power 15-25% above enemy threat
- **Mid Game (5-10 min)**: Polynomial/logarithmic blend for smooth transitions
- **Late Game (10+ min)**: Exponential scaling with controlled growth to prevent overflow

**Key Features:**
- Smooth sigmoid phase transitions (no hard breakpoints)
- Boss wave intervals every 5 minutes (300s) with 90-second duration
- Boss waves apply 3.5x HP multiplier and 1.75x spawn rate multiplier
- Power gap coefficient oscillates between 0.70-1.00 to create rhythm
- Overflow protection caps enemy HP at 1 billion

### 2. Timeline Regeneration Script

Created `scripts/regenerate-timelines.ts` which:

- Implements all balance formulas from the mathematical system
- Generates timeline events based on spawn rate calculations
- Distributes enemy types according to weighted progressions
- Preserves narrative messages and thematic elements
- Outputs properly formatted TypeScript timeline files

**Configuration per level:**
- Frozen Waste: 30 minutes, base spawn rate 2.5, 15-second intervals
- Catacombs: 21 minutes, base spawn rate 3.0, 12-second intervals

### 3. Updated Timeline Files

Regenerated both level timelines:

**Frozen Waste Timeline:**
- Duration: 1800 seconds (30 minutes)
- 9 boss events at key milestones (including Morozko finale)
- 19 elite spawns throughout the run
- Progressive enemy introduction (Zmora/Drifter → Wolves → Elementals → Golems)
- Spawn counts range from 8-75 enemies per event

**Catacombs Timeline:**
- Duration: 1260 seconds (21 minutes)
- 6 boss events including Ancient Crypt Lord finale
- 11 elite spawns
- Underground-themed progression (Bats/Crawlers → Flame Wraiths → Golems)
- Spawn counts range from 12-127 enemies per event

## Technical Details

### Spawn Rate Formula

```typescript
SR(t) = SR_base × [
    φ_early(t) × (1 + 0.008t) +
    φ_mid(t) × (1 + 0.02t^0.7) +
    φ_late(t) × (1 + 0.8 × log₂(1 + t/60))
] × B_spawn(t)
```

Where:
- `φ_early`, `φ_mid`, `φ_late` are sigmoid-based phase weights
- `B_spawn(t)` is the boss wave multiplier (1.75 during boss waves)
- Result is capped at `MAX_CONCURRENT_ENEMIES / 3` (500 enemies)

### Enemy Progression System

Each level defines weighted enemy progressions:

```typescript
{ id: "zmora", weight: 3, minTime: 0, maxTime: 180 }  // Heavy early presence
{ id: "ice_golem", weight: 0.5, minTime: 735 }        // Rare late-game spawn
```

The script distributes spawns proportionally based on weights, ensuring thematic progression while maintaining mathematical balance.

## Validation

The regeneration script includes validation output showing spawn rates at key intervals:

```
Time (s) | Player Lvl | Spawn Rate | Boss Wave
---------|------------|------------|----------
      60 |        3.4 |      45.54 | YES
     300 |       13.0 |      66.46 | YES
     600 |       19.0 |      45.98 | YES
     900 |       25.0 |      46.83 | YES
    1200 |       31.0 |      54.05 | YES
    1800 |       43.0 |      67.19 | YES
```

All boss wave timings align with 300-second intervals as designed.

## Usage

To regenerate timelines with modified parameters:

```bash
npx tsx scripts/regenerate-timelines.ts
```

Edit the configuration objects in the script to adjust:
- Level duration
- Base spawn rates
- Spawn intervals
- Enemy progressions (types, weights, timing)
- Boss/elite event placement
- Narrative messages

## Tunable Constants

Key constants that can be adjusted in `regenerate-timelines.ts`:

```typescript
// Spawn Rate Constants
const SR_BASE = 8.0              // Base enemies per second (5.0-12.0)
const EARLY_SPAWN_LINEAR = 0.008 // Early growth rate (0.005-0.012)
const MID_SPAWN_POLY = 0.02      // Mid growth coefficient (0.01-0.04)
const LATE_SPAWN_LOG = 0.8       // Late logarithmic coefficient (0.5-1.2)

// Boss Wave Constants
const BOSS_INTERVAL = 300        // Seconds between bosses (240-360)
const BOSS_DURATION = 90         // Boss wave duration (60-120)
const BOSS_SPAWN_MULTIPLIER = 1.75  // Spawn increase during boss (1.5-2.0)

// Performance Constants
const MAX_CONCURRENT_ENEMIES = 1500  // Hard cap (1000-2000)
```

## Benefits

1. **Mathematically Sound Balance**: Difficulty curves are predictable and reproducible
2. **Maintainability**: Single source of truth for balance calculations
3. **Flexibility**: Easy to adjust parameters and regenerate timelines
4. **Performance Safety**: Built-in caps prevent entity overflow
5. **Power Fantasy**: Maintains 15-25% player advantage during normal gameplay
6. **Challenge Peaks**: Boss waves create dramatic tension without frustration

## Future Work

- Add per-level difficulty modifiers (Easy/Normal/Hard modes)
- Implement dynamic difficulty adjustment based on player performance
- Create timeline visualizer tool for easier debugging
- Add support for custom level creation via the level editor
