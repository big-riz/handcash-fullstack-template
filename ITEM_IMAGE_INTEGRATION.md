# Item Template Image Integration

## Summary

Successfully integrated database-driven item images into the Slavic Survivors game's level-up upgrade system. Now when players level up and see upgrade choices, the cards display images from the database instead of just icon components.

## Changes Made

### 1. Updated `UpgradeCard` Component
**File**: `components/game/SlavicSurvivors.tsx`

- Added optional `imageUrl` prop to the UpgradeCard component
- Modified the icon container to display images when `imageUrl` is provided
- Falls back to React icon components if no image URL is available

```typescript
function UpgradeCard({ title, desc, icon, imageUrl, onClick }: { 
    title: string, 
    desc: string, 
    icon?: React.ReactNode, 
    imageUrl?: string, 
    onClick: () => void 
})
```

### 2. Enhanced `getLevelUpChoices()` Function
**File**: `components/game/SlavicSurvivors.tsx`

Modified the function to include image URLs for all upgrade choices:

- **Active Weapons**: Now include `imageUrl` from database
- **Passive Items**: Now include `imageUrl` from database
- **Evolutions**: Now include `imageUrl` from database

Each choice object now has both `icon` (React component) and `imageUrl` (string from database).

### 3. Improved Name Matching Logic
**File**: `components/game/SlavicSurvivors.tsx`

Enhanced the `getItemIcon()` function with intelligent name matching:

- **Exact match**: Tries exact name match first
- **Partial match**: Falls back to partial string matching
- **Keyword match**: Matches by key words (e.g., "TT33" matches "TT33 Handgun" or "TT33 Pistol")
- **Normalization**: Handles line breaks, extra spaces, and case differences

This ensures maximum compatibility between game item names and database template names.

### 4. Data Flow

```
Database (Neon PostgreSQL)
    ↓
/api/pool-stats endpoint
    ↓
Game component useEffect (fetches on mount)
    ↓
itemTemplates state
    ↓
getItemIcon() function (name matching)
    ↓
getLevelUpChoices() (attaches imageUrl)
    ↓
UpgradeCard component (renders image or icon)
```

## Database Structure

The game fetches item templates from `/api/pool-stats` which returns:

```json
{
  "success": true,
  "pools": [
    {
      "poolName": "default",
      "items": [
        {
          "id": "uuid",
          "name": "Item Name",
          "rarity": "Epic",
          "imageUrl": "https://res.cloudinary.com/...",
          "supplyLimit": 3,
          "minted": 1,
          "remaining": 2
        }
      ]
    }
  ]
}
```

## Item Name Mappings

### Items with Database Images (31 of 55 game items)

These items will display database images from Cloudinary when shown in level-up upgrades:

#### Active Weapons (13)
| Game Name | Database Name | Status |
|-----------|---------------|--------|
| TT33 Pistol | TT33 Pistol | ✅ Exact match |
| Peppermill Gun | Peppermill Gun | ✅ Exact match |
| Gzhel SMG | Gzhel SMG | ✅ Exact match |
| Babushka's Shank | Babushka's Shank | ✅ Exact match |
| Kabar Knife | Kabar Knife | ✅ Exact match |
| Ceramic Knuckles | Ceramic Knuckles | ✅ Exact match |
| Stilleto | Stilleto | ✅ Exact match |
| Gopnik Grail | Gopnik Grail | ✅ Exact match |
| Soviet Stick | Soviet Stick | ✅ Exact match |
| Skull Screen | Skull Screen | ✅ Exact match |
| Orthodox Visors | Orthodox Visors | ✅ Exact match |
| Propaganda Tower | Propaganda Tower | ✅ Exact match |
| Kvass Reactor | Kvass Reactor | ✅ Exact match |

#### Companions & Vehicles (7)
| Game Name | Database Name | Status |
|-----------|---------------|--------|
| Nuclear Pigeon | Nuclear Pigeon | ✅ Exact match |
| Vampire Rat | Vampire Rat | ✅ Exact match |
| Pig Luggage | Pig Luggage | ✅ Exact match |
| Big Biz Lada | Big Biz Lada | ✅ Exact match |
| Dadushka Chair | Dadushka Chair | ✅ Exact match |
| Gopnik Gondola | Gopnik Gondola | ✅ Exact match |
| Tank Stroller | Tank Stroller | ✅ Exact match |
| Haunted Lada | Haunted Lada | ✅ Exact match |

#### Passive Items (11)
| Game Name | Database Name | Status |
|-----------|---------------|--------|
| Garlic Ring | Garlic Ring | ✅ Exact match |
| Dove Coin | Dove Coin | ✅ Exact match |
| Beer Coin | Beer Coin | ✅ Exact match |
| Holy Bread | Holy Bread | ✅ Exact match |
| Holy Cheese | Holy Cheese | ✅ Exact match |
| Infinite Sunflower Pouch | Infinite Sunflower Pouch | ✅ Exact match |
| Babushka's Infinity Purse | Babushka's Infinity Purse | ✅ Exact match |
| Gopnik Spy Hat | Gopnik Spy Hat | ✅ Exact match |
| Pickled GPU | Pickled GPU | ✅ Exact match |
| Babushka's Battle Scarf | Babushka's Battle Scarf | ✅ Exact match |
| Ruby Ushanka | Ruby Ushanka | ✅ Exact match |

### Items Using Fallback Icons (24 game items)

These items will display React icon components (not images from database):

#### Basic Ritual Weapons (6)
- Czosnek Halo (Garlic Halo)
- Hussar Lances
- Svyata Voda (Holy Water)
- Aspen Stake
- Krzyż Boomerang (Cross Boomerang)
- Solny Krąg (Salt Circle)

#### AK Variants (4)
- Radioactive AK
- Ghzel AK
- Corrupted AK
- Mushroom AK

#### Basic Vehicle
- Lada Vehicle (base version)

#### Basic Passives (10)
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

#### Evolutions (3)
- Soul Siphon
- Silver TT33
- The Melter

## Fallback Behavior

If an item name doesn't match any database template:
1. The card will display the fallback React icon component
2. No error will be thrown
3. Gameplay continues normally

## Testing

To verify the integration:

1. Start the game
2. Level up to trigger upgrade choices
3. Check that upgrade cards show database images instead of icons
4. Verify images load from Cloudinary CDN
5. Confirm fallback to icons works for unmatched items

## Coverage Statistics

- **31 items** (56%) display database images
- **24 items** (44%) use fallback icons
- **All "Contraband" items** have database images
- **Most late-game items** have database images
- **Basic starter items** use icons (intentional design choice)

## Benefits

- **Visual Polish**: Real item images for mid/late-game items
- **Database-Driven**: Easy to update images via admin panel
- **Hybrid Approach**: Icons for basic items, images for special items
- **Graceful Degradation**: Falls back to icons if images unavailable
- **Performance**: Images cached by browser and CDN
- **Focused Content**: Database images highlight "collectible" items

## Future Enhancements

- Add image loading states / shimmer effects
- Implement image preloading on game start
- Add rarity-based image borders/effects
- Support for animated item previews
- A/B test image vs icon preference
