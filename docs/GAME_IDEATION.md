# Slavic Survivors: Game Ideation & Feature Roadmap

## Executive Summary

**The game works. It doesn't feel right yet, and the reward loop is broken.**

Nine analysis passes across systems, game feel, economy, player journey, weapons, balance, and UGC produced these conclusions:

**Fix now (hours of work, massive impact):**
- Meta progression bonuses are stripped in `useGameEngine.ts` — seeds are unearnable, upgrades do nothing
- Combat audio is at 0.1 volume — nearly inaudible. Bump to 0.4.
- No hit-stop, no collection juice, no low-HP feedback

**Build next (days of work, high impact):**
- Spacebar dodge roll (skill expression, the game has zero burst mobility)
- Treasure Goblin + Cursed Shrine events (fill empty EventSystem with decisions)
- Chernobog boss phases (Eclipse mechanic — darkness + combined attacks)

**Strategic differentiator:**
- The 2,559-line level editor + HandCash micropayments = "Slavic Mario Maker"
- No other bullet-heaven game has UGC with real creator payments
- Community levels → per-level leaderboards → replays → daily retention

**Balance issue:**
- Higher-rarity weapons are systematically underpowered (Legendary at 76 DPS vs 125 target)
- 28 of 43 weapons are stat clones of 5 base classes — need mechanical identity

---

## Current State Assessment

The game has a **strong mechanical foundation**: 52 weapons, 18 evolutions, 33 enemy types, 9 characters, 3 worlds, deterministic replay system, fixed timestep loop, and object pooling. The core gameplay loop (move, auto-attack, collect XP, level up, evolve) is complete and fun.

**Key gaps**: Meta progression is disconnected (bonuses not applied), achievements never fire, EventSystem is empty, bosses have no special mechanics, and many weapons are stat-clones of base classes.

---

## Tier 1: Fix What's Broken (High Impact, Low Effort)

### 1.1 Reconnect Meta Progression
The upgrade system exists, currency system exists, UI exists -- but `useGameEngine.ts` explicitly strips meta bonuses. Reconnecting this gives players permanent progression incentive.

- Re-enable sunflower seed rewards on death/victory
- Apply meta upgrade bonuses to player stats at game start
- Add visual feedback when meta bonuses are active ("Hardy Constitution Lv3: +30 HP")

### 1.2 Wire Up Achievement Tracking
21 achievements designed, tracker class written, but never called from game loop. Hook it in:

- Kill milestones (1K, 5K)
- Survival time (30 min)
- Boss defeats
- Level milestones (50)
- Character unlocks
- Evolution discoveries
- Add toast notification on unlock

### 1.3 Enable Difficulty Scaling
SpawnSystem has commented-out dynamic difficulty. Enable it with a smooth curve so late-game feels appropriately challenging rather than the same threat level as minute 1.

---

## Tier 2: Deepen Existing Systems (High Impact, Medium Effort)

### 2.1 Boss Phases & Mechanics
Current bosses are just high-HP enemies. Give each boss unique attack patterns:

**Ancient Treant** (Dark Forest Mini-Boss):
- Phase 1 (100-60% HP): Root slam - telegraphed AoE circles that damage after 1.5s delay
- Phase 2 (60-30%): Sapling swarm - spawns 8 saplings every 10s
- Phase 3 (<30%): Rage - speed doubles, root slams are 2x larger

**Leshy** (Dark Forest Final Boss):
- Phase 1: Forest call - wolves charge from edges in cross pattern
- Phase 2: Vine cage - creates shrinking arena forcing player closer
- Phase 3: Nature's wrath - rotating beam attack + wolf summons simultaneously

**Chernobog** (Final Boss):
- Phase 1: Shadow orbs - slow-moving projectiles that explode on contact
- Phase 2: Dark zone - patches of shadow floor that damage player
- Phase 3: Eclipse - screen darkens, only nearby area visible, all previous attacks combined

### 2.2 Enemy Special Abilities
Most enemies are "run at player, deal contact damage." Add variety:

- **Leshy Shaman**: Cast heal circles for nearby enemies (already has projectile, add heal)
- **Shadow Stalker**: Dash invisibly, appear behind player with backstab bonus
- **Forest Wraith**: Curse aura that reduces player damage when near
- **Stone Golem**: Ground pound knockback every 5 seconds
- **Kikimora Snarer**: Leave webs on ground that slow player (trap placer)
- **Vodnik**: Pull player toward them periodically (mini-grab)
- **Snow Wraith**: Create ice patches that slide the player

### 2.3 World-Specific Mechanics
Each world should feel mechanically distinct, not just visually:

**Dark Forest**:
- Environmental hazard: Falling branches (random AoE damage zones every 30s)
- Poison mushroom patches on ground (avoid or take DoT)
- Fog of war at edges - enemies emerge from tree line

**Frozen Waste**:
- Blizzard events (every 2 minutes: reduce visibility, slow player 20%, enemies unaffected for 15s)
- Frozen ground zones (player slides with momentum)
- Frostbite mechanic: standing still too long freezes player briefly

**Catacombs**:
- Narrow corridors (world has walls that funnel enemies)
- Torch mechanic: limited vision radius that shrinks over time, lit by fire kills
- Sarcophagus traps: randomly open and release burst of enemies

### 2.4 In-Run Events (EventSystem)
Fill the empty EventSystem with mid-run surprises:

- **Treasure Goblin** (random, 2-5 min): High-XP enemy that runs away. Kill for bonus XP/special drop
- **Blood Moon** (every 7 min, 30s duration): 2x enemy spawn rate, 2x XP
- **Merchant Cart** (every 4 min): Temporary NPC, spend gold to reroll upgrades or buy specific items
- **Cursed Shrine** (random): Choose a curse for a buff (e.g., -20 HP for +30% damage)
- **Angel Blessing** (random): Free weapon level-up or stat boost
- **Elite Challenge**: Circle appears, stand in it for 10s while enemies rush - reward: guaranteed rare item
- **Ambush Wave**: All enemies rush from one direction simultaneously

---

## Tier 3: New Systems (Medium Impact, Higher Effort)

### 3.1 Gold & Shop System
The "Wealthy Start" meta upgrade and Big Biznisman's greed stat exist but gold does nothing.

- Enemies drop gold coins (1-5 based on type)
- Merchant Cart event (see 2.4) sells: rerolls (50g), specific weapons (100g), stat boosts (75g), health potions (25g)
- End-of-run gold converts to sunflower seeds (10:1 ratio)
- Character-specific: Big Biznisman gets 2x gold drops

