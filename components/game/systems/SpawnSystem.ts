/**
 * SpawnSystem.ts
 * 
 * Handles periodic spawning of enemies in a ring around the player.
 */

import { EntityManager } from '../entities/EntityManager'
import { Player } from '../entities/Player'
import { EnemyType } from '../entities/Enemy'
import { WorldData } from '@/components/game/data/worlds'
import { SeededRandom } from '../../../lib/SeededRandom'

export class SpawnSystem {
    private spawnTimer = 0
    private lastBossSpawnTime = 0
    private elapsedSeconds = 0
    private progressionSeconds = 0
    public spawnInterval = 1.25 // Base spawn interval (increased from 1.0 to reduce density)
    public spawnRadius = 22 // Increased spawn radius for off-screen
    public baseSpawnCount = 2
    public spawnRateMultiplier = 1.0
    public progressionRateMultiplier = 1.0
    public eliteChanceMultiplier = 1.0

    private currentWorld: WorldData | null = null

    constructor(
        private entityManager: EntityManager,
        private player: Player,
        private rng: SeededRandom
    ) { }

    setWorld(world: WorldData) {
        this.currentWorld = world
        this.spawnRateMultiplier = world.id === 'frozen_waste' ? 0.5 : 1.0
        this.progressionRateMultiplier = world.id === 'frozen_waste' ? 0.5 : 1.0
    }

    update(deltaTime: number) {
        this.elapsedSeconds += deltaTime
        this.progressionSeconds += deltaTime * this.progressionRateMultiplier
        this.spawnTimer += deltaTime

        // Scaling: spawn interval decreases moderately over time and with Curse
        const currentCurse = this.player.stats.curse || 1.0

        // Check if boss (leshy) is alive to stop other spawns
        const isBossAlive = this.entityManager.enemies.some(e => e.isActive && e.type === 'leshy')
        if (isBossAlive) {
            this.spawnTimer = 0 // Keep timer reset so they don't all pop at once when boss dies
            return
        }

        const interval = Math.max(0.1, (this.spawnInterval - (this.progressionSeconds / 900)) / (this.spawnRateMultiplier * currentCurse))

        if (this.spawnTimer >= interval) {
            this.spawnTimer = 0
            this.spawnEnemyGroup(this.progressionSeconds)
        }

        // BOSS SPAWN - Every 5 minutes (300s)
        const bossInterval = 300
        if (this.progressionSeconds - this.lastBossSpawnTime >= bossInterval) {
            // Check if boss (leshy) is already alive to prevent stacking bosses
            if (!isBossAlive) {
                const angle = this.rng.next() * Math.PI * 2
                this.entityManager.spawnEnemy('leshy',
                    Math.cos(angle) * this.spawnRadius + this.player.position.x,
                    Math.sin(angle) * this.spawnRadius + this.player.position.z
                )
                this.lastBossSpawnTime = this.progressionSeconds
            } else {
                // If boss is still alive, delay the next check slightly without resetting time
                // so it pops as soon as the current one is dead if 5 mins have passed
            }
        }
    }

    private spawnEnemyGroup(progressionSeconds: number) {
        if (!this.currentWorld) return

        // Scaling: spawn count increases moderately over time
        const count = Math.floor(this.baseSpawnCount + (progressionSeconds / 120))

        // Level requirements for harder enemies - Staggered throughout early-to-mid game
        const levelRequirements: Record<string, number> = {
            'werewolf': 5,
            'forest_wraith': 10,
            'guardian_golem': 15
        }

        // Limit number of harder enemies per group based on player level
        // Start with 1 at level 5, and increase slowly (e.g., +1 every 5 levels)
        const playerLevel = this.player.stats.level || 1
        const maxHardInGroup = Math.max(1, Math.floor(playerLevel / 5))
        let hardSpawnedInGroup = 0

        for (let i = 0; i < count; i++) {
            const angle = this.rng.next() * Math.PI * 2
            const x = this.player.position.x + Math.cos(angle) * this.spawnRadius
            const z = this.player.position.z + Math.sin(angle) * this.spawnRadius

            // Decide type based on World Pool and level requirements
            const pool = this.currentWorld.availableEnemies

            // Separate available pool into common and hard (that meet level req)
            const commonEnemies = pool.filter(type => !levelRequirements[type]) as EnemyType[]
            const eligibleHard = pool.filter(type => {
                const req = levelRequirements[type]
                return req && playerLevel >= req
            }) as EnemyType[]

            let type: EnemyType

            // Decide if we spawn a hard enemy:
            // 1. Must have eligible hard enemies
            // 2. Must be under the group limit
            // 3. 40% chance for a slot to be hard if allowed (to keep variety)
            const canSpawnHard = eligibleHard.length > 0 && hardSpawnedInGroup < maxHardInGroup

            if (canSpawnHard && this.rng.next() < 0.4) {
                const typeIndex = Math.floor(this.rng.next() * eligibleHard.length)
                type = eligibleHard[typeIndex]
                hardSpawnedInGroup++
            } else if (commonEnemies.length > 0) {
                const typeIndex = Math.floor(this.rng.next() * commonEnemies.length)
                type = commonEnemies[typeIndex]
            } else {
                // Fallback to anything in the pool if common is empty (unlikely)
                const typeIndex = Math.floor(this.rng.next() * pool.length)
                type = pool[typeIndex] as EnemyType
            }

            // Elite chance: 1% base, increases moderately over time up to 10%
            const eliteChance = Math.min(0.1, (0.01 + (progressionSeconds / 2400)) * this.eliteChanceMultiplier)
            const isElite = this.rng.next() < eliteChance

            this.entityManager.spawnEnemy(type, x, z, isElite)
        }
    }
}
