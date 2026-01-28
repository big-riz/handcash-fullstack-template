# Performance Profiling Quick Reference

One-page cheat sheet for the performance profiling system.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F3` | Toggle performance overlay |
| `F4` | Export performance report to console + download file |

## Console Commands

```javascript
// Benchmark Commands
benchmark.help()                          // Show help
benchmark.start('light')                  // 100 enemies
benchmark.start('medium')                 // 300 enemies
benchmark.start('heavy')                  // 500 enemies
benchmark.start('extreme')                // 1000 enemies
benchmark.start('mixed')                  // 400 mixed types
benchmark.stop()                          // Stop benchmark

// Quick Spawn Commands
benchmark.spawn(100, 'drifter')           // Spawn 100 drifters
benchmark.circle(50, 30, 'screecher')     // Circle of 50 screechers
benchmark.grid(10, 10, 5, 'bruiser')      // 10x10 grid of bruisers

// Performance Benchmark Commands
performanceBenchmark.help()               // Show benchmark info
```

## Performance Overlay

### FPS Color Codes
- 🟢 Green (>55 FPS): Excellent
- 🟡 Yellow (45-55 FPS): Good
- 🟠 Orange (30-45 FPS): Fair
- 🔴 Red (<30 FPS): Poor

### Key Metrics Displayed
- FPS (current/target)
- Frame Time (current/target)
- Entity Count (total/limit)
- Entity Breakdown (enemies/projectiles/particles/xp)
- Draw Calls
- Timing Breakdown
- Performance Warnings

## Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| FPS | 60+ | <50 | <30 |
| Frame Time | <16.67ms | >20ms | >33ms |
| Entities | <1500 | >1200 | >1500 |
| Draw Calls | <100 | >100 | >200 |
| Memory | <500MB | >500MB | >750MB |
| Entity Update | <5ms | >5ms | >8ms |
| Collision | <5ms | >5ms | >10ms |
| Particles | <3ms | >3ms | >5ms |
| Render | <10ms | >10ms | >15ms |

## Common Bottlenecks

| Symptom | Likely Cause | Solution |
|---------|--------------|----------|
| FPS drops with many enemies | Entity update overhead | Optimize entity logic, cull off-screen |
| High collision time | Naive collision detection | Implement spatial partitioning |
| High particle time | Too many particles | Reduce count, simplify physics |
| High draw calls | No batching | Implement sprite batching |
| High render time | Complex scene | Frustum culling, LOD system |
| Memory growth | Memory leak | Check object disposal |

## Quick Integration

```typescript
// 1. Import
import { ProfiledGameLoop } from "../core/ProfiledGameLoop"

// 2. Replace GameLoop
const loop = new ProfiledGameLoop(update, render, () => {}, true)

// 3. Add markers
loop.mark('entityUpdate')
entityManager.update(deltaTime)
loop.measureEnd('entityUpdate')

// 4. Update counts
loop.updateEntityCounts({
  enemies: em.enemies.filter(e => e.active).length,
  projectiles: em.projectiles.filter(p => p.active).length,
  particles: vfx.particles.filter((p: any) => p.active).length,
  xpGems: em.xpGems.filter(g => g.active).length,
})

// 5. Update render stats
loop.updateRenderStats({
  drawCalls: renderer.info.render.calls,
  triangles: renderer.info.render.triangles,
  geometries: renderer.info.memory.geometries,
  textures: renderer.info.memory.textures,
})
```

## Profiling Workflow

```
1. Enable Overlay (F3)
   ↓
2. Identify Issue
   - Low FPS?
   - High frame time?
   - Check timing breakdown
   ↓
3. Run Benchmark
   - benchmark.start('heavy')
   ↓
4. Export Report (F4)
   - Analyze bottleneck
   - Check recommendations
   ↓
5. Implement Fix
   - Target highest time consumer
   ↓
6. Re-test
   - Run same benchmark
   - Compare metrics
   ↓
7. Verify Improvement
   - Check FPS increase
   - Check frame time decrease
```

## Benchmark Presets

| Preset | Enemies | Enemy Type | Use Case |
|--------|---------|------------|----------|
| light | 100 | drifter | Normal gameplay |
| medium | 300 | drifter | Busy gameplay |
| heavy | 500 | drifter | Peak gameplay |
| extreme | 1000 | drifter | Stress test |
| mixed | 400 | various | Type variety |

## Timing Breakdown

| Phase | Budget | Description |
|-------|--------|-------------|
| Entity Update | <5ms | Entity logic updates |
| Sprite Update | <2ms | Sprite animation |
| Collision | <5ms | Collision detection |
| Particles | <3ms | Particle system |
| Billboard | <5ms | Billboard matrix updates |
| Scene Render | <10ms | Three.js rendering |

## Warning Levels

### CRITICAL ⚠️
- FPS < 30
- Frame time > 33ms
- Entities > 1500
- Memory leak detected

### WARNING ⚡
- FPS < 50
- Frame time > 20ms
- Entities > 1200
- Draw calls > 100
- Memory > 500MB
- Any timing > budget

## Optimization Priority

```
1. Fix CRITICAL warnings first
2. Address biggest bottleneck (highest timing)
3. Optimize high-frequency operations
4. Implement batching/pooling
5. Add spatial partitioning
6. Reduce unnecessary calculations
```

## Common Fixes

### Entity Update Overhead
```typescript
// Use object pooling
// Cull off-screen entities
// Optimize AI logic
if (entity.isOffScreen() && entity.distanceToPlayer > 100) {
  entity.skipUpdate()
}
```

### Collision Bottleneck
```typescript
// Implement spatial hashing
const grid = new SpatialGrid(cellSize)
grid.insert(entity)
const nearby = grid.getNearby(entity)
// Only check collisions with nearby entities
```

### Particle Overhead
```typescript
// Reduce particle count
const particleCount = Math.min(50, desiredCount)
// Pool particles
const particle = particlePool.acquire()
```

### Draw Call Optimization
```typescript
// Batch sprites
const batchedSprites = new InstancedMesh(geometry, material, count)
// Update once, draw once
```

## Files Reference

| File | Purpose |
|------|---------|
| `PerformanceProfiler.ts` | Core profiling engine |
| `ProfiledGameLoop.ts` | Profiled game loop |
| `PerformanceOverlay.tsx` | Visual overlay UI |
| `BenchmarkMode.ts` | Stress testing tool |
| `performance-benchmark.ts` | Automated tests |

## Documentation

| Document | Description |
|----------|-------------|
| `PERFORMANCE_PROFILING_GUIDE.md` | Complete guide (815 lines) |
| `PERFORMANCE_PROFILING_INTEGRATION.md` | Integration steps (378 lines) |
| `PERFORMANCE_PROFILING_SUMMARY.md` | System overview (485 lines) |
| `PERFORMANCE_PROFILING_QUICK_REFERENCE.md` | This cheat sheet |

## Support

**Integration Issues?**
→ Check `PERFORMANCE_PROFILING_INTEGRATION.md`

**Usage Questions?**
→ Check `PERFORMANCE_PROFILING_GUIDE.md`

**Optimization Help?**
→ Check timing breakdown + recommendations in report

**Still Stuck?**
→ Use Chrome DevTools Performance tab for deep analysis
