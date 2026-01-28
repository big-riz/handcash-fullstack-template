# Wave Notifications & Queue System - Complete Implementation

## Overview
Implemented a comprehensive wave awareness system with:
1. **Enemy Counter** - Live count in top center
2. **Wave Queue** - Next 3 waves with progress bars (left side, under HP)
3. **Wave Flavor Text** - Dramatic popup notifications when special waves spawn

## Features

### 1. Enemy Counter
**Location**: Top center, next to kills counter

**Display**:
- Orange user icon + live enemy count
- Updates every frame

### 2. Wave Queue (Relocated & Redesigned)
**Location**: Left side, directly under health bar

**Previous Design** ❌:
- Centered below clock
- Showed countdown timers (MM:SS format)

**New Design** ✅:
- Left-aligned under HP bar
- Progress bars filling as waves approach
- 30-second lookback window
- Yellow bars (distant waves) → Red bars (< 10s)
- Compact "INCOMING" header

**Display**:
```
⚠️ INCOMING
15x DRIFTER
[████████░░] 80%  (red - imminent!)

20x SAPLING
[████░░░░░░] 40%  (yellow)

3x BRUISER ⭐
[██░░░░░░░░] 20%  (yellow)
```

### 3. Wave Flavor Text Notifications (NEW)
**Location**: Top center of screen, above everything

**Display**:
- Dramatic red/orange gradient background
- Yellow warning icons (pulsing)
- Large uppercase text
- Glowing shadow effects
- Auto-dismiss after 4 seconds
- Slide-in animation

**Examples**:
- "A piercing cry echoes through the trees!"
- "Something heavy approaches..."
- "The Guardian of the Grove awakens!"
- "The Lord of Darkness, Chernobog, has come for you!"

**Trigger**: Automatically displays when a timeline event with a `message` field spawns

## Technical Implementation

### Modified Files

#### 1. `components/game/systems/SpawnSystem.ts`
**Added**:
- `onWaveMessage` callback property
- `setWaveMessageCallback()` method
- Callback invocation in `executeTimelineEvent()` when `event.message` exists

#### 2. `components/game/hooks/useGameEngine.ts`
**Added**:
- `setWaveNotification` to interface
- Callback setup in two locations:
  - `resetGame()` - When creating new SpawnSystem
  - `initializeGame()` - Initial game setup
- Auto-clear timeout (4 seconds)

#### 3. `components/game/SlavicSurvivors.tsx`
**Added**:
- `waveNotification` state
- Passed `setWaveNotification` to `useGameEngine`
- Passed `waveNotification` to `HUD`

#### 4. `components/game/screens/HUD.tsx`
**Added**:
- `waveNotification` prop
- Wave notification UI component (top center)
- Relocated wave queue (left side, under HP)
- Changed wave display from time to progress bars

## Visual Design

### Notification Appearance
```
┌─────────────────────────────────────────────┐
│  ⚠️  THE EARTH TREMBLES!  ⚠️                │
│  (red/orange gradient, glowing border)      │
└─────────────────────────────────────────────┘
```

**Styling**:
- Background: `bg-gradient-to-r from-red-900/95 via-orange-800/95 to-red-900/95`
- Border: `border-yellow-500/60` with `shadow-[0_0_60px_rgba(234,179,8,0.8)]`
- Text: `font-black italic uppercase tracking-wider`
- Icons: `animate-pulse` with glow effect

### Layout Hierarchy
```
TOP CENTER:     Wave Notification (z-50, dramatic)
                ↓
                Clock + Enemy Counter + Kills
                ↓
LEFT SIDE:      XP Bar
                HP Bar
                Status Effects
                Wave Queue (⚠️ INCOMING)

CENTER:         Buff HUD (items)

RIGHT SIDE:     Stats Button
```

## Message Catalog

### Dark Forest Timeline
- "A piercing cry echoes through the trees!" (Screecher)
- "Something heavy approaches..." (Bruiser)
- "A swarm of Domovoi appears!" (Domovoi)
- "Poisonous spores fill the air!" (Tox Shroom)
- "An ancient Wraith guards this path!" (Forest Wraith - Elite)
- "The earth trembles!" (Stone Golem)
- "The moon is high, and the hunt is on!" (Werewolf - Elite)
- "Ghostly howls surround you!" (Spirit Wolf)
- "The forest's magic turns against you!" (Leshy Shaman)
- "The Guardian of the Grove awakens!" (Guardian Golem - Boss)
- "The heart of the forest beats with rage!" (Ancient Treant - Boss)
- "The buzz of a thousand wings!" (Wasp Swarm)
- "A Destroyer arrives!" (Golem Destroyer - Boss)
- "Shadows lengthen and twist..." (Shadow Stalker)
- "The Lord of Darkness, Chernobog, has come for you!" (Chernobog - Final Boss)

### Frozen Waste Timeline
- "Frozen spirits emerge from the blizzard..." (Zmora)
- "Ice witches weave their snares!" (Kikimora)
- "Frost wolves hunt in the storm!" (Spirit Wolf)
- "Frozen giants awaken..." (Bruiser)
- "Ice golems march forward!" (Stone Golem)

## User Experience

### Before
- Players had no warning about special waves
- Timer-based wave queue was informative but required mental math
- Flavor text only appeared in console logs

### After
- **Immersive**: Dramatic notifications create tension and atmosphere
- **Tactical**: Progress bars show exact wave proximity at a glance
- **Informative**: Players know what's coming and can prepare
- **Polished**: Professional presentation with animations and effects

## Performance

- **Zero impact** - Notifications only render when active
- **Minimal state** - Single string state variable
- **Auto-cleanup** - 4-second timeout prevents memory leaks
- **Efficient** - Callback pattern avoids polling

## Future Enhancements (Optional)

- [ ] Sound effects for boss notifications
- [ ] Different notification styles (warning, danger, epic)
- [ ] Screen shake on boss spawns
- [ ] Achievement integration ("Survived Chernobog!")
- [ ] Notification history (last 3 messages)
- [ ] Custom messages for custom levels

---

**Implemented**: 2026-01-26
**Files Modified**: 5 files
**Lines Added**: ~100
**Testing**: Verified with Dark Forest and Frozen Waste timelines