### 3.2 Item Drop System
Beyond XP gems, add:

- **Health drops**: Small heals (already in Pig Luggage, generalize it)
- **Magnet pickups**: Suck all XP on screen to player
- **Temporary buffs**: Speed boost (15s), Damage boost (15s), Shield (blocks next hit)
- **Treasure chests**: Spawn every 3 minutes at random locations. Walk to it for guaranteed upgrade
- **Boss drops**: Unique items from bosses (e.g., "Treant's Heart" - passive that gives thorns)

### 3.3 Character Ultimate Abilities
Each character gets a unique ultimate that charges via kills/damage:

- **Boris**: "Squat of Power" - AoE stun + damage burst
- **Babushka**: "Grandma's Fury" - All weapons fire 3x speed for 8s
- **Vadim**: "Dead Eye" - All projectiles home for 10s, guaranteed crits
- **Biznisman**: "Golden Rain" - Gold coins rain from sky dealing damage + gold drops
- **Oligarch**: "Armored Convoy" - All vehicles go berserk, 3x damage for 10s
- **Chernobyl Ghost**: "Meltdown" - Nuclear explosion AoE, massive damage, damages self
- **Slavic Spirit**: "Transcendence" - Become invulnerable + double area for 6s
- **Koshchei**: "Army of the Dead" - Summon 20 skeleton allies for 15s
- **Strigoi**: "Blood Feast" - Every hit heals to full for 5s, but takes 2x damage after

### 3.4 Prestige / New Game+ System
After beating all 3 worlds:

- **Ascension Levels**: Replay worlds at higher difficulty multipliers (1.5x, 2x, 3x)
- **Ascension Modifiers**: Each level adds a random modifier:
  - "Cursed Blood": All enemies leave poison on death
  - "Thick Fog": Reduced visibility permanently
  - "Arsenal Limit": Max 4 weapons instead of 6
  - "Glass Cannon": 50% HP, 50% more damage
  - "Nemesis": A shadow copy of the player chases them
- **Ascension Rewards**: Exclusive cosmetic skins, bonus sunflower seeds

### 3.5 Challenge Modes
Beyond the 3 story worlds:

- **Endless Arena**: No win condition, pure survival. Leaderboard by time survived
- **Boss Rush**: Fight all bosses in sequence with short breaks between
- **Daily Challenge**: Seeded run with fixed character/weapon/world. Global leaderboard
- **Speed Run**: Reach level 30 as fast as possible. Timer on screen

---

## Tier 4: Social & Metagame (Lower Priority, Higher Effort)

### 4.1 HandCash Integration - Play to Earn
Leverage the existing HandCash SDK:

- **NFT Weapon Skins**: Unique visual variants of weapons minted as NFTs
- **Achievement NFTs**: Rare achievements mint commemorative NFTs
- **Leaderboard Prizes**: Weekly top 10 get small BSV payouts
- **Tournament Mode**: Buy-in tournaments with prize pools

### 4.2 Cosmetic System
Character customization without affecting gameplay:

- **Skins**: Alt sprites for each character (unlocked via achievements/purchase)
- **Weapon VFX**: Alternate particle colors/shapes for weapons
- **Trails**: Movement trail effects (fire, ice, shadow, gold)
- **Titles**: Displayed in leaderboard ("Boss Slayer Boris", "Speedrunner Vadim")

### 4.3 Clan/Guild System
Using HandCash friends list:

- **Clan Challenges**: Combined kill counts for group rewards
- **Shared Meta Progress**: Clan-wide bonuses from collective play
- **Clan Leaderboards**: Group rankings

---

## Tier 5: New Content Ideas

### 5.1 New World: Chernobyl Exclusion Zone
- **Theme**: Radioactive ruins, mutant enemies, industrial wasteland
- **Unique Mechanic**: Radiation zones that buff enemies but also buff player weapons
- **Enemies**: Mutant dogs, radioactive slimes, zone stalkers, anomaly orbs
- **Boss**: The Elephant's Foot (stationary, spawns waves, has radiation pulse)
- **Difficulty**: 2.0x, max level 60

### 5.2 New World: Baba Yaga's Domain
- **Theme**: Psychedelic swamp, chicken-legged huts, fairy tale horror
- **Unique Mechanic**: Reality shifts every 3 minutes - ground changes, enemy types swap
- **Enemies**: Dancing skeletons, enchanted brooms, swamp things, firebirds
- **Boss**: Baba Yaga (flies in mortar, drops area spells, summons chicken-hut)
- **Difficulty**: 1.8x, max level 55

### 5.3 New Characters

**Rasputin the Mad Monk** (Unlock: Beat Catacombs):
- Stats: 200 HP, 0.8 speed, 1.0 might, 3.0 regen, -5 armor
- Theme: Cannot die easily (insane regen), slow, tanky through healing
- Starting: Holy Water + Holy Cheese
- Arsenal: Ritual weapons only (holy water, cross, grail, salt, stake, cross)

**The Bogatyr** (Unlock: Beat all 3 worlds):
- Stats: 150 HP, 1.0 speed, 2.0 might, 0.0 regen, 5 armor
- Theme: Pure warrior, massive damage, no healing
- Starting: Soviet Stick + Battle Scarf
- Arsenal: All melee + vehicles, no projectiles

### 5.4 New Weapon Archetypes
Currently missing weapon fantasies:

- **Beam Weapon**: "Icon Laser" - Continuous beam that sweeps, DPS scales with hold time
- **Trap Weapon**: "Chechen Claymore" - Place mines that detonate when enemies walk over
- **Chain Weapon**: "Babushka's Gossip" - Damage chains between nearby enemies
- **Transformation**: "Werewolf Curse" - Transform into werewolf form, melee only but 3x stats
- **Shield Weapon**: "Matryoshka Shield" - Blocks damage from one direction, reflects projectiles
- **Summon Weapon**: "Domovoi Summoner" - Summon house spirits that fight independently

### 5.5 New Evolution Chains
"Double evolutions" - evolve an already-evolved weapon:

- **Nuclear Spray** + Sunflower Pouch = "Atomic Garden" (seeds grow into turrets)
- **Silver TT33** + Beer Coin = "Golden Magnum" (one-shot kills on non-bosses below 20% HP)
- **Immortal Lada** + Boss Shoe = "Ghost Rider" (leaves fire trail, immune to damage)

---

## Tier 6: Quality of Life

### 6.1 Gameplay Feel
- **Dash/Dodge**: Double-tap direction or spacebar for a short dash with i-frames
- **Weapon Targeting**: Let player tap/click to focus-fire a specific enemy
- **Mini-Map**: Show enemy density, boss locations, treasure chests
- **Damage Recap**: On death, show what killed you and damage taken breakdown

