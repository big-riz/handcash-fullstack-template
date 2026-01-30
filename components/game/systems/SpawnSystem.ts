import { EntityManager } from '../entities/EntityManager'
import { Player } from '../entities/Player'
import { EnemyType } from '../entities/Enemy'
import { WorldData } from '@/components/game/data/worlds'
import { SeededRandom } from '../../../lib/SeededRandom'
import { darkForestTimeline, TimelineEvent } from '../data/dark_forest_timeline'
import { frozenWasteTimeline } from '../data/frozen_waste_timeline'
import { catacombsTimeline } from '../data/catacombs_timeline'
import { getVoicelinesForWorld, TimelineVoiceline } from '../data/timeline_voicelines'

export class SpawnSystem {
    private elapsedSeconds = 0
    private timelineIndex = 0
    private backgroundSpawnTimer = 0
    private baseSpawnInterval = 10.0 // Base interval between spawns (2x slower = half as frequent)
    private minSpawnInterval = 1.6 // Minimum interval (2x slower = half as frequent)

    private currentWorld: WorldData | null = null
    private currentTimeline: TimelineEvent[] = darkForestTimeline

    // Dynamic difficulty
    private difficultyMultiplier = 1.0
    private difficultyCheckInterval = 120 // Check every 2 minutes
    private timeSinceLastCheck = 0

    // Deterministic spawn counters
    private spawnCounter = 0
    private patternIndex = 0

    // Minimum center-to-center distance between spawned enemies in a shape.
    // Player diameter=1.0, typical enemy diameter~1.0, plus 0.5 margin = 2.5
    private static readonly MIN_SPAWN_GAP = 2.5

    // Wave notification callback
    private onWaveMessage: ((message: string) => void) | null = null

    // Voiceline tracking
    private currentVoicelines: TimelineVoiceline[] = []
    private nextVoicelineIndex = 0
    private onPlayVoiceline: ((filename: string, text: string) => void) | null = null

    constructor(
        private entityManager: EntityManager,
        private player: Player,
        private rng: SeededRandom
    ) { }

    setWaveMessageCallback(callback: (message: string) => void) {
        this.onWaveMessage = callback
    }

    setVoicelineCallback(callback: (filename: string, text: string) => void) {
        this.onPlayVoiceline = callback
    }

    setWorld(world: WorldData) {
        this.currentWorld = world

        // Load timeline for this world
        if ((world as any).timeline && Array.isArray((world as any).timeline)) {
            // Custom level with custom timeline
            this.currentTimeline = (world as any).timeline
            console.log(`[SpawnSystem] "${world.name}": Custom timeline (${this.currentTimeline.length} events), Background spawning: ${world.disableBackgroundSpawning ? 'OFF' : 'ON'}`)
        } else if (world.id === 'frozen_waste') {
            this.currentTimeline = frozenWasteTimeline
            console.log(`[SpawnSystem] "${world.name}": Using frozen waste timeline`)
        } else if (world.id === 'catacombs') {
            this.currentTimeline = catacombsTimeline
            console.log(`[SpawnSystem] "${world.name}": Using catacombs timeline`)
        } else {
            // Default to dark forest timeline
            this.currentTimeline = darkForestTimeline
            console.log(`[SpawnSystem] "${world.name}": Using dark forest timeline`)
        }

        // Reset state for the new world
        this.elapsedSeconds = 0
        this.timelineIndex = 0
        this.backgroundSpawnTimer = 0
        this.difficultyMultiplier = 1.0
        this.timeSinceLastCheck = 0
        this.spawnCounter = 0
        this.patternIndex = 0

        // Load voicelines for this world
        this.currentVoicelines = getVoicelinesForWorld(world.id)
        this.nextVoicelineIndex = 0
        console.log(`[SpawnSystem] Loaded ${this.currentVoicelines.length} voicelines for ${world.id}`)
    }

    // Public getter for difficulty
    getDifficultyMultiplier(): number {
        return this.difficultyMultiplier
    }

    // Get upcoming wave events (next N waves)
    getUpcomingWaves(count: number = 3): TimelineEvent[] {
        const upcoming: TimelineEvent[] = []
        for (let i = this.timelineIndex; i < this.currentTimeline.length && upcoming.length < count; i++) {
            upcoming.push(this.currentTimeline[i])
        }
        return upcoming
    }

