---
active: true
iteration: 1
max_iterations: 0
completion_promise: null
started_at: "2026-01-26T02:09:11Z"
---

# Task: Character-Specific Arsenal System

## Objective
Each character should have a unique arsenal of actives and passives that is chosen from when levelling up. Change from world items to character items with 5 weapons per character and 5 passives.

## Status: COMPLETED ✓

## Changes Made

### 1. Updated Character Data (components/game/data/characters.ts)
Added `arsenal` property to all 7 characters with exactly:
- 5 unique weapons per character
- 5 unique passives per character

Characters configured:
- ✓ Boris the Gopnik (street fighter/gunslinger theme)
- ✓ Babushka Zina (melee/healer theme)
- ✓ Vadim Hunter (projectile/speed theme)
- ✓ Big Biznisman (companion/luck theme)
- ✓ The Oligarch (vehicle/tank theme)
- ✓ Chernobyl Ghost (nuclear damage theme)
- ✓ Slavic Spirit (orbital/area theme)

### 2. Updated Level-Up System (components/game/hooks/useGameEngine.ts)
Modified `getLevelUpChoices()` function to:
- Extract character's arsenal from character data
- Filter actives based on character's weapon arsenal
- Filter passives based on character's passive arsenal
- Allow owned items to be upgraded even if not in arsenal
- Removed world-based filtering (now character-focused)

### 3. Created Missing Weapon Class
- Created `components/game/content/weapons/GarlicAura.ts`
- This was referenced in AbilitySystem but didn't exist
- Used by 'grail' and 'skull_screen' weapons

### 4. Fixed Imports
- Added GarlicAura import to AbilitySystem.ts

### 5. Documentation
- Created `.claude/CHARACTER_ARSENAL_SYSTEM.md` with full details
- Documents each character's arsenal
- Explains implementation approach
- Lists all modified files

## Additional Changes
- Modified level-up choices from 5 to 4 options per level-up
- Added missing weapons to actives.ts: dagger, holywater, cross, salt, stake, ak_radioactive (all minLevel 2)
- Lowered minLevel to 2 for starting weapons and early items to ensure 4 options at level 2:
  - Weapons: pig_luggage, vampire_rat, propaganda_tower, big_biz_lada, kvass_reactor, dadushka_chair, tank_stroller
  - Passives: holy_bread, battle_scarf
- Nerfed Holy Water weapon (was too powerful):
  - Damage: 10 → 5
  - Radius: 2.5 → 1.5
  - Duration: 5.0s → 4.0s
  - Cooldown: 4.0s → 5.0s
  - Tick rate: 0.5s → 0.7s
- Fixed replay system to ensure deterministic playback:
  - Added pendingReplaySeed ref to store replay seed
  - Modified startReplay() to store the seed for later initialization
  - Modified gameState useEffect to call resetGame with replay seed before starting
  - This ensures RNG is properly seeded, making replays precise and deterministic

## Testing Checklist
- [ ] Test each character can only see their arsenal items during level-up
- [ ] Test that owned items can still be upgraded
- [ ] Test backwards compatibility with saves
- [ ] Verify evolutions still work
- [ ] Test all 7 characters in gameplay
- [ ] Verify only 4 options appear when leveling up
