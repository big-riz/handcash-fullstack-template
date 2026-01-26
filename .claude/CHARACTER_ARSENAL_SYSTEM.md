# Character-Specific Arsenal System

## Overview
Changed the item system from world-based to character-specific arsenals. Each character now has their own unique set of weapons and passives that can be unlocked during gameplay.

## Character Arsenals

### Boris the Gopnik
**Theme:** Street fighter, gunslinger
**Weapons (5):**
- tt33 (starting weapon)
- knuckles
- peppermill
- gzhel_smg
- ak_radioactive

**Passives (5):**
- beer_coin
- dove_coin
- spy_hat
- battle_scarf
- sunflower_pouch

### Babushka Zina
**Theme:** Melee specialist, healer
**Weapons (5):**
- shank (starting weapon)
- soviet_stick
- kabar
- grail
- holywater

**Passives (5):**
- holy_bread (starting passive)
- garlic_ring
- holy_cheese
- ruby_ushanka
- infinity_purse

### Vadim Hunter
**Theme:** Fast projectile specialist
**Weapons (5):**
- stilleto (starting weapon)
- kabar
- peppermill
- visors
- dagger

**Passives (5):**
- battle_scarf (starting passive)
- boss_shoe
- spy_hat
- pickled_gpu
- sunflower_pouch

### Big Biznisman
**Theme:** Companion specialist, high luck
**Weapons (5):**
- pig_luggage (starting weapon)
- vampire_rat
- nuclear_pigeon
- propaganda_tower
- haunted_lada

**Passives (5):**
- beer_coin (starting passive)
- infinity_purse
- ruby_ushanka
- sunflower_pouch
- pickled_gpu

### The Oligarch
**Theme:** Vehicle master, tank
**Weapons (5):**
- big_biz_lada (starting weapon)
- tank_stroller
- dadushka_chair
- gopnik_gondola
- haunted_lada

**Passives (5):**
- infinity_purse (starting passive)
- holy_bread
- ruby_ushanka
- garlic_ring
- holy_cheese

### Chernobyl Ghost
**Theme:** Nuclear damage specialist
**Weapons (5):**
- kvass_reactor (starting weapon)
- nuclear_pigeon (starting active)
- skull_screen
- gzhel_smg
- ak_radioactive

**Passives (5):**
- pickled_gpu (starting passive)
- garlic_ring
- ruby_ushanka
- sunflower_pouch
- holy_cheese

### Slavic Spirit
**Theme:** Orbital and area specialist
**Weapons (5):**
- grail (starting weapon)
- cross (starting active)
- skull_screen
- visors
- salt

**Passives (5):**
- ruby_ushanka (starting passive)
- garlic_ring
- pickled_gpu
- sunflower_pouch
- holy_cheese

## Implementation Details

### Files Modified

1. **components/game/data/characters.ts**
   - Added `arsenal` property to each character
   - Arsenal contains `weapons` and `passives` arrays
   - Defines exactly 5 weapons and 5 passives per character

2. **components/game/hooks/useGameEngine.ts**
   - Modified `getLevelUpChoices()` function
   - Now filters items based on character's arsenal
   - Only shows items from character's arsenal OR items already owned (for upgrades)

3. **components/game/content/weapons/GarlicAura.ts** (NEW)
   - Created missing GarlicAura weapon class
   - Used by grail and skull_screen weapons

4. **components/game/systems/AbilitySystem.ts**
   - Added import for GarlicAura class

### How It Works

1. When a character levels up, the game fetches their arsenal from character data
2. The level-up system filters all available items to only include:
   - Items in the character's weapon arsenal
   - Items in the character's passive arsenal
   - Items the player already owns (for upgrades)
3. Items are still subject to level gating based on their minLevel property
4. World restrictions are no longer used - character arsenal is the primary filter
5. Players are presented with 4 random choices (weighted by rarity) from their available pool

## Benefits

- Each character feels unique with their own progression path
- Players can master a character's specific item synergies
- No more overwhelming choice from global pool
- Better game balance - can tune each character's power curve
- Encourages replayability to try different characters

## Testing Notes

- Test that each character can only see their arsenal items
- Test that owned items can still be upgraded even if not in arsenal
- Test backwards compatibility with existing save files
- Test that evolution items still work correctly
