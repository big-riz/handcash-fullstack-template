import * as THREE from 'three'
import { Player } from './Player'
import { Enemy, EnemyType, BOSS_TYPES } from './Enemy'
import { XPGem } from './XPGem'
import { Projectile } from './Projectile'
import { MeleeSwing } from './MeleeSwing'
import { HazardZone, HazardType } from './HazardZone'
import { VFXManager } from '../systems/VFXManager'
import { Quadtree, QuadtreePoint } from '../core/Quadtree'
import { AudioManager } from '../core/AudioManager'
import { SpriteSystem } from '../core/SpriteSystem'
import { InstancedRenderer } from '../systems/InstancedRenderer'
import { InstancedHealthBars, InstancedGems, InstancedProjectiles } from '../systems/InstancedBatch'

export interface Obstacle {
    x: number
    z: number
    radius: number
    isTemporary?: boolean
    timer?: number
    mesh?: THREE.Mesh
}

// Color lookup for every enemy type
const ENEMY_COLORS: Record<string, number> = {
    drifter: 0xff4444,
    screecher: 0xff8833,
    bruiser: 0x992222,
    zmora: 0x88aaff,
    domovoi: 0x66ff66,
    kikimora: 0xaa00ff,
    leshy: 0x1a2e1a,
    vodnik: 0x4488ff,
    werewolf: 0x5d4037,
    forest_wraith: 0x00bcd4,
    guardian_golem: 0x455a64,
    sapling: 0x8bc34a,
    tox_shroom: 0x9c27b0,
    stone_golem: 0x607d8b,
    spirit_wolf: 0x03a9f4,
    leshy_shaman: 0x4caf50,
    ancient_treant: 0x3e2723,
    wasp_swarm: 0xffc107,
    golem_destroyer: 0x263238,
    shadow_stalker: 0x424242,
    chernobog: 0x000000,
    frost_bat: 0x90caf9,
    bone_crawler: 0xd7ccc8,
    flame_wraith: 0xff5722,
    crypt_guardian: 0x4e342e,
    frost_elemental: 0x80deea,
    snow_wraith: 0xe0e0e0,
    ice_golem: 0x4fc3f7,
    blizzard_wolf: 0xb3e5fc,
}

// Default radius per enemy type (used by InstancedRenderer to register geometry)
const ENEMY_RADII: Record<string, number> = {
    drifter: 0.3,
    screecher: 0.25,
    bruiser: 0.55,
    zmora: 0.3,
    domovoi: 0.15,
    kikimora: 0.4,
    vodnik: 0.35,
    werewolf: 0.45,
    forest_wraith: 0.5,
    sapling: 0.2,
    tox_shroom: 0.4,
    stone_golem: 0.8,
    spirit_wolf: 0.35,
    leshy_shaman: 0.4,
    wasp_swarm: 0.3,
    shadow_stalker: 0.3,
    frost_bat: 0.2,
    bone_crawler: 0.35,
    flame_wraith: 0.35,
    frost_elemental: 0.4,
    snow_wraith: 0.45,
    blizzard_wolf: 0.3,
}