    // Get current elapsed time
    getElapsedTime(): number {
        return this.elapsedSeconds
    }

    // Called from game engine with performance metrics
    updateDifficulty(playerDPS: number, timeSurvived: number, damageTaken: number) {
        // Dynamic difficulty disabled - difficulty stays at 1.0x (100%)
        return
    }

    update(deltaTime: number) {
        if (!this.currentWorld) return

        // Freeze spawn clock while a boss is alive
        if (!this.entityManager.hasActiveBoss()) {
            this.elapsedSeconds += deltaTime
        }

        // --- Voiceline playback (based on time defined in voiceline data) ---
        while (
            this.nextVoicelineIndex < this.currentVoicelines.length &&
            this.elapsedSeconds >= this.currentVoicelines[this.nextVoicelineIndex].time
        ) {
            const voiceline = this.currentVoicelines[this.nextVoicelineIndex]
            if (this.onPlayVoiceline) {
                this.onPlayVoiceline(voiceline.file, voiceline.text)
            }
            this.nextVoicelineIndex++
        }

        // --- Timeline-based Spawning ---
        while (this.timelineIndex < this.currentTimeline.length && this.elapsedSeconds >= this.currentTimeline[this.timelineIndex].time) {
            const event = this.currentTimeline[this.timelineIndex]
            this.executeTimelineEvent(event)
            this.timelineIndex++
        }

        // --- Background Spawning ---
        // Skip background spawning if disabled for this world
        if (this.currentWorld.disableBackgroundSpawning) {
            return // Only timeline events will spawn enemies
        }

        // Spawn enemies periodically with exponential scaling
        this.backgroundSpawnTimer += deltaTime

        const minutesElapsed = this.elapsedSeconds / 60
        const timelineExhausted = this.timelineIndex >= this.currentTimeline.length

        // Calculate dynamic spawn interval (decreases over time, exponentially)
        // After timeline ends, interval drops 4x faster
        let intervalScale = Math.max(0.16, Math.pow(0.85, minutesElapsed))
        let minInterval = this.minSpawnInterval
        if (timelineExhausted) {
            intervalScale *= 0.25
            minInterval = 0.4
        }
        const currentInterval = Math.max(minInterval, this.baseSpawnInterval * intervalScale)

        if (this.backgroundSpawnTimer >= currentInterval) {
            this.backgroundSpawnTimer = 0
            this.spawnCounter++

            // Exponential count scaling: starts at 3, grows exponentially
            // After timeline ends, 2x count escalation
            const baseCount = timelineExhausted ? 6 : 3
            const growthRate = 0.25
            const timeBasedCount = baseCount * Math.pow(1 + growthRate, minutesElapsed)

            // Add bonus enemies based on elapsed time in larger chunks
            const chunkBonus = Math.floor(minutesElapsed / 3) * (timelineExhausted ? 10 : 5)

            const count = Math.floor(timeBasedCount + chunkBonus)

            // Deterministic elite spawning: more frequent after timeline
            const eliteThreshold = timelineExhausted ? 3 : 5
            const shouldSpawnElite = minutesElapsed > 5 && (this.spawnCounter % eliteThreshold === 0)

            // Deterministic enemy type selection - harder enemies after timeline
            let enemyType: EnemyType = 'drifter'
            if (timelineExhausted) {
                // Post-timeline: cycle through harder enemy types
                const typeIndex = this.spawnCounter % 5
                if (typeIndex === 0) enemyType = 'bruiser'
                else if (typeIndex === 1) enemyType = 'stone_golem'
                else if (typeIndex === 2) enemyType = 'spirit_wolf'
                else if (typeIndex === 3) enemyType = 'screecher'
                else enemyType = 'shadow_stalker'
            } else if (minutesElapsed > 15) {
                // Late game: cycle through enemy types deterministically
                const typeIndex = this.spawnCounter % 3
                if (typeIndex === 0) enemyType = 'bruiser'
                else if (typeIndex === 1) enemyType = 'screecher'
                else enemyType = 'drifter'
            } else if (minutesElapsed > 8) {
                // Mid game: alternate between types
                const typeIndex = this.spawnCounter % 5
                if (typeIndex === 0) enemyType = 'bruiser'
                else if (typeIndex === 1) enemyType = 'screecher'
                else enemyType = 'drifter'
            }

            // Spawn closer (16 units) to maintain pressure
            this.spawnGroup(enemyType, count, 16, shouldSpawnElite)

            // Log for debugging high-level spawn rates
            if (minutesElapsed > 10) {
                console.log(`[SPAWN] ${timelineExhausted ? 'POST-TIMELINE ' : ''}${Math.floor(minutesElapsed)}m: ${count} ${enemyType} every ${currentInterval.toFixed(2)}s (Elite: ${shouldSpawnElite})`)
            }
        }
    }

