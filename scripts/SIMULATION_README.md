# Slavic Survivors Simulation Tool

This tool runs a headless simulation of the *Slavic Survivors* game engine to test balance, performance, and progression without requiring a browser or GPU.

## Usage

Run the simulation using `tsx`:

```bash
npx tsx scripts/simulate-game.ts
```

## Configuration

Edit `scripts/simulate-game.ts` to change the `CONFIG` object:

```typescript
const CONFIG = {
    durationSeconds: 300,  // Simulation duration
    tickRate: 60,          // Physics Hz
    logInterval: 5,        // Console log frequency
    characterId: 'gopnik', // 'gopnik', 'babushka', etc.
    worldId: 'dark_forest',// 'dark_forest', 'frozen_waste'
    seed: 'sim_test_001'   // Deterministic seed
}
```

## Features

- **Headless Engine**: Runs `GameLoop`, `EntityManager`, `SpawnSystem`, and `AbilitySystem` in Node.js.
- **Mocked Rendering**: Bypasses `THREE.js` WebGL rendering while maintaining the scene graph for logic.
- **AI Behavior**: Simulates a "Kiting" player strategy (runs away from nearest enemy).
- **Stat Tracking**: Logs HP, XP, Level, Active Enemies, and Kills.

## Output

The script outputs a time-series log and a final summary:

```text
[SIM] T=60.0s | HP: 100/100 | Lvl: 3 | Enemies: 42 | Gems: 15
...
🏁 SIMULATION COMPLETE
Result: SURVIVED
Time: 300.00s
Level: 12
Kills: 450
```
