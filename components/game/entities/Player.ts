/**
 * Player.ts
 * 
 * Handles player state, movement physics, and basic stats.
 */

import * as THREE from 'three'

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
    greed: number // Gold Gain
    curse: number // Enemy difficulty
    revivals: number
    rerolls: number
    skips: number
    banishes: number
    visionMultiplier: number
}

export class Player {
    // Transform
    position: THREE.Vector3
    velocity: THREE.Vector3
    radius: number

    // Stats
    stats: PlayerStats

    // Movement
    private acceleration = 80
    private deceleration = 60

    // Rendering
    mesh: THREE.Mesh | null = null
    private iframeTimer = 0
    private readonly iframeDuration = 0.5

    // Previous position for interpolation
    previousPosition: THREE.Vector3

    constructor(x = 0, z = 0) {
        this.position = new THREE.Vector3(x, 0, z)
        this.previousPosition = this.position.clone()
        this.velocity = new THREE.Vector3(0, 0, 0)
        this.radius = 0.5

        // Initialize stats (base values from GDD)
        this.stats = {
            maxHp: 100,
            currentHp: 100,
            moveSpeed: 8.0,
            level: 1,
            xp: 0,
            xpToNextLevel: 25,
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
            greed: 1.0,
            curse: 1.0,
            revivals: 0,
            rerolls: 0,
            skips: 0,
            banishes: 0,
            visionMultiplier: 1.0
        }
    }

    update(deltaTime: number, inputX: number, inputZ: number) {
        this.previousPosition.copy(this.position)

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

        // Clamp speed
        const currentSpeed = this.velocity.length()
        if (currentSpeed > this.stats.moveSpeed) {
            this.velocity.multiplyScalar(this.stats.moveSpeed / currentSpeed)
        }

        // Update position
        this.position.x += this.velocity.x * deltaTime
        this.position.z += this.velocity.z * deltaTime

        // Update timers
        if (this.iframeTimer > 0) {
            this.iframeTimer -= deltaTime
        }

        // Regen logic (passive)
        if (this.stats.regen > 0 && this.stats.currentHp < this.stats.maxHp) {
            this.stats.currentHp = Math.min(this.stats.maxHp, this.stats.currentHp + this.stats.regen * deltaTime)
        }

        // Update mesh position if it exists
        if (this.mesh) {
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
                mat.emissive.set(0x1e40af)
                mat.emissiveIntensity = 0.1
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
    createMesh(scene: THREE.Scene): THREE.Mesh {
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
     */
    takeDamage(amount: number): boolean {
        if (this.iframeTimer > 0) return false

        const actualDamage = Math.max(1, amount - this.stats.armor)
        this.stats.currentHp -= actualDamage
        this.iframeTimer = this.iframeDuration
        return true // Indicate damage was taken
    }

    addXp(amount: number) {
        this.stats.xp += amount
        if (this.stats.xp >= this.stats.xpToNextLevel) {
            this.levelUp()
        }
    }

    private levelUp() {
        this.stats.level++
        this.stats.xp -= this.stats.xpToNextLevel
        this.stats.xpToNextLevel = Math.floor(this.stats.xpToNextLevel * 1.4)
    }


    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose()
            if (this.mesh.material instanceof THREE.Material) {
                this.mesh.material.dispose()
            }
        }
    }
}