### 6.2 UI/UX
- **Build Preview**: Before run, show which evolutions are possible with chosen character
- **Upgrade History**: Scroll through past upgrades during pause menu
- **Synergy Preview**: Show potential synergies when hovering upgrade choices
- **Death Replay**: 5-second replay of the moment you died

### 6.3 Accessibility
- **Auto-aim toggle**: For players who want even more casual play
- **Speed options**: 0.5x, 1x, 1.5x, 2x game speed
- **Colorblind modes**: Alt color palettes for enemies/projectiles
- **One-hand mode**: Mouse-only controls (click to move)

---

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Reconnect meta progression | High | Low | **NOW** |
| Wire achievements | High | Low | **NOW** |
| Enable difficulty scaling | High | Low | **NOW** |
| Boss phases | High | Medium | **NEXT** |
| Enemy abilities | High | Medium | **NEXT** |
| EventSystem content | High | Medium | **NEXT** |
| World mechanics | Medium | Medium | **NEXT** |
| Gold & shop | Medium | Medium | **SOON** |
| Item drops | Medium | Low | **SOON** |
| Character ultimates | Medium | Medium | **SOON** |
| Dash/dodge | High | Low | **SOON** |
| Prestige system | Medium | High | **LATER** |
| Challenge modes | Medium | Medium | **LATER** |
| New worlds | Medium | High | **LATER** |
| New characters | Low | Medium | **LATER** |
| HandCash NFT integration | Low | High | **LATER** |
| Cosmetic system | Low | Medium | **LATER** |
| Double evolutions | Low | Medium | **LATER** |

---

## Game Feel Audit (Moment-to-Moment Experience)

### What's Working
- **Damage numbers**: Color-coded (white/gold/orange), scaled for crits (1.5x) and kills (1.8x)
- **Screen shake**: Intensity-based decay on major hits
- **Voice lines**: Russian-flavored personality adds charm, 3s cooldown prevents spam
- **Status effect visuals**: Player glows green (poison), orange (burn), cyan (freeze)
- **Elite glow**: Golden aura + 1.5x scale makes elites visually distinct
- **Acceleration-based movement**: Physics-feel (80 accel, 60 decel) rather than snappy grid movement
- **Deterministic spawn patterns**: Ring, dual arc, cross, triangle, diamond, spiral - allows positioning skill

### Critical Dead Spots

**No Tactile Impact**:
- No hit-stop (freeze frames) on crits or boss kills - everything feels weightless
- No knockback on hits - enemies walk through player, player walks through enemies
- Combat audio too quiet (0.1-0.2 volume) and too short (30-80ms) - barely audible
- Hit flash only works on bosses (mesh-based) - regular enemies show no hit reaction

**No Collection Juice**:
- XP gems just disappear on collection - no particle trail, no chime chain
- No combo counter for rapid pickups
- No "vacuum" satisfying sound when magnet pulls many gems

**No Danger Escalation**:
- No low-HP vignette, color shift, or heartbeat audio
- No "almost leveled" glow when XP bar hits 90%
- No spawn telegraph (enemies just appear, no portal/rift/ground circle)
- No environmental audio (no footsteps, no ambient, no world reactivity)

### Juice Improvements (Ranked by Impact/Effort)

**Quick Wins** (change a few values):
1. Increase combat audio volume from 0.1-0.2 to 0.3-0.5
2. Add 15ms hit-stop on critical hits
3. Add red vignette + heartbeat when below 25% HP
4. Enable white flash for all enemies, not just bosses
5. Add XP collection particle trail (reuse existing VFX pool)

**Medium Effort**:
6. Knockback on strong hits (push enemies 0.5 units away from damage source)
7. Spawn telegraphs (ground circle glows 0.5s before enemy materializes)
8. XP collection chime that pitches up with rapid consecutive pickups
9. Footstep audio tied to player velocity
10. Progress bar glow/pulse at 90%+ to next level

**Higher Effort**:
11. Time dilation on boss death (0.3x speed for 0.5s, then snap back)
12. Dynamic ambient audio layer that intensifies with enemy count
13. Screen-edge danger indicators showing offscreen elite/boss direction
14. Death recap screen showing last 5 damage sources and amounts

---

## Design Philosophy Notes

### What Makes Vampire Survivors Work
1. **Power fantasy escalation**: Start weak, end as screen-clearing god
2. **Constant micro-decisions**: Every level-up is meaningful
3. **Discovery joy**: Finding new evolutions, synergies, secrets
4. **"One more run"**: Meta progression makes every run feel productive
5. **Readable chaos**: 500 enemies on screen but you can still parse threats

### Where Slavic Survivors Can Differentiate
1. **Character arsenals**: Restricted weapon pools force different strategies (already done, needs polish)
2. **Slavic mythology depth**: Rich untapped lore for enemies, worlds, items
3. **3D model weapons**: GLB vehicles/companions are visually unique vs pixel-art competitors
4. **HandCash economy**: Real-money integration for tournaments/NFTs is unique in the genre
5. **Deterministic replays**: Share and watch specific runs - community/competitive angle
6. **World-specific mechanics**: Environmental hazards make each world play differently, not just look different
7. **In-run events**: Random encounters break up the "walk in circles" monotony

---

## Deep Dive: EventSystem Design

The EventSystem has a clean interface (`GameEvent` with `onStart`, `onEnd`, `update`, `SystemContext`) but zero content. Here's a concrete event catalog designed around the existing architecture:

### Recurring Events (Timer-Based)

**Blood Moon** (every 7 min, 30s duration):
- `onStart`: Set spawnSystem rate multiplier to 2x, XP drop multiplier to 2x, tint sky red
- `update`: Pulse screen edge red every 5s
- `onEnd`: Restore multipliers, restore sky
- Player decision: Stay and farm the 2x XP, or play safe

**Wandering Merchant** (every 5 min, 20s duration):
- `onStart`: Spawn merchant NPC entity at edge of screen, invulnerable
- `update`: Merchant walks toward player slowly. If player touches: open shop UI (pause game)
- `onEnd`: Merchant despawns with poof VFX
- Shop offers: Reroll (free upgrade choice), Heal (restore 50% HP), Random passive level-up
- Cost: XP from current bar (spend 30% of current level progress)

**Relic Drop** (every 4 min):
- `onStart`: Spawn glowing chest at random position 10-15 units from player
- `update`: Chest pulses with light pillar visible from distance. After 15s, despawns
- Player must walk to it within time limit. Reward: guaranteed evolution-eligible upgrade (if available) or random legendary

