import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'

export class BotController {
    private scene: THREE.Scene
    private player: Player
    private entityManager: EntityManager
    
    // Debug Helpers
    private movementArrow?: THREE.ArrowHelper
    private gemArrow?: THREE.ArrowHelper
    private targetLine?: THREE.Line
    private threatLine?: THREE.Line
    private debugVisuals: boolean

    constructor(scene: THREE.Scene, player: Player, entityManager: EntityManager, enableDebugVisuals: boolean = false) {
        this.scene = scene
        this.player = player
        this.entityManager = entityManager
        this.debugVisuals = enableDebugVisuals

        if (this.debugVisuals) {
            // Setup Visuals
            this.movementArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), player.position, 2, 0x00ff00)
            this.scene.add(this.movementArrow)

            // Gem Arrow (Blue - Gem Gravity - Longer, Slow Strong Influence)
            this.gemArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), player.position, 4, 0x0000ff)
            this.scene.add(this.gemArrow)

            // Target Line (Green - to Gem)
            const targetMat = new THREE.LineBasicMaterial({ color: 0x00ffff })
            const targetGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)])
            this.targetLine = new THREE.Line(targetGeo, targetMat)
            this.scene.add(this.targetLine)

            // Threat Line (Red - from Enemy)
            const threatMat = new THREE.LineBasicMaterial({ color: 0xff0000 })
            const threatGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0)])
            this.threatLine = new THREE.Line(threatGeo, threatMat)
            this.scene.add(this.threatLine)
        }
    }

    getInput(gameTime?: number): { x: number, z: number } {
        const activeEnemies = this.entityManager.enemies.filter(e => e.isActive)
        const activeGems = this.entityManager.gems.filter(g => g.isActive)
        const pPos = this.player.position

        // 1. Analyze Threats
        let nearestEnemyDist = 9999
        let nearestEnemy = null
        let threatVector = new THREE.Vector3(0, 0, 0)
        let nearbyThreats = 0

        for (const enemy of activeEnemies) {
            const d = pPos.distanceTo(enemy.position)
            if (d < nearestEnemyDist) {
                nearestEnemyDist = d
                nearestEnemy = enemy
            }
            // Sum repulsion vectors from all enemies within a radius
            if (d < 12) {
                const repulsion = pPos.clone().sub(enemy.position).normalize()
                threatVector.add(repulsion)
                nearbyThreats++
            }
        }
        if (nearbyThreats > 0) {
            threatVector.normalize()
        }

        // 2. Analyze Resources (Gem Gravity)
        let gemGravity = new THREE.Vector3(0, 0, 0)
        let nearestGemDist = 9999
        let nearestGem = null
        
        for (const gem of activeGems) {
            const dist = pPos.distanceTo(gem.position)
            
            // Track nearest for fallback/metrics
            if (dist < nearestGemDist) {
                nearestGemDist = dist
                nearestGem = gem
            }

            // Gravity Calculation: Weight by inverse distance to create a "pull" towards clusters
            // Influence is "Slow" (smooth sum) but "Strong" (accumulates)
            if (dist < 100) { // Influence radius increased for better pathing
                const weight = 1.0 / (dist + 0.5)
                const dir = gem.position.clone().sub(pPos).normalize()
                gemGravity.add(dir.multiplyScalar(weight))
            }
        }

        // Update Gem Arrow
        if (this.debugVisuals && this.gemArrow) {
            if (gemGravity.lengthSq() > 0.001) {
                gemGravity.normalize()
                this.gemArrow.position.copy(pPos)
                this.gemArrow.position.y = 1.0
                this.gemArrow.setDirection(gemGravity)
                this.gemArrow.visible = true
            } else {
                this.gemArrow.visible = false
            }
        } else if (gemGravity.lengthSq() > 0.001) {
            gemGravity.normalize()
        }

        // Logic
        let inputX = 0
        let inputZ = 0
        
        // Reset Debug Lines
        if (this.debugVisuals && this.threatLine && this.targetLine) {
            this.updateLine(this.threatLine, pPos, pPos)
            this.updateLine(this.targetLine, pPos, pPos)
        }

        const isLowHp = this.player.stats.currentHp < (this.player.stats.maxHp * 0.4)
        
        // GREED FACTOR: Reduce aggression after 10 minutes
        const aggressiveThreshold = gameTime < 600 ? 4.0 : 5.5; 
        const threatThreshold = (activeGems.length > 0 && !isLowHp) ? aggressiveThreshold : 6.0
        const isThreatened = nearestEnemyDist < threatThreshold || nearbyThreats > 5

        if ((isLowHp || isThreatened) && nearbyThreats > 0) {
            // EVADE: Run from the center of the pack (threat density)
            inputX = threatVector.x
            inputZ = threatVector.z
            if (this.debugVisuals && this.threatLine && nearestEnemy) {
                this.updateLine(this.threatLine, pPos, nearestEnemy.position)
            }
        } 
        else if (activeGems.length > 0) {
            // COLLECT: Go towards Gem Gravity (Cluster Center) instead of just nearest
            // This provides the "gradual" pull towards the gems
            inputX = gemGravity.x
            inputZ = gemGravity.z
            
            // Optional: Also visualize nearest gem line for context
            if (nearestGem && this.debugVisuals && this.targetLine) {
                this.updateLine(this.targetLine, pPos, nearestGem.position)
            }
        }
        else if (nearestEnemy) {
             // HUNT: Move vaguely towards enemies
             const dir = nearestEnemy.position.clone().sub(pPos).normalize()
             if (nearestEnemyDist > 15) {
                inputX = dir.x
                inputZ = dir.z
                if (this.debugVisuals && this.targetLine) this.updateLine(this.targetLine, pPos, nearestEnemy.position)
             }
        }
        else {
            // IDLE: Circle
            const time = gameTime !== undefined ? gameTime : Date.now() / 1000
            inputX = Math.cos(time)
            inputZ = Math.sin(time)
        }

        // Update Movement Arrow (Final Decision)
        const dirVec = new THREE.Vector3(inputX, 0, inputZ)
        if (this.debugVisuals && this.movementArrow) {
            if (dirVec.lengthSq() > 0.01) {
                this.movementArrow.position.copy(pPos)
                this.movementArrow.position.y = 1.0
                this.movementArrow.setDirection(dirVec.normalize())
                this.movementArrow.visible = true
            } else {
                this.movementArrow.visible = false
            }
        }

        return { x: inputX, z: inputZ }
    }

    private updateLine(line: THREE.Line, v1: THREE.Vector3, v2: THREE.Vector3) {
        const positions = line.geometry.attributes.position.array as Float32Array
        positions[0] = v1.x; positions[1] = 1.0; positions[2] = v1.z
        positions[3] = v2.x; positions[4] = 1.0; positions[5] = v2.z
        line.geometry.attributes.position.needsUpdate = true
    }

    cleanup() {
        if (this.debugVisuals) {
            this.scene.remove(this.movementArrow!)
            this.scene.remove(this.gemArrow!)
            this.scene.remove(this.targetLine!)
            this.scene.remove(this.threatLine!)
            this.movementArrow?.dispose()
            this.gemArrow?.dispose()
        }
    }
}
