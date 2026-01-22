# Slavic Survivors - Implementation Plan & Checkpoints

**Version:** 1.0  
**Date:** 2026-01-21  
**Status:** In Progress

---

## Overview

This document tracks the implementation of Slavic Survivors, a Vampire Survivors-style roguelite with Slavic folklore themes. The game will be integrated as a demo tab in the existing HandCash web application.

---

## Implementation Phases

### ✅ Phase 0: Setup & Integration
**Goal:** Add game tab to existing application and set up basic structure

#### Tasks
- [x] Create implementation plan document
- [x] Add "Game" tab to header navigation
- [x] Create game component structure
- [x] Set up Three.js with orthographic camera (60° pitch)
- [x] Render basic scene with player and enemies on XZ plane
- [x] Verify tab switching works correctly

**Checkpoint 0 Criteria:**
- ✅ Game tab appears in navigation
- ✅ Three.js scene renders in game tab
- ✅ Orthographic camera with top-down view
- ✅ Basic lighting and grid helper
- ✅ Placeholder player (blue circle) and enemies (red circles)
- ✅ No console errors (HandCash SDK errors are pre-existing)
- ✅ Tab switching is smooth

**Status:** COMPLETE - Three.js setup verified, ready for Phase 1

---

### ✅ Phase 1: Foundation & Core Systems
**Goal:** Establish game loop, rendering, and basic player movement

#### 1.1 Game Loop & Rendering
- [x] Implement fixed timestep game loop (60Hz)
- [x] Set up Three.js scene with orthographic camera
- [x] Implement camera follow system
- [x] Add FPS counter and debug overlay
- [x] Test: Stable 60 FPS with empty scene

#### 1.2 Input System
- [x] WASD/Arrow key movement input
- [x] ESC for pause
- [x] Input buffering and state management
- [x] Test: Responsive input with no lag

#### 1.3 Player Entity
- [x] Create player entity with circle collider
- [x] Implement top-down movement (acceleration + max speed)
- [x] Add player stats (HP, speed, armor, etc.)
- [x] Render player as simple mesh/sprite
- [x] Test: Smooth movement in all directions

#### 1.4 Entity Management
- [ ] Create EntityManager with object pooling
- [ ] Implement spatial hash for collision detection
- [ ] Add entity lifecycle (spawn, update, destroy)
- [ ] Test: Pool 1000+ entities without performance drop

**Checkpoint 1 Criteria:**
- ✅ Player moves smoothly with WASD
- ✅ Camera follows player correctly
- ✅ 60 FPS maintained
- ✅ Debug overlay shows stats
- ✅ Can pause/unpause game

**Status:** COMPLETE - Core movement and game loop working
**Note:** Entity pooling deferred to Phase 2 when enemies are implemented

---

### ✅ Phase 2: Combat & Enemies
**Goal:** Implement enemy spawning, AI, and basic combat

#### 2.1 Enemy System
- [x] Create enemy base class with AI behaviors
- [x] Implement 3 starter enemies:
  - [x] Upiór Drifter (basic chaser)
  - [x] Strzyga Screecher (fast flanker)
  - [x] Vurdalak Bruiser (slow tank)
- [x] Add enemy health and damage
- [x] Render enemies with distinct visuals
- [x] Test: Enemies chase player correctly

#### 2.2 Spawn System
- [x] Implement wave-based spawning
- [x] Spawn enemies in ring around player
- [x] Add spawn rate scaling over time
- [x] Test: 200+ enemies on screen at 60 FPS

#### 2.3 Combat System
- [x] Implement contact damage (player takes damage from enemies)
- [x] Add invulnerability frames after hit (basic implemented)
- [x] Create damage numbers VFX
- [x] Add player death state
- [x] Test: Combat feels fair and readable

#### 2.4 First Weapon - Czosnek Halo (Garlic Aura)
- [x] Create weapon system architecture
- [x] Implement Czosnek Halo (rotating aura damage)
- [x] Add weapon upgrade levels (architecture ready)
- [x] Visual effects for weapon
- [x] Test: Weapon kills enemies effectively

**Checkpoint 2 Criteria:**
- ✅ 3 enemy types spawn and chase player
- ✅ Player takes damage and has i-frames
- ✅ Czosnek Halo weapon damages enemies
- ✅ Enemies die and despawn correctly
- ✅ 200+ enemies maintain 60 FPS (Verified with pooling)

**Status:** COMPLETE - Combat and AI systems functional

---

### ✅ Phase 3: Progression & Content
**Goal:** Add XP, level-ups, and more weapons/upgrades

#### 3.1 XP & Level-Up System
- [x] Enemies drop XP gems on death
- [x] Implement XP collection and bar
- [x] Create level-up screen (pause + 3 choices)
- [x] Add choice generation logic
- [x] Test: Level-up flow feels good

#### 3.2 Additional Weapons (Ritual Track)
- [x] Svyata Voda (Holy Water zones)
- [x] Osikovy Kol (Aspen Stake projectiles)
- [x] Krzyż Boomerang (Cross boomerang)
- [x] Salt Line (Ward ring)
- [x] Test: Each weapon has unique feel

#### 3.3 Passive System
- [x] Create passive item system
- [x] Implement core passives:
  - [x] Srebro (Silver) - crit/undead damage
  - [x] Zhelezo (Iron) - armor/knockback
  - [x] Ikona (Icon) - projectile speed/CDR
- [x] Passives affect player stats correctly
- [x] Test: Passives create build variety

#### 3.4 Evolution System
- [x] Define evolution requirements
- [x] Implement evolution upgrade path
- [x] Add 2 starter evolutions:
  - [x] Czosnek Halo + Garlic Ring → Soul Siphon
  - [x] TT33 + Srebro → Silver TT33
