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
        switch (type) {
            case 'drifter':
                this.stats = { maxHp: 20, currentHp: 20, moveSpeed: 3.8, damage: 16, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'screecher':
                this.stats = { maxHp: 10, currentHp: 10, moveSpeed: 5.8, damage: 12, xpValue: 1 }
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
                this.stats = { maxHp: 33, currentHp: 33, moveSpeed: 2.8, damage: 15, xpValue: 2 }
                this.radius = 0.4
                break;
            case 'leshy':
                this.stats = { maxHp: 650, currentHp: 650, moveSpeed: 1.8, damage: 40, xpValue: 10 }
                this.radius = 1.2
                break;
            case 'vodnik':
                this.stats = { maxHp: 16, currentHp: 16, moveSpeed: 3.0, damage: 8, xpValue: 2, isRanged: true }
                this.radius = 0.35
                break;
            case 'werewolf':
                this.stats = { maxHp: 120, currentHp: 120, moveSpeed: 4.8, damage: 25, xpValue: 5 }
                this.radius = 0.45
                break;
            case 'forest_wraith':
                this.stats = { maxHp: 200, currentHp: 200, moveSpeed: 3.5, damage: 30, xpValue: 8, isRanged: true }
                this.radius = 0.5
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
                this.stats = { maxHp: 130, currentHp: 130, moveSpeed: 1.5, damage: 30, xpValue: 5 };
                this.radius = 0.8;
                break;
            case 'spirit_wolf':
                this.stats = { maxHp: 52, currentHp: 52, moveSpeed: 6.0, damage: 20, xpValue: 3 };
                this.radius = 0.35;
                this.canPhaseThrough = true;
                break;
            case 'leshy_shaman':
                this.stats = { maxHp: 78, currentHp: 78, moveSpeed: 2.5, damage: 25, xpValue: 4, isRanged: true };
                this.radius = 0.4;
                this.providesBuffAura = true;
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
                this.stats = { maxHp: 97, currentHp: 97, moveSpeed: 7.0, damage: 35, xpValue: 6 };
                this.radius = 0.3;
                break;
            case 'chernobog':
                this.stats = { maxHp: 19500, currentHp: 19500, moveSpeed: 3.0, damage: 100, xpValue: 1000 };
                this.radius = 2.0;
                break;
            case 'frost_bat':
                this.stats = { maxHp: 15, currentHp: 15, moveSpeed: 7.0, damage: 8, xpValue: 1 };
                this.radius = 0.2;
                break;
            case 'bone_crawler':
                this.stats = { maxHp: 45, currentHp: 45, moveSpeed: 3.0, damage: 22, xpValue: 2 };
                this.radius = 0.35;
                break;
            case 'flame_wraith':
                this.stats = { maxHp: 70, currentHp: 70, moveSpeed: 5.0, damage: 28, xpValue: 3 };
                this.radius = 0.35;
                break;
            case 'crypt_guardian':
                this.stats = { maxHp: 12000, currentHp: 12000, moveSpeed: 1.8, damage: 80, xpValue: 200 };
                this.radius = 1.2;
                break;
            case 'frost_elemental':
                this.stats = { maxHp: 55, currentHp: 55, moveSpeed: 4.0, damage: 22, xpValue: 2 };
                this.radius = 0.4;
                break;
            case 'snow_wraith':
                this.stats = { maxHp: 180, currentHp: 180, moveSpeed: 5.5, damage: 48, xpValue: 5 };
                this.radius = 0.45;
                this.canPhaseThrough = true;
                break;
            case 'ice_golem':
                this.stats = { maxHp: 7000, currentHp: 7000, moveSpeed: 1.5, damage: 65, xpValue: 150 };
                this.radius = 1.1;
                break;
            case 'blizzard_wolf':
                this.stats = { maxHp: 35, currentHp: 35, moveSpeed: 6.5, damage: 16, xpValue: 2 };
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

        // Super enemy: use combined HP and 5x XP
        if (isSuperEnemy && combinedHp > 0) {
            this.stats.maxHp = combinedHp
            this.stats.currentHp = combinedHp
            this.stats.xpValue *= 5
            this.radius *= 2 // Double collision radius
        }

        // Boss mesh
        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            this.mesh.visible = true
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            mat.opacity = (this.type === 'zmora' || this.type === 'spirit_wolf') ? 0.6 : 1.0
        }

        // Googly eyes
        if (this.googlyEyes) {
            this.googlyEyes.setVisible(true)
            this.googlyEyes.update(this.position, this.velocity, this.radius * 2)
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
        rng?: { next: () => number }
    ) {
        if (!this.isActive) return

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

        // Chernobog abilities
        if (this.type === 'chernobog' && spawnEnemy && spawnProjectile && createMeleeSwing && rng) {
            this.bossAbility1Cooldown -= deltaTime
            if (this.bossAbility1Cooldown <= 0) {
                this.bossAbility1Cooldown = 15.0
                const minionTypes: EnemyType[] = ['drifter', 'screecher', 'domovoi', 'zmora', 'bruiser']
                for (let i = 0; i < 5; i++) {
                    const angle = rng.next() * Math.PI * 2
                    const spawnDist = 3.0
                    const spawnX = this.position.x + Math.cos(angle) * spawnDist
                    const spawnZ = this.position.z + Math.sin(angle) * spawnDist
                    const randomType = minionTypes[Math.floor(rng.next() * minionTypes.length)]
                    spawnEnemy(randomType, spawnX, spawnZ)
                }
            }

            this.bossAbility2Cooldown -= deltaTime
            if (this.bossAbility2Cooldown <= 0) {
                this.bossAbility2Cooldown = 4.0
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2
                    const vx = Math.cos(angle) * 8
                    const vz = Math.sin(angle) * 8
                    spawnProjectile(this.position.x, this.position.z, vx, vz, this.stats.damage * 0.8)
                }
            }

            this.bossAbility3Cooldown -= deltaTime
            if (this.bossAbility3Cooldown <= 0) {
                this.bossAbility3Cooldown = 10.0
                createMeleeSwing(this.position.x, this.position.z, 0, this.stats.damage * 2, 8.0)
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 1.0
                    setTimeout(() => {
                        if (this.mesh) {
                            const mat = this.mesh.material as THREE.MeshStandardMaterial
                            mat.emissive.setHex(0x000000)
                            mat.emissiveIntensity = 0
                        }
                    }, 300)
                }
            }
        }

        // Guardian Golem walls
        if (this.type === 'guardian_golem' && spawnObstacle) {
            this.wallCooldown -= deltaTime
            if (this.wallCooldown <= 0) {
                this.wallCooldown = 10.0
                const dirToPlayer = player.position.clone().sub(this.position).normalize()
                const angle = Math.atan2(dirToPlayer.z, dirToPlayer.x)
                for (let i = 0; i < 5; i++) {
                    const wallAngle = angle + (i - 2) * (Math.PI / 6)
                    const wallX = player.position.x + Math.cos(wallAngle) * 4.0
                    const wallZ = player.position.z + Math.sin(wallAngle) * 4.0
                    spawnObstacle(wallX, wallZ, 0.8, 8.0)
                }
            }
        }

        // Golem Destroyer charge
        if (this.type === 'golem_destroyer') {
            this.chargeCooldown -= deltaTime
            if (this.isCharging) {
                this.chargeDuration -= deltaTime
                if (this.chargeDuration <= 0) {
                    this.isCharging = false
                    if (this.mesh) {
                        const mat = this.mesh.material as THREE.MeshStandardMaterial
                        mat.emissive.setHex(0x000000)
                        mat.emissiveIntensity = 0
                    }
                }
            } else if (this.chargeCooldown <= 0) {
                this.chargeCooldown = 7.0
                this.isCharging = true
                this.chargeDuration = 2.0
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 0.6
                }
            }
        }

        // Ancient Treant summon + stomp
        if (this.type === 'ancient_treant' && spawnEnemy && createMeleeSwing && rng) {
            this.summonCooldown -= deltaTime
            if (this.summonCooldown <= 0) {
                this.summonCooldown = 8.0
                const angleOffset = rng.next() * Math.PI * 2
                for (let i = 0; i < 3; i++) {
                    const angle = angleOffset + (i * Math.PI * 2 / 3)
                    const spawnX = this.position.x + Math.cos(angle) * 2.5
                    const spawnZ = this.position.z + Math.sin(angle) * 2.5
                    spawnEnemy('sapling', spawnX, spawnZ)
                }
            }
            this.stompCooldown -= deltaTime
            if (this.stompCooldown <= 0) {
                this.stompCooldown = 6.0
                createMeleeSwing(this.position.x, this.position.z, 0, this.stats.damage * 1.5, 4.0)
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
            } else if (this.dashCooldown <= 0) {
                this.dashCooldown = 5.0
                this.dashTargetX = player.position.x
                this.dashTargetZ = player.position.z
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.opacity = 0.1
                    mat.transparent = true
                }
                setTimeout(() => {
                    this.isDashing = true
                    this.dashDuration = 0.5
                }, 500)
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

        // Ranged AI
        if (this.stats.isRanged && spawnProjectile) {
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
        // Update boss mesh position (bosses use individual meshes, not 3D models)
        if (this.mesh && this.isBoss) {
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
        }

        // Update googly eyes
        if (this.googlyEyes && this.isActive) {
            this.googlyEyes.update(this.position, this.velocity, this.radius * 2)
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
