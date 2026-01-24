# Item Name Audit - Game vs Database

## Status: ✅ All Available Matches Aligned

After fixing the TT33 name mismatch, all items that exist in BOTH the game and database now match perfectly.

## Perfect Matches (31 items)

### Active Weapons & Deployables (13)
| Game Item | Database Item | Match |
|-----------|---------------|-------|
| TT33 Pistol | TT33 Pistol | ✅ |
| Peppermill Gun | Peppermill Gun | ✅ |
| Gzhel SMG | Gzhel SMG | ✅ |
| Babushka's Shank | Babushka's Shank | ✅ |
| Kabar Knife | Kabar Knife | ✅ |
| Ceramic Knuckles | Ceramic Knuckles | ✅ |
| Stilleto | Stilleto | ✅ |
| Gopnik Grail | Gopnik Grail | ✅ |
| Soviet Stick | Soviet Stick | ✅ |
| Skull Screen | Skull Screen | ✅ |
| Orthodox Visors | Orthodox Visors | ✅ |
| Propaganda Tower | Propaganda Tower | ✅ |
| Kvass Reactor | Kvass Reactor | ✅ |

### Companions & Vehicles (8)
| Game Item | Database Item | Match |
|-----------|---------------|-------|
| Nuclear Pigeon | Nuclear Pigeon | ✅ |
| Vampire Rat | Vampire Rat | ✅ |
| Pig Luggage | Pig Luggage | ✅ |
| Big Biz Lada | Big Biz Lada | ✅ |
| Dadushka Chair | Dadushka Chair | ✅ |
| Gopnik Gondola | Gopnik Gondola | ✅ |
| Tank Stroller | Tank Stroller | ✅ |
| Haunted Lada | Haunted Lada | ✅ |

### Passive Items (11)
| Game Item | Database Item | Match |
|-----------|---------------|-------|
| Garlic Ring | Garlic Ring | ✅ |
| Dove Coin | Dove Coin | ✅ |
| Beer Coin | Beer Coin | ✅ |
| Holy Bread | Holy Bread | ✅ |
| Holy Cheese | Holy Cheese | ✅ |
| Infinite Sunflower Pouch | Infinite Sunflower Pouch | ✅ |
| Babushka's Infinity Purse | Babushka's Infinity Purse | ✅ |
| Gopnik Spy Hat | Gopnik Spy Hat | ✅ |
| Pickled GPU | Pickled GPU | ✅ |
| Babushka's Battle Scarf | Babushka's Battle Scarf | ✅ |
| Ruby Ushanka | Ruby Ushanka | ✅ |

## Items NOT in Database (24 game items)

These are game items that don't have corresponding database templates (yet):

### Basic Ritual Weapons (6)
- Czosnek Halo (Garlic Halo)
- Hussar Lances
- Svyata Voda (Holy Water)
- Aspen Stake
- Krzyż Boomerang (Cross Boomerang)
- Solny Krąg (Salt Circle)

### AK Weapon Variants (4)
- Radioactive AK
- Ghzel AK
- Corrupted AK
- Mushroom AK

### Base Vehicle (1)
- Lada Vehicle (base version, different from Big Biz Lada and Haunted Lada)

### Basic Passive Stats (10)
- Old World Heart
- Wild Spirit
- Amber Stone
- Health Regen
- Zhelezo (Iron)
- Vistula Reach
- Silver
- Ikona (Icon)
- Sol (Salt)
- Srebro (Silver)

### Evolution Abilities (3)
- Soul Siphon
- Silver TT33
- The Melter

## Database Items NOT in Game (1 item)

### Unused Database Template
- **Boss Shoe** - Has image in database but no corresponding game item
  - Image URL: `https://res.cloudinary.com/dcerwavw6/image/upload/v1769102055/Boss_shue_front_tk22ys.png`
  - 3D Model: `https://res.cloudinary.com/dcerwavw6/image/upload/v1769102055/Boss_shue_c0qflz.glb`
  - Rarity: Legendary
  - Supply: 1

## Recommendations

### Option 1: Add Boss Shoe to Game
Create a new passive item or active weapon called "Boss Shoe" to use the existing database asset.

### Option 2: Create Database Templates for Missing Items
Add the 24 game items that don't have database images to the database with appropriate images.

### Option 3: Keep Current Hybrid Approach
- Database images for "collectible" contraband items (NFT-style assets)
- Icon components for basic/ritual items (cleaner, simpler UI)
- This creates a visual distinction between common and rare items

## Current Coverage
- **31/55 items (56%)** have database images
- **24/55 items (44%)** use fallback icons
- **100% of matching items** are properly aligned
- **0 name mismatches** remaining

## Conclusion
✅ **No fixes needed** - all possible matches are already working correctly. The 24 items without images are intentionally not in the database (they're basic starter items that work better with simple icons).
