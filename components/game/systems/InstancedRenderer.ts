/**
 * InstancedRenderer.ts
 *
 * Batches regular (non-boss) enemies using InstancedMesh to reduce draw calls.
 * 1 draw call per enemy TYPE instead of 1 per enemy.
 */

import * as THREE from 'three'

const _matrix = new THREE.Matrix4()
const _color = new THREE.Color()
const _pos = new THREE.Vector3()
const _scale = new THREE.Vector3()
const _quat = new THREE.Quaternion()

export class InstancedRenderer {
    private scene: THREE.Scene
    private instancedMeshes: Map<string, THREE.InstancedMesh> = new Map()
    private maxInstances: number

    constructor(scene: THREE.Scene, maxInstances = 600) {
        this.scene = scene
        this.maxInstances = maxInstances
    }

    /**
     * Register an enemy type for instanced rendering.
     * Creates a shared InstancedMesh with a sphere of the given radius.
     */
    registerEnemyType(type: string, radius: number, color: number) {
        if (this.instancedMeshes.has(type)) return

        const geometry = radius > 0.4
            ? new THREE.CapsuleGeometry(radius, 0.8, 4, 8)
            : new THREE.SphereGeometry(radius, 12, 12)

        const material = new THREE.MeshStandardMaterial({
            color,
            roughness: 0.7,
            metalness: 0.3,
        })

        const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances)
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false
        mesh.count = 0 // Start with 0 visible

        this.scene.add(mesh)
        this.instancedMeshes.set(type, mesh)
    }

    /**
     * Update all instanced meshes from active enemy data.
     * Called once per frame after enemy.update().
     */
    updateInstances(enemies: Array<{
        type: string
        x: number
        z: number
        radius: number
        scale: number
        isActive: boolean
    }>) {
        // Group by type
        const groups = new Map<string, typeof enemies>()
        for (const e of enemies) {
            if (!e.isActive) continue
            let arr = groups.get(e.type)
            if (!arr) {
                arr = []
                groups.set(e.type, arr)
            }
            arr.push(e)
        }

        // Update each InstancedMesh
        for (const [type, mesh] of this.instancedMeshes) {
            const list = groups.get(type)
            if (!list || list.length === 0) {
                mesh.count = 0
                continue
            }

            const count = Math.min(list.length, this.maxInstances)
            for (let i = 0; i < count; i++) {
                const e = list[i]
                _pos.set(e.x, e.radius * e.scale, e.z)
                _scale.set(e.scale, e.scale, e.scale)
                _matrix.compose(_pos, _quat, _scale)
                mesh.setMatrixAt(i, _matrix)
            }

            mesh.count = count
            mesh.instanceMatrix.needsUpdate = true
        }
    }

    /**
     * Check if a type is registered
     */
    hasType(type: string): boolean {
        return this.instancedMeshes.has(type)
    }

    dispose() {
        for (const mesh of this.instancedMeshes.values()) {
            mesh.geometry.dispose()
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose())
            } else {
                mesh.material.dispose()
            }
            this.scene.remove(mesh)
        }
        this.instancedMeshes.clear()
    }

    getDrawCallCount(): number {
        let count = 0
        for (const mesh of this.instancedMeshes.values()) {
            if (mesh.count > 0) count++
        }
        return count
    }
}
