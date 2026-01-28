/**
 * Performance Benchmark Script
 *
 * Automated performance testing with various entity counts.
 * Generates detailed performance reports for optimization analysis.
 */

interface BenchmarkResult {
  testName: string;
  entityCount: number;
  duration: number; // seconds
  avgFPS: number;
  minFPS: number;
  maxFPS: number;
  avgFrameTime: number;
  maxFrameTime: number;
  dropped60FPS: number; // % of frames below 60fps
  dropped30FPS: number; // % of frames below 30fps
  avgEntityUpdateTime: number;
  avgCollisionTime: number;
  avgParticleTime: number;
  avgRenderTime: number;
  peakMemoryMB: number;
}

interface BenchmarkSuite {
  suiteName: string;
  timestamp: number;
  results: BenchmarkResult[];
  systemInfo: {
    userAgent: string;
    platform: string;
    vendor: string;
    memory?: number;
  };
}

/**
 * Performance Benchmark Test Cases
 */
const BENCHMARK_TESTS = [
  {
    name: 'Baseline (50 enemies)',
    entityCount: 50,
    enemyType: 'drifter',
    duration: 30, // seconds
  },
  {
    name: 'Light Load (100 enemies)',
    entityCount: 100,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Medium Load (250 enemies)',
    entityCount: 250,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Heavy Load (500 enemies)',
    entityCount: 500,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Stress Test (750 enemies)',
    entityCount: 750,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Extreme (1000 enemies)',
    entityCount: 1000,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Max Load (1500 enemies)',
    entityCount: 1500,
    enemyType: 'drifter',
    duration: 30,
  },
  {
    name: 'Mixed Enemy Types (400 enemies)',
    entityCount: 400,
    enemyType: 'mixed',
    duration: 30,
  },
  {
    name: 'Fast Enemies (300 screechers)',
    entityCount: 300,
    enemyType: 'screecher',
    duration: 30,
  },
  {
    name: 'Tank Enemies (200 bruisers)',
    entityCount: 200,
    enemyType: 'bruiser',
    duration: 30,
  },
];

/**
 * Analyze performance data and generate report
 */
function analyzePerformanceData(
  testName: string,
  entityCount: number,
  duration: number,
  metricsHistory: any[]
): BenchmarkResult {
  const fpsValues = metricsHistory.map(m => m.fps);
  const frameTimeValues = metricsHistory.map(m => m.frameTime);
  const entityUpdateTimes = metricsHistory.map(m => m.timings.entityUpdate);
  const collisionTimes = metricsHistory.map(m => m.timings.collisionDetection);
  const particleTimes = metricsHistory.map(m => m.timings.particleSystem);
  const renderTimes = metricsHistory.map(m => m.renderTime);
  const memoryValues = metricsHistory.map(m => m.memoryUsageMB).filter(m => m > 0);

  const avgFPS = fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length;
  const minFPS = Math.min(...fpsValues);
  const maxFPS = Math.max(...fpsValues);
  const avgFrameTime = frameTimeValues.reduce((a, b) => a + b, 0) / frameTimeValues.length;
  const maxFrameTime = Math.max(...frameTimeValues);

  const below60 = fpsValues.filter(fps => fps < 60).length;
  const below30 = fpsValues.filter(fps => fps < 30).length;
  const dropped60FPS = (below60 / fpsValues.length) * 100;
  const dropped30FPS = (below30 / fpsValues.length) * 100;

  const avgEntityUpdateTime =
    entityUpdateTimes.reduce((a, b) => a + b, 0) / entityUpdateTimes.length;
  const avgCollisionTime = collisionTimes.reduce((a, b) => a + b, 0) / collisionTimes.length;
  const avgParticleTime = particleTimes.reduce((a, b) => a + b, 0) / particleTimes.length;
  const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  const peakMemoryMB = memoryValues.length > 0 ? Math.max(...memoryValues) : 0;

  return {
    testName,
    entityCount,
    duration,
    avgFPS,
    minFPS,
    maxFPS,
    avgFrameTime,
    maxFrameTime,
    dropped60FPS,
    dropped30FPS,
    avgEntityUpdateTime,
    avgCollisionTime,
    avgParticleTime,
    avgRenderTime,
    peakMemoryMB,
  };
}

/**
 * Generate comprehensive report
 */
