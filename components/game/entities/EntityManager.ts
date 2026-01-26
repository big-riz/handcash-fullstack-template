import * as THREE from 'three'
import { Player } from './Player'
import { Enemy, EnemyType } from './Enemy'
import { XPGem } from './XPGem'
import { Projectile } from './Projectile'
import { MeleeSwing } from './MeleeSwing'
import { HazardZone, HazardType } from './HazardZone'
import { VFXManager } from '../systems/VFXManager'
import { Quadtree, QuadtreePoint } from '../core/Quadtree'
import { AudioManager } from '../core/AudioManager'
import { SpriteSystem } from '../core/SpriteSystem'

export interface Obstacle {
    x: number
    z: number
    radius: number
    isTemporary?: boolean
    timer?: number
    mesh?: THREE.Mesh
}

export class EntityManager {
    player: Player
    enemies: Enemy[] = []
    projectiles: Projectile[] = []
    meleeSwings: MeleeSwing[] = []
    gems: XPGem[] = []
    hazardZones: HazardZone[] = []
    obstacles: Obstacle[] = []
    public totalKills = 0
    public totalDamageDealt = 0
    public totalDamageTaken = 0

    private scene: THREE.Scene
    private vfx: VFXManager | null = null
    private audioManager: AudioManager | null = null
    private spriteSystem: SpriteSystem | null = null

    // Optimized Object Pools
    private inactiveEnemies: Map<string, Enemy[]> = new Map()
    private inactiveGems: XPGem[] = []
    private inactiveProjectiles: Projectile[] = []
    private inactiveMeleeSwings: MeleeSwing[] = []
    private inactiveHazardZones: HazardZone[] = []

    // Spatial Partitioning
    private enemyQuadtree: Quadtree;

    private gemColor = 0x00cccc
    private gemEmissive = 0x00ffff

    constructor(scene: THREE.Scene, player: Player, vfx: VFXManager, audioManager: AudioManager, spriteSystem: SpriteSystem | null = null) {
        this.scene = scene
        this.player = player
        this.vfx = vfx
        this.audioManager = audioManager
        this.spriteSystem = spriteSystem
        // Initialize Quadtree to cover a large area, e.g., 2000x2000 units centered at origin
        const worldBounds = { x: 0, y: 0, width: 1000, height: 1000 };
        this.enemyQuadtree = new Quadtree(worldBounds, 4);
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
        this.totalKills++
        let gem = this.inactiveGems.pop()
        if (!gem) {
            gem = new XPGem()
            gem.createMesh(this.scene, this.gemColor, this.gemEmissive)
            this.gems.push(gem)
        }
        gem.setColor(this.gemColor, this.gemEmissive)
        gem.spawn(x, z, value)
    }

    spawnProjectile(x: number, z: number, vx: number, vz: number, damage: number, isEnemyProjectile: boolean = false, appliesSlow: boolean = false, appliesCurse: boolean = false) {
        let projectile = this.inactiveProjectiles.pop()
        if (!projectile) {
            projectile = new Projectile()
            projectile.createMesh(this.scene)
            this.projectiles.push(projectile)
        }
        projectile.spawn(x, z, vx, vz, damage, isEnemyProjectile, appliesSlow, appliesCurse)
    }

    spawnMeleeSwing(x: number, z: number, facingAngle: number, damage: number, radius: number = 3.0, swingDuration: number = 0.3, arcAngle: number = Math.PI * 0.6, color: number = 0xcccccc) {
        let swing = this.inactiveMeleeSwings.pop()
        if (!swing) {
            swing = new MeleeSwing()
            swing.createMesh(this.scene, color)
            this.meleeSwings.push(swing)
        }
        swing.spawn(x, z, facingAngle, damage, radius, swingDuration, arcAngle)
    }

