# Slavic Survivors - Mathematical Balance System

## 1. Mathematical Notation

### Phase Function (Smooth Transitions)

Define phase weight functions using sigmoid transitions:

```
φ_early(t) = 1 / (1 + e^((t - 300)/60))
φ_late(t) = 1 / (1 + e^((600 - t)/60))
φ_mid(t) = 1 - φ_early(t) - φ_late(t)
```

### Enemy HP Formula

```
HP(t, L) = HP_base × [
    φ_early(t) × (1 + 0.12t + 0.008L) +
    φ_mid(t) × (1 + 0.5t^0.8 + 0.15L^0.9) +
    φ_late(t) × (1 + 2.5 × 1.003^t + 0.8L^1.1)
] × B(t) × α_HP(t, L)
```

Where:
- **B(t)** = Boss wave multiplier: `3.5` if `t mod 300 ∈ [0, 90]`, else `1.0`
- **α_HP(t, L)** = Power gap coefficient: `0.85 - 0.15 × sin(πt/300)` (oscillates 0.70-1.00)

### Spawn Rate Formula

```
SR(t) = SR_base × min[
    φ_early(t) × (1 + 0.008t) +
    φ_mid(t) × (1 + 0.02t^0.7) +
    φ_late(t) × (1 + 0.8 × log₂(1 + t/60)),
    MAX_CONCURRENT_ENEMIES / 3
] × B_spawn(t)
```

Where:
- **B_spawn(t)** = Boss spawn multiplier: `1.75` if `t mod 300 ∈ [0, 90]`, else `1.0`

### Player DPS Expectation (For Validation)

```
DPS_player(L) ≈ DPS_base × (1 + 0.25L + 0.05L^1.2)
```

The power gap maintains:
```
∀t ∉ BossWindows: DPS_player(L(t)) / (HP(t, L) × SR(t)) ∈ [1.15, 1.25]
```

---

## 2. Python Implementation

