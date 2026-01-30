import { EnemyType } from '../entities/Enemy'

export interface BossPhaseAbility {
    id: string
    cooldown: number
    execute: (ctx: BossAbilityContext) => void
}

export interface BossPhase {
    hpThreshold: number // Transition when HP% drops below this (1.0 = 100%)
    moveSpeedMultiplier: number
    damageMultiplier: number
    abilities: BossPhaseAbility[]
    onEnter?: (ctx: BossAbilityContext) => void
    emissiveColor?: number
    emissiveIntensity?: number
}

export interface BossAbilityContext {
    bossX: number
    bossZ: number
    playerX: number
    playerZ: number
    bossDamage: number
    bossRadius: number
    spawnEnemy: (type: EnemyType, x: number, z: number) => void
    spawnProjectile: (x: number, z: number, vx: number, vz: number, damage: number, appliesSlow?: boolean, appliesCurse?: boolean) => void
    createMeleeSwing: (x: number, z: number, facingAngle: number, damage: number, radius: number) => void
    spawnObstacle: (x: number, z: number, radius: number, duration: number) => void
    spawnHazardZone: (x: number, z: number, type: string, radius: number, duration: number, damage: number) => void
    rng: { next: () => number }
}

export interface BossPhaseConfig {
    phases: BossPhase[]
}

const ANCIENT_TREANT_PHASES: BossPhaseConfig = {
    phases: [
        {
            // Phase 1: Slow root slams with delayed damage zones
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'root_slam',
                    cooldown: 5.0,
                    execute: (ctx) => {
                        // Telegraphed root slam - creates hazard zones after delay
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
                        const nx = dirX / dist
                        const nz = dirZ / dist
                        for (let i = 1; i <= 3; i++) {
                            const hx = ctx.bossX + nx * i * 3
                            const hz = ctx.bossZ + nz * i * 3
                            ctx.spawnHazardZone(hx, hz, 'poison', 2.5, 4.0, 15)
                        }
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, Math.atan2(nz, nx), ctx.bossDamage, 4.0)
                    }
                }
            ],
            emissiveColor: 0x2d4a1e,
            emissiveIntensity: 0.2
        },
        {
            // Phase 2: Sapling swarm + root slams
            hpThreshold: 0.6,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.2,
            abilities: [
                {
                    id: 'root_slam',
                    cooldown: 6.0,
                    execute: (ctx) => {
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
                        const nx = dirX / dist
                        const nz = dirZ / dist
                        for (let i = 1; i <= 3; i++) {
                            ctx.spawnHazardZone(ctx.bossX + nx * i * 3, ctx.bossZ + nz * i * 3, 'poison', 2.5, 4.0, 15)
                        }
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, Math.atan2(nz, nx), ctx.bossDamage * 1.2, 4.0)
                    }
                },
                {
                    id: 'sapling_swarm',
                    cooldown: 6.0,
                    execute: (ctx) => {
                        const count = 5
                        for (let i = 0; i < count; i++) {
                            const angle = (i / count) * Math.PI * 2 + ctx.rng.next() * 0.5
                            ctx.spawnEnemy('sapling', ctx.bossX + Math.cos(angle) * 3, ctx.bossZ + Math.sin(angle) * 3)
                        }
                    }
                }
            ],
            onEnter: (ctx) => {
                // Burst of saplings on phase transition
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2
                    ctx.spawnEnemy('sapling', ctx.bossX + Math.cos(angle) * 4, ctx.bossZ + Math.sin(angle) * 4)
                }
            },
            emissiveColor: 0x4a6b2e,
            emissiveIntensity: 0.4
        },
        {
            // Phase 3: Rage - faster, bigger slams, constant saplings
            hpThreshold: 0.25,
            moveSpeedMultiplier: 2.0,
            damageMultiplier: 1.5,
            abilities: [
                {
                    id: 'rage_slam',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        // Much larger root slam
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
                        const nx = dirX / dist
                        const nz = dirZ / dist
                        for (let i = 1; i <= 5; i++) {
                            ctx.spawnHazardZone(ctx.bossX + nx * i * 2.5, ctx.bossZ + nz * i * 2.5, 'poison', 3.5, 5.0, 20)
                        }
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, Math.atan2(nz, nx), ctx.bossDamage * 1.5, 6.0)
                    }
                },
                {
                    id: 'sapling_burst',
                    cooldown: 4.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 6; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const dist = 2 + ctx.rng.next() * 3
                            ctx.spawnEnemy('sapling', ctx.bossX + Math.cos(angle) * dist, ctx.bossZ + Math.sin(angle) * dist)
                        }
                    }
                }
            ],
            onEnter: (_ctx) => {
                // Visual rage effect handled by emissive
            },
            emissiveColor: 0xff4400,
            emissiveIntensity: 0.7
        }
    ]
}

