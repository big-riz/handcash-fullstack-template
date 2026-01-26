# Slavic Survivors - Game Analysis

## Overview
**Slavic Survivors** is a vampire-survivors-like bullet heaven game with a Slavic folklore theme. Players survive waves of mythological enemies while collecting XP, upgrading weapons, and unlocking characters. The game features HandCash integration for authentication, leaderboards, and item-gated access.

## Core Game Loop

### Objective
Survive increasingly difficult enemy waves by:
1. Moving to avoid damage
2. Auto-attacking enemies with weapons
3. Collecting XP gems to level up
4. Choosing upgrades that synergize
5. Reaching level 30 (Dark Forest) or level 50 (Frozen Waste) to win

### Win Conditions
- **Dark Forest**: Reach Level 30
- **Frozen Siberian Waste**: Reach Level 50 (harder enemies, 1.5x difficulty)

## Technical Architecture

### Core Systems

#### 1. **Game Engine** (`useGameEngine.ts`)
- **THREE.js** for 3D rendering (orthographic view creates 2D look)
- **GameLoop** manages fixed timestep updates (60 FPS)
- **Sprite System** for billboard-based entity rendering
- **Seeded RNG** for deterministic replays
- **Replay System** records all game events for replay viewing

#### 2. **Entity System**
- **Player** (`entities/Player.ts`): Character with stats, movement, collision
- **Enemy** (`entities/Enemy.ts`): AI-controlled monsters with varied behaviors
- **XPGem**: Collectible experience orbs with magnet radius
- **Projectile**: Bullets, daggers, crosses, etc.
- **HazardZone**: Area effects like holy water puddles
- **EntityManager**: Pools and manages all entities with Quadtree spatial optimization

#### 3. **Systems**
- **SpawnSystem**: Spawns enemy waves based on timeline
- **AbilitySystem**: Manages weapons and passives
- **VFXManager**: Visual effects (screen shake, flashes)
- **EventSystem**: Timeline-based events (waves, boss spawns)
- **LevelUpSystem**: Generates upgrade choices
- **AudioManager**: Biome music and sound effects

#### 4. **Input**
- **Keyboard**: WASD/Arrow keys for movement
- **Mobile**: Virtual joystick (touch controls)
- **Bot Mode**: AI controller for localhost simulation

## Game Content

### Worlds (Biomes)

#### **Dark Forest** (Starter)
- **Theme**: Ancient woods with Slavic mythology
- **Difficulty**: 1.0x (base)
- **Win Condition**: Level 30
- **Available Weapons**: TT33, Shank, Stilleto, Peppermill, Soviet Stick
- **Enemies**: Drifter, Screecher, Bruiser, Domovoi, Werewolf, Forest Wraith, Guardian Golem
- **Colors**: Dark green (0x1a1e1a sky, 0x3d453d ground)

#### **Frozen Siberian Waste** (Advanced)
- **Theme**: Frozen tundra, harsh survival
- **Difficulty**: 1.5x (harder)
- **Win Condition**: Level 50
- **Available Weapons**: Gzhel SMG, Skull Screen, Visors, Kvass Reactor, Haunted Lada
- **Enemies**: Zmora, Kikimora, Drifter, Bruiser
- **Colors**: Icy blue/white (0x88aabb sky, 0xddeeff ground)

### Characters (7 Total)

#### **Boris the Gopnik** (Starter)
- **Theme**: Street fighter, squatter
- **Starting Weapon**: TT33 Pistol
- **Stats**: 120 HP, 1.2 speed, 2 armor, 0.5 regen
- **Playstyle**: Balanced survival and speed
- **Arsenal**: Guns (TT33, AK variants), melee (knuckles)

#### **Babushka Zina** (Melee Specialist)
- **Theme**: Don't mess with grandma
- **Starting Weapon**: Shank + Holy Bread passive
- **Stats**: 120 HP, 1.0 speed, 1.2 might, 1.5 area, 1.2 luck
- **Playstyle**: Massive area melee attacks, healing
- **Arsenal**: Melee (Shank, Soviet Stick, Kabar, Grail), Holy Water

#### **Vadim Hunter** (Speed Demon)
- **Theme**: Monster slayer
- **Starting Weapon**: Stilleto + Battle Scarf passive
- **Stats**: 100 HP, 1.1 speed, 0.8 cooldown multiplier
- **Playstyle**: Fast projectiles, high DPS
- **Arsenal**: Throwing knives, daggers, visors

#### **Big Biznisman** (Luck/Companion Build)
- **Theme**: Time is money
- **Starting Weapon**: Pig Luggage + Beer Coin passive
- **Stats**: 90 HP, 1.0 speed, 2.0 luck, 2.0 greed
- **Playstyle**: Companion summons (pigeon, rat, tower)
- **Arsenal**: Summons (Nuclear Pigeon, Propaganda Tower, Haunted Lada)

