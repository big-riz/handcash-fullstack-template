
import { SpawnSystem } from './SpawnSystem'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'
import { Player } from '../entities/Player'
import { SeededRandom } from '@/lib/SeededRandom'
import { EnemyType } from '../entities/Enemy'
import { HazardType } from '../entities/HazardZone'

export interface GameEvent {
    id: string
    name: string
    description: string
    startTime: number // seconds
    duration: number // seconds
    active: boolean
    onStart: (systems: SystemContext) => void
    onEnd: (systems: SystemContext) => void
    update?: (deltaTime: number, systems: SystemContext) => void
}

export interface SystemContext {
    spawnSystem: SpawnSystem
    entityManager: EntityManager
    vfxManager: VFXManager
    player: Player
}

// Dynamic events trigger based on cooldowns + random chance
interface DynamicEvent {
    id: string
    name: string
    description: string
    cooldown: number        // Min seconds between triggers
    currentCooldown: number // Time until next eligibility
    duration: number        // How long the event lasts (0 = instant)
    chance: number          // 0-1 probability per check
    minTime: number         // Don't trigger before this elapsed time
    active: boolean
    activeTimer: number
    onStart: (ctx: SystemContext, rng: SeededRandom) => void
    onEnd?: (ctx: SystemContext) => void
    update?: (deltaTime: number, ctx: SystemContext, rng: SeededRandom) => void
}

export class EventSystem {
    private events: GameEvent[] = []
    private dynamicEvents: DynamicEvent[] = []
    private currentTime = 0
    private rng: SeededRandom
    private checkInterval = 5.0 // Check for dynamic events every 5 seconds
    private checkTimer = 0

    // Active event notification callback
    private onEventMessage: ((name: string, description: string) => void) | null = null

    constructor(private context: SystemContext, rng?: SeededRandom) {
        this.rng = rng || new SeededRandom(Date.now())
        this.setupEvents()
        this.setupDynamicEvents()
    }

    setEventMessageCallback(callback: (name: string, description: string) => void) {
        this.onEventMessage = callback
    }

    private setupEvents() {
        // Boss spawn is handled directly in SpawnSystem.ts
    }

    private setupDynamicEvents() {
        this.dynamicEvents = [
            createTreasureGoblinEvent(),
            createBloodMoonEvent(),
            createCursedShrineEvent(),
            createAngelBlessingEvent(),
            createEliteChallengeEvent(),
            createAmbushWaveEvent(),
            createTravelingMerchantEvent(),
        ]
    }

    update(deltaTime: number) {
        this.currentTime += deltaTime

        // Fixed-time events
        for (const event of this.events) {
            const isActive = this.currentTime >= event.startTime && this.currentTime < (event.startTime + event.duration)

            if (isActive && !event.active) {
                event.active = true
                event.onStart(this.context)
            } else if (!isActive && event.active) {
                event.active = false
                event.onEnd(this.context)
            }

            if (event.active && event.update) {
                event.update(deltaTime, this.context)
            }
        }

        // Dynamic events - tick active ones
        for (const de of this.dynamicEvents) {
            if (de.active) {
                de.activeTimer -= deltaTime
                if (de.update) {
                    de.update(deltaTime, this.context, this.rng)
                }
                if (de.activeTimer <= 0) {
                    de.active = false
                    if (de.onEnd) de.onEnd(this.context)
                }
            } else {
                de.currentCooldown -= deltaTime
            }
        }

        // Periodic roll for new dynamic events
        this.checkTimer -= deltaTime
        if (this.checkTimer <= 0) {
            this.checkTimer = this.checkInterval
            this.rollDynamicEvents()
        }
    }

    private rollDynamicEvents() {
        for (const de of this.dynamicEvents) {
            if (de.active) continue
            if (de.currentCooldown > 0) continue
            if (this.currentTime < de.minTime) continue

            if (this.rng.next() < de.chance) {
                de.active = true
                de.activeTimer = de.duration
                de.currentCooldown = de.cooldown
                de.onStart(this.context, this.rng)
                if (this.onEventMessage) {
                    this.onEventMessage(de.name, de.description)
                }
            }
        }
    }

    getActiveEvents(): GameEvent[] {
        return this.events.filter(e => e.active)
    }

    getActiveDynamicEvents(): DynamicEvent[] {
        return this.dynamicEvents.filter(e => e.active)
    }

