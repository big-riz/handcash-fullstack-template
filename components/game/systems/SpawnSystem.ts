import { EntityManager } from '../entities/EntityManager'
import { Player } from '../entities/Player'
import { EnemyType } from '../entities/Enemy'
import { WorldData } from '@/components/game/data/worlds'
import { SeededRandom } from '../../../lib/SeededRandom'
import { darkForestTimeline, TimelineEvent } from '../data/dark_forest_timeline'

export class SpawnSystem {
    private elapsedSeconds = 0
    private timelineIndex = 0
    private backgroundSpawnTimer = 0
    private baseSpawnInterval = 5.0 // Base interval between spawns
    private minSpawnInterval = 0.8 // Minimum interval (caps at very high levels)

    private currentWorld: WorldData | null = null

    // Dynamic difficulty
    private difficultyMultiplier = 1.0
    private difficultyCheckInterval = 120 // Check every 2 minutes
    private timeSinceLastCheck = 0

    constructor(
        private entityManager: EntityManager,
        private player: Player,
        private rng: SeededRandom
    ) { }

    setWorld(world: WorldData) {
        this.currentWorld = world
        // Reset state for the new world
        this.elapsedSeconds = 0
        this.timelineIndex = 0
        this.backgroundSpawnTimer = 0
        this.difficultyMultiplier = 1.0
        this.timeSinceLastCheck = 0
    }

    // Public getter for difficulty
    getDifficultyMultiplier(): number {
        return this.difficultyMultiplier
    }

    // Called from game engine with performance metrics
    updateDifficulty(playerDPS: number, timeSurvived: number, damageTaken: number) {
        // Dynamic difficulty disabled - difficulty stays at 1.0x (100%)
        return
    }

    update(deltaTime: number) {
        if (!this.currentWorld) return

        this.elapsedSeconds += deltaTime

        // --- Timeline-based Spawning ---
        while (this.timelineIndex < darkForestTimeline.length && this.elapsedSeconds >= darkForestTimeline[this.timelineIndex].time) {
            const event = darkForestTimeline[this.timelineIndex]
            this.executeTimelineEvent(event)
            this.timelineIndex++
        }

        // --- Background Spawning ---
        // Spawn enemies periodically with exponential scaling
        this.backgroundSpawnTimer += deltaTime

        // Calculate dynamic spawn interval (decreases over time, exponentially)
        // Starts at 5s, decreases to 0.8s minimum
        const minutesElapsed = this.elapsedSeconds / 60
        const intervalScale = Math.max(0.16, Math.pow(0.85, minutesElapsed)) // 0.85^minutes, min 0.16
        const currentInterval = Math.max(this.minSpawnInterval, this.baseSpawnInterval * intervalScale)

        if (this.backgroundSpawnTimer >= currentInterval) {
            this.backgroundSpawnTimer = 0

            // Exponential count scaling: starts at 3, grows exponentially
            // Formula: base * (1 + growthRate)^minutes
            const baseCount = 3
            const growthRate = 0.25 // 25% more enemies per minute
            const timeBasedCount = baseCount * Math.pow(1 + growthRate, minutesElapsed)

            // Add bonus enemies based on elapsed time in larger chunks
            const chunkBonus = Math.floor(minutesElapsed / 3) * 5 // +5 every 3 minutes

            const count = Math.floor(timeBasedCount + chunkBonus)

            // After 5 minutes, occasionally spawn elites in background waves
            const shouldSpawnElite = minutesElapsed > 5 && this.rng.next() < Math.min(0.4, minutesElapsed / 30)

            // Select enemy type based on progression
            let enemyType: EnemyType = 'drifter'
            if (minutesElapsed > 15) {
                // Late game: spawn tougher enemies more often
                const roll = this.rng.next()
                if (roll < 0.3) enemyType = 'hulk'
                else if (roll < 0.6) enemyType = 'specter'
                else enemyType = 'drifter'
            } else if (minutesElapsed > 8) {
                // Mid game: mix in some variety
                const roll = this.rng.next()
                if (roll < 0.2) enemyType = 'hulk'
                else if (roll < 0.4) enemyType = 'specter'
                else enemyType = 'drifter'
            }

            // Spawn closer (16 units) to maintain pressure
            this.spawnGroup(enemyType, count, 16, shouldSpawnElite)

            // Log for debugging high-level spawn rates
            if (minutesElapsed > 10) {
                console.log(`[SPAWN] Level ${Math.floor(minutesElapsed)}: ${count} enemies every ${currentInterval.toFixed(2)}s (Elite: ${shouldSpawnElite})`)
            }
        }
    }

    private executeTimelineEvent(event: TimelineEvent) {
        console.log(`[SPAWN] Event @ ${this.elapsedSeconds.toFixed(1)}s: Spawning ${event.count} of ${event.enemyType}`)
        if (event.message) {
            // In a real game, you'd show this on the UI. For simulation, we log it.
            console.log(`[SPAWN] Message: ${event.message}`)
        }
        // Spawn closer to player (16 units) to increase pressure
        this.spawnGroup(event.enemyType as EnemyType, event.count, 16, event.isElite)
    }

    private spawnGroup(type: EnemyType, count: number, radius: number, isElite: boolean = false) {
        for (let i = 0; i < count; i++) {
            const angle = this.rng.next() * Math.PI * 2
            const x = this.player.position.x + Math.cos(angle) * radius
            const z = this.player.position.z + Math.sin(angle) * radius
            this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
        }
    }
}
