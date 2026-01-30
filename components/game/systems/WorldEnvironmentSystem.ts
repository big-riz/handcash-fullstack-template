import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'
import { SeededRandom } from '@/lib/SeededRandom'
import { HazardType } from '../entities/HazardZone'

export interface WorldEnvironmentConfig {
    worldId: string
    effects: EnvironmentEffect[]
}

interface EnvironmentEffect {
    id: string
    cooldown: number
    currentCooldown: number
    execute: (ctx: EnvironmentContext) => void
    // Continuous effects run every frame (return true to apply)
    continuous?: (ctx: EnvironmentContext, deltaTime: number) => void
}

interface EnvironmentContext {
    player: Player
    entityManager: EntityManager
    vfxManager: VFXManager
    rng: SeededRandom
    elapsedTime: number
}

// Dark Forest: falling branches, poison mushroom areas, fog ambushes
function createDarkForestEffects(): EnvironmentEffect[] {
    return [
        {
            id: 'falling_branches',
            cooldown: 15.0,
            currentCooldown: 10.0,
            execute: (ctx) => {
                // Random falling branches near player that create temporary damage zones
                const count = 2 + Math.floor(ctx.rng.next() * 3)
                for (let i = 0; i < count; i++) {
                    const angle = ctx.rng.next() * Math.PI * 2
                    const dist = 3 + ctx.rng.next() * 8
                    const x = ctx.player.position.x + Math.cos(angle) * dist
                    const z = ctx.player.position.z + Math.sin(angle) * dist
                    ctx.entityManager.spawnHazardZone(x, z, 'poison' as HazardType, 1.5, 3.0, 8)
                    ctx.vfxManager.createEmoji(x, z, '🌿', 1.5)
                }
            }
        },
        {
            id: 'poison_mushrooms',
            cooldown: 25.0,
            currentCooldown: 20.0,
            execute: (ctx) => {
                // Spawn cluster of poison mushroom zones ahead of player
                const vx = ctx.player.velocity.x
                const vz = ctx.player.velocity.z
                const speed = Math.sqrt(vx * vx + vz * vz)
                let nx = 0, nz = 1
                if (speed > 0.5) {
                    nx = vx / speed
                    nz = vz / speed
                }
                for (let i = 0; i < 4; i++) {
                    const offset = (i - 1.5) * 2.5
                    const perpX = -nz * offset
                    const perpZ = nx * offset
                    const dist = 6 + ctx.rng.next() * 4
                    const x = ctx.player.position.x + nx * dist + perpX
                    const z = ctx.player.position.z + nz * dist + perpZ
                    ctx.entityManager.spawnHazardZone(x, z, 'poison' as HazardType, 2.0, 10.0, 5)
                }
            }
        }
    ]
}