    getActiveEventNames(): string[] {
        const names: string[] = []
        for (const e of this.events) {
            if (e.active) names.push(e.name)
        }
        for (const de of this.dynamicEvents) {
            if (de.active) names.push(de.name)
        }
        return names
    }
}

// ============================================================
// TREASURE GOBLIN - Fast fleeing enemy, drops tons of XP gems
// ============================================================
function createTreasureGoblinEvent(): DynamicEvent {
    let goblinEnemy: ReturnType<typeof Object.create> | null = null
    let goblinTimer = 0

    return {
        id: 'treasure_goblin',
        name: '💰 Treasure Goblin!',
        description: 'A treasure goblin appeared! Kill it before it escapes!',
        cooldown: 180,
        currentCooldown: 120,
        duration: 90,
        chance: 0.2,
        minTime: 120,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            const angle = rng.next() * Math.PI * 2
            const dist = 10
            const goblinX = ctx.player.position.x + Math.cos(angle) * dist
            const goblinZ = ctx.player.position.z + Math.sin(angle) * dist
            goblinTimer = 0

            const goblin = ctx.entityManager.spawnEnemy('drifter' as EnemyType, goblinX, goblinZ, true)
            goblin.stats.moveSpeed = 7
            goblin.stats.currentHp = 150
            goblin.stats.maxHp = 150
            goblin.stats.xpValue = 80
            goblin.fleeFromPlayer = true
            goblinEnemy = goblin

            ctx.vfxManager.createEmoji(goblinX, goblinZ, '💰', 2.0)
        },
        update: (deltaTime, ctx, rng) => {
            goblinTimer += deltaTime
            // Drop breadcrumb gems at the actual goblin position
            if (goblinEnemy && goblinEnemy.isActive && Math.floor(goblinTimer * 3) !== Math.floor((goblinTimer - deltaTime) * 3)) {
                const trailX = goblinEnemy.position.x + (rng.next() - 0.5) * 2
                const trailZ = goblinEnemy.position.z + (rng.next() - 0.5) * 2
                ctx.entityManager.spawnGem(trailX, trailZ, 1)
            }
            // Detect if goblin was killed early
            if (goblinEnemy && !goblinEnemy.isActive) {
                goblinEnemy = null
            }
        },
        onEnd: (ctx) => {
            if (goblinEnemy && goblinEnemy.isActive) {
                const gx = goblinEnemy.position.x
                const gz = goblinEnemy.position.z
                goblinEnemy.die(true)
                for (let i = 0; i < 5; i++) {
                    ctx.entityManager.spawnGem(
                        gx + (Math.random() - 0.5) * 4,
                        gz + (Math.random() - 0.5) * 4,
                        1
                    )
                }
                ctx.vfxManager.createEmoji(gx, gz, '👋', 1.5)
            }
            goblinEnemy = null
        }
    }
}

// ============================================================
// BLOOD MOON - Double enemy spawns, double XP for duration
// ============================================================
function createBloodMoonEvent(): DynamicEvent {
    let savedGrowth = 1.0

    return {
        id: 'blood_moon',
        name: '🌑 Blood Moon!',
        description: 'Enemy spawns doubled! XP gains doubled!',
        cooldown: 360,
        currentCooldown: 240,
        duration: 30,
        chance: 0.15,
        minTime: 240,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            savedGrowth = ctx.player.stats.growth
            ctx.player.stats.growth *= 2.0

            // Spawn a big wave immediately
            const types: EnemyType[] = ['drifter', 'screecher', 'bruiser', 'domovoi']
            for (let i = 0; i < 12; i++) {
                const angle = rng.next() * Math.PI * 2
                const dist = 12 + rng.next() * 6
                const type = types[Math.floor(rng.next() * types.length)]
                ctx.entityManager.spawnEnemy(
                    type,
                    ctx.player.position.x + Math.cos(angle) * dist,
                    ctx.player.position.z + Math.sin(angle) * dist
                )
            }

            ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '🌑', 2.5)
            ctx.vfxManager.triggerScreenShake(0.3, 0.5)
        },
        update: (deltaTime, ctx, rng) => {
            // Extra enemy spawns every 3 seconds during blood moon
            if (Math.floor(ctx.entityManager.totalKills * 0.1) % 3 === 0 && rng.next() < deltaTime * 0.5) {
                const angle = rng.next() * Math.PI * 2
                const dist = 14 + rng.next() * 4
                const types: EnemyType[] = ['drifter', 'screecher', 'bruiser']
                const type = types[Math.floor(rng.next() * types.length)]
                ctx.entityManager.spawnEnemy(
                    type,
                    ctx.player.position.x + Math.cos(angle) * dist,
                    ctx.player.position.z + Math.sin(angle) * dist
                )
            }
        },
        onEnd: (ctx) => {
            ctx.player.stats.growth = savedGrowth
            ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '🌕', 2.0)
        }
    }
}