const BOSS_SCALES: Record<string, number> = {
    leshy: 3,
    guardian_golem: 1.5,
    ancient_treant: 3.5,
    golem_destroyer: 2.5,
    chernobog: 4,
    crypt_guardian: 2,
    ice_golem: 2,
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

    // Instanced rendering
    private instancedRenderer: InstancedRenderer
    private instancedHealthBars: InstancedHealthBars
    private instancedGems: InstancedGems
    private instancedProjectiles: InstancedProjectiles

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
        const worldBounds = { x: 0, y: 0, width: 1000, height: 1000 };
        this.enemyQuadtree = new Quadtree(worldBounds, 4);

        // Create instanced renderer for regular enemies
        this.instancedRenderer = new InstancedRenderer(scene, 600)

        // Pre-register all non-boss enemy types
        for (const [type, radius] of Object.entries(ENEMY_RADII)) {
            if (!BOSS_TYPES.has(type as EnemyType)) {
                this.instancedRenderer.registerEnemyType(type, radius, ENEMY_COLORS[type] || 0xff4444)
            }
        }

        // Instanced batches for health bars, gems, projectiles
        this.instancedHealthBars = new InstancedHealthBars(scene, 600)
        this.instancedGems = new InstancedGems(scene, this.gemColor, this.gemEmissive, 200)
        this.instancedProjectiles = new InstancedProjectiles(scene, 300)
    }

    setObstacles(obstacles: Obstacle[]) {
        this.obstacles = obstacles
    }

    setGemTheme(color: number, emissive: number) {
        this.gemColor = color
        this.gemEmissive = emissive
        this.instancedGems.setColor(color, emissive)
    }

    setHealthBarsEnabled(enabled: boolean) {
        Enemy.healthBarsEnabled = enabled
        console.log(`[EntityManager] Health bars ${enabled ? 'enabled' : 'disabled'}`)
    }

    spawnGem(x: number, z: number, value: number) {
        this.totalKills++
        let gem = this.inactiveGems.pop()
        if (!gem) {
            gem = new XPGem()
            this.gems.push(gem)
        }
        gem.spawn(x, z, value)
    }

    spawnProjectile(x: number, z: number, vx: number, vz: number, damage: number, isEnemyProjectile: boolean = false, appliesSlow: boolean = false, appliesCurse: boolean = false) {
        let projectile = this.inactiveProjectiles.pop()
        if (!projectile) {
            projectile = new Projectile()
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

        const obstacle: Obstacle = { x, z, radius, isTemporary: true, timer: duration, mesh }
        this.obstacles.push(obstacle)
    }

    spawnEnemy(type: EnemyType, x: number, z: number, isElite: boolean = false, difficultyMultiplier: number = 1.0): Enemy {
        const pool = this.inactiveEnemies.get(type) || []
        let enemy = pool.pop()

        if (!enemy) {
            enemy = new Enemy(type)
            const color = ENEMY_COLORS[type] || 0xff4444

            enemy.useSpriteMode = false
            // createMesh: bosses get real 3D mesh + googly eyes, regular enemies get only health bars
            enemy.createMesh(this.scene, color, this.spriteSystem || undefined)

            // Lazily register unknown types with InstancedRenderer
            if (!enemy.isBoss && !this.instancedRenderer.hasType(type)) {
                this.instancedRenderer.registerEnemyType(type, enemy.radius, color)
            }

            // Scale boss meshes
            if (enemy.mesh && enemy.isBoss) {
                const s = BOSS_SCALES[type] || 1
                enemy.mesh.scale.set(s, s, s)
            }

            enemy.onDie = (ex, ez, xp) => {
                this.spawnGem(ex, ez, xp)
                this.audioManager?.playEnemyDie();

                if (type === 'tox_shroom') {
                    this.spawnHazardZone(ex, ez, 'poison', 3.0, 8.0, 10)
                    if (this.vfx) this.vfx.createEmoji(ex, ez, '☠️', 2.0)
                }
                if (type === 'kikimora') {
                    this.spawnHazardZone(ex, ez, 'slow', 2.5, 6.0, 0)
                    if (this.vfx) this.vfx.createEmoji(ex, ez, '🕸️', 2.0)
                }
            }
            this.enemies.push(enemy)
        }

        enemy.spawn(type, x, z, isElite, difficultyMultiplier)
        this.audioManager?.playEnemySpawn(isElite);

        // Scale boss mesh for elite
        if (enemy.mesh && enemy.isBoss) {
            const mat = enemy.mesh.material as THREE.MeshStandardMaterial
            const baseScale = BOSS_SCALES[type] || 1

            if (isElite) {
                mat.emissive.set(0xffd700)
                mat.emissiveIntensity = 0.5
                enemy.mesh.scale.set(baseScale * 1.5, baseScale * 1.5, baseScale * 1.5)
            } else {
                mat.emissive.set(0x000000)
                mat.emissiveIntensity = 0
                enemy.mesh.scale.set(baseScale, baseScale, baseScale)
            }
        }

        return enemy
    }

    updateSprites(deltaTime: number, cameraPos: THREE.Vector3): void {
        if (!this.spriteSystem) return
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

                const dist = enemy.position.distanceTo(this.player.position)
                if (dist < (enemy.radius + this.player.radius)) {
                    this.handlePlayerEnemyCollision(enemy)
                }

                if (!enemy.canPhaseThrough) {
                    for (const obs of this.obstacles) {
                        const dx = enemy.position.x - obs.x
                        const dz = enemy.position.z - obs.z
                        const distSq = dx * dx + dz * dz
                        const radii = enemy.radius + obs.radius
                        if (distSq < radii * radii) {
                            const d = Math.sqrt(distSq)
                            if (d > 0) {
                                const overlap = radii - d
                                enemy.position.x += (dx / d) * overlap
                                enemy.position.z += (dz / d) * overlap
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

        // Apply enemy separation
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
                    // Sync boss mesh immediately after separation push
                    if (enemy.mesh && enemy.isBoss) {
                        enemy.mesh.position.set(enemy.position.x, enemy.radius, enemy.position.z)
                    }
                }
            }
        }

        // Buff auras
        for (const enemy of this.enemies) {
            if (enemy.isActive) enemy.isBuffed = false
        }
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

        // --- Sync InstancedRenderer for non-boss enemies ---
        const instanceData: Array<{
            type: string; x: number; z: number; radius: number; scale: number; isActive: boolean
        }> = []
        for (const enemy of this.enemies) {
            if (!enemy.isBoss && enemy.isActive) {
                instanceData.push({
                    type: enemy.type,
                    x: enemy.position.x,
                    z: enemy.position.z,
                    radius: enemy.radius,
                    scale: enemy.isElite ? 1.5 : 1,
                    isActive: true,
                })
            }
        }
        this.instancedRenderer.updateInstances(instanceData)

        // 2. Update projectiles
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                if (projectile.update(deltaTime)) {
                    if (projectile.isEnemyProjectile) {
                        const dx = projectile.position.x - this.player.position.x;
                        const dz = projectile.position.z - this.player.position.z;
                        const distSq = dx * dx + dz * dz;
                        const radii = projectile.radius + this.player.radius;

                        if (distSq < radii * radii) {
                            this.player.takeDamage(projectile.damage);
                            this.totalDamageTaken += projectile.damage;
                            this.audioManager?.playPlayerHurt();

                            if (projectile.appliesSlow) {
                                this.player.isSlowed = true
                                this.player.slowFactor = 0.5
                                this.player.slowTimer = projectile.slowDuration
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '❄️', 0.8);
                            } else if (projectile.appliesCurse) {
                                this.player.isCursed = true
                                this.player.curseMultiplier = 1.5
                                this.player.curseTimer = projectile.curseDuration
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '👻', 0.8);
                            } else {
                                if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '💥', 0.8);
                            }

                            projectile.despawn();
                        }
                    } else {
                        const searchRadius = projectile.radius + 5;
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
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                if (!this.inactiveProjectiles.includes(projectile)) this.inactiveProjectiles.push(projectile)
            }
        }

        // 3. Melee swings
        for (const swing of this.meleeSwings) {
            if (swing.isActive) {
                if (swing.update(deltaTime)) {
                    const searchRadius = swing.radius + 2;
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

        // 4. Gems
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

        // 5. Hazard Zones
        for (const hazard of this.hazardZones) {
            if (hazard.isActive) {
                hazard.update(deltaTime)
                if (hazard.checkPlayerCollision(this.player.position)) {
                    if (hazard.type === 'poison' && hazard.shouldApplyDamage()) {
                        this.player.takeDamage(hazard.damage)
                        this.totalDamageTaken += hazard.damage
                        if (this.vfx) this.vfx.createEmoji(this.player.position.x, this.player.position.z, '☠️', 0.5)
                    } else if (hazard.type === 'slow') {
                        this.player.isSlowed = true
                        this.player.slowFactor = hazard.slowFactor
                    }
                }
            } else {
                if (!this.inactiveHazardZones.includes(hazard)) this.inactiveHazardZones.push(hazard)
            }
        }

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

        // 6. Temporary obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i]
            if (obstacle.isTemporary && obstacle.timer !== undefined) {
                obstacle.timer -= deltaTime
                if (obstacle.timer <= 0) {
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

        // --- Sync instanced batches ---

        // Health bars (all enemies)
        if (Enemy.healthBarsEnabled) {
            const healthData: Array<{
                x: number; z: number; radius: number
                currentHp: number; maxHp: number; isActive: boolean
            }> = []
            for (const enemy of this.enemies) {
                if (enemy.isActive) {
                    healthData.push({
                        x: enemy.position.x,
                        z: enemy.position.z,
                        radius: enemy.radius,
                        currentHp: enemy.stats.currentHp,
                        maxHp: enemy.stats.maxHp,
                        isActive: true,
                    })
                }
            }
            this.instancedHealthBars.updateBars(healthData)
        } else {
            this.instancedHealthBars.updateBars([])
        }

        // Gems
        const gemData: Array<{ x: number; y: number; z: number; isActive: boolean }> = []
        for (const gem of this.gems) {
            if (gem.isActive) {
                gemData.push({
                    x: gem.position.x,
                    y: gem.position.y,
                    z: gem.position.z,
                    isActive: true,
                })
            }
        }
        this.instancedGems.updateGems(gemData)

        // Projectiles
        const projData: Array<{
            x: number; z: number; vx: number; vz: number
            isActive: boolean; isEnemy: boolean; appliesSlow: boolean; appliesCurse: boolean
        }> = []
        for (const projectile of this.projectiles) {
            if (projectile.isActive) {
                projData.push({
                    x: projectile.position.x,
                    z: projectile.position.z,
                    vx: projectile.velocity.x,
                    vz: projectile.velocity.z,
                    isActive: true,
                    isEnemy: projectile.isEnemyProjectile,
                    appliesSlow: projectile.appliesSlow,
                    appliesCurse: projectile.appliesCurse,
                })
            }
        }
        this.instancedProjectiles.updateProjectiles(projData)
    }


    private handlePlayerEnemyCollision(enemy: Enemy) {
        const buffMultiplier = enemy.isBuffed ? 1.3 : 1.0
        const damage = enemy.stats.damage * 0.7 * buffMultiplier
        const tookDamage = this.player.takeDamage(damage)
        if (tookDamage) {
            this.totalDamageTaken += damage;
            this.audioManager?.playPlayerHurt();
        }

        if (tookDamage && this.vfx) {
            this.vfx.createDamageNumber(
                this.player.position.x,
                this.player.position.z,
                Math.max(1, damage - this.player.stats.armor),
                '#ff4444',
                1.5
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
                if (dist > 0) {
                    const overlap = radii - dist
                    const nx = dx / dist
                    const nz = dz / dist
                    this.player.position.x += nx * overlap
                    this.player.position.z += nz * overlap
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
            if (enemy.googlyEyes) enemy.googlyEyes.dispose()
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
        }
        for (const projectile of this.projectiles) {
            projectile.despawn()
        }
        for (const swing of this.meleeSwings) {
            swing.despawn()
            if (swing.mesh) this.scene.remove(swing.mesh)
        }
        for (const hazard of this.hazardZones) {
            hazard.despawn()
            if (hazard.mesh) this.scene.remove(hazard.mesh)
        }

        // Dispose and recreate instanced renderers
        this.instancedRenderer.dispose()
        this.instancedHealthBars.dispose()
        this.instancedGems.dispose()
        this.instancedProjectiles.dispose()

        this.instancedRenderer = new InstancedRenderer(this.scene, 600)
        for (const [type, radius] of Object.entries(ENEMY_RADII)) {
            if (!BOSS_TYPES.has(type as EnemyType)) {
                this.instancedRenderer.registerEnemyType(type, radius, ENEMY_COLORS[type] || 0xff4444)
            }
        }
        this.instancedHealthBars = new InstancedHealthBars(this.scene, 600)
        this.instancedGems = new InstancedGems(this.scene, this.gemColor, this.gemEmissive, 200)
        this.instancedProjectiles = new InstancedProjectiles(this.scene, 300)

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

        this.totalKills = 0
        this.totalDamageDealt = 0
        this.totalDamageTaken = 0
    }
}
