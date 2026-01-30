/**
 * Enemy.ts
 *
 * Base class for all enemies in Slavic Survivors.
 * Handles movement, health, and basic AI (following player).
 *
 * Boss enemies get individual 3D meshes + googly eyes.
 * Regular enemies are rendered via InstancedRenderer (no individual mesh).
 */

import * as THREE from 'three'
import { Player } from './Player'
import { VFXManager } from '../systems/VFXManager'
import { SpriteSystem, EntitySprite } from '../core/SpriteSystem'
import { GooglyEyes, EyeExpression } from '../core/GooglyEyes'
import { CharacterModelManager, CharacterInstance } from '../core/CharacterModelManager'
import { BossPhaseState, BossAbilityContext, BOSS_PHASE_CONFIGS } from '../systems/BossPhaseManager'

export interface EnemyStats {
    maxHp: number
    currentHp: number
    moveSpeed: number
    damage: number
    xpValue: number
    isRanged?: boolean
}

export type EnemyType =
    // Existing
    'drifter' | 'screecher' | 'bruiser' | 'zmora' | 'domovoi' | 'kikimora' | 'leshy' | 'vodnik' | 'werewolf' | 'forest_wraith' | 'guardian_golem' |
    // New
    'sapling' | 'tox_shroom' | 'stone_golem' | 'spirit_wolf' | 'leshy_shaman' | 'ancient_treant' | 'wasp_swarm' | 'golem_destroyer' | 'shadow_stalker' | 'chernobog' |
    // Catacombs
    'frost_bat' | 'bone_crawler' | 'flame_wraith' | 'crypt_guardian' |
    // Frozen Waste
    'frost_elemental' | 'snow_wraith' | 'ice_golem' | 'blizzard_wolf'

export const BOSS_TYPES: Set<EnemyType> = new Set([
    'leshy', 'ancient_treant', 'guardian_golem', 'golem_destroyer', 'chernobog',
    'crypt_guardian', 'ice_golem'
])

export class Enemy {
    // Static flag for disabling health bars globally (for benchmarking)
    static healthBarsEnabled = true

    position: THREE.Vector3
    velocity: THREE.Vector3
    radius: number
    stats: EnemyStats
    type: EnemyType

    mesh: THREE.Mesh | null = null
    googlyEyes: GooglyEyes | null = null
    isActive = false
    isBoss = false
    isSuperEnemy = false
    combinedHp: number = 0 // Stores combined HP from merged enemies
    onDie: ((x: number, z: number, xp: number) => void) | null = null

    // Sprite rendering (alternative to mesh)
    entitySprite: EntitySprite | null = null
    useSpriteMode: boolean = false

    // 3D model rendering
    characterInstance: CharacterInstance | null = null
    use3DModel: boolean = false
    characterModelManager: CharacterModelManager | null = null
    modelInstanceId: string = ''

    // GPU-instanced skinned mesh rendering
    instancedSkinIndex: number = -1
    useInstancedSkinning: boolean = false

    // Behaviors
    private flickerTimer = 0
    private isInvulnerable = false
    public isElite = false
    public hitFlashTimer = 0 // White flash when hit
    private healCooldown = 0
    private isEnraged = false
    public canPhaseThrough = false
    private dashCooldown = 0
    private isDashing = false
    private dashDuration = 0
    private dashTargetX = 0
    private dashTargetZ = 0
    private summonCooldown = 0
    private stompCooldown = 0
    private chargeCooldown = 0
    private isCharging = false
    private chargeDuration = 0
    private chargeSpeedMultiplier = 3.0
    private wallCooldown = 0
    public providesBuffAura = false
    public buffAuraRadius = 6.0
    public isBuffed = false
    private bossAbility1Cooldown = 0
    private bossAbility2Cooldown = 0
    private bossAbility3Cooldown = 0
    private dashDelayTimer = 0
    private bossFlashTimer = 0

    // Boss phase system
    public bossPhaseState: BossPhaseState | null = null
    private baseMoveSpeed = 0
    private baseDamage = 0

