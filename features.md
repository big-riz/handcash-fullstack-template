# Slavic Survivors — Complete Game Mechanics Catalog

---

## 1. PLAYER MECHANICS
**File:** `components/game/entities/Player.ts`

### Base Stats
| Stat | Default | Notes |
|---|---|---|
| maxHp | 100 | |
| moveSpeed | 8.0 | units/sec |
| xpToNextLevel | 35 | Scales per level |
| magnet | 2.5 | XP gem attraction radius |
| armor | 0 | Flat damage reduction |
| areaMultiplier | 1.0 | Weapon AoE multiplier |
| cooldownMultiplier | 1.0 | Weapon cooldown multiplier (lower=faster) |
| damageMultiplier | 1.0 | All outgoing damage |
| critRate | 0.05 | 5% base crit chance |
| critDamage | 2.0 | 2x crit multiplier |
| regen | 0 | HP/sec |
| luck | 1.0 | Drop rate modifier |
| amount | 0 | Extra projectiles |
| projectileSpeedMultiplier | 1.0 | |
| durationMultiplier | 1.0 | |
| growth | 1.0 | XP gain multiplier |
| curse | 1.0 | Enemy difficulty multiplier |
| revival | 1 | Death revives |
| rerolls | 3 | Level-up rerolls |
| thorns | 0 | Fraction of incoming damage returned |
| lifesteal | 0 | Fraction of damage dealt healed |

### Movement
- Acceleration: 80 units/sec²
- Deceleration: 60 units/sec²
- Diagonal movement normalized (no speed boost)

### Damage Taken Formula
```
cursedAmount = rawDamage * player.curse
actualDamage = max(1, cursedAmount - player.armor)
```
- Invincibility frames: 0.35s after hit
- DOT bypasses iframes AND armor
- Thorns: returns `actualDamage * thorns` to attacker
- Lifesteal: heals `damageDealt * lifesteal`

### XP / Leveling
- XP curve: `xpToNextLevel *= 1.18` each level (starts at 35)
- Growth multiplies XP: `actualXP = gemXP * growth`

### Hitbox & Knockback
- Player radius: 0.5 units
- Pull duration (knockback recovery): 0.35s

### Revival
- On death with revival > 0: revive at 50% HP, brief invulnerability

### Status Effects
- POISON, BURN, BLEED: damage per tick, bypasses iframes/armor
- SLOW, FREEZE: reduces moveSpeed
- CURSE: multiplies incoming damage

---

## 2. WEAPONS / ACTIVE ABILITIES

**Files:** `components/game/systems/AbilitySystem.ts`, `components/game/content/weapons/*.ts`

- MAX_ACTIVES = 6, MAX_PASSIVES = 6, MAX_LEVEL = 5
- DPS Balance Formula: `Base DPS = 30 + (minLevel - 1) * 5`

### STARTER WEAPONS (minLevel 1, ~30 DPS)

#### TT33 Pistol — `content/weapons/TT33Weapon.ts`
- 15 damage, 0.5s CD, 25 speed, 0 pierce
- Lv2: dmg×1.2 | Lv3: CD×0.8 | Lv4: dmg×1.5 | Lv5: CD×0.7

#### Babushka's Shank — `content/weapons/MeleeWeapon.ts`
- 12 damage, 0.4s CD, 1.5 radius, 0.2s swing, 108° arc
- Lv2: radius×1.3 | Lv3: dmg×1.5 | Lv4: CD×0.7 | Lv5: arc+54°, dmg×1.25

#### Ceramic Knuckles — `content/weapons/MeleeWeapon.ts`
- 30 damage, 1.0s CD, 1.2 radius, 0.4s swing, 72° arc

#### Stilleto — `content/weapons/DaggerWeapon.ts`
- 10 damage, 0.67s CD, 20 speed, 1.0s lifetime, 2 count
- Lv2: +1 count | Lv3: dmg×1.5 | Lv4: CD×0.7 | Lv5: +1 count

