/**
 * MeleeWeapon.ts
 * 
 * Arc-based melee attacks that swing in front of the player.
 * Each attack creates a visible arc that sweeps and damages enemies.
 */

import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class MeleeWeapon {
    public cooldown = 0.8
    private timer = 0
    public level = 1

    // Stats
    public damage = 18
    public radius = 3.0 // Swing reach (Increased for 100%+ more area)
    public swingDuration = 0.3 // How long the swing animation takes
    public arcAngle = Math.PI * 0.6 // ~108 degrees
    public color = 0xcccccc // Default silver

    constructor(
        private player: Player,
        private entityManager: EntityManager,
        private rng: any // SeededRandom
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        const effectiveCooldown = this.cooldown * this.player.stats.cooldownMultiplier
        if (this.timer >= effectiveCooldown) {
            this.swing()
            this.timer = 0
        }
    }

    swing() {
        // Find nearest enemy to determine swing direction
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        // Default to player's last movement direction if no enemies
        let facingAngle = 0

        if (enemies.length > 0) {
            // Swing towards nearest enemy
            const target = enemies[0]
            const dx = target.position.x - this.player.position.x
            const dz = target.position.z - this.player.position.z
            facingAngle = Math.atan2(dz, dx)
        } else {
            // Use player's velocity direction, or random if stationary
            if (this.player.velocity.lengthSq() > 0.01) {
                facingAngle = Math.atan2(this.player.velocity.z, this.player.velocity.x)
            } else {
                facingAngle = this.rng.next() * Math.PI * 2
            }
        }

        // Spawn the melee swing arc
        this.entityManager.spawnMeleeSwing(
            this.player.position.x,
            this.player.position.z,
            facingAngle,
            this.damage * this.player.stats.damageMultiplier,
            this.radius,
            this.swingDuration,
            this.arcAngle,
            this.color
        )
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Melee arc attack in front of you."
            case 2: return "Increased reach (+30% radius)."
            case 3: return "Sharper blade (+50% damage)."
            case 4: return "Faster swings (+30% attack speed)."
            case 5: return "Wide sweep (+50% arc angle, +25% damage)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.radius *= 1.3
        else if (this.level === 3) this.damage *= 1.5
        else if (this.level === 4) this.cooldown *= 0.7
        else if (this.level === 5) {
            this.arcAngle *= 1.5 // Wider arc
            this.damage *= 1.25
        }
    }

    cleanup() {
        // Nothing specific to cleanup
    }
}