    spawnHazardZone(x: number, z: number, type: HazardType, radius: number = 2.0, duration: number = 5.0, damage: number = 5) {
        let hazard = this.inactiveHazardZones.pop()
        if (!hazard) {
            hazard = new HazardZone()
            hazard.createMesh(this.scene)
            this.hazardZones.push(hazard)
        }
        hazard.spawn(x, z, type, radius, duration, damage)
    }

    spawnObstacle(x: number, z: number, radius: number, duration: number) {
        // Create temporary obstacle (rock wall)
        const geometry = new THREE.CylinderGeometry(radius, radius, 2, 16)
        const material = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9,
            metalness: 0.1
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.position.set(x, 1, z)
        mesh.castShadow = true
        mesh.receiveShadow = true
        this.scene.add(mesh)

        const obstacle: Obstacle = {
            x,
            z,
            radius,
            isTemporary: true,
            timer: duration,
            mesh
        }
        this.obstacles.push(obstacle)
    }

    spawnEnemy(type: EnemyType, x: number, z: number, isElite: boolean = false, difficultyMultiplier: number = 1.0): Enemy {
        const pool = this.inactiveEnemies.get(type) || []
        let enemy = pool.pop()

        if (!enemy) {
            enemy = new Enemy(type)
            let color = 0xff4444
            if (type === 'bruiser') color = 0x992222
            else if (type === 'screecher') color = 0xff8833
            else if (type === 'zmora') color = 0x88aaff
            else if (type === 'domovoi') color = 0x66ff66
            else if (type === 'kikimora') color = 0xaa00ff
            else if (type === 'leshy') color = 0x1a2e1a
            else if (type === 'werewolf') color = 0x5d4037
            else if (type === 'forest_wraith') color = 0x00bcd4
            else if (type === 'guardian_golem') color = 0x455a64

            // Sprite mode DISABLED - using 3D meshes
            enemy.useSpriteMode = false
            enemy.createMesh(this.scene, color, this.spriteSystem || undefined)

            if (enemy.mesh) {
                if (type === 'leshy') enemy.mesh.scale.set(3, 3, 3)
                else if (type === 'guardian_golem') enemy.mesh.scale.set(1.5, 1.5, 1.5)
            }

            enemy.onDie = (ex, ez, xp) => {
                this.spawnGem(ex, ez, xp)
                this.audioManager?.playEnemyDie();

                // Special death effects
                if (type === 'tox_shroom') {
                    // Spawn poison cloud
                    this.spawnHazardZone(ex, ez, 'poison', 3.0, 8.0, 10)
                    if (this.vfx) this.vfx.createEmoji(ex, ez, '☠️', 2.0)
                }
                if (type === 'kikimora') {
                    // Spawn slow patch
                    this.spawnHazardZone(ex, ez, 'slow', 2.5, 6.0, 0)
                    if (this.vfx) this.vfx.createEmoji(ex, ez, '🕸️', 2.0)
                }
            }
            this.enemies.push(enemy)
        }

        enemy.spawn(type, x, z, isElite, difficultyMultiplier)
        this.audioManager?.playEnemySpawn(isElite);

        if (enemy.mesh) {
            const mat = enemy.mesh.material as THREE.MeshStandardMaterial
            if (isElite) {
                // Only set emissive if material supports it (not in sprite mode with MeshBasicMaterial)
                if ('emissive' in mat) {
                    mat.emissive.set(0xffd700)
                    mat.emissiveIntensity = 0.5
                }
                const baseScale = type === 'leshy' ? 3 : (type === 'guardian_golem' ? 1.5 : 1)
                enemy.mesh.scale.set(baseScale * 1.5, baseScale * 1.5, baseScale * 1.5)
            } else {
                // Only set emissive if material supports it
                if ('emissive' in mat) {
                    mat.emissive.set(0x000000)
                    mat.emissiveIntensity = 0
                }
                if (type === 'leshy') enemy.mesh.scale.set(3, 3, 3)
                else if (type === 'guardian_golem') enemy.mesh.scale.set(1.5, 1.5, 1.5)
                else enemy.mesh.scale.set(1, 1, 1)
            }
        }

        return enemy
    }

