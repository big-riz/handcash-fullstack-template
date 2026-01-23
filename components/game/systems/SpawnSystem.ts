/**
 * SpawnSystem.ts
 * 
 * Handles periodic spawning of enemies in a ring around the player.
 */

import { EntityManager } from '../entities/EntityManager'
import { Player } from '../entities/Player'
import { EnemyType } from '../entities/Enemy'
import { WorldData } from '../data/worlds'
import { SeededRandom } from '../../../lib/SeededRandom'

export class SpawnSystem {
    private spawnTimer = 0
    private elapsedSeconds = 0
    public spawnInterval = 1.25 // Base spawn interval (increased from 1.0 to reduce density)
    public spawnRadius = 22 // Increased spawn radius for off-screen
    public baseSpawnCount = 2
    public spawnRateMultiplier = 1.0
    public eliteChanceMultiplier = 1.0

    private currentWorld: WorldData | null = null

    constructor(
        private entityManager: EntityManager,
        private player: Player,
        private rng: SeededRandom
    ) { }

    setWorld(world: WorldData) {
        this.currentWorld = world
    }

    update(deltaTime: number) {
        this.elapsedSeconds += deltaTime
        this.spawnTimer += deltaTime

        // Scaling: spawn interval decreases over time and with Curse
        const currentCurse = this.player.stats.curse || 1.0
        const interval = Math.max(0.1, (this.spawnInterval - (this.elapsedSeconds / 300)) / (this.spawnRateMultiplier * currentCurse))

        if (this.spawnTimer >= interval) {
            this.spawnTimer = 0
            this.spawnEnemyGroup()
        }

        // BOSS SPAWN at 5 minutes (300s)
        const bossCheckTrigger = 300
        if (this.elapsedSeconds >= bossCheckTrigger && this.elapsedSeconds < bossCheckTrigger + 0.1) {
            const angle = this.rng.next() * Math.PI * 2
            this.entityManager.spawnEnemy('leshy',
                Math.cos(angle) * this.spawnRadius + this.player.position.x,
                Math.sin(angle) * this.spawnRadius + this.player.position.z
            )
            // Push it past the trigger window
            this.elapsedSeconds += 0.2
        }
    }

    private spawnEnemyGroup() {
        if (!this.currentWorld) return

        // Scaling: spawn count increases over time
        const count = Math.floor(this.baseSpawnCount + (this.elapsedSeconds / 60))

        for (let i = 0; i < count; i++) {
            const angle = this.rng.next() * Math.PI * 2
            const x = this.player.position.x + Math.cos(angle) * this.spawnRadius
            const z = this.player.position.z + Math.sin(angle) * this.spawnRadius

            // Decide type based on World Pool
            const pool = this.currentWorld.availableEnemies
            const typeIndex = Math.floor(this.rng.next() * pool.length)
            const type = pool[typeIndex] as EnemyType

            // Elite chance: 1% base, increases over time up to 10%
            const eliteChance = Math.min(0.1, (0.01 + (this.elapsedSeconds / 1200)) * this.eliteChanceMultiplier)
            const isElite = this.rng.next() < eliteChance

            this.entityManager.spawnEnemy(type, x, z, isElite)
        }
    }
}
