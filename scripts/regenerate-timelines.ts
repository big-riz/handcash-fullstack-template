/**
 * Timeline Regeneration Script
 *
 * Uses mathematical balance formulas from MATHEMATICAL_BALANCE_SYSTEM.md
 * to regenerate level timelines with proper difficulty curves.
 */

// ==================== TUNABLE CONSTANTS ====================
const HP_BASE = 100.0;
const EARLY_LINEAR_TIME = 0.12;
const EARLY_LINEAR_LEVEL = 0.008;
const MID_POLY_TIME = 0.5;
const MID_POLY_TIME_EXP = 0.8;
const MID_POLY_LEVEL = 0.15;
const MID_POLY_LEVEL_EXP = 0.9;
const LATE_EXP_TIME = 2.5;
const LATE_EXP_BASE = 1.003;
const LATE_POLY_LEVEL = 0.8;
const LATE_POLY_LEVEL_EXP = 1.1;

const BOSS_INTERVAL = 300;
const BOSS_DURATION = 90;
const BOSS_HP_MULTIPLIER = 3.5;
const BOSS_SPAWN_MULTIPLIER = 1.75;

const SR_BASE = 8.0;
const EARLY_SPAWN_LINEAR = 0.008;
const MID_SPAWN_POLY = 0.02;
const MID_SPAWN_EXP = 0.7;
const LATE_SPAWN_LOG = 0.8;
const MAX_CONCURRENT_ENEMIES = 1500;

const EARLY_MID_CENTER = 300;
const MID_LATE_CENTER = 600;
const TRANSITION_SMOOTHNESS = 60;

const POWER_GAP_BASE = 0.85;
const POWER_GAP_OSCILLATION = 0.15;

// ==================== HELPER FUNCTIONS ====================

function sigmoid(x: number): number {
  return 1.0 / (1.0 + Math.exp(x));
}

function phaseWeights(t: number): [number, number, number] {
  const early = sigmoid((t - EARLY_MID_CENTER) / TRANSITION_SMOOTHNESS);
  let late = sigmoid((MID_LATE_CENTER - t) / TRANSITION_SMOOTHNESS);
  late = 1.0 - late;
  let mid = 1.0 - early - late;
  mid = Math.max(0.0, mid);

  return [early, mid, late];
}

function isBossWave(t: number): boolean {
  const timeInCycle = t % BOSS_INTERVAL;
  return timeInCycle <= BOSS_DURATION;
}

function estimatePlayerLevel(t: number): number {
  if (t < 300) {
    return 1 + t / 25.0;
  } else {
    return 1 + 300 / 25.0 + (t - 300) / 50.0;
  }
}

function calculateSpawnRate(gameTime: number, baseSpawnRate: number = SR_BASE): number {
  const t = gameTime;
  const [wEarly, wMid, wLate] = phaseWeights(t);

  const earlyScale = 1 + EARLY_SPAWN_LINEAR * t;
  const midScale = 1 + MID_SPAWN_POLY * Math.pow(t, MID_SPAWN_EXP);
  const lateScale = 1 + LATE_SPAWN_LOG * Math.log2(1 + t / 60);

  const blendedScale = wEarly * earlyScale + wMid * midScale + wLate * lateScale;
  const bossMult = isBossWave(t) ? BOSS_SPAWN_MULTIPLIER : 1.0;

  let finalRate = baseSpawnRate * blendedScale * bossMult;
  const maxSpawnRate = MAX_CONCURRENT_ENEMIES / 3.0;
  finalRate = Math.min(finalRate, maxSpawnRate);

  return finalRate;
}

// ==================== TIMELINE GENERATION ====================

interface TimelineEvent {
  time: number;
  enemyType: string;
  count: number;
  isBoss?: boolean;
  isElite?: boolean;
  message?: string;
}

interface EnemyProgression {
  id: string;
  weight: number;
  minTime: number;
  maxTime?: number;
}

interface LevelConfig {
  name: string;
  duration: number;
  baseSpawnRate: number;
  spawnInterval: number;
  enemyProgression: EnemyProgression[];
  bossEvents: Array<{ time: number; enemyType: string; message: string }>;
  eliteEvents: Array<{ time: number; enemyType: string; message?: string }>;
  narrativeEvents: Array<{ time: number; message: string }>;
}

