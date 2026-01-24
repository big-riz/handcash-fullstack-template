/**
 * LadaVehicle.ts
 * 
 * Lada Vehicle - A temporary power-up that drives through enemies.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

export class LadaVehicle {
    public level = 1
    private mesh: THREE.Mesh | null = null
    private isActive = false
    public duration = 5
    private timer = 0
    private cooldown = 20
    private cooldownTimer = 0

    // Stats
    public damage = 50
    public speed = 15

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any // SeededRandom
    ) { }

    update(deltaTime: number) {
        if (this.isActive) {
            this.timer += deltaTime
            if (this.mesh) {
                // Move forward in player's last direction or just ahead
                // For simplicity, it follows player with a small offset and crushes nearby
                this.mesh.position.copy(this.player.position)
                this.mesh.position.y = 0.5

                // Rotation based on movement
                if (this.player.velocity.length() > 0.1) {
                    this.mesh.rotation.y = Math.atan2(this.player.velocity.x, this.player.velocity.z)
                }

                // Crush enemies
                for (const enemy of this.entityManager.enemies) {
                    if (enemy.isActive && enemy.position.distanceTo(this.mesh.position) < 2.5) {
                        enemy.takeDamage(this.damage, this.vfx)
                        if (this.rng.next() < 0.1) {
                            this.vfx.createEmoji(enemy.position.x, enemy.position.z, '💥', 0.5)
                        }
                    }
                }
            }

            if (this.timer >= this.duration) {
                this.deactivate()
            }
        } else {
            this.cooldownTimer += deltaTime
            if (this.cooldownTimer >= this.cooldown) {
                this.activate()
            }
        }
    }

    private activate() {
        this.isActive = true
        this.timer = 0

        // Create car mesh (box)
        const geo = new THREE.BoxGeometry(1.5, 0.8, 2.5)
        const mat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        })
        this.mesh = new THREE.Mesh(geo, mat)
        this.scene.add(this.mesh)

        if (this.vfx) {
            this.vfx.createEmoji(this.player.position.x, this.player.position.z, '🚗', 1.0)
        }
    }

    private deactivate() {
        this.isActive = false
        this.cooldownTimer = 0
        if (this.mesh) {
            this.scene.remove(this.mesh)
            this.mesh.geometry.dispose()
            if (this.mesh.material instanceof THREE.Material) this.mesh.material.dispose()
            this.mesh = null
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.duration += 2
        if (this.level === 3) this.damage *= 1.5
        if (this.level === 4) this.cooldown -= 5
        if (this.level === 5) {
            this.duration += 3
            this.damage *= 2
        }
    }

    cleanup() {
        this.deactivate()
    }
}
