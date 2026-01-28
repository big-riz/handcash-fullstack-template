/**
 * XPGem.ts
 * 
 * Experience items dropped by enemies.
 */

import * as THREE from 'three'

export class XPGem {
    position: THREE.Vector3
    value: number
    isActive = false
    mesh: THREE.Mesh | null = null

    private radius = 0.15
    private magnetSpeed = 12

    constructor() {
        this.position = new THREE.Vector3()
        this.value = 1
    }

    spawn(x: number, z: number, value: number) {
        this.position.set(x, 0.3, z)
        this.value = value
        this.isActive = true
        if (this.mesh) {
            this.mesh.position.copy(this.position)
            this.mesh.visible = true
        }
    }

    update(deltaTime: number, playerPos: THREE.Vector3, magnetRadius: number): boolean {
        if (!this.isActive) return false

        const dist = this.position.distanceTo(playerPos)

        // Magnet effect
        if (dist < magnetRadius) {
            const dir = new THREE.Vector3().subVectors(playerPos, this.position).normalize()
            this.position.add(dir.multiplyScalar(this.magnetSpeed * deltaTime))
            if (this.mesh) this.mesh.position.copy(this.position)
        }

        // Collection check
        if (dist < 0.5) {
            this.despawn()
            return true // Collected
        }

        return false
    }

    despawn() {
        this.isActive = false
        if (this.mesh) this.mesh.visible = false
    }

    setColor(color: number, emissive: number = 0x00ffff) {
        if (this.mesh && this.mesh.material instanceof THREE.MeshStandardMaterial) {
            this.mesh.material.color.setHex(color)
            this.mesh.material.emissive.setHex(emissive)
        }
    }

    createMesh(scene: THREE.Scene, color: number = 0x00cccc, emissive: number = 0x00ffff): THREE.Mesh {
        const geometry = new THREE.IcosahedronGeometry(this.radius, 1)
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9,
            roughness: 0.2,
            metalness: 0.8
        })
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.position.copy(this.position)
        this.mesh.visible = this.isActive
        scene.add(this.mesh)
        return this.mesh
    }
}
