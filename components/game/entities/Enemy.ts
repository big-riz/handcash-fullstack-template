/**
 * Enemy.ts
 * 
 * Base class for all enemies in Slavic Survivors.
 * Handles movement, health, and basic AI (following player).
 */

import * as THREE from 'three'
import { Player } from './Player'
import { VFXManager } from '../systems/VFXManager'
import { SpriteSystem, EntitySprite } from '../core/SpriteSystem'

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
    'sapling' | 'tox_shroom' | 'stone_golem' | 'spirit_wolf' | 'leshy_shaman' | 'ancient_treant' | 'wasp_swarm' | 'golem_destroyer' | 'shadow_stalker' | 'chernobog'


export class Enemy {
    position: THREE.Vector3
    velocity: THREE.Vector3
    radius: number
    stats: EnemyStats
    type: EnemyType

    mesh: THREE.Mesh | null = null
    isActive = false
    onDie: ((x: number, z: number, xp: number) => void) | null = null

    // Sprite rendering (alternative to mesh)
    entitySprite: EntitySprite | null = null
    useSpriteMode: boolean = false

    // Health bar
    private healthBarBg: THREE.Mesh | null = null
    private healthBarFill: THREE.Mesh | null = null
    private healthBarWidth = 0.6

    // Behaviors
    private flickerTimer = 0
    private isInvulnerable = false
    public isElite = false
    private healCooldown = 0
    private isEnraged = false
    public canPhaseThrough = false // For spirit wolf
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
    public providesBuffAura = false // For leshy shaman
    public buffAuraRadius = 6.0
    public isBuffed = false // If this enemy is buffed by a shaman
    private bossAbility1Cooldown = 0 // Chernobog minion summon
    private bossAbility2Cooldown = 0 // Chernobog multi-projectile
    private bossAbility3Cooldown = 0 // Chernobog AoE stomp

    constructor(type: EnemyType = 'drifter') {
        this.position = new THREE.Vector3()
        this.velocity = new THREE.Vector3()
        this.radius = 0.3
        this.type = type

        // Default Stats (1.3x HP multiplier applied)
        this.stats = {
            maxHp: 13,
            currentHp: 13,
            moveSpeed: 3.0,
            damage: 5,
            xpValue: 1
        }

        this.setStatsByType(type)
    }

