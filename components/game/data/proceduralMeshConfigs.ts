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
  isFormation?: boolean // If true, spawns a composite formation instead of a single mesh
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
      // Primary meshes
      { type: 'tree', weight: 0.22, scaleMin: 0.7, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 0.3 },
      { type: 'rock', weight: 0.08, scaleMin: 0.8, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 1.1 },

      // Secondary meshes
      { type: 'tree_dead', weight: 0.06, scaleMin: 0.6, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.35 },
      { type: 'shrub', weight: 0.04, scaleMin: 0.5, scaleMax: 2.5, hasCollision: false, minDistanceFromSpawn: 8, collisionRadius: 0 },
      { type: 'pillar', weight: 0.05, scaleMin: 0.7, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.65 },

      // Formations
      { type: 'tree_copse', weight: 0.18, scaleMin: 0.8, scaleMax: 2.0, hasCollision: true, minDistanceFromSpawn: 20, collisionRadius: 4.0, isFormation: true },
      { type: 'temple_ruins', weight: 0.12, scaleMin: 0.7, scaleMax: 1.8, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 6.0, isFormation: true },
      { type: 'stone_circle', weight: 0.08, scaleMin: 0.8, scaleMax: 1.8, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 5.0, isFormation: true },
      { type: 'rocky_outcrop', weight: 0.07, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 18, collisionRadius: 4.5, isFormation: true },
      { type: 'ruined_wall', weight: 0.06, scaleMin: 0.8, scaleMax: 1.6, hasCollision: true, minDistanceFromSpawn: 20, collisionRadius: 4.0, isFormation: true },
      { type: 'graveyard', weight: 0.04, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 22, collisionRadius: 5.0, isFormation: true },
    ]
  },

  frozen_waste: {
    worldId: 'frozen_waste',
    totalMeshCount: 200,
    minSpacing: 3.8,
    maxRadius: 200,
    distributionPattern: 'random',
    spawnRules: [
      // Primary meshes
      { type: 'crystal', weight: 0.18, scaleMin: 0.6, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 0.55 },
      { type: 'rock', weight: 0.07, scaleMin: 0.8, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 1.1 },

      // Secondary meshes
      { type: 'tree_dead', weight: 0.06, scaleMin: 0.5, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.35 },
      { type: 'shrub', weight: 0.02, scaleMin: 0.4, scaleMax: 2.0, hasCollision: false, minDistanceFromSpawn: 8, collisionRadius: 0 },

      // Structured patterns
      { type: 'wall_stone', weight: 0.05, scaleMin: 0.9, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 1.05 },
      { type: 'pillar_broken', weight: 0.04, scaleMin: 0.8, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.65 },

      // Formations
      { type: 'crystal_cluster', weight: 0.18, scaleMin: 0.7, scaleMax: 1.8, hasCollision: true, minDistanceFromSpawn: 22, collisionRadius: 4.5, isFormation: true },
      { type: 'temple_ruins', weight: 0.10, scaleMin: 0.6, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 6.0, isFormation: true },
      { type: 'rocky_outcrop', weight: 0.10, scaleMin: 0.7, scaleMax: 1.6, hasCollision: true, minDistanceFromSpawn: 18, collisionRadius: 4.5, isFormation: true },
      { type: 'ruined_wall', weight: 0.08, scaleMin: 0.8, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 20, collisionRadius: 4.0, isFormation: true },
      { type: 'stone_circle', weight: 0.06, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 5.0, isFormation: true },
      { type: 'graveyard', weight: 0.06, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 22, collisionRadius: 5.0, isFormation: true },
    ]
  },

  catacombs: {
    worldId: 'catacombs',
    totalMeshCount: 180,
    minSpacing: 3.5,
    maxRadius: 200,
    distributionPattern: 'random',
    spawnRules: [
      // Primary meshes
      { type: 'pillar', weight: 0.16, scaleMin: 0.9, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 12, collisionRadius: 0.65 },
      { type: 'pillar_broken', weight: 0.08, scaleMin: 0.8, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.65 },

      // Secondary meshes
      { type: 'statue', weight: 0.05, scaleMin: 0.8, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 0.8 },
      { type: 'rock', weight: 0.06, scaleMin: 0.7, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 10, collisionRadius: 1.1 },
      { type: 'ruins_brick', weight: 0.04, scaleMin: 0.8, scaleMax: 3.0, hasCollision: false, minDistanceFromSpawn: 9, collisionRadius: 0 },
      { type: 'wall_brick', weight: 0.03, scaleMin: 0.9, scaleMax: 3.0, hasCollision: true, minDistanceFromSpawn: 11, collisionRadius: 1.05 },

      // Formations
      { type: 'temple_ruins', weight: 0.16, scaleMin: 0.7, scaleMax: 1.8, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 6.0, isFormation: true },
      { type: 'graveyard', weight: 0.16, scaleMin: 0.8, scaleMax: 1.8, hasCollision: true, minDistanceFromSpawn: 22, collisionRadius: 5.0, isFormation: true },
      { type: 'ruined_wall', weight: 0.10, scaleMin: 0.8, scaleMax: 1.6, hasCollision: true, minDistanceFromSpawn: 20, collisionRadius: 4.0, isFormation: true },
      { type: 'stone_circle', weight: 0.08, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 25, collisionRadius: 5.0, isFormation: true },
      { type: 'rocky_outcrop', weight: 0.08, scaleMin: 0.7, scaleMax: 1.5, hasCollision: true, minDistanceFromSpawn: 18, collisionRadius: 4.0, isFormation: true },
    ]
  }
}