function generateReport(suite: BenchmarkSuite): string {
  let report = '# Performance Benchmark Report\n\n';
  report += `**Date:** ${new Date(suite.timestamp).toLocaleString()}\n\n`;
  report += `**Suite:** ${suite.suiteName}\n\n`;

  // System Info
  report += '## System Information\n\n';
  report += `- Platform: ${suite.systemInfo.platform}\n`;
  report += `- Vendor: ${suite.systemInfo.vendor}\n`;
  report += `- User Agent: ${suite.systemInfo.userAgent}\n`;
  if (suite.systemInfo.memory) {
    report += `- Available Memory: ${suite.systemInfo.memory} GB\n`;
  }
  report += '\n';

  // Summary Table
  report += '## Results Summary\n\n';
  report += '| Test | Entities | Avg FPS | Min FPS | Avg Frame (ms) | <60 FPS (%) | <30 FPS (%) |\n';
  report += '|------|----------|---------|---------|----------------|-------------|-------------|\n';

  suite.results.forEach(result => {
    const dropped60 = result.dropped60FPS.toFixed(1);
    const dropped30 = result.dropped30FPS.toFixed(1);
    report += `| ${result.testName} | ${result.entityCount} | ${result.avgFPS.toFixed(1)} | ${result.minFPS.toFixed(1)} | ${result.avgFrameTime.toFixed(2)} | ${dropped60}% | ${dropped30}% |\n`;
  });
  report += '\n';

  // Timing Breakdown
  report += '## Timing Breakdown (Average)\n\n';
  report += '| Test | Entity Update | Collision | Particles | Render | Total |\n';
  report += '|------|---------------|-----------|-----------|--------|-------|\n';

  suite.results.forEach(result => {
    const total =
      result.avgEntityUpdateTime +
      result.avgCollisionTime +
      result.avgParticleTime +
      result.avgRenderTime;
    report += `| ${result.testName} | ${result.avgEntityUpdateTime.toFixed(2)}ms | ${result.avgCollisionTime.toFixed(2)}ms | ${result.avgParticleTime.toFixed(2)}ms | ${result.avgRenderTime.toFixed(2)}ms | ${total.toFixed(2)}ms |\n`;
  });
  report += '\n';

  // Performance Analysis
  report += '## Performance Analysis\n\n';

  const best = suite.results.reduce((prev, curr) =>
    curr.avgFPS > prev.avgFPS ? curr : prev
  );
  const worst = suite.results.reduce((prev, curr) =>
    curr.avgFPS < prev.avgFPS ? curr : prev
  );

  report += `### Best Performance\n`;
  report += `- **${best.testName}**: ${best.avgFPS.toFixed(1)} FPS with ${best.entityCount} entities\n\n`;

  report += `### Worst Performance\n`;
  report += `- **${worst.testName}**: ${worst.avgFPS.toFixed(1)} FPS with ${worst.entityCount} entities\n\n`;

  // Find bottleneck
  const avgResult = suite.results[2]; // Medium load
  if (avgResult) {
    const timings = [
      { name: 'Entity Update', time: avgResult.avgEntityUpdateTime },
      { name: 'Collision Detection', time: avgResult.avgCollisionTime },
      { name: 'Particle System', time: avgResult.avgParticleTime },
      { name: 'Rendering', time: avgResult.avgRenderTime },
    ];
    timings.sort((a, b) => b.time - a.time);

    report += `### Primary Bottleneck (at ${avgResult.entityCount} entities)\n`;
    report += `- **${timings[0].name}**: ${timings[0].time.toFixed(2)}ms (${((timings[0].time / avgResult.avgFrameTime) * 100).toFixed(1)}% of frame time)\n\n`;
  }

  // Recommendations
  report += '## Optimization Recommendations\n\n';

  const avgFPS = suite.results.reduce((sum, r) => sum + r.avgFPS, 0) / suite.results.length;
  if (avgFPS < 50) {
    report += '- ⚠️ **Overall FPS is below target** - Major optimizations needed\n';
  }

  const highCollisionTime = suite.results.some(r => r.avgCollisionTime > 5);
  if (highCollisionTime) {
    report += '- ⚠️ **Collision detection is expensive** - Consider spatial partitioning (quadtree/grid)\n';
  }

  const highParticleTime = suite.results.some(r => r.avgParticleTime > 3);
  if (highParticleTime) {
    report += '- ⚠️ **Particle system overhead** - Reduce particle count or simplify updates\n';
  }

  const highEntityUpdateTime = suite.results.some(r => r.avgEntityUpdateTime > 8);
  if (highEntityUpdateTime) {
    report += '- ⚠️ **Entity update time is high** - Optimize entity logic or reduce active entities\n';
  }

  const highRenderTime = suite.results.some(r => r.avgRenderTime > 10);
  if (highRenderTime) {
    report += '- ⚠️ **Render time is high** - Consider instanced rendering or sprite batching\n';
  }

  const highMemory = suite.results.some(r => r.peakMemoryMB > 500);
  if (highMemory) {
    report += '- ⚠️ **Memory usage is high** - Ensure object pooling and proper cleanup\n';
  }

  report += '\n';

  // Entity Scaling Analysis
  report += '## Entity Scaling Performance\n\n';
  report += 'FPS vs Entity Count:\n\n';
  report += '```\n';

  const scalingTests = suite.results
    .filter(r => r.testName.includes('Load') || r.testName.includes('Baseline') || r.testName.includes('Max'))
    .sort((a, b) => a.entityCount - b.entityCount);

  scalingTests.forEach(result => {
    const bars = Math.floor(result.avgFPS / 2);
    const bar = '█'.repeat(bars) + '░'.repeat(30 - bars);
    report += `${String(result.entityCount).padStart(4)} entities: ${bar} ${result.avgFPS.toFixed(1)} FPS\n`;
  });
  report += '```\n\n';

  // Target Performance
  report += '## Target Performance Goals\n\n';
  report += '- **60 FPS**: Ideal target for smooth gameplay\n';
  report += '- **30 FPS**: Minimum acceptable performance\n';
  report += '- **Frame Time**: <16.67ms for 60 FPS, <33ms for 30 FPS\n';
  report += '- **Entity Limit**: 1,500 concurrent entities\n\n';

  const passed60 = suite.results.filter(r => r.avgFPS >= 60).length;
  const passed30 = suite.results.filter(r => r.avgFPS >= 30).length;
  const total = suite.results.length;

  report += `**Tests Meeting 60 FPS Target:** ${passed60}/${total} (${((passed60 / total) * 100).toFixed(0)}%)\n\n`;
  report += `**Tests Meeting 30 FPS Target:** ${passed30}/${total} (${((passed30 / total) * 100).toFixed(0)}%)\n\n`;

  return report;
}

