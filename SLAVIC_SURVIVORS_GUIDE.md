# Slavic Survivors: The Living Guide
> "A guide for the ever-changing, evolving project."

---

## 🧭 Design Principles (The North Star)
*These principles guide every visual and interactive decision. They define the "feel" of the game.*

### 1. Aesthetic Excellence (The "Wow" Factor)
- **Premium Feel**: Avoid generic designs. Use curated, vibrant color palettes (HSL), sleek dark modes, and glassmorphism.
- **Dynamic Interaction**: The interface must feel alive. Use hover effects, micro-animations, and smooth transitions.
- **No Placeholders**: Every visual element, from icons to meshes, must look intentional and polished.

### 2. Gameplay: "Readable Chaos"
- **Density, Not Noise**: The screen will be filled with hundreds of enemies, but the player must always be able to identify threats (Elites, Projectiles).
- **Smoothness**: The game targets **60 FPS** at all times. Stutters break the immersion.
- **Satisfying Feedback**: Damage numbers, hit flinches, and screen shake (optional) must provide visceral feedback for every action.

### 3. Thematic Identity: "Ritual vs. Contraband"
- **The World**: A mix of **Nav** (spirits/undead), **Yav** (reality/tech), and **Prav** (divine law).
- **The Arsenal**: Distinct contrast between "Ritual Purity" (Garlic, Aspen Stakes, Crosses) and "Goplandia Carnage" (AK-47s, Ladas, Rusty Knives). Mixing them is the core fun.

---

## 🏛️ The Immutable Pillars (Core Rules)
*These are the structural foundations. Changing these requires a rewrite of the game's core.*

### 1. Technical Architecture
- **Engine**: **Three.js** (WebGL). Standard JS/HTML/CSS for UI.
- **Visual Style**: **2.5D Animated Billboard Sprites**. Entities are 2D planes that always face the camera, using **AI-generated sprite sheets** for animation.
- **The Loop**: A **Fixed Timestep (60Hz)** simulation loop.
- **Performance Mandate**: 
  - **Object Pooling** is MANDATORY for all repeated entities. **Never** `new` and `delete` inside the loop.
  - **Hard Cap**: Max **1,500** simultaneous entities.
  - **Camera**: Top-down Orthographic Camera (Fixed Pitch).

### 2. Data-Driven Design
- **Single Source of Truth**: All game content—Enemies, Weapons, Stages, Stats—must be defined in authoritative Data files (JSON/TS objects).
- **Determinism**: **NEVER** use `Math.random()`. Always use the `SeededRandom` system to ensure runs can be replayed or debugged efficiently.

### 3. The Core Loop
1.  **Move**: WASD/Touch. Player controls positioning *only*.
2.  **Auto-Attacks**: Weapons fire automatically based on cooldowns and ranges.
3.  **Collection**: Defeated enemies drop XP Gems.
4.  **Growth**: XP fills bar -> Level Up -> **Pick 1 of 3** upgrades.
5.  **Evolution**: Max Level Weapon + Specific Passive Item = **Evolved Weapon** (Massive Power Spike).

---

## 📜 Game Mechanics & Rules
*These define the specific gameplay experience.*

### Progression Systems
- **Slots**: Max **6 Active Weapons** and **6 Passive Items**.
- **Evolution Logic**: A weapon only evolves if:
    1.  Weapon is Level 5 (Max).
    2.  Required Passive is in inventory.
    3.  Player picks a Chest or Upgrade (specific trigger).

### Spawning & Difficulty
- **Ring Spawning**: Enemies spawn in a radius *around* the player, never on top, ensuring constant pressure from all sides.
- **The Director**:
    - **Base Spawns**: Scale linearly with time.
    - **Waves**: Distinct enemy compositions change every minute.
    - **Elite Spikes**: Every **90 seconds**, an Elite enemy spawns (High HP, High XP, Chest Drop).
- **Boss**: Spawns at the end of the run timer (e.g., 5, 12, or 15 mins).

---

## 🛠️ Implementation Workflow

### 1. Adding Content
When adding new content (Weapons, Enemies), follow the **Entity-Component** pattern:
1.  Define the Data (Stats, Name, ID).
2.  Create the Class (inheriting from `ActiveWeapon`, `Enemy`, etc.).
3.  Register in `AbilitySystem` or `SpawnSystem`.
4.  **Log it**: Run `node scripts/devlog.js add "..."`.

### 2. File Organization
- `components/game/entities/`: The physical things (Player, Enemy).
- `components/game/systems/`: The logic managers (Combat, Spawning, Abilities).
- `components/game/data/`: The static numbers (Weapon stats, Enemy HP).