#### Dagger — standalone
- 18 damage, 0.8s CD, 18 speed, 1.5s lifetime, 1 count

### UNCOMMON WEAPONS (minLevel 2-3, ~35 DPS)

#### Peppermill Gun — TT33 variant
- 7 damage, 0.2s CD (DPS: 35)

#### Soviet Stick — MeleeWeapon variant
- 35 damage, 1.0s CD, 2.5 radius, 0.35s swing, 126° arc

#### Vampire Rat — `content/weapons/NuclearPigeon.ts`
- 28 damage, 0.8s fire CD, 2.5 orbit radius, 3.0 orbit speed

#### Pig Luggage — NuclearPigeon variant
- 20 damage, 0.8s CD, 3.0 orbit radius, 2.0 orbit speed
- Drops 3 HP pickups every 5s; scales to 6 pickups/3s at Lv5

### RARE WEAPONS (minLevel 4-6, ~45-55 DPS)

#### Ka-Bar — DaggerWeapon variant
- 27 dmg, 0.6s CD

#### Gopnik Grail — `content/weapons/GarlicAura.ts`
- 18 damage, 3.5 radius, 0.4s tick interval (continuous AoE)
- Lv2: dmg×1.3 | Lv3: radius×1.2 | Lv4: dmg×1.4 | Lv5: radius×1.3

#### Holy Water — `content/weapons/HolyWaterWeapon.ts`
- 5 damage, 5.0s CD, 1 count, 1.5 radius, 4.0s lifetime, 0.7s tick
- Lv2: radius×1.3 | Lv3: +1 count | Lv4: dmg×1.5 | Lv5: +2s lifetime

#### Cross — `content/weapons/CrossWeapon.ts`
- 20 damage, 3.0s CD, 12 speed, 1 count, 4.0s lifetime, boomerang return
- Lv2: dmg×1.5 | Lv3: +1 count | Lv4: speed×1.2 | Lv5: CD×0.7

#### Aspen Stake — `content/weapons/AspenStakeWeapon.ts`
- 30 damage, 1.3s CD, 20 speed, 1 count
- Lv2: dmg×1.4 | Lv3: CD×0.8 | Lv4: +1 count | Lv5: dmg×2.0

#### Salt Line — `content/weapons/SaltLineWeapon.ts`
- 8 damage, 6.0s CD, 4.0 radius, 3.0s lifetime, 0.3s tick, 0.5 knockback
- Lv2: radius×1.2 | Lv3: dmg×1.5 | Lv4: +2s lifetime | Lv5: CD×0.8

#### Propaganda Tower — `content/weapons/PropagandaTower.ts`
- 15 damage, 5.0s deploy CD, range 4, 12s duration, 0.5 slow amount, 1.0s pulse, 0.8s slow duration
- Lv2: range×1.2 | Lv3: dmg×1.3 | Lv4: +4s duration | Lv5: CD×0.8

#### Dadushka Chair / Tank Stroller — `content/weapons/LadaVehicle.ts`
- 55 damage, 15 speed, 5s duration, 20s CD, 2.5 hit radius
- Lv2: +2s duration | Lv3: dmg×1.5 | Lv4: CD−5s | Lv5: +3s duration, dmg×2

### EPIC WEAPONS (minLevel 7-9, ~60-70 DPS)

#### Gzhel SMG — `content/weapons/GhzelAKWeapon.ts`
- 15 damage, 0.25s CD, 40 speed, +0.15 bonus crit
- Lv2: +0.1 crit | Lv3: dmg×1.4 | Lv4: CD×0.8 | Lv5: +0.2 crit, dmg×1.5

#### Kvass Reactor — PropagandaTower variant, 24 damage

#### Skull Screen — GarlicAura variant, 26 damage, 4.0 radius

#### Gopnik Gondola — LadaVehicle variant, 70 damage

