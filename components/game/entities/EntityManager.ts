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
import { MeleeSwing } from './MeleeSwing'
import { VFXManager } from '../systems/VFXManager'

export interface Obstacle {
    x: number
    z: number
    radius: number
}

export class EntityManager {
    player: Player
    enemies: Enemy[] = []
    projectiles: Projectile[] = []
    meleeSwings: MeleeSwing[] = []
    gems: XPGem[] = []
    obstacles: Obstacle[] = []

    private scene: THREE.Scene
    private vfx: VFXManager | null = null
    private enemyPools: Map<string, Enemy[]> = new Map()
    private gemPool: XPGem[] = []
    private projectilePool: Projectile[] = []
    private meleeSwingPool: MeleeSwing[] = []

    private gemColor = 0x00cccc
    private gemEmissive = 0x00ffff

    constructor(scene: THREE.Scene, player: Player, vfx: VFXManager) {
        this.scene = scene
        this.player = player
        this.vfx = vfx
    }

    setObstacles(obstacles: Obstacle[]) {
        this.obstacles = obstacles
    }

    setGemTheme(color: number, emissive: number) {
        this.gemColor = color
        this.gemEmissive = emissive
        for (const gem of this.gems) {
            gem.setColor(color, emissive)
        }
    }

    spawnGem(x: number, z: number, value: number) {
        let gem = this.gemPool.find(g => !g.isActive)
        if (!gem) {
            gem = new XPGem()
            gem.createMesh(this.scene, this.gemColor, this.gemEmissive)
            this.gemPool.push(gem)
            this.gems.push(gem)
        } else {
            // Ensure color matches current theme in case it changed while in pool
            gem.setColor(this.gemColor, this.gemEmissive)
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

    spawnMeleeSwing(x: number, z: number, facingAngle: number, damage: number, radius: number = 3.0, swingDuration: number = 0.3, arcAngle: number = Math.PI * 0.6, color: number = 0xcccccc) {
        let swing = this.meleeSwingPool.find(s => !s.isActive)
        if (!swing) {
            swing = new MeleeSwing()
            swing.createMesh(this.scene, color)
            this.meleeSwingPool.push(swing)
            this.meleeSwings.push(swing)
        }
        swing.spawn(x, z, facingAngle, damage, radius, swingDuration, arcAngle)
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

            // Wire up drops and effects
            enemy.onDie = (x, z, xp) => {
                this.spawnGem(x, z, xp)

                if (type === 'kikimora' && this.vfx) {
                    // Spawn "Slow Patch" visual
                    this.vfx.createEmoji(x, z, '🕸️', 2.0) // 2s duration
                }
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
        this.handlePlayerObstacleCollision()

        // Update Enemies
        for (const enemy of this.enemies) {
            if (enemy.isActive) {
                enemy.update(deltaTime, this.player,
                    // Pass spawn callback for ranged enemies
                    (x, z, vx, vz, dmg) => {
                        this.spawnProjectile(x, z, vx, vz, dmg)
                    }
                )

                // Simple collision check with player
                const dist = enemy.position.distanceTo(this.player.position)
                if (dist < (enemy.radius + this.player.radius)) {
                    this.handlePlayerEnemyCollision(enemy)
                }

                // Obstacle Collision (Environment)
                for (const obs of this.obstacles) {
                    const dx = enemy.position.x - obs.x
                    const dz = enemy.position.z - obs.z
                    const distSq = dx * dx + dz * dz
                    const radii = enemy.radius + obs.radius

                    if (distSq < radii * radii) {
                        const dist = Math.sqrt(distSq)
                        if (dist > 0) { // Avoid divide by zero
                            // Push enemy out
                            const overlap = radii - dist
                            const nx = dx / dist
                            const nz = dz / dist

                            // Adjust position directly
                            enemy.position.x += nx * overlap
                            enemy.position.z += nz * overlap
                            if (enemy.mesh) enemy.mesh.position.set(enemy.position.x, 0, enemy.position.z)
                        }
                    }
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
                            // 2D Distance check (ignore Y axis to prevent misses on small enemies due to height difference)
                            const dx = projectile.position.x - enemy.position.x
                            const dz = projectile.position.z - enemy.position.z
                            const distSq = dx * dx + dz * dz
                            const radii = projectile.radius + enemy.radius

                            if (distSq < radii * radii) {
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

        // Update Melee Swings
        for (const swing of this.meleeSwings) {
            if (swing.isActive) {
                const stillActive = swing.update(deltaTime)
                if (stillActive) {
                    // Check collision with enemies in arc
                    for (let i = 0; i < this.enemies.length; i++) {
                        const enemy = this.enemies[i]
                        if (enemy.isActive) {
                            if (swing.isEnemyInArc(enemy.position.x, enemy.position.z, enemy.radius, i)) {
                                // Hit!
                                enemy.takeDamage(swing.damage, this.vfx || undefined)
                                if (this.vfx) {
                                    this.vfx.createEmoji(enemy.position.x, enemy.position.z, '💥', 0.8)
                                }
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

    private handlePlayerObstacleCollision() {
        for (const obs of this.obstacles) {
            const dx = this.player.position.x - obs.x
            const dz = this.player.position.z - obs.z
            const distSq = dx * dx + dz * dz
            const radii = this.player.radius + obs.radius

            if (distSq < radii * radii) {
                const dist = Math.sqrt(distSq)
                if (dist > 0) { // Avoid divide by zero
                    // Push player out
                    const overlap = radii - dist
                    const nx = dx / dist
                    const nz = dz / dist

                    // Adjust position directly
                    this.player.position.x += nx * overlap
                    this.player.position.z += nz * overlap

                    // Sync mesh immediately to prevent visual clipping
                    if (this.player.mesh) {
                        this.player.mesh.position.set(this.player.position.x, 0.5 + this.player.radius, this.player.position.z)
                    }
                }
            }
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
        for (const swing of this.meleeSwings) {
            swing.despawn()
            if (swing.mesh) this.scene.remove(swing.mesh)
        }
        this.enemies = []
        this.gems = []
        this.projectiles = []
        this.meleeSwings = []
        this.obstacles = []
        this.enemyPools.clear()
        this.gemPool = []
        this.projectilePool = []
        this.meleeSwingPool = []
    }
}