/**
 * Export results to JSON
 */
function exportJSON(suite: BenchmarkSuite): string {
  return JSON.stringify(suite, null, 2);
}

/**
 * Export results to CSV
 */
function exportCSV(suite: BenchmarkSuite): string {
  let csv = 'Test Name,Entity Count,Avg FPS,Min FPS,Max FPS,Avg Frame Time,Max Frame Time,Below 60 FPS %,Below 30 FPS %,Entity Update,Collision,Particles,Render,Memory MB\n';

  suite.results.forEach(result => {
    csv += `"${result.testName}",${result.entityCount},${result.avgFPS.toFixed(2)},${result.minFPS.toFixed(2)},${result.maxFPS.toFixed(2)},${result.avgFrameTime.toFixed(2)},${result.maxFrameTime.toFixed(2)},${result.dropped60FPS.toFixed(2)},${result.dropped30FPS.toFixed(2)},${result.avgEntityUpdateTime.toFixed(2)},${result.avgCollisionTime.toFixed(2)},${result.avgParticleTime.toFixed(2)},${result.avgRenderTime.toFixed(2)},${result.peakMemoryMB.toFixed(2)}\n`;
  });

  return csv;
}

// Export for use in the game
export {
  BENCHMARK_TESTS,
  analyzePerformanceData,
  generateReport,
  exportJSON,
  exportCSV,
  type BenchmarkResult,
  type BenchmarkSuite,
};

// Browser console interface
if (typeof window !== 'undefined') {
  (window as any).performanceBenchmark = {
    tests: BENCHMARK_TESTS,
    help: () => {
      console.log(`
=== Performance Benchmark Commands ===

performanceBenchmark.tests - List all benchmark tests

After running benchmarks in-game:
- Press F4 to export current profiling data
- Use developer console to access results

Test scenarios:
${BENCHMARK_TESTS.map((t, i) => `  ${i + 1}. ${t.name} (${t.entityCount} entities, ${t.duration}s)`).join('\n')}
      `);
    },
  };

  console.log('Type "performanceBenchmark.help()" for benchmark information');
}