### Random Events (Probability-Based)

**Treasure Goblin** (15% chance per minute after minute 3):
- `onStart`: Spawn fast enemy (speed 12, HP = current wave average) that runs AWAY from player
- `update`: Goblin drops small XP trail as it runs. If killed within 8s: burst of 10x normal XP
- `onEnd`: If not killed, goblin escapes - nothing happens
- Audio cue: distinctive jingling sound on spawn

**Cursed Shrine** (10% chance per minute after minute 5):
- `onStart`: Spawn interactable shrine object. Player touches to open choice UI
- Choices (pick 1):
  - "Blood Pact": -30 max HP permanently, +25% might permanently
  - "Speed Demon": -2 armor permanently, +30% move speed permanently
  - "Glass Cannon": Take 2x damage for 60s, deal 3x damage for 60s
  - "Reject" (walk away): Nothing happens
- These stack across multiple shrines per run

**Angel Blessing** (8% chance per minute after minute 8):
- `onStart`: Golden light from above, brief invulnerability (3s)
- Effect: Fully heal + grant one random stat buff for rest of run (+10% of one stat)

**Ambush** (12% chance per minute after minute 4):
- `onStart`: Screen flash, all enemies spawn from ONE direction in tight formation
- `update`: 3 waves of 15 enemies each, 2s apart, from same direction
- Creates a "hold the line" moment. Player should dodge sideways

### Boss-Linked Events

**Minion Frenzy** (triggers at boss 50% HP):
- `onStart`: Triple background spawn rate
- `onEnd`: When boss dies, all remaining minions die in chain explosion
- Creates hectic "survive the adds" phase

**Arena Shrink** (triggers at boss 25% HP):
- `onStart`: Red boundary circle appears at 20 unit radius
- `update`: Circle shrinks 0.5 units/second. Player takes damage outside circle
- Forces close-range engagement with boss

### Implementation Note
The existing `GameEvent` interface supports all of this. Events just need to be registered in `setupEvents()` with appropriate timing. Random events can use `SeededRandom` with time-based seeds to maintain determinism for replays.

---

## Deep Dive: HandCash Economy Loop

The monetization infrastructure is **production-ready** (payments, webhooks, minting, templates, collections, audit logging) but disconnected from gameplay. Here's how to connect them:

### The Core Economy Loop

```
Play Game → Earn Seeds → Spend Seeds on Meta Upgrades → Play Better
    ↓                         ↑
  (optional)              (optional)
    ↓                         ↑
Buy Seeds ←→ HandCash BSV Payment
```

### Tier 1: Prove the Loop (Free-to-Play)
1. **Fix seed earning** - Re-enable seed rewards in `useGameEngine.ts`
2. **Fix seed spending** - Re-enable meta upgrade bonuses in player stats
3. **Move seeds to database** - Migrate from localStorage to `users` table metadata
4. This alone creates a functional progression loop with zero monetization

### Tier 2: Cosmetic NFTs (Low Risk Monetization)
1. **Mint character skins as NFTs** using existing template system
2. **Check ownership via `getInventory()`** at game start
3. **Apply cosmetic in-game** based on owned NFT attributes
4. Example skins: "Golden Boris", "Neon Babushka", "Chernobyl Vadim"
5. Pricing: $1-5 per skin via HandCash payment → webhook → auto-mint

### Tier 3: Competitive Economy (Medium Risk)
1. **Daily Challenge Entry** - Free to play, but $0.50 to submit score to leaderboard
2. **Weekly Tournament** - $2 buy-in, prize pool split among top 10
3. **Deterministic replays** prove legitimacy (seeded RNG, verifiable outcomes)
4. Already has `access_collection_id` gating on replay submission

### Tier 4: Full Economy (Higher Risk)
1. **Seed Bundles** - Buy 500 seeds for $1 (skip the grind)
2. **Season Pass NFT** - $5/season, unlocks exclusive character + world + cosmetics
3. **Consumable Power-ups** - Mint as NFTs, burn on use (extra life = $0.25)
4. **Achievement NFTs** - Auto-mint when unlocked, tradeable on secondary market

### What NOT To Do
- No pay-to-win weapons or stat advantages purchasable with real money
- No loot boxes or randomized purchases
- No energy/stamina systems that gate play time
- Seeds earned in-game should always be the primary progression path
- Real money should only buy time savings (seed bundles) or cosmetics

### Revenue Model Math
- 1000 DAU, 10% conversion, $3 avg spend = $300/day
- Tournament entry (100 players × $2 × 7 days) = $1,400/week
- Cosmetic sales (50/day × $2 avg) = $100/day
- Realistic early target: $500-1000/month from engaged community

---

## Deep Dive: New Player Journey & Retention

### The First 5 Minutes (Discovery Phase)

**What happens**: Player sees Main Menu → picks Dark Forest → sees 9 characters (8 locked) → picks Boris → game starts.

**What's missing**: Zero tutorial. No "WASD to move." No "weapons fire automatically." No "collect green gems for XP." The game relies entirely on genre literacy (assumes player has played Vampire Survivors). This is fine for the core audience but kills retention for anyone discovering the genre here.

**Fix (minimal, non-intrusive)**:
- First-run-only overlay: 3 tooltip bubbles that appear and fade
  - "WASD to move" (appears at second 0, fades after 5s)
  - "Weapons fire automatically" (appears at second 3, fades after 5s)
  - "Collect XP gems to level up" (appears at first enemy kill)
- Never shows again after first run (localStorage flag)
- No pause, no modal, no "press OK to continue" - just fading text

### Minutes 5-15 (Learning Phase)

**What happens**: Player levels up, sees 3 upgrade cards, picks one. Some cards show "LOCKED." Enemies get harder. Player dies around minute 10-15.

**What's confusing**:
- Stat names are unclear: "Might" (damage), "Area" (AoE size), "Cooldown" (attack speed)
- Locked items say "Requires [weapon] at level 5" but evolution system is never explained
- Character arsenal restrictions aren't visible during selection - player discovers limits when upgrades are locked
- Synergy icons appear in HUD with no legend

**Fix**:
- Add hover tooltips on character select stat bars ("Might: Increases all weapon damage")
- On first evolution-eligible upgrade: brief tooltip "Max a weapon + own the right passive = EVOLUTION"
- Show character arsenal on select screen: "Available weapons: TT33, Knuckles, Peppermill..."

### Minutes 15-30 (Hook Phase)