    // Enemy ability system
    public providesWeakenAura = false // Wraiths: weaken player attacks nearby
    public weakenAuraRadius = 5.0
    public weakenFactor = 0.7 // 30% damage reduction to player
    public fleeFromPlayer = false // Goblin: zigzag away from player
    private fleeZigzagTimer = 0
    private slamCooldown = 0 // Golems: ground slam
    private trapCooldown = 0 // Web/trap enemies
    private pullCooldown = 0 // Aquatic pull ability
    public pullWarningTimer = 0 // Telegraph before pull fires
    public pullWarningActive = false
    private icePatchCooldown = 0 // Ice enemies: create slippery patches
    private healAuraCooldown = 0 // Shamans: heal nearby enemies
    public providesHealAura = false
    public healAuraRadius = 6.0

    constructor(type: EnemyType = 'drifter') {
        this.position = new THREE.Vector3()
        this.velocity = new THREE.Vector3()
        this.radius = 0.3
        this.type = type
        this.isBoss = BOSS_TYPES.has(type)

        this.stats = {
            maxHp: 13,
            currentHp: 13,
            moveSpeed: 3.0,
            damage: 5,
            xpValue: 1
        }

        this.setStatsByType(type)
    }

    private getBossEyeConfig(): { scale: number; expression: EyeExpression } | null {
        switch (this.type) {
            case 'leshy':
                return { scale: 1.5, expression: 'evil' }
            case 'ancient_treant':
                return { scale: 1.8, expression: 'tired' }
            case 'guardian_golem':
                return { scale: 1.2, expression: 'angry' }
            case 'golem_destroyer':
                return { scale: 1.6, expression: 'angry' }
            case 'chernobog':
                return { scale: 2.0, expression: 'evil' }
            case 'crypt_guardian':
                return { scale: 1.4, expression: 'angry' }
            case 'ice_golem':
                return { scale: 1.3, expression: 'angry' }
            default:
                return null
        }
    }

