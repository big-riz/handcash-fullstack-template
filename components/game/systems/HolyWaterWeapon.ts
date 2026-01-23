/**
 * HolyWaterWeapon.ts
 * 
 * Svyata Voda - Creates lingering damage pools on the ground.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'

class HolyWaterPool {
    mesh: THREE.Mesh
    radius: number
    damage: number
    lifeTime: number
    currentLife = 0
    tickRate = 0.5
    tickTimer = 0
    isActive = true

    constructor(scene: THREE.Scene, x: number, z: number, radius: number, damage: number, lifeTime: number) {
        this.radius = radius
        this.damage = damage
        this.lifeTime = lifeTime

        const geometry = new THREE.CircleGeometry(radius, 32)
        const material = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.4,
            emissive: 0x4488ff,
            emissiveIntensity: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.rotation.x = -Math.PI / 2
        this.mesh.position.set(x, 0.02, z)
        scene.add(this.mesh)
    }

    update(deltaTime: number, enemies: any[], vfx: VFXManager, areaMult: number, damageMult: number): boolean {
        this.currentLife += deltaTime
        this.tickTimer += deltaTime

        // Pulsing effect
        const baseScale = 1 + Math.sin(this.currentLife * 5) * 0.1
        const s = baseScale * areaMult
        this.mesh.scale.set(s, s, 1)

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
        for (const enemy of enemies) {
            if (enemy.isActive) {
                const dx = enemy.position.x - this.mesh.position.x
                const dz = enemy.position.z - this.mesh.position.z
                const distSq = dx * dx + dz * dz
                const effectiveRadius = this.radius * areaMult
                const effectiveDamage = this.damage * damageMult
                if (distSq <= (effectiveRadius + enemy.radius) * (effectiveRadius + enemy.radius)) {
                    enemy.takeDamage(effectiveDamage, vfx)
                    vfx.createEmoji(enemy.position.x, enemy.position.z, '💧', 0.6)
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

export class HolyWaterWeapon {
    private cooldown = 4.0
    private timer = 0
    private pools: HolyWaterPool[] = []
    private level = 1

    // Stats
    private damage = 10
    private count = 1
    private radius = 2.5
    private lifeTime = 5.0

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any // SeededRandom
    ) { }

    update(deltaTime: number) {
        this.timer += deltaTime
        const effectiveCooldown = this.cooldown * this.player.stats.cooldownMultiplier
        if (this.timer >= effectiveCooldown) {
            this.fire()
            this.timer = 0
        }

        // Update active pools
        const areaMult = this.player.stats.areaMultiplier
        const damageMult = this.player.stats.damageMultiplier
        for (let i = this.pools.length - 1; i >= 0; i--) {
            const active = this.pools[i].update(deltaTime, this.entityManager.enemies, this.vfx, areaMult, damageMult)
            if (!active) {
                this.pools[i].cleanup(this.scene)
                this.pools.splice(i, 1)
            }
        }
    }

    fire() {
        for (let i = 0; i < this.count; i++) {
            // Find a target near player or random
            let tx, tz
            const enemies = this.entityManager.enemies.filter(e => e.isActive)

            if (enemies.length > 0) {
                const target = enemies[Math.floor(this.rng.next() * enemies.length)]
                tx = target.position.x + (this.rng.next() - 0.5) * 2
                tz = target.position.z + (this.rng.next() - 0.5) * 2
            } else {
                const angle = this.rng.next() * Math.PI * 2
                const dist = 5 + this.rng.next() * 5
                tx = this.player.position.x + Math.cos(angle) * dist
                tz = this.player.position.z + Math.sin(angle) * dist
            }

            this.pools.push(new HolyWaterPool(this.scene, tx, tz, this.radius, this.damage, this.lifeTime))
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Create lingering damage pools on the ground."
            case 2: return "Larger pools (+30% radius)."
            case 3: return "Additional pool (+1 count)."
            case 4: return "Purified water (+50% damage)."
            case 5: return "Persistent holy ground (+2s duration)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.radius *= 1.3
        else if (this.level === 3) this.count++
        else if (this.level === 4) this.damage *= 1.5
        else if (this.level === 5) this.lifeTime += 2
    }

    cleanup() {
        for (const pool of this.pools) {
            pool.cleanup(this.scene)
        }
        this.pools = []
    }
}