#### **The Oligarch** (Tank/Vehicle Master)
- **Theme**: Wealth is armor
- **Starting Weapon**: Big Biz Lada + Infinity Purse passive
- **Stats**: 250 HP, 0.6 speed, 10 armor
- **Playstyle**: Slow but tanky, vehicle weapons
- **Arsenal**: Vehicles (Lada variants, Tank Stroller, Gopnik Gondola)

#### **Chernobyl Ghost** (Glass Cannon)
- **Theme**: Exclusion zone remnant
- **Starting Weapon**: Kvass Reactor + Nuclear Pigeon + Pickled GPU
- **Stats**: 60 HP, 2.5 might, 3.0 area, -2.0 regen (!), 1.5 curse
- **Playstyle**: Massive damage, constantly dying
- **Arsenal**: Nuclear/toxic weapons (AK Radioactive, Nuclear Pigeon)

#### **Slavic Spirit** (Magic Spam)
- **Theme**: Pure energy
- **Starting Weapon**: Grail + Cross + Ruby Ushanka
- **Stats**: 40 HP, 1.4 speed, 0.2 cooldown, -5 armor, 2 amount
- **Playstyle**: Infinite magic spam, zero defense
- **Arsenal**: Orbital weapons (Grail, Cross, Skull Screen, Visors, Salt)

### Weapon Categories

#### **Projectile Weapons**
- Fire bullets/daggers at enemies
- Examples: TT33, Stilleto, Dagger, Cross, Aspen Stake
- Stats: Damage, cooldown, projectile speed, pierce

#### **Melee Weapons**
- Close-range attacks with swing hitboxes
- Examples: Shank, Knuckles, Soviet Stick
- Stats: Damage, cooldown, range, swing angle

#### **Area Weapons**
- Create damage zones on the ground
- Examples: Holy Water, Salt Line, Garlic Aura
- Stats: Damage, duration, radius

#### **Companion Weapons**
- Summon entities that attack autonomously
- Examples: Nuclear Pigeon, Propaganda Tower, Haunted Lada
- Stats: Summon count, damage, behavior

#### **Evolutions**
- Upgraded forms of weapons when conditions are met
- Example: TT33 + Holy Bread → Silver TT33
- Higher rarity, better stats

### Passive Items (12 Total)
All worlds allow all 12 passives:
- **Beer Coin**: +10% XP gain
- **Boss Shoe**: +5% move speed
- **Dove Coin**: +15% cooldown reduction
- **Garlic Ring**: +10% area
- **Holy Bread**: +20% max HP
- **Battle Scarf**: +10% might
- **Holy Cheese**: +5% regen
- **Spy Hat**: +15% luck
- **Infinity Purse**: +20% greed (more gold)
- **Ruby Ushanka**: +10% armor
- **Sunflower Pouch**: +1 projectile
- **Pickled GPU**: +10% duration

### Enemy Types

#### **Dark Forest Enemies**
- **Upiór Drifter**: Basic chaser (10 HP, 10 dmg, 3.0 speed)
- **Strzyga Screecher**: Fast flanker (20 HP, 15 dmg, 5.0 speed)
- **Vurdalak Bruiser**: Slow tank (50 HP, 25 dmg, 2.0 speed)
- **Domovoi Swarmlet**: Weak but numerous (5 HP, 5 dmg, 4.0 speed)
- **Werewolf**: Medium threat
- **Forest Wraith**: Ghost enemy
- **Guardian Golem**: Boss-type enemy

#### **Frozen Waste Enemies**
- **Zmora**: Ghost (30 HP, 18 dmg, 3.5 speed)
- **Kikimora Snarer**: Snarer (35 HP, 20 dmg, 2.5 speed)
- **Drifter**: Basic chaser
- **Bruiser**: Slow tank

### Stat System

#### **Core Stats**
- **Max HP**: Health pool
- **Move Speed**: Movement velocity
- **Might**: Damage multiplier
- **Area**: AoE size multiplier
- **Armor**: Flat damage reduction per hit
- **Regen**: HP regeneration per second
- **Luck**: Affects crit rate and loot
- **Cooldown**: Attack frequency (lower = faster)
- **Amount**: Additional projectiles/attacks
- **Growth**: XP gain multiplier
- **Curse**: Enemy difficulty multiplier
- **Greed**: Gold/loot multiplier
- **Magnet**: XP pickup radius

#### **Advanced Stats**
- **Crit Rate**: Chance for critical hits (base 5%)
- **Crit Damage**: Damage multiplier on crits (base 2.0x)
- **Projectile Speed**: Bullet velocity
- **Duration**: Effect duration multiplier
- **Vision**: Screen/camera zoom

