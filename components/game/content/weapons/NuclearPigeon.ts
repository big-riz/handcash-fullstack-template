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

export class NuclearPigeon {
    public level = 1
    private mesh: THREE.Mesh | null = null
    private angle = 0
    public orbitRadius = 2.5
    public orbitSpeed = 3
    private fireTimer = 0
    private fireCooldown = 0.8

    // Stats
    public damage = 18
    private range = 10

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
            finalDamage
        )

        if (this.vfx) {
            this.vfx.createEmoji(this.mesh.position.x, this.mesh.position.z, isCrit ? '☢️' : '🐦', 0.4)
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.3
        if (this.level === 3) this.fireCooldown *= 0.8
        if (this.level === 4) this.orbitRadius += 1
        if (this.level === 5) {
            this.damage *= 2
            this.fireCooldown *= 0.5
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