// ============================================================
// CURSED SHRINE - Powerful buff + serious drawback
// ============================================================
function createCursedShrineEvent(): DynamicEvent {
    let curseType = 0
    let savedStat = 0

    return {
        id: 'cursed_shrine',
        name: '☠️ Cursed Shrine!',
        description: 'A dark power grants strength... at a cost.',
        cooldown: 240,
        currentCooldown: 180,
        duration: 45,
        chance: 0.15,
        minTime: 180,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            curseType = Math.floor(rng.next() * 4)

            switch (curseType) {
                case 0: // Glass cannon: +50% damage, -30% max HP
                    savedStat = ctx.player.stats.damageMultiplier
                    ctx.player.stats.damageMultiplier *= 1.5
                    ctx.player.stats.maxHp = Math.floor(ctx.player.stats.maxHp * 0.7)
                    ctx.player.stats.currentHp = Math.min(ctx.player.stats.currentHp, ctx.player.stats.maxHp)
                    break
                case 1: // Berserker: +40% move speed, -25% damage
                    savedStat = ctx.player.stats.moveSpeed
                    ctx.player.stats.moveSpeed *= 1.4
                    ctx.player.stats.damageMultiplier *= 0.75
                    break
                case 2: // Fortified: +5 armor, -20% move speed
                    savedStat = ctx.player.stats.armor
                    ctx.player.stats.armor += 5
                    ctx.player.stats.moveSpeed *= 0.8
                    break
                case 3: // Vampiric: +15% lifesteal, enemies deal 20% more damage
                    savedStat = ctx.player.stats.lifesteal
                    ctx.player.stats.lifesteal += 0.15
                    ctx.player.stats.curse *= 1.2
                    break
            }

            // Spawn hazard zone visual at player location
            ctx.entityManager.spawnHazardZone(
                ctx.player.position.x, ctx.player.position.z,
                'poison' as HazardType, 2.0, 3.0, 0
            )
            ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '☠️', 2.0)
            ctx.vfxManager.triggerScreenShake(0.2, 0.3)
        },
        onEnd: (ctx) => {
            // Revert curse effects
            switch (curseType) {
                case 0:
                    ctx.player.stats.damageMultiplier = savedStat
                    ctx.player.stats.maxHp = Math.floor(ctx.player.stats.maxHp / 0.7)
                    break
                case 1:
                    ctx.player.stats.moveSpeed = savedStat
                    ctx.player.stats.damageMultiplier /= 0.75
                    break
                case 2:
                    ctx.player.stats.armor = savedStat
                    ctx.player.stats.moveSpeed /= 0.8
                    break
                case 3:
                    ctx.player.stats.lifesteal = savedStat
                    ctx.player.stats.curse /= 1.2
                    break
            }
            ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '✨', 1.5)
        }
    }
}