function generateTimeline(config: LevelConfig): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];
  const {
    duration,
    baseSpawnRate,
    spawnInterval,
    enemyProgression,
    bossEvents,
    eliteEvents,
    narrativeEvents,
  } = config;

  // Generate regular spawn events
  for (let t = 1; t <= duration; t += spawnInterval) {
    const spawnRate = calculateSpawnRate(t, baseSpawnRate);
    const totalCount = Math.floor(spawnRate * spawnInterval);

    // Get available enemies at this time
    const availableEnemies = enemyProgression.filter(
      e => t >= e.minTime && (!e.maxTime || t <= e.maxTime)
    );

    if (availableEnemies.length === 0) continue;

    // Calculate total weight
    const totalWeight = availableEnemies.reduce((sum, e) => sum + e.weight, 0);

    // Distribute spawns based on weights
    availableEnemies.forEach(enemy => {
      const count = Math.floor((enemy.weight / totalWeight) * totalCount);

      if (count > 0) {
        const event: TimelineEvent = {
          time: t,
          enemyType: enemy.id,
          count: count,
        };

        // Don't flag regular spawns as boss - only actual boss events get that flag
        // The spawn rate calculation already accounts for boss wave multipliers

        timeline.push(event);
      }
    });
  }

  // Add boss events
  bossEvents.forEach(boss => {
    timeline.push({
      time: boss.time,
      enemyType: boss.enemyType,
      count: 1,
      isBoss: true,
      message: boss.message,
    });
  });

  // Add elite events
  eliteEvents.forEach(elite => {
    timeline.push({
      time: elite.time,
      enemyType: elite.enemyType,
      count: 1,
      isElite: true,
      message: elite.message,
    });
  });

  // Add narrative events as overlay messages
  narrativeEvents.forEach(narrative => {
    const existingEvent = timeline.find(e => e.time === narrative.time);
    if (existingEvent) {
      existingEvent.message = narrative.message;
    } else {
      // Find closest event and add message
      const closest = timeline.reduce((prev, curr) =>
        Math.abs(curr.time - narrative.time) < Math.abs(prev.time - narrative.time) ? curr : prev
      );
      if (!closest.message) {
        closest.message = narrative.message;
      }
    }
  });

  // Sort by time
  timeline.sort((a, b) => a.time - b.time);

  return timeline;
}

// ==================== LEVEL CONFIGURATIONS ====================

