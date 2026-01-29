/**
 * NuclearPigeon.ts
 * 
 * Nuclear Pigeon companion. Circles the player and fires radioactive beams at enemies.
 */

import * as THREE from 'three'
import { Player } from '../../entities/Player'
import { EntityManager } from '../../entities/EntityManager'
import { VFXManager } from '../../systems/VFXManager'
import { AudioManager } from '../../core/AudioManager'

export type CompanionType = 'nuclear_pigeon' | 'vampire_rat' | 'pig_luggage'

export class NuclearPigeon {
    public level = 1
    public companionType: CompanionType = 'nuclear_pigeon'
    private mesh: THREE.Mesh | null = null
    private angle = 0
    public orbitRadius = 2.5
    public orbitSpeed = 3
    private fireTimer = 0
    public fireCooldown = 0.8

    // Stats
    public damage = 18
    private range = 10

    // Health drop (pig_luggage only)
    private healthDropTimer = 0
    private healthDropInterval = 5.0
    private healthDropAmount = 3

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        private audioManager: AudioManager | null = null
    ) {
        this.createMesh()
    }

    private createMesh() {
        // Small green bird/sphere
        const geo = new THREE.SphereGeometry(0.2, 8, 8)
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5
        })
        this.mesh = new THREE.Mesh(geo, mat)
        this.scene.add(this.mesh)
    }

    update(deltaTime: number) {
        if (!this.mesh) return

        // Orbit logic
        this.angle += this.orbitSpeed * deltaTime
        const x = this.player.position.x + Math.cos(this.angle) * this.orbitRadius
        const z = this.player.position.z + Math.sin(this.angle) * this.orbitRadius
        this.mesh.position.set(x, 1.5, z)

        // Fire logic
        this.fireTimer += deltaTime
        if (this.fireTimer >= (this.fireCooldown * this.player.stats.cooldownMultiplier)) {
            this.fire()
            this.fireTimer = 0
        }

        // Health drop (pig_luggage only)
        if (this.companionType === 'pig_luggage') {
            this.healthDropTimer += deltaTime
            if (this.healthDropTimer >= this.healthDropInterval) {
                this.healthDropTimer = 0
                this.entityManager.spawnHealthPickup(x, z, this.healthDropAmount)
                if (this.vfx) {
                    this.vfx.createEmoji(x, z, '💚', 0.5)
                }
            }
        }
    }

    private fire() {
        if (!this.mesh) return

        this.audioManager?.playCompanionAttack();

        // Targeted fire
        const enemies = this.entityManager.enemies
            .filter(e => e.isActive && e.position.distanceTo(this.mesh!.position) < this.range)
            .sort((a, b) => a.position.distanceTo(this.mesh!.position) - b.position.distanceTo(this.mesh!.position))

        if (enemies.length === 0) return

        const target = enemies[0]
        const dir = target.position.clone().sub(this.mesh.position).normalize()

        // Crit check
        const isCrit = this.rng.next() < this.player.stats.critRate
        const finalDamage = isCrit
            ? this.damage * this.player.stats.damageMultiplier * this.player.stats.critDamage
            : this.damage * this.player.stats.damageMultiplier

        this.entityManager.spawnProjectile(
            this.mesh.position.x,
            this.mesh.position.z,
            dir.x * 20,
            dir.z * 20,
            finalDamage,
            false, false, false,
            '🐦'
        )

        if (this.vfx) {
            this.vfx.createEmoji(this.mesh.position.x, this.mesh.position.z, isCrit ? '☢️' : '🐦', 0.4)
        }
    }

    upgrade() {
        this.level++
        if (this.companionType === 'vampire_rat') {
            // Uncommon companion: consistent scaling matching weapon curves
            // Base 35 DPS → Lvl5 ~85 DPS (~2.4x)
            if (this.level === 2) this.damage *= 1.2       // +20% damage
            if (this.level === 3) this.fireCooldown *= 0.8  // +25% attack speed
            if (this.level === 4) this.damage *= 1.25       // +25% damage
            if (this.level === 5) {
                this.damage *= 1.3                           // +30% damage
                this.orbitSpeed *= 1.3                       // faster orbit
            }
        } else if (this.companionType === 'pig_luggage') {
            // Uncommon utility companion: damage + health drops
            // Health drops: 3→3→4→5→6 HP, interval: 5→4.5→4→3.5→3s
            if (this.level === 2) { this.damage *= 1.2; this.healthDropInterval = 4.5 }
            if (this.level === 3) { this.fireCooldown *= 0.8; this.healthDropInterval = 4.0; this.healthDropAmount = 4 }
            if (this.level === 4) { this.damage *= 1.25; this.healthDropInterval = 3.5; this.healthDropAmount = 5 }
            if (this.level === 5) {
                this.damage *= 1.3
                this.orbitRadius += 1
                this.healthDropInterval = 3.0
                this.healthDropAmount = 6
            }
        } else {
            // Nuclear Pigeon (Legendary): consistent scaling matching legendary weapons
            // Base 75 DPS → Lvl5 ~183 DPS (~2.4x)
            if (this.level === 2) this.damage *= 1.2        // +20% damage
            if (this.level === 3) this.fireCooldown *= 0.8   // +25% attack speed
            if (this.level === 4) this.damage *= 1.25        // +25% damage
            if (this.level === 5) {
                this.damage *= 1.3                            // +30% damage
                this.range += 3                               // wider targeting
            }
        }
    }

    static getUpgradeDesc(nextLevel: number): string {
        switch (nextLevel) {
            case 1: return "Radioactive companion. Orbits and nukes."
            case 2: return "Enriched uranium (+20% damage)."
            case 3: return "Faster reactor (+25% attack speed)."
            case 4: return "Critical mass (+25% damage)."
            case 5: return "Meltdown (+30% damage, +3 range)."
            default: return ""
        }
    }

    cleanup() {
        if (this.mesh) {
            this.scene.remove(this.mesh)
            this.mesh.geometry.dispose()
            if (this.mesh.material instanceof THREE.Material) this.mesh.material.dispose()
        }
    }
}
