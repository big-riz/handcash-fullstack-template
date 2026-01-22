# Slavic Survivors — Nav/Yav/Prav Infestation (WebGL Canvas)  
**Game Design Document (GDD)**  
Version: 1.0  
Date: 2026-01-21  

---

## 1. One‑page overview

### High-level concept
A **Vampire Survivors–style roguelite** framed as a Slavic **nav / yav / prav** infestation. You survive escalating swarms of spirits, undead, and folk monsters while assembling **anti‑vampire kits**, **obereg charms**, and **ritual upgrades**—plus a satirical “Goplandia contraband” arsenal (AKs, Ladas, cursed coins, and questionable tech).

### Core loop
1. Move (WASD) in a top‑down arena.  
2. Weapons auto‑fire / auto‑trigger.  
3. Enemies swarm → you kite / hold ground / mount up.  
4. XP drops → **level up** → pick **1 of 3** upgrades.  
5. **Elites + chests** periodically → big spikes.  
6. Survive to timer or defeat boss → results screen → meta unlocks.

### Pillars
- **Readable chaos**: dense enemies, clear VFX/telegraphs, stable FPS.
- **Buildcraft**: upgrades + evolutions create distinct builds.
- **Data-first**: enemies/weapons/stages/events authored in JSON.
- **Lightweight WebGL**: fast load, instancing + pooling, deterministic-ish sim.

### Target experience
- Runs: **12–15 minutes** (tunable).
- “Meaningful choice” every level-up; elites every **90 seconds** (prototype).
- A run can be “ritual purity” (wards/charms) or “contraband carnage” (guns/vehicles), or a hybrid.

---

## 2. Platform & technical direction

### Target platforms
- **Web browser** (desktop first).  
- Optional wrappers later (Electron/Tauri).

### Engine & rendering
- **Three.js** (WebGL) for rendering.
- Top‑down 3D with simple meshes/planes; gameplay collisions are **2D circles on XZ plane**.

### Camera
- Fixed pitch (55–65°), follows player.
- Recommend **Orthographic camera option** for readability.
- Screen-space UI overlay (DOM or canvas 2D layer).

### Simulation model
- Fixed timestep simulation (60Hz) with accumulator.
- Rendering via `requestAnimationFrame` with interpolation.
- Seeded RNG for reproducible debugging (optional “Daily Seed” later).

### Performance budgets (targets)
- 60 FPS target; degrade gracefully to 30 FPS.
- Typical on-screen enemies: **200–600**.
- Hard cap (config): **1,500 entities total** (enemies + projectiles + pickups + VFX markers).
- Mandatory: instancing + pooling + spatial hash.

### Core modules
- `GameLoop` (fixed timestep)
- `Input`
- `Renderer` (Three.js scene, instancing)
- `EntityManager` + Pools
- `SpawnManager`
- `EnemySystem`
- `CombatSystem`
- `AbilitySystem` (actives/passives/evolutions)
- `DropSystem` (XP, coins, health, chests)
- `EventSystem` (ritual/holiday events)
- `ArcanaSystem` (gods/fate)
- `UI` (HUD, level-up, menus)
- `SaveSystem` (local persistence)

---

## 3. Controls

### Desktop
- **WASD / Arrow keys**: move
- **Esc**: pause
- Optional:
  - **Space**: dash (stretch)
  - **E**: interact (if chests/shrines require it; otherwise auto-open)

### Accessibility toggles (recommended)
- Reduced motion (VFX + camera shake)
- Damage numbers on/off
- Screen shake off/low/med
- High-contrast pickups

---

## 4. Worldbuilding integration (lexicon → systems)

### Nav / Yav / Prav framing
- **Nav**: undead/spirits, corruption, cursed currencies, metro-surges.
- **Yav**: contraband tech, vehicles, towers, “real world” scrap.
- **Prav**: ritual law—wards, icons, holy bread, obereg geometry, fate modifiers (gods).

### Lexicon content mapping
- **Undead core** → enemy families (upiór, strzyga, vurdalak).
- **Spirits by domain** → biome-specific enemies (domovoi/bannik/vodyanoy/leshy).
- **Anti-vampire kit** → ritual weapons/evolutions (garlic, holy water, aspen stake, salt wards).
- **Gods / fate** → Arcana-like run modifiers (Perun, Veles, Morana).
- **Rituals / holidays** → timed events (Kupala Night, Zadusnice).
- **Places** → stages/biomes (Izba, Boloto, Kurgan; later: taiga, monastery ruins).

---

## 5. Run structure

### Mode: Survival (MVP)
- Duration target: **12–15 minutes**.
- Lose: HP reaches 0.
- Win: defeat boss at final timestamp (or survive to timer, configurable).