## Progression Systems

### 1. **Level-Up System**
- Gain XP from killing enemies
- XP requirement increases per level
- Every level: Choose 1 of 3-4 upgrades
- Upgrade pool filtered by world
- Rerolls available (3 base, can gain more)

### 2. **Meta Progression**
- **Character Unlocks**: Victory in worlds unlocks new heroes
- **World Stars**: 1-3 stars based on final level (10/20/30)
- **Achievements**: Track milestones (stored locally)

### 3. **Run Progression**
- Start at Level 1 with base character stats
- Each level grants upgrade choice
- Synergies between items amplify power
- Timeline spawns harder enemies over time
- Win condition: Survive to level 30/50

## HandCash Integration

### Authentication
- Login via HandCash OAuth
- Profile data: handle, avatar, display name
- Session management with CSRF protection

### Access Control
- Game requires specific HandCash collection items to play
- Checked via `/api/game/check-access`
- Shows "ACCESS DENIED" screen if missing relics

### Leaderboard & Replays
- Store runs in database with HandCash profile
- Global leaderboard shows top 25 per world
- Replay system records deterministic gameplay
- Can watch other players' runs

### Comments System
- Leave comments on the game (HandCash authenticated)
- Reply to other players
- Stored in database

## Game Feel & Polish

### Visual Effects
- **Screen Shake**: On hit, on level up
- **Flash Effects**: Damage feedback
- **Billboard Sprites**: Pixel art characters
- **Particle Systems**: XP gems, projectiles
- **Status Effects**: Visual indicators (poison, slow, burn)

### Audio
- **Biome Music**: Dark Forest and Frozen Waste themes
- **SFX**: Shooting, impacts, level up, game over
- **Volume Controls**: Separate music/SFX sliders
- **Mute Toggle**: Quick mute button

### Mobile Support
- **Touch Controls**: Virtual joystick
- **Fullscreen Toggle**: Maximize screen real estate
- **Safe Area Insets**: Notch/status bar handling
- **Responsive UI**: Scales for different screens

### Developer Tools (Localhost Only)
- **Bot Mode**: AI auto-plays the game
- **Game Speed**: 1x, 2x, 4x, 10x, 25x, 50x simulation
- **Simulation**: Test balance and run bots at high speed

## Code Architecture

### Frontend (React + Next.js)
```
components/game/
├── SlavicSurvivors.tsx          # Main game component
├── hooks/
│   └── useGameEngine.ts         # Game loop and engine
├── core/
│   ├── GameLoop.ts              # Fixed timestep loop
│   ├── Input.ts                 # Keyboard/touch input
│   ├── BotController.ts         # AI player
│   ├── SpriteSystem.ts          # Billboard rendering
│   ├── AnimationController.ts   # Sprite animations
│   ├── TextureManager.ts        # Asset loading
│   └── AudioManager.ts          # Sound system
├── entities/
│   ├── Player.ts                # Player character
│   ├── Enemy.ts                 # Enemy AI
│   ├── XPGem.ts                 # Collectibles
│   ├── Projectile.ts            # Bullets
│   └── EntityManager.ts         # Entity pooling
├── systems/
│   ├── SpawnSystem.ts           # Enemy spawning
│   ├── AbilitySystem.ts         # Weapons/passives
│   ├── LevelUpSystem.ts         # Upgrade choices
│   ├── VFXManager.ts            # Visual effects
│   └── EventSystem.ts           # Timeline events
├── screens/                     # UI screens (menu, HUD, etc.)
├── content/
│   └── weapons/                 # Weapon implementations
├── data/
│   ├── characters.ts            # Character definitions
│   ├── actives.ts               # Weapon data
│   ├── passives.ts              # Passive data
│   ├── enemies.ts               # Enemy data
│   ├── worlds.ts                # World definitions
│   └── evolutions.ts            # Evolution recipes
└── utils/
    └── itemUtils.ts             # Item helpers
```

### Backend (Next.js API Routes)
```
app/api/
├── game/
│   └── check-access/            # HandCash item verification
├── replays/                     # Store/fetch replays
├── comments/                    # Comment system
└── pool-stats/                  # Item template data
```

### External Libraries
- **THREE.js**: 3D rendering engine
- **@handcash/sdk**: HandCash integration
- **lucide-react**: Icons
- **@/lib/auth-context**: Authentication hook
- **@/lib/ReplaySystem**: Deterministic replay recording
- **@/lib/SeededRandom**: Reproducible RNG
- **@/lib/achievement-tracker**: Achievement storage

## Key Gameplay Mechanics

### 1. **Enemy Spawning**
- Timeline-based: Different enemy types at different times
- Spawn in waves with increasing difficulty
- Enemy HP/damage scales with game time
- Boss enemies spawn at intervals

