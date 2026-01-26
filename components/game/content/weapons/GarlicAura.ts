/**
 * GarlicAura.ts
 *
 * Defensive aura that damages nearby enemies continuously.
 */

import * as THREE from 'three'
import { Player } from '../../entities/Player'
import { EntityManager } from '../../entities/EntityManager'
import { VFXManager } from '../../systems/VFXManager'
import { AudioManager } from '../../core/AudioManager'

export class GarlicAura {
    level = 1
    radius = 3.0
    damage = 15
    private damageInterval = 0.4
    private damageTimer = 0
    private auraMesh: THREE.Mesh | null = null

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        private audioManager: AudioManager | null
    ) {
        this.createAuraVisual()
    }

    private createAuraVisual() {
        const geometry = new THREE.RingGeometry(this.radius - 0.3, this.radius, 32)
        const material = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        })
        this.auraMesh = new THREE.Mesh(geometry, material)
        this.auraMesh.rotation.x = -Math.PI / 2
        this.scene.add(this.auraMesh)
    }

    update(deltaTime: number) {
        this.damageTimer += deltaTime

        // Update aura position and scale
        if (this.auraMesh) {
            const effectiveRadius = this.radius * this.player.stats.areaMultiplier
            this.auraMesh.position.set(this.player.position.x, 0.1, this.player.position.z)
            const scale = effectiveRadius / this.radius
            this.auraMesh.scale.set(scale, scale, scale)
        }

        const effectiveInterval = this.damageInterval * this.player.stats.cooldownMultiplier
        if (this.damageTimer >= effectiveInterval) {
            this.dealDamage()
            this.damageTimer = 0
        }
    }

    private dealDamage() {
        const effectiveRadius = this.radius * this.player.stats.areaMultiplier
        const effectiveDamage = this.damage * this.player.stats.damageMultiplier

        for (const enemy of this.entityManager.enemies) {
            if (enemy.isActive) {
                const dist = this.player.position.distanceTo(enemy.position)
                if (dist < effectiveRadius + enemy.radius) {
                    enemy.takeDamage(effectiveDamage, this.vfx)
                }
            }
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Holy aura damages nearby enemies."
            case 2: return "+30% damage."
            case 3: return "+20% area."
            case 4: return "+40% damage."
            case 5: return "+30% area."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.3
        else if (this.level === 3) this.radius *= 1.2
        else if (this.level === 4) this.damage *= 1.4
        else if (this.level === 5) this.radius *= 1.3
    }

    cleanup() {
        if (this.auraMesh) {
            this.scene.remove(this.auraMesh)
            this.auraMesh.geometry.dispose()
            if (this.auraMesh.material instanceof THREE.Material) {
                this.auraMesh.material.dispose()
            }
            this.auraMesh = null
        }
    }
}