### Wave model
- `waveIndex = floor(elapsedSeconds / 60)`
- Base spawns scale each wave (count first, HP second).
- Elite cadence (prototype): **every 90 seconds**, 1 elite with a modifier.
- Boss spawns at end time.

### Event windows
- Kupala Night: mid-run “loot bloom” window.
- Zadusnice: undead surge window + reliquary chest.

---

## 6. Systems

### 6.1 Player
**Stats**
- HP / Max HP
- Move speed
- Armor (damage reduction)
- Pickup radius (magnet)
- Damage %, Area %, Cooldown reduction, Projectile speed %
- Crit chance (optional)

**Movement**
- Top-down acceleration + clamp max speed.
- Soft collision against map props (simple circle vs AABB).

**Damage / invulnerability**
- Contact damage ticks while overlapping enemies.
- Post-hit i-frames (e.g., 300ms).
- Holy Bread lethal prevention (optional, 1 charge).

---

### 6.2 Enemies
**MVP roster (behavior-first)**
1. Upiór Drifter — basic chaser; medium speed; low HP  
2. Strzyga Screecher — fast flanker; circles to cut off  
3. Vurdalak Bruiser — slow tank; high knockback resist  
4. Zmora — ghost; brief invuln flicker  
5. Domovoi Swarmlet — tiny units; cluster spawns near props  
6. Kikimora Snarer — drops short-lived slow patches  
7. Bannik Scald — short-range cone steam attack  
8. Leshy Stalker — edge spawner; burst acceleration  
9. Poludnitsa — “noon” dash spawns  
10. Vodyanoy Spitter — ranged blobs  
11. Rusalka Lurer — brief pull field  
12. Navka Revenant — revives once unless killed inside a ward

**AI mechanics**
- Seek player + simple separation (avoid clumping).
- Ranged enemies keep standoff distance.
- Elite modifiers apply stat/status changes.

---

### 6.3 Spawning
**Two spawn sources**
- **Base spawns**: continuous cadence rows
- **Elite spawns**: schedule by timestamp (every 90s default)

**Spawn placement**
- Spawn in a ring around the player (min/max radius).
- Optional: avoid spawning inside view margin.
- Stage “domains” can bias spawn families.

---

### 6.4 Combat
**Damage sources**
- Melee AoE (circle/arc)
- Projectiles (bullets, stakes, shards)
- Zones (holy water puddles, ward rings)
- Strikes (lightning, rituals)
- Vehicles (ram/trail)
- Companions (pigeon pecks/drops)

**Hit resolution**
- Circle vs circle (entity radius) for contacts and projectiles.
- Zones query spatial hash buckets.
- Avoid per-frame O(n²) checks; always use spatial hash.

---

### 6.5 XP and level-up
- Enemies drop **XP gems** (souls).
- XP fill triggers level-up: pause or slow-mo, show **3 choices**.
- Choice types:
  - New active weapon (if slots available)
  - Upgrade owned active
  - New passive (if slots available)
  - Upgrade owned passive
  - Evolution (if eligible)
  - Relic (rare; common in chests)

**Slot caps (recommended)**
- Actives: 6
- Passives: 6

---

### 6.6 Evolutions
Eligible when:
- Active reaches threshold (e.g., level 8), and
- Required passive is owned (and/or relic held).

Evolution replaces base weapon ID (or upgrades it to evolved ID).

---

### 6.7 Drops, chests, boxes
**Drop types**
- XP gems (common)
- Coins (from boxes/elites/events)
- Health (rare)
- Chests (elite guaranteed)
- Relics (mostly chest pool)

**Chest behavior**
- Auto-open (MVP) → grants 1–3 rewards (config).
- Chest pool prioritizes: evolutions (if eligible) > upgrades > relics.

---

### 6.8 Deployables, vehicles, companions
- **Deployables**: placed objects with aura/pulses.
- **Vehicles**: temporary movement/defense modes with timer/durability.
- **Companions**: helper entities with orbit/follow and attacks.

---

### 6.9 Gods / Fate (Arcana)
Choose 1 at run start (optional MVP toggle).
- **Perun**: chain lightning synergy
- **Veles**: XP/coin gain (greed)
- **Morana**: chill/freeze synergy

---

### 6.10 Ritual/holiday events
- **Kupala Night**: buff/loot window with firefly pickups.
- **Zadusnice**: undead surge + reliquary chest.

---

## 7. Content catalogs (authoritative)