### 2. **Damage Calculation**
```
finalDamage = (baseDamage * mightMultiplier * critMultiplier) - armor
```

### 3. **XP Collection**
- Enemies drop XP gems on death
- Gems attracted to player within magnet radius
- XP increases level, which grants upgrades
- XP requirement: `35 + (level - 1) * 15`

### 4. **Status Effects**
- **Poison**: DoT over time
- **Slow**: Reduces movement speed
- **Burn**: Fire DoT
- **Freeze**: Stun effect
- **Bleed**: Stacking DoT
- **Curse**: Reduces stats

### 5. **Collision System**
- **Quadtree Spatial Partitioning**: Fast collision detection
- **Circle-Circle**: Player vs enemies
- **AABB**: Projectiles vs enemies
- **Obstacle Avoidance**: Enemies path around obstacles

## Performance Optimizations

### 1. **Entity Pooling**
- Pre-allocate entity instances
- Reuse instead of create/destroy
- Reduces garbage collection

### 2. **Quadtree Spatial Indexing**
- Only check nearby entities for collision
- O(log n) lookups instead of O(n²)

### 3. **Sprite Instancing**
- Batch render many sprites
- Single draw call per sprite type

### 4. **Fixed Timestep**
- Decoupled update rate from render rate
- Deterministic physics

### 5. **Culling**
- Only render entities on screen
- Only update nearby entities

## Unique Features

### 1. **Deterministic Replays**
- Seeded RNG ensures reproducibility
- Records input events and upgrade choices
- Can watch any player's run exactly as it happened

### 2. **Bot Mode (Localhost)**
- AI plays the game automatically
- Fast-forward simulation (up to 50x)
- Test balance and builds

### 3. **Item-Gated Access**
- Requires HandCash NFT to play
- Novel use of blockchain for game access
- Integrates Web3 with traditional gameplay

### 4. **Slavic Folklore Theme**
- Unique cultural setting (vs typical vampire/gothic)
- Enemies: Domovoi, Kikimora, Zmora, Strzyga
- Characters: Gopnik, Babushka, Oligarch
- Items: Kvass, Gzhel, Ushanka

### 5. **World-Specific Loadouts**
- Each world has 5 unique weapons
- Characters have themed arsenals
- Forces different playstyles per biome

## Game Balance Principles

### 1. **Risk vs Reward**
- **Chernobyl Ghost**: Massive damage, but -2.0 regen (constantly dying)
- **Slavic Spirit**: Spam attacks, but -5 armor (one-shot vulnerable)
- **Oligarch**: Tanky but slow (positioning matters)

### 2. **Synergy Building**
- Item combinations amplify power
- Evolutions require 2+ items
- Encourages strategic choices

### 3. **Difficulty Scaling**
- Enemies get stronger over time
- Curse stat increases enemy power
- Frozen Waste has 1.5x difficulty

### 4. **Character Diversity**
- 7 unique playstyles
- Different arsenals per character
- Starter weapons define build direction

## Technical Challenges Solved

### 1. **Replay Determinism**
- Seeded RNG ensures same random outcomes
- Record input events, not state snapshots
- Compact storage (events only, not full frames)

### 2. **Mobile Performance**
- Optimized sprite rendering
- Touch controls with virtual joystick
- Fullscreen mode for immersion

### 3. **HandCash Integration**
- OAuth flow with CSRF protection
- Session management with JWT
- NFT-based access control

### 4. **Level-Up Interrupt**
- Pause game mid-action
- Show upgrade choices
- Resume seamlessly

### 5. **Spatial Optimization**
- Quadtree for collision detection
- Entity culling for off-screen
- Pooling to reduce allocations

## Future Expansion Possibilities

### New Content
- More worlds (3-5 additional biomes)
- More characters (10-15 total)
- More weapons (50+ total)
- More enemies (20+ types)

### Features
- Co-op multiplayer (2-4 players)
- Daily challenges with leaderboards
- Tournament mode with brackets
- Spectator mode for live runs

### Monetization
- Character skin NFTs
- Weapon skin NFTs
- Season passes (battle pass)
- Premium characters via HandCash

### Polish
- More visual effects (particles, shaders)
- Voice acting for characters
- Story/lore mode
- Achievements with rewards

## Summary

**Slavic Survivors** is a well-architected bullet heaven game that combines:
- **Solid Technical Foundation**: THREE.js, entity pooling, spatial optimization
- **Unique Theme**: Slavic folklore setting rarely seen in games
- **Web3 Integration**: HandCash NFT-gated access and social features
- **Replayability**: 7 characters × 2 worlds × many builds = high replay value
- **Polish**: Mobile support, audio, visual feedback, developer tools

The game successfully blends traditional roguelike progression with modern web technologies, creating a compelling browser-based experience that rivals native games in performance and feel.
