/**
 * GarlicAura.ts
 * 
 * Czosnek Halo - A damaging aura around the player.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class GarlicAura {
    private mesh: THREE.Mesh
    private radius = 3.5
    private damage = 7
    private tickRate = 0.4 // Damage every 0.4 seconds
    private tickTimer = 0
    private level = 1

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any // SeededRandom
    ) {
        const geometry = new THREE.TorusGeometry(this.radius, 0.05, 16, 100)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.rotation.x = Math.PI / 2
        this.scene.add(this.mesh)
    }

    update(deltaTime: number) {
        // Follow player
        this.mesh.position.copy(this.player.position)
        this.mesh.position.y = 0.05

        // Scale with Area Multiplier
        const s = this.player.stats.areaMultiplier
        this.mesh.scale.set(s, s, s)

        // Visual Rotation
        this.mesh.rotation.z += deltaTime * 2

        // Damage Tick
        this.tickTimer += deltaTime
        // The cooldownMultiplier is already applied here to the tickRate
        const effectiveTickRate = this.tickRate * this.player.stats.cooldownMultiplier
        if (this.tickTimer >= effectiveTickRate) {
            this.tickTimer = 0
            this.processDamage()
        }
    }

    private processDamage() {
        const enemies = this.entityManager.enemies
        for (const enemy of enemies) {
            if (enemy.isActive) {
                const dist = enemy.position.distanceTo(this.player.position)
                const effectiveRadius = this.radius * this.player.stats.areaMultiplier
                const effectiveDamage = this.damage * this.player.stats.damageMultiplier

                if (dist <= effectiveRadius + enemy.radius) {
                    enemy.takeDamage(effectiveDamage, this.vfx)
                    this.vfx.createEmoji(enemy.position.x, enemy.position.z, '🧄')
                }
            }
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Damaging aura that keeps spirits at bay."
            case 2: return "Increased damage (+50%)."
            case 3: return "Increased horizontal reach (+20%)."
            case 4: return "Faster damage pulses (-20% interval)."
            case 5: return "Huge damage spike (+100%)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.5
        else if (this.level === 3) this.radius *= 1.2
        else if (this.level === 4) this.tickRate *= 0.8
        else if (this.level === 5) this.damage *= 2
    }

    cleanup() {
        this.scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        if (this.mesh.material instanceof THREE.Material) {
            this.mesh.material.dispose()
        }
    }
}
