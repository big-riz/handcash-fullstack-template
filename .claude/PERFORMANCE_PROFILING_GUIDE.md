## Performance Profiling Guide

Complete guide for profiling and optimizing game rendering performance.

## Overview

The performance profiling system provides real-time monitoring and detailed analysis of game rendering performance, especially when dealing with hundreds of enemies on screen.

## Components

### 1. PerformanceProfiler (`components/game/core/PerformanceProfiler.ts`)

Core profiling system that tracks:
- **Frame Metrics**: FPS, frame time, min/max/avg values
- **Entity Counts**: Enemies, projectiles, particles, XP gems
- **Render Stats**: Draw calls, triangles, geometries, textures
- **Timing Breakdown**: Update time, render time, collision detection, particles
- **Memory Usage**: Heap size tracking
- **Performance Warnings**: Automatic detection of performance issues

### 2. ProfiledGameLoop (`components/game/core/ProfiledGameLoop.ts`)

Extended game loop with integrated profiling hooks. Drop-in replacement for the standard `GameLoop` that automatically profiles all game phases.

### 3. PerformanceOverlay (`components/game/ui/PerformanceOverlay.tsx`)

Visual overlay displaying real-time performance metrics including:
- Live FPS counter with color-coded status
- Frame time graph (last 5 seconds)
- Entity counts and breakdown
- Render statistics
- Timing breakdown with bottleneck highlighting
- Performance warnings

### 4. BenchmarkMode (`components/game/debug/BenchmarkMode.ts`)

Automated stress testing tool for spawning large numbers of enemies to test performance limits.

### 5. Performance Benchmark Script (`scripts/performance-benchmark.ts`)

Automated benchmark suite that runs comprehensive performance tests with various entity counts and generates detailed reports.

## Quick Start

### Enable Profiling in Game

1. **Toggle Performance Overlay**
   - Press `F3` to show/hide the performance overlay

2. **Export Performance Report**
   - Press `F4` to export detailed performance data to console
   - Data includes metrics, history, and recommendations

### Using Benchmark Mode

Open the browser console and use these commands:

```javascript
// Show help
benchmark.help()

// Start benchmark with preset
benchmark.start('light')    // 100 enemies
benchmark.start('medium')   // 300 enemies
benchmark.start('heavy')    // 500 enemies
benchmark.start('extreme')  // 1000 enemies
benchmark.start('mixed')    // 400 mixed enemy types

// Stop benchmark
benchmark.stop()

// Quick spawn commands
benchmark.spawn(100, 'drifter')          // Spawn 100 drifters in wave
benchmark.circle(50, 30, 'screecher')    // Spawn 50 screechers in circle
benchmark.grid(10, 10, 5, 'bruiser')     // Spawn 10x10 grid of bruisers
```

## Integration Steps

### Step 1: Replace GameLoop with ProfiledGameLoop

In `useGameEngine.ts`, replace the GameLoop import and instantiation:

```typescript
// Old:
import { GameLoop } from "../core/GameLoop"
const loop = new GameLoop(update, render, () => {})

// New:
import { ProfiledGameLoop } from "../core/ProfiledGameLoop"
const loop = new ProfiledGameLoop(update, render, () => {}, true) // true = enable profiler
```

### Step 2: Add Profiler State and Overlay

Add state for profiler visibility and metrics:

```typescript
const [profilerVisible, setProfilerVisible] = useState(false)
const [profilerMetrics, setProfilerMetrics] = useState<PerformanceMetrics | null>(null)
const [profilerWarnings, setProfilerWarnings] = useState<string[]>([])
const [fpsHistory, setFPSHistory] = useState<number[]>([])
```