**What happens**: Player dies, sees stats, hits "TRY AGAIN." Second run goes better. Maybe reaches level 10+ and sees "character unlocked" notification.

**What's working**: Quick restart, character unlock as carrot, improving through knowledge.

**What's broken**: Meta progression exists in pause menu but player likely never opens it. Sunflower seeds are earned (when fixed) but player doesn't know they exist. Achievements silently tracked but never surfaced.

**Fix**:
- Post-death screen: "You earned X Sunflower Seeds! Spend them on permanent upgrades." with button to MetaUpgrades
- Achievement toast on unlock (slide in from top, 3s duration)
- First death: show "TIP: Try different weapons and passives to discover Evolutions" on GameOver screen

### Hour 1-3 (Retention Phase)

**What keeps them**: Character unlocks (9 total, sequential), build experimentation, world progression.

**What loses them**: If meta progression is broken (currently is), there's no permanent progress. Each run is isolated. The "one more run" hook depends on feeling like each run MATTERS for long-term progress.

**Fix**: This is why reconnecting meta progression is priority #1. Every run should deposit seeds. Seeds should buy meaningful upgrades. The loop is: play → earn → upgrade → play better → earn more.

### Week 1+ (Mastery Phase)

**What's here**: 3 worlds, 9 characters, 18 evolutions to discover, leaderboards, replays.

**What's missing**: Daily challenges (reason to log in daily), season/event content, social features (share replays, compare builds), prestige system for maxed players.

## Deep Dive: Weapon Differentiation Problem

### The Problem
28 of 43 weapons reuse base classes with only stat changes. Examples:

| Weapon | Class Used | What Changes | Feels Like |
|--------|-----------|--------------|------------|
| Peppermill Gun | TT33Weapon | cooldown 0.2, damage 7 | Fast TT33 |
| Gzhel SMG | GhzelAKWeapon | cooldown 0.25, damage 15 | Slightly different AK |
| Orthodox Visors | TT33Weapon | damage 38, cooldown 0.5 | Slow TT33 |
| Kabar Knife | DaggerWeapon | speed 14, cooldown 0.6 | Slow dagger |
| Skull Screen | GarlicAura | radius 4.0, damage 26 | Bigger garlic |
| Soviet Stick | MeleeWeapon | radius 2.5, damage 35 | Slower shank |
| All vehicles | LadaVehicle | damage varies | Same car, different number |
| All evolutions | Base class | damage * 4-5 | Same weapon, bigger numbers |

The result: picking "Peppermill Gun" vs "TT33 Pistol" feels like choosing between spreadsheet rows, not between weapons with distinct gameplay identities.

### What Each Weapon SHOULD Feel Like

**Weapons that need mechanical identity (not just stat changes):**

**Peppermill Gun** → "Shotgun Spray"
- Fire 5-8 bullets in a cone spread (not single target like TT33)
- Short range (0.6 life), high spread angle
- Devastating up close, useless at range
- Creates a "get close for massive damage" gameplay pattern

**Soviet Stick** → "Spin Attack"
- Full 360° sweep (not frontal arc like other melee)
- Brief windup animation (0.3s telegraph)
- Knockback on hit (pushes enemies away)
- Creates space - defensive melee vs shank's aggressive melee

**Kabar Knife** → "Execute"
- Teleport-dash to target (short range, 3 units)
- Bonus damage to enemies below 30% HP (2x)
- Single target only, high damage
- Creates a "finish off wounded targets" role

**Orthodox Visors** → "Beam Sweep"
- Continuous beam that sweeps in arc over 1.5s (not a projectile)
- Hits everything in the sweep path
- DPS scales with dwell time (staying on one target = more damage)
- Creates the "hold your ground and sweep" archetype

**Skull Screen** → "Orbiting Shield"
- Skulls orbit player at fixed positions (not aura tick damage)
- Each skull blocks one incoming hit then reforms after 3s
- Contact damage to enemies that touch skulls
- Creates "orbiting shield" that both protects and damages

**Gzhel SMG** → "Burst Fire with Spread"
- Fire 3-round bursts at target
- Each bullet in burst spreads slightly
- Brief pause between bursts (0.8s)
- Creates "rhythm" of burst-pause-burst vs constant stream

**Kvass Reactor** → "Buff Zone" (not damage tower)
- Deploy zone that heals player 5 HP/s when inside
- Boosts weapon damage +20% while standing in zone
- Attracts XP gems within radius
- Creates anchor point - player wants to fight near it

**Dadushka Chair** → "Battering Ram"
- Charges in straight line on cooldown
- Stuns all enemies hit for 1s
- Leaves damage trail behind
- Different from Lada's circle path - linear charge pattern

**Tank Stroller** → "Area Denial"
- Drives in figure-8 pattern around player
- Leaves oil slick trail that slows enemies 50%
- Lower damage than other vehicles but massive utility
- Creates "safe zone" of slowed enemies

**Gopnik Gondola** → "Air Strike"
- Floats above, drops bombs every 2s on densest enemy cluster
- Bombs have AoE splash radius
- Ignores ground obstacles
- Creates "area bomber" vs vehicles' "contact damage" pattern

### Evolutions That Need Identity

Currently all evolutions are "base weapon × 4 damage." Each should transform the weapon's behavior:

**Soul Siphon** (evolved Skull Screen): Skulls now chain damage between enemies. Each enemy hit passes damage to nearest enemy at 80% power. More enemies = more chains.

**Silver TT33** (evolved TT33): Bullets ricochet between 3 enemies. Reduced per-bounce damage but massive effective DPS against groups.

**Vodka Flamethrower** (evolved Peppermill): Continuous cone of fire (not bullets). Sets enemies ablaze for burn DoT. Hold pattern - fire in direction of movement.

**Phantom Blade** (evolved Shank): Dash-attacks through enemies like a teleport. Each kill resets the dash cooldown. Kill chain potential.

**Propaganda Storm** (evolved Propaganda Tower): Tower now creates tornado that moves toward enemies. Pulls enemies in and damages them. Mobile vs static.

**Immortal Lada** (evolved Haunted Lada): Phases through enemies AND creates ghost duplicates. 3 ghost ladas circle instead of 1.

### Implementation Priority
Don't try to differentiate all 28 at once. Priority order:
1. **Peppermill → cone spray** (most played uncommon, easiest to differentiate)
2. **Orthodox Visors → beam sweep** (legendary should feel legendary)
3. **Skull Screen → orbiting shield** (unique protective mechanic)
4. **Soviet Stick → spin attack** (360° makes it visually distinct)
5. **Kvass Reactor → buff zone** (support weapon archetype missing entirely)