#### Radioactive AK — `content/weapons/RadioactiveAKWeapon.ts`
- 10 damage, 0.4s CD, 30 speed, 0.2 melt chance
- Lv4+: 3-round burst (0.1s between shots)
- Lv2: dmg×1.3 | Lv3: CD×0.85 | Lv4: burst + dmg×1.2 | Lv5: dmg×1.5, CD×0.7

### LEGENDARY WEAPONS (minLevel 10+, ~75-95 DPS)

#### Orthodox Visors — TT33 variant: 38 dmg, 0.5s CD (76 DPS)

#### Nuclear Pigeon
- 60 damage, 0.8s fire CD, 2.5 orbit, 3 orbit speed, 10 range

#### Haunted Lada — LadaVehicle variant: 85 damage, 1.3 speed modifier

#### Big Biz Lada — LadaVehicle variant: 95 damage

### AK VARIANTS

#### Corrupted AK — `content/weapons/CorruptedAKWeapon.ts`
- 14 damage, 0.5s CD, 35 speed, 5% lifesteal (heals 1 HP)
- Lv2: dmg×1.25 | Lv3: +3% lifesteal | Lv4: CD×0.8 | Lv5: dmg×1.5, +5% lifesteal

#### Mushroom AK — `content/weapons/MushroomAKWeapon.ts`
- 10 bullet, 5 cloud damage, 2 cloud radius, 3s cloud duration, 0.7s CD
- Cloud ticks 5×/sec
- Lv2: cloudR×1.3 | Lv3: cloudDmg×1.5 | Lv4: +2s cloud | Lv5: CD×0.7, cloudDmg×2

---

## 3. PASSIVE ITEMS

**File:** `components/game/systems/AbilitySystem.ts`, `components/game/data/passives.ts`

Each passive stacks per level. Max 5 levels, max 6 passives.

| ID | Name | Rarity | Effect per Level |
|---|---|---|---|
| beer_coin | Beer Coin | Common | +0.3 moveSpeed, +1 armor |
| boss_shoe | Boss Shoe | Common | +0.5 moveSpeed |
| dove_coin | Dove Coin | Uncommon | +0.2 luck |
| garlic_ring | Garlic Ring | Uncommon | areaMultiplier ×1.15 |
| bone_charm | Bone Charm | Uncommon | damageMultiplier ×1.10, +10 maxHp |
| holy_bread | Holy Bread | Rare | +40 maxHp |
| battle_scarf | Battle Scarf | Rare | +3 armor |
| crypt_lantern | Crypt Lantern | Rare | areaMultiplier ×1.15, +0.5 regen |
| holy_cheese | Holy Cheese | Epic | +2.0 regen |
| spy_hat | Spy Hat | Epic | +0.2 critRate |
| infinity_purse | Infinity Purse | Epic | +0.2 growth |
| ruby_ushanka | Ruby Ushanka | Epic | +2 armor, damageMultiplier ×1.15 |
| sunflower_pouch | Sunflower Pouch | Legendary | +1 amount (extra projectile) |
| pickled_gpu | Pickled GPU | Legendary | cooldownMultiplier ×0.80 |

---

## 4. EVOLUTION SYSTEM

**File:** `components/game/systems/AbilitySystem.ts`

Requirement: Base weapon at level 5 + specific passive owned (any level). Evolution sets internal level to 8 (no further upgrades).