const LESHY_PHASES: BossPhaseConfig = {
    phases: [
        {
            // Phase 1: Wolf summons in cross patterns
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'wolf_cross',
                    cooldown: 8.0,
                    execute: (ctx) => {
                        // Spawn wolves at cardinal directions that charge in cross pattern
                        const offsets = [
                            { x: 12, z: 0 }, { x: -12, z: 0 },
                            { x: 0, z: 12 }, { x: 0, z: -12 }
                        ]
                        for (const off of offsets) {
                            ctx.spawnEnemy('spirit_wolf', ctx.playerX + off.x, ctx.playerZ + off.z)
                        }
                    }
                },
                {
                    id: 'nature_bolt',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
                        const speed = 8
                        ctx.spawnProjectile(ctx.bossX, ctx.bossZ, (dirX / dist) * speed, (dirZ / dist) * speed, ctx.bossDamage * 0.6)
                    }
                }
            ],
            emissiveColor: 0x1a4a1a,
            emissiveIntensity: 0.2
        },
        {
            // Phase 2: Shrinking vine arena
            hpThreshold: 0.55,
            moveSpeedMultiplier: 1.2,
            damageMultiplier: 1.3,
            abilities: [
                {
                    id: 'wolf_cross',
                    cooldown: 7.0,
                    execute: (ctx) => {
                        const offsets = [
                            { x: 10, z: 0 }, { x: -10, z: 0 },
                            { x: 0, z: 10 }, { x: 0, z: -10 },
                            { x: 7, z: 7 }, { x: -7, z: -7 }
                        ]
                        for (const off of offsets) {
                            ctx.spawnEnemy('spirit_wolf', ctx.playerX + off.x, ctx.playerZ + off.z)
                        }
                    }
                },
                {
                    id: 'vine_arena',
                    cooldown: 12.0,
                    execute: (ctx) => {
                        // Create ring of obstacles around player to trap them
                        const ringRadius = 8
                        for (let i = 0; i < 12; i++) {
                            const angle = (i / 12) * Math.PI * 2
                            ctx.spawnObstacle(
                                ctx.playerX + Math.cos(angle) * ringRadius,
                                ctx.playerZ + Math.sin(angle) * ringRadius,
                                0.6, 6.0
                            )
                        }
                        // Inner ring after delay effect (smaller)
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2 + 0.4
                            ctx.spawnObstacle(
                                ctx.playerX + Math.cos(angle) * 5,
                                ctx.playerZ + Math.sin(angle) * 5,
                                0.5, 4.0
                            )
                        }
                    }
                }
            ],
            onEnter: (ctx) => {
                // Summon wolf pack on transition
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2
                    ctx.spawnEnemy('spirit_wolf', ctx.bossX + Math.cos(angle) * 6, ctx.bossZ + Math.sin(angle) * 6)
                }
            },
            emissiveColor: 0x336633,
            emissiveIntensity: 0.4
        },
        {
            // Phase 3: Rotating beam attacks + constant wolf pressure
            hpThreshold: 0.2,
            moveSpeedMultiplier: 1.5,
            damageMultiplier: 1.5,
            abilities: [
                {
                    id: 'rotating_barrage',
                    cooldown: 2.5,
                    execute: (ctx) => {
                        // Rotating projectile burst (angle shifts each time)
                        const baseAngle = ctx.rng.next() * Math.PI * 2
                        for (let i = 0; i < 12; i++) {
                            const angle = baseAngle + (i / 12) * Math.PI * 2
                            ctx.spawnProjectile(
                                ctx.bossX, ctx.bossZ,
                                Math.cos(angle) * 10, Math.sin(angle) * 10,
                                ctx.bossDamage * 0.5
                            )
                        }
                    }
                },
                {
                    id: 'wolf_spam',
                    cooldown: 5.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 4; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const dist = 8 + ctx.rng.next() * 6
                            ctx.spawnEnemy('spirit_wolf', ctx.playerX + Math.cos(angle) * dist, ctx.playerZ + Math.sin(angle) * dist)
                        }
                    }
                },
                {
                    id: 'vine_trap',
                    cooldown: 10.0,
                    execute: (ctx) => {
                        const ringRadius = 6
                        for (let i = 0; i < 10; i++) {
                            const angle = (i / 10) * Math.PI * 2
                            ctx.spawnObstacle(
                                ctx.playerX + Math.cos(angle) * ringRadius,
                                ctx.playerZ + Math.sin(angle) * ringRadius,
                                0.5, 5.0
                            )
                        }
                    }
                }
            ],
            onEnter: (ctx) => {
                // Massive wolf summon
                for (let i = 0; i < 10; i++) {
                    const angle = ctx.rng.next() * Math.PI * 2
                    const dist = 6 + ctx.rng.next() * 8
                    ctx.spawnEnemy('spirit_wolf', ctx.bossX + Math.cos(angle) * dist, ctx.bossZ + Math.sin(angle) * dist)
                }
            },
            emissiveColor: 0x66ff00,
            emissiveIntensity: 0.8
        }
    ]
}