Each requires a new weapon class (~100-150 lines) but reuses existing projectile/collision infrastructure.

---

## Revised Top 10 (Final Ranking)

After four rounds of analysis (systems, feel, economy, weapons), here are the definitive best ideas:

1. **Reconnect meta progression** - Broken reward loop, everything else depends on this
2. **Game juice quick wins** - Audio volume, hit-stop, vignette. Minutes of work, massive feel improvement
3. **Spacebar dodge roll** - Skill expression, boss telegraph dodging, escape from corners
4. **EventSystem: Treasure Goblin + Cursed Shrine** - Two events that add decision-making and excitement
5. **Boss phases for Chernobog** - Eclipse mechanic (darkness + combined attacks) is a true final boss
6. **Daily Challenge mode** - Leverages existing replay/leaderboard infra, creates daily retention
7. **Move seeds to database + fix earning** - Foundation for any future monetization
8. **Knockback on strong hits** - Small physics change, huge impact feel improvement
9. **Character ultimates** - Makes character choice meaningful beyond stat differences
10. **Cosmetic NFT skins** - First real monetization step, low risk, uses existing mint pipeline

---

## Sprint Plan: Where To Start

### Sprint 1: "Make It Feel Right" (Game Feel + Broken Systems)

**Task 1: Reconnect meta progression**
- `hooks/useGameEngine.ts` — Find the comment that strips meta bonuses, re-enable stat application from `lib/meta-progression-storage.ts`
- `hooks/useGameEngine.ts` — Re-enable seed rewards on death (line ~1261) and victory (line ~1171)
- Verify: Seeds earned → Seeds spent → Bonuses applied → Player starts stronger next run

**Task 2: Game juice values**
- `components/game/core/AudioManager.ts` — Increase combat volume constants from 0.1-0.2 → 0.3-0.5
- `components/game/entities/EntityManager.ts` — Add hit flash for regular enemies (extend boss-only white flash to all)
- `components/game/systems/VFXManager.ts` — Add XP collection particle burst (reuse existing `createParticleBurst`, trigger on gem pickup)
- New: Add low-HP vignette overlay in HUD (CSS red gradient when HP < 25%)

**Task 3: Dodge roll**
- `components/game/entities/Player.ts` — Add `dodge()` method: 8-unit dash in movement direction, 0.35s i-frames, 1.5s cooldown
- `hooks/useGameEngine.ts` — Bind spacebar to `player.dodge()`
- First-run tooltip: "SPACE to dodge" (appears once on first hit taken)

### Sprint 2: "Make It Interesting" (Events + Boss Mechanics)

**Task 4: EventSystem - Treasure Goblin**
- `components/game/systems/EventSystem.ts` — Add to `setupEvents()`: spawn goblin entity at random intervals (15% chance/min after min 3)
- `components/game/entities/Enemy.ts` — Add `treasure_goblin` type: speed 12, runs AWAY from player, drops 10x XP on death, despawns after 8s
- `components/game/data/enemies.ts` — Add treasure_goblin stats
- Audio: distinctive spawn jingle in AudioManager

**Task 5: EventSystem - Cursed Shrine**
- `components/game/systems/EventSystem.ts` — Add shrine spawn (10% chance/min after min 5)
- New entity: interactable shrine object (player touches → choice UI appears)
- New UI component: CursedShrineChoice (3 options: HP-for-damage, armor-for-speed, temporary-glass-cannon)
- Choices apply permanent stat modifications to player

**Task 6: Chernobog boss phases**
- `components/game/entities/Enemy.ts` — Extend Chernobog's `updateBossAbilities`:
  - Phase 1 (100-60%): Shadow orbs (slow projectiles, 8-way pattern every 4s — already partially there)
  - Phase 2 (60-30%): Dark zones (spawn shadow patches on ground that damage player)
  - Phase 3 (<30%): Eclipse (reduce visibility radius, combine all attacks, increase speed)
- `components/game/systems/VFXManager.ts` — Add dark zone ground effect, visibility reduction overlay

### Sprint 3: "Make Them Come Back" (Retention + Differentiation)

**Task 7: Wire achievements**
- `lib/achievement-tracker.ts` — Already complete, just needs calling
- `hooks/useGameEngine.ts` — Hook tracker into: kill events, level-up events, time milestones, boss defeats
- New toast component: slide-in notification on achievement unlock

**Task 8: First-run onboarding**
- New component: `components/game/ui/OnboardingTooltips.tsx`
- 3 fading text overlays on first-ever run only: "WASD to move" → "Weapons fire automatically" → "Collect gems to level up"
- localStorage flag: `slavic_survivors_onboarded`

**Task 9: Weapon differentiation (top 2)**
- New class: `components/game/content/weapons/PeppermillWeapon.ts` — Cone spray, 5-8 bullets in spread
- New class: `components/game/content/weapons/VisorsWeapon.ts` — Continuous beam that sweeps in arc
- Update `AbilitySystem.ts` to use new classes instead of TT33Weapon clones

### Beyond Sprint 3
- Daily challenges (uses existing replay + leaderboard infra)
- Character ultimates (kill-charged supers per character)
- Knockback physics (EntityManager collision response)
- Database-backed seeds (migrate from localStorage)
- Cosmetic NFT skins (HandCash mint pipeline)

---

## Deep Dive: Level Editor as UGC Platform

### What Already Exists (2,559-line Editor)
The level editor is a **production-ready, professional-grade tool** with 6 tabs:
- **Timeline**: Script enemy spawns with pattern templates, batch operations, CSV import/export, auto-validation
- **Meshes**: Place 3D obstacles with scale/rotation/collision controls
- **Paint**: Scatter decorations or color terrain with brush tools
- **Settings**: Difficulty, win conditions, enemy whitelists, theme colors, borders
- **Visual Editor**: 3D isometric preview with gizmos, spline paths, undo/redo
- **JSON**: Raw data editing with validation

Players can create scripted encounters, build 3D environments, design custom difficulty curves, and set win conditions. The format is clean self-contained JSON (schema v2).

### What's Missing for UGC
The editor is complete. The **infrastructure** for sharing is not:
- Levels are stored in localhost JSON or localStorage (not database)
- No creator attribution, no publishing workflow
- No community browser, search, or discovery
- No social features (likes, play counts, leaderboards per level)
- API endpoints are localhost-only (403 on production)

### The Opportunity: "Slavic Mario Maker"
This is the game's **biggest untapped differentiator**. No other bullet-heaven game has a level editor this complete. Combined with HandCash, it could become:

1. **Community level browser** in main menu (browse/search/play custom levels)
2. **Per-level leaderboards** with replay sharing (deterministic replays already work)
3. **Creator economy** via HandCash micropayments:
   - Pay $0.10 to play a premium custom level
   - Creator gets 70% ($0.07), game gets 30% ($0.03)
   - Popular creators earn real money from their designs
4. **NFT levels** - mint limited-edition level designs as collectibles
5. **Weekly featured levels** curated by admins
6. **Tournament hosting** on community levels with prize pools

### UGC Implementation Path

**Phase 1 (MVP)**: Add `custom_levels` database table with `creator_user_id`, publish endpoint, basic community browser in main menu, play count tracking.

**Phase 2 (Discovery)**: Likes, search/filters, thumbnails, featured list, creator attribution.

**Phase 3 (Economy)**: Paid levels via HandCash, creator revenue share, per-level leaderboards with replays.

### Why This Matters
- **Content is infinite** - community creates levels faster than developers ever could
- **Retention is built-in** - new levels every day, reasons to return
- **Monetization is organic** - creators motivated to make great levels = more content = more players
- **HandCash makes it unique** - no other UGC game has real micropayments for creators
- **Replays prove fairness** - deterministic gameplay means leaderboard integrity

The level editor transforms Slavic Survivors from "a game you play" into "a platform you create on."

---

## Deep Dive: Balance Math

### Weapon DPS Curve
The formula is `DPS = 30 + (minLevel - 1) × 5`:

| MinLevel | Target DPS | Actual Weapons | Notes |
|----------|-----------|----------------|-------|
| 1 | 30 | TT33 (30), Shank (30), Knuckles (30), Dagger (30) | Clean |
| 2 | 35 | Stilleto (30), Holy Water (?), Cross (?), Stake (?) | Stilleto under-target |
| 3 | 40 | Salt (?) | Area weapons hard to measure DPS |
| 4 | 45 | Radioactive AK (?), Soviet Stick (35) | Soviet Stick under-target |
| 5 | 50 | Peppermill (35), Vampire Rat (35) | Both significantly under |
| 6 | 55 | Pig Luggage (25 + utility) | Low DPS offset by HP drops |
| 8 | 65 | Kabar (45) | 20 DPS under target |
| 9 | 70 | Grail (45/enemy, multi-hit) | AoE makes up difference |
| 10 | 75 | Propaganda Tower (50) | Under but AoE + slow |
| 11-12 | 80-85 | Dadushka (55), Tank Stroller (55) | Both 25-30 under target |
| 14 | 95 | Gzhel SMG (60) | 35 under target |
| 15 | 100 | Kvass Reactor (60) | 40 under, but heals |
| 16 | 105 | Skull Screen (65/enemy) | Multi-hit compensates |
| 18 | 115 | Gopnik Gondola (70) | 45 under target |
| 20 | 125 | Orthodox Visors (76) | 49 under target |
| 22 | 135 | Nuclear Pigeon (75) | 60 under target |
| 24 | 145 | Haunted Lada (85) | 60 under target |
| 26 | 155 | Big Biz Lada (95) | 60 under target |

**Problem**: The DPS formula targets are never actually met by higher-tier weapons. The gap between target and actual DPS grows from 0 at minLevel 1 to 60 at minLevel 26. This means **higher-rarity weapons feel underwhelming** relative to expectations. A level 5 TT33 at 30 base DPS × 5 levels of upgrades might out-DPS a freshly acquired Legendary.

### Enemy HP Curve

| Enemy | HP | Time to Kill (30 DPS) | Time to Kill (95 DPS) |
|-------|-----|----------------------|----------------------|
| Domovoi | 5 | 0.17s | 0.05s | Instant |
| Sapling | 8 | 0.27s | 0.08s | Instant |
| Drifter | 15 | 0.50s | 0.16s | Fast |
| Screecher | 35 | 1.17s | 0.37s | Quick |
| Bone Crawler | 45 | 1.50s | 0.47s | Quick |
| Frost Elemental | 55 | 1.83s | 0.58s | Moderate |
| Bruiser | 90 | 3.00s | 0.95s | Moderate |
| Spirit Wolf | 80 | 2.67s | 0.84s | Moderate |
| Stone Golem | 200 | 6.67s | 2.11s | Spongy |
| Forest Wraith | 250 | 8.33s | 2.63s | Spongy |
| Werewolf | 1200 | 40.0s | 12.6s | Very long |
| Ancient Treant | 6000 | 200s | 63s | Boss fight |
| Leshy | 15000 | 500s | 158s | Very long boss |
| Chernobog | 30000 | 1000s | 316s | ~5 minute fight |

**Observations**:
- Early enemies (5-35 HP) die almost instantly regardless of weapon - this is correct, creates power fantasy
- Mid enemies (45-90 HP) have a 2-3 second sweet spot that feels engaging
- Stone Golem and Forest Wraith (200-250 HP) are damage sponges even with good weapons
- **Werewolf at 1200 HP is problematic** - takes 12-40 seconds per kill as a regular enemy
- Boss HP is appropriate (1-5 minute fights depending on gear)
- **The 200-1200 HP "elite" range is the most important to get right** - these enemies need to feel tough but killable

### The Real Balance Issue

The game has **6 weapon slots × 30-95 DPS each = 180-570 total DPS** at any given time. But weapons don't all fire simultaneously, and many are single-target. Effective DPS against a horde is much lower than the sum of individual weapons.

**Missing from balance**: No accounting for multi-target efficiency. A 30 DPS garlic aura hitting 10 enemies = 300 effective DPS. A 95 DPS single-target Lada = 95 effective DPS. Area weapons are dramatically undervalued by the DPS formula.

### Balance Recommendations

1. **Bump higher-tier weapon DPS** to actually match the formula targets. A Legendary at minLevel 20 should hit 125 DPS, not 76.
2. **Or** accept that higher-tier weapons have utility (AoE, pierce, vehicles, companions) that compensates for lower raw DPS, and adjust the formula to reflect this.
3. **Werewolf HP is too high** for a non-boss - 1200 HP should be 400-600 for a regular elite.
4. **Stone Golem at 200 HP** is fine if it spawns rarely, but could feel spongy in groups. Consider adding a "weak point" mechanic (bonus damage from behind).
5. **Boss fight length is good** - 1-5 minutes depending on gear is the Vampire Survivors standard.

---

## Deep Dive: Audio Identity

