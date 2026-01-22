/**
 * AspenStakeWeapon.ts
 * 
 * Osikovy Kol - Fires high-damage stakes at the nearest enemy.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class AspenStakeWeapon {
    private cooldown = 2.0
    private timer = 0
    private level = 1

    // Stats
    private damage = 25
    private speed = 20
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
        // Find nearest enemies
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        for (let i = 0; i < Math.min(this.count, enemies.length); i++) {
            const target = enemies[i]
            const dir = target.position.clone().sub(this.player.position).normalize()

            this.entityManager.spawnProjectile(
                this.player.position.x,
                this.player.position.z,
                dir.x * this.speed,
                dir.z * this.speed,
                this.damage * this.player.stats.damageMultiplier
            )
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Auto-targets nearest enemies with high damage."
            case 2: return "Sharpened wood (+40% damage)."
            case 3: return "Quicker draw (+20% attack speed)."
            case 4: return "Additional stake (+1 count)."
            case 5: return "Exorcist's specialized stake (+100% damage)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.4
        else if (this.level === 3) this.cooldown *= 0.8
        else if (this.level === 4) this.count++
        else if (this.level === 5) this.damage *= 2.0
    }

    cleanup() { }
}
