import * as THREE from 'three'
import { AudioManager } from '../core/AudioManager'
import { StatusEffect, StatusEffectType } from '../types'
import { SpriteSystem, EntitySprite } from '../core/SpriteSystem'
import { CharacterModelManager, CharacterInstance } from '../core/CharacterModelManager'

export interface PlayerStats {
    maxHp: number
    currentHp: number
    moveSpeed: number
    level: number
    xp: number
    xpToNextLevel: number
    magnet: number
    armor: number
    areaMultiplier: number
    cooldownMultiplier: number
    damageMultiplier: number
    critRate: number
    critDamage: number
    regen: number // HP per second
    luck: number
    amount: number // Additional projectiles
    projectileSpeedMultiplier: number
    durationMultiplier: number
    growth: number // XP Gain
    curse: number // Enemy difficulty
    revivals: number
    rerolls: number
    visionMultiplier: number
    thorns: number // Damage dealt back to attackers (0-1 = percentage of damage taken)
    lifesteal: number // Heal percentage of damage dealt (0-1)
}

export class Player {
    // Transform
    position: THREE.Vector3
    velocity: THREE.Vector3
    radius: number

    // Stats
    stats: PlayerStats

    // Status Effects
    statusEffects: StatusEffect[] = []
    isSlowed = false
    slowFactor = 1.0
    slowTimer = 0
    isCursed = false
    curseMultiplier = 1.0
    curseTimer = 0

    // Movement
    private acceleration = 80
    private deceleration = 60

    // Rendering
    mesh: THREE.Mesh | null = null
    private iframeTimer = 0
    private readonly iframeDuration = 0.35 // Reduced from 0.5 - standing still is more punishing

    // Sprite rendering (alternative to mesh)
    entitySprite: EntitySprite | null = null
    useSpriteMode: boolean = false

    // 3D model rendering
    characterInstance: CharacterInstance | null = null
    use3DModel: boolean = false
    private characterModelManager: CharacterModelManager | null = null

    // Previous position for interpolation
    previousPosition: THREE.Vector3

    // Audio
    private healSoundCooldown = 0
    private audioManager: AudioManager | null

    constructor(x = 0, z = 0, audioManager: AudioManager | null = null) {
        this.position = new THREE.Vector3(x, 0, z)
        this.previousPosition = this.position.clone()
        this.velocity = new THREE.Vector3(0, 0, 0)
        this.radius = 0.5
        this.audioManager = audioManager

        // Initialize stats (base values from GDD)
        this.stats = {
            maxHp: 100,
            currentHp: 100,
            moveSpeed: 8.0,
            level: 1,
            xp: 0,
            xpToNextLevel: 35,
            magnet: 2.5,
            armor: 0,
            areaMultiplier: 1.0,
            cooldownMultiplier: 1.0,
            damageMultiplier: 1.0,
            critRate: 0.05,
            critDamage: 2.0,
            regen: 0,
            luck: 1.0,
            amount: 0,
            projectileSpeedMultiplier: 1.0,
            durationMultiplier: 1.0,
            growth: 1.0,
            curse: 1.0,
            revivals: 1,
            rerolls: 3,
            visionMultiplier: 1.0,
            thorns: 0,
            lifesteal: 0
        }
    }

