# Audio Files for Slavic Survivors

This directory should contain all audio assets for the game.

## Directory Structure

```
public/audio/
├── music/
│   ├── dark-forest-ambient.mp3     # Dark, ominous music for Dark Forest biome
│   ├── frozen-waste-ambient.mp3    # Cold, wind-based music for Frozen Waste
│   └── chernobyl-ambient.mp3       # Eerie radioactive music for Chernobyl Zone
└── sfx/
    ├── weapons/                     # Weapon-specific sounds (optional enhancement)
    ├── enemies/                     # Enemy-specific sounds (optional enhancement)
    └── ui/                          # UI sounds (optional enhancement)
```

## Music Requirements

### Dark Forest (`dark-forest-ambient.mp3`)
- **Duration**: 3-5 minutes (loopable)
- **Theme**: Ominous, dark, Slavic folklore
- **Instruments**: Deep strings, distant wind, forest ambience
- **Mood**: Mysterious, foreboding, supernatural
- **Reference**: Think Eastern European horror soundtracks

### Frozen Waste (`frozen-waste-ambient.mp3`)
- **Duration**: 3-5 minutes (loopable)
- **Theme**: Cold, desolate, harsh winter
- **Instruments**: Wind sounds, distant bells, sparse piano/strings
- **Mood**: Isolating, harsh, beautiful yet deadly
- **Reference**: Arctic expedition soundtracks

### Chernobyl Zone (`chernobyl-ambient.mp3`)
- **Duration**: 3-5 minutes (loopable)
- **Theme**: Post-apocalyptic, radioactive, abandoned
- **Instruments**: Electronic drones, Geiger counter rhythms, industrial sounds
- **Mood**: Toxic, dangerous, sci-fi horror
- **Reference**: Stalker game soundtracks, Chernobyl series

## Adaptive Music System

The game features an **adaptive music intensity system** that adjusts volume based on enemy density:
- **Low intensity** (0-30% enemies): Music plays at 30-50% volume, calm ambient
- **Medium intensity** (30-70% enemies): Music plays at 50-80% volume, tension builds
- **High intensity** (70-100+ enemies): Music plays at 80-100% volume, full combat intensity

The system smoothly transitions between intensity levels to avoid jarring changes.

## Sound Effects (SFX)

The game currently uses **procedurally generated sound effects** via Web Audio API oscillators. These work well but can be replaced with audio files for more polished sound:

### Optional SFX Enhancements
If you want to replace synthesized sounds with audio files, add them to:
- `public/audio/sfx/weapons/` - Weapon attack sounds
- `public/audio/sfx/enemies/` - Enemy hurt/death sounds
- `public/audio/sfx/ui/` - Button clicks, level-ups, etc.

### Current SFX Coverage
All essential sounds are implemented via synthesis:
- ✅ UI sounds (hover, click, select, back)
- ✅ Combat sounds (attack, hurt, die, heal)
- ✅ Weapon types (pistol, rifle, melee, laser, explosion)
- ✅ Events (level-up, game over, victory, evolution)
- ✅ Status effects (poison, burn, freeze, etc.)
- ✅ Special events (boss spawn, achievement, prestige)

## Sourcing Music

### Options for obtaining music:

1. **Royalty-Free Music Libraries**:
   - [Incompetech](https://incompetech.com/) - Kevin MacLeod's catalog
   - [Free Music Archive](https://freemusicarchive.org/)
   - [OpenGameArt](https://opengameart.org/)
   - [Purple Planet Music](https://www.purple-planet.com/)

2. **Commissioned Music**:
   - Hire a composer on Fiverr, Upwork, or SoundBetter
   - Budget: $50-200 per track for indie game quality
   - Specify: loopable, Slavic/Eastern European theme, 3-5 minutes

3. **AI Music Generation**:
   - [Suno AI](https://suno.ai/)
   - [Udio](https://www.udio.com/)
   - [AIVA](https://www.aiva.ai/)
   - Prompt: "dark Slavic folklore ambient music, ominous strings, loopable"

4. **Creative Commons Music**:
   - Search YouTube Audio Library
   - Search SoundCloud with CC filters
   - **Important**: Check license requirements (attribution, non-commercial, etc.)

## Testing Music

To test music in development:
1. Add your music files to `public/audio/music/`
2. Ensure files are named exactly as specified above
3. Start the game and select the corresponding biome
4. Music should auto-play when gameplay starts
5. Test volume controls in pause menu

## Current Status

🎵 **Music System**: ✅ Fully implemented (awaiting audio files)
🎵 **Biome-Specific Music**: ✅ Configured for all 3 worlds
🎵 **Adaptive Intensity**: ✅ Implemented
🎵 **Volume Controls**: ✅ Separate Music/SFX sliders
🔊 **Sound Effects**: ✅ All essential SFX implemented via synthesis

**Next Step**: Source or commission music tracks for the three biomes.