const CHERNOBOG_PHASES: BossPhaseConfig = {
    phases: [
        {
            // Phase 1: Slow shadow projectiles that explode on contact
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'shadow_volley',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        // 8-way slow shadow projectiles
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 6, Math.sin(angle) * 6, ctx.bossDamage * 0.7)
                        }
                    }
                },
                {
                    id: 'minion_summon',
                    cooldown: 15.0,
                    execute: (ctx) => {
                        const types: EnemyType[] = ['drifter', 'screecher', 'domovoi', 'zmora', 'bruiser']
                        for (let i = 0; i < 5; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const type = types[Math.floor(ctx.rng.next() * types.length)]
                            ctx.spawnEnemy(type, ctx.bossX + Math.cos(angle) * 4, ctx.bossZ + Math.sin(angle) * 4)
                        }
                    }
                }
            ],
            emissiveColor: 0x220022,
            emissiveIntensity: 0.3
        },
        {
            // Phase 2: Corrupted floor zones + more aggressive projectiles
            hpThreshold: 0.6,
            moveSpeedMultiplier: 1.2,
            damageMultiplier: 1.3,
            abilities: [
                {
                    id: 'shadow_barrage',
                    cooldown: 2.5,
                    execute: (ctx) => {
                        // 12-way projectiles, faster
                        for (let i = 0; i < 12; i++) {
                            const angle = (i / 12) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 8, Math.sin(angle) * 8, ctx.bossDamage * 0.8)
                        }
                    }
                },
                {
                    id: 'corruption_zones',
                    cooldown: 6.0,
                    execute: (ctx) => {
                        // Place corrupted floor zones around the player
                        for (let i = 0; i < 4; i++) {
                            const angle = (i / 4) * Math.PI * 2 + ctx.rng.next() * 0.5
                            const dist = 3 + ctx.rng.next() * 4
                            ctx.spawnHazardZone(
                                ctx.playerX + Math.cos(angle) * dist,
                                ctx.playerZ + Math.sin(angle) * dist,
                                'poison', 3.0, 8.0, 12
                            )
                        }
                    }
                },
                {
                    id: 'minion_summon',
                    cooldown: 12.0,
                    execute: (ctx) => {
                        const types: EnemyType[] = ['bruiser', 'stone_golem', 'spirit_wolf', 'shadow_stalker']
                        for (let i = 0; i < 6; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const type = types[Math.floor(ctx.rng.next() * types.length)]
                            ctx.spawnEnemy(type, ctx.bossX + Math.cos(angle) * 5, ctx.bossZ + Math.sin(angle) * 5)
                        }
                    }
                }
            ],
            onEnter: (ctx) => {
                // Explosion of corruption
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2
                    ctx.spawnHazardZone(
                        ctx.bossX + Math.cos(angle) * 5,
                        ctx.bossZ + Math.sin(angle) * 5,
                        'poison', 3.5, 10.0, 15
                    )
                }
            },
            emissiveColor: 0x440044,
            emissiveIntensity: 0.5
        },
        {
            // Phase 3: Eclipse - reduced visibility, all attacks combined
            hpThreshold: 0.25,
            moveSpeedMultiplier: 1.5,
            damageMultiplier: 1.8,
            abilities: [
                {
                    id: 'eclipse_barrage',
                    cooldown: 1.5,
                    execute: (ctx) => {
                        // 16-way projectile burst
                        const baseAngle = ctx.rng.next() * Math.PI * 2
                        for (let i = 0; i < 16; i++) {
                            const angle = baseAngle + (i / 16) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 10, Math.sin(angle) * 10, ctx.bossDamage * 0.6)
                        }
                    }
                },
                {
                    id: 'corruption_carpet',
                    cooldown: 4.0,
                    execute: (ctx) => {
                        // Carpet of corruption around player
                        for (let i = 0; i < 6; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const dist = 2 + ctx.rng.next() * 5
                            ctx.spawnHazardZone(
                                ctx.playerX + Math.cos(angle) * dist,
                                ctx.playerZ + Math.sin(angle) * dist,
                                'poison', 2.5, 6.0, 15
                            )
                        }
                    }
                },
                {
                    id: 'eclipse_summon',
                    cooldown: 8.0,
                    execute: (ctx) => {
                        const types: EnemyType[] = ['shadow_stalker', 'spirit_wolf', 'bruiser', 'screecher', 'zmora']
                        for (let i = 0; i < 8; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            const dist = 6 + ctx.rng.next() * 6
                            const type = types[Math.floor(ctx.rng.next() * types.length)]
                            ctx.spawnEnemy(type, ctx.bossX + Math.cos(angle) * dist, ctx.bossZ + Math.sin(angle) * dist)
                        }
                    }
                },
                {
                    id: 'melee_slam',
                    cooldown: 6.0,
                    execute: (ctx) => {
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, 0, ctx.bossDamage * 2, 8.0)
                    }
                }
            ],
            onEnter: (ctx) => {
                // Eclipse transition: massive corruption ring
                for (let i = 0; i < 12; i++) {
                    const angle = (i / 12) * Math.PI * 2
                    ctx.spawnHazardZone(
                        ctx.bossX + Math.cos(angle) * 8,
                        ctx.bossZ + Math.sin(angle) * 8,
                        'poison', 4.0, 12.0, 20
                    )
                }
                // Spawn shadow minions
                for (let i = 0; i < 6; i++) {
                    const angle = ctx.rng.next() * Math.PI * 2
                    ctx.spawnEnemy('shadow_stalker', ctx.bossX + Math.cos(angle) * 6, ctx.bossZ + Math.sin(angle) * 6)
                }
            },
            emissiveColor: 0x8800ff,
            emissiveIntensity: 1.0
        }
    ]
}

