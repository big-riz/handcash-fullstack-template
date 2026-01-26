/**
 * HazardZone.ts
 *
 * Dangerous AoE zones like poison clouds, slow patches, etc.
 */

import * as THREE from 'three'

export type HazardType = 'poison' | 'slow' | 'curse'

export class HazardZone {
    position: THREE.Vector3 = new THREE.Vector3()
    radius = 2.0
    damage = 5 // Damage per second (for poison)
    isActive = false
    mesh: THREE.Mesh | null = null
    lifeTime = 5.0 // Seconds before despawning
    currentLife = 0
    type: HazardType = 'poison'
    slowFactor = 0.5 // Multiplier for slow zones (0.5 = 50% speed)
    damageInterval = 0.5 // How often to apply damage (seconds)
    private damageTimer = 0

    constructor() { }

    spawn(x: number, z: number, type: HazardType, radius: number = 2.0, duration: number = 5.0, damage: number = 5) {
        this.position.set(x, 0.05, z)
        this.type = type
        this.radius = radius
        this.lifeTime = duration
        this.damage = damage
        this.isActive = true
        this.currentLife = 0
        this.damageTimer = 0

        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.scale.set(radius, 1, radius)
            this.mesh.visible = true

            // Color based on type
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            if (type === 'poison') {
                mat.color.setHex(0x00ff00)
                mat.emissive.setHex(0x00ff00)
            } else if (type === 'slow') {
                mat.color.setHex(0x0066ff)
                mat.emissive.setHex(0x0066ff)
            } else if (type === 'curse') {
                mat.color.setHex(0x8800ff)
                mat.emissive.setHex(0x8800ff)
            }
        }
    }

    update(deltaTime: number): boolean {
        if (!this.isActive) return false

        this.currentLife += deltaTime
        this.damageTimer += deltaTime

        // Fade out as life decreases
        if (this.mesh) {
            const mat = this.mesh.material as THREE.MeshStandardMaterial
            const lifePercent = 1 - (this.currentLife / this.lifeTime)
            mat.opacity = Math.max(0.3, lifePercent * 0.7)
        }

        if (this.currentLife >= this.lifeTime) {
            this.despawn()
            return false
        }

        return true
    }

    // Check if player is in zone and return if damage should be applied
    checkPlayerCollision(playerPos: THREE.Vector3): boolean {
        if (!this.isActive) return false

        const dx = playerPos.x - this.position.x
        const dz = playerPos.z - this.position.z
        const distSq = dx * dx + dz * dz

        return distSq < (this.radius * this.radius)
    }

    // Returns true if enough time has passed to apply damage again
    shouldApplyDamage(): boolean {
        if (this.damageTimer >= this.damageInterval) {
            this.damageTimer = 0
            return true
        }
        return false
    }

    despawn() {
        this.isActive = false
        if (this.mesh) this.mesh.visible = false
    }

    createMesh(scene: THREE.Scene): THREE.Mesh {
        // Flat circle on the ground
        const geometry = new THREE.CircleGeometry(1, 32) // Radius of 1, will be scaled
        geometry.rotateX(-Math.PI / 2) // Lay flat on ground

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            emissive: 0x00ff00,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        })

        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.y = 0.05 // Slightly above ground to avoid z-fighting
        this.mesh.renderOrder = 1
        this.mesh.visible = this.isActive
        scene.add(this.mesh)
        return this.mesh
    }
}
