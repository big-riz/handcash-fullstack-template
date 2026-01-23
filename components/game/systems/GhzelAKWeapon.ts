/**
 * GhzelAKWeapon.ts
 * 
 * Ghzel AK - High precision, high critical hit rate.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class GhzelAKWeapon {
    public level = 1
    private cooldown = 0.6
    private timer = 0

    // Stats
    private damage = 18
    private speed = 40
    private critChanceBonus = 0.15

    constructor(
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any // SeededRandom
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        if (this.timer >= (this.cooldown * this.player.stats.cooldownMultiplier)) {
            this.fire()
            this.timer = 0
        }
    }

    fire() {
        // Find nearest enemy
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        if (enemies.length === 0) return

        const target = enemies[0]
        const dir = target.position.clone().sub(this.player.position).normalize()

        // Crit check - using seeded RNG
        const totalCritRate = this.player.stats.critRate + this.critChanceBonus
        const isCrit = this.rng.next() < totalCritRate
        const finalDamage = isCrit
            ? this.damage * this.player.stats.damageMultiplier * this.player.stats.critDamage
            : this.damage * this.player.stats.damageMultiplier

        this.entityManager.spawnProjectile(
            this.player.position.x,
            this.player.position.z,
            dir.x * this.speed,
            dir.z * this.speed,
            finalDamage
        )

        if (isCrit && this.vfx) {
            this.vfx.createEmoji(target.position.x, target.position.z, '🎯', 0.8)
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Artisanal precision. High critical hit chance."
            case 2: return "Polished sights (+10% crit chance)."
            case 3: return "Match-grade barrel (+40% damage)."
            case 4: return "Lightweight bolt (+20% attack speed)."
            case 5: return "Masterpiece finish (+20% crit & +50% damage)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.critChanceBonus += 0.1
        else if (this.level === 3) this.damage *= 1.4
        else if (this.level === 4) this.cooldown *= 0.8
        else if (this.level === 5) {
            this.critChanceBonus += 0.2
            this.damage *= 1.5
        }
    }

    cleanup() { }
}