// Additional boss configs for other bosses
const GUARDIAN_GOLEM_PHASES: BossPhaseConfig = {
    phases: [
        {
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'wall_trap',
                    cooldown: 10.0,
                    execute: (ctx) => {
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const angle = Math.atan2(dirZ, dirX)
                        for (let i = 0; i < 5; i++) {
                            const wallAngle = angle + (i - 2) * (Math.PI / 6)
                            ctx.spawnObstacle(ctx.playerX + Math.cos(wallAngle) * 4, ctx.playerZ + Math.sin(wallAngle) * 4, 0.8, 8.0)
                        }
                    }
                }
            ],
            emissiveColor: 0x455a64,
            emissiveIntensity: 0.1
        },
        {
            hpThreshold: 0.5,
            moveSpeedMultiplier: 1.3,
            damageMultiplier: 1.5,
            abilities: [
                {
                    id: 'wall_cage',
                    cooldown: 8.0,
                    execute: (ctx) => {
                        // Full cage around player
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2
                            ctx.spawnObstacle(ctx.playerX + Math.cos(angle) * 5, ctx.playerZ + Math.sin(angle) * 5, 0.8, 6.0)
                        }
                    }
                },
                {
                    id: 'ground_slam',
                    cooldown: 5.0,
                    execute: (ctx) => {
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, 0, ctx.bossDamage * 1.5, 5.0)
                    }
                }
            ],
            onEnter: (_ctx) => {},
            emissiveColor: 0x607d8b,
            emissiveIntensity: 0.4
        }
    ]
}

