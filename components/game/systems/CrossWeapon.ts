/**
 * CrossWeapon.ts
 * 
 * Krzyż - Boomerang cross that flies out and returns to the player.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

class CrossProjectile {
    position: THREE.Vector3
    velocity: THREE.Vector3
    mesh: THREE.Mesh
    damage: number
    isActive = true
    returning = false
    lifeTime = 4.0
    currentLife = 0
    radius = 0.5
    speed: number

    constructor(scene: THREE.Scene, x: number, z: number, vx: number, vz: number, damage: number, speed: number) {
        this.position = new THREE.Vector3(x, 0.5, z)
        this.velocity = new THREE.Vector3(vx, 0, vz)
        this.damage = damage
        this.speed = speed

        const geometry = new THREE.BoxGeometry(0.8, 0.1, 0.8)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffcc33,
            emissive: 0xffcc33,
            emissiveIntensity: 0.5
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(this.position)
        this.mesh.castShadow = true
        scene.add(this.mesh)
    }

    update(deltaTime: number, player: Player): boolean {
        this.currentLife += deltaTime
        if (this.currentLife > this.lifeTime / 2) {
            this.returning = true
        }

        if (this.returning) {
            // Move towards player
            const dir = player.position.clone().sub(this.position).normalize()
            this.velocity.copy(dir.multiplyScalar(this.speed))

            // If very close to player, despawn
            if (this.position.distanceTo(player.position) < 1.0) {
                return false
            }
        }

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime))
        this.mesh.position.copy(this.position)
        this.mesh.rotation.y += deltaTime * 15 // Spin

        if (this.currentLife >= this.lifeTime) return false
        return true
    }

    cleanup(scene: THREE.Scene) {
        scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        if (this.mesh.material instanceof THREE.Material) this.mesh.material.dispose()
    }
}

export class CrossWeapon {
    private cooldown = 3.0
    private timer = 0
    private level = 1
    private projectiles: CrossProjectile[] = []

    // Stats
    private damage = 20
    private speed = 12
    private count = 1

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        const effectiveCooldown = this.cooldown * this.player.stats.cooldownMultiplier
        if (this.timer >= effectiveCooldown) {
            this.fire()
            this.timer = 0
        }

        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const active = this.projectiles[i].update(deltaTime, this.player)

            // Collision check
            if (active) {
                const proj = this.projectiles[i]
                for (const enemy of this.entityManager.enemies) {
                    if (enemy.isActive) {
                        const dist = proj.position.distanceTo(enemy.position)
                        const effectiveDamage = this.damage * this.player.stats.damageMultiplier
                        if (dist < (proj.radius + enemy.radius)) {
                            enemy.takeDamage(effectiveDamage, this.vfx)
                        }
                    }
                }
            }

            if (!active) {
                this.projectiles[i].cleanup(this.scene)
                this.projectiles.splice(i, 1)
            }
        }
    }

    fire() {
        for (let i = 0; i < this.count; i++) {
            const angle = (i / this.count) * Math.PI * 2 + Math.random()
            const vx = Math.cos(angle) * this.speed
            const vz = Math.sin(angle) * this.speed

            this.projectiles.push(new CrossProjectile(
                this.scene,
                this.player.position.x,
                this.player.position.z,
                vx, vz,
                this.damage,
                this.speed
            ))
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Holy cross boomerang that flies out and returns."
            case 2: return "Divine judgment (+50% damage)."
            case 3: return "Second cross (+1 count)."
            case 4: return "Aerodynamic gilding (+20% speed)."
            case 5: return "Zealous fervor (+30% attack speed)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.damage *= 1.5
        else if (this.level === 3) this.count++
        else if (this.level === 4) this.speed *= 1.2
        else if (this.level === 5) this.cooldown *= 0.7
    }

    cleanup() {
        for (const p of this.projectiles) p.cleanup(this.scene)
        this.projectiles = []
    }
}
