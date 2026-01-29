/**
 * EnemyCombinationSystem.ts
 *
 * Monitors enemy positions and merges 10 nearby same-type enemies
 * into a single "super enemy" with combined HP and 5x XP.
 *
 * Uses centroid-based clustering:
 * 1. Group enemies by type
 * 2. Find clusters of 10+ enemies within proximity radius
 * 3. Despawn all 10 and spawn super enemy at centroid
 */

import { EntityManager } from '../entities/EntityManager'
import { Enemy, EnemyType, BOSS_TYPES } from '../entities/Enemy'
import { VFXManager } from './VFXManager'

export class EnemyCombinationSystem {
    private checkTimer: number = 0
    private checkInterval: number = 0.5 // Check every 0.5 seconds

    private config = {
        minEnemiesForCombine: 10,
        clusterRadius: 3.0, // Units - enemies must be within this distance
        excludeBosses: true,
        excludeElites: true
    }

    private entityManager: EntityManager
    private vfx: VFXManager | null

    constructor(entityManager: EntityManager, vfx: VFXManager | null = null) {
        this.entityManager = entityManager
        this.vfx = vfx
    }

    update(deltaTime: number): void {
        this.checkTimer += deltaTime
        if (this.checkTimer < this.checkInterval) return
        this.checkTimer = 0

        this.findAndCombineEnemies()
    }

    private findAndCombineEnemies(): void {
        // Group active enemies by type
        const enemiesByType = new Map<EnemyType, Enemy[]>()

        for (const enemy of this.entityManager.enemies) {
            if (!enemy.isActive) continue
            if (this.config.excludeBosses && enemy.isBoss) continue
            if (this.config.excludeElites && enemy.isElite) continue
            if (enemy.isSuperEnemy) continue // Don't combine super enemies

            const list = enemiesByType.get(enemy.type) || []
            list.push(enemy)
            enemiesByType.set(enemy.type, list)
        }

        // Check each type for potential clusters
        for (const [type, enemies] of enemiesByType) {
            if (enemies.length < this.config.minEnemiesForCombine) continue

            const cluster = this.findCluster(enemies)
            if (cluster) {
                this.combineEnemies(cluster, type)
            }
        }
    }

    private findCluster(enemies: Enemy[]): Enemy[] | null {
        const radius = this.config.clusterRadius
        const minCount = this.config.minEnemiesForCombine

        // Try each enemy as a potential cluster center
        for (const center of enemies) {
            const nearby: Enemy[] = [center]

            for (const other of enemies) {
                if (other === center) continue

                const dx = other.position.x - center.position.x
                const dz = other.position.z - center.position.z
                const dist = Math.sqrt(dx * dx + dz * dz)

                if (dist <= radius) {
                    nearby.push(other)
                }
            }

            if (nearby.length >= minCount) {
                // Verify all enemies are within radius of centroid
                const centroid = this.calculateCentroid(nearby.slice(0, minCount))
                const validCluster: Enemy[] = []

                for (const enemy of nearby) {
                    const dx = enemy.position.x - centroid.x
                    const dz = enemy.position.z - centroid.z
                    const dist = Math.sqrt(dx * dx + dz * dz)

                    if (dist <= radius) {
                        validCluster.push(enemy)
                        if (validCluster.length >= minCount) break
                    }
                }

                if (validCluster.length >= minCount) {
                    return validCluster.slice(0, minCount)
                }
            }
        }

        return null
    }

    private calculateCentroid(enemies: Enemy[]): { x: number, z: number } {
        let sumX = 0
        let sumZ = 0

        for (const enemy of enemies) {
            sumX += enemy.position.x
            sumZ += enemy.position.z
        }

        return {
            x: sumX / enemies.length,
            z: sumZ / enemies.length
        }
    }

    private combineEnemies(enemies: Enemy[], type: EnemyType): void {
        // Calculate combined HP and centroid
        let combinedHp = 0
        for (const enemy of enemies) {
            combinedHp += enemy.stats.currentHp
        }

        const centroid = this.calculateCentroid(enemies)

        // Despawn all enemies in cluster (skip XP drop - they're merging, not dying)
        for (const enemy of enemies) {
            enemy.die(true)
        }

        // Spawn super enemy at centroid
        const superEnemy = this.entityManager.spawnEnemy(
            type,
            centroid.x,
            centroid.z,
            false, // isElite
            1.0, // difficultyMultiplier
            true, // isSuperEnemy
            combinedHp // combined HP from all merged enemies
        )

        // Visual effect for combination
        if (this.vfx) {
            this.vfx.createEmoji(centroid.x, centroid.z, '💫', 2.0)
            this.vfx.createDamageNumber(centroid.x, centroid.z, enemies.length, '#FFD700', 2.0)
        }

        console.log(`[EnemyCombinationSystem] Combined ${enemies.length} ${type} into super enemy with ${combinedHp.toFixed(0)} HP`)
    }

    cleanup(): void {
        this.checkTimer = 0
    }
}