| Base Weapon | Required Passive | Evolution | Stats |
|---|---|---|---|
| skull_screen | garlic_ring | soul_siphon | dmg×4, radius×1.6 |
| tt33 | spy_hat | silver_tt33 | dmg×3, CD×0.5 |
| gzhel_smg | pickled_gpu | melter | dmg×5, CD×0.4 |
| peppermill | beer_coin | vodka_flamethrower | 45 dmg, 0.1s CD |
| shank | dove_coin | phantom_blade | 50 dmg, 0.2s CD, 2.5 radius, 0.1s swing |
| tank_stroller | ruby_ushanka | orbital_tank | 200 dmg vehicle |
| nuclear_pigeon | spy_hat | death_pigeon | 150 dmg, 0.6s fire CD |
| haunted_lada | holy_cheese | immortal_lada | 170 dmg, 1.5 speed |
| propaganda_tower | pickled_gpu | propaganda_storm | dmg×4 |
| kabar | battle_scarf | assassins_edge | 60 dmg, 0.3s CD, 22 speed |
| knuckles | holy_bread | iron_fist | 80 dmg, 0.5s CD, 2.0 radius, 108° arc |
| holywater | garlic_ring | blessed_flood | dmg×4 |
| cross | holy_cheese | divine_cross | dmg×4 |
| stilleto | boss_shoe | storm_blades | 35 dmg, 0.15s CD, 5 count, 28 speed |
| dagger | bone_charm | bone_daggers | 45 dmg, 0.35s CD, 4 count, 18 speed |
| stake | crypt_lantern | blazing_stakes | dmg×5, CD×0.4 |
| grail | infinity_purse | eternal_grail | 40 dmg, 6.0 radius aura |
| ak_radioactive | sunflower_pouch | nuclear_spray | dmg×4, CD×0.3 |

---

## 5. SYNERGY SYSTEM

**File:** `components/game/systems/AbilitySystem.ts`

Requires owning all 3 items. Applied when loadout changes.

| ID | Name | Required Items | Bonus |
|---|---|---|---|
| soviet_arsenal | Soviet Arsenal | tt33, battle_scarf, propaganda_tower | cooldownMultiplier ×0.7 |
| gopnik_gang | Gopnik Gang | shank, beer_coin, boss_shoe | areaMultiplier ×1.2 |
| nuclear_winter | Nuclear Winter | nuclear_pigeon, pickled_gpu, ruby_ushanka | dmgMult ×1.25, areaMult ×1.15 |
| speed_demon | Speed Demon | boss_shoe, beer_coin, dove_coin | moveSpeed ×1.4 |
| tank_build | Tank Build | battle_scarf, holy_bread, ruby_ushanka | +10 armor, +50 maxHp |
| lucky_charm | Lucky Charm | dove_coin, infinity_purse, sunflower_pouch | luck ×2.0, growth ×1.5 |
| undead_hunter | Undead Hunter | stake, spy_hat, dove_coin | dmgMult ×1.35, amount +1 |
| holy_crusade | Holy Crusade | cross, holywater, holy_bread | dmgMult ×1.5, +20 maxHp |
| crypt_raider | Crypt Raider | kabar, dagger, boss_shoe | critRate +0.25, moveSpeed +0.3 |
| skull_warrior | Skull Warrior | skull_screen, knuckles, bone_charm | areaMult ×1.3, dmgMult ×1.2 |

---

## 6. ENEMIES

**File:** `components/game/entities/Enemy.ts`

### Standard Enemies