### Current State
- **No music** - `playMusic()` and `playBiomeMusic()` are stubbed out ("Music files removed")
- **Procedural SFX only** - All combat/UI sounds are Web Audio oscillators (sine, square, sawtooth, triangle waves)
- **File-based SFX**: Only 4 sound types have actual WAV files: whoosh (3 variants), pop (1), punch (3 variants), fanfare (3 variants)
- **Voice lines exist**: 10 damage grunts, 4 upgrade flavors, 2 evolution flavors, 2 boss flavors, 3 death flavors, 3 victory flavors, plus functional lines (choose upgrade, boss incoming, game over, victory) and timeline voicelines
- **Adaptive music infrastructure exists** but is unused (`updateMusicIntensity()` adjusts volume of nonexistent music)

### What Works
- Voice lines are the game's **best audio feature** - Russian-accented flavor text adds enormous personality
- Damage grunt variety (10 variants with 3s cooldown) prevents repetition
- The flavor line system (50% chance after functional line, random selection) is well-designed
- Timeline voiceline support means levels can have narrated moments

### What's Broken
- Combat sounds at 0.06-0.15 volume are **effectively silent** during gameplay
- Most SFX are 30-80ms oscillator blips - too short to register consciously
- No music means the game is **mostly silent** outside of occasional voice lines
- The adaptive intensity system (`currentMusicIntensity`, `targetMusicIntensity`) is fully coded but drives nothing
- `Math.random()` used in `getRandomVariation()` instead of SeededRandom (breaks determinism for replays if SFX trigger game state)

### Audio Direction Recommendations

**Immediate (volume + duration fixes):**

| Sound | Current | Recommended | Why |
|-------|---------|-------------|-----|
| Enemy hurt | 0.1, 40ms | 0.3, 60ms | Must be audible feedback |
| Enemy die | 0.15 (pop.wav) | 0.35 | Satisfying kill confirmation |
| Player attack | 0.12-0.18 | 0.3-0.4 | Player actions need weight |
| Player hurt | 0.15 | 0.4 | Danger must register |
| Gem pickup | 0.15 (pop.wav) | 0.25 + pitch scaling | Collection should feel rewarding |
| Level up | 0.15 (fanfare) | 0.5 | Major event, needs presence |
| Evolution | 0.2 | 0.5 | Biggest power spike, biggest sound |
| Boss spawn | 0.3 | 0.5 | Threat announcement |
| Critical hit | 0.25 (punch.wav) | 0.45 | Power fantasy moment |

**Medium-term (new sounds needed):**

1. **XP gem collection chain** - Ascending pitch chimes: first gem at 400Hz, each subsequent within 0.5s adds 50Hz. 10 rapid gems = satisfying ascending scale. Resets after 0.5s gap.

2. **Low-HP heartbeat** - When below 25% HP, play rhythmic low-frequency pulse (60Hz sine, 0.15 volume, 0.8s interval). Gets faster as HP drops. Creates urgency without being annoying.

3. **Spawn warning** - 0.5s before enemy wave materializes, play brief rumble (40Hz sawtooth, 0.2 volume, 0.3s). Gives player heads-up.

4. **Dodge whoosh** - When dodge roll is added, use existing whoosh.wav variants at 0.4 volume. Satisfying movement feedback.

**Long-term (music):**

The game needs background music. Options:
- **Procedural ambient** - Layer oscillator drones that shift with intensity. Dark Forest = low strings drone. Frozen Waste = high sine shimmer. Catacombs = reverbed percussion.
- **Generated tracks** - Use MiniMax music generation (available via MCP) to create biome-specific tracks
- **Licensed music** - Slavic folk metal / darkwave tracks (most expensive, most polished)

The adaptive intensity system is already built. It just needs something to drive. Even a simple procedural drone layer that gets more dissonant as enemy density increases would transform the atmosphere.

---

## Deep Dive: Streamability & Growth

### Why Vampire Survivors Went Viral
1. **Visually readable at a glance** - Viewers instantly understand what's happening
2. **Constant escalation** - Screen goes from empty to absolute chaos over 30 minutes
3. **Decision moments** - Level-up pauses let viewers shout "PICK THE WHIP!"
4. **Discovery moments** - First evolution, secret characters, hidden items = clip-worthy
5. **Low barrier** - Anyone can watch and understand, even non-gamers

### What Slavic Survivors Has Going For It
- **Voice lines** are inherently funny/clip-worthy ("Back to gulag!", "Babushka knows best")
- **Weapon names** are absurd and memorable (Nuclear Pigeon, Propaganda Tower, Pig Luggage)
- **Character variety** creates different run narratives (Chernobyl Ghost dying constantly, Strigoi lifesteal builds)
- **3D model weapons** (Ladas, gondolas) are visually distinctive vs pixel-art competitors
- **Slavic theme** is unique in the market - stands out in Twitch thumbnails

### What's Missing for Streamability

**Viewer Interaction:**
- Twitch chat voting on level-up choices (pick 1 of 3 via chat poll)
- "Chat spawns enemies" integration (chat types enemy names to spawn them)
- Viewer-triggered events (channel point redeems = blood moon, treasure goblin)

**Clip-Worthy Moments:**
- Boss phase transitions need dramatic visual + audio (screen flash, slow-mo, voice line)
- Evolution acquisition needs a "holy shit" moment (time freeze, zoom, particle explosion)
- Near-death escapes need replay capability (last 5s replay on death screen)
- First-time discoveries should be visually celebrated (new weapon/evolution found popup with fanfare)

**Spectator Features:**
- Replay sharing with URL (send to friends, embed in Discord)
- "Watch this run" button on leaderboard entries
- Highlight reel auto-generation (boss kills, evolutions, close calls)

**Content Creator Tools:**
- Run seed sharing ("Try my exact run: seed 48291")
- Challenge mode seeds that go viral ("Can you beat the impossible seed?")
- Custom level sharing creates infinite community content
- Tournament spectator mode (watch multiple players side by side)

### Growth Loop
```
Streamer plays → Viewers see funny moments → They try the game →
They share replays → Friends try it → Some become streamers → Loop
```

The HandCash angle adds: streamers can create tournament events with real prize pools, making the game attractive for competitive content creators.

### Quick Wins for Streamability
1. **Make evolution acquisition dramatic** - 0.5s time freeze, zoom to player, particle explosion, triumphant voice line. This is the #1 clip moment in every bullet-heaven game.
2. **Add seed display on HUD** - Small text showing run seed so viewers can try the same run
3. **Boss kill celebration** - 1s slow-mo on boss death with kill count popup
4. **"New discovery" popup** - First time finding a weapon/evolution across all runs gets a special notification