Content is authored in JSON. Suggested file split:
- `enemies.json`, `stages.json`, `spawnTable.json`
- `actives.json`, `passives.json`, `relics.json`
- `deployables.json`, `vehicles.json`, `companions.json`
- `currencies.json`, `cosmetics.json`
- `evolutions.json`, `arcana.json`, `events.json`
- `characters.json`, `tuning.json`

### 7.1 Minimal shared schema (base item)
```json
{
  "id": "string_id",
  "name": "Display Name",
  "category": "ActiveWeapon|Passive|Relic|Deployable|Vehicle|Companion|Currency|Cosmetic",
  "rarity": "Common|Rare|Epic|Legendary",
  "tags": ["string", "string"],
  "description": "Short player-facing text"
}
```

---

## 8. Catalogs (complete, including your full item list)

### 8.1 Actives (`actives.json`)

#### Ritual track (anti-vampire kit)
- Czosnek Halo (Garlic aura)
- Svyata Voda (Holy water zones)
- Osikovy Kol (Aspen stake)
- Krzyż Boomerang (Cross)
- Salt Line (Ward ring)
- Obereg Orbitals (Talisman orbitals)
- Perun Sparks (Lightning)
- Wormwood Incense (Columns)
- Rowan Shards (Ricochet shards)
- Psalm Book (Homing shots)
- Pentacle Rite (Screen ritual)

#### Contraband track (weapons from your list)
- TT33 Handgun
- Radioactive AK
- Ghzel AK
- Corrupted AK
- Mushroom AK
- Peppermill Gun
- Stiletto Knife
- Kabar
- Ghzel Knuckle

**Implementation notes**
- Guns (TT33/AKs/Peppermill): projectile emitters (burst/spread, optional status).
- Knives/Stiletto: fast piercing bursts (simple projectile).
- Kabar/Ghzel Knuckle: melee arcs/cones and short-range hitboxes.
- Mushroom AK: hybrid projectile + puddle zone spawn.

---

### 8.2 Passives (`passives.json`)

**Core ritual/stat passives**
- Srebro (Silver): crit / undead damage
- Zhelezo (Iron): armor / knockback
- Sol (Salt): ward damage / status duration
- Ikona (Icon): projectile speed / cooldown reduction
- Moroz (Frost root): freeze chance (threshold-based)
- Krov (Blood root): lifesteal / XP magnet

**Your list integrated as passives**
- Swine Case: +Max HP +Pickup radius; slight move penalty
- Spy Hat: +Crit; earlier elite warnings
- Garlic Ring: boosts Czosnek Halo; can be evolution requirement
- Babushka’s Tool: +Healing effectiveness; +relic chance in chests
- Babushka’s Battle Scarf: +Armor/+KB resist; attackers slowed briefly
- Brick Phone Necklace: cosmetic default; optional magnet passive variant

---

### 8.3 Relics (`relics.json`)

- Soviet USB Stick: duplicates last projectile periodically
- Pickled GPU: cooldown reduction; occasional jam (can be “cured” upgrade later)
- Patchy Ball: projectile ricochet chance
- Infinite Sunflower Push: passive regen during run
- Holy Bread: prevent lethal once per run (charge)
- Cursed Metro Coin: +XP gain; periodic “Metro surge” mini-wave
- Dove Coin: +luck while held this run; also currency pickup
- Infinite Beer Coin: +move speed while held; converts to coins at run end
- Soviet USB Stick / Pickled GPU / Patchy Ball are intended to make contraband builds “feel different” without adding new weapon types.

---

### 8.4 Deployables (`deployables.json`)

- Propaganda Tower: slow aura + periodic broadcast damage pulses
- Kvass Reactor: periodic heal + tiny XP trickle near it

---

### 8.5 Vehicles (`vehicles.json`)

- Tank Baby Stroller: ram/knockback mode; slow turning
- Hunted Lada: very fast; damaging skid trail; short-lived
- Big Biznis Lada: tanky ram; coin vacuum aura
- Gopnik Gondola: hover; immune to slow zones; wide aura damage
- Dadushka Speed Chair: stable steering; armor aura; contact aura damage

---

### 8.6 Companions (`companions.json`)

- Nuclear Pigeon: orbiting helper; pecks; occasional AoE “drop”

---

### 8.7 Currencies (`currencies.json`)

- Dove Coin (currency + temporary luck buff)
- Infinite Beer Coin (currency + temporary speed buff; end-of-run convert)
- Standard Coins (meta unlock currency)

---

### 8.8 Cosmetics (`cosmetics.json`)

- Boss Shue: cosmetic; level-up stomp VFX
- Brick Phone Necklace (baseline cosmetic appearance)

---

## 9. Evolution rules (`evolutions.json`) (starter set)