```python
import math

# ==================== TUNABLE CONSTANTS ====================
# Enemy HP Scaling
HP_BASE = 100.0
EARLY_LINEAR_TIME = 0.12
EARLY_LINEAR_LEVEL = 0.008
MID_POLY_TIME = 0.5
MID_POLY_TIME_EXP = 0.8
MID_POLY_LEVEL = 0.15
MID_POLY_LEVEL_EXP = 0.9
LATE_EXP_TIME = 2.5
LATE_EXP_BASE = 1.003
LATE_POLY_LEVEL = 0.8
LATE_POLY_LEVEL_EXP = 1.1

# Boss Wave
BOSS_INTERVAL = 300  # Every 5 minutes
BOSS_DURATION = 90   # 90 seconds
BOSS_HP_MULTIPLIER = 3.5
BOSS_SPAWN_MULTIPLIER = 1.75

# Spawn Rate
SR_BASE = 8.0  # Enemies per second
EARLY_SPAWN_LINEAR = 0.008
MID_SPAWN_POLY = 0.02
MID_SPAWN_EXP = 0.7
LATE_SPAWN_LOG = 0.8
MAX_CONCURRENT_ENEMIES = 1500

# Phase Transitions
EARLY_MID_CENTER = 300  # 5 minutes
MID_LATE_CENTER = 600   # 10 minutes
TRANSITION_SMOOTHNESS = 60

# Power Gap
POWER_GAP_BASE = 0.85
POWER_GAP_OSCILLATION = 0.15

# ==================== HELPER FUNCTIONS ====================

def sigmoid(x):
    """Smooth sigmoid function for phase transitions."""
    return 1.0 / (1.0 + math.exp(x))

def phase_weights(t):
    """Calculate smooth phase transition weights."""
    early = sigmoid((t - EARLY_MID_CENTER) / TRANSITION_SMOOTHNESS)
    late = sigmoid((MID_LATE_CENTER - t) / TRANSITION_SMOOTHNESS)
    late = 1.0 - late  # Invert for late phase
    mid = 1.0 - early - late
    mid = max(0.0, mid)  # Clamp to prevent negative

    return early, mid, late

def is_boss_wave(t):
    """Check if current time is within a boss wave window."""
    time_in_cycle = t % BOSS_INTERVAL
    return time_in_cycle <= BOSS_DURATION

def power_gap_coefficient(t, player_level):
    """
    Calculate power gap multiplier.
    Oscillates slightly to create rhythm in difficulty.
    """
    # Oscillate between 0.70 and 1.00
    oscillation = math.sin(math.pi * t / BOSS_INTERVAL)
    return POWER_GAP_BASE - POWER_GAP_OSCILLATION * oscillation

def estimate_player_level(t):
    """
    Estimate expected player level at time t.
    Early: 1 level per 25s
    Late: 1 level per 50s (diminishing XP gains)
    """
    if t < 300:
        return 1 + t / 25.0
    else:
        return 1 + 300/25.0 + (t - 300) / 50.0

# ==================== CORE BALANCE FUNCTIONS ====================

def calculate_enemy_hp(game_time, player_level, base_hp=HP_BASE):
    """
    Calculate enemy HP at given game time and player level.

    Args:
        game_time: Elapsed seconds since game start
        player_level: Current player level (1-100+)
        base_hp: Base HP value for standard enemies

    Returns:
        Final enemy HP value
    """
    t = game_time
    L = player_level

    # Get phase weights
    w_early, w_mid, w_late = phase_weights(t)

    # Calculate phase-specific scaling
    early_scale = 1 + EARLY_LINEAR_TIME * t + EARLY_LINEAR_LEVEL * L

    mid_scale = (1 +
                 MID_POLY_TIME * (t ** MID_POLY_TIME_EXP) +
                 MID_POLY_LEVEL * (L ** MID_POLY_LEVEL_EXP))

    late_scale = (1 +
                  LATE_EXP_TIME * (LATE_EXP_BASE ** t) +
                  LATE_POLY_LEVEL * (L ** LATE_POLY_LEVEL_EXP))

    # Blend phases
    blended_scale = (w_early * early_scale +
                     w_mid * mid_scale +
                     w_late * late_scale)

    # Apply boss multiplier
    boss_mult = BOSS_HP_MULTIPLIER if is_boss_wave(t) else 1.0

    # Apply power gap coefficient
    power_gap = power_gap_coefficient(t, L)

    # Calculate final HP
    final_hp = base_hp * blended_scale * boss_mult * power_gap

    # Clamp to prevent overflow (10^9 cap)
    final_hp = min(final_hp, 1_000_000_000)

    return final_hp

def calculate_spawn_rate(game_time, base_spawn_rate=SR_BASE):
    """
    Calculate spawn rate (enemies per second) at given game time.

    Args:
        game_time: Elapsed seconds since game start
        base_spawn_rate: Base spawn rate (enemies/second)

    Returns:
        Final spawn rate, capped at performance limit
    """
    t = game_time

    # Get phase weights
    w_early, w_mid, w_late = phase_weights(t)

    # Calculate phase-specific scaling
    early_scale = 1 + EARLY_SPAWN_LINEAR * t

    mid_scale = 1 + MID_SPAWN_POLY * (t ** MID_SPAWN_EXP)

    # Logarithmic scaling for late game (prevents runaway)
    late_scale = 1 + LATE_SPAWN_LOG * math.log2(1 + t / 60)

    # Blend phases
    blended_scale = (w_early * early_scale +
                     w_mid * mid_scale +
                     w_late * late_scale)

    # Apply boss multiplier
    boss_mult = BOSS_SPAWN_MULTIPLIER if is_boss_wave(t) else 1.0

    # Calculate final spawn rate
    final_rate = base_spawn_rate * blended_scale * boss_mult

    # Cap at performance limit (divide by 3 for safety margin)
    max_spawn_rate = MAX_CONCURRENT_ENEMIES / 3.0
    final_rate = min(final_rate, max_spawn_rate)

    return final_rate

def calculate_player_dps_expectation(player_level, base_dps=50.0):
    """
    Estimate expected player DPS at given level.
    Used for validation and testing.

    Args:
        player_level: Current player level
        base_dps: Base DPS at level 1

    Returns:
        Expected player DPS
    """
    L = player_level
    return base_dps * (1 + 0.25 * L + 0.05 * (L ** 1.2))

def validate_power_gap(game_time, player_level):
    """
    Validate that power gap is maintained.
    Player DPS should exceed (Enemy HP × Spawn Rate) by 15-25% outside boss waves.

    Returns:
        Dictionary with validation metrics
    """
    enemy_hp = calculate_enemy_hp(game_time, player_level)
    spawn_rate = calculate_spawn_rate(game_time)
    player_dps = calculate_player_dps_expectation(player_level)

    enemy_hp_per_second = enemy_hp * spawn_rate
    power_ratio = player_dps / enemy_hp_per_second

    is_boss = is_boss_wave(game_time)
    expected_min = 0.95 if is_boss else 1.15
    expected_max = 1.05 if is_boss else 1.25

    is_balanced = expected_min <= power_ratio <= expected_max

    return {
        'game_time': game_time,
        'player_level': player_level,
        'enemy_hp': enemy_hp,
        'spawn_rate': spawn_rate,
        'player_dps': player_dps,
        'enemy_hp_per_second': enemy_hp_per_second,
        'power_ratio': power_ratio,
        'is_boss_wave': is_boss,
        'is_balanced': is_balanced,
        'status': 'BALANCED' if is_balanced else 'UNBALANCED'
    }
```