| Type | HP | Speed | Damage | XP | Radius | Special |
|---|---|---|---|---|---|---|
| drifter | 20 | 3.8 | 16 | 1 | 0.3 | Basic melee |
| screecher | 10 | 5.0 | 12 | 1 | 0.25 | Fast, fragile |
| bruiser | 78 | 2.2 | 20 | 3 | 0.55 | Tanky |
| zmora | 16 | 4.0 | 12 | 1 | 0.3 | Ghost flicker; invulnerable every 2s |
| domovoi | 5 | 5.0 | 8 | 1 | 0.15 | Tiny swarm unit |
| kikimora | 33 | 2.8 | 15 | 2 | 0.4 | Slow web every 10s (r2.5, 6s) |
| sapling | 10 | 3.2 | 12 | 1 | 0.2 | Basic forest mob |
| tox_shroom | 32 | 0 | 15 | 2 | 0.4 | Stationary; poison cloud on death (r3, 8s, 10dmg) |
| stone_golem | 130 | 1.5 | 30 | 5 | 0.8 | Ground slam every 8s, range 5, knockback 4 |
| spirit_wolf | 52 | 5.5 | 20 | 3 | 0.35 | Phases through obstacles |
| leshy_shaman | 78 | 2.5 | 25 | 4 | 0.4 | Buff+heal aura r6, heals 3% maxHP/s |
| vodnik | 16 | 3.0 | 8 | 2 | 0.35 | Pull every 6s, 0.8s telegraph, range 12 |
| werewolf | 120 | 4.2 | 25 | 5 | 0.45 | Enrage <30% HP: +50% dmg, +30% speed; heals 10% maxHP/4s |
| forest_wraith | 200 | 3.5 | 30 | 8 | 0.5 | Weaken aura r6 (factor 0.7), flicker invuln/1.5s |
| wasp_swarm | 65 | 5.5 | 10 | 3 | 0.3 | Fast flying |
| shadow_stalker | 97 | 5.5 | 35 | 6 | 0.3 | Dash every 5s (0.5s delay, 0.5s duration, 3x speed) |
| frost_bat | 15 | 5.5 | 8 | 1 | 0.2 | Basic flyer |
| bone_crawler | 45 | 3.0 | 22 | 2 | 0.35 | Slow web every 8s |
| flame_wraith | 70 | 5.0 | 28 | 3 | 0.35 | Weaken aura r4 (factor 0.75) |
| frost_elemental | 55 | 4.0 | 22 | 2 | 0.4 | Ice patch every 7s (r2.5, 8s) |
| snow_wraith | 180 | 5.5 | 48 | 5 | 0.45 | Phase through, weaken aura r5 (factor 0.65) |
| blizzard_wolf | 35 | 5.5 | 16 | 2 | 0.3 | Fast pack hunter |

### Boss Enemies

| Type | HP | Speed | Damage | XP | Radius |
|---|---|---|---|---|---|
| leshy | 650 | 1.8 | 40 | 10 | 1.2 |
| guardian_golem | 800 | 2.0 | 50 | 20 | 1.0 |
| ancient_treant | 3250 | 1.0 | 60 | 100 | 1.5 |
| golem_destroyer | 5200 | 2.0 | 75 | 150 | 1.3 |
| crypt_guardian | 12000 | 1.8 | 80 | 200 | 1.2 |
| ice_golem | 7000 | 1.5 | 65 | 150 | 1.1 |
| chernobog | 19500 | 3.0 | 100 | 1000 | 2.0 |

### Multipliers
- **Elite**: 4× HP, 2× damage, 2× XP
- **Contact damage**: `enemy.damage × 0.7 × buffMultiplier` (1.3 if shaman-buffed)
- **Super enemy** (combined): sum of merged HP, flat 3 XP, 2× radius

---

## 7. BOSS PHASE SYSTEM

**File:** `components/game/systems/BossPhaseManager.ts`

Phase transitions trigger at HP % thresholds. Ability cooldowns start at 50% when entering a new phase.

### Ancient Treant (3 phases)
- **Phase 1** (100%): Root slam/5s (3 poison zones r2.5/4s/15dmg + melee r4.0)
- **Phase 2** (60%): 1.2× dmg; root slam/6s + sapling swarm/6s (5 saplings); enter: burst 8 saplings
- **Phase 3** (25%): 2× speed, 1.5× dmg; rage slam/3s (5 poison zones r3.5/5s/20dmg + melee r6.0) + sapling burst/4s (6)

### Leshy (3 phases)
- **Phase 1** (100%): Wolf cross/8s (4 spirit wolves), nature bolt/3s
- **Phase 2** (55%): 1.2× speed, 1.3× dmg; wolf cross/7s (6), vine arena/12s (12+8 obstacles); enter: 6 wolves
- **Phase 3** (20%): 1.5× speed, 1.5× dmg; rotating barrage/2.5s (12-way), wolf spam/5s (4), vine trap/10s; enter: 10 wolves

