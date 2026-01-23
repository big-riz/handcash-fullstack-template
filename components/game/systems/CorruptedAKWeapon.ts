/**
 * CorruptedAKWeapon.ts
 * 
 * Corrupted AK - Demonic weapon with life-steal capabilities.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class CorruptedAKWeapon {
    public level = 1
    private cooldown = 0.5
    private timer = 0

    // Stats
    private damage = 14
    private speed = 35
    private lifeStealChance = 0.05

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

        // Spawn a specialized projectile that can trigger life steal
        // For simplicity, we'll just handle it here if it's hit-based, 
        // but projectiles in our current system don't callback.
        // Let's assume on hit logic should be in EntityManager, but for now we'll simulate.

        this.entityManager.spawnProjectile(
            this.player.position.x,
            this.player.position.z,
            dir.x * this.speed,
            dir.z * this.speed,
            this.damage * this.player.stats.damageMultiplier
        )

        // Life steal logic: 5% chance to heal 1 HP on fire for now (using seeded RNG)
        if (this.rng.next() < this.lifeStealChance) {
            this.player.stats.currentHp = Math.min(this.player.stats.maxHp, this.player.stats.currentHp + 1)
            if (this.vfx) {
                this.vfx.createEmoji(this.player.position.x, this.player.position.z, '💉', 0.6)
            }
        }

        if (this.vfx && this.rng.next() < 0.2) {
            this.vfx.createEmoji(this.player.position.x, this.player.position.z, '👿', 0.4)
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Demonic weapon that siphons life from foes."
            case 2: return "Cursed barrel (+25% damage)."
            case 3: return "Life-drain infusion (+3% life-steal chance)."
            case 4: return "Unholy speed (+20% attack speed)."
            case 5: return "Demon Lord's fury (+50% damage & +5% life-steal)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.25
        else if (this.level === 3) this.lifeStealChance += 0.03
        else if (this.level === 4) this.cooldown *= 0.8
        else if (this.level === 5) {
            this.damage *= 1.5
            this.lifeStealChance += 0.05
        }
    }

    cleanup() { }
}