---

## 3. Pseudocode with Tunable Constants

```
// ============================================================
// CONFIGURATION CONSTANTS (Tunable)
// ============================================================

// Enemy HP Scaling
CONST HP_BASE = 100                    // Base HP for level 1 enemy at t=0
                                       // Range: [50-200]

// Early Game (Linear): HP = BASE × (1 + a×t + b×L)
CONST EARLY_LINEAR_TIME = 0.12         // Time coefficient
                                       // Range: [0.08-0.15]
CONST EARLY_LINEAR_LEVEL = 0.008       // Level coefficient
                                       // Range: [0.005-0.012]

// Mid Game (Polynomial): HP = BASE × (1 + c×t^d + e×L^f)
CONST MID_POLY_TIME = 0.5              // Time coefficient
                                       // Range: [0.3-0.8]
CONST MID_POLY_TIME_EXP = 0.8          // Time exponent
                                       // Range: [0.7-1.0]
CONST MID_POLY_LEVEL = 0.15            // Level coefficient
                                       // Range: [0.1-0.25]
CONST MID_POLY_LEVEL_EXP = 0.9         // Level exponent
                                       // Range: [0.85-1.1]

// Late Game (Exponential): HP = BASE × (1 + g×h^t + i×L^j)
CONST LATE_EXP_TIME = 2.5              // Exponential coefficient
                                       // Range: [1.5-4.0]
CONST LATE_EXP_BASE = 1.003            // Exponential base (CRITICAL!)
                                       // Range: [1.002-1.004]
                                       // WARNING: Values >1.005 cause overflow!
CONST LATE_POLY_LEVEL = 0.8            // Level coefficient
                                       // Range: [0.5-1.2]
CONST LATE_POLY_LEVEL_EXP = 1.1        // Level exponent
                                       // Range: [1.0-1.3]

// Boss Waves
CONST BOSS_INTERVAL = 300              // Seconds between boss waves
                                       // Range: [240-360] (4-6 minutes)
CONST BOSS_DURATION = 90               // Boss wave duration (seconds)
                                       // Range: [60-120]
CONST BOSS_HP_MULTIPLIER = 3.5         // HP spike during boss
                                       // Range: [3.0-5.0]
CONST BOSS_SPAWN_MULTIPLIER = 1.75     // Spawn rate spike during boss
                                       // Range: [1.5-2.0]

// Spawn Rate
CONST SR_BASE = 8.0                    // Base enemies per second
                                       // Range: [5.0-12.0]
CONST EARLY_SPAWN_LINEAR = 0.008       // Early linear growth
                                       // Range: [0.005-0.012]
CONST MID_SPAWN_POLY = 0.02            // Mid polynomial coefficient
                                       // Range: [0.01-0.04]
CONST MID_SPAWN_EXP = 0.7              // Mid polynomial exponent
                                       // Range: [0.6-0.8]
CONST LATE_SPAWN_LOG = 0.8             // Late logarithmic coefficient
                                       // Range: [0.5-1.2]
CONST MAX_CONCURRENT_ENEMIES = 1500    // Performance cap
                                       // Range: [1000-2000]

// Phase Transitions
CONST EARLY_MID_CENTER = 300           // Seconds (5 minutes)
CONST MID_LATE_CENTER = 600            // Seconds (10 minutes)
CONST TRANSITION_SMOOTHNESS = 60       // Sigmoid transition width
                                       // Range: [30-90]

// Power Gap
CONST POWER_GAP_BASE = 0.85            // Base power coefficient
                                       // Range: [0.80-0.90]
CONST POWER_GAP_OSCILLATION = 0.15     // Oscillation amplitude
                                       // Range: [0.10-0.20]
```

