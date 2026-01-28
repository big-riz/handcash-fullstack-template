# Wave Queue & Enemy Counter Implementation

## Overview
Added tactical awareness features to the HUD: a live enemy counter and an upcoming wave queue display.

## Features Implemented

### 1. **Enemy Counter**
**Location**: Top center clock area, right next to kills counter

**Display**:
- Orange user icon (Users from lucide-react)
- Live count of active enemies on screen
- Updates in real-time as enemies spawn/die

**Technical**:
- Filters `entityManager.enemies` for `isActive === true`
- Zero performance impact (simple array filter)

### 2. **Wave Queue**
**Location**: Left side, below the health bar

**Display**:
- Shows next 3 upcoming timeline events
- Progress bar for each wave (fills as wave approaches)
- Enemy type and count (e.g., "15x drifter")
- Special indicators:
  - ⭐ for Elite waves
  - 👑 for Boss waves
- Visual alert: Red progress bar and pulsing text when wave < 10 seconds away

**Technical**:
- `SpawnSystem.getUpcomingWaves(3)` - returns next 3 events
- `SpawnSystem.getElapsedTime()` - calculates countdown
- Only visible during active gameplay (`gameState === "playing"`)
- Hidden during pause, menu, level-up, etc.

## Modified Files

### 1. `components/game/systems/SpawnSystem.ts`
Added public methods:
```typescript
getUpcomingWaves(count: number = 3): TimelineEvent[]
getElapsedTime(): number
```

### 2. `components/game/SlavicSurvivors.tsx`
- Destructured `spawnSystemRef` and `entityManagerRef` from `useGameEngine`
- Passed both refs to HUD component

### 3. `components/game/screens/HUD.tsx`
- Added `spawnSystem` and `entityManager` props
- Added imports: `Users`, `AlertTriangle` icons
- Calculated `activeEnemies` from entity manager
- Retrieved `upcomingWaves` from spawn system
- Added enemy counter UI (next to kills)
- Added wave queue UI (below clock)

## Visual Design

### HUD Layout
```
LEFT SIDE:                    CENTER:                      RIGHT:
─────────                     ─────────                    ──────
XP Bar                        [Clock 5:32 | 💀 142 | 👥 47]  Stats
HP Bar                             Kills   Enemies
Status Effects

⚠️ INCOMING
15x DRIFTER
[████████░░] 80%  (red - imminent!)

20x SAPLING
[████░░░░░░] 40%  (yellow)

3x BRUISER ⭐
[██░░░░░░░░] 20%  (yellow)
```

### Progress Bar Behavior
- **0-70% filled**: Yellow bar (wave is distant)
- **70-100% filled**: Red bar + pulsing text (wave < 10 seconds)
- **100% filled**: Wave spawning NOW
- Progress calculated from 30-second lookback window

## Usage

Players can now:
- **See enemy pressure** - Know when they're overwhelmed (high enemy count)
- **Plan positioning** - Move to safe spots before large waves
- **Prepare for elites/bosses** - See special waves coming with 👑/⭐ icons
- **Optimize XP collection** - Know when there's a break to collect gems

## Technical Details

### Performance
- Zero impact - simple array operations
- Enemy count: O(n) filter operation per frame (negligible)
- Wave queue: Pre-calculated, no runtime cost

### Responsiveness
- Mobile-friendly sizing
- Smaller text on mobile
- Compact layout for small screens

### Edge Cases
- Wave queue hidden when no timeline events remain
- Enemy counter always visible (shows 0 if none active)
- Handles custom levels with custom timelines

## Future Enhancements (Optional)

- [ ] Color-code enemy types (red for dangerous, green for weak)
- [ ] Show wave difficulty rating
- [ ] Audio cue when wave < 5 seconds
- [ ] Minimap integration (show spawn locations)
- [ ] Filter waves by type (only show elites/bosses)

---

**Implemented**: 2026-01-26
**Files Modified**: 3 files
**Testing**: Verified with default worlds and custom levels
