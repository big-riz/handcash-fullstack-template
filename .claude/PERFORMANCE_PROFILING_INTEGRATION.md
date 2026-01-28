# Performance Profiling Integration Summary

Quick reference for integrating the performance profiling system into Slavic Survivors.

## Files Created

### Core System
- `components/game/core/PerformanceProfiler.ts` - Core profiling engine
- `components/game/core/ProfiledGameLoop.ts` - Profiled game loop
- `components/game/ui/PerformanceOverlay.tsx` - Visual overlay component
- `components/game/debug/BenchmarkMode.ts` - Stress testing tool
- `scripts/performance-benchmark.ts` - Automated benchmark suite

### Documentation
- `.claude/PERFORMANCE_PROFILING_GUIDE.md` - Complete usage guide
- `.claude/PERFORMANCE_PROFILING_INTEGRATION.md` - This file

## Quick Integration (Copy-Paste)

### 1. Import Required Components

Add to `useGameEngine.ts`:

```typescript
import { ProfiledGameLoop } from "../core/ProfiledGameLoop"
import { PerformanceProfiler, PerformanceMetrics } from "../core/PerformanceProfiler"
import { BenchmarkMode } from "../debug/BenchmarkMode"
```

### 2. Add State Variables

Add these state variables to the component:

```typescript
const [profilerVisible, setProfilerVisible] = useState(false)
const [profilerMetrics, setProfilerMetrics] = useState<PerformanceMetrics | null>(null)
const [profilerWarnings, setProfilerWarnings] = useState<string[]>([])
const [fpsHistory, setFPSHistory] = useState<number[]>([])
const benchmarkRef = useRef<BenchmarkMode | null>(null)
```

### 3. Replace GameLoop

Find this line (around line 1274):

```typescript
const loop = new GameLoop(update, render, () => {})
```

Replace with:

```typescript
const loop = new ProfiledGameLoop(update, render, () => {}, true)
```

### 4. Add Profiler Markers to Update Function

In the `update` function, add timing markers around key systems:

```typescript
const update = (deltaTime: number) => {
    const loop = gameLoopRef.current as ProfiledGameLoop | null
    if (!loop) return

    // Existing update code...

    // Mark entity update
    loop.mark('entityUpdate')
    em.update(deltaTime)
    loop.measureEnd('entityUpdate')

    // Mark sprite system
    loop.mark('spriteUpdate')
    if (spriteSystemRef.current) {
        spriteSystemRef.current.update(deltaTime)
    }
    loop.measureEnd('spriteUpdate')

    // Mark collision detection
    loop.mark('collisionDetection')
    // ... existing collision code ...
    loop.measureEnd('collisionDetection')

    // Mark particle system
    loop.mark('particleSystem')
    vfxManager.update(deltaTime)
    loop.measureEnd('particleSystem')

    // Update entity counts
    loop.updateEntityCounts({
        enemies: em.enemies.filter(e => e.active).length,
        projectiles: em.projectiles.filter(p => p.active).length,
        particles: vfxManager.particles.filter((p: any) => p.active).length,
        xpGems: em.xpGems.filter(g => g.active).length,
    })

    // Update benchmark if active
    if (benchmarkRef.current?.isActive()) {
        benchmarkRef.current.update(deltaTime)
    }
}
```

### 5. Add Profiler Updates to Render Function

In the `render` function:

```typescript
const render = (alpha: number) => {
    const loop = gameLoopRef.current as ProfiledGameLoop | null
    if (!loop) return
    if (!scene || !camera || !renderer || !playerRef.current) return

    // Mark billboard update
    loop.mark('billboardUpdate')
    // ... existing billboard code ...
    loop.measureEnd('billboardUpdate')

    // Mark scene render
    loop.mark('sceneRender')

    camera.position.x = cameraTargetRef.current.x
    camera.position.y = cameraDistance * Math.sin(cameraPitch)
    camera.position.z = cameraTargetRef.current.z - cameraDistance * Math.cos(cameraPitch)
    camera.lookAt(cameraTargetRef.current.x, 0, cameraTargetRef.current.z)
    camera.zoom = cameraZoomRef.current
    camera.updateProjectionMatrix()

    renderer.render(scene, camera)
    loop.measureEnd('sceneRender')

    // Update render stats
    loop.updateRenderStats({
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
    })

    // Update profiler metrics for UI
    const profiler = loop.getProfiler()
    setProfilerMetrics(profiler.getMetrics())
    setProfilerWarnings(profiler.getWarnings())
    setFPSHistory(profiler.getFPSHistory())
}
```

### 6. Add Keyboard Handler

