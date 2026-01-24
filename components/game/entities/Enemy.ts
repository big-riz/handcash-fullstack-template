/**
 * Enemy.ts
 * 
 * Base class for all enemies in Slavic Survivors.
 * Handles movement, health, and basic AI (following player).
 */

import * as THREE from 'three'
import { Player } from './Player'
import { VFXManager } from '../systems/VFXManager'

export interface EnemyStats {
    maxHp: number
    currentHp: number
    moveSpeed: number
    damage: number
    xpValue: number
    isRanged?: boolean
}

export type EnemyType = 'drifter' | 'screecher' | 'bruiser' | 'zmora' | 'domovoi' | 'kikimora' | 'leshy' | 'vodnik'

export class Enemy {
    position: THREE.Vector3
    velocity: THREE.Vector3
    radius: number
    stats: EnemyStats
    type: EnemyType

    mesh: THREE.Mesh | null = null
    isActive = false
    onDie: ((x: number, z: number, xp: number) => void) | null = null

    // Health bar
    private healthBarBg: THREE.Mesh | null = null
    private healthBarFill: THREE.Mesh | null = null
    private healthBarWidth = 0.6

    // Behaviors
    private flickerTimer = 0
    private isInvulnerable = false
    public isElite = false

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
                this.stats = { maxHp: 20, currentHp: 20, moveSpeed: 3.5, damage: 10, xpValue: 1 }
                this.radius = 0.3
                break;
            case 'screecher':
                this.stats = { maxHp: 10, currentHp: 10, moveSpeed: 5.5, damage: 5, xpValue: 1 }
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
            case 'domovoi': // Tiny swarm units
                this.stats = { maxHp: 5, currentHp: 5, moveSpeed: 4.5, damage: 4, xpValue: 1 }
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
        }
    }

    spawn(type: EnemyType, x: number, z: number, isElite: boolean = false) {
        this.type = type
        this.position.set(x, 0, z)
        this.isActive = true
        this.isInvulnerable = false
        this.isElite = isElite
        this.flickerTimer = 0

        this.setStatsByType(type)

        // Boost elite stats
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
            mat.opacity = this.type === 'zmora' ? 0.6 : 1.0
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

    update(deltaTime: number, player: Player, spawnProjectile?: (x: number, z: number, vx: number, vz: number, damage: number) => void) {
        if (!this.isActive) return

        // Behavior Logic
        if (this.type === 'zmora') {
            this.flickerTimer += deltaTime
            if (this.flickerTimer >= 2.0) {
                this.flickerTimer = 0
                this.isInvulnerable = !this.isInvulnerable
                if (this.mesh) {
                    const mat = this.mesh.material as THREE.MeshStandardMaterial
                    mat.opacity = this.isInvulnerable ? 0.2 : 0.6
                }
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
                    spawnProjectile(this.position.x, this.position.z, dir.x * 10, dir.z * 10, this.stats.damage)
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
            this.velocity.copy(direction).multiplyScalar(this.stats.moveSpeed)
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
        // Hide health bar
        if (this.healthBarBg) this.healthBarBg.visible = false
        if (this.healthBarFill) this.healthBarFill.visible = false
        
        if (this.onDie) {
            this.onDie(this.position.x, this.position.z, this.stats.xpValue)
        }
    }

    createMesh(scene: THREE.Scene, color = 0xff4444): THREE.Mesh {
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
