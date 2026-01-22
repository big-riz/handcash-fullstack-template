/**
 * RadioactiveAKWeapon.ts
 * 
 * Radioactive AK - High rate of fire handgun-style behavior but with faster projectiles and "Melting" debuff.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class RadioactiveAKWeapon {
    public level = 1
    private cooldown = 0.4
    private timer = 0

    // Stats
    private damage = 10
    private speed = 30
    private meltChance = 0.2 // Chance to deal bonus periodic damage or just visual for now

    constructor(
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager
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

        // AK fires 3-round small bursts at higher levels?
        const burstCount = this.level >= 4 ? 3 : 1
        const spread = 0.1

        for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
                if (!this.player) return
                const variance = (Math.random() - 0.5) * spread
                const vx = (dir.x + (i > 0 ? variance : 0)) * this.speed
                const vz = (dir.z + (i > 0 ? variance : 0)) * this.speed

                this.entityManager.spawnProjectile(
                    this.player.position.x,
                    this.player.position.z,
                    vx,
                    vz,
                    this.damage * this.player.stats.damageMultiplier
                )

                // Visual green flash at player
                if (Math.random() < 0.3) {
                    this.vfx.createEmoji(this.player.position.x, this.player.position.z, '☢️', 0.5)
                }
            }, i * 100)
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Fast nuclear bursts. Chance to melt enemies."
            case 2: return "Enriched uranium (+30% damage)."
            case 3: return "Improved gas block (+15% attack speed)."
            case 4: return "Burst fire module (3-round bursts)."
            case 5: return "Core meltdown (+50% damage & +30% attack speed)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.3
        else if (this.level === 3) this.cooldown *= 0.85
        else if (this.level === 4) this.damage *= 1.2
        else if (this.level === 5) {
            this.damage *= 1.5
            this.cooldown *= 0.7
        }
    }

    cleanup() { }
}
