/**
 * Procedural Mesh Configuration for Default Worlds
 *
 * Each world defines spawn rules for procedural mesh generation.
 * Meshes are distributed deterministically using SeededRandom.
 */

export interface MeshSpawnRule {
  type: string
  weight: number // Probability (0-1)
  scaleMin: number
  scaleMax: number
  hasCollision: boolean
  minDistanceFromSpawn: number // Keep clear around player spawn (0,0)
  collisionRadius: number // Base collision radius for this mesh type
}

export interface WorldMeshConfig {
  worldId: string
  totalMeshCount: number
  minSpacing: number // Minimum distance between mesh centers
  maxRadius: number // Max distance from world center
  distributionPattern: 'random' | 'ring' | 'grid'
  spawnRules: MeshSpawnRule[]
}

export const PROCEDURAL_MESH_CONFIGS: Record<string, WorldMeshConfig> = {
  dark_forest: {
    worldId: 'dark_forest',
    totalMeshCount: 250,
    minSpacing: 3.5,
    maxRadius: 200,
    distributionPattern: 'random',
    spawnRules: [
      // Primary meshes (50%)
      { type: 'tree', weight: 0.35, scaleMin: 0.7, scaleMax: 1.3, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 1.2 },
      { type: 'rock', weight: 0.15, scaleMin: 0.8, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 0.9 },

      // Secondary meshes (15%)
      { type: 'tree_dead', weight: 0.10, scaleMin: 0.6, scaleMax: 1.2, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 1.0 },
      { type: 'shrub', weight: 0.05, scaleMin: 0.5, scaleMax: 1.0, hasCollision: false, minDistanceFromSpawn: 8, collisionRadius: 0.6 },

      // Structured patterns
      { type: 'pillar', weight: 0.15, scaleMin: 0.7, scaleMax: 1.1, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.9 },
    ]
  },

  frozen_waste: {
    worldId: 'frozen_waste',
    totalMeshCount: 200,
    minSpacing: 3.8,
    maxRadius: 200,
    distributionPattern: 'random',
    spawnRules: [
      // Primary meshes (40%)
      { type: 'crystal', weight: 0.30, scaleMin: 0.6, scaleMax: 1.4, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 0.8 },
      { type: 'rock', weight: 0.10, scaleMin: 0.8, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 0.9 },

      // Secondary meshes (15%)
      { type: 'tree_dead', weight: 0.12, scaleMin: 0.5, scaleMax: 1.1, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 1.0 },
      { type: 'shrub', weight: 0.03, scaleMin: 0.4, scaleMax: 0.8, hasCollision: false, minDistanceFromSpawn: 8, collisionRadius: 0.5 },

      // Structured patterns (15%)
      { type: 'wall_stone', weight: 0.10, scaleMin: 0.9, scaleMax: 1.2, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 0.8 },
      { type: 'pillar_broken', weight: 0.05, scaleMin: 0.8, scaleMax: 1.1, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.9 },
    ]
  },

  catacombs: {
    worldId: 'catacombs',
    totalMeshCount: 180,
    minSpacing: 3.5,
    maxRadius: 200,
    distributionPattern: 'random',
    spawnRules: [
      // Primary meshes (55%)
      { type: 'pillar', weight: 0.35, scaleMin: 0.9, scaleMax: 1.3, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 1.0 },
      { type: 'pillar_broken', weight: 0.20, scaleMin: 0.8, scaleMax: 1.3, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.9 },

      // Secondary meshes (10%)
      { type: 'statue', weight: 0.10, scaleMin: 0.8, scaleMax: 1.2, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 1.0 },

      // Additional structures (25%)
      { type: 'rock', weight: 0.12, scaleMin: 0.7, scaleMax: 1.4, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 0.8 },
      { type: 'ruins_brick', weight: 0.08, scaleMin: 0.8, scaleMax: 1.2, hasCollision: false, minDistanceFromSpawn: 9, collisionRadius: 0.6 },
      { type: 'wall_brick', weight: 0.05, scaleMin: 0.9, scaleMax: 1.2, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.8 },
    ]
  }
}