const GOLEM_DESTROYER_PHASES: BossPhaseConfig = {
    phases: [
        {
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'charge',
                    cooldown: 7.0,
                    execute: (_ctx) => {
                        // Charge is handled via isCharging flag in Enemy.ts
                        // This serves as the phase cooldown controller
                    }
                }
            ],
            emissiveColor: 0x263238,
            emissiveIntensity: 0.1
        },
        {
            hpThreshold: 0.5,
            moveSpeedMultiplier: 1.5,
            damageMultiplier: 1.5,
            abilities: [
                {
                    id: 'rapid_charge',
                    cooldown: 4.0,
                    execute: (_ctx) => {}
                },
                {
                    id: 'rock_throw',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        const dirX = ctx.playerX - ctx.bossX
                        const dirZ = ctx.playerZ - ctx.bossZ
                        const dist = Math.sqrt(dirX * dirX + dirZ * dirZ) || 1
                        for (let i = -1; i <= 1; i++) {
                            const spread = i * 0.3
                            const nx = dirX / dist
                            const nz = dirZ / dist
                            const vx = (nx * Math.cos(spread) - nz * Math.sin(spread)) * 8
                            const vz = (nx * Math.sin(spread) + nz * Math.cos(spread)) * 8
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, vx, vz, ctx.bossDamage * 0.6)
                        }
                    }
                }
            ],
            emissiveColor: 0x442200,
            emissiveIntensity: 0.5
        }
    ]
}

const CRYPT_GUARDIAN_PHASES: BossPhaseConfig = {
    phases: [
        {
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'bone_rain',
                    cooldown: 5.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 6; i++) {
                            const angle = (i / 6) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 7, Math.sin(angle) * 7, ctx.bossDamage * 0.5)
                        }
                    }
                },
                {
                    id: 'summon_crawlers',
                    cooldown: 10.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 4; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            ctx.spawnEnemy('bone_crawler', ctx.bossX + Math.cos(angle) * 4, ctx.bossZ + Math.sin(angle) * 4)
                        }
                    }
                }
            ],
            emissiveColor: 0x4e342e,
            emissiveIntensity: 0.2
        },
        {
            hpThreshold: 0.5,
            moveSpeedMultiplier: 1.3,
            damageMultiplier: 1.5,
            abilities: [
                {
                    id: 'bone_storm',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        const baseAngle = ctx.rng.next() * Math.PI * 2
                        for (let i = 0; i < 10; i++) {
                            const angle = baseAngle + (i / 10) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 9, Math.sin(angle) * 9, ctx.bossDamage * 0.6)
                        }
                    }
                },
                {
                    id: 'summon_wraiths',
                    cooldown: 8.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 3; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            ctx.spawnEnemy('flame_wraith', ctx.bossX + Math.cos(angle) * 5, ctx.bossZ + Math.sin(angle) * 5)
                        }
                        for (let i = 0; i < 4; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            ctx.spawnEnemy('bone_crawler', ctx.bossX + Math.cos(angle) * 4, ctx.bossZ + Math.sin(angle) * 4)
                        }
                    }
                },
                {
                    id: 'death_slam',
                    cooldown: 6.0,
                    execute: (ctx) => {
                        ctx.createMeleeSwing(ctx.bossX, ctx.bossZ, 0, ctx.bossDamage * 2, 6.0)
                    }
                }
            ],
            onEnter: (ctx) => {
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2
                    ctx.spawnEnemy('flame_wraith', ctx.bossX + Math.cos(angle) * 6, ctx.bossZ + Math.sin(angle) * 6)
                }
            },
            emissiveColor: 0x880000,
            emissiveIntensity: 0.6
        }
    ]
}

