# Quality of Life (QoL) Upgrade Proposals for Slavic Survivors

## Already Implemented ✅
- ✅ Camera zoom (mouse wheel / Q & E keys)
- ✅ Audio controls (music & SFX volume sliders in pause menu)
- ✅ Mobile touch controls
- ✅ Fullscreen mode
- ✅ Bot simulation mode (localhost)
- ✅ Level editor with visual editor
- ✅ Item template images
- ✅ Status effects display
- ✅ Synergies display

---

## Tier 1: High-Impact, Easy to Implement 🟢

### 1. **Minimap**
**Impact**: High | **Difficulty**: Medium
- Small radar in corner showing player position, enemies, items
- Toggle with M key
- Shows danger zones (enemy clusters in red)
- Shows XP gems in green
- Useful for tactical awareness in chaotic fights

### 2. **Damage Numbers Toggle**
**Impact**: Medium | **Difficulty**: Easy
- Option in pause menu to enable/disable floating damage numbers
- Some players find them distracting
- Could save performance on low-end devices

### 3. **Auto-Pause on Tab/Window Blur**
**Impact**: High | **Difficulty**: Easy
- Game auto-pauses when you switch browser tabs
- Prevents death while AFK
- Common in web games

### 4. **DPS Meter**
**Impact**: Medium | **Difficulty**: Easy
- Show current damage per second in stats panel
- Shows total DPS and breakdown by weapon
- Helps players optimize builds

### 5. **Enemy Health Bars**
**Impact**: Medium | **Difficulty**: Easy
- Optional health bars above enemies
- Elite/Boss enemies always show health
- Toggle in pause menu settings

### 6. **Quick Restart (R key)**
**Impact**: Medium | **Difficulty**: Easy
- Press R twice to quick restart run
- Saves time for hardcore players grinding runs
- First press shows confirmation, second press restarts

### 7. **Zoom Level Indicator**
**Impact**: Low | **Difficulty**: Easy
- Small UI element showing current zoom level (0.5x - 2.5x)
- Helps players know where they are in zoom range

### 8. **ESC Key Pause/Unpause**
**Impact**: Medium | **Difficulty**: Easy
- Currently ESC only pauses, not unpauses
- Make it toggle pause state
- More intuitive UX

---

## Tier 2: Medium-Impact, Moderate Complexity 🟡

### 9. **Build Loadouts**
**Impact**: High | **Difficulty**: Hard
- Save favorite item combinations
- Quick-select from character screen
- Auto-prioritize specific items during level-ups
- Great for testing specific builds

### 10. **Detailed Post-Game Stats**
**Impact**: Medium | **Difficulty**: Medium
- Damage breakdown by weapon
- Kills per weapon
- Total healing received
- Damage avoided (dodge/armor)
- Time survived
- XP collected vs missed

### 11. **Enemy Spawn Indicator**
**Impact**: Medium | **Difficulty**: Medium
- Visual/audio cue when enemies spawn off-screen
- Arrow pointing to spawn direction
- Helps prevent surprise deaths

### 12. **Item Pickup Range Indicator**
**Impact**: Low | **Difficulty**: Easy
- Circle around player showing magnet range
- Toggle with hotkey
- Helps optimize positioning for XP collection

### 13. **Keybind Customization**
**Impact**: Medium | **Difficulty**: Medium
- Let players rebind WASD, pause, zoom, etc.
- Stored in localStorage
- Accessibility feature

### 14. **Graphics Quality Settings**
**Impact**: Medium | **Difficulty**: Medium
- Low/Medium/High presets
- Adjust shadow quality, particle count, fog density
- Performance boost for low-end devices

### 15. **Run Summary Screenshot**
**Impact**: Low | **Difficulty**: Medium
- Auto-generate shareable image of run stats
- Final level, time, build, kills
- Good for social sharing

---

## Tier 3: High-Impact, High Complexity 🔴

### 16. **Danger Proximity Alert**
**Impact**: High | **Difficulty**: Hard
- Screen edge glows red when many enemies nearby
- Audio alert for boss spawns
- Helps prevent tunnel vision deaths

### 17. **Replay Controls Enhancement**
**Impact**: Medium | **Difficulty**: Medium
- Scrub timeline (jump to specific time)
- Speed controls (0.25x, 0.5x, 1x, 2x, 4x)
- Pause/play toggle
- Camera free mode (detach from player)

### 18. **Item Synergy Previews**
**Impact**: High | **Difficulty**: Hard
- During level-up, show which items create synergies
- Highlight items that combo with current build
- Show "missing 1 item" for synergies
- Educational for new players

### 19. **Daily Challenges**
**Impact**: High | **Difficulty**: Very Hard
- Special modifiers each day
- Leaderboard for daily runs
- Rewards for completing (cosmetics?)
- Replayability boost

### 20. **Achievement Notifications**
**Impact**: Medium | **Difficulty**: Medium
- In-game popup when achievement unlocked
- Sound effect + visual celebration
- Currently achievements are silent

---

## Tier 4: Nice-to-Have Polish 🟣

### 21. **Colorblind Mode**
**Impact**: Low | **Difficulty**: Medium
- Alternative color schemes for UI elements
- Different XP gem colors
- Accessibility feature

### 22. **Screen Shake Intensity**
**Impact**: Low | **Difficulty**: Easy
- Slider in settings (0% - 150%)
- Some players get motion sick
- Default: 100%

### 23. **Particle Density**
**Impact**: Low | **Difficulty**: Easy
- Slider for visual effects intensity
- Performance optimization
- Clarity preference

### 24. **Item Banish Confirmation**
**Impact**: Low | **Difficulty**: Easy
- "Are you sure?" popup before banishing
- Prevents accidental banishes
- Can be toggled off in settings

### 25. **Kill Streak Counter**
**Impact**: Low | **Difficulty**: Medium
- Shows consecutive kills without taking damage
- Visual flair + feedback
- Resets on hit

---

## My Top 5 Recommendations (Best ROI)

1. **Auto-Pause on Blur** (#3) - Instant value, 10 minutes to implement
2. **Quick Restart (R key)** (#6) - Huge QoL for grinders, 15 minutes
3. **ESC Toggle Pause** (#8) - Better UX, 5 minutes
4. **Enemy Health Bars** (#5) - Tactical info, 30-45 minutes
5. **Minimap** (#1) - Game-changing, 2-3 hours

---

## Implementation Priority Queue

**If I had 1 hour:**
- Auto-pause on blur
- Quick restart hotkey
- ESC toggle pause
- Damage numbers toggle
- Zoom level indicator

**If I had 3 hours:**
- All above +
- Enemy health bars
- DPS meter
- Item pickup range indicator
- Detailed post-game stats

**If I had a full day:**
- All above +
- Minimap
- Enemy spawn indicators
- Item synergy previews
- Replay controls enhancement

---

## Technical Notes

### Easy Wins (< 30 min each)
- #3 Auto-pause on blur
- #6 Quick restart
- #7 Zoom indicator
- #8 ESC toggle
- #2 Damage toggle
- #22 Screen shake slider
- #23 Particle density

### Medium Effort (1-3 hours each)
- #4 DPS meter
- #5 Enemy health bars
- #11 Spawn indicators
- #12 Pickup range
- #20 Achievement notifications

### Large Projects (4+ hours each)
- #1 Minimap
- #9 Build loadouts
- #17 Replay enhancements
- #18 Synergy previews
- #19 Daily challenges

---

**Question for you**: Which of these would you like me to implement first? I recommend starting with the "1 hour package" for maximum immediate impact.
