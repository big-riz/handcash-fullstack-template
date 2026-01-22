/**
 * SpawnSystem.ts
 * 
 * Handles periodic spawning of enemies in a ring around the player.
 */

import { EntityManager } from '../entities/EntityManager'
import { Player } from '../entities/Player'
import { EnemyType } from '../entities/Enemy'

import { SeededRandom } from '../../../lib/SeededRandom'

export class SpawnSystem {
    private spawnTimer = 0
    private elapsedSeconds = 0
    private spawnInterval = 1.25 // Base spawn interval (increased from 1.0 to reduce density)
    private spawnRadius = 22 // Increased spawn radius for off-screen
    private baseSpawnCount = 2

    constructor(
        private entityManager: EntityManager,
        private player: Player,
        private rng: SeededRandom
    ) { }

    update(deltaTime: number) {
        this.elapsedSeconds += deltaTime
        this.spawnTimer += deltaTime

        // Scaling: spawn interval decreases slightly over time
        const interval = Math.max(0.2, this.spawnInterval - (this.elapsedSeconds / 300))

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
        // Scaling: spawn count increases over time
        const count = Math.floor(this.baseSpawnCount + (this.elapsedSeconds / 60))

        for (let i = 0; i < count; i++) {
            const angle = this.rng.next() * Math.PI * 2
            const x = this.player.position.x + Math.cos(angle) * this.spawnRadius
            const z = this.player.position.z + Math.sin(angle) * this.spawnRadius

            // Decide type based on time
            let type: EnemyType = 'drifter'
            const roll = this.rng.next()

            if (this.elapsedSeconds >= 180 && roll < 0.1) type = 'kikimora'
            else if (this.elapsedSeconds >= 120 && roll < 0.15) type = 'zmora'
            else if (this.elapsedSeconds > 60 && roll < 0.2) type = 'bruiser'
            else if (this.elapsedSeconds > 30 && roll < 0.3) type = 'screecher'
            else if (roll < 0.25) type = 'domovoi'
            else type = 'drifter'

            // Elite chance: 1% base, increases over time up to 10%
            const eliteChance = Math.min(0.1, 0.01 + (this.elapsedSeconds / 1200))
            const isElite = this.rng.next() < eliteChance

            this.entityManager.spawnEnemy(type, x, z, isElite)
        }
    }
}