const ICE_GOLEM_PHASES: BossPhaseConfig = {
    phases: [
        {
            hpThreshold: 1.0,
            moveSpeedMultiplier: 1.0,
            damageMultiplier: 1.0,
            abilities: [
                {
                    id: 'ice_shards',
                    cooldown: 4.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 6; i++) {
                            const angle = (i / 6) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 7, Math.sin(angle) * 7, ctx.bossDamage * 0.5, true)
                        }
                    }
                }
            ],
            emissiveColor: 0x4fc3f7,
            emissiveIntensity: 0.2
        },
        {
            hpThreshold: 0.5,
            moveSpeedMultiplier: 1.3,
            damageMultiplier: 1.4,
            abilities: [
                {
                    id: 'blizzard_shards',
                    cooldown: 3.0,
                    execute: (ctx) => {
                        const baseAngle = ctx.rng.next() * Math.PI * 2
                        for (let i = 0; i < 10; i++) {
                            const angle = baseAngle + (i / 10) * Math.PI * 2
                            ctx.spawnProjectile(ctx.bossX, ctx.bossZ, Math.cos(angle) * 9, Math.sin(angle) * 9, ctx.bossDamage * 0.5, true)
                        }
                    }
                },
                {
                    id: 'frost_zone',
                    cooldown: 8.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 4; i++) {
                            const angle = (i / 4) * Math.PI * 2 + ctx.rng.next()
                            const dist = 3 + ctx.rng.next() * 4
                            ctx.spawnHazardZone(
                                ctx.playerX + Math.cos(angle) * dist,
                                ctx.playerZ + Math.sin(angle) * dist,
                                'slow', 3.0, 8.0, 0
                            )
                        }
                    }
                },
                {
                    id: 'summon_wolves',
                    cooldown: 10.0,
                    execute: (ctx) => {
                        for (let i = 0; i < 4; i++) {
                            const angle = ctx.rng.next() * Math.PI * 2
                            ctx.spawnEnemy('blizzard_wolf', ctx.bossX + Math.cos(angle) * 5, ctx.bossZ + Math.sin(angle) * 5)
                        }
                    }
                }
            ],
            onEnter: (ctx) => {
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2
                    ctx.spawnHazardZone(
                        ctx.bossX + Math.cos(angle) * 5,
                        ctx.bossZ + Math.sin(angle) * 5,
                        'slow', 4.0, 10.0, 0
                    )
                }
            },
            emissiveColor: 0x00ccff,
            emissiveIntensity: 0.7
        }
    ]
}

export const BOSS_PHASE_CONFIGS: Partial<Record<EnemyType, BossPhaseConfig>> = {
    ancient_treant: ANCIENT_TREANT_PHASES,
    leshy: LESHY_PHASES,
    chernobog: CHERNOBOG_PHASES,
    guardian_golem: GUARDIAN_GOLEM_PHASES,
    golem_destroyer: GOLEM_DESTROYER_PHASES,
    crypt_guardian: CRYPT_GUARDIAN_PHASES,
    ice_golem: ICE_GOLEM_PHASES,
}

export class BossPhaseState {
    currentPhaseIndex = 0
    abilityCooldowns: Map<string, number> = new Map()
    config: BossPhaseConfig
    phaseTransitioned = false

    constructor(config: BossPhaseConfig) {
        this.config = config
        this.resetCooldowns()
    }

    private resetCooldowns() {
        this.abilityCooldowns.clear()
        const phase = this.config.phases[this.currentPhaseIndex]
        for (const ability of phase.abilities) {
            this.abilityCooldowns.set(ability.id, ability.cooldown * 0.5) // Start at half cooldown
        }
    }

    getCurrentPhase(): BossPhase {
        return this.config.phases[this.currentPhaseIndex]
    }

    checkPhaseTransition(hpPercent: number, ctx: BossAbilityContext): boolean {
        const nextIndex = this.currentPhaseIndex + 1
        if (nextIndex >= this.config.phases.length) return false

        const nextPhase = this.config.phases[nextIndex]
        if (hpPercent <= nextPhase.hpThreshold) {
            this.currentPhaseIndex = nextIndex
            this.resetCooldowns()
            if (nextPhase.onEnter) {
                nextPhase.onEnter(ctx)
            }
            return true
        }
        return false
    }

    update(deltaTime: number, ctx: BossAbilityContext) {
        const phase = this.getCurrentPhase()

        for (const ability of phase.abilities) {
            const remaining = (this.abilityCooldowns.get(ability.id) || 0) - deltaTime
            if (remaining <= 0) {
                ability.execute(ctx)
                this.abilityCooldowns.set(ability.id, ability.cooldown)
            } else {
                this.abilityCooldowns.set(ability.id, remaining)
            }
        }
    }
}
