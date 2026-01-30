/**
 * Procedural Mesh Generator
 *
 * Distributes theme-appropriate meshes throughout game worlds.
 * Uses deterministic placement via SeededRandom for reproducible layouts.
 */

import * as THREE from 'three'
import { SeededRandom } from '@/lib/SeededRandom'
import { generateMeshObject, generateFormation } from '@/components/game/utils/meshUtils'
import { PROCEDURAL_MESH_CONFIGS, WorldMeshConfig, MeshSpawnRule } from '@/components/game/data/proceduralMeshConfigs'

export interface ObstacleData {
  x: number
  z: number
  radius: number
}

// Base collision radii per mesh type (used for per-piece formation collisions)
const MESH_COLLISION_RADII: Record<string, number> = {
  tree: 1.2, rock: 0.9, tree_dead: 1.0, shrub: 0.6, pillar: 0.9,
  pillar_broken: 0.9, crystal: 0.8, wall_stone: 0.8, wall_brick: 0.8,
  statue: 1.0, ruins_brick: 0.6, crate: 0.7, barrel: 0.6, well: 1.2,
  fence: 0.4, fence_wood: 0.4, fence_iron: 0.4, hedge_row: 0.6, log_fence: 0.4,
  wall: 0.8,
}

/**
 * Generate and distribute procedural meshes for a world.
 * Returns collision data for all placed obstacles.
 */
export function generateProceduralMeshes(
  worldId: string,
  envGroup: THREE.Group
): ObstacleData[] {
  const config = PROCEDURAL_MESH_CONFIGS[worldId]
  if (!config) {
    console.warn(`No procedural config for world: ${worldId}`)
    return []
  }

  const rng = new SeededRandom(`world_mesh_${worldId}`)
  const obstacles: ObstacleData[] = []
  const placedMeshes = new Map<string, number>() // Track count per type

  // Weighted rule selection helper
  function selectMeshRule(rules: MeshSpawnRule[]): MeshSpawnRule {
    const rand = rng.next()
    let accumulated = 0
    for (const rule of rules) {
      accumulated += rule.weight
      if (rand <= accumulated) return rule
    }
    return rules[rules.length - 1]
  }

  // Attempt to place meshes
  let placed = 0
  let attempts = 0
  const maxAttempts = config.totalMeshCount * 5

  while (placed < config.totalMeshCount && attempts < maxAttempts) {
    attempts++

    // Generate random position
    const angle = rng.next() * Math.PI * 2
    const distance = rng.next() * config.maxRadius
    const x = Math.cos(angle) * distance
    const z = Math.sin(angle) * distance

    // Check spawn clearance (keep area clear around player)
    if (Math.abs(x) < 15 && Math.abs(z) < 15) {
      continue
    }

    // Select mesh type
    const rule = selectMeshRule(config.spawnRules)

    // Check distance from spawn
    const distFromSpawn = Math.hypot(x, z)
    if (distFromSpawn < rule.minDistanceFromSpawn) {
      continue
    }

    // Random scale
    const scale = rule.scaleMin + rng.next() * (rule.scaleMax - rule.scaleMin)
    const meshRadius = rule.collisionRadius * scale

    // Check collision with existing meshes
    let collides = false
    for (const obs of obstacles) {
      const dist = Math.hypot(x - obs.x, z - obs.z)
      if (dist < meshRadius + obs.radius + (config.minSpacing || 3)) {
        collides = true
        break
      }
    }
    if (collides) {
      continue
    }

    // Place mesh or formation
    const meshSeed = attempts // Deterministic seed per attempt

    if (rule.isFormation) {
      const result = generateFormation(rule.type, meshSeed)
      if (!result) continue
      const { group, pieces } = result
      const rotY = rng.next() * Math.PI * 2
      group.position.set(x, 0, z)
      group.scale.set(scale, scale, scale)
      group.rotation.y = rotY
      envGroup.add(group)

      // Register per-piece collisions in world space
      const cosR = Math.cos(rotY)
      const sinR = Math.sin(rotY)
      for (const p of pieces) {
        const baseRadius = MESH_COLLISION_RADII[p.type]
        if (baseRadius == null) continue // no collision for this mesh type
        const localX = p.offsetX * scale
        const localZ = p.offsetZ * scale
        const worldX = x + localX * cosR - localZ * sinR
        const worldZ = z + localX * sinR + localZ * cosR
        obstacles.push({ x: worldX, z: worldZ, radius: baseRadius * p.scale * scale })
      }
    } else {
      const meshObj = generateMeshObject(rule.type, meshSeed)
      meshObj.position.set(x, 0, z)
      meshObj.scale.set(scale, scale, scale)
      meshObj.rotation.y = rng.next() * Math.PI * 2

      // Apply random rotation for variety
      if (rule.type !== 'crystal' && rule.type !== 'pillar' && rule.type !== 'pillar_broken') {
        meshObj.rotation.x = (rng.next() - 0.5) * 0.2
        meshObj.rotation.z = (rng.next() - 0.5) * 0.2
      }

      envGroup.add(meshObj)

      // Track collision
      if (rule.hasCollision) {
        obstacles.push({ x, z, radius: meshRadius })
      }
    }

    // Track placement count
    const count = placedMeshes.get(rule.type) || 0
    placedMeshes.set(rule.type, count + 1)

    placed++
  }

  // Log generation stats
  console.log(`[ProceduralMesh] ${worldId}: Placed ${placed}/${config.totalMeshCount} meshes`)
  console.log(`[ProceduralMesh] Attempts: ${attempts}, Collisions: ${obstacles.length}`)
  console.log(
    `[ProceduralMesh] Distribution:`,
    Object.fromEntries(placedMeshes)
  )

  return obstacles
}