### Chernobog (3 phases)
- **Phase 1** (100%): Shadow volley/3s (8-way), minion summon/15s (5)
- **Phase 2** (60%): 1.2× speed, 1.3× dmg; shadow barrage/2.5s (12-way), corruption zones/6s (4 poison r3/8s/12dmg), minions/12s (6); enter: 6 poison rings
- **Phase 3** (25%): 1.5× speed, 1.8× dmg; eclipse barrage/1.5s (16-way), corruption carpet/4s (6), eclipse summon/8s (8), melee slam/6s (r8.0, 2× boss dmg); enter: 12 poison + 6 shadow stalkers

### Guardian Golem (2 phases)
- **Phase 1** (100%): Wall trap/10s (5 obstacles behind player)
- **Phase 2** (50%): 1.3× speed, 1.5× dmg; wall cage/8s (8 obstacles), ground slam/5s (r5.0, 1.5× dmg)

### Golem Destroyer (2 phases)
- **Phase 1** (100%): Charge/7s
- **Phase 2** (50%): 1.5× speed, 1.5× dmg; rapid charge/4s, rock throw/3s (3-way spread)

### Crypt Guardian (2 phases)
- **Phase 1** (100%): Bone rain/5s (6-way), summon crawlers/10s (4)
- **Phase 2** (50%): 1.3× speed, 1.5× dmg; bone storm/3s (10-way), summon wraiths/8s (3 flame + 4 bone), death slam/6s (r6.0, 2× dmg); enter: 6 flame wraiths

### Ice Golem (2 phases)
- **Phase 1** (100%): Ice shards/4s (6-way with slow)
- **Phase 2** (50%): 1.3× speed, 1.4× dmg; blizzard shards/3s (10-way), frost zone/8s (4 slow zones), summon wolves/10s (4); enter: 6 slow hazard zones

---

## 8. SPAWN SYSTEM

**File:** `components/game/systems/SpawnSystem.ts`

### Background Spawning
- Base interval: 10.0s, min: 1.6s
- Formula: `max(minInterval, 10.0 × max(0.16, pow(0.85, minutesElapsed)))`
- Post-timeline: intervalScale ×0.25, min = 0.4s
- Spawn clock **freezes** while boss is alive

### Enemy Count Per Spawn
```
count = baseCount × pow(1.25, minutesElapsed) + floor(minutesElapsed / 3) × bonus
```
- Normal: baseCount=3, bonus=5
- Post-timeline: baseCount=6, bonus=10

### Elite Spawning
- After 5 minutes of game time
- Every 3rd spawn (post-timeline) or every 5th (normal)

### Spawn Patterns (6, cycling)
1. Even ring  2. Dual arcs  3. Cross  4. Triangle  5. Diamond  6. Spiral arms
- Spawn distance: 16 units from player
- MIN_SPAWN_GAP: 2.5 units between enemies

---

## 9. TIMELINE EVENTS

### Dark Forest — `components/game/data/dark_forest_timeline.ts`
- 140 events, 0.5s–897.5s (~15 min)
- Phase 1 (0:00-1:30): Drifters, saplings, screechers, bruisers
- Phase 2 (1:30-4:00): Forest wraith elite, vodnik, stone golem, tox_shroom, werewolf elite
- Phase 3 (4:00-6:00): Guardian Golem BOSS at 270s, werewolf elites
- Phase 4 (6:00-9:00): Ancient Treant BOSS at 435s, leshy shaman, wasp swarm
- Phase 5 (9:00-12:30): Leshy BOSS at 560s, shadow stalkers, massive hordes
- Phase 6 (12:30-14:30): Golem Destroyer elite, shadow stalkers, elite hunts
- Final (14:30-15:00): Chernobog BOSS at 885s + escort waves

### Catacombs — `components/game/data/catacombs_timeline.ts`
- 125 events, 0.5s–905s (~15 min)
- Bosses: Crypt Guardian @270s, @435s, @560s, @885s