// ============================================================
// ANGEL BLESSING - Free stat upgrades
// ============================================================
function createAngelBlessingEvent(): DynamicEvent {
    return {
        id: 'angel_blessing',
        name: '👼 Angel Blessing!',
        description: 'A divine presence grants you power!',
        cooldown: 400,
        currentCooldown: 300,
        duration: 0.1,
        chance: 0.12,
        minTime: 300,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            // Grant 2-3 random stat boosts
            const boostCount = 2 + Math.floor(rng.next() * 2)
            const boosts = [
                () => { ctx.player.stats.maxHp += 15; ctx.player.stats.currentHp += 15 },
                () => { ctx.player.stats.armor += 1 },
                () => { ctx.player.stats.damageMultiplier += 0.1 },
                () => { ctx.player.stats.moveSpeed += 0.5 },
                () => { ctx.player.stats.cooldownMultiplier *= 0.95 },
                () => { ctx.player.stats.magnet += 0.5 },
                () => { ctx.player.stats.growth += 0.1 },
                () => { ctx.player.stats.areaMultiplier += 0.08 },
            ]

            for (let i = 0; i < boostCount; i++) {
                const idx = Math.floor(rng.next() * boosts.length)
                boosts[idx]()
            }

            // Heal 20% of max HP
            const healAmount = ctx.player.stats.maxHp * 0.2
            ctx.player.stats.currentHp = Math.min(ctx.player.stats.maxHp, ctx.player.stats.currentHp + healAmount)

            // Visual fanfare
            ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '👼', 2.5)
            ctx.vfxManager.createEmoji(ctx.player.position.x - 1, ctx.player.position.z, '✨', 1.5)
            ctx.vfxManager.createEmoji(ctx.player.position.x + 1, ctx.player.position.z, '✨', 1.5)
            ctx.vfxManager.createHealingNumber(ctx.player.position.x, ctx.player.position.z, healAmount)
        }
    }
}

// ============================================================
// ELITE CHALLENGE - Survive a tough ring of elites for reward
// ============================================================
function createEliteChallengeEvent(): DynamicEvent {
    let eliteKillsAtStart = 0
    let challengeX = 0
    let challengeZ = 0

    return {
        id: 'elite_challenge',
        name: '⚔️ Elite Challenge!',
        description: 'Defeat the elite squad for rare rewards!',
        cooldown: 300,
        currentCooldown: 240,
        duration: 20,
        chance: 0.15,
        minTime: 240,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            challengeX = ctx.player.position.x
            challengeZ = ctx.player.position.z
            eliteKillsAtStart = ctx.entityManager.totalKills

            // Spawn ring of elites
            const eliteTypes: EnemyType[] = ['bruiser', 'stone_golem', 'domovoi', 'werewolf']
            const count = 6
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2
                const dist = 8
                const type = eliteTypes[Math.floor(rng.next() * eliteTypes.length)]
                ctx.entityManager.spawnEnemy(
                    type,
                    challengeX + Math.cos(angle) * dist,
                    challengeZ + Math.sin(angle) * dist,
                    true // elite
                )
            }

            // Create arena boundary markers
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2
                ctx.entityManager.spawnHazardZone(
                    challengeX + Math.cos(angle) * 10,
                    challengeZ + Math.sin(angle) * 10,
                    'poison' as HazardType, 1.5, 20.0, 8
                )
            }

            ctx.vfxManager.createEmoji(challengeX, challengeZ, '⚔️', 2.5)
            ctx.vfxManager.triggerScreenShake(0.4, 0.5)
        },
        onEnd: (ctx) => {
            const killsDuringChallenge = ctx.entityManager.totalKills - eliteKillsAtStart
            // Reward based on kills during challenge
            if (killsDuringChallenge >= 4) {
                // Big reward: burst of XP gems + health
                for (let i = 0; i < 20; i++) {
                    const angle = (i / 20) * Math.PI * 2
                    const dist = 1 + Math.random() * 3
                    ctx.entityManager.spawnGem(
                        ctx.player.position.x + Math.cos(angle) * dist,
                        ctx.player.position.z + Math.sin(angle) * dist,
                        10
                    )
                }
                // Stat reward
                ctx.player.stats.damageMultiplier += 0.05
                ctx.player.stats.maxHp += 10
                ctx.player.stats.currentHp = Math.min(ctx.player.stats.maxHp, ctx.player.stats.currentHp + 10)

                ctx.vfxManager.createEmoji(ctx.player.position.x, ctx.player.position.z, '🏆', 2.5)
                ctx.vfxManager.createFloatingText(ctx.player.position.x, ctx.player.position.z, 'CHALLENGE COMPLETE!', '#FFD700', 1.5)
            } else {
                ctx.vfxManager.createFloatingText(ctx.player.position.x, ctx.player.position.z, 'Challenge failed...', '#FF4444', 1.2)
            }
        }
    }
}

