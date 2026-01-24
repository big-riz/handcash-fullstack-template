/**
 * DaggerWeapon.ts
 * 
 * Throwing knives - auto-targets nearest enemies with piercing projectiles.
 * Differentiation: High pierce, moderate speed, fan spread on multiple targets.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class DaggerWeapon {
    public cooldown = 0.8
    private timer = 0
    public level = 1

    // Stats
    public damage = 18
    public projectileSpeed = 18
    public projectileLife = 1.5 // Longer range than melee
    public count = 1

    constructor(
        private player: Player,
        private entityManager: EntityManager,
        private rng: any // SeededRandom
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
        // Find nearest enemies to target
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        if (enemies.length === 0) return // Don't fire if no enemies

        // Fire at multiple targets if we have multiple projectiles
        for (let i = 0; i < this.count; i++) {
            const targetIdx = Math.min(i, enemies.length - 1)
            const target = enemies[targetIdx]

            const dir = target.position.clone().sub(this.player.position).normalize()
            const dx = dir.x
            const dz = dir.z

            // Add slight spread for multiple projectiles at same target
            const spread = i > 0 && targetIdx === enemies.length - 1 ? (this.rng.next() - 0.5) * 0.3 : 0

            // Crit check
            const isCrit = this.rng.next() < this.player.stats.critRate
            const finalDamage = isCrit
                ? this.damage * this.player.stats.damageMultiplier * this.player.stats.critDamage
                : this.damage * this.player.stats.damageMultiplier

            this.entityManager.spawnProjectile(
                this.player.position.x,
                this.player.position.z,
                (dx + spread) * this.projectileSpeed,
                (dz + spread) * this.projectileSpeed,
                finalDamage
            )
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Throwing knives that pierce through enemies."
            case 2: return "Extra blade (+1 knife)."
            case 3: return "Sharper blades (+50% damage)."
            case 4: return "Faster throwing (+30% attack speed)."
            case 5: return "Blade Master (+1 knife, targets spread)."
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
