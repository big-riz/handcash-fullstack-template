/**
 * Projectile.ts
 * 
 * Flying projectiles like daggers, fireballs, etc.
 */

import * as THREE from 'three'

export class Projectile {
    position: THREE.Vector3 = new THREE.Vector3()
    velocity: THREE.Vector3 = new THREE.Vector3()
    radius = 0.2
    damage = 10
    isActive = false
    mesh: THREE.Mesh | null = null
    lifeTime = 3.0 // Seconds before despawning
    currentLife = 0

    constructor() { }

    spawn(x: number, z: number, vx: number, vz: number, damage: number) {
        this.position.set(x, 0.5, z)
        this.velocity.set(vx, 0, vz)
        this.damage = damage
        this.isActive = true
        this.currentLife = 0
        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.visible = true
            // Rotate to face velocity
            const angle = Math.atan2(vx, vz)
            this.mesh.rotation.y = angle
        }
    }

    update(deltaTime: number): boolean {
        if (!this.isActive) return false

        this.position.add(this.velocity.clone().multiplyScalar(deltaTime))
        if (this.mesh) this.mesh.position.copy(this.position)

        this.currentLife += deltaTime
        if (this.currentLife >= this.lifeTime) {
            this.despawn()
            return false
        }

        return true
    }

    despawn() {
        this.isActive = false
        if (this.mesh) this.mesh.visible = false
    }

    createMesh(scene: THREE.Scene): THREE.Mesh {
        // Needle/Dagger shape
        const geometry = new THREE.ConeGeometry(this.radius, 0.6, 8)
        geometry.rotateX(Math.PI / 2) // Orient along Z
        const material = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0x00ffff,
            emissiveIntensity: 0.2
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.castShadow = true
        this.mesh.visible = this.isActive
        scene.add(this.mesh)
        return this.mesh
    }
}
