/**
 * SaltLineWeapon.ts
 * 
 * Salt Line - A protective circle of salt that damages enemies and applies knockback.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

class SaltLinePool {
    mesh: THREE.Mesh
    radius: number
    damage: number
    lifeTime: number
    currentLife = 0
    tickRate = 0.3
    tickTimer = 0
    isActive = true

    constructor(scene: THREE.Scene, x: number, z: number, radius: number, damage: number, lifeTime: number) {
        this.radius = radius
        this.damage = damage
        this.lifeTime = lifeTime

        const geometry = new THREE.TorusGeometry(radius, 0.1, 8, 32)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
            emissive: 0xffffff,
            emissiveIntensity: 0.5
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.rotation.x = Math.PI / 2
        this.mesh.position.set(x, 0.05, z)
        scene.add(this.mesh)
    }

    update(deltaTime: number, player: Player, enemies: any[], vfx: VFXManager, areaMult: number, damageMult: number): boolean {
        this.currentLife += deltaTime
        this.tickTimer += deltaTime

        // Follow player (it's a ward ring around player)
        this.mesh.position.copy(player.position)
        this.mesh.position.y = 0.05

        const s = areaMult
        this.mesh.scale.set(s, s, s)

        if (this.tickTimer >= this.tickRate) {
            this.tickTimer = 0
            this.processDamage(enemies, vfx, areaMult, damageMult)
        }

        if (this.currentLife >= this.lifeTime) {
            this.isActive = false
            return false
        }
        return true
    }

    private processDamage(enemies: any[], vfx: VFXManager, areaMult: number, damageMult: number) {
        const effectiveRadius = this.radius * areaMult
        const effectiveDamage = this.damage * damageMult

        for (const enemy of enemies) {
            if (enemy.isActive) {
                const dist = enemy.position.distanceTo(this.mesh.position)
                // Hits enemy if they touch the ring (thickness included)
                if (Math.abs(dist - effectiveRadius) < 0.5) {
                    enemy.takeDamage(effectiveDamage, vfx)
                    vfx.createEmoji(enemy.position.x, enemy.position.z, '🧂', 0.5)

                    // Knockback
                    const dir = enemy.position.clone().sub(this.mesh.position).normalize()
                    enemy.position.add(dir.multiplyScalar(0.5))
                }
            }
        }
    }

    cleanup(scene: THREE.Scene) {
        scene.remove(this.mesh)
        this.mesh.geometry.dispose()
        if (this.mesh.material instanceof THREE.Material) this.mesh.material.dispose()
    }
}

export class SaltLineWeapon {
    private cooldown = 6.0
    private timer = 0
    private currentPool: SaltLinePool | null = null
    private level = 1

    // Stats
    private damage = 8
    private radius = 4.0
    private lifeTime = 3.0

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any // SeededRandom
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        if (this.timer >= this.cooldown) {
            this.fire()
            this.timer = 0
        }

        if (this.currentPool) {
            const active = this.currentPool.update(
                deltaTime,
                this.player,
                this.entityManager.enemies,
                this.vfx,
                this.player.stats.areaMultiplier,
                this.player.stats.damageMultiplier
            )
            if (!active) {
                this.currentPool.cleanup(this.scene)
                this.currentPool = null
            }
        }
    }

    fire() {
        if (this.currentPool) return // Already active
        this.currentPool = new SaltLinePool(this.scene, this.player.position.x, this.player.position.z, this.radius, this.damage, this.lifeTime)
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Protective circle of salt that wards off spirits."
            case 2: return "Wider warding (+20% radius)."
            case 3: return "Blessed salt (+50% damage)."
            case 4: return "Lingering barrier (+2s duration)."
            case 5: return "Frequent rituals (+20% cooldown reduction)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.radius *= 1.2
        else if (this.level === 3) this.damage *= 1.5
        else if (this.level === 4) this.lifeTime += 2
        else if (this.level === 5) this.cooldown *= 0.8
    }

    cleanup() {
        if (this.currentPool) this.currentPool.cleanup(this.scene)
        this.currentPool = null
    }
}