    /**
     * Update all sprite visuals (called after regular update)
     */
    updateSprites(deltaTime: number, cameraPos: THREE.Vector3): void {
        if (!this.spriteSystem) return

        // Update enemy sprites
        for (const enemy of this.enemies) {
            if (enemy.isActive && enemy.useSpriteMode) {
                enemy.updateSprite(deltaTime, cameraPos, this.spriteSystem)
            }
        }
    }

    update(deltaTime: number) {
        this.handlePlayerObstacleCollision()

        // 1. Update enemies and build the quadtree for this frame
        this.enemyQuadtree.clear();
        for (const enemy of this.enemies) {
            if (enemy.isActive) {
                enemy.update(
                    deltaTime,
                    this.player,
                    (x, z, vx, vz, dmg, appliesSlow = false, appliesCurse = false) => this.spawnProjectile(x, z, vx, vz, dmg, true, appliesSlow, appliesCurse),
                    (type, x, z) => this.spawnEnemy(type, x, z),
                    (x, z, angle, dmg, radius) => this.spawnMeleeSwing(x, z, angle, dmg, radius),
                    (x, z, radius, duration) => this.spawnObstacle(x, z, radius, duration)
                )
                this.enemyQuadtree.insert({ x: enemy.position.x, y: enemy.position.z, data: enemy });

                // Player vs Enemy collision (still needed)
                const dist = enemy.position.distanceTo(this.player.position)
                if (dist < (enemy.radius + this.player.radius)) {
                    this.handlePlayerEnemyCollision(enemy)
                }

                // Obstacle Collision (skip if enemy can phase through)
                if (!enemy.canPhaseThrough) {
                    for (const obs of this.obstacles) {
                        const dx = enemy.position.x - obs.x
                        const dz = enemy.position.z - obs.z
                        const distSq = dx * dx + dz * dz
                        const radii = enemy.radius + obs.radius
                        if (distSq < radii * radii) {
                            const dist = Math.sqrt(distSq)
                            if (dist > 0) {
                                const overlap = radii - dist
                                const nx = dx / dist
                                const nz = dz / dist
                                enemy.position.x += nx * overlap
                                enemy.position.z += nz * overlap
                                if (enemy.mesh) enemy.mesh.position.set(enemy.position.x, 0, enemy.position.z)
                            }
                        }
                    }
                }
            } else {
                const pool = this.inactiveEnemies.get(enemy.type) || []
                if (!pool.includes(enemy)) pool.push(enemy)
                this.inactiveEnemies.set(enemy.type, pool)
            }
        }

        // Apply enemy separation - keep enemies from stacking
        for (const enemy of this.enemies) {
            if (enemy.isActive && enemy.stats.moveSpeed > 0) {
                const separationRadius = enemy.radius * 3
                const nearbyPoints = this.enemyQuadtree.query({
                    x: enemy.position.x,
                    y: enemy.position.z,
                    width: separationRadius,
                    height: separationRadius
                })

                let separationX = 0
                let separationZ = 0
                let neighborCount = 0

                for (const point of nearbyPoints) {
                    const other = point.data as Enemy
                    if (other !== enemy && other.isActive) {
                        const dx = enemy.position.x - other.position.x
                        const dz = enemy.position.z - other.position.z
                        const distSq = dx * dx + dz * dz
                        const minDist = enemy.radius + other.radius

                        if (distSq < minDist * minDist * 4) {
                            const dist = Math.sqrt(distSq)
                            if (dist > 0.01) {
                                const force = (1 - dist / (minDist * 2))
                                separationX += (dx / dist) * force
                                separationZ += (dz / dist) * force
                                neighborCount++
                            }
                        }
                    }
                }

                if (neighborCount > 0) {
                    const separationStrength = 2.0
                    enemy.position.x += separationX * separationStrength * deltaTime
                    enemy.position.z += separationZ * separationStrength * deltaTime
                    if (enemy.mesh) {
                        enemy.mesh.position.set(enemy.position.x, enemy.radius, enemy.position.z)
                    }
                }
            }
        }

        // Apply buff auras from shamans
        // First, reset all buff flags
        for (const enemy of this.enemies) {
            if (enemy.isActive) enemy.isBuffed = false
        }
        // Then check for shamans and buff nearby enemies
        for (const shaman of this.enemies) {
            if (shaman.isActive && shaman.providesBuffAura) {
                for (const enemy of this.enemies) {
                    if (enemy.isActive && enemy !== shaman) {
                        const dist = shaman.position.distanceTo(enemy.position)
                        if (dist < shaman.buffAuraRadius) {
                            enemy.isBuffed = true
                        }
                    }
                }
            }
        }

        // 2. Update projectiles and check for collisions using the quadtree
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                if (projectile.update(deltaTime)) {
                    if (projectile.isEnemyProjectile) {
                        // Enemy projectile - check collision with player
                        const dx = projectile.position.x - this.player.position.x;
                        const dz = projectile.position.z - this.player.position.z;
                        const distSq = dx * dx + dz * dz;
                        const radii = projectile.radius + this.player.radius;

                        if (distSq < radii * radii) {
                            this.player.takeDamage(projectile.damage);
                            this.totalDamageTaken += projectile.damage;
                            this.audioManager?.playPlayerHurt();

                            // Apply special effects
                            if (projectile.appliesSlow) {
                                this.player.isSlowed = true
                                this.player.slowFactor = 0.5 // 50% speed
                                this.player.slowTimer = projectile.slowDuration
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '❄️', 0.8);
                            } else if (projectile.appliesCurse) {
                                this.player.isCursed = true
                                this.player.curseMultiplier = 1.5 // Take 50% more damage
                                this.player.curseTimer = projectile.curseDuration
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '👻', 0.8);
                            } else {
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '💥', 0.8);
                            }

                            projectile.despawn();
                        }
                    } else {
                        // Player projectile - check collision with enemies
                        const searchRadius = projectile.radius + 5; // Query a slightly larger area
                        const nearbyPoints = this.enemyQuadtree.query({ x: projectile.position.x, y: projectile.position.z, width: searchRadius, height: searchRadius });

                        for (const point of nearbyPoints) {
                            const enemy = point.data as Enemy;
                            if (enemy.isActive) {
                                const dx = projectile.position.x - enemy.position.x;
                                const dz = projectile.position.z - enemy.position.z;
                                const distSq = dx * dx + dz * dz;
                                const radii = projectile.radius + enemy.radius;

                                if (distSq < radii * radii) {
                                    enemy.takeDamage(projectile.damage, this.vfx || undefined);
                                    this.totalDamageDealt += projectile.damage;
                                    this.audioManager?.playEnemyHurt();
                                    if (this.vfx) this.vfx.createEmoji(enemy.position.x, enemy.position.z, '⚔️', 0.8);
                                    projectile.despawn();
                                    break; // Projectile hits one enemy and is destroyed
                                }
                            }
                        }
                    }
                }
            } else {
                if (!this.inactiveProjectiles.includes(projectile)) this.inactiveProjectiles.push(projectile)
            }
        }

        // 3. Update melee swings and check for collisions using the quadtree
        for (const swing of this.meleeSwings) {
            if (swing.isActive) {
                if (swing.update(deltaTime)) {
                    const searchRadius = swing.radius + 2; // Broad phase check
                    const nearbyPoints = this.enemyQuadtree.query({ x: swing.position.x, y: swing.position.z, width: searchRadius, height: searchRadius });

                    for (const point of nearbyPoints) {
                        const enemy = point.data as Enemy;
                        if (enemy.isActive && swing.isEnemyInArc(enemy.position.x, enemy.position.z, enemy.radius, enemy.id)) {
                             enemy.takeDamage(swing.damage, this.vfx || undefined);
                             this.totalDamageDealt += swing.damage;
                             this.audioManager?.playEnemyHurt();
                             if (this.vfx) this.vfx.createEmoji(enemy.position.x, enemy.position.z, '💥', 0.8);
                        }
                    }
                }
            } else {
                if (!this.inactiveMeleeSwings.includes(swing)) this.inactiveMeleeSwings.push(swing)
            }
        }

        // 4. Update Gems
        for (const gem of this.gems) {
            if (gem.isActive) {
                if (gem.update(deltaTime, this.player.position, this.player.stats.magnet)) {
                    this.player.addXp(gem.value)
                    this.audioManager?.playGemPickup();
                    if (this.vfx) this.vfx.createEmoji(gem.position.x, gem.position.z, '✨', 0.8)
                }
            } else {
                 if (!this.inactiveGems.includes(gem)) this.inactiveGems.push(gem)
            }
        }

        // 5. Update Hazard Zones (poison clouds, slow patches, etc.)
        for (const hazard of this.hazardZones) {
            if (hazard.isActive) {
                hazard.update(deltaTime)

                // Check player collision
                if (hazard.checkPlayerCollision(this.player.position)) {
                    if (hazard.type === 'poison' && hazard.shouldApplyDamage()) {
                        // Apply poison damage
                        this.player.takeDamage(hazard.damage)
                        this.totalDamageTaken += hazard.damage
                        if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '☠️', 0.5)
                    } else if (hazard.type === 'slow') {
                        // Apply slow effect (handled in player movement via getSlowFactor)
                        this.player.isSlowed = true
                        this.player.slowFactor = hazard.slowFactor
                    }
                }
            } else {
                if (!this.inactiveHazardZones.includes(hazard)) this.inactiveHazardZones.push(hazard)
            }
        }

        // Reset slow if player is not in any slow zone
        let isInSlowZone = false
        for (const hazard of this.hazardZones) {
            if (hazard.isActive && hazard.type === 'slow' && hazard.checkPlayerCollision(this.player.position)) {
                isInSlowZone = true
                break
            }
        }
        if (!isInSlowZone && this.player.isSlowed) {
            this.player.isSlowed = false
            this.player.slowFactor = 1.0
        }

        // 6. Update temporary obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i]
            if (obstacle.isTemporary && obstacle.timer !== undefined) {
                obstacle.timer -= deltaTime
                if (obstacle.timer <= 0) {
                    // Remove expired obstacle
                    if (obstacle.mesh) {
                        this.scene.remove(obstacle.mesh)
                        obstacle.mesh.geometry.dispose()
                        if (obstacle.mesh.material instanceof THREE.Material) {
                            obstacle.mesh.material.dispose()
                        }
                    }
                    this.obstacles.splice(i, 1)
                }
            }
        }
    }


    private handlePlayerEnemyCollision(enemy: Enemy) {
        // Player takes damage (contact damage) - 70% of enemy damage
        // Apply 1.3x damage if enemy is buffed by shaman
        // Standing still will result in rapid health loss
        const buffMultiplier = enemy.isBuffed ? 1.3 : 1.0
        const damage = enemy.stats.damage * 0.7 * buffMultiplier
        const tookDamage = this.player.takeDamage(damage)
        if (tookDamage) {
            this.totalDamageTaken += damage;
            this.audioManager?.playPlayerHurt();
        }

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
        for (const hazard of this.hazardZones) {
            hazard.despawn()
            if (hazard.mesh) this.scene.remove(hazard.mesh)
        }
        this.enemies = []
        this.gems = []
        this.projectiles = []
        this.meleeSwings = []
        this.hazardZones = []
        this.obstacles = []
        this.inactiveEnemies.clear()
        this.inactiveGems = []
        this.inactiveProjectiles = []
        this.inactiveMeleeSwings = []
        this.inactiveHazardZones = []
        if (this.enemyQuadtree) {
            this.enemyQuadtree.clear()
        }

        // Reset stat counters
        this.totalKills = 0
        this.totalDamageDealt = 0
        this.totalDamageTaken = 0
    }
}