- Czosnek Halo + Garlic Ring → Soul Siphon Czosnek (heal per elite kill)
- Perun Sparks + (Ikona or Perun Arcana) → Perun’s Chain (chain strikes)
- Svyata Voda + Mushroom AK → Flood of Spores (merged drifting puddles)
- TT33 + Srebro → Silver TT33 (bonus undead damage / crit)
- Corrupted AK + Patchy Ball → Controlled Corruption (predictable ricochet)
- Salt Line + Sol → Threshold Fortress (longer ward + slow)

---

## 10. Stage design

### Prototype stages
1. **Izba & Yard**: props + tight lanes; Domovoi/Kikimora/Bannik favored  
2. **Boloto Marsh**: slow zones + ranged pressure; Vodyanoy/Rusalka favored  
3. **Kurgan Cemetery**: dense swarms; Upiór/Strzyga/Navka favored  

**Stage file recommendations**
- Provide enemy weight tables per stage.
- Provide prop sets + obstacle density.
- Provide event overrides (Kupala stronger in Izba, Zadusnice stronger in Kurgan).

---

## 11. UI/UX

### Screens
- Title
- Character select (locked/unlocked, cost)
- HUD: HP, XP, timer, coins, actives/passives icons, vehicle timer
- Level-up overlay (3 cards)
- Pause
- Results: time, kills, coins gained, unlock progress

---

## 12. Tuning (`tuning.json`) (recommended defaults)

- Run length: 720–900 sec
- Elite cadence: 90 sec
- I-frames: 0.30 sec
- Slot caps: actives 6, passives 6
- Global entity cap: 1500
- Base pickup radius: 1.6
- XP curve: `8 + level*3 + floor(level^1.2)` (starting point)
- Enemy scaling: count increases each wave; HP scaling begins after wave 5

---

## 13. Save data

Persist via localStorage/IndexedDB:
- totalCoins
- unlockedCharacters
- unlockedCosmetics
- settings
- lastSelectedCharacter

---

## 14. Milestones

1. Arena + movement + camera.
2. Spawn chasers + damage + death.
3. XP + level-up choices.
4. Implement starter weapons (Czosnek Halo, Psalm Book, Svyata Voda).
5. Elites + chests + reward loop.
6. Pooling + instancing + spatial hash (scale up).
7. Integrate contraband weapons + deployables + vehicles.
8. Add events + Arcana.
9. Add 3 stages + enemy family weights + bosses.

---

## Appendix A — Example JSON entries

### A1) Active weapon entry
```json
{
  "id": "tt33_handgun",
  "name": "TT33 Handgun",
  "category": "ActiveWeapon",
  "rarity": "Common",
  "tags": ["projectile", "gun", "contraband"],
  "description": "Rapid single shots. Likes crit.",
  "levels": [
    { "damage": 8, "cooldown": 0.35, "projectiles": 1, "crit": 0.05 },
    { "damage": 10, "cooldown": 0.33, "projectiles": 1, "crit": 0.06 }
  ],
  "evolution": { "to": "silver_tt33", "requires": ["srebro"], "requiresLevel": 8 }
}
```

### A2) Passive entry
```json
{
  "id": "babushkas_battle_scarf",
  "name": "Babushka’s Battle Scarf",
  "category": "Passive",
  "rarity": "Rare",
  "tags": ["defense", "slow"],
  "description": "+Armor and knockback resist. Enemies that hit you are briefly slowed.",
  "levels": [
    { "armor": 1, "knockbackResist": 0.1, "retaliationSlowSec": 0.6 },
    { "armor": 2, "knockbackResist": 0.15, "retaliationSlowSec": 0.8 }
  ]
}
```

### A3) Vehicle entry
```json
{
  "id": "hunted_lada",
  "name": "Hunted Lada",
  "category": "Vehicle",
  "rarity": "Epic",
  "tags": ["speed", "trail", "fragile"],
  "description": "Fast mount with a damaging skid trail. Short-lived.",
  "durationSec": 18,
  "stats": { "moveSpeedMult": 1.8, "turnRateMult": 0.8 },
  "effects": { "trailDps": 10, "trailWidth": 1.2 }
}
```

### A4) Deployable entry
```json
{
  "id": "propaganda_tower",
  "name": "Propaganda Tower",
  "category": "Deployable",
  "rarity": "Rare",
  "tags": ["slow", "pulse"],
  "description": "Broadcasts a slow aura and periodic damage pulses.",
  "durationSec": 20,
  "aura": { "radius": 4.5, "slowPct": 0.25 },
  "pulse": { "everySec": 2.0, "damage": 18 }
}
```

---