Add keyboard handler for F3/F4:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'F3') {
      e.preventDefault()
      setProfilerVisible(v => !v)
    }
    if (e.key === 'F4') {
      e.preventDefault()
      const profiler = gameLoopRef.current?.getProfiler()
      if (profiler) {
        const report = profiler.generateReport()
        console.log(report)
        console.log('Raw data:', profiler.exportData())
      }
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

Add performance overlay to render:

```typescript
return (
  <div>
    {/* Existing game UI */}

    {profilerMetrics && (
      <PerformanceOverlay
        metrics={profilerMetrics}
        warnings={profilerWarnings}
        fpsHistory={fpsHistory}
        frameTimeHistory={[]}
        entityCountHistory={[]}
        visible={profilerVisible}
      />
    )}
  </div>
)
```

### Step 3: Update Profiler Metrics in Game Loop

In the `update` callback, add profiling markers:

```typescript
const update = (deltaTime: number) => {
  const loop = gameLoopRef.current
  if (!loop) return

  // Mark entity update phase
  loop.mark('entityUpdate')
  entityManager.update(deltaTime)
  loop.measureEnd('entityUpdate')

  // Mark collision detection
  loop.mark('collisionDetection')
  // ... collision code ...
  loop.measureEnd('collisionDetection')

  // Mark particle system
  loop.mark('particleSystem')
  vfxManager.update(deltaTime)
  loop.measureEnd('particleSystem')

  // Update entity counts
  loop.updateEntityCounts({
    enemies: entityManager.getEnemyCount(),
    projectiles: entityManager.getProjectileCount(),
    particles: vfxManager.getParticleCount(),
    xpGems: entityManager.getXPGemCount(),
  })
}
```

In the `render` callback, update render stats:

```typescript
const render = (alpha: number) => {
  const loop = gameLoopRef.current
  if (!loop) return

  loop.mark('sceneRender')
  renderer.render(scene, camera)
  loop.measureEnd('sceneRender')

  // Update render stats
  loop.updateRenderStats({
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
  })

  // Update UI with latest metrics
  const profiler = loop.getProfiler()
  setProfilerMetrics(profiler.getMetrics())
  setProfilerWarnings(profiler.getWarnings())
  setFPSHistory(profiler.getFPSHistory())
}
```

### Step 4: Add Benchmark Mode (Optional)

Initialize benchmark mode:

```typescript
const benchmarkRef = useRef<BenchmarkMode | null>(null)

useEffect(() => {
  if (entityManager && spawnSystem && player) {
    benchmarkRef.current = new BenchmarkMode(entityManager, spawnSystem, player)

    // Expose to window for console access
    (window as any).benchmark = {
      start: (preset: string) => benchmarkRef.current?.start(preset as any),
      stop: () => benchmarkRef.current?.stop(),
      spawn: (count: number, type: string) => benchmarkRef.current?.spawnWave(count, type),
      circle: (count: number, radius: number, type: string) =>
        benchmarkRef.current?.spawnCircle(count, radius, type),
      grid: (rows: number, cols: number, spacing: number, type: string) =>
        benchmarkRef.current?.spawnGrid(rows, cols, spacing, type),
      help: () => {
        console.log('Benchmark commands: start, stop, spawn, circle, grid')
      },
    }
  }
}, [entityManager, spawnSystem, player])

// Update benchmark in game loop
const update = (deltaTime: number) => {
  // ... existing update code ...

  if (benchmarkRef.current?.isActive()) {
    benchmarkRef.current.update(deltaTime)
  }
}
```

## Running Benchmarks

### Automated Benchmark Suite

The automated benchmark suite runs multiple test scenarios:

1. **Baseline** (50 enemies) - Establishes baseline performance
2. **Light Load** (100 enemies) - Normal gameplay scenario
3. **Medium Load** (250 enemies) - Busy gameplay
4. **Heavy Load** (500 enemies) - Peak gameplay
5. **Stress Test** (750 enemies) - Near maximum capacity
6. **Extreme** (1000 enemies) - Maximum capacity test
7. **Max Load** (1500 enemies) - Hard limit test
8. **Mixed Types** (400 enemies) - Various enemy types
9. **Fast Enemies** (300 screechers) - High-speed movement
10. **Tank Enemies** (200 bruisers) - High-HP entities

Each test runs for 30 seconds and collects detailed metrics.

### Manual Benchmark Process

1. Load the game in development mode
2. Open browser console
3. Enable performance overlay: Press `F3`
4. Run benchmark: `benchmark.start('heavy')`
5. Wait for benchmark to complete (watch console)
6. Export report: Press `F4`
7. Analyze results in console

### Interpreting Results

#### FPS Targets
- **60+ FPS**: Excellent - Smooth gameplay
- **45-60 FPS**: Good - Acceptable with minor stutters
- **30-45 FPS**: Fair - Playable but noticeable lag
- **<30 FPS**: Poor - Unacceptable performance

#### Frame Time Targets
- **<16.67ms**: Excellent - Maintains 60 FPS
- **16.67-20ms**: Good - Minor drops below 60 FPS
- **20-33ms**: Fair - Frequent drops, stays above 30 FPS
- **>33ms**: Poor - Below 30 FPS

#### Warning Indicators

The profiler automatically detects issues:

- **FPS < 30**: CRITICAL performance issue
- **FPS < 50**: WARNING - Below target
- **Frame Time > 33ms**: CRITICAL - Below 30 FPS
- **Frame Time > 20ms**: WARNING - Below target
- **Entity Count > 1500**: WARNING - Near limit
- **Draw Calls > 100**: WARNING - Potential batching issue
- **Memory > 500MB**: WARNING - High memory usage
- **Collision Time > 5ms**: WARNING - Collision bottleneck
- **Particle Time > 3ms**: WARNING - Particle overhead

## Performance Optimization Strategies

### 1. Entity Management

**Problem**: High entity update time

**Solutions**:
- Implement object pooling for enemies, projectiles, particles
- Use spatial partitioning (quadtree/grid) for proximity queries
- Cull off-screen entities from updates
- Batch similar entity updates together
- Reduce AI complexity for distant enemies

### 2. Collision Detection

**Problem**: Collision detection time > 5ms

**Solutions**:
- Implement broadphase collision detection (spatial hashing)
- Use simpler collision shapes (spheres instead of boxes)
- Reduce collision check frequency for non-critical entities
- Skip collision checks for entities beyond certain distance
- Use swept collision for fast-moving objects only

### 3. Particle System

**Problem**: Particle system time > 3ms

**Solutions**:
- Reduce particle count per effect
- Decrease particle lifetime
- Simplify particle physics (no gravity for some effects)
- Use texture atlases for particles
- Implement particle LOD based on distance
- Pool particle objects

### 4. Rendering

**Problem**: High render time or draw calls > 100

**Solutions**:
- Use instanced rendering for enemies
- Batch sprites into single draw call
- Implement billboard batching system
- Use texture atlases to reduce texture switches
- Implement frustum culling
- Reduce shadow map resolution
- Use LOD for distant objects

### 5. Memory Management

**Problem**: Memory usage > 500MB

**Solutions**:
- Ensure proper object disposal
- Clear unused textures and geometries
- Implement aggressive object pooling
- Monitor memory leaks with Chrome DevTools
- Dispose of Three.js objects properly
- Clean up event listeners

## Performance Report Format

The profiler generates comprehensive reports including:

### Frame Statistics
- Current FPS and frame time
- Average, min, max frame times
- Percentage of frames below 60 FPS and 30 FPS

### Entity Breakdown
- Total entity count
- Breakdown by type (enemies, projectiles, particles, XP gems)

### Render Statistics
- Draw call count
- Triangle count
- Geometry count
- Texture count

### Timing Breakdown
- Update time (entity, sprite, collision, particles)
- Render time (billboard, scene)
- Percentage breakdown showing bottlenecks

### Performance Warnings
- Automatic detection of issues
- Severity levels (CRITICAL, WARNING)
- Specific problem identification

### Optimization Recommendations
- Targeted suggestions based on profiling data
- Priority ranking of optimizations
- Expected impact estimation

## Example Benchmark Report

```
=== PERFORMANCE REPORT ===

--- Frame Statistics ---
FPS: 55.3 (target: 60)
Frame Time: 18.08ms (target: 16.67ms)
Avg Frame Time: 18.15ms
Min/Max: 14.23ms / 25.67ms

--- Entity Counts ---
Total Entities: 487
  Enemies: 312
  Projectiles: 98
  Particles: 65
  XP Gems: 12

--- Render Statistics ---
Draw Calls: 45
Triangles: 125,432
Geometries: 23
Textures: 15

--- Timing Breakdown ---
Update Time: 8.45ms
Render Time: 9.15ms
  Entity Update: 3.21ms
  Sprite Update: 1.87ms
  Collision Detection: 2.34ms
  Particle System: 1.03ms
  Billboard Update: 4.23ms
  Scene Render: 4.92ms

--- Memory Usage ---
Heap Size: 287.3MB

--- Performance Warnings ---
WARNING: FPS below 50 (55.3)
WARNING: Frame time 18.08ms (>16.67ms target)

--- Optimization Recommendations ---
• Billboard update time is high - consider batching sprites
• Frame time slightly above target - optimize entity updates
```

## Continuous Monitoring

### In-Development Monitoring

Keep the performance overlay enabled during development:
1. Press `F3` to enable overlay
2. Monitor FPS and entity counts continuously
3. Watch for warnings during gameplay
4. Export detailed report when issues occur (F4)

### Pre-Release Testing

Before releases, run full benchmark suite:
1. Test on minimum spec hardware
2. Run all benchmark presets
3. Document performance baselines
4. Identify and fix critical issues
5. Re-test after optimizations

### Performance Regression Testing

Track performance over time:
1. Run benchmarks after major changes
2. Compare FPS results with baseline
3. Investigate any significant drops (>10%)
4. Document changes that improve performance
5. Add automated performance tests to CI/CD

## Debugging Performance Issues

### Step-by-Step Debugging Process

1. **Identify the Problem**
   - Enable performance overlay
   - Note FPS drops and warnings
   - Check timing breakdown for bottleneck

2. **Reproduce the Issue**
   - Use benchmark mode to recreate conditions
   - Note specific entity counts that cause issues
   - Test with different enemy types

3. **Profile the Bottleneck**
   - Focus on highest timing value
   - Add detailed markers around suspected code
   - Use Chrome DevTools Performance tab

4. **Implement Fix**
   - Apply targeted optimization
   - Re-run benchmark
   - Verify improvement

5. **Validate Fix**
   - Test across all benchmarks
   - Ensure no regressions
   - Document the optimization

### Chrome DevTools Integration

Use Chrome DevTools for deeper analysis:

1. **Performance Tab**
   - Record gameplay session
   - Analyze frame timeline
   - Identify long-running functions
   - Check for forced reflows/layouts

2. **Memory Tab**
   - Take heap snapshots
   - Compare snapshots over time
   - Identify memory leaks
   - Track object retention

3. **Rendering Tab**
   - Enable paint flashing
   - Show FPS meter
   - Check for layout thrashing
   - Monitor paint/composite times

## Best Practices

1. **Profile Early and Often**
   - Don't wait until performance is bad
   - Profile after major features
   - Establish baselines early

2. **Test on Target Hardware**
   - Mid-range devices, not just development machines
   - Mobile devices if applicable
   - Various browser engines

3. **Use Representative Scenarios**
   - Test with realistic entity counts
   - Include worst-case scenarios
   - Test end-game difficulty levels

4. **Document Baselines**
   - Record expected FPS at various entity counts
   - Track performance changes over time
   - Set performance budgets for features

5. **Optimize Wisely**
   - Profile before optimizing
   - Focus on biggest bottlenecks first
   - Measure impact of optimizations
   - Don't sacrifice code quality for micro-optimizations

## Troubleshooting

### Profiler Not Showing Data

- Check that ProfiledGameLoop is used instead of GameLoop
- Verify profiler is enabled in constructor
- Check console for errors

### Inaccurate Timing Data

- Ensure markers are paired correctly (mark + measureEnd)
- Check for overlapping marker names
- Verify timing code is in correct location

### High Memory Usage

- Check for memory leaks in DevTools
- Ensure proper object disposal
- Verify object pooling is working
- Monitor texture and geometry counts

### Inconsistent FPS

- Check for garbage collection pauses
- Monitor background tab throttling
- Verify vsync is not interfering
- Test with consistent conditions

## Next Steps

After completing profiling:

1. **Document Findings**
   - Record baseline performance
   - List identified bottlenecks
   - Prioritize optimizations

2. **Implement Optimizations**
   - Start with highest-impact changes
   - Test each change independently
   - Document performance gains

3. **Continuous Improvement**
   - Regular benchmark runs
   - Track performance trends
   - Maintain performance budgets
   - Share optimization techniques with team
