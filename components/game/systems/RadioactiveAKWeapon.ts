/**
 * RadioactiveAKWeapon.ts
 * 
 * Radioactive AK - High rate of fire handgun-style behavior but with faster projectiles and "Melting" debuff.
 */

import * as THREE from 'three'
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

    private burstQueue: { timer: number; dir: THREE.Vector3 }[] = []

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

        // Process burst queue
        for (let i = this.burstQueue.length - 1; i >= 0; i--) {
            this.burstQueue[i].timer -= deltaTime
            if (this.burstQueue[i].timer <= 0) {
                const burstItem = this.burstQueue[i]
                const dir = burstItem.dir
                const spread = 0.1
                const variance = (this.rng.next() - 0.5) * spread
                const vx = (dir.x + (i > 0 ? variance : 0)) * this.speed
                const vz = (dir.z + (i > 0 ? variance : 0)) * this.speed

                this.entityManager.spawnProjectile(
                    this.player.position.x,
                    this.player.position.z,
                    vx,
                    vz,
                    this.damage * this.player.stats.damageMultiplier
                )

                if (this.rng.next() < 0.3) {
                    this.vfx.createEmoji(this.player.position.x, this.player.position.z, '☢️', 0.5)
                }

                this.burstQueue.splice(i, 1)
            }
        }
    }

    fire() {
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive)
            .sort((a, b) => a.position.distanceTo(this.player.position) - b.position.distanceTo(this.player.position))

        if (enemies.length === 0) return

        const target = enemies[0]
        const dir = target.position.clone().sub(this.player.position).normalize()

        const burstCount = this.level >= 4 ? 3 : 1
        for (let i = 0; i < burstCount; i++) {
            this.burstQueue.push({ timer: i * 0.1, dir: dir.clone() })
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