// Frozen Waste: blizzard events, ice sliding, frostbite
function createFrozenWasteEffects(): EnvironmentEffect[] {
    let blizzardActive = false
    let blizzardTimer = 0
    let frostbiteTimer = 0
    let playerStationaryTime = 0
    let lastPlayerX = 0
    let lastPlayerZ = 0

    return [
        {
            id: 'blizzard_event',
            cooldown: 60.0,
            currentCooldown: 45.0,
            execute: (ctx) => {
                // Activate blizzard: slow player, spawn enemies faster for duration
                blizzardActive = true
                blizzardTimer = 12.0 // 12 second blizzard
                // Slow player during blizzard
                ctx.player.isSlowed = true
                ctx.player.slowFactor = 0.84
                ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '❄️', 3.0)
            },
            continuous: (ctx, deltaTime) => {
                if (blizzardActive) {
                    blizzardTimer -= deltaTime
                    if (blizzardTimer <= 0) {
                        blizzardActive = false
                        // Don't reset slow here - let hazard zone system handle it
                    } else {
                        // Spawn extra enemies during blizzard
                        if (Math.floor(blizzardTimer * 2) % 2 === 0) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const dist = 12 + ctx.rng.next() * 6
                            const types = ['frost_elemental', 'blizzard_wolf', 'frost_bat']
                            const type = types[Math.floor(ctx.rng.next() * types.length)]
                            ctx.entityManager.spawnEnemy(type as any,
                                ctx.player.position.x + Math.cos(angle) * dist,
                                ctx.player.position.z + Math.sin(angle) * dist
                            )
                        }
                        // Keep player slowed during blizzard
                        ctx.player.isSlowed = true
                        ctx.player.slowFactor = 0.84
                    }
                }
            }
        },
        {
            id: 'ice_patches',
            cooldown: 12.0,
            currentCooldown: 8.0,
            execute: (ctx) => {
                // Create slow patches around player path
                for (let i = 0; i < 3; i++) {
                    const angle = ctx.rng.next() * Math.PI * 2
                    const dist = 4 + ctx.rng.next() * 6
                    ctx.entityManager.spawnHazardZone(
                        ctx.player.position.x + Math.cos(angle) * dist,
                        ctx.player.position.z + Math.sin(angle) * dist,
                        'slow' as HazardType, 3.0, 12.0, 0
                    )
                }
            }
        },
        {
            id: 'frostbite',
            cooldown: 1.0, // Check every second
            currentCooldown: 5.0,
            execute: (ctx) => {
                // Frostbite: if player stays stationary too long, apply freeze damage
                const dx = ctx.player.position.x - lastPlayerX
                const dz = ctx.player.position.z - lastPlayerZ
                const moved = Math.sqrt(dx * dx + dz * dz)

                if (moved < 0.5) {
                    playerStationaryTime += 1.0
                } else {
                    playerStationaryTime = Math.max(0, playerStationaryTime - 0.5)
                }

                lastPlayerX = ctx.player.position.x
                lastPlayerZ = ctx.player.position.z

                // After 3 seconds stationary, start taking frostbite damage
                if (playerStationaryTime > 3.0) {
                    const frostDamage = 3
                    ctx.player.takeDamage(frostDamage)
                    ctx.vfxManager.createDamageNumber(ctx.player.position.x, ctx.player.position.z, frostDamage, '#00ccff', 1.0)
                    ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '🥶', 0.8)
                }
            }
        }
    ]
}

