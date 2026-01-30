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
  // Box collision (OBB) — if present, overrides circle
  halfW?: number   // half-extent along local X
  halfD?: number   // half-extent along local Z
  cosR?: number    // cos(rotation)
  sinR?: number    // sin(rotation)
}

// Collision shapes per mesh type, measured from actual Three.js geometry footprints.
// 'circle' = { radius }
// 'box' = { halfW (local X), halfD (local Z) }
type CollisionShape =
  | { type: 'circle', radius: number }
  | { type: 'box', halfW: number, halfD: number }

const MESH_COLLISION_SHAPES: Record<string, CollisionShape> = {
  // Circular shapes (cylinders, spheroids, irregular)
  rock:         { type: 'circle', radius: 1.1 },   // DodecahedronGeometry(1.0) scaled (1.2, _, 1.0)
  tree:         { type: 'circle', radius: 0.3 },   // trunk bottom radius 0.3
  tree_dead:    { type: 'circle', radius: 0.35 },  // trunk bottom 0.3
  crystal:      { type: 'circle', radius: 0.55 },  // main + side crystals
  barrel:       { type: 'circle', radius: 0.6 },   // Cylinder bottom r=0.6
  well:         { type: 'circle', radius: 1.2 },   // Cylinder r=1.2

  // Box shapes (actual geometry dimensions)
  pillar:       { type: 'box', halfW: 0.6, halfD: 0.6 },    // base Box 1.2×1.2
  pillar_broken:{ type: 'box', halfW: 0.6, halfD: 0.6 },    // same base
  statue:       { type: 'box', halfW: 0.75, halfD: 0.75 },   // base Box 1.5×1.5
  crate:        { type: 'box', halfW: 0.63, halfD: 0.63 },   // Box 1.2 + bands 1.25
  wall:         { type: 'box', halfW: 2.0, halfD: 0.4 },     // Box 4×0.8
  wall_stone:   { type: 'box', halfW: 0.35, halfD: 1.05 },   // Box 0.6×2.0 + bumps at ±0.35
  wall_brick:   { type: 'box', halfW: 0.3, halfD: 1.05 },    // Box 0.5×2.0 + bricks 0.52
  fence:        { type: 'box', halfW: 1.9, halfD: 0.15 },    // posts at ±1.8, rails thin
  fence_wood:   { type: 'box', halfW: 0.1, halfD: 1.0 },     // post + rails 2.0 along Z
  fence_iron:   { type: 'box', halfW: 0.1, halfD: 1.0 },     // bars 2.0 along Z
  hedge_row:    { type: 'box', halfW: 0.45, halfD: 1.05 },   // Box 0.8×2.0 + lumps
  log_fence:    { type: 'box', halfW: 0.15, halfD: 1.0 },    // posts at ±0.8, logs 2.0
  // No collision: shrub, ruins_brick (walkable debris)
}

function makeObstacle(
  shape: CollisionShape, worldX: number, worldZ: number,
  scale: number, rotY: number
): ObstacleData {
  if (shape.type === 'box') {
    return {
      x: worldX, z: worldZ,
      radius: Math.max(shape.halfW, shape.halfD) * scale, // bounding circle for broad-phase
      halfW: shape.halfW * scale,
      halfD: shape.halfD * scale,
      cosR: Math.cos(rotY),
      sinR: Math.sin(rotY),
    }
  }
  return { x: worldX, z: worldZ, radius: shape.radius * scale }
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
      const fCos = Math.cos(rotY)
      const fSin = Math.sin(rotY)
      for (const p of pieces) {
        const shape = MESH_COLLISION_SHAPES[p.type]
        if (!shape) continue // no collision for this mesh type (shrub, ruins_brick)
        const localX = p.offsetX * scale
        const localZ = p.offsetZ * scale
        const worldX = x + localX * fCos + localZ * fSin
        const worldZ = z - localX * fSin + localZ * fCos
        // Piece rotation in world = formation rotation + piece rotation
        const pieceRotY = rotY + p.rotationY
        obstacles.push(makeObstacle(shape, worldX, worldZ, p.scale * scale, pieceRotY))
      }
    } else {
      const meshObj = generateMeshObject(rule.type, meshSeed)
      meshObj.position.set(x, 0, z)
      meshObj.scale.set(scale, scale, scale)
      const meshRotY = rng.next() * Math.PI * 2
      meshObj.rotation.y = meshRotY

      // Apply random rotation for variety
      if (rule.type !== 'crystal' && rule.type !== 'pillar' && rule.type !== 'pillar_broken') {
        meshObj.rotation.x = (rng.next() - 0.5) * 0.2
        meshObj.rotation.z = (rng.next() - 0.5) * 0.2
      }

      envGroup.add(meshObj)

      // Track collision using actual mesh shape
      if (rule.hasCollision) {
        const shape = MESH_COLLISION_SHAPES[rule.type]
        if (shape) {
          obstacles.push(makeObstacle(shape, x, z, scale, meshRotY))
        } else {
          obstacles.push({ x, z, radius: meshRadius })
        }
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
