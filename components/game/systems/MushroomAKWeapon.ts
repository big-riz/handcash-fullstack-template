/**
 * MushroomAKWeapon.ts
 * 
 * Mushroom AK - Spreads toxic spores that create lingering damage zones.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class MushroomAKWeapon {
    public level = 1
    private cooldown = 0.7
    private timer = 0
    private clouds: { mesh: THREE.Mesh; timer: number; life: number }[] = []

    // Stats
    private damage = 10
    private cloudDamage = 5
    private cloudRadius = 2
    private cloudDuration = 3

    constructor(
        private scene: THREE.Scene,
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

        // Update clouds
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i]
            cloud.timer += deltaTime

            // Damage check
            for (const enemy of this.entityManager.enemies) {
                if (enemy.isActive && enemy.position.distanceTo(cloud.mesh.position) < this.cloudRadius) {
                    // Small tick damage
                    if (Math.floor(cloud.timer * 5) > Math.floor((cloud.timer - deltaTime) * 5)) {
                        enemy.takeDamage(this.cloudDamage, this.vfx)
                    }
                }
            }

            if (cloud.timer >= cloud.life) {
                this.scene.remove(cloud.mesh)
                cloud.mesh.geometry.dispose()
                if (cloud.mesh.material instanceof THREE.Material) cloud.mesh.material.dispose()
                this.clouds.splice(i, 1)
            } else {
                // Pulse size
                const s = (1 + Math.sin(cloud.timer * 5) * 0.1) * this.cloudRadius
                cloud.mesh.scale.set(s, 0.1, s)
                if (cloud.mesh.material instanceof THREE.MeshStandardMaterial) {
                    cloud.mesh.material.opacity = (1 - cloud.timer / cloud.life) * 0.4
                }
            }
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

        this.entityManager.spawnProjectile(
            this.player.position.x,
            this.player.position.z,
            dir.x * 25,
            dir.z * 25,
            this.damage * this.player.stats.damageMultiplier
        )

        // Drop a spore cloud at enemy position (or player)
        // Let's drop it where the projectile starts for "trail" feel or near target
        this.createCloud(target.position.x, target.position.z)

        if (this.vfx) {
            this.vfx.createEmoji(this.player.position.x, this.player.position.z, '🍄', 0.5)
        }
    }

    private createCloud(x: number, z: number) {
        const geo = new THREE.CylinderGeometry(1, 1, 0.2, 16)
        const mat = new THREE.MeshStandardMaterial({
            color: 0x88ff00,
            transparent: true,
            opacity: 0.4,
            emissive: 0x448800
        })
        const mesh = new THREE.Mesh(geo, mat)
        mesh.position.set(x, 0.05, z)
        this.scene.add(mesh)
        this.clouds.push({ mesh, timer: 0, life: this.cloudDuration })
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.cloudRadius *= 1.3
        if (this.level === 3) this.cloudDamage *= 1.5
        if (this.level === 4) this.cloudDuration += 2
        if (this.level === 5) {
            this.cooldown *= 0.7
            this.cloudDamage *= 2
        }
    }

    cleanup() {
        for (const cloud of this.clouds) {
            this.scene.remove(cloud.mesh)
        }
        this.clouds = []
    }
}