### Frozen Waste — `components/game/data/frozen_waste_timeline.ts`
- 125 events, 0.5s–905s (~15 min)
- Bosses: Ice Golem @270s, @435s, @560s, @885s

---

## 10. ENEMY COMBINATION SYSTEM

**File:** `components/game/systems/EnemyCombinationSystem.ts`

- Check interval: every 0.5s
- Cluster threshold: 10+ same-type enemies within 3.0 unit radius
- Excludes bosses, elites, existing super enemies
- Despawns all 10 (no XP), spawns 1 super enemy with combined HP, flat 3 XP, 2× radius

---

## 11. LEVEL UP SYSTEM

**File:** `components/game/systems/LevelUpSystem.ts`

- Filters by world's allowedUpgrades list
- Removes banished items
- Checks capacity (6 active, 6 passive max)
- Level gating: new items require player level >= item.minLevel
- Balance check: can only upgrade ability if its level <= min level of all owned same-type items
- Evolution choices appear when base at Lv5 + required passive owned

---

## 12. XP / GEM SYSTEM

**File:** `components/game/entities/XPGem.ts`

- Magnet speed: 12 units/sec toward player
- Collection distance: 0.5 units
- Gem radius: 0.15 units
- Player base magnet range: 2.5 units
- Formula: `actualXP = baseXP × player.stats.growth`

---

## 13. VFX SYSTEM

**File:** `components/game/systems/VFXManager.ts`

- maxEffects = 500 (pre-allocated pool)
- Sprite pool: 50, Material pool: 50, Texture cache: 500
- Damage number: 1.2s lifetime, upward velocity 2.5, gravity 12 units/s²
- Emoji effects: 0.6s lifetime, random velocity spread
- Level up burst: 12 particles, 0.6s lifetime
- Particle burst: 0.4s lifetime

---

## 14. AIRDROP SYSTEM

**File:** `components/game/systems/AirdropSystem.ts`

- Activates at player level 10
- Interval: 60s between drops
- First drop: 75% of interval after activation (45s)
- Spawn distance: 30-50 units from player (random angle)
- Fall duration: 5s
- Max ground time: 30s before auto-despawn
- Collection radius: 2.0 units
- Reward: triggers upgrade choice screen

---

## 15. GAME LOOP

**File:** `components/game/core/GameLoop.ts`

- Fixed timestep: 16.67ms (60 Hz)
- Accumulator pattern with 250ms cap (death spiral prevention)
- FPS tracking: rolling average over last 60 frames

---

## 16. INPUT SYSTEM

**File:** `components/game/core/Input.ts`

- WASD / Arrows: movement
- ESC: pause
- Q / Minus: zoom in
- E / Equal: zoom out
- F3: performance overlay
- Touch: pointer relative to screen center, 30px dead zone
- Mouse wheel: zoom

---

## 17. SPATIAL PARTITIONING

**File:** `components/game/core/Quadtree.ts`

- AABB-based quadtree, MAX_DEPTH = 8
- World bounds: 1000×1000 units
- Used in EntityManager for collision detection

---

## 18. WORLDS / STAGES

**File:** `components/game/data/worlds.ts`

| World | Max Level | Win Condition | Difficulty Mult | Enemy Types |
|---|---|---|---|---|
| Dark Forest | 30 | Reach level 30 | 1.0 | 20 |
| Frozen Waste | 50 | Reach level 50 | 1.5 | 14 |
| Catacombs | 40 | Reach level 40 | 1.2 | 9 |

### Ground Themes
- Dark Forest: mossy_patches (0x3d453d base, 0x0a1a08 secondary)
- Frozen Waste: snow_ice (0xddeeff base, 0x556688 secondary)
- Catacombs: stone_cracks (0x2a2a35 base, 0x050510 secondary)

---

## 19. PROCEDURAL MESHES

**File:** `components/game/data/proceduralMeshConfigs.ts`