    private setStatsByType(type: EnemyType) {
        // Reset ability flags
        this.providesBuffAura = false
        this.providesWeakenAura = false
        this.providesHealAura = false
        this.canPhaseThrough = false

        switch (type) {
            case 'drifter':
                this.stats = { maxHp: 20, currentHp: 20, moveSpeed: 3.8, damage: 16, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'screecher':
                this.stats = { maxHp: 10, currentHp: 10, moveSpeed: 5.0, damage: 12, xpValue: 1 }
                this.radius = 0.25
                break;
            case 'bruiser':
                this.stats = { maxHp: 78, currentHp: 78, moveSpeed: 2.2, damage: 20, xpValue: 3 }
                this.radius = 0.55
                break;
            case 'zmora':
                this.stats = { maxHp: 16, currentHp: 16, moveSpeed: 4.0, damage: 12, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'domovoi':
                this.stats = { maxHp: 5, currentHp: 5, moveSpeed: 5.0, damage: 8, xpValue: 1 }
                this.radius = 0.15
                break;
            case 'kikimora':
                // Trap enemy: places slowing webs on death (existing) + periodically drops webs
                this.stats = { maxHp: 33, currentHp: 33, moveSpeed: 2.8, damage: 15, xpValue: 2 }
                this.radius = 0.4
                break;
            case 'leshy':
                this.stats = { maxHp: 650, currentHp: 650, moveSpeed: 1.8, damage: 40, xpValue: 10 }
                this.radius = 1.2
                break;
            case 'vodnik':
                // Aquatic: pulls player at intervals
                this.stats = { maxHp: 16, currentHp: 16, moveSpeed: 3.0, damage: 8, xpValue: 2, isRanged: true }
                this.radius = 0.35
                break;
            case 'werewolf':
                this.stats = { maxHp: 120, currentHp: 120, moveSpeed: 4.2, damage: 25, xpValue: 5 }
                this.radius = 0.45
                break;
            case 'forest_wraith':
                // Wraith: weakens player attacks via proximity aura
                this.stats = { maxHp: 200, currentHp: 200, moveSpeed: 3.5, damage: 30, xpValue: 8, isRanged: true }
                this.radius = 0.5
                this.providesWeakenAura = true
                this.weakenAuraRadius = 6.0
                this.weakenFactor = 0.7
                break;
            case 'guardian_golem':
                this.stats = { maxHp: 800, currentHp: 800, moveSpeed: 2.0, damage: 50, xpValue: 20 }
                this.radius = 1.0
                break;
            case 'sapling':
                this.stats = { maxHp: 10, currentHp: 10, moveSpeed: 3.2, damage: 12, xpValue: 1 };
                this.radius = 0.2;
                break;
            case 'tox_shroom':
                this.stats = { maxHp: 32, currentHp: 32, moveSpeed: 0, damage: 15, xpValue: 2 };
                this.radius = 0.4;
                break;
            case 'stone_golem':
                // Golem: periodic ground slam knockback
                this.stats = { maxHp: 130, currentHp: 130, moveSpeed: 1.5, damage: 30, xpValue: 5 };
                this.radius = 0.8;
                break;
            case 'spirit_wolf':
                this.stats = { maxHp: 52, currentHp: 52, moveSpeed: 5.5, damage: 20, xpValue: 3 };
                this.radius = 0.35;
                this.canPhaseThrough = true;
                break;
            case 'leshy_shaman':
                // Shaman: heals nearby enemies + buff aura
                this.stats = { maxHp: 78, currentHp: 78, moveSpeed: 2.5, damage: 25, xpValue: 4, isRanged: true };
                this.radius = 0.4;
                this.providesBuffAura = true;
                this.providesHealAura = true;
                this.healAuraRadius = 6.0;
                break;
            case 'ancient_treant':
                this.stats = { maxHp: 3250, currentHp: 3250, moveSpeed: 1.0, damage: 60, xpValue: 100 };
                this.radius = 1.5;
                break;
            case 'wasp_swarm':
                this.stats = { maxHp: 65, currentHp: 65, moveSpeed: 5.5, damage: 10, xpValue: 3 };
                this.radius = 0.3;
                break;
            case 'golem_destroyer':
                this.stats = { maxHp: 5200, currentHp: 5200, moveSpeed: 2.0, damage: 75, xpValue: 150 };
                this.radius = 1.3;
                break;
            case 'shadow_stalker':
                this.stats = { maxHp: 97, currentHp: 97, moveSpeed: 5.5, damage: 35, xpValue: 6 };
                this.radius = 0.3;
                break;
            case 'chernobog':
                this.stats = { maxHp: 19500, currentHp: 19500, moveSpeed: 3.0, damage: 100, xpValue: 1000 };
                this.radius = 2.0;
                break;
            case 'frost_bat':
                this.stats = { maxHp: 15, currentHp: 15, moveSpeed: 5.5, damage: 8, xpValue: 1 };
                this.radius = 0.2;
                break;
            case 'bone_crawler':
                // Trap enemy: places slowing webs periodically
                this.stats = { maxHp: 45, currentHp: 45, moveSpeed: 3.0, damage: 22, xpValue: 2 };
                this.radius = 0.35;
                break;
            case 'flame_wraith':
                // Wraith: weakens player via proximity aura
                this.stats = { maxHp: 70, currentHp: 70, moveSpeed: 5.0, damage: 28, xpValue: 3 };
                this.radius = 0.35;
                this.providesWeakenAura = true;
                this.weakenAuraRadius = 4.0;
                this.weakenFactor = 0.75;
                break;
            case 'crypt_guardian':
                this.stats = { maxHp: 12000, currentHp: 12000, moveSpeed: 1.8, damage: 80, xpValue: 200 };
                this.radius = 1.2;
                break;
            case 'frost_elemental':
                // Ice enemy: creates slippery patches
                this.stats = { maxHp: 55, currentHp: 55, moveSpeed: 4.0, damage: 22, xpValue: 2 };
                this.radius = 0.4;
                break;
            case 'snow_wraith':
                // Wraith: weakens player attacks + phases through
                this.stats = { maxHp: 180, currentHp: 180, moveSpeed: 5.5, damage: 48, xpValue: 5 };
                this.radius = 0.45;
                this.canPhaseThrough = true;
                this.providesWeakenAura = true;
                this.weakenAuraRadius = 5.0;
                this.weakenFactor = 0.65;
                break;
            case 'ice_golem':
                this.stats = { maxHp: 7000, currentHp: 7000, moveSpeed: 1.5, damage: 65, xpValue: 150 };
                this.radius = 1.1;
                break;
            case 'blizzard_wolf':
                this.stats = { maxHp: 35, currentHp: 35, moveSpeed: 5.5, damage: 16, xpValue: 2 };
                this.radius = 0.3;
                break;
        }
    }

    spawn(type: EnemyType, x: number, z: number, isElite: boolean = false, difficultyMultiplier: number = 1.0, isSuperEnemy: boolean = false, combinedHp: number = 0) {
        this.type = type
        this.isBoss = BOSS_TYPES.has(type)
        this.isSuperEnemy = isSuperEnemy
        this.combinedHp = combinedHp
        this.position.set(x, 0, z)
        this.isActive = true
        this.isInvulnerable = false
        this.isElite = isElite
        this.flickerTimer = 0
        this.isEnraged = false
        this.fleeFromPlayer = false
        this.fleeZigzagTimer = 0
        this.pullWarningActive = false
        this.pullWarningTimer = 0

        this.setStatsByType(type)

        if (difficultyMultiplier !== 1.0) {
            this.stats.maxHp *= difficultyMultiplier
            this.stats.currentHp = this.stats.maxHp
            this.stats.damage *= difficultyMultiplier
            if (difficultyMultiplier > 1.0) {
                this.stats.xpValue *= (1 + (difficultyMultiplier - 1) * 0.5)
            }
        }

        if (isElite) {
            this.stats.maxHp *= 4
            this.stats.currentHp = this.stats.maxHp
            this.stats.damage *= 2
            this.stats.xpValue *= 2.0
        }

        // Super enemy: use combined HP, flat 3 XP
        if (isSuperEnemy && combinedHp > 0) {
            this.stats.maxHp = combinedHp
            this.stats.currentHp = combinedHp
            this.stats.xpValue = 3
            this.radius *= 2 // Double collision radius
        }

        // Initialize boss phase system
        this.baseMoveSpeed = this.stats.moveSpeed
        this.baseDamage = this.stats.damage
        const phaseConfig = BOSS_PHASE_CONFIGS[type]
        if (phaseConfig && this.isBoss) {
            this.bossPhaseState = new BossPhaseState(phaseConfig)
        } else {
            this.bossPhaseState = null
        }

        // Boss mesh
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            this.mesh.visible = true
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            mat.opacity = (this.type === 'zmora' || this.type === 'spirit_wolf') ? 0.6 : 1.0
        }

        // Googly eyes — account for boss mesh scale
        if (this.googlyEyes) {
            this.googlyEyes.setVisible(true)
            const meshScale = this.mesh ? this.mesh.scale.y : 1
            const localHalfHeight = (this.radius > 0.4) ? (0.4 + this.radius) : this.radius
            this.googlyEyes.update(this.position, this.velocity, this.radius + localHalfHeight * meshScale)
        }

        // 3D model
        if (this.characterModelManager && this.modelInstanceId) {
            this.characterModelManager.setInstanceVisible(this.modelInstanceId, true)
            // Apply elite/super enemy visual effects
            if (isSuperEnemy) {
                this.characterModelManager.setInstanceGlow(this.modelInstanceId, 0xffd700, 0.8) // Gold glow
                const baseScale = 0.4 + (this.radius * 1.2)
                this.characterModelManager.setInstanceScale(this.modelInstanceId, baseScale * 2)
            } else if (isElite) {
                this.characterModelManager.setInstanceGlow(this.modelInstanceId, 0xffd700, 0.5) // Gold glow
                const baseScale = 0.4 + (this.radius * 1.2)
                this.characterModelManager.setInstanceScale(this.modelInstanceId, baseScale * 1.5)
            } else {
                this.characterModelManager.clearInstanceTint(this.modelInstanceId)
                const baseScale = 0.4 + (this.radius * 1.2)
                this.characterModelManager.setInstanceScale(this.modelInstanceId, baseScale)
            }
        }

        // Sprite mode
        if (this.entitySprite) {
            this.entitySprite.sprite.sprite.visible = true
            this.entitySprite.sprite.shadow.visible = true
        }

    }

    update(
        deltaTime: number,
        player: Player,
        spawnProjectile?: (x: number, z: number, vx: number, vz: number, damage: number, appliesSlow?: boolean, appliesCurse?: boolean) => void,
        spawnEnemy?: (type: EnemyType, x: number, z: number) => void,
        createMeleeSwing?: (x: number, z: number, facingAngle: number, damage: number, radius: number) => void,
        spawnObstacle?: (x: number, z: number, radius: number, duration: number) => void,
        rng?: { next: () => number },
        spawnHazardZone?: (x: number, z: number, type: string, radius: number, duration: number, damage: number) => void
    ) {
        if (!this.isActive) return

        // Update hit flash timer
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaTime
        }

        // Update boss flash timer (Chernobog ability visual)
        if (this.bossFlashTimer > 0) {
            this.bossFlashTimer -= deltaTime
            if (this.bossFlashTimer <= 0 && this.mesh) {
                const mat = this.mesh.material as THREE.MeshStandardMaterial
                mat.emissive.setHex(0x000000)
                mat.emissiveIntensity = 0
            }
        }

        // Ghost flicker
        if (this.type === 'zmora' || this.type === 'forest_wraith') {
            this.flickerTimer += deltaTime
            const flickerInterval = this.type === 'forest_wraith' ? 1.5 : 2.0
            if (this.flickerTimer >= flickerInterval) {
                this.flickerTimer = 0
                this.isInvulnerable = !this.isInvulnerable
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.opacity = this.isInvulnerable ? 0.2 : (this.type === 'forest_wraith' ? 0.4 : 0.6)
                }
            }
        }