const frozenWasteConfig: LevelConfig = {
  name: "Frozen Waste",
  duration: 1800, // 30 minutes
  baseSpawnRate: 2.5,
  spawnInterval: 15,
  enemyProgression: [
    // Phase 1: Basic enemies (0-3 minutes)
    { id: "zmora", weight: 3, minTime: 0, maxTime: 180 },
    { id: "drifter", weight: 4, minTime: 0, maxTime: 180 },
    { id: "kikimora", weight: 2, minTime: 15 },
    { id: "screecher", weight: 2, minTime: 25 },

    // Phase 2: Wolves appear (3-8 minutes)
    { id: "spirit_wolf", weight: 2, minTime: 50 },
    { id: "blizzard_wolf", weight: 2, minTime: 52 },
    { id: "bruiser", weight: 1, minTime: 90 },
    { id: "stone_golem", weight: 1, minTime: 150 },

    // Phase 3: Ice elementals (8+ minutes)
    { id: "frost_elemental", weight: 2, minTime: 195 },
    { id: "snow_wraith", weight: 1, minTime: 430 },
    { id: "ancient_treant", weight: 1, minTime: 480 },
    { id: "ice_golem", weight: 0.5, minTime: 735 },
  ],
  bossEvents: [
    { time: 300, enemyType: "ice_golem", message: "A colossal Ice Golem rises from the permafrost!" },
    { time: 550, enemyType: "stone_golem", message: "A Frost Giant awakens from eternal slumber!" },
    { time: 600, enemyType: "ice_golem", message: "Another Ice Golem emerges from the blizzard!" },
    { time: 735, enemyType: "ice_golem", message: "An Ice Golem shatters through the glacier!" },
    { time: 860, enemyType: "werewolf", message: "An Ice Wraith descends upon you!" },
    { time: 900, enemyType: "ancient_treant", message: "The Ancient Frozen Treant awakens!" },
    { time: 1200, enemyType: "ice_golem", message: "The Frost Colossus appears!" },
    { time: 1510, enemyType: "ice_golem", message: "The Frost Colossus awakens!" },
    { time: 1770, enemyType: "leshy", message: "Morozko, the Frost King, has arrived!" },
  ],
  eliteEvents: [
    { time: 190, enemyType: "zmora", message: "A Frost Wraith materializes from the ice!" },
    { time: 320, enemyType: "kikimora", message: "The Ice Maiden's song fills the air!" },
    { time: 620, enemyType: "kikimora" },
    { time: 680, enemyType: "zmora" },
    { time: 900, enemyType: "zmora" },
    { time: 980, enemyType: "kikimora" },
    { time: 1120, enemyType: "stone_golem", message: "Another Frost Giant joins the hunt!" },
    { time: 1200, enemyType: "kikimora" },
    { time: 1280, enemyType: "zmora" },
    { time: 1360, enemyType: "werewolf" },
    { time: 1440, enemyType: "stone_golem" },
    { time: 1500, enemyType: "kikimora" },
    { time: 1560, enemyType: "zmora" },
    { time: 1640, enemyType: "werewolf" },
    { time: 1700, enemyType: "stone_golem" },
    { time: 1740, enemyType: "kikimora" },
    { time: 1775, enemyType: "zmora" },
    { time: 1790, enemyType: "kikimora" },
    { time: 1795, enemyType: "stone_golem" },
  ],
  narrativeEvents: [
    { time: 1, message: "Frozen spirits emerge from the blizzard..." },
    { time: 15, message: "Ice witches weave their snares!" },
    { time: 50, message: "Frost wolves hunt in the storm!" },
    { time: 90, message: "Frozen giants awaken..." },
    { time: 150, message: "Ice golems march forward!" },
    { time: 195, message: "Living ice forms from the permafrost!" },
    { time: 430, message: "Snow wraiths phase through the blizzard!" },
    { time: 480, message: "Ancient ice-covered treants stir!" },
  ],
};

const catacombsConfig: LevelConfig = {
  name: "Catacombs",
  duration: 1260, // 21 minutes
  baseSpawnRate: 3.0,
  spawnInterval: 12,
  enemyProgression: [
    // Phase 1: Descent (0-3 minutes)
    { id: "drifter", weight: 4, minTime: 0 },
    { id: "frost_bat", weight: 3, minTime: 5 },
    { id: "bone_crawler", weight: 2, minTime: 15 },
    { id: "screecher", weight: 2, minTime: 30 },
    { id: "domovoi", weight: 3, minTime: 57 },

    // Phase 2: Bone Halls (3+ minutes)
    { id: "bruiser", weight: 1, minTime: 88 },
    { id: "flame_wraith", weight: 2, minTime: 120 },
    { id: "stone_golem", weight: 1, minTime: 292 },
  ],
  bossEvents: [
    { time: 300, enemyType: "crypt_guardian", message: "The Crypt Lord awakens!" },
    { time: 540, enemyType: "crypt_guardian", message: "The Crypt Guardian awakens from its eternal vigil!" },
    { time: 600, enemyType: "stone_golem", message: "A Stone Sentinel rises!" },
    { time: 890, enemyType: "stone_golem", message: "A Titanic Golem blocks the path!" },
    { time: 900, enemyType: "crypt_guardian", message: "Another Crypt Guardian stirs!" },
    { time: 1200, enemyType: "crypt_guardian", message: "The Ancient Crypt Lord rises from the deepest tomb!" },
  ],
  eliteEvents: [
    { time: 190, enemyType: "bone_crawler", message: "A massive Bone Horror claws its way up!" },
    { time: 400, enemyType: "flame_wraith", message: "An Infernal Wraith rises from the depths!" },
    { time: 504, enemyType: "bone_crawler" },
    { time: 665, enemyType: "flame_wraith" },
    { time: 815, enemyType: "bone_crawler" },
    { time: 935, enemyType: "flame_wraith" },
    { time: 1080, enemyType: "stone_golem" },
    { time: 1140, enemyType: "flame_wraith" },
    { time: 1205, enemyType: "bone_crawler" },
    { time: 1210, enemyType: "flame_wraith" },
    { time: 1230, enemyType: "stone_golem" },
  ],
  narrativeEvents: [
    { time: 1, message: "You descend into the ancient catacombs..." },
    { time: 15, message: "Bones rattle in the darkness!" },
    { time: 57, message: "Tiny creatures swarm from cracks in the walls!" },
    { time: 120, message: "Burning spirits emerge from the walls!" },
    { time: 292, message: "Stone sentinels guard the deeper passages!" },
  ],
};

