/**
 * Benchmark Mode
 *
 * Stress testing tool for performance profiling.
 * Spawns large numbers of enemies to test rendering performance.
 */

import { EntityManager } from '../entities/EntityManager';
import type { Player } from '../entities/Player';
import type { SpawnSystem } from '../systems/SpawnSystem';
import enemies from '../data/enemies';

export interface BenchmarkConfig {
  enemyCount: number;
  enemyType: string;
  spawnRadius: number;
  spawnDelay: number; // ms between spawn batches
  batchSize: number; // enemies per batch
}

export const BENCHMARK_PRESETS = {
  light: {
    enemyCount: 100,
    enemyType: 'drifter',
    spawnRadius: 50,
    spawnDelay: 100,
    batchSize: 10,
  },
  medium: {
    enemyCount: 300,
    enemyType: 'drifter',
    spawnRadius: 60,
    spawnDelay: 50,
    batchSize: 20,
  },
  heavy: {
    enemyCount: 500,
    enemyType: 'drifter',
    spawnRadius: 70,
    spawnDelay: 30,
    batchSize: 25,
  },
  extreme: {
    enemyCount: 1000,
    enemyType: 'drifter',
    spawnRadius: 80,
    spawnDelay: 20,
    batchSize: 50,
  },
  mixed: {
    enemyCount: 400,
    enemyType: 'mixed',
    spawnRadius: 70,
    spawnDelay: 40,
    batchSize: 20,
  },
};

export class BenchmarkMode {
  private active = false;
  private spawnTimer = 0;
  private spawnedCount = 0;
  private config: BenchmarkConfig;
  private enemyTypes: string[] = [];

  constructor(
    private entityManager: EntityManager,
    private spawnSystem: SpawnSystem,
    private player: Player
  ) {
    this.config = BENCHMARK_PRESETS.medium;
  }

  start(preset: keyof typeof BENCHMARK_PRESETS = 'medium'): void {
    this.config = BENCHMARK_PRESETS[preset];
    this.active = true;
    this.spawnTimer = 0;
    this.spawnedCount = 0;

    // Prepare enemy types
    if (this.config.enemyType === 'mixed') {
      this.enemyTypes = enemies.map(e => e.id).filter(id => {
        // Exclude bosses and mini-bosses
        return !['leshy', 'chernobog', 'ancient_treant', 'golem_destroyer', 'crypt_guardian', 'ice_golem'].includes(id);
      });
    } else {
      this.enemyTypes = [this.config.enemyType];
    }

    console.log(`[Benchmark] Started: ${preset} mode (${this.config.enemyCount} enemies)`);
  }

  stop(): void {
    this.active = false;
    this.spawnedCount = 0;
    console.log('[Benchmark] Stopped');
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    if (this.spawnedCount >= this.config.enemyCount) {
      console.log(`[Benchmark] Completed: ${this.spawnedCount} enemies spawned`);
      this.active = false;
      return;
    }

    this.spawnTimer += deltaTime * 1000;

    if (this.spawnTimer >= this.config.spawnDelay) {
      this.spawnTimer = 0;
      this.spawnBatch();
    }
  }

  private spawnBatch(): void {
    const remaining = this.config.enemyCount - this.spawnedCount;
    const toSpawn = Math.min(this.config.batchSize, remaining);

    for (let i = 0; i < toSpawn; i++) {
      this.spawnRandomEnemy();
    }

    this.spawnedCount += toSpawn;

    if (this.spawnedCount % 100 === 0) {
      console.log(`[Benchmark] Spawned ${this.spawnedCount} / ${this.config.enemyCount}`);
    }
  }

  private spawnRandomEnemy(): void {
    const playerPos = this.player.getPosition();
    const angle = Math.random() * Math.PI * 2;
    const distance = this.config.spawnRadius + Math.random() * 20;

    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;

    const enemyType = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];

    this.spawnSystem.spawnEnemy(enemyType, x, z, false, false);
  }

  isActive(): boolean {
    return this.active;
  }

  getProgress(): { spawned: number; total: number; percent: number } {
    return {
      spawned: this.spawnedCount,
      total: this.config.enemyCount,
      percent: (this.spawnedCount / this.config.enemyCount) * 100,
    };
  }

  // Quick spawn methods for testing
  spawnWave(count: number, enemyType: string = 'drifter'): void {
    const playerPos = this.player.getPosition();
    const radius = 50;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = playerPos.x + Math.cos(angle) * radius;
      const z = playerPos.z + Math.sin(angle) * radius;

      this.spawnSystem.spawnEnemy(enemyType, x, z, false, false);
    }

    console.log(`[Benchmark] Spawned wave of ${count} ${enemyType}s`);
  }

  spawnCircle(count: number, radius: number, enemyType: string = 'drifter'): void {
    const playerPos = this.player.getPosition();

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const x = playerPos.x + Math.cos(angle) * radius;
      const z = playerPos.z + Math.sin(angle) * radius;

      this.spawnSystem.spawnEnemy(enemyType, x, z, false, false);
    }

    console.log(`[Benchmark] Spawned circle of ${count} ${enemyType}s at radius ${radius}`);
  }

  spawnGrid(rows: number, cols: number, spacing: number, enemyType: string = 'drifter'): void {
    const playerPos = this.player.getPosition();
    const startX = playerPos.x - ((cols - 1) * spacing) / 2;
    const startZ = playerPos.z - ((rows - 1) * spacing) / 2;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * spacing;
        const z = startZ + row * spacing;

        this.spawnSystem.spawnEnemy(enemyType, x, z, false, false);
      }
    }

    console.log(`[Benchmark] Spawned grid of ${rows}x${cols} ${enemyType}s`);
  }
}

// Console commands for easy testing
if (typeof window !== 'undefined') {
  (window as any).benchmark = {
    presets: BENCHMARK_PRESETS,
    help: () => {
      console.log(`
=== Benchmark Commands ===

benchmark.start(preset)  - Start benchmark mode
  Presets: 'light', 'medium', 'heavy', 'extreme', 'mixed'

benchmark.stop()         - Stop benchmark mode

benchmark.spawn(count, type) - Spawn enemies in wave
  Example: benchmark.spawn(100, 'drifter')

benchmark.circle(count, radius, type) - Spawn in circle
  Example: benchmark.circle(50, 30, 'screecher')

benchmark.grid(rows, cols, spacing, type) - Spawn in grid
  Example: benchmark.grid(10, 10, 5, 'bruiser')

benchmark.presets        - List available presets
      `);
    },
  };

  console.log('Type "benchmark.help()" for performance testing commands');
}
