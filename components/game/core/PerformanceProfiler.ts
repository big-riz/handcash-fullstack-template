/**
 * Performance Profiler
 *
 * Tracks rendering performance metrics for optimization analysis.
 * Monitors FPS, frame time, entity counts, draw calls, and memory usage.
 */

export interface PerformanceMetrics {
  // Frame metrics
  fps: number;
  frameTime: number; // ms
  minFrameTime: number;
  maxFrameTime: number;
  avgFrameTime: number;

  // Entity counts
  totalEntities: number;
  enemyCount: number;
  projectileCount: number;
  particleCount: number;
  xpGemCount: number;

  // Render metrics
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;

  // System metrics
  updateTime: number; // ms
  renderTime: number; // ms
  physicsTime: number; // ms

  // Memory (approximate)
  memoryUsageMB: number;

  // GPU metrics
  gpuTime?: number; // ms (if available)

  // Timing breakdown
  timings: {
    entityUpdate: number;
    spriteUpdate: number;
    collisionDetection: number;
    particleSystem: number;
    billboardUpdate: number;
    sceneRender: number;
  };

  // Game stats
  gameStats: {
    totalDamage: number;
    totalKills: number;
    totalXP: number;
    dps: number;
    gameTime: number;
  };
}

export interface GameStatsHistory {
  damage: number[];
  kills: number[];
  xp: number[];
  dps: number[];
  enemies: number[];
  timestamps: number[]; // game time in seconds
}

export class PerformanceProfiler {
  private enabled = true;
  private metrics: PerformanceMetrics;

  // Frame timing
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private frameTimeWindow = 60; // Track last 60 frames

  // Timing markers
  private markers: Map<string, number> = new Map();
  private timingResults: Map<string, number> = new Map();

  // History for graphs
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private entityCountHistory: number[] = [];
  private historySize = 300; // 5 seconds at 60fps

  // Game stats history (sampled every second for 7 minutes = 420 samples)
  private gameStatsHistory: GameStatsHistory = {
    damage: [],
    kills: [],
    xp: [],
    dps: [],
    enemies: [],
    timestamps: [],
  };
  private gameStatsHistorySize = 420; // 7 minutes at 1 sample/second
  private lastGameStatsSampleTime = 0;
  private lastDamageForDPS = 0;
  private lastSampleGameTime = 0;

  // Performance warnings
  private warnings: string[] = [];
  private readonly TARGET_FPS = 60;
  private readonly TARGET_FRAME_TIME = 16.67; // ms

  constructor() {
    this.metrics = this.createEmptyMetrics();
  }