Add this useEffect for F3/F4 keys:

```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Toggle profiler overlay
        if (e.key === 'F3') {
            e.preventDefault()
            setProfilerVisible(v => !v)
        }

        // Export profiler report
        if (e.key === 'F4') {
            e.preventDefault()
            const loop = gameLoopRef.current as ProfiledGameLoop | null
            if (loop) {
                const profiler = loop.getProfiler()
                const report = profiler.generateReport()
                console.log(report)
                console.log('Raw data:', profiler.exportData())

                // Also save to file
                const blob = new Blob([report], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `performance-report-${Date.now()}.txt`
                a.click()
                URL.revokeObjectURL(url)
            }
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
}, [])
```

### 7. Initialize Benchmark Mode

Add this useEffect to initialize benchmark mode:

```typescript
useEffect(() => {
    if (entityManagerRef.current && spawnSystemRef.current && playerRef.current) {
        benchmarkRef.current = new BenchmarkMode(
            entityManagerRef.current,
            spawnSystemRef.current,
            playerRef.current
        )

        // Expose to console
        (window as any).benchmark = {
            start: (preset: string) => benchmarkRef.current?.start(preset as any),
            stop: () => benchmarkRef.current?.stop(),
            spawn: (count: number, type: string) => benchmarkRef.current?.spawnWave(count, type),
            circle: (count: number, radius: number, type: string) =>
                benchmarkRef.current?.spawnCircle(count, radius, type),
            grid: (rows: number, cols: number, spacing: number, type: string) =>
                benchmarkRef.current?.spawnGrid(rows, cols, spacing, type),
            presets: {
                light: { enemyCount: 100 },
                medium: { enemyCount: 300 },
                heavy: { enemyCount: 500 },
                extreme: { enemyCount: 1000 },
            },
            help: () => console.log('Use benchmark.start("preset"), benchmark.stop(), benchmark.spawn(count, type)'),
        }

        console.log('Benchmark mode ready. Type "benchmark.help()" for commands.')
    }
}, [entityManagerRef.current, spawnSystemRef.current, playerRef.current])
```

### 8. Add Performance Overlay to Component Return

In `SlavicSurvivors.tsx`, import and add the overlay:

```typescript
import { PerformanceOverlay } from './ui/PerformanceOverlay'

// In the return statement, add:
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
```

## Verification Steps

After integration:

1. **Test Profiler Toggle**
   - Press F3 - overlay should appear
   - Press F3 again - overlay should disappear

2. **Test Report Export**
   - Press F4 - report should appear in console
   - Report file should download

3. **Test Benchmark Mode**
   - Open console
   - Type `benchmark.help()`
   - Type `benchmark.start('light')`
   - Watch enemy spawn
   - Check FPS in overlay

4. **Verify Metrics**
   - Check FPS counter updates
   - Verify entity counts are accurate
   - Check timing breakdown shows values
   - Spawn enemies and watch metrics change

## Common Issues

### "getProfiler is not a function"

Fix: Ensure you're using `ProfiledGameLoop` not `GameLoop`

```typescript
// Wrong
const loop = new GameLoop(...)

// Correct
const loop = new ProfiledGameLoop(..., true)
```

### Overlay Not Showing

Fix: Check that profilerMetrics state is being updated

```typescript
// Add this in render function
const profiler = loop.getProfiler()
setProfilerMetrics(profiler.getMetrics())
```

### Benchmark Commands Not Working

Fix: Ensure benchmark mode is initialized

```typescript
// Add useEffect to initialize benchmarkRef
// Expose to window as shown above
```

### Timing Values Always Zero

Fix: Ensure markers are paired correctly

```typescript
// Mark before code
loop.mark('myOperation')
// ... code to measure ...
loop.measureEnd('myOperation')
```

## Performance Budget

Target performance metrics for the game:

```typescript
const PERFORMANCE_BUDGET = {
    targetFPS: 60,
    minFPS: 30,
    targetFrameTime: 16.67, // ms
    maxFrameTime: 33, // ms
    maxEntities: 1500,
    maxDrawCalls: 100,
    maxMemoryMB: 500,

    timingBudget: {
        entityUpdate: 5, // ms
        collision: 5, // ms
        particles: 3, // ms
        render: 10, // ms
    }
}
```

## Next Steps

1. Run benchmarks to establish baselines
2. Identify bottlenecks using timing breakdown
3. Implement optimizations (see guide)
4. Re-run benchmarks to measure improvements
5. Document optimizations and results

See `.claude/PERFORMANCE_PROFILING_GUIDE.md` for complete usage guide.