        // Boss phase system - handles all boss abilities via BossPhaseManager
        if (this.isBoss && this.bossPhaseState && rng && spawnProjectile && spawnEnemy && createMeleeSwing && spawnObstacle) {
            const hpPercent = this.stats.currentHp / this.stats.maxHp
            const hazardFn = spawnHazardZone || ((_x: number, _z: number, _t: string, _r: number, _d: number, _dmg: number) => {})
            const ctx: BossAbilityContext = {
                bossX: this.position.x,
                bossZ: this.position.z,
                playerX: player.position.x,
                playerZ: player.position.z,
                bossDamage: this.baseDamage,
                bossRadius: this.radius,
                spawnEnemy,
                spawnProjectile,
                createMeleeSwing,
                spawnObstacle,
                spawnHazardZone: hazardFn,
                rng
            }

            // Check for phase transition
            const transitioned = this.bossPhaseState.checkPhaseTransition(hpPercent, ctx)
            if (transitioned && this.mesh) {
                const phase = this.bossPhaseState.getCurrentPhase()
                if (phase.emissiveColor !== undefined) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(phase.emissiveColor)
                    mat.emissiveIntensity = phase.emissiveIntensity || 0.5
                }
            }

            // Apply phase multipliers
            const phase = this.bossPhaseState.getCurrentPhase()
            this.stats.moveSpeed = this.baseMoveSpeed * phase.moveSpeedMultiplier
            this.stats.damage = this.baseDamage * phase.damageMultiplier