    private executeTimelineEvent(event: TimelineEvent) {
        console.log(`[SPAWN] Event @ ${this.elapsedSeconds.toFixed(1)}s: Spawning ${event.count} of ${event.enemyType}`)
        if (event.message) {
            console.log(`[SPAWN] Message: ${event.message}`)
            // Trigger UI notification
            if (this.onWaveMessage) {
                this.onWaveMessage(event.message)
            }
        }
        // Spawn closer to player (16 units) to increase pressure
        this.spawnGroup(event.enemyType as EnemyType, event.count, 16, event.isElite)
    }

    private spawnGroup(type: EnemyType, count: number, radius: number, isElite: boolean = false) {
        // Deterministic pattern selection: cycle through patterns
        const pattern = this.patternIndex % 6
        this.patternIndex++

        // Deterministic angle based on pattern index (rotates 60 degrees each spawn)
        const baseAngle = (this.patternIndex * Math.PI / 3) % (Math.PI * 2)
        const px = this.player.position.x
        const pz = this.player.position.z

        switch (pattern) {
            case 0:
                // Evenly spaced ring with gaps
                this.spawnEvenRing(type, count, radius, baseAngle, isElite, px, pz)
                break
            case 1:
                // Dual opposing arcs (like parentheses) - symmetric on 1 axis
                this.spawnDualArcs(type, count, radius, baseAngle, isElite, px, pz)
                break
            case 2:
                // Cross/plus pattern - symmetric on 2 axes
                this.spawnCrossPattern(type, count, radius, baseAngle, isElite, px, pz)
                break
            case 3:
                // Triangle formation - symmetric on 1 axis
                this.spawnTriangle(type, count, radius, baseAngle, isElite, px, pz)
                break
            case 4:
                // Diamond/rhombus pattern - symmetric on 2 axes
                this.spawnDiamond(type, count, radius, baseAngle, isElite, px, pz)
                break
            default:
                // Spiral arms (like a galaxy) - rotationally symmetric
                this.spawnSpiralArms(type, count, radius, baseAngle, isElite, px, pz)
                break
        }
    }

    private spawnEvenRing(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const minAngleStep = SpawnSystem.MIN_SPAWN_GAP / radius
        const maxCount = Math.max(1, Math.floor((Math.PI * 2) / minAngleStep))
        const effectiveCount = Math.min(count, maxCount)
        const angleStep = (Math.PI * 2) / effectiveCount
        for (let i = 0; i < effectiveCount; i++) {
            const angle = baseAngle + i * angleStep
            const x = px + Math.cos(angle) * radius
            const z = pz + Math.sin(angle) * radius
            this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
        }
    }

    private spawnDualArcs(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const arcSpan = Math.PI * 0.7
        const minAngleStep = SpawnSystem.MIN_SPAWN_GAP / radius
        const maxPerArc = Math.max(1, Math.floor(arcSpan / minAngleStep) + 1)
        const perArc = Math.min(Math.ceil(count / 2), maxPerArc)

        for (let arc = 0; arc < 2; arc++) {
            const arcCenter = baseAngle + arc * Math.PI
            const startAngle = arcCenter - arcSpan / 2
            const angleStep = arcSpan / Math.max(1, perArc - 1)

            for (let i = 0; i < perArc && (arc * perArc + i) < count; i++) {
                const angle = startAngle + i * angleStep
                const x = px + Math.cos(angle) * radius
                const z = pz + Math.sin(angle) * radius
                this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
            }
        }
    }