| World | Total | Min Spacing | Max Radius |
|---|---|---|---|
| Dark Forest | 250 | 3.5 | 200 |
| Frozen Waste | 200 | 3.8 | — |
| Catacombs | 180 | 3.5 | — |

Each config includes mesh types (tree, rock, pillar, etc.) and formations (temple_ruins, stone_circle, graveyard, etc.) with collision radii 0–6.0 and min spawn distances 8–25 units.

---

## 20. CHARACTERS

**File:** `components/game/data/characters.ts`

| Character | HP | Speed | Might | Special | Starting Loadout |
|---|---|---|---|---|---|
| Boris the Gopnik | 120 | 1.2 | 1.0 | — | tt33 |
| Babushka Zina | 120 | 1.0 | 1.2 | 1.5 area | shank + holy_bread |
| Vadim Hunter | 100 | 1.1 | 0.95 | 0.9 CD mult | stilleto + battle_scarf |
| Big Biznisman | 90 | — | — | 2.0 luck, 2.0 greed | pig_luggage + beer_coin |
| The Oligarch | 250 | 0.75 | — | 10 armor | big_biz_lada + infinity_purse |
| Chernobyl Ghost | 80 | — | 2.5 | 3.0 area, -1.0 regen, 1.5 curse | kvass_reactor + nuclear_pigeon + pickled_gpu |
| Slavic Spirit | 40 | 1.4 | 0.5 | 0.2 CD mult, -5 armor, +2 amount | grail + cross + ruby_ushanka |
| Koshchei the Deathless | 70 | — | 1.5 | 2.0 area | dagger + holywater + bone_charm |
| Strigoi Vampire | 60 | 1.3 | 1.8 | -3 armor, -0.5 regen, 0.5 thorns, 0.15 lifesteal, 0.25 crit, 2.5 critDmg | vampire_rat + shank + spy_hat |

---

## 21. HAZARD ZONES

**File:** `components/game/entities/HazardZone.ts`

- Types: poison, slow, curse
- Default: 2.0 radius, 5 dmg/sec, 5.0s lifetime, 0.5s damage interval
- slowFactor: 0.80 (20% slow)
- Colors: poison=0x00ff00, slow=0x0066ff, curse=0x8800ff
- Opacity fades: `max(0.3, lifePercent × 0.7)`
- Tox_shroom death: poison (r3, 8s, 10dmg)
- Kikimora death: slow (r2.5, 6s)

---

## 22. ENTITY MANAGEMENT

**File:** `components/game/entities/EntityManager.ts`

- Hard cap: 1500 instanced entities
- Enemy separation: strength=2.0, radius = enemy.radius × 3
- Shaman heal aura: 3% maxHP/s to nearby allies
- Weaken aura: reduces player.externalDamageMultiplier by wraith's factor
- Projectile slow: 0.80 factor, 3s | Projectile curse: 1.5× multiplier, 5s

---

## 23. MELEE SWING

**File:** `components/game/entities/MeleeSwing.ts`

- Default arc: 108° (PI × 0.6), radius: 3.0, duration: 0.3s
- Easing: `1 - pow(1 - progress, 3)` (cubic ease-out)
- Tracks hit enemies per swing (no double damage)
- Scaled by player.stats.areaMultiplier

---

## 24. PROJECTILE MECHANICS

**File:** `components/game/entities/Projectile.ts`

- Default lifetime: 3.0s, radius: 0.2
- Can apply slow (3.0s) or curse (5.0s) on hit
- Straight-line travel; despawns on lifetime or hit (unless pierce > 0)

---

## 25. VOICELINE SYSTEM

**File:** `components/game/data/timeline_voicelines.ts`

- Dark Forest: 31 voicelines (~30s intervals, 0-900s)
- Catacombs: 41 voicelines (~30s intervals, 0-1200s)
- Frozen Waste: 60 voicelines (~30s intervals, 0-1770s)
- Voice ID: `Russian_AttractiveGuy`
