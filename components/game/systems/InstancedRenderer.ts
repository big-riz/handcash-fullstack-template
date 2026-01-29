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
    private baseColors: Map<string, number> = new Map() // Store base colors per type
    private maxInstances: number
    // Reusable map for grouping - avoid allocations in hot path
    private groupsCache: Map<string, Array<{ x: number; z: number; radius: number; scale: number; hitFlash: number }>> = new Map()
    private lastCounts: Map<string, number> = new Map()

    constructor(scene: THREE.Scene, maxInstances = 1500) {
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

        // Initialize instance colors (required for per-instance coloring)
        _color.setHex(color)
        for (let i = 0; i < this.maxInstances; i++) {
            mesh.setColorAt(i, _color)
        }
        if (mesh.instanceColor) {
            mesh.instanceColor.needsUpdate = true
        }

        this.scene.add(mesh)
        this.instancedMeshes.set(type, mesh)
        this.baseColors.set(type, color)
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
        hitFlash?: number
    }>) {
        // Clear cached arrays (reuse allocations)
        this.groupsCache.forEach(arr => {
            arr.length = 0
        })

        // Group by type using cached arrays
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i]
            if (!e.isActive) continue
            let arr = this.groupsCache.get(e.type)
            if (!arr) {
                arr = []
                this.groupsCache.set(e.type, arr)
            }
            arr.push({ x: e.x, z: e.z, radius: e.radius, scale: e.scale, hitFlash: e.hitFlash || 0 })
        }

        // Update each InstancedMesh
        for (const [type, mesh] of this.instancedMeshes) {
            const list = this.groupsCache.get(type)
            const lastCount = this.lastCounts.get(type) || 0
            const baseColor = this.baseColors.get(type) || 0xff4444

            if (!list || list.length === 0) {
                mesh.count = 0
                if (lastCount > 0) {
                    mesh.instanceMatrix.needsUpdate = true
                    this.lastCounts.set(type, 0)
                }
                continue
            }

            const count = Math.min(list.length, this.maxInstances)
            let hasFlash = false

            for (let i = 0; i < count; i++) {
                const e = list[i]
                _pos.set(e.x, e.radius * e.scale, e.z)
                _scale.set(e.scale, e.scale, e.scale)
                _matrix.compose(_pos, _quat, _scale)
                mesh.setMatrixAt(i, _matrix)

                // Set color - white flash or base color
                if (e.hitFlash > 0) {
                    _color.setHex(0xffffff)
                    hasFlash = true
                } else {
                    _color.setHex(baseColor)
                }
                mesh.setColorAt(i, _color)
            }

            mesh.count = count
            mesh.instanceMatrix.needsUpdate = true
            if (mesh.instanceColor) {
                mesh.instanceColor.needsUpdate = true
            } else if (hasFlash) {
                // Force color attribute creation on first flash
                mesh.setColorAt(0, _color)
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
            }
            this.lastCounts.set(type, count)
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