    private spawnCrossPattern(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const angleMul = 0.2
        const radiusMul = 0.5
        const minSpread = SpawnSystem.MIN_SPAWN_GAP / Math.sqrt((angleMul * radius) ** 2 + radiusMul ** 2)
        const clusterSpread = Math.max(0.3, minSpread)

        const clusterSep = Math.PI / 2
        const maxAngularSpan = clusterSep - SpawnSystem.MIN_SPAWN_GAP / radius
        const maxPerCluster = Math.max(1, Math.floor(maxAngularSpan / (clusterSpread * angleMul)) + 1)
        const perCluster = Math.min(Math.ceil(count / 4), maxPerCluster)

        for (let cluster = 0; cluster < 4; cluster++) {
            const clusterAngle = baseAngle + cluster * clusterSep

            for (let i = 0; i < perCluster && (cluster * perCluster + i) < count; i++) {
                const offset = (i - (perCluster - 1) / 2) * clusterSpread
                const angle = clusterAngle + offset * angleMul
                const r = radius + offset * radiusMul
                const x = px + Math.cos(angle) * r
                const z = pz + Math.sin(angle) * r
                this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
            }
        }
    }

    private spawnTriangle(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const angleMul = 0.15
        const radiusMul = 0.3
        const minSpread = SpawnSystem.MIN_SPAWN_GAP / Math.sqrt((angleMul * radius) ** 2 + radiusMul ** 2)
        const clusterSpread = Math.max(0.4, minSpread)

        const vertexSep = Math.PI * 2 / 3
        const maxAngularSpan = vertexSep - SpawnSystem.MIN_SPAWN_GAP / radius
        const maxPerVertex = Math.max(1, Math.floor(maxAngularSpan / (clusterSpread * angleMul)) + 1)
        const perVertex = Math.min(Math.ceil(count / 3), maxPerVertex)

        for (let vertex = 0; vertex < 3; vertex++) {
            const vertexAngle = baseAngle + vertex * vertexSep

            for (let i = 0; i < perVertex && (vertex * perVertex + i) < count; i++) {
                const offset = (i - (perVertex - 1) / 2) * clusterSpread
                const angle = vertexAngle + offset * angleMul
                const r = radius + Math.abs(offset) * radiusMul
                const x = px + Math.cos(angle) * r
                const z = pz + Math.sin(angle) * r
                this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
            }
        }
    }

    private spawnDiamond(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const sideAngle = Math.PI / 2
        const minAngleStep = SpawnSystem.MIN_SPAWN_GAP / (radius * 0.85)
        const maxPerSide = Math.max(1, Math.floor(sideAngle / minAngleStep))
        const perSide = Math.min(Math.ceil(count / 4), maxPerSide)

        for (let side = 0; side < 4; side++) {
            const startAngle = baseAngle + side * sideAngle
            const endAngle = baseAngle + (side + 1) * sideAngle

            for (let i = 0; i < perSide && (side * perSide + i) < count; i++) {
                const t = i / Math.max(1, perSide)
                const angle = startAngle + t * (endAngle - startAngle)
                const midT = Math.abs(t - 0.5) * 2
                const r = radius * (0.85 + 0.15 * midT)
                const x = px + Math.cos(angle) * r
                const z = pz + Math.sin(angle) * r
                this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
            }
        }
    }

    private spawnSpiralArms(type: EnemyType, count: number, radius: number, baseAngle: number, isElite: boolean, px: number, pz: number) {
        const arms = 2
        const spiralTurns = 0.4
        const avgRadius = radius * 0.95
        const totalAngle = spiralTurns * Math.PI
        const radialSpan = radius * 0.5
        const armLength = Math.sqrt((totalAngle * avgRadius) ** 2 + radialSpan ** 2)
        const maxPerArm = Math.max(1, Math.floor(armLength / SpawnSystem.MIN_SPAWN_GAP) + 1)
        const perArm = Math.min(Math.ceil(count / arms), maxPerArm)

        for (let arm = 0; arm < arms; arm++) {
            const armBaseAngle = baseAngle + arm * Math.PI

            for (let i = 0; i < perArm && (arm * perArm + i) < count; i++) {
                const t = perArm > 1 ? i / (perArm - 1) : 0
                const angle = armBaseAngle + t * spiralTurns * Math.PI
                const r = radius * (0.7 + t * 0.5)
                const x = px + Math.cos(angle) * r
                const z = pz + Math.sin(angle) * r
                this.entityManager.spawnEnemy(type, x, z, isElite, this.difficultyMultiplier)
            }
        }
    }
}
