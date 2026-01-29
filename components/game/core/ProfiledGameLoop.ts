/**
 * ProfiledGameLoop.ts
 *
 * Extended GameLoop with integrated performance profiling.
 * Drop-in replacement for GameLoop when profiling is needed.
 */

import { PerformanceProfiler } from './PerformanceProfiler';

export class ProfiledGameLoop {
  private lastTime = 0;
  private accumulator = 0;
  private readonly fixedDeltaTime = 1000 / 60; // 60 FPS in milliseconds
  private animationFrameId: number | null = null;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isRunning = false;

  // FPS tracking
  private fpsFrames: number[] = [];
  private currentFps = 0;

  // Uncapped mode - runs as fast as possible (for benchmarking)
  private uncappedMode = false;

  // Performance profiler
  private profiler: PerformanceProfiler;

  constructor(
    private updateCallback: (deltaTime: number) => void,
    private renderCallback: (alpha: number) => void,
    private fpsCallback?: (fps: number) => void,
    enableProfiler: boolean = true
  ) {
    this.profiler = new PerformanceProfiler();
    if (!enableProfiler) {
      this.profiler.disable();
    }
  }

  /**
   * Enable/disable uncapped frame rate mode.
   * When enabled, runs as fast as CPU allows (no vsync).
   * Useful for benchmarking but uses more CPU/power.
   */
  setUncapped(uncapped: boolean): void {
    this.uncappedMode = uncapped;
    console.log(`[ProfiledGameLoop] Uncapped mode: ${uncapped ? 'ON' : 'OFF'}`);
  }

  isUncapped(): boolean {
    return this.uncappedMode;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    // Don't reset profiler on start - preserves game stats history across pauses/level ups
    this.loop(this.lastTime);
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private loop = (currentTime: number) => {
    if (!this.isRunning) return;

    // Begin frame profiling
    this.profiler.beginFrame();

    // Calculate frame time
    const frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update FPS counter
    this.updateFps(frameTime);

    // Add frame time to accumulator (capped to prevent spiral of death)
    this.accumulator += Math.min(frameTime, 250);

    // Profile update phase
    this.profiler.mark('updatePhase');

    // Fixed timestep updates
    let updateCount = 0;
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateCallback(this.fixedDeltaTime / 1000); // Convert to seconds
      this.accumulator -= this.fixedDeltaTime;
      updateCount++;

      // Safety: prevent infinite loop
      if (updateCount > 5) {
        console.warn('[ProfiledGameLoop] Too many updates in single frame, skipping remaining');
        this.accumulator = 0;
        break;
      }
    }

    this.profiler.measureEnd('updatePhase');
    this.profiler.endUpdate();

    // Calculate interpolation alpha for smooth rendering
    const alpha = this.accumulator / this.fixedDeltaTime;

    // Profile render phase
    this.profiler.beginRender();
    this.profiler.mark('renderPhase');

    // Render with interpolation
    this.renderCallback(alpha);

    this.profiler.measureEnd('renderPhase');
    this.profiler.endRender();

    // End frame profiling
    this.profiler.endFrame();

    // Update memory usage (every 60 frames)
    if (Math.floor(currentTime / 1000) !== Math.floor(this.lastTime / 1000)) {
      this.profiler.updateMemoryUsage();
    }

    // Schedule next frame
    if (this.uncappedMode) {
      // Uncapped: use setTimeout(0) to run as fast as possible
      this.timeoutId = setTimeout(() => this.loop(performance.now()), 0);
    } else {
      // Normal: use requestAnimationFrame (vsync, ~60Hz)
      this.animationFrameId = requestAnimationFrame(this.loop);
    }
  };

  private updateFps(frameTime: number) {
    const currentFps = 1000 / frameTime;
    this.fpsFrames.push(currentFps);

    if (this.fpsFrames.length > 60) {
      this.fpsFrames.shift();
    }

    const avgFps = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length;
    this.currentFps = Math.round(avgFps);

    if (this.fpsCallback) {
      this.fpsCallback(this.currentFps);
    }
  }

  getFps(): number {
    return this.currentFps;
  }

  isActive(): boolean {
    return this.isRunning;
  }

  // Profiler access
  getProfiler(): PerformanceProfiler {
    return this.profiler;
  }

  // Timing markers for external systems
  mark(label: string): void {
    this.profiler.mark(label);
  }

  measureEnd(label: string): void {
    this.profiler.measureEnd(label);
  }

  updateEntityCounts(counts: {
    enemies: number;
    projectiles: number;
    particles: number;
    xpGems: number;
  }): void {
    this.profiler.updateEntityCounts(counts);
  }

  updateRenderStats(stats: {
    drawCalls: number;
    triangles: number;
    geometries: number;
    textures: number;
  }): void {
    this.profiler.updateRenderStats(stats);
  }

  updateGameStats(stats: {
    totalDamage: number;
    totalKills: number;
    totalXP: number;
    gameTime: number;
    enemyCount?: number;
  }): void {
    this.profiler.updateGameStats(stats);
  }
}