// Catacombs: narrow corridors (obstacles), torch vision, sarcophagi bursts
function createCatacombsEffects(): EnvironmentEffect[] {
    let torchVisionRadius = 1.0 // Full vision
    let fireKillCount = 0

    return [
        {
            id: 'sarcophagus_burst',
            cooldown: 20.0,
            currentCooldown: 15.0,
            execute: (ctx) => {
                // Sarcophagi burst open releasing enemy groups
                const angle = ctx.rng.next() * Math.PI * 2
                const dist = 8 + ctx.rng.next() * 6
                const x = ctx.player.position.x + Math.cos(angle) * dist
                const z = ctx.player.position.z + Math.sin(angle) * dist

                // Spawn obstacle (sarcophagus) briefly then burst with enemies
                ctx.entityManager.spawnObstacle(x, z, 0.8, 1.5)

                // Spawn enemies around the sarcophagus location
                const types = ['bone_crawler', 'frost_bat', 'drifter']
                for (let i = 0; i < 4; i++) {
                    const spawnAngle = (i / 4) * Math.PI * 2
                    const type = types[Math.floor(ctx.rng.next() * types.length)]
                    ctx.entityManager.spawnEnemy(type as any,
                        x + Math.cos(spawnAngle) * 2,
                        z + Math.sin(spawnAngle) * 2
                    )
                }
                ctx.vfxManager.createEmoji(x, z, '💀', 2.0)
            }
        },
        {
            id: 'torch_vision',
            cooldown: 1.0,
            currentCooldown: 0.0,
            execute: (_ctx) => {
                // Vision shrinks over time unless refreshed by fire kills
                // This modifies player.stats.visionMultiplier
                torchVisionRadius = Math.max(0.4, torchVisionRadius - 0.02)
            },
            continuous: (ctx, _deltaTime) => {
                // Check for recent kills (fire-related weapons would set this)
                // For simplicity, any kill refreshes the torch slightly
                const currentKills = ctx.entityManager.totalKills
                if (currentKills > fireKillCount) {
                    const newKills = currentKills - fireKillCount
                    torchVisionRadius = Math.min(1.0, torchVisionRadius + newKills * 0.05)
                    fireKillCount = currentKills
                }
                ctx.player.stats.visionMultiplier = torchVisionRadius
            }
        },
        {
            id: 'corridor_walls',
            cooldown: 30.0,
            currentCooldown: 25.0,
            execute: (ctx) => {
                // Create temporary wall corridors near player
                const angle = ctx.rng.next() * Math.PI * 2
                const perpAngle = angle + Math.PI / 2
                const corridorLength = 8
                const corridorWidth = 3.5

                for (let i = 0; i < 6; i++) {
                    const t = (i / 5 - 0.5) * corridorLength
                    // Two walls on either side
                    const cx = ctx.player.position.x + Math.cos(angle) * t
                    const cz = ctx.player.position.z + Math.sin(angle) * t

                    ctx.entityManager.spawnObstacle(
                        cx + Math.cos(perpAngle) * corridorWidth,
                        cz + Math.sin(perpAngle) * corridorWidth,
                        0.6, 8.0
                    )
                    ctx.entityManager.spawnObstacle(
                        cx - Math.cos(perpAngle) * corridorWidth,
                        cz - Math.sin(perpAngle) * corridorWidth,
                        0.6, 8.0
                    )
                }

                // Funnel enemies toward the corridor
                for (let i = 0; i < 6; i++) {
                    const spawnAngle = angle + (ctx.rng.next() - 0.5) * 0.5
                    const dist = 12 + ctx.rng.next() * 4
                    const type = ['bone_crawler', 'frost_bat', 'drifter'][Math.floor(ctx.rng.next() * 3)]
                    ctx.entityManager.spawnEnemy(type as any,
                        ctx.player.position.x + Math.cos(spawnAngle) * dist,
                        ctx.player.position.z + Math.sin(spawnAngle) * dist
                    )
                }
            }
        }
    ]
}

const WORLD_ENVIRONMENT_CONFIGS: Record<string, () => EnvironmentEffect[]> = {
    dark_forest: createDarkForestEffects,
    frozen_waste: createFrozenWasteEffects,
    catacombs: createCatacombsEffects,
}

export class WorldEnvironmentSystem {
    private effects: EnvironmentEffect[] = []
    private player: Player
    private entityManager: EntityManager
    private vfxManager: VFXManager
    private rng: SeededRandom
    private elapsedTime = 0
    private active = false

    constructor(player: Player, entityManager: EntityManager, vfxManager: VFXManager, rng: SeededRandom) {
        this.player = player
        this.entityManager = entityManager
        this.vfxManager = vfxManager
        this.rng = rng
    }

    setWorld(worldId: string) {
        const configFactory = WORLD_ENVIRONMENT_CONFIGS[worldId]
        if (configFactory) {
            this.effects = configFactory()
            this.active = true
            console.log(`[WorldEnvironment] Loaded ${this.effects.length} effects for ${worldId}`)
        } else {
            this.effects = []
            this.active = false
        }
        this.elapsedTime = 0
    }

    update(deltaTime: number) {
        if (!this.active) return

        this.elapsedTime += deltaTime

        const ctx: EnvironmentContext = {
            player: this.player,
            entityManager: this.entityManager,
            vfxManager: this.vfxManager,
            rng: this.rng,
            elapsedTime: this.elapsedTime
        }

        for (const effect of this.effects) {
            // Run continuous effects
            if (effect.continuous) {
                effect.continuous(ctx, deltaTime)
            }

            // Check cooldown for timed effects
            effect.currentCooldown -= deltaTime
            if (effect.currentCooldown <= 0) {
                effect.execute(ctx)
                effect.currentCooldown = effect.cooldown
            }
        }
    }

    cleanup() {
        this.effects = []
        this.active = false
        this.elapsedTime = 0
    }
}