            // Update abilities
            this.bossPhaseState.update(deltaTime, ctx)
        }

        // Golem Destroyer charge (kept separate since it modifies movement directly)
        if (this.type === 'golem_destroyer') {
            this.chargeCooldown -= deltaTime
            if (this.isCharging) {
                this.chargeDuration -= deltaTime
                if (this.chargeDuration <= 0) {
                    this.isCharging = false
                    if (this.mesh) {
                        const mat = this.mesh.material as THREE.MeshStandardMaterial
                        mat.emissive.setHex(this.bossPhaseState?.getCurrentPhase().emissiveColor || 0x000000)
                        mat.emissiveIntensity = this.bossPhaseState?.getCurrentPhase().emissiveIntensity || 0
                    }
                }
            } else if (this.chargeCooldown <= 0) {
                const chargeCd = this.bossPhaseState && this.bossPhaseState.currentPhaseIndex > 0 ? 4.0 : 7.0
                this.chargeCooldown = chargeCd
                this.isCharging = true
                this.chargeDuration = 2.0
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 0.6
                }
            }
        }

        // Shadow Stalker dash
        if (this.type === 'shadow_stalker') {
            this.dashCooldown -= deltaTime
            if (this.isDashing) {
                this.dashDuration -= deltaTime
                if (this.dashDuration <= 0) {
                    this.isDashing = false
                    if (this.mesh) {
                        const mat = this.mesh.material as THREE.MeshStandardMaterial
                        mat.opacity = 1.0
                        mat.transparent = false
                    }
                } else {
                    const dx = this.dashTargetX - this.position.x
                    const dz = this.dashTargetZ - this.position.z
                    const dist = Math.sqrt(dx * dx + dz * dz)
                    if (dist > 0.5) {
                        this.velocity.x = (dx / dist) * this.stats.moveSpeed * 3
                        this.velocity.z = (dz / dist) * this.stats.moveSpeed * 3
                    } else {
                        this.isDashing = false
                        if (this.mesh) {
                            const mat = this.mesh.material as THREE.MeshStandardMaterial
                            mat.opacity = 1.0
                            mat.transparent = false
                        }
                    }
                }
            } else if (this.dashDelayTimer > 0) {
                this.dashDelayTimer -= deltaTime
                if (this.dashDelayTimer <= 0) {
                    this.isDashing = true
                    this.dashDuration = 0.5
                }
            } else if (this.dashCooldown <= 0) {
                this.dashCooldown = 5.0
                this.dashTargetX = player.position.x
                this.dashTargetZ = player.position.z
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.opacity = 0.1
                    mat.transparent = true
                }
                this.dashDelayTimer = 0.5
            }
        }

        // Werewolf heal + enrage
        if (this.type === 'werewolf') {
            const hpPercent = this.stats.currentHp / this.stats.maxHp
            if (hpPercent < 0.3 && !this.isEnraged) {
                this.isEnraged = true
                this.stats.damage *= 1.5
                this.stats.moveSpeed *= 1.3
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 0.5
                }
            }
            this.healCooldown -= deltaTime
            if (this.healCooldown <= 0 && this.stats.currentHp < this.stats.maxHp) {
                this.healCooldown = 4.0
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + this.stats.maxHp * 0.1)
            }
        }

        // Stone Golem ground slam (knockback player)
        if (this.type === 'stone_golem' && createMeleeSwing) {
            this.slamCooldown -= deltaTime
            if (this.slamCooldown <= 0) {
                this.slamCooldown = 8.0
                const dx = player.position.x - this.position.x
                const dz = player.position.z - this.position.z
                const dist = Math.sqrt(dx * dx + dz * dz)
                if (dist < 5.0) {
                    createMeleeSwing(this.position.x, this.position.z, Math.atan2(dz, dx), this.stats.damage * 1.2, 3.5)
                    // Knockback: push player away
                    if (dist > 0.1) {
                        player.position.x += (dx / dist) * 4
                        player.position.z += (dz / dist) * 4
                    }
                }
            }
        }

        // Kikimora/Bone Crawler: periodically drop slowing web traps
        if ((this.type === 'kikimora' || this.type === 'bone_crawler') && spawnHazardZone) {
            this.trapCooldown -= deltaTime
            if (this.trapCooldown <= 0) {
                this.trapCooldown = this.type === 'kikimora' ? 10.0 : 8.0
                spawnHazardZone(this.position.x, this.position.z, 'slow', 2.0, 6.0, 0)
            }
        }

        // Vodnik: telegraph then pull player toward self
        if (this.type === 'vodnik') {
            if (this.pullWarningActive) {
                this.pullWarningTimer -= deltaTime
                if (this.pullWarningTimer <= 0) {
                    this.pullWarningActive = false
                    const dx = this.position.x - player.position.x
                    const dz = this.position.z - player.position.z
                    const dist = Math.sqrt(dx * dx + dz * dz)
                    if (dist < 12.0 && dist > 1.0 && !player.isPulled) {
                        const pullStrength = Math.min(2.0, dist * 0.3)
                        const targetX = player.position.x + (dx / dist) * pullStrength
                        const targetZ = player.position.z + (dz / dist) * pullStrength
                        player.startPull(targetX, targetZ)
                    }
                }
            } else {
                this.pullCooldown -= deltaTime
                if (this.pullCooldown <= 0) {
                    this.pullCooldown = 6.0
                    const dx = this.position.x - player.position.x
                    const dz = this.position.z - player.position.z
                    const dist = Math.sqrt(dx * dx + dz * dz)
                    if (dist < 12.0 && dist > 1.0) {
                        this.pullWarningActive = true
                        this.pullWarningTimer = 0.8
                    }
                }
            }
        }

        // Frost Elemental: create icy slow patches
        if (this.type === 'frost_elemental' && spawnHazardZone) {
            this.icePatchCooldown -= deltaTime
            if (this.icePatchCooldown <= 0) {
                this.icePatchCooldown = 7.0
                spawnHazardZone(this.position.x, this.position.z, 'slow', 2.5, 8.0, 0)
            }
        }

        // Flee AI (treasure goblin): orbit around player, staying in vicinity
        if (this.fleeFromPlayer) {
            const dx = this.position.x - player.position.x
            const dz = this.position.z - player.position.z
            const dist = Math.sqrt(dx * dx + dz * dz)
            const idealDist = 8.0 // Stay roughly 8 units from player
            const maxDist = 12.0

            this.fleeZigzagTimer += deltaTime

            // Tangent direction (orbit around player)
            const tangentX = -dz
            const tangentZ = dx
            const tangentLen = Math.sqrt(tangentX * tangentX + tangentZ * tangentZ) || 1
            let moveX = tangentX / tangentLen
            let moveZ = tangentZ / tangentLen

            // Flip orbit direction periodically for unpredictability
            if (Math.sin(this.fleeZigzagTimer * 1.5) < 0) {
                moveX = -moveX
                moveZ = -moveZ
            }

            // Radial correction: push away if too close, pull back if too far
            if (dist > 0.1) {
                const radialX = dx / dist
                const radialZ = dz / dist
                if (dist < idealDist - 2) {
                    // Too close — add outward push
                    moveX += radialX * 0.6
                    moveZ += radialZ * 0.6
                } else if (dist > maxDist) {
                    // Too far — pull back toward player
                    moveX -= radialX * 0.8
                    moveZ -= radialZ * 0.8
                }
            }

            const len = Math.sqrt(moveX * moveX + moveZ * moveZ) || 1
            this.velocity.set((moveX / len) * this.stats.moveSpeed, 0, (moveZ / len) * this.stats.moveSpeed)
        }
        // Ranged AI
        else if (this.stats.isRanged && spawnProjectile) {
            const dist = this.position.distanceTo(player.position)
            this.flickerTimer += deltaTime
            if (dist < 8.0) {
                this.velocity.set(0, 0, 0)
                if (this.flickerTimer > 2.0) {
                    this.flickerTimer = 0
                    const dir = player.position.clone().sub(this.position).normalize()
                    const appliesSlow = this.type === 'vodnik'
                    const appliesCurse = this.type === 'forest_wraith'
                    spawnProjectile(this.position.x, this.position.z, dir.x * 10, dir.z * 10, this.stats.damage, appliesSlow, appliesCurse)
                }
            } else {
                const direction = new THREE.Vector3()
                direction.subVectors(player.position, this.position).normalize()
                this.velocity.copy(direction).multiplyScalar(this.stats.moveSpeed)
            }
        } else {
            const direction = new THREE.Vector3()
            direction.subVectors(player.position, this.position).normalize()
            const speedMultiplier = this.isCharging ? this.chargeSpeedMultiplier : 1.0
            this.velocity.copy(direction).multiplyScalar(this.stats.moveSpeed * speedMultiplier)
        }

        this.position.x += this.velocity.x * deltaTime
        this.position.z += this.velocity.z * deltaTime

        // 3D model updates handled by EntityManager.update3DModels() for performance
        // Update boss mesh position and hit flash (bosses use individual meshes)
        if (this.mesh && this.isBoss) {
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            // Apply hit flash effect
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            if (this.hitFlashTimer > 0) {
                mat.emissive.setHex(0xffffff)
                mat.emissiveIntensity = 0.8
            } else if (!this.isEnraged) {
                mat.emissive.setHex(0x000000)
                mat.emissiveIntensity = 0
            }
        }

        // Update googly eyes — account for boss mesh scale
        if (this.googlyEyes && this.isActive) {
            const meshScale = this.mesh ? this.mesh.scale.y : 1
            const localHalfHeight = (this.radius > 0.4) ? (0.4 + this.radius) : this.radius
            this.googlyEyes.update(this.position, this.velocity, this.radius + localHalfHeight * meshScale)
        }
    }

    // 3D model updates are now handled in batch by EntityManager.update3DModels()
    // This method is kept for backwards compatibility but does nothing
    update3DModel(_deltaTime: number): void {
        // No-op: batch updates in EntityManager handle this now
    }

    updateSprite(deltaTime: number, cameraPos: THREE.Vector3, spriteSystem: SpriteSystem): void {
        if (!this.useSpriteMode || !this.entitySprite || !spriteSystem || !this.isActive) return
        const isMoving = this.velocity.length() > 0.1
        const state = this.stats.currentHp <= 0 ? 'die' : (isMoving ? 'walk' : 'idle')
        spriteSystem.updateEntity(
            this.entitySprite,
            state,
            new THREE.Vector3(this.position.x, this.radius, this.position.z),
            cameraPos,
            deltaTime
        )
        if (this.type === 'zmora' || this.type === 'forest_wraith') {
            this.entitySprite.sprite.material.opacity = this.isInvulnerable ? 0.2 : (this.type === 'forest_wraith' ? 0.7 : 0.8)
        }
    }

    takeDamage(amount: number, vfx?: VFXManager): boolean {
        if (this.isInvulnerable) return false
        this.stats.currentHp -= amount
        this.hitFlashTimer = 0.1 // Flash white for 100ms
        if (vfx) {
            vfx.createDamageNumber(this.position.x, this.position.z, amount)
        }
        if (this.stats.currentHp <= 0) {
            this.die()
            return true
        }
        return false
    }

    die(skipXpDrop: boolean = false) {
        if (!this.isActive) return
        this.isActive = false

        if (this.mesh) this.mesh.visible = false
        if (this.googlyEyes) this.googlyEyes.setVisible(false)
        if (this.entitySprite) {
            this.entitySprite.sprite.sprite.visible = false
            this.entitySprite.sprite.shadow.visible = false
        }
        if (this.characterModelManager && this.modelInstanceId) {
            this.characterModelManager.setInstanceVisible(this.modelInstanceId, false)
        }
        if (this.onDie && !skipXpDrop) {
            this.onDie(this.position.x, this.position.z, this.stats.xpValue)
        }
    }

    /**
     * Create visuals. Boss enemies get individual 3D meshes + googly eyes.
     * Regular enemies skip mesh creation (rendered via InstancedRenderer).
     */
    createMesh(scene: THREE.Scene, color = 0xff4444, spriteSystem?: SpriteSystem, characterModelManager?: CharacterModelManager, instanceId?: string): THREE.Mesh | null {
        // 3D model mode for non-boss enemies
        if (this.use3DModel && characterModelManager && instanceId && !this.isBoss) {
            this.characterModelManager = characterModelManager
            this.modelInstanceId = instanceId

            // Scale based on radius - smaller enemies are smaller models
            // Base scale around 0.5, adjusted by radius (typical radius is 0.3)
            const scale = 0.4 + (this.radius * 1.2)

            // Use the enemy's color as flat color material
            this.characterInstance = characterModelManager.createInstance(instanceId, scale, color, false)
            if (this.characterInstance) {
                this.characterInstance.model.visible = this.isActive
                return null
            }
            this.use3DModel = false
        }

        // Boss enemies: individual 3D mesh with shadows + googly eyes
        if (this.isBoss) {
            let geometry: THREE.BufferGeometry
            if (this.radius > 0.4) {
                geometry = new THREE.CapsuleGeometry(this.radius, 0.8, 4, 8)
            } else {
                geometry = new THREE.SphereGeometry(this.radius, 16, 16)
            }

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.7,
                metalness: 0.3
            })

            this.mesh = new THREE.Mesh(geometry, material)
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            this.mesh.castShadow = true
            this.mesh.receiveShadow = true
            this.mesh.visible = this.isActive
            scene.add(this.mesh)

            // Googly eyes for bosses
            const eyeConfig = this.getBossEyeConfig()
            if (eyeConfig) {
                this.googlyEyes = new GooglyEyes(scene, eyeConfig.scale, eyeConfig.expression)
                this.googlyEyes.setVisible(this.isActive)
            }
        }

        return this.mesh
    }
}