  private createEmptyMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      minFrameTime: Infinity,
      maxFrameTime: 0,
      avgFrameTime: 0,
      totalEntities: 0,
      enemyCount: 0,
      projectileCount: 0,
      particleCount: 0,
      xpGemCount: 0,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      updateTime: 0,
      renderTime: 0,
      physicsTime: 0,
      memoryUsageMB: 0,
      timings: {
        entityUpdate: 0,
        spriteUpdate: 0,
        collisionDetection: 0,
        particleSystem: 0,
        billboardUpdate: 0,
        sceneRender: 0,
      },
      gameStats: {
        totalDamage: 0,
        totalKills: 0,
        totalXP: 0,
        dps: 0,
        gameTime: 0,
      },
    };
  }

  // Timing markers
  mark(label: string): void {
    if (!this.enabled) return;
    this.markers.set(label, performance.now());
  }

  measure(label: string, startLabel: string): void {
    if (!this.enabled) return;
    const startTime = this.markers.get(startLabel);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.timingResults.set(label, duration);
      this.markers.delete(startLabel);
    }
  }

  measureEnd(label: string): void {
    if (!this.enabled) return;
    const startTime = this.markers.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      this.timingResults.set(label, duration);
      this.markers.delete(label);
    }
  }

  // Frame tracking
  beginFrame(): void {
    if (!this.enabled) return;
    this.mark('frame');
    this.mark('update');
  }

  endUpdate(): void {
    if (!this.enabled) return;
    this.measureEnd('update');
    this.metrics.updateTime = this.timingResults.get('update') || 0;
  }

  beginRender(): void {
    if (!this.enabled) return;
    this.mark('render');
  }

  endRender(): void {
    if (!this.enabled) return;
    this.measureEnd('render');
    this.metrics.renderTime = this.timingResults.get('render') || 0;
  }

  endFrame(): void {
    if (!this.enabled) return;

    this.measureEnd('frame');
    const frameTime = this.timingResults.get('frame') || 0;

    // Update frame timing
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.frameTimeWindow) {
      this.frameTimes.shift();
    }

    // Calculate FPS
    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgFrameTime;

    // Update metrics
    this.metrics.frameTime = frameTime;
    this.metrics.fps = fps;
    this.metrics.avgFrameTime = avgFrameTime;
    this.metrics.minFrameTime = Math.min(this.metrics.minFrameTime, frameTime);
    this.metrics.maxFrameTime = Math.max(this.metrics.maxFrameTime, frameTime);

    // Update history
    this.fpsHistory.push(fps);
    this.frameTimeHistory.push(frameTime);
    this.entityCountHistory.push(this.metrics.totalEntities);

    if (this.fpsHistory.length > this.historySize) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
      this.entityCountHistory.shift();
    }

    // Extract timing breakdowns
    this.metrics.timings.entityUpdate = this.timingResults.get('entityUpdate') || 0;
    this.metrics.timings.spriteUpdate = this.timingResults.get('spriteUpdate') || 0;
    this.metrics.timings.collisionDetection = this.timingResults.get('collisionDetection') || 0;
    this.metrics.timings.particleSystem = this.timingResults.get('particleSystem') || 0;
    this.metrics.timings.billboardUpdate = this.timingResults.get('billboardUpdate') || 0;
    this.metrics.timings.sceneRender = this.timingResults.get('sceneRender') || 0;

    // Check for performance issues
    this.checkPerformance();

    this.lastFrameTime = frameTime;
  }

  // Entity tracking
  updateEntityCounts(counts: {
    enemies: number;
    projectiles: number;
    particles: number;
    xpGems: number;
  }): void {
    this.metrics.enemyCount = counts.enemies;
    this.metrics.projectileCount = counts.projectiles;
    this.metrics.particleCount = counts.particles;
    this.metrics.xpGemCount = counts.xpGems;
    this.metrics.totalEntities = counts.enemies + counts.projectiles + counts.particles + counts.xpGems;
  }

  // Render stats
  updateRenderStats(stats: {
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  }): void {
    this.metrics.drawCalls = stats.drawCalls;
    this.metrics.triangles = stats.triangles;
    this.metrics.geometries = stats.geometries;
    this.metrics.textures = stats.textures;
  }

  // Memory tracking (approximate)
  updateMemoryUsage(): void {
    if ((performance as any).memory) {
      const memInfo = (performance as any).memory;
      this.metrics.memoryUsageMB = memInfo.usedJSHeapSize / 1024 / 1024;
    }
  }

  // Game stats tracking
  updateGameStats(stats: {
    totalDamage: number;
    totalKills: number;
    totalXP: number;
    gameTime: number;
    enemyCount?: number;
  }): void {
    const { totalDamage, totalKills, totalXP, gameTime, enemyCount = 0 } = stats;

    // Calculate DPS (damage per second)
    const dps = gameTime > 0 ? totalDamage / gameTime : 0;

    // Update current metrics
    this.metrics.gameStats = {
      totalDamage,
      totalKills,
      totalXP,
      dps,
      gameTime,
    };

    // Sample history every second (when game time crosses a new second)
    const currentSecond = Math.floor(gameTime);
    if (currentSecond > this.lastSampleGameTime && currentSecond > 0) {
      this.lastSampleGameTime = currentSecond;

      // Calculate DPS for this interval
      const damageDelta = totalDamage - this.lastDamageForDPS;
      const intervalDPS = damageDelta; // damage in the last second
      this.lastDamageForDPS = totalDamage;

      // Add to history
      this.gameStatsHistory.damage.push(totalDamage);
      this.gameStatsHistory.kills.push(totalKills);
      this.gameStatsHistory.xp.push(totalXP);
      this.gameStatsHistory.dps.push(intervalDPS);
      this.gameStatsHistory.enemies.push(enemyCount);
      this.gameStatsHistory.timestamps.push(currentSecond);

      // Trim to max size (7 minutes)
      if (this.gameStatsHistory.damage.length > this.gameStatsHistorySize) {
        this.gameStatsHistory.damage.shift();
        this.gameStatsHistory.kills.shift();
        this.gameStatsHistory.xp.shift();
        this.gameStatsHistory.dps.shift();
        this.gameStatsHistory.enemies.shift();
        this.gameStatsHistory.timestamps.shift();
      }
    }
  }

  getGameStatsHistory(): GameStatsHistory {
    return {
      damage: [...this.gameStatsHistory.damage],
      kills: [...this.gameStatsHistory.kills],
      xp: [...this.gameStatsHistory.xp],
      dps: [...this.gameStatsHistory.dps],
      enemies: [...this.gameStatsHistory.enemies],
      timestamps: [...this.gameStatsHistory.timestamps],
    };
  }

  // Performance checks
  private checkPerformance(): void {
    this.warnings = [];

    if (this.metrics.fps < 30) {
      this.warnings.push(`CRITICAL: FPS dropped to ${this.metrics.fps.toFixed(1)}`);
    } else if (this.metrics.fps < 50) {
      this.warnings.push(`WARNING: FPS below 50 (${this.metrics.fps.toFixed(1)})`);
    }

    if (this.metrics.frameTime > 33) {
      this.warnings.push(`CRITICAL: Frame time ${this.metrics.frameTime.toFixed(1)}ms (>33ms)`);
    } else if (this.metrics.frameTime > 20) {
      this.warnings.push(`WARNING: Frame time ${this.metrics.frameTime.toFixed(1)}ms (>20ms)`);
    }

    if (this.metrics.totalEntities > 2250) {
      this.warnings.push(`WARNING: Entity count ${this.metrics.totalEntities} approaching limit (2250)`);
    }

    if (this.metrics.drawCalls > 100) {
      this.warnings.push(`WARNING: High draw call count (${this.metrics.drawCalls})`);
    }

    if (this.metrics.memoryUsageMB > 500) {
      this.warnings.push(`WARNING: High memory usage (${this.metrics.memoryUsageMB.toFixed(1)}MB)`);
    }

    // Timing breakdown warnings
    if (this.metrics.timings.collisionDetection > 5) {
      this.warnings.push(`WARNING: Collision detection taking ${this.metrics.timings.collisionDetection.toFixed(1)}ms`);
    }

    if (this.metrics.timings.particleSystem > 3) {
      this.warnings.push(`WARNING: Particle system taking ${this.metrics.timings.particleSystem.toFixed(1)}ms`);
    }
  }

  // Getters
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  getWarnings(): string[] {
    return [...this.warnings];
  }

  getFPSHistory(): number[] {
    return [...this.fpsHistory];
  }

  getFrameTimeHistory(): number[] {
    return [...this.frameTimeHistory];
  }

  getEntityCountHistory(): number[] {
    return [...this.entityCountHistory];
  }

  // Report generation
  generateReport(): string {
    const m = this.metrics;

    let report = '=== PERFORMANCE REPORT ===\n\n';

    // Frame stats
    report += '--- Frame Statistics ---\n';
    report += `FPS: ${m.fps.toFixed(1)} (target: ${this.TARGET_FPS})\n`;
    report += `Frame Time: ${m.frameTime.toFixed(2)}ms (target: ${this.TARGET_FRAME_TIME.toFixed(2)}ms)\n`;
    report += `Avg Frame Time: ${m.avgFrameTime.toFixed(2)}ms\n`;
    report += `Min/Max: ${m.minFrameTime.toFixed(2)}ms / ${m.maxFrameTime.toFixed(2)}ms\n\n`;

    // Entity counts
    report += '--- Entity Counts ---\n';
    report += `Total Entities: ${m.totalEntities}\n`;
    report += `  Enemies: ${m.enemyCount}\n`;
    report += `  Projectiles: ${m.projectileCount}\n`;
    report += `  Particles: ${m.particleCount}\n`;
    report += `  XP Gems: ${m.xpGemCount}\n\n`;

    // Render stats
    report += '--- Render Statistics ---\n';
    report += `Draw Calls: ${m.drawCalls}\n`;
    report += `Triangles: ${m.triangles}\n`;
    report += `Geometries: ${m.geometries}\n`;
    report += `Textures: ${m.textures}\n\n`;

    // Timing breakdown
    report += '--- Timing Breakdown ---\n';
    report += `Update Time: ${m.updateTime.toFixed(2)}ms\n`;
    report += `Render Time: ${m.renderTime.toFixed(2)}ms\n`;
    report += `  Entity Update: ${m.timings.entityUpdate.toFixed(2)}ms\n`;
    report += `  Sprite Update: ${m.timings.spriteUpdate.toFixed(2)}ms\n`;
    report += `  Collision Detection: ${m.timings.collisionDetection.toFixed(2)}ms\n`;
    report += `  Particle System: ${m.timings.particleSystem.toFixed(2)}ms\n`;
    report += `  Billboard Update: ${m.timings.billboardUpdate.toFixed(2)}ms\n`;
    report += `  Scene Render: ${m.timings.sceneRender.toFixed(2)}ms\n\n`;

    // Memory
    report += '--- Memory Usage ---\n';
    report += `Heap Size: ${m.memoryUsageMB.toFixed(1)}MB\n\n`;

    // Warnings
    if (this.warnings.length > 0) {
      report += '--- Performance Warnings ---\n';
      this.warnings.forEach(warning => {
        report += `${warning}\n`;
      });
      report += '\n';
    }

    // Recommendations
    report += '--- Optimization Recommendations ---\n';
    if (m.fps < 50) {
      report += '• FPS is below target - consider reducing entity counts or simplifying rendering\n';
    }
    if (m.drawCalls > 50) {
      report += '• High draw call count - consider batching sprites or using instanced rendering\n';
    }
    if (m.timings.collisionDetection > 5) {
      report += '• Collision detection is slow - consider spatial partitioning or broadphase optimization\n';
    }
    if (m.timings.particleSystem > 3) {
      report += '• Particle system overhead - consider reducing particle count or simplifying updates\n';
    }
    if (m.totalEntities > 1000) {
      report += '• High entity count - ensure object pooling is working correctly\n';
    }

    return report;
  }

  // Export data for analysis
  exportData(): any {
    return {
      metrics: this.metrics,
      fpsHistory: this.fpsHistory,
      frameTimeHistory: this.frameTimeHistory,
      entityCountHistory: this.entityCountHistory,
      warnings: this.warnings,
      timestamp: Date.now(),
    };
  }

  // Control
  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  reset(): void {
    this.metrics = this.createEmptyMetrics();
    this.frameTimes = [];
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.entityCountHistory = [];
    this.warnings = [];
    this.markers.clear();
    this.timingResults.clear();
    // Reset game stats history
    this.gameStatsHistory = {
      damage: [],
      kills: [],
      xp: [],
      dps: [],
      enemies: [],
      timestamps: [],
    };
    this.lastGameStatsSampleTime = 0;
    this.lastDamageForDPS = 0;
    this.lastSampleGameTime = 0;
  }
}