    private setStatsByType(type: EnemyType) {
        // All HP values multiplied by 1.3x for balance
        switch (type) {
            case 'drifter':
                // Increased damage: contact damage will be 8 (16 * 0.5)
                this.stats = { maxHp: 20, currentHp: 20, moveSpeed: 3.8, damage: 16, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'screecher':
                // Fast flanker with higher damage
                this.stats = { maxHp: 10, currentHp: 10, moveSpeed: 5.8, damage: 12, xpValue: 1 }
                this.radius = 0.25
                break;
            case 'bruiser':
                this.stats = { maxHp: 78, currentHp: 78, moveSpeed: 2.2, damage: 20, xpValue: 3 }
                this.radius = 0.55
                break;
            case 'zmora': // Ghost - flickers invulnerability
                this.stats = { maxHp: 16, currentHp: 16, moveSpeed: 4.0, damage: 12, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'domovoi': // Tiny swarm units - fast and annoying
                this.stats = { maxHp: 5, currentHp: 5, moveSpeed: 5.0, damage: 8, xpValue: 1 }
                this.radius = 0.15
                break;
            case 'kikimora': // Dropping slow patches (implemented in EntityManager)
                this.stats = { maxHp: 33, currentHp: 33, moveSpeed: 2.8, damage: 15, xpValue: 2 }
                this.radius = 0.4
                break;
            case 'leshy': // BOSS - Forest Lord
                this.stats = { maxHp: 650, currentHp: 650, moveSpeed: 1.8, damage: 40, xpValue: 10 }
                this.radius = 1.2
                break;
            case 'vodnik': // Ranged Water Spirit
                this.stats = { maxHp: 16, currentHp: 16, moveSpeed: 3.0, damage: 8, xpValue: 2, isRanged: true }
                this.radius = 0.35
                break;
            case 'werewolf': // Hard Tier 1: Fast & Aggressive
                this.stats = { maxHp: 120, currentHp: 120, moveSpeed: 4.8, damage: 25, xpValue: 5 }
                this.radius = 0.45
                break;
            case 'forest_wraith': // Hard Tier 2: Toughened Ghost with curse
                this.stats = { maxHp: 200, currentHp: 200, moveSpeed: 3.5, damage: 30, xpValue: 8, isRanged: true }
                this.radius = 0.5
                break;
            case 'guardian_golem': // Hard Tier 3: Behemoth
                this.stats = { maxHp: 800, currentHp: 800, moveSpeed: 2.0, damage: 50, xpValue: 20 }
                this.radius = 1.0
                break;
            // --- NEW ENEMY STATS ---
            case 'sapling':
                // Weak but numerous - increased speed and damage
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
                this.canPhaseThrough = true; // Can pass through obstacles
                break;
            case 'leshy_shaman':
                this.stats = { maxHp: 78, currentHp: 78, moveSpeed: 2.5, damage: 25, xpValue: 4, isRanged: true };
                this.radius = 0.4;
                this.providesBuffAura = true; // Buffs nearby enemies
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
            case 'chernobog': // FINAL BOSS
                this.stats = { maxHp: 19500, currentHp: 19500, moveSpeed: 3.0, damage: 100, xpValue: 1000 };
                this.radius = 2.0;
                break;
        }
    }

    spawn(type: EnemyType, x: number, z: number, isElite: boolean = false, difficultyMultiplier: number = 1.0) {
        this.type = type
        this.position.set(x, 0, z)
        this.isActive = true
        this.isInvulnerable = false
        this.isElite = isElite
        this.flickerTimer = 0

        this.setStatsByType(type)

        // Apply dynamic difficulty multiplier
        if (difficultyMultiplier !== 1.0) {
            this.stats.maxHp *= difficultyMultiplier
            this.stats.currentHp = this.stats.maxHp
            this.stats.damage *= difficultyMultiplier
            // Give bonus XP for higher difficulty
            if (difficultyMultiplier > 1.0) {
                this.stats.xpValue *= (1 + (difficultyMultiplier - 1) * 0.5) // +50% XP scaling
            }
        }

        // Boost elite stats (applied after difficulty)
        if (isElite) {
            this.stats.maxHp *= 4
            this.stats.currentHp = this.stats.maxHp
            this.stats.damage *= 2
            this.stats.xpValue *= 2.0 // Increased reward for elites
        }

        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.visible = true
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            mat.opacity = (this.type === 'zmora' || this.type === 'spirit_wolf') ? 0.6 : 1.0
        }

        // Make sprite visible if using sprite mode
        if (this.entitySprite) {
            this.entitySprite.sprite.sprite.visible = true
            this.entitySprite.sprite.shadow.visible = true
        }

        // Reset health bar
        this.updateHealthBar()
        if (this.healthBarBg) this.healthBarBg.visible = true
        if (this.healthBarFill) this.healthBarFill.visible = true
    }


    private updateHealthBar() {
        if (!this.healthBarFill || !this.healthBarBg) return

        const hpPercent = Math.max(0, this.stats.currentHp / this.stats.maxHp)

        // Scale the fill bar based on HP
        this.healthBarFill.scale.x = hpPercent
        // Offset to keep it left-aligned
        this.healthBarFill.position.x = this.position.x - (this.healthBarWidth * (1 - hpPercent)) / 2

        // Color: green (full) -> yellow (half) -> red (low)
        const mat = this.healthBarFill.material as THREE.MeshBasicMaterial
        if (hpPercent > 0.5) {
            // Green to Yellow
            const t = (hpPercent - 0.5) * 2
            mat.color.setRGB(1 - t, 1, 0)
        } else {
            // Yellow to Red
            const t = hpPercent * 2
            mat.color.setRGB(1, t, 0)
        }

        // Position bars above enemy
        const barHeight = this.radius * 2 + 0.4
        this.healthBarBg.position.set(this.position.x, barHeight, this.position.z)
        this.healthBarFill.position.y = barHeight
        this.healthBarFill.position.z = this.position.z
    }

    update(
        deltaTime: number,
        player: Player,
        spawnProjectile?: (x: number, z: number, vx: number, vz: number, damage: number, appliesSlow?: boolean, appliesCurse?: boolean) => void,
        spawnEnemy?: (type: EnemyType, x: number, z: number) => void,
        createMeleeSwing?: (x: number, z: number, facingAngle: number, damage: number, radius: number) => void,
        spawnObstacle?: (x: number, z: number, radius: number, duration: number) => void
    ) {
        if (!this.isActive) return

        // Behavior Logic
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

        // Chernobog: Final Boss with Multiple Abilities
        if (this.type === 'chernobog' && spawnEnemy && spawnProjectile && createMeleeSwing) {
            // Ability 1: Summon Minions
            this.bossAbility1Cooldown -= deltaTime
            if (this.bossAbility1Cooldown <= 0) {
                this.bossAbility1Cooldown = 15.0 // Summon every 15 seconds
                // Spawn 5 random enemies around Chernobog
                const minionTypes: EnemyType[] = ['drifter', 'screecher', 'domovoi', 'zmora', 'bruiser']
                for (let i = 0; i < 5; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const spawnDist = 3.0
                    const spawnX = this.position.x + Math.cos(angle) * spawnDist
                    const spawnZ = this.position.z + Math.sin(angle) * spawnDist
                    const randomType = minionTypes[Math.floor(Math.random() * minionTypes.length)]
                    spawnEnemy(randomType, spawnX, spawnZ)
                }
            }

            // Ability 2: Multi-Projectile Spell (8-way)
            this.bossAbility2Cooldown -= deltaTime
            if (this.bossAbility2Cooldown <= 0) {
                this.bossAbility2Cooldown = 4.0 // Cast every 4 seconds
                // Shoot 8 projectiles in all directions
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2
                    const vx = Math.cos(angle) * 8
                    const vz = Math.sin(angle) * 8
                    spawnProjectile(this.position.x, this.position.z, vx, vz, this.stats.damage * 0.8)
                }
            }

            // Ability 3: Massive AoE Stomp
            this.bossAbility3Cooldown -= deltaTime
            if (this.bossAbility3Cooldown <= 0) {
                this.bossAbility3Cooldown = 10.0 // Stomp every 10 seconds
                // Create huge AoE attack
                createMeleeSwing(this.position.x, this.position.z, 0, this.stats.damage * 2, 8.0)
                // Visual effect
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

        // Guardian Golem: Create Rock Walls
        if (this.type === 'guardian_golem' && spawnObstacle) {
            this.wallCooldown -= deltaTime
            if (this.wallCooldown <= 0) {
                this.wallCooldown = 10.0 // Create walls every 10 seconds
                // Create a semi-circle of walls around the player to trap them
                const dirToPlayer = player.position.clone().sub(this.position).normalize()
                const angle = Math.atan2(dirToPlayer.z, dirToPlayer.x)
                const wallDistance = 4.0
                const numWalls = 5
                for (let i = 0; i < numWalls; i++) {
                    const wallAngle = angle + (i - 2) * (Math.PI / 6) // Spread walls in arc
                    const wallX = player.position.x + Math.cos(wallAngle) * wallDistance
                    const wallZ = player.position.z + Math.sin(wallAngle) * wallDistance
                    spawnObstacle(wallX, wallZ, 0.8, 8.0) // Wall lasts 8 seconds
                }
            }
        }

        // Golem Destroyer: Charge Attack
        if (this.type === 'golem_destroyer') {
            this.chargeCooldown -= deltaTime

            if (this.isCharging) {
                this.chargeDuration -= deltaTime
                if (this.chargeDuration <= 0) {
                    this.isCharging = false
                    // Reset to normal behavior
                    if (this.mesh) {
                        const mat = this.mesh.material as THREE.MeshStandardMaterial
                        mat.emissive.setHex(0x000000)
                        mat.emissiveIntensity = 0
                    }
                }
                // Movement during charge is handled below in standard movement
            } else if (this.chargeCooldown <= 0) {
                this.chargeCooldown = 7.0 // Charge every 7 seconds
                this.isCharging = true
                this.chargeDuration = 2.0 // Charge lasts 2 seconds
                // Visual indicator
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 0.6
                }
            }
        }

        // Ancient Treant: Summon Saplings and Stomp Attack
        if (this.type === 'ancient_treant' && spawnEnemy && createMeleeSwing) {
            // Summon saplings
            this.summonCooldown -= deltaTime
            if (this.summonCooldown <= 0) {
                this.summonCooldown = 8.0 // Summon every 8 seconds
                // Spawn 3 saplings around the treant
                const angleOffset = Math.random() * Math.PI * 2
                for (let i = 0; i < 3; i++) {
                    const angle = angleOffset + (i * Math.PI * 2 / 3)
                    const spawnDist = 2.5
                    const spawnX = this.position.x + Math.cos(angle) * spawnDist
                    const spawnZ = this.position.z + Math.sin(angle) * spawnDist
                    spawnEnemy('sapling', spawnX, spawnZ)
                }
            }

            // Stomp attack
            this.stompCooldown -= deltaTime
            if (this.stompCooldown <= 0) {
                this.stompCooldown = 6.0 // Stomp every 6 seconds
                // Create large AoE melee swing
                createMeleeSwing(this.position.x, this.position.z, 0, this.stats.damage * 1.5, 4.0)
            }
        }

        // Shadow Stalker: Invisibility and Dash
        if (this.type === 'shadow_stalker') {
            this.dashCooldown -= deltaTime

            if (this.isDashing) {
                // During dash, move rapidly to target
                this.dashDuration -= deltaTime
                if (this.dashDuration <= 0) {
                    this.isDashing = false
                    // Become visible again
                    if (this.mesh) {
                        const mat = this.mesh.material as THREE.MeshStandardMaterial
                        mat.opacity = 1.0
                        mat.transparent = false
                    }
                } else {
                    // Move toward dash target
                    const dx = this.dashTargetX - this.position.x
                    const dz = this.dashTargetZ - this.position.z
                    const dist = Math.sqrt(dx * dx + dz * dz)
                    if (dist > 0.5) {
                        this.velocity.x = (dx / dist) * this.stats.moveSpeed * 3 // 3x speed during dash
                        this.velocity.z = (dz / dist) * this.stats.moveSpeed * 3
                    } else {
                        // Reached target
                        this.isDashing = false
                        if (this.mesh) {
                            const mat = this.mesh.material as THREE.MeshStandardMaterial
                            mat.opacity = 1.0
                            mat.transparent = false
                        }
                    }
                }
            } else if (this.dashCooldown <= 0) {
                // Start new dash cycle
                this.dashCooldown = 5.0 // Dash every 5 seconds
                // Remember player's current position
                this.dashTargetX = player.position.x
                this.dashTargetZ = player.position.z
                // Become invisible
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.opacity = 0.1
                    mat.transparent = true
                }
                // Start dash after brief delay
                setTimeout(() => {
                    this.isDashing = true
                    this.dashDuration = 0.5 // Dash lasts 0.5 seconds
                }, 500)
            }
        }

        // Werewolf: Heal and Enrage
        if (this.type === 'werewolf') {
            const hpPercent = this.stats.currentHp / this.stats.maxHp

            // Enrage when below 30% HP
            if (hpPercent < 0.3 && !this.isEnraged) {
                this.isEnraged = true
                // Boost damage and speed
                this.stats.damage *= 1.5
                this.stats.moveSpeed *= 1.3
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.emissive.setHex(0xff0000)
                    mat.emissiveIntensity = 0.5
                }
            }

            // Heal periodically
            this.healCooldown -= deltaTime
            if (this.healCooldown <= 0 && this.stats.currentHp < this.stats.maxHp) {
                this.healCooldown = 4.0 // Heal every 4 seconds
                const healAmount = this.stats.maxHp * 0.1 // Heal 10% of max HP
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount)
            }
        }

        // Ranged Logic (e.g., Archer)
        if (this.stats.isRanged && spawnProjectile) {
            const dist = this.position.distanceTo(player.position)
            this.flickerTimer += deltaTime // Reuse timer for cooldown

            if (dist < 8.0) {
                // In range, stop and shoot
                this.velocity.set(0, 0, 0)

                if (this.flickerTimer > 2.0) {
                    this.flickerTimer = 0
                    const dir = player.position.clone().sub(this.position).normalize()
                    // Special projectile effects
                    const appliesSlow = this.type === 'vodnik'
                    const appliesCurse = this.type === 'forest_wraith'
                    spawnProjectile(this.position.x, this.position.z, dir.x * 10, dir.z * 10, this.stats.damage, appliesSlow, appliesCurse)
                }
            } else {
                // Chase
                const direction = new THREE.Vector3()
                direction.subVectors(player.position, this.position).normalize()
                this.velocity.copy(direction).multiplyScalar(this.stats.moveSpeed)
            }
        } else {
            // Standard Melee Chaser AI
            const direction = new THREE.Vector3()
            direction.subVectors(player.position, this.position).normalize()
            // Apply charge speed boost if charging
            const speedMultiplier = this.isCharging ? this.chargeSpeedMultiplier : 1.0
            this.velocity.copy(direction).multiplyScalar(this.stats.moveSpeed * speedMultiplier)
        }

        this.position.x += this.velocity.x * deltaTime
        this.position.z += this.velocity.z * deltaTime

        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.position.y = this.radius
        }

        // Update health bar position
        this.updateHealthBar()
    }

    /**
     * Update sprite rendering (if using sprite mode)
     */
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

        // Handle transparency for special enemies
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

        // Update health bar after damage
        this.updateHealthBar()

        if (this.stats.currentHp <= 0) {
            this.die()
            return true
        }
        return false
    }

    die() {
        if (!this.isActive) return
        this.isActive = false
        if (this.mesh) {
            this.mesh.visible = false
        }
        // Hide sprite
        if (this.entitySprite) {
            this.entitySprite.sprite.sprite.visible = false
            this.entitySprite.sprite.shadow.visible = false
        }
        // Hide health bar
        if (this.healthBarBg) this.healthBarBg.visible = false
        if (this.healthBarFill) this.healthBarFill.visible = false

        if (this.onDie) {
            this.onDie(this.position.x, this.position.z, this.stats.xpValue)
        }
    }

    createMesh(scene: THREE.Scene, color = 0xff4444, spriteSystem?: SpriteSystem): THREE.Mesh {
        if (this.useSpriteMode && spriteSystem && spriteSystem.isInitialized()) {
            try {
                this.entitySprite = spriteSystem.createEntity(this.type)
            } catch (error) {
                // Fall back to mesh if sprite not found
                console.warn(`No sprite found for ${this.type}, using mesh instead`)
                this.useSpriteMode = false
            }
        }

        if (this.useSpriteMode && this.entitySprite) {
            scene.add(this.entitySprite.sprite.sprite)
            scene.add(this.entitySprite.sprite.shadow)
            this.entitySprite.sprite.sprite.visible = this.isActive
            this.entitySprite.sprite.shadow.visible = this.isActive
            // Create dummy mesh for health bar positioning
            const dummyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
            const dummyMaterial = new THREE.MeshBasicMaterial({ visible: false })
            this.mesh = new THREE.Mesh(dummyGeometry, dummyMaterial)
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            this.mesh.visible = false
        } else {
            // Use 3D geometry for shadows
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
            // Position mesh so bottom is at y=0 or center is at radius height
            this.mesh.position.set(this.position.x, this.radius, this.position.z)
            this.mesh.castShadow = true
            this.mesh.receiveShadow = true
            this.mesh.visible = this.isActive
            scene.add(this.mesh)
        }

        // Create health bar (background - dark)
        this.healthBarWidth = Math.max(0.4, this.radius * 1.5)
        const barHeight = 0.08
        const bgGeo = new THREE.PlaneGeometry(this.healthBarWidth, barHeight)
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide,
            depthTest: false
        })
        this.healthBarBg = new THREE.Mesh(bgGeo, bgMat)
        this.healthBarBg.rotation.x = -Math.PI / 2
        this.healthBarBg.visible = this.isActive
        this.healthBarBg.renderOrder = 999
        scene.add(this.healthBarBg)

        // Create health bar (fill - green to red)
        const fillGeo = new THREE.PlaneGeometry(this.healthBarWidth, barHeight * 0.8)
        const fillMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide,
            depthTest: false
        })
        this.healthBarFill = new THREE.Mesh(fillGeo, fillMat)
        this.healthBarFill.rotation.x = -Math.PI / 2
        this.healthBarFill.visible = this.isActive
        this.healthBarFill.renderOrder = 1000
        scene.add(this.healthBarFill)

        return this.mesh
    }
}
