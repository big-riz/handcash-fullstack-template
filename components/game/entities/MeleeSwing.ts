/**
 * MeleeSwing.ts
 * 
 * Represents a single melee swing arc that damages enemies within its cone.
 */

import * as THREE from 'three'

export class MeleeSwing {
    position: THREE.Vector3 = new THREE.Vector3()
    startAngle = 0
    arcAngle = Math.PI * 0.6 // 108 degrees arc
    radius = 3.0
    damage = 10
    isActive = false
    mesh: THREE.Mesh | null = null
    swingDuration = 0.3 // Total swing time in seconds
    currentTime = 0
    hitEnemies = new Set<number>() // Track which enemies we've already hit this swing

    constructor() { }

    spawn(x: number, z: number, facingAngle: number, damage: number, radius: number, swingDuration: number, arcAngle: number) {
        this.position.set(x, 0.3, z)
        this.damage = damage
        this.radius = radius
        this.swingDuration = swingDuration
        this.arcAngle = arcAngle
        this.isActive = true
        this.currentTime = 0
        this.hitEnemies.clear()

        // Start from -arc/2 relative to facing
        this.startAngle = facingAngle - (this.arcAngle / 2)

        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.visible = true
            // Scale the mesh based on the current radius (Geometry is created with radius 1.0)
            this.mesh.scale.set(this.radius, 1, this.radius)
        }
    }

    update(deltaTime: number): boolean {
        if (!this.isActive) return false

        this.currentTime += deltaTime
        const progress = Math.min(this.currentTime / this.swingDuration, 1)

        if (this.mesh) {
            this.mesh.position.copy(this.position)

            // Easing for a "snappy" feel: fast start
            const easedProgress = 1 - Math.pow(1 - progress, 3)

            // Rotation: sweeping the thin blade through the total arcAngle
            this.mesh.rotation.y = this.startAngle + (this.arcAngle * easedProgress)

            // Scale: subtle punch at start (applied on top of base radius scaling)
            const scalePunch = 1.0 + Math.sin(progress * Math.PI) * 0.1
            this.mesh.scale.set(this.radius * scalePunch, 1, this.radius * scalePunch)

            // Fade out
            const material = this.mesh.material as THREE.MeshStandardMaterial
            material.opacity = Math.pow(1 - progress, 2) * 1.0
        }

        if (this.currentTime >= this.swingDuration) {
            this.despawn()
            return false
        }

        return true
    }

    /**
     * Check if an enemy at the given position is within the current swing arc
     */
    isEnemyInArc(enemyX: number, enemyZ: number, enemyRadius: number, enemyId: number): boolean {
        if (!this.isActive) return false

        // Don't hit the same enemy twice in one swing
        if (this.hitEnemies.has(enemyId)) return false

        // Current progress through the swing (0 to 1)
        const progress = Math.min(this.currentTime / this.swingDuration, 1)
        const easedProgress = 1 - Math.pow(1 - progress, 3)

        // Current angle of the swing blade
        const currentAngle = this.startAngle + (this.arcAngle * easedProgress)

        // Calculate angle to enemy
        const dx = enemyX - this.position.x
        const dz = enemyZ - this.position.z
        const distSq = dx * dx + dz * dz
        const angleToEnemy = Math.atan2(dz, dx) // Standard CCW Angle from X+

        // Check if enemy is within range
        const maxDist = this.radius + enemyRadius
        if (distSq > maxDist * maxDist) return false

        // Check if enemy angle is within the swept arc so far
        const angleDiff = this.normalizeAngle(angleToEnemy - this.startAngle)
        const currentProgress = this.normalizeAngle(currentAngle - this.startAngle)

        // Hit if enemy is within the swept arc so far
        if (angleDiff <= currentProgress && angleDiff >= 0) {
            this.hitEnemies.add(enemyId)
            return true
        }

        return false
    }

    private normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= Math.PI * 2
        while (angle < -Math.PI) angle += Math.PI * 2
        return angle
    }

    despawn() {
        this.isActive = false
        this.hitEnemies.clear()
        if (this.mesh) this.mesh.visible = false
    }

    createMesh(scene: THREE.Scene, color: number = 0xcccccc): THREE.Mesh {
        // Create a thin sweeping "blade" (ring segment)
        // Set base radius to 1.0 and scale it in spawn/update
        const geometry = new THREE.RingGeometry(
            0.85,
            1.0,
            16,
            1,
            -0.15,
            0.3
        )
        geometry.rotateX(-Math.PI / 2)

        const material = new THREE.MeshStandardMaterial({
            color: color,
            transparent: true,
            opacity: 1.0,
            emissive: color,
            emissiveIntensity: 4.0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.visible = this.isActive
        scene.add(this.mesh)
        return this.mesh
    }
}
