/**
 * TT33Weapon.ts
 * 
 * TT33 Handgun - Rapid single shots with high crit potential.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class TT33Weapon {
    public level = 1
    private cooldown = 0.5
    private timer = 0

    // Stats
    private damage = 12
    private speed = 25
    private pierce = 0

    constructor(
        private player: Player,
        private entityManager: EntityManager
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        if (this.timer >= (this.cooldown * this.player.stats.cooldownMultiplier)) {
            this.fire()
            this.timer = 0
        }
    }

    fire() {
        // Find nearest enemy to shoot at, or look forward
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        let dx: number, dz: number;

        if (enemies.length > 0) {
            const target = enemies[0]
            const dir = target.position.clone().sub(this.player.position).normalize()
            dx = dir.x
            dz = dir.z
        } else {
            // Shoots in movement direction or default
            dx = this.player.velocity.x
            dz = this.player.velocity.z
            if (Math.abs(dx) < 0.1 && Math.abs(dz) < 0.1) {
                dz = 1; dx = 0;
            } else {
                const mag = Math.sqrt(dx * dx + dz * dz)
                dx /= mag; dz /= mag;
            }
        }

        this.entityManager.spawnProjectile(
            this.player.position.x,
            this.player.position.z,
            dx * this.speed,
            dz * this.speed,
            this.damage * this.player.stats.damageMultiplier
        )
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Rapid single shots at nearest enemy."
            case 2: return "Polished barrel (+20% damage)."
            case 3: return "Hair trigger (+20% attack speed)."
            case 4: return "High-velocity rounds (+50% damage)."
            case 5: return "Semi-auto mastery (+30% attack speed)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.2
        else if (this.level === 3) this.cooldown *= 0.8
        else if (this.level === 4) this.damage *= 1.5
        else if (this.level === 5) this.cooldown *= 0.7
    }

    cleanup() { }
}
