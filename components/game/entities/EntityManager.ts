/**
 * EntityManager.ts
 * 
 * Manages all game entities (Player, Enemies, Projectiles, Drops).
 * Handles spawning, pooling, and updates.
 */

import * as THREE from 'three'
import { Player } from './Player'
import { Enemy, EnemyType } from './Enemy'
import { XPGem } from './XPGem'
import { Projectile } from './Projectile'
import { VFXManager } from '../systems/VFXManager'

export class EntityManager {
    player: Player
    enemies: Enemy[] = []
    projectiles: Projectile[] = []
    gems: XPGem[] = []

    private scene: THREE.Scene
    private vfx: VFXManager | null = null
    private enemyPools: Map<string, Enemy[]> = new Map()
    private gemPool: XPGem[] = []
    private projectilePool: Projectile[] = []

    constructor(scene: THREE.Scene, player: Player, vfx: VFXManager) {
        this.scene = scene
        this.player = player
        this.vfx = vfx
    }

    spawnGem(x: number, z: number, value: number) {
        let gem = this.gemPool.find(g => !g.isActive)
        if (!gem) {
            gem = new XPGem()
            gem.createMesh(this.scene)
            this.gemPool.push(gem)
            this.gems.push(gem)
        }
        gem.spawn(x, z, value)
    }


    spawnProjectile(x: number, z: number, vx: number, vz: number, damage: number) {
        let projectile = this.projectilePool.find(p => !p.isActive)
        if (!projectile) {
            projectile = new Projectile()
            projectile.createMesh(this.scene)
            this.projectilePool.push(projectile)
            this.projectiles.push(projectile)
        }
        projectile.spawn(x, z, vx, vz, damage)
    }

    spawnEnemy(type: EnemyType, x: number, z: number, isElite: boolean = false): Enemy {
        let enemy: Enemy

        // Try to get from pool
        const pool = this.enemyPools.get(type) || []
        const available = pool.find(e => !e.isActive)

        if (available) {
            enemy = available
        } else {
            enemy = new Enemy(type)
            let color = 0xff4444
            if (type === 'bruiser') color = 0x992222
            else if (type === 'screecher') color = 0xff8833
            else if (type === 'zmora') color = 0x88aaff
            else if (type === 'domovoi') color = 0x66ff66
            else if (type === 'kikimora') color = 0xaa00ff
            else if (type === 'leshy') color = 0x1a2e1a

            enemy.createMesh(this.scene, color)

            // Apply scale for Boss
            if (type === 'leshy' && enemy.mesh) {
                enemy.mesh.scale.set(3, 3, 3)
            }

            // Wire up drops
            enemy.onDie = (x, z, xp) => {
                this.spawnGem(x, z, xp)
            }

            pool.push(enemy)
            this.enemyPools.set(type, pool)
            this.enemies.push(enemy)
        }

        enemy.spawn(type, x, z, isElite)

        // Elite visual highlight
        if (enemy.mesh) {
            const mat = enemy.mesh.material as THREE.MeshStandardMaterial
            if (isElite) {
                mat.emissive.set(0xffd700) // Golden glow
                mat.emissiveIntensity = 0.5
                // Boost scale relative to base
                const baseScale = type === 'leshy' ? 3 : 1
                enemy.mesh.scale.set(baseScale * 1.5, baseScale * 1.5, baseScale * 1.5)
            } else {
                mat.emissive.set(0x000000)
                mat.emissiveIntensity = 0
                if (type !== 'leshy') enemy.mesh.scale.set(1, 1, 1)
            }
        }

        return enemy
    }

    update(deltaTime: number) {
        // Update Player
        // Note: Movement input is handled in SlavicSurvivors.tsx and passed to player.update

        // Update Enemies
        for (const enemy of this.enemies) {
            if (enemy.isActive) {
                enemy.update(deltaTime, this.player)

                // Simple collision check with player
                const dist = enemy.position.distanceTo(this.player.position)
                if (dist < (enemy.radius + this.player.radius)) {
                    this.handlePlayerEnemyCollision(enemy)
                }
            }
        }

        // Update Projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                const stillActive = projectile.update(deltaTime)
                if (stillActive) {
                    // Check collision with any active enemy
                    for (const enemy of this.enemies) {
                        if (enemy.isActive) {
                            const dist = projectile.position.distanceTo(enemy.position)
                            if (dist < (projectile.radius + enemy.radius)) {
                                // Hit!
                                enemy.takeDamage(projectile.damage, this.vfx || undefined)
                                if (this.vfx) {
                                    this.vfx.createEmoji(enemy.position.x, enemy.position.z, '⚔️', 0.8)
                                }
                                projectile.despawn()
                                break
                            }
                        }
                    }
                }
            }
        }

        // Update Gems
        for (const gem of this.gems) {
            if (gem.isActive) {
                const collected = gem.update(deltaTime, this.player.position, this.player.stats.magnet)
                if (collected) {
                    this.player.addXp(gem.value)
                    if (this.vfx) this.vfx.createEmoji(gem.position.x, gem.position.z, '✨', 0.8)
                }
            }
        }

    }

    private handlePlayerEnemyCollision(enemy: Enemy) {
        // Player takes damage (contact damage)
        const damage = enemy.stats.damage * 0.5 // Nerfed base contact damage
        const tookDamage = this.player.takeDamage(damage)

        if (tookDamage && this.vfx) {
            // Player hit indicator in RED
            this.vfx.createDamageNumber(
                this.player.position.x,
                this.player.position.z,
                Math.max(1, damage - this.player.stats.armor),
                '#ff4444',
                1.5 // Larger scale for player damage
            )
        }
    }

    cleanup() {
        for (const enemy of this.enemies) {
            enemy.die()
            if (enemy.mesh) {
                this.scene.remove(enemy.mesh)
                enemy.mesh.geometry.dispose()
                if (enemy.mesh.material instanceof THREE.Material) {
                    enemy.mesh.material.dispose()
                }
            }
        }
        for (const gem of this.gems) {
            gem.despawn()
            if (gem.mesh) this.scene.remove(gem.mesh)
        }
        for (const projectile of this.projectiles) {
            projectile.despawn()
            if (projectile.mesh) this.scene.remove(projectile.mesh)
        }
        this.enemies = []
        this.gems = []
        this.projectiles = []
        this.enemyPools.clear()
        this.gemPool = []
        this.projectilePool = []
    }
}