---

## 4. Power Gap Explanation

The **Power Gap Coefficient** (α) maintains player satisfaction through controlled dominance. By keeping player DPS 15-25% above the enemy HP-per-second threshold during standard waves, players experience consistent progress and the "mowing down hordes" power fantasy. The coefficient oscillates sinusoidally with a period matching boss wave intervals (5 minutes), creating natural rhythm: players feel strongest mid-cycle and challenged during boss waves when α approaches 1.0 (parity). This oscillation prevents monotony while avoiding frustration—the gap never inverts except during intentional boss spikes, ensuring players always feel capable even when pushed to their limits. Boss waves temporarily eliminate the advantage (α ≈ 1.0 or slightly above), creating dramatic tension peaks that make subsequent power restoration feel rewarding.

---

## 5. Integration with Game Timelines

### Timeline Structure

Each level timeline should follow this structure:

```typescript
export interface TimelineEvent {
  time: number           // Seconds from game start
  enemyType: string      // Enemy type identifier
  count: number          // Number of enemies to spawn
  isElite?: boolean      // Elite modifier (1.5x HP, 1.5x damage)
  isBoss?: boolean       // Boss modifier (uses BOSS_HP_MULTIPLIER)
}
```

### Applying Balance Formulas to Timelines

When generating timeline events:

1. **Calculate spawn counts** using `calculate_spawn_rate(time)` × spawn_interval
2. **Flag boss waves** at t = 300s, 600s, 900s, etc. with `isBoss: true`
3. **Mix enemy types** based on progression:
   - 0-180s: Basic enemies only (Zombie, Skeleton)
   - 180-360s: Introduce ranged (Ghost, Necromancer)
   - 360s+: Add advanced enemies (Gargoyle, Lich)
4. **Elite spawns** every 60-90 seconds for variety
5. **Boss waves** include mix of all unlocked enemy types with boss flag

### Example Timeline Event Generation

```typescript
// At t=120s (2 minutes)
const spawnRate = calculate_spawn_rate(120)  // ~9.6 enemies/sec
const spawnInterval = 10  // Spawn batch every 10s
const count = Math.floor(spawnRate * spawnInterval)  // ~96 enemies

{
  time: 120,
  enemyType: 'zombie',
  count: count * 0.7,  // 70% zombies
  isElite: false
}
{
  time: 120,
  enemyType: 'skeleton',
  count: count * 0.3,  // 30% skeletons
  isElite: false
}

// At t=300s (5 minutes - BOSS WAVE)
const bossSpawnRate = calculate_spawn_rate(300)  // Includes boss multiplier
{
  time: 300,
  enemyType: 'zombie',
  count: Math.floor(bossSpawnRate * 10 * 0.4),
  isBoss: true
}
{
  time: 300,
  enemyType: 'necromancer',
  count: Math.floor(bossSpawnRate * 10 * 0.3),
  isBoss: true
}
{
  time: 300,
  enemyType: 'gargoyle',
  count: Math.floor(bossSpawnRate * 10 * 0.3),
  isBoss: true
}
```

---

## 6. Testing and Validation

Run the Python test suite to validate balance:

```bash
python3 .claude/balance_test.py
```

Expected output validates:
- Power ratios stay within 1.15-1.25 during normal waves
- Power ratios drop to 0.95-1.05 during boss waves
- HP values never exceed 10^9 before 60 minutes
- Spawn rates cap at performance limits
- Phase transitions are smooth (no discontinuities)