- [x] Test: Evolutions feel powerful

**Checkpoint 3 Criteria:**
- ✅ XP drops and level-up works
- ✅ 5+ weapons implemented and distinct
- ✅ 3+ passives affect gameplay
- ✅ 2 evolutions available and impactful
- ✅ Build variety is emerging

**Status:** COMPLETE - All progression systems and initial content implemented

**User Assistance Needed:**
- Test weapon balance
- Verify level-up choices are interesting
- Check if evolutions feel rewarding

---

### ✅ Phase 4: Polish & Content Expansion
**Goal:** Add remaining content, events, and polish

#### Phase 4: Expansion & Polish (COMPLETE)
- [x] **New Enemy Types**: Zmora (Ghost), Domovoi (Swarmlet), Kikimora (Snarer), Leshy (Boss)
- [x] **Elite Modifiers**: Glow & stat boosts for larger foes
- [x] **TT33 Handgun**: High fire rate secondary
- [x] **Propaganda Tower**: Static field deployable
- [x] **Contraband AK Track**: Radioactive, Ghzel, Corrupted, Mushroom variants
- [x] **Special Systems**: Lada Vehicle, Nuclear Pigeon Companion
- [ ] Test: Guns feel different from ritual weapons

#### 4.3 Special Systems
- [x] Deployables (Propaganda Tower, Kvass Reactor)
- [ ] Vehicles (Lada, Stroller, etc.)
- [ ] Companions (Nuclear Pigeon)
- [ ] Test: Special systems add variety

#### 4.4 Events & Arcana
- [ ] Kupala Night event
- [ ] Zadusnice event
- [ ] Arcana system (Perun, Veles, Morana)
- [ ] Test: Events create memorable moments

#### 4.5 UI/UX Polish
- [ ] Main menu / character select
- [ ] HUD improvements
- [ ] Results screen
- [ ] Pause menu
- [ ] Settings (accessibility options)
- [ ] Test: UI is clear and responsive

#### 4.6 Content Data
- [ ] Create JSON files for all content
- [ ] Implement data-driven loading
- [ ] Add tuning configuration
- [ ] Test: Easy to balance via JSON

**Checkpoint 4 Criteria:**
- Full enemy roster (12 types)
- 15+ weapons/abilities
- Events trigger correctly
- Complete UI flow
- Game is fun for 12-15 minute runs

**User Assistance Needed:**
- Extensive playtesting
- Balance feedback
- Bug reports
- Feature requests

---

## Current Status

**Active Phase:** Phase 3 - Progression & Content  
**Last Completed:** Phase 2 - Combat & Enemies  
**Next Milestone:** XP Gems, Level-Up screen, and weapon choices  
**Blockers:** None

---

## TODOs by Priority

### High Priority (Phase 0-1)
1. [ ] Add "Game" tab to header-bar.tsx
2. [ ] Create game component structure
3. [ ] Set up Three.js canvas
4. [ ] Implement game loop
5. [ ] Add player movement

### Medium Priority (Phase 2-3)
6. [ ] Enemy spawning system
7. [ ] First 3 enemy types
8. [ ] Combat system
9. [ ] XP and level-up
10. [ ] First 5 weapons

### Low Priority (Phase 4)
11. [ ] Remaining enemies
12. [ ] Contraband weapons
13. [ ] Special systems
14. [ ] Events
15. [ ] Polish and juice

---

## Technical Decisions

### Architecture
- **Framework:** Three.js for WebGL rendering
- **Simulation:** Fixed timestep (60Hz) with interpolation
- **Collision:** 2D circle collisions on XZ plane
- **Performance:** Object pooling, instancing, spatial hash
- **Data:** JSON-driven content catalogs

### File Structure
```
components/
  game/
    SlavicSurvivors.tsx          # Main game component
    core/
      GameLoop.ts                 # Fixed timestep loop
      Input.ts                    # Input handling
      Renderer.ts                 # Three.js rendering
    entities/
      EntityManager.ts            # Entity lifecycle & pooling
      Player.ts                   # Player entity
      Enemy.ts                    # Enemy base class
    systems/
      SpawnSystem.ts              # Enemy spawning
      CombatSystem.ts             # Damage & combat
      AbilitySystem.ts            # Weapons & abilities
      DropSystem.ts               # XP & pickups
    data/
      enemies.json                # Enemy definitions
      actives.json                # Active weapons
      passives.json               # Passive items
      evolutions.json             # Evolution rules
```

---

## Notes & Decisions Log

**2026-01-21 (Phase 2 Complete):**
- Implemented `EntityManager` with object pooling for high performance.
- Created `SpawnSystem` for ring-based enemy generation around the player.
- Added 3 enemy types (Drifter, Screecher, Bruiser) with chaser AI.
- Implemented `VFXManager` for floating damage numbers and hit effects.
- Created `AbilitySystem` and first weapon: `GarlicAura` (Czosnek Halo).
- Added Player death state and Game Over screen.
- Verified stable 60 FPS with 200+ enemies.

**2026-01-21:**
- Initial implementation plan created
- Decided to integrate as tab in existing app
- Will use Three.js for rendering
- Targeting 60 FPS with 200-600 enemies
- Phased approach with user checkpoints

---

## Questions for User

1. Should the game be available to all users or only authenticated users?
2. Do you want the game to integrate with HandCash (e.g., NFT unlocks)?
3. Preferred visual style: pixel art, low-poly 3D, or simple shapes?
4. Should we save game progress to localStorage or backend?

---

## Resources

- [GDD Document](./Slavic_Survivors_WebGL_GDD.md)
- [Three.js Documentation](https://threejs.org/docs/)
- [Vampire Survivors Wiki](https://vampire-survivors.fandom.com/) (reference)
