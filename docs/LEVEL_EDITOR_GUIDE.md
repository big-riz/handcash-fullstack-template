# Level Editor User Guide

## Overview

The Level Editor is a localhost-only debugging tool for creating and testing custom game levels. It provides both a menu-based editor and a visual 3D editor for comprehensive level design.

## Spawning Model (Important)

**Default levels (Dark Forest, Frozen Waste, Catacombs) use both timeline events AND automatic background spawning** for continuous enemy pressure and endless survival gameplay. **Custom levels default to timeline-only spawning** for precise control.

### Default Levels
- Timeline events spawn at specified times
- Background spawning continuously generates enemies (every 5s initially, scaling to 0.8s)
- Provides endless survival gameplay with escalating difficulty
- Suitable for classic bullet-heaven experience

### Custom Levels (Timeline-Only by Default)
- Enemies spawn ONLY when explicitly defined in timeline events
- No automatic background spawning unless enabled in Settings tab
- Complete control over enemy pacing and difficulty curves
- Suitable for puzzle levels, boss fights, and scripted encounters

## Access

**Localhost Only**: The Level Editor only works when running on `localhost` or `127.0.0.1` for security reasons.

### Opening the Editor

1. Navigate to the Main Menu (game start screen)
2. Click the **purple plus (+) icon** after the world selection cards
3. The Level Editor panel will appear in the top-right corner

## Features

### 1. Levels Tab

Manage your custom levels:

- **New Level**: Create a new custom level from scratch
- **Import**: Import a level from a JSON file
- **World List**: View all available levels (default worlds + custom levels)
- **Actions**: Select, duplicate, delete, or export levels

### 2. Timeline Tab

Design spawn events for your level:

- **Add Events**: Create enemy spawn events with:
  - Time (in seconds)
  - Enemy count
  - Enemy type (12 types available)
  - Elite/Boss flags
  - Custom warning messages
- **Edit/Delete**: Modify or remove existing events
- **Duplicate**: Clone events to save time
- **Auto-sort**: Events automatically sort by time
- **Note**: Custom levels default to **timeline-only spawning**. Use Settings tab to enable background spawning for endless survival gameplay.

**Available Enemy Types**:
- drifter, screecher, bruiser
- zmora, kikimora, domovoi
- werewolf, spirit_wolf
- forest_wraith, stone_golem
- guardian_golem, ancient_treant

### 3. Meshes Tab

Place 3D objects in your level:

- **Mesh Types**: Rock, Tree, Wall, Pillar, Crate, Barrel
- **Properties**:
  - Scale (0.5x - 3.0x)
  - Rotation (0° - 360°)
  - Collision enabled/disabled
  - Static/Dynamic flag
- **Placement**: Objects are added at origin (0,0,0)
- **Note**: Use Visual Editor for precise positioning

### 4. Paint Tab

Add environmental details:

#### Scatter Mode
Paint areas with scattered decorative meshes:
- **Types**: Grass, Flowers, Stones, Mushrooms, Debris, Foliage
- **Density**: 10% - 100%
- **Area Size**: 5m - 50m

#### Color Mode
Paint colored terrain patches:
- **Color Picker**: Choose any color
- **Area Size**: 5m - 50m

**Note**: Interactive painting tools require the Visual Editor

### 5. Settings Tab

Configure level properties:

#### Basic Info
- Level name
- Description

#### Gameplay
- Max level (player level cap)
- Difficulty multiplier (scales enemy stats)
- Win condition (level/time/kills)
- Win value (target number)

#### Theme
- Sky color (color picker)
- Ground color (color picker)

#### World Border
- Border type (Rock Wall, Tree Line, or None)
- World size (in units)

#### Content
- Available enemies (comma-separated list)
- Loot theme name

### 6. Visual Editor

The Visual Editor provides a 3D view of your level:

#### Access
Click the **"Visual Editor"** button at the bottom of the Level Editor panel (requires an active level selection).

#### Features
- **Isometric camera** matching game perspective
- **Real-time preview** of theme colors, ground, and borders
- **Grid overlay** for alignment
- **Four modes**: Select, Meshes, Paint, Timeline

#### Controls
- **Mouse Wheel**: Zoom in/out
- **WASD**: Pan camera (speed scales with zoom)
- **Middle Click** or **Shift+Drag**: Pan camera with mouse
- **Left Click**: Select/Place objects (mode-dependent)

#### Camera Panel
- Zoom slider (0.1x - 5.0x)
- Reset View button (returns to origin)

#### Top Toolbar
- Save button (saves level to storage)
- Test button (launches game with this level)
- Close button (returns to menu editor)

## Workflow

### Creating a New Level

1. **Levels Tab** → Click "New Level"
2. **Settings Tab** → Configure basic info, gameplay, and theme
3. **Timeline Tab** → **Add spawn events** (REQUIRED - all spawning is timeline-based)
4. **Meshes Tab** → Place obstacles and decorations (optional)
5. **Paint Tab** → Add environmental details (optional)
6. **Visual Editor** → Review and fine-tune in 3D
7. **Save** → Save your level
8. **Test** → Launch the game to playtest

### Editing an Existing Level

1. **Levels Tab** → Select a level from the list
2. Modify using any of the editor tabs
3. **Visual Editor** → Preview changes in 3D
4. **Save** → Save your changes
5. **Test** → Playtest the modifications

### Duplicating a Level

