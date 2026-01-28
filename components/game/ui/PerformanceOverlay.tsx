/**
 * Performance Overlay
 *
 * Real-time visual display of performance metrics.
 * Toggle with F3 key.
 */

import React, { useEffect, useState } from 'react';
import type { PerformanceMetrics, GameStatsHistory } from '../core/PerformanceProfiler';

interface PerformanceOverlayProps {
  metrics: PerformanceMetrics;
  warnings: string[];
  fpsHistory: number[];
  frameTimeHistory: number[];
  entityCountHistory: number[];
  gameStatsHistory: GameStatsHistory;
  visible: boolean;
}

export function PerformanceOverlay({
  metrics,
  warnings,
  fpsHistory,
  frameTimeHistory,
  entityCountHistory,
  gameStatsHistory,
  visible,
}: PerformanceOverlayProps) {
  if (!visible) return null;

  const m = metrics;

  // Color coding for FPS
  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#00ff00';
    if (fps >= 45) return '#ffff00';
    if (fps >= 30) return '#ff8800';
    return '#ff0000';
  };

  // Color coding for frame time
  const getFrameTimeColor = (time: number) => {
    if (time <= 16.67) return '#00ff00';
    if (time <= 20) return '#ffff00';
    if (time <= 33) return '#ff8800';
    return '#ff0000';
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 10,
        right: 10,
        background: 'rgba(0, 0, 0, 0.85)',
        color: '#ffffff',
        padding: '15px',
        fontFamily: 'monospace',
        fontSize: '12px',
        lineHeight: '1.4',
        borderRadius: '8px',
        border: '1px solid #444',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 10000,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {/* Title */}
      <div
        style={{
          fontSize: '14px',
          fontWeight: 'bold',
          marginBottom: '10px',
          borderBottom: '1px solid #666',
          paddingBottom: '5px',
        }}
      >
        🔍 PERFORMANCE PROFILER
      </div>

      {/* Frame Stats */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff' }}>Frame Statistics</div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ color: getFPSColor(m.fps) }}>
            FPS: {m.fps.toFixed(1)} / 60
          </div>
          <div style={{ color: getFrameTimeColor(m.frameTime) }}>
            Frame: {m.frameTime.toFixed(2)}ms / 16.67ms
          </div>
          <div style={{ color: '#cccccc' }}>
            Avg: {m.avgFrameTime.toFixed(2)}ms
          </div>
          <div style={{ color: '#999999' }}>
            Min/Max: {m.minFrameTime.toFixed(2)}ms / {m.maxFrameTime.toFixed(2)}ms
          </div>
        </div>
      </div>

      {/* Mini FPS Graph */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff', marginBottom: '5px' }}>
          FPS History (Last 5s)
        </div>
        <MiniGraph
          data={fpsHistory}
          min={0}
          max={60}
          width={360}
          height={40}
          color="#00ff00"
          targetLine={60}
        />
      </div>

      {/* Game Stats Graph - 7 minute duration */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff', marginBottom: '5px' }}>
          Game Stats (7 min)
        </div>
        <MultiLineGraph
          lines={[
            { data: gameStatsHistory.damage, color: '#ff6b6b', label: 'Damage' },
            { data: gameStatsHistory.kills, color: '#4ecdc4', label: 'Kills' },
            { data: gameStatsHistory.xp, color: '#ffe66d', label: 'XP' },
            { data: gameStatsHistory.dps, color: '#a855f7', label: 'DPS' },
            { data: gameStatsHistory.enemies, color: '#22c55e', label: 'Enemies' },
          ]}
          timestamps={gameStatsHistory.timestamps}
          width={360}
          height={120}
        />
      </div>

      {/* Entity Counts */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff' }}>Entity Counts</div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ color: m.totalEntities > 2250 ? '#ff0000' : '#00ff00' }}>
            Total: {m.totalEntities} / 2250
          </div>
          <div style={{ color: '#cccccc' }}>
            Enemies: {m.enemyCount}
          </div>
          <div style={{ color: '#cccccc' }}>
            Projectiles: {m.projectileCount}
          </div>
          <div style={{ color: '#cccccc' }}>
            Particles: {m.particleCount}
          </div>
          <div style={{ color: '#cccccc' }}>
            XP Gems: {m.xpGemCount}
          </div>
        </div>
      </div>

      {/* Render Stats */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff' }}>Render Statistics</div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ color: m.drawCalls > 100 ? '#ff8800' : '#cccccc' }}>
            Draw Calls: {m.drawCalls}
          </div>
          <div style={{ color: '#cccccc' }}>
            Triangles: {m.triangles.toLocaleString()}
          </div>
          <div style={{ color: '#cccccc' }}>
            Geometries: {m.geometries}
          </div>
          <div style={{ color: '#cccccc' }}>
            Textures: {m.textures}
          </div>
        </div>
      </div>

      {/* Timing Breakdown */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#aaddff' }}>Timing Breakdown</div>
        <div style={{ paddingLeft: '10px' }}>
          <div style={{ color: '#cccccc' }}>
            Update: {m.updateTime.toFixed(2)}ms
          </div>
          <div style={{ paddingLeft: '10px', fontSize: '11px' }}>
            <div>└ Entity Update: {m.timings.entityUpdate.toFixed(2)}ms</div>
            <div>└ Sprite Update: {m.timings.spriteUpdate.toFixed(2)}ms</div>
            <div style={{ color: m.timings.collisionDetection > 5 ? '#ff8800' : '#999999' }}>
              └ Collision: {m.timings.collisionDetection.toFixed(2)}ms
            </div>
            <div style={{ color: m.timings.particleSystem > 3 ? '#ff8800' : '#999999' }}>
              └ Particles: {m.timings.particleSystem.toFixed(2)}ms
            </div>
          </div>
          <div style={{ color: '#cccccc' }}>
            Render: {m.renderTime.toFixed(2)}ms
          </div>
          <div style={{ paddingLeft: '10px', fontSize: '11px' }}>
            <div>└ Billboard: {m.timings.billboardUpdate.toFixed(2)}ms</div>
            <div>└ Scene: {m.timings.sceneRender.toFixed(2)}ms</div>
          </div>
        </div>
      </div>

      {/* Memory */}
      {m.memoryUsageMB > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontWeight: 'bold', color: '#aaddff' }}>Memory Usage</div>
          <div style={{ paddingLeft: '10px' }}>
            <div style={{ color: m.memoryUsageMB > 500 ? '#ff8800' : '#cccccc' }}>
              Heap: {m.memoryUsageMB.toFixed(1)} MB
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div
            style={{
              fontWeight: 'bold',
              color: '#ff4444',
              borderTop: '1px solid #ff4444',
              paddingTop: '5px',
            }}
          >
            ⚠️ Performance Warnings
          </div>
          <div style={{ paddingLeft: '10px' }}>
            {warnings.map((warning, index) => (
              <div key={index} style={{ color: '#ff8888', fontSize: '11px' }}>
                • {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '5px',
          borderTop: '1px solid #666',
          fontSize: '10px',
          color: '#888',
        }}
      >
        Press F3 to toggle • F4 to export report
      </div>
    </div>
  );
}

// Mini graph component
function MiniGraph({
  data,
  min,
  max,
  width,
  height,
  color,
  targetLine,
}: {
  data: number[];
  min: number;
  max: number;
  width: number;
  height: number;
  color: string;
  targetLine?: number;
}) {
  if (data.length === 0) return null;

  const normalize = (value: number) => {
    return height - ((value - min) / (max - min)) * height;
  };

  const points = data
    .map((value, index) => {
      const x = (index / Math.max(data.length - 1, 1)) * width;
      const y = normalize(Math.max(min, Math.min(max, value)));
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      style={{
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid #444',
        borderRadius: '4px',
      }}
    >
      {/* Target line */}
      {targetLine !== undefined && (
        <line
          x1={0}
          y1={normalize(targetLine)}
          x2={width}
          y2={normalize(targetLine)}
          stroke="#ffffff"
          strokeWidth="1"
          strokeDasharray="2,2"
          opacity="0.3"
        />
      )}

      {/* Graph line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Current value indicator */}
      {data.length > 0 && (
        <circle
          cx={width - 5}
          cy={normalize(Math.max(min, Math.min(max, data[data.length - 1])))}
          r={3}
          fill={color}
        />
      )}
    </svg>
  );
}

// Multi-line graph component for game stats (7 minute duration)
interface DataLine {
  data: number[];
  color: string;
  label: string;
}

function MultiLineGraph({
  lines,
  timestamps,
  width,
  height,
}: {
  lines: DataLine[];
  timestamps: number[];
  width: number;
  height: number;
}) {
  if (lines.every(line => line.data.length === 0)) {
    return (
      <div
        style={{
          width,
          height,
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid #444',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666',
          fontSize: '10px',
        }}
      >
        Collecting data...
      </div>
    );
  }

  // Find max values for each line to normalize independently
  const normalizedLines = lines.map(line => {
    const max = Math.max(...line.data, 1);
    return {
      ...line,
      max,
      normalizedData: line.data.map(v => v / max),
    };
  });

  const padding = { top: 5, right: 5, bottom: 20, left: 5 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Generate points for each line
  const generatePoints = (normalizedData: number[]) => {
    if (normalizedData.length === 0) return '';
    return normalizedData
      .map((value, index) => {
        const x = padding.left + (index / Math.max(normalizedData.length - 1, 1)) * graphWidth;
        const y = padding.top + (1 - value) * graphHeight;
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Time labels for x-axis (show every minute)
  const duration = 420; // 7 minutes in seconds
  const timeLabels = [];
  for (let i = 0; i <= 7; i++) {
    timeLabels.push({
      label: `${i}m`,
      x: padding.left + (i / 7) * graphWidth,
    });
  }

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width={width}
        height={height}
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid #444',
          borderRadius: '4px',
        }}
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + ratio * graphHeight}
            x2={padding.left + graphWidth}
            y2={padding.top + ratio * graphHeight}
            stroke="#333"
            strokeWidth="1"
            strokeDasharray="2,4"
          />
        ))}

        {/* Time axis labels */}
        {timeLabels.map((t, i) => (
          <text
            key={i}
            x={t.x}
            y={height - 4}
            fill="#666"
            fontSize="8"
            textAnchor="middle"
          >
            {t.label}
          </text>
        ))}

        {/* Data lines */}
        {normalizedLines.map((line, i) => (
          <polyline
            key={i}
            points={generatePoints(line.normalizedData)}
            fill="none"
            stroke={line.color}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity="0.9"
          />
        ))}

        {/* Current value indicators */}
        {normalizedLines.map((line, i) => {
          if (line.normalizedData.length === 0) return null;
          const lastValue = line.normalizedData[line.normalizedData.length - 1];
          return (
            <circle
              key={i}
              cx={padding.left + graphWidth}
              cy={padding.top + (1 - lastValue) * graphHeight}
              r={3}
              fill={line.color}
            />
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '4px',
          fontSize: '9px',
        }}
      >
        {normalizedLines.map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: line.color,
              }}
            />
            <span style={{ color: line.color }}>
              {line.label}: {formatNumber(line.data[line.data.length - 1] || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Format large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return Math.round(num).toString();
}