    update(deltaTime: number, inputX: number, inputZ: number) {
        this.previousPosition.copy(this.position)

        // Update status effects and get modifiers
        const { moveSpeedMod, statMod } = this.updateStatusEffects(deltaTime)

        // Accelerate based on input
        if (inputX !== 0 || inputZ !== 0) {
            this.velocity.x += inputX * this.acceleration * deltaTime
            this.velocity.z += inputZ * this.acceleration * deltaTime
        } else {
            // Decelerate if no input
            const decay = 1 - Math.min(1, this.deceleration * deltaTime)
            this.velocity.multiplyScalar(decay)
            if (this.velocity.length() < 0.1) this.velocity.set(0, 0, 0)
        }

        // Clamp speed (with status effect modifier and slow factor)
        const effectiveMoveSpeed = this.stats.moveSpeed * moveSpeedMod * this.slowFactor
        const currentSpeed = this.velocity.length()
        if (currentSpeed > effectiveMoveSpeed) {
            this.velocity.multiplyScalar(effectiveMoveSpeed / currentSpeed)
        }

        // Update position
        this.position.x += this.velocity.x * deltaTime
        this.position.z += this.velocity.z * deltaTime

        // Update timers
        if (this.iframeTimer > 0) {
            this.iframeTimer -= deltaTime
        }

        // Update slow timer (don't reset if in slow zone - EntityManager handles that)
        if (this.slowTimer > 0) {
            this.slowTimer -= deltaTime
            if (this.slowTimer <= 0) {
                this.isSlowed = false
                this.slowFactor = 1.0
            }
        }

        // Update curse timer
        if (this.curseTimer > 0) {
            this.curseTimer -= deltaTime
            if (this.curseTimer <= 0) {
                this.isCursed = false
                this.curseMultiplier = 1.0
            }
        }

        // Regen/Degeneration logic
        if (this.healSoundCooldown > 0) {
            this.healSoundCooldown -= deltaTime;
        }
        if (this.stats.regen !== 0) {
            const hpBefore = this.stats.currentHp
            if (this.stats.regen > 0 && this.stats.currentHp < this.stats.maxHp) {
                this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + this.stats.regen * deltaTime)
                if (this.stats.currentHp > hpBefore && this.healSoundCooldown <= 0) {
                    this.audioManager?.playPlayerHeal()
                    this.healSoundCooldown = 2.0; // Only play heal sound every 2 seconds
                }
            } else if (this.stats.regen < 0) {
                this.stats.currentHp = Math.max(0, this.stats.currentHp + this.stats.regen * deltaTime)
            }
        }

