/**
 * DaggerWeapon.ts
 * 
 * Shoots daggers in the direction of movement.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class DaggerWeapon {
    private cooldown = 1.0 // Attacks per second
    private timer = 0
    private level = 1

    // Stats
    private damage = 15
    private speed = 15
    private count = 1

    constructor(
        private player: Player,
        private entityManager: EntityManager
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        const effectiveCooldown = this.cooldown * this.player.stats.cooldownMultiplier
        if (this.timer >= effectiveCooldown) {
            this.fire()
            this.timer = 0
        }
    }

    fire() {
        // Find direction (use movement or last direction)
        let dx = this.player.velocity.x
        let dz = this.player.velocity.z

        // If standing still, shoot forward (looking North based on camera)
        if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
            dz = 1
            dx = 0
        } else {
            const mag = Math.sqrt(dx * dx + dz * dz)
            dx /= mag
            dz /= mag
        }

        // Spawn count projectiles with slight offset
        for (let i = 0; i < this.count; i++) {
            const spread = (i - (this.count - 1) / 2) * 0.1
            const vx = dx * this.speed
            const vz = dz * this.speed

            // Adjust velocity by spread (perpendicular vector)
            const sx = vx - dz * spread * this.speed
            const sz = vz + dx * spread * this.speed

            this.entityManager.spawnProjectile(
                this.player.position.x,
                this.player.position.z,
                sx,
                sz,
                this.damage * this.player.stats.damageMultiplier
            )
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Shoot piercing blades in movement direction."
            case 2: return "Fire an extra blade (+1 count)."
            case 3: return "Sharper blades (+50% damage)."
            case 4: return "Faster throwing (+30% attack speed)."
            case 5: return "Hussar Volley (+1 extra blade)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.count = 2
        else if (this.level === 3) this.damage *= 1.5
        else if (this.level === 4) this.cooldown *= 0.7
        else if (this.level === 5) this.count = 3
    }

    cleanup() {
        // Nothing specific to cleanup
    }
}