1. **Levels Tab** → Find the level you want to copy
2. Click the **Copy icon** on the level card
3. A new level will be created with "(Copy)" suffix
4. Modify as needed

### Exporting/Importing Levels

**Export**:
1. Select a level
2. Click the **Download icon** on the level card
3. A JSON file will be downloaded

**Import**:
1. **Levels Tab** → Click "Import"
2. Select a `.json` level file
3. The level will be added to your custom levels list

## Storage

- **Primary**: API-backed storage (`/api/levels/`)
- **Fallback**: LocalStorage (if API unavailable)
- **Format**: JSON files

## Tips & Best Practices

### Timeline Design
- **For custom levels**: Timeline-only spawning is enabled by default. Design your entire difficulty curve explicitly in the timeline.
- **For endless survival**: Uncheck "Timeline-Only Spawning" in Settings tab to enable background spawning (like default levels).
- Start with basic enemies (drifter, screecher, bruiser) at the beginning.
- Introduce harder enemies gradually (after ~5-10 minutes of game time).
- Use Elite flags strategically (every 60-90 seconds) for difficulty spikes.
- Boss events should be rare and placed at key challenge moments.
- Add warning messages for major events to telegraph threats.
- If using timeline-only mode, ensure timeline events cover the entire level duration (e.g., if level is 10 minutes, have events through 600 seconds).

### Mesh Placement
- Use rocks and walls for strategic cover
- Don't overcrowd the play area
- Leave clear paths for player movement
- Collision-enabled objects create obstacles
- Use Visual Editor to avoid overlapping meshes

### Paint Optimization
- Lower density (30-50%) looks more natural
- Mix different scatter types for variety
- Use color paint sparingly (accents only)
- Smaller areas (5-15m) are easier to manage

### Theme Design
- Dark sky colors work well for night/horror themes
- Lighter ground colors improve visibility
- High contrast between sky and ground helps readability
- Match border type to theme (rocks for caves, trees for forests)

### Testing
- Test early and often
- Check difficulty curve (too easy/hard?)
- Verify spawn timing feels right
- Ensure meshes don't block critical areas
- Confirm win condition is achievable

## Limitations

- **Localhost Only**: Editor disabled in production
- **No Multiplayer**: Single-player levels only
- **Fixed Camera**: Isometric view cannot be changed
- **Mesh Library**: Limited to 6 basic mesh types
- **Paint Interaction**: Click-and-drag painting requires Visual Editor enhancement
- **No Undo**: Save frequently, export backups

## Troubleshooting

### Editor Won't Open
- Verify you're on `localhost` or `127.0.0.1`
- Check browser console for errors
- Refresh the page and try again

### Visual Editor Shows Blank Screen
- Check browser console for Three.js errors
- Ensure WebGL is enabled in your browser
- Try closing and reopening the editor

### Levels Won't Save
- Check `/api/levels/save` endpoint in Network tab
- Fallback to localStorage will activate automatically
- Export your level as backup

### Changes Not Appearing in Game
- Ensure you clicked "Save" before testing
- Reload the page if level doesn't update
- Check that level data includes timeline events

## Keyboard Shortcuts

- **F2** or **Ctrl+L**: Toggle Level Editor (disabled in favor of menu button)
- **WASD**: Pan camera in Visual Editor
- **Esc**: Close Visual Editor (use Close button instead)

## Data Structure

Custom levels are stored as JSON with this structure:

```json
{
  "id": "custom_1234567890",
  "name": "My Custom Level",
  "description": "A challenging custom level",
  "maxLevel": 30,
  "winCondition": "level",
  "winValue": 30,
  "difficultyMultiplier": 1.2,
  "availableEnemies": ["drifter", "screecher", "bruiser"],
  "lootThemeName": "CUSTOM LOOT",
  "theme": {
    "skyColor": 0x1a1e1a,
    "groundColor": 0x3d453d
  },
  "timeline": [
    {
      "time": 10,
      "count": 5,
      "enemyType": "drifter",
      "isElite": false,
      "isBoss": false,
      "message": "The horde awakens..."
    }
  ],
  "meshPlacements": [
    {
      "id": "mesh_1234567890",
      "meshType": "rock",
      "position": { "x": 0, "y": 0, "z": 0 },
      "rotation": { "x": 0, "y": 45, "z": 0 },
      "scale": { "x": 1.5, "y": 1.5, "z": 1.5 },
      "isStatic": true,
      "hasCollision": true
    }
  ],
  "paintedAreas": [
    {
      "id": "paint_1234567890",
      "type": "scatter",
      "points": [
        { "x": -5, "y": -5 },
        { "x": 5, "y": -5 },
        { "x": 5, "y": 5 },
        { "x": -5, "y": 5 }
      ],
      "meshType": "grass",
      "density": 50
    }
  ],
  "borderConfig": {
    "type": "rock",
    "size": 100
  }
}
```

## Future Enhancements

Potential improvements for future versions:

- **Interactive mesh positioning** (drag-and-drop in Visual Editor)
- **Interactive paint tool** (brush-style painting in 3D view)
- **More mesh types** (furniture, vehicles, props)
- **Lighting controls** (custom light sources)
- **Audio zones** (region-specific music/SFX)
- **Trigger events** (spawn on player position/level)
- **Path waypoints** (enemy movement paths)
- **Undo/Redo system**
- **Level validation** (check for common issues)
- **Template library** (pre-made level templates)