// ==================== FILE GENERATION ====================

function generateTypeScriptFile(config: LevelConfig): string {
  const timeline = generateTimeline(config);

  // Convert name to camelCase (e.g., "Frozen Waste" -> "frozenWaste")
  const camelCaseName = config.name
    .split(' ')
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');

  let output = `export interface TimelineEvent {
    time: number; // Time in seconds
    enemyType: string;
    count: number;
    isBoss?: boolean;
    isElite?: boolean;
    message?: string;
}

export const ${camelCaseName}Timeline: TimelineEvent[] = [\n`;

  // Group events by phase for better readability
  let currentPhase = 0;
  const phaseDuration = 180; // 3 minutes per phase comment

  timeline.forEach((event, index) => {
    const eventPhase = Math.floor(event.time / phaseDuration);

    if (eventPhase > currentPhase) {
      currentPhase = eventPhase;
      const phaseStart = currentPhase * phaseDuration;
      const phaseEnd = (currentPhase + 1) * phaseDuration;
      output += `\n    // --- Phase ${currentPhase + 1} (${Math.floor(phaseStart / 60)}:${String(phaseStart % 60).padStart(2, '0')} - ${Math.floor(phaseEnd / 60)}:${String(phaseEnd % 60).padStart(2, '0')}) ---\n`;
    }

    output += `    { time: ${event.time}, enemyType: '${event.enemyType}', count: ${event.count}`;

    if (event.isBoss) output += `, isBoss: true`;
    if (event.isElite) output += `, isElite: true`;
    if (event.message) output += `, message: "${event.message}"`;

    output += ` },\n`;
  });

  output += `];\n`;

  return output;
}

// ==================== MAIN ====================

function main() {
  console.log("=== Timeline Regeneration ===\n");

  // Generate Frozen Waste timeline
  console.log("Generating Frozen Waste timeline...");
  const frozenWasteTimeline = generateTypeScriptFile(frozenWasteConfig);

  // Generate Catacombs timeline
  console.log("Generating Catacombs timeline...");
  const catacombsTimeline = generateTypeScriptFile(catacombsConfig);

  // Write to files
  const fs = require('fs');
  const path = require('path');

  const outputDir = path.join(__dirname, '../components/game/data');

  fs.writeFileSync(
    path.join(outputDir, 'frozen_waste_timeline.ts'),
    frozenWasteTimeline
  );
  console.log("✓ Written to frozen_waste_timeline.ts");

  fs.writeFileSync(
    path.join(outputDir, 'catacombs_timeline.ts'),
    catacombsTimeline
  );
  console.log("✓ Written to catacombs_timeline.ts");

  console.log("\n=== Validation ===\n");

  // Validate spawn rates
  const testTimes = [60, 300, 600, 900, 1200, 1800];
  console.log("Time (s) | Player Lvl | Spawn Rate | Boss Wave");
  console.log("---------|------------|------------|----------");

  testTimes.forEach(t => {
    const level = estimatePlayerLevel(t);
    const spawnRate = calculateSpawnRate(t);
    const boss = isBossWave(t) ? "YES" : "NO";
    console.log(
      `${String(t).padStart(8)} | ${level.toFixed(1).padStart(10)} | ${spawnRate.toFixed(2).padStart(10)} | ${boss}`
    );
  });

  console.log("\n✓ Timeline regeneration complete!");
}

main();