        // Update 3D model if using model mode
        if (this.use3DModel && this.characterInstance && this.characterModelManager) {
            this.characterModelManager.updateInstance(
                'player',
                new THREE.Vector3(this.position.x, 0, this.position.z),
                this.velocity,
                deltaTime,
                this.stats.moveSpeed
            )

            // Handle iframe flashing and status effects
            if (this.iframeTimer > 0) {
                const flash = Math.floor(Date.now() / 80) % 2 === 0
                if (flash) {
                    this.characterModelManager.setInstanceTint('player', new THREE.Color(0xff0000))
                } else {
                    this.characterModelManager.clearInstanceTint('player')
                }
            } else {
                const statusColor = this.getStatusEffectColor()
                if (statusColor) {
                    this.characterModelManager.setInstanceTint('player', statusColor)
                } else {
                    this.characterModelManager.clearInstanceTint('player')
                }
            }
        }
        // Update mesh position and material if using mesh mode
        else if (this.mesh && !this.useSpriteMode) {
            this.mesh.position.set(this.position.x, 0.5 + this.radius, this.position.z)

            const mat = this.mesh.material as THREE.MeshStandardMaterial
            // Flash red if in iframes
            if (this.iframeTimer > 0) {
                const flash = Math.floor(Date.now() / 80) % 2 === 0
                if (flash) {
                    mat.emissive.set(0xff0000)
                    mat.emissiveIntensity = 0.5
                } else {
                    mat.emissive.set(0x1e40af)
                    mat.emissiveIntensity = 0.1
                }
            } else {
                // Show status effect color if active
                const statusColor = this.getStatusEffectColor()
                if (statusColor) {
                    mat.emissive.copy(statusColor)
                    mat.emissiveIntensity = 0.3
                } else {
                    mat.emissive.set(0x1e40af)
                    mat.emissiveIntensity = 0.1
                }
            }
        }
    }

    /**
     * Update sprite rendering (if using sprite mode)
     */
    updateSprite(deltaTime: number, cameraPos: THREE.Vector3, spriteSystem: SpriteSystem): void {
        if (!this.useSpriteMode || !this.entitySprite || !spriteSystem) return

        // Determine animation state
        const isMoving = this.velocity.length() > 0.1
        const state = isMoving ? 'walk' : 'idle'

        spriteSystem.updateEntity(
            this.entitySprite,
            state,
            new THREE.Vector3(this.position.x, 0.5 + this.radius, this.position.z),
            cameraPos,
            deltaTime
        )

        // Status effect color tinting
        if (this.iframeTimer > 0) {
            // Flash red if in iframes
            const flash = Math.floor(Date.now() / 80) % 2 === 0
            this.entitySprite.sprite.material.color.setHex(flash ? 0xff0000 : 0xffffff)
        } else {
            const statusColor = this.getStatusEffectColor()
            if (statusColor) {
                this.entitySprite.sprite.material.color.copy(statusColor)
            } else {
                this.entitySprite.sprite.material.color.setHex(0xffffff)
            }
        }
    }

    /**
     * Get interpolated position for smooth rendering
     */
    getInterpolatedPosition(alpha: number): THREE.Vector3 {
        return new THREE.Vector3(
            this.previousPosition.x + (this.position.x - this.previousPosition.x) * alpha,
            this.position.y,
            this.previousPosition.z + (this.position.z - this.previousPosition.z) * alpha
        )
    }

    /**
     * Create visual mesh for the player
     */
    createMesh(scene: THREE.Scene, spriteSystem?: SpriteSystem, characterModelManager?: CharacterModelManager): THREE.Mesh {
        // Try 3D model mode first
        if (this.use3DModel && characterModelManager) {
            this.characterModelManager = characterModelManager
            // Player uses original model textures, scale 1.0 for proper size
            this.characterInstance = characterModelManager.createInstance('player', 1.0, undefined, true)
            if (this.characterInstance) {
                // Create dummy mesh for compatibility
                const dummyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
                const dummyMaterial = new THREE.MeshBasicMaterial({ visible: false })
                this.mesh = new THREE.Mesh(dummyGeometry, dummyMaterial)
                this.mesh.visible = false
                return this.mesh
            }
            console.warn('Failed to create player 3D model, falling back')
            this.use3DModel = false
        }

        if (this.useSpriteMode && spriteSystem && spriteSystem.isInitialized()) {
            try {
                this.entitySprite = spriteSystem.createEntity('player')
                scene.add(this.entitySprite.sprite.sprite)
                scene.add(this.entitySprite.sprite.shadow)
                // Create dummy mesh for compatibility
                const dummyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1)
                const dummyMaterial = new THREE.MeshBasicMaterial({ visible: false })
                this.mesh = new THREE.Mesh(dummyGeometry, dummyMaterial)
                this.mesh.position.set(this.position.x, 0.5 + this.radius, this.position.z)
                this.mesh.visible = false
                return this.mesh
            } catch (error) {
                console.warn('Failed to create player sprite, using mesh:', error)
                this.useSpriteMode = false
            }
        }

        const geometry = new THREE.CapsuleGeometry(this.radius, 1, 4, 8)
        const material = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            emissive: 0x1e40af,
            emissiveIntensity: 0.1,
            roughness: 0.5,
            metalness: 0.5
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.set(this.position.x, 0.5 + this.radius, this.position.z)
        this.mesh.castShadow = true
        this.mesh.receiveShadow = true
        scene.add(this.mesh)

        return this.mesh
    }

    /**
     * Handle taking damage
     * Returns the thorn damage to deal back to the attacker (0 if no damage taken)
     */
    takeDamage(amount: number): number {
        if (this.iframeTimer > 0) return 0

        // Apply curse multiplier if cursed
        const cursedAmount = this.isCursed ? amount * this.curseMultiplier : amount
        const actualDamage = Math.max(1, cursedAmount - this.stats.armor)
        this.stats.currentHp -= actualDamage
        this.iframeTimer = this.iframeDuration

        // Calculate thorn damage to return to attacker
        const thornDamage = actualDamage * this.stats.thorns
        return thornDamage
    }

    /**
     * Heal based on damage dealt (lifesteal)
     */
    onDealDamage(damageDealt: number): void {
        if (this.stats.lifesteal <= 0) return

        const healAmount = damageDealt * this.stats.lifesteal
        if (healAmount > 0) {
            this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + healAmount)
        }
    }

    addXp(amount: number) {
        const multipliedXp = amount * (this.stats.growth || 1.0)
        this.stats.xp += multipliedXp
        if (this.stats.xp >= this.stats.xpToNextLevel) {
            this.levelUp()
        }
    }

    private levelUp() {
        this.stats.level++
        this.stats.xp -= this.stats.xpToNextLevel
        this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * 1.18)
    }

    /**
     * Add a status effect to the player
     */
    addStatusEffect(effect: StatusEffect) {
        // Check if the effect already exists
        const existingIndex = this.statusEffects.findIndex(e => e.type === effect.type)

        if (existingIndex !== -1) {
            const existing = this.statusEffects[existingIndex]

            // For bleed, stack it
            if (effect.type === StatusEffectType.BLEED) {
                existing.stacks = (existing.stacks || 1) + 1
                existing.duration = Math.max(existing.duration, effect.duration)
            } else {
                // For other effects, refresh duration
                existing.duration = Math.max(existing.duration, effect.duration)
            }
        } else {
            // Add new effect
            this.statusEffects.push({ ...effect, stacks: effect.stacks || 1 })
        }
    }

    /**
     * Update status effects and apply their effects
     */
    private updateStatusEffects(deltaTime: number) {
        let dotDamage = 0
        let moveSpeedMod = 1.0
        let statMod = 1.0

        for (let i = this.statusEffects.length - 1; i >= 0; i--) {
            const effect = this.statusEffects[i]
            effect.duration -= deltaTime

            // Apply effect
            switch (effect.type) {
                case StatusEffectType.POISON:
                case StatusEffectType.BURN:
                    dotDamage += (effect.damage || 0) * deltaTime
                    break

                case StatusEffectType.BLEED:
                    const stacks = effect.stacks || 1
                    dotDamage += (effect.damage || 0) * stacks * deltaTime
                    break

                case StatusEffectType.SLOW:
                    moveSpeedMod = Math.min(moveSpeedMod, 1 - (effect.slowAmount || 0))
                    break

                case StatusEffectType.FREEZE:
                    moveSpeedMod = 0 // Complete immobilization
                    break

                case StatusEffectType.CURSE:
                    statMod = Math.min(statMod, 1 - (effect.statReduction || 0))
                    break
            }

            // Remove expired effects
            if (effect.duration <= 0) {
                this.statusEffects.splice(i, 1)
            }
        }

        // Apply DOT damage (bypasses iframes and armor)
        if (dotDamage > 0) {
            this.stats.currentHp -= dotDamage
        }

        // Apply movement speed modification
        return { moveSpeedMod, statMod }
    }

    /**
     * Get visual color for status effects (for rendering)
     */
    getStatusEffectColor(): THREE.Color | null {
        if (this.statusEffects.length === 0) return null

        // Priority: Freeze > Burn > Poison > Slow > Curse > Bleed
        if (this.statusEffects.some(e => e.type === StatusEffectType.FREEZE)) {
            return new THREE.Color(0x00BFFF) // Cyan for freeze
        }
        if (this.statusEffects.some(e => e.type === StatusEffectType.BURN)) {
            return new THREE.Color(0xFF4500) // Orange-red for burn
        }
        if (this.statusEffects.some(e => e.type === StatusEffectType.POISON)) {
            return new THREE.Color(0x00FF00) // Green for poison
        }
        if (this.statusEffects.some(e => e.type === StatusEffectType.SLOW)) {
            return new THREE.Color(0x87CEEB) // Sky blue for slow
        }
        if (this.statusEffects.some(e => e.type === StatusEffectType.CURSE)) {
            return new THREE.Color(0x8B008B) // Dark magenta for curse
        }
        if (this.statusEffects.some(e => e.type === StatusEffectType.BLEED)) {
            return new THREE.Color(0xDC143C) // Crimson for bleed
        }

        return null
    }

    dispose() {
        if (this.characterModelManager && this.characterInstance) {
            this.characterModelManager.removeInstance('player')
        }
        if (this.mesh) {
            this.mesh.geometry.dispose()
            if (this.mesh.material instanceof THREE.Material) {
                this.mesh.material.dispose()
            }
        }
    }
}