// ============================================================
// AMBUSH WAVE - Massive single-direction charge
// ============================================================
function createAmbushWaveEvent(): DynamicEvent {
    return {
        id: 'ambush_wave',
        name: '🚨 Ambush!',
        description: 'A horde charges from one direction!',
        cooldown: 200,
        currentCooldown: 140,
        duration: 0.1,
        chance: 0.2,
        minTime: 120,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            const angle = rng.next() * Math.PI * 2
            const perpAngle = angle + Math.PI / 2
            const dist = 16
            const count = 10 + Math.floor(rng.next() * 6)

            const types: EnemyType[] = ['drifter', 'screecher', 'domovoi', 'zmora']

            for (let i = 0; i < count; i++) {
                const spread = (i - count / 2) * 1.8
                const type = types[Math.floor(rng.next() * types.length)]
                ctx.entityManager.spawnEnemy(
                    type,
                    ctx.player.position.x + Math.cos(angle) * dist + Math.cos(perpAngle) * spread,
                    ctx.player.position.z + Math.sin(angle) * dist + Math.sin(perpAngle) * spread
                )
            }

            // Warning emoji in the direction of attack
            ctx.vfxManager.createEmoji(
                ctx.player.position.x + Math.cos(angle) * 6,
                ctx.player.position.z + Math.sin(angle) * 6,
                '🚨', 2.0
            )
            ctx.vfxManager.triggerScreenShake(0.2, 0.3)
        }
    }
}

// ============================================================
// TRAVELING MERCHANT - Spend XP for stat boosts
// ============================================================
function createTravelingMerchantEvent(): DynamicEvent {
    let merchantActive = false
    let merchantX = 0
    let merchantZ = 0
    let purchasesMade = 0
    let purchaseCooldown = 0

    return {
        id: 'traveling_merchant',
        name: '🧙 Traveling Merchant!',
        description: 'A merchant offers wares... approach for buffs!',
        cooldown: 320,
        currentCooldown: 200,
        duration: 20,
        chance: 0.15,
        minTime: 180,
        active: false,
        activeTimer: 0,
        onStart: (ctx, rng) => {
            const angle = rng.next() * Math.PI * 2
            const dist = 5
            merchantX = ctx.player.position.x + Math.cos(angle) * dist
            merchantZ = ctx.player.position.z + Math.sin(angle) * dist
            merchantActive = true
            purchasesMade = 0
            purchaseCooldown = 0

            ctx.vfxManager.createEmoji(merchantX, merchantZ, '🧙', 2.5)
            ctx.entityManager.spawnObstacle(merchantX, merchantZ, 0.5, 20.0)
        },
        update: (deltaTime, ctx, rng) => {
            if (!merchantActive) return
            if (purchasesMade >= 3) return

            purchaseCooldown -= deltaTime

            const dx = ctx.player.position.x - merchantX
            const dz = ctx.player.position.z - merchantZ
            const dist = Math.sqrt(dx * dx + dz * dz)

            if (dist < 3.0 && purchaseCooldown <= 0) {
                purchaseCooldown = 3.0 // 3 seconds between purchases

                const buffType = Math.floor(rng.next() * 5)
                switch (buffType) {
                    case 0:
                        ctx.player.stats.damageMultiplier += 0.08
                        ctx.vfxManager.createFloatingText(merchantX, merchantZ, '+8% DMG', '#FF6600', 1.2)
                        break
                    case 1:
                        ctx.player.stats.maxHp += 20
                        ctx.player.stats.currentHp += 20
                        ctx.vfxManager.createFloatingText(merchantX, merchantZ, '+20 HP', '#00FF88', 1.2)
                        break
                    case 2:
                        ctx.player.stats.moveSpeed += 0.4
                        ctx.vfxManager.createFloatingText(merchantX, merchantZ, '+SPD', '#00CCFF', 1.2)
                        break
                    case 3:
                        ctx.player.stats.armor += 1
                        ctx.vfxManager.createFloatingText(merchantX, merchantZ, '+1 Armor', '#CCCCCC', 1.2)
                        break
                    case 4:
                        ctx.player.stats.cooldownMultiplier *= 0.95
                        ctx.vfxManager.createFloatingText(merchantX, merchantZ, '-5% CD', '#FF00FF', 1.2)
                        break
                }
                purchasesMade++
                ctx.vfxManager.createEmoji(merchantX, merchantZ, '✨', 1.5)

                if (purchasesMade >= 3) {
                    merchantActive = false
                    ctx.vfxManager.createEmoji(merchantX, merchantZ, '👋', 1.5)
                }
            }
        },
        onEnd: (_ctx) => {
            merchantActive = false
        }
    }
}
