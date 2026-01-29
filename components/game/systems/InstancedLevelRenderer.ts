/**
 * InstancedLevelRenderer.ts
 *
 * Batches level geometry (mesh placements, scatter objects, spline meshes) using InstancedMesh.
 * Dramatically reduces draw calls for custom maps with many decorative elements.
 */

import * as THREE from 'three'
import { SeededRandom } from '@/lib/SeededRandom'

const _matrix = new THREE.Matrix4()
const _pos = new THREE.Vector3()
const _scale = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _euler = new THREE.Euler()

interface MeshBatch {
    geometry: THREE.BufferGeometry
    material: THREE.Material
    instances: Array<{
        position: THREE.Vector3
        rotation: THREE.Euler
        scale: THREE.Vector3
    }>
}

interface MeshDef {
    geometry: THREE.BufferGeometry
    material: THREE.Material
    localPosition: THREE.Vector3
    localRotation: THREE.Euler
    localScale: THREE.Vector3
}

export class InstancedLevelRenderer {
    private scene: THREE.Scene
    private instancedMeshes: THREE.InstancedMesh[] = []
    private batches: Map<string, MeshBatch> = new Map()
    private envGroup: THREE.Group

    // Cached geometries and materials
    private static cachedGeometries: Map<string, THREE.BufferGeometry> = new Map()
    private static cachedMaterials: Map<string, THREE.Material> = new Map()

    constructor(scene: THREE.Scene) {
        this.scene = scene
        this.envGroup = new THREE.Group()
        this.envGroup.name = 'InstancedLevelGeometry'
        this.scene.add(this.envGroup)
    }

    private getBatchKey(geometry: THREE.BufferGeometry, material: THREE.Material): string {
        return `${geometry.uuid}_${material.uuid}`
    }

    private addToBatch(def: MeshDef, worldPos: THREE.Vector3, worldRot: THREE.Euler, worldScale: THREE.Vector3) {
        const key = this.getBatchKey(def.geometry, def.material)

        if (!this.batches.has(key)) {
            this.batches.set(key, {
                geometry: def.geometry,
                material: def.material,
                instances: []
            })
        }

        // Compose final transform: world * local
        const finalPos = new THREE.Vector3()
        const finalRot = new THREE.Euler()
        const finalScale = new THREE.Vector3()

        // Apply local offset rotated by world rotation
        const localOffset = def.localPosition.clone()
        const worldQuaternion = new THREE.Quaternion().setFromEuler(worldRot)
        localOffset.applyQuaternion(worldQuaternion)
        localOffset.multiply(worldScale)

        finalPos.copy(worldPos).add(localOffset)

        // Combine rotations
        const localQuat = new THREE.Quaternion().setFromEuler(def.localRotation)
        const combinedQuat = worldQuaternion.clone().multiply(localQuat)
        finalRot.setFromQuaternion(combinedQuat)

        // Multiply scales
        finalScale.copy(worldScale).multiply(def.localScale)

        this.batches.get(key)!.instances.push({
            position: finalPos,
            rotation: finalRot,
            scale: finalScale
        })
    }

    private getGeometry(type: string, ...args: number[]): THREE.BufferGeometry {
        const key = `${type}_${args.join('_')}`
        if (!InstancedLevelRenderer.cachedGeometries.has(key)) {
            let geo: THREE.BufferGeometry
            switch (type) {
                case 'box':
                    geo = new THREE.BoxGeometry(args[0] || 1, args[1] || 1, args[2] || 1)
                    break
                case 'sphere':
                    geo = new THREE.SphereGeometry(args[0] || 0.5, args[1] || 8, args[2] || 8)
                    break
                case 'cylinder':
                    geo = new THREE.CylinderGeometry(args[0] || 0.5, args[1] || 0.5, args[2] || 1, args[3] || 8)
                    break
                case 'cone':
                    geo = new THREE.ConeGeometry(args[0] || 0.5, args[1] || 1, args[2] || 8)
                    break
                case 'dodecahedron':
                    geo = new THREE.DodecahedronGeometry(args[0] || 0.5, args[1] || 0)
                    break
                case 'icosahedron':
                    geo = new THREE.IcosahedronGeometry(args[0] || 0.5, args[1] || 0)
                    break
                case 'octahedron':
                    geo = new THREE.OctahedronGeometry(args[0] || 0.5, args[1] || 0)
                    break
                case 'circle':
                    geo = new THREE.CircleGeometry(args[0] || 0.5, args[1] || 12)
                    break
                default:
                    geo = new THREE.BoxGeometry(1, 1, 1)
            }
            InstancedLevelRenderer.cachedGeometries.set(key, geo)
        }
        return InstancedLevelRenderer.cachedGeometries.get(key)!
    }

    private getMaterial(color: number, options?: {
        roughness?: number,
        metalness?: number,
        flatShading?: boolean,
        emissive?: number,
        emissiveIntensity?: number,
        transparent?: boolean,
        opacity?: number,
        side?: THREE.Side
    }): THREE.Material {
        const opts = options || {}
        const key = `${color}_${opts.roughness || 0.7}_${opts.metalness || 0}_${opts.flatShading || false}_${opts.emissive || 0}_${opts.side || THREE.FrontSide}`

        if (!InstancedLevelRenderer.cachedMaterials.has(key)) {
            const mat = new THREE.MeshStandardMaterial({
                color,
                roughness: opts.roughness ?? 0.7,
                metalness: opts.metalness ?? 0,
                flatShading: opts.flatShading ?? false,
                emissive: opts.emissive,
                emissiveIntensity: opts.emissiveIntensity,
                transparent: opts.transparent,
                opacity: opts.opacity,
                side: opts.side
            })
            InstancedLevelRenderer.cachedMaterials.set(key, mat)
        }
        return InstancedLevelRenderer.cachedMaterials.get(key)!
    }

    /**
     * Add a mesh placement (rock, tree, fence, etc.)
     */
    addMeshPlacement(type: string, position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3, seed: number = 0) {
        const meshDefs = this.getMeshDefinitions(type, seed)
        for (const def of meshDefs) {
            this.addToBatch(def, position, rotation, scale)
        }
    }

    /**
     * Add a scatter object (grass, flowers, stones, mushrooms)
     */
    addScatterObject(type: string, position: THREE.Vector3, seed: number) {
        const meshDefs = this.getScatterDefinitions(type, seed)
        for (const def of meshDefs) {
            this.addToBatch(def, position, new THREE.Euler(), new THREE.Vector3(1, 1, 1))
        }
    }

    /**
     * Finalize batches and create InstancedMesh objects
     */
    build() {
        for (const [, batch] of this.batches) {
            if (batch.instances.length === 0) continue

            const instancedMesh = new THREE.InstancedMesh(
                batch.geometry,
                batch.material,
                batch.instances.length
            )

            for (let i = 0; i < batch.instances.length; i++) {
                const inst = batch.instances[i]
                _pos.copy(inst.position)
                _quat.setFromEuler(inst.rotation)
                _scale.copy(inst.scale)
                _matrix.compose(_pos, _quat, _scale)
                instancedMesh.setMatrixAt(i, _matrix)
            }

            instancedMesh.instanceMatrix.needsUpdate = true
            instancedMesh.castShadow = true
            instancedMesh.receiveShadow = true
            instancedMesh.frustumCulled = false

            this.envGroup.add(instancedMesh)
            this.instancedMeshes.push(instancedMesh)
        }

        // Clear batches after building
        this.batches.clear()
    }

    /**
     * Get mesh component definitions for a placement type
     */
    private getMeshDefinitions(type: string, seed: number): MeshDef[] {
        const rng = new SeededRandom(seed.toString())
        const defs: MeshDef[] = []

        switch (type) {
            case 'rock': {
                defs.push({
                    geometry: this.getGeometry('dodecahedron', 1.0, 0),
                    material: this.getMaterial(0x888888, { roughness: 0.9, flatShading: true }),
                    localPosition: new THREE.Vector3(0, 0.4, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1.2, 0.8, 1.0)
                })
                break
            }

            case 'tree': {
                // Trunk
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.2, 0.3, 1.5, 6),
                    material: this.getMaterial(0x3e2723, { roughness: 1 }),
                    localPosition: new THREE.Vector3(0, 0.75, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Leaves (3 cones)
                for (let i = 0; i < 3; i++) {
                    defs.push({
                        geometry: this.getGeometry('cone', 1.2 - i * 0.3, 1.5, 8),
                        material: this.getMaterial(0x4a7c3e, { roughness: 0.8 }),
                        localPosition: new THREE.Vector3(0, 1.5 + i * 0.8, 0),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'tree_dead': {
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.15, 0.3, 2.5, 5),
                    material: this.getMaterial(0x2d1b0d, { roughness: 1 }),
                    localPosition: new THREE.Vector3(0, 1.25, 0),
                    localRotation: new THREE.Euler(0, 0, 0.1),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Branches
                for (let i = 0; i < 3; i++) {
                    defs.push({
                        geometry: this.getGeometry('cylinder', 0.05, 0.1, 1.0, 4),
                        material: this.getMaterial(0x2d1b0d, { roughness: 1 }),
                        localPosition: new THREE.Vector3(i % 2 === 0 ? 0.3 : -0.3, 1.0 + i * 0.5, 0),
                        localRotation: new THREE.Euler(0, 0, i % 2 === 0 ? 0.8 : -0.8),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'shrub': {
                for (let i = 0; i < 5; i++) {
                    const s = 0.4 + rng.next() * 0.4
                    defs.push({
                        geometry: this.getGeometry('icosahedron', s, 0),
                        material: this.getMaterial(0x2e7d32, { roughness: 1 }),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * 0.8,
                            s * 0.5,
                            (rng.next() - 0.5) * 0.8
                        ),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'crystal': {
                defs.push({
                    geometry: this.getGeometry('octahedron', 0.6, 0),
                    material: this.getMaterial(0x00ffff, {
                        emissive: 0x00ffff,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.9,
                        roughness: 0.1
                    }),
                    localPosition: new THREE.Vector3(0, 0.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(0.6, 1.2, 0.6)
                })
                // Side crystals
                for (let i = 0; i < 3; i++) {
                    defs.push({
                        geometry: this.getGeometry('octahedron', 0.6, 0),
                        material: this.getMaterial(0x00ffff, {
                            emissive: 0x00ffff,
                            emissiveIntensity: 0.5,
                            transparent: true,
                            opacity: 0.9,
                            roughness: 0.1
                        }),
                        localPosition: new THREE.Vector3(
                            Math.cos(i * 2) * 0.4,
                            0.3,
                            Math.sin(i * 2) * 0.4
                        ),
                        localRotation: new THREE.Euler(0.5, 0, 0),
                        localScale: new THREE.Vector3(0.3, 0.6, 0.3)
                    })
                }
                break
            }

            case 'crate': {
                defs.push({
                    geometry: this.getGeometry('box', 1.2, 1.2, 1.2),
                    material: this.getMaterial(0x8b6f47, { roughness: 0.8 }),
                    localPosition: new THREE.Vector3(0, 0.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Bands
                defs.push({
                    geometry: this.getGeometry('box', 1.25, 0.1, 1.25),
                    material: this.getMaterial(0x5d4037),
                    localPosition: new THREE.Vector3(0, 0.9, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('box', 1.25, 0.1, 1.25),
                    material: this.getMaterial(0x5d4037),
                    localPosition: new THREE.Vector3(0, 0.3, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'barrel': {
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.5, 0.6, 1.2, 12),
                    material: this.getMaterial(0x654321, { roughness: 0.8 }),
                    localPosition: new THREE.Vector3(0, 0.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'wall': {
                defs.push({
                    geometry: this.getGeometry('box', 4, 2, 0.8),
                    material: this.getMaterial(0x666666, { roughness: 0.9 }),
                    localPosition: new THREE.Vector3(0, 1.0, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'fence': {
                // Posts
                for (let i = 0; i < 2; i++) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.2, 1.2, 0.2),
                        material: this.getMaterial(0x795548),
                        localPosition: new THREE.Vector3(i === 0 ? -1.8 : 1.8, 0.6, 0),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                // Rails
                for (let i = 0; i < 2; i++) {
                    defs.push({
                        geometry: this.getGeometry('box', 3.6, 0.15, 0.1),
                        material: this.getMaterial(0x795548),
                        localPosition: new THREE.Vector3(0, i === 0 ? 0.4 : 0.9, 0),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'pillar': {
                defs.push({
                    geometry: this.getGeometry('box', 1.2, 0.4, 1.2),
                    material: this.getMaterial(0x999999),
                    localPosition: new THREE.Vector3(0, 0.2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.4, 0.4, 3, 12),
                    material: this.getMaterial(0x999999),
                    localPosition: new THREE.Vector3(0, 1.9, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('box', 1.2, 0.4, 1.2),
                    material: this.getMaterial(0x999999),
                    localPosition: new THREE.Vector3(0, 3.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'pillar_broken': {
                defs.push({
                    geometry: this.getGeometry('box', 1.2, 0.4, 1.2),
                    material: this.getMaterial(0x888888),
                    localPosition: new THREE.Vector3(0, 0.2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.4, 0.4, 1.2, 12),
                    material: this.getMaterial(0x888888),
                    localPosition: new THREE.Vector3(0, 1.0, 0),
                    localRotation: new THREE.Euler(0.1, 0, 0),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'ruins_brick': {
                for (let i = 0; i < 8; i++) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.4, 0.2, 0.2),
                        material: this.getMaterial(0x7b1f1f),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * 1.0,
                            0.1 + rng.next() * 0.4,
                            (rng.next() - 0.5) * 1.0
                        ),
                        localRotation: new THREE.Euler(rng.next(), rng.next() * Math.PI, rng.next()),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'statue': {
                defs.push({
                    geometry: this.getGeometry('box', 1.5, 0.5, 1.5),
                    material: this.getMaterial(0xaaaaaa),
                    localPosition: new THREE.Vector3(0, 0.25, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('box', 1.0, 1.5, 1.0),
                    material: this.getMaterial(0xaaaaaa),
                    localPosition: new THREE.Vector3(0, 1.25, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('sphere', 0.4, 8, 8),
                    material: this.getMaterial(0xaaaaaa),
                    localPosition: new THREE.Vector3(0, 2.4, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'well': {
                defs.push({
                    geometry: this.getGeometry('cylinder', 1.2, 1.2, 0.8, 12),
                    material: this.getMaterial(0x555555),
                    localPosition: new THREE.Vector3(0, 0.4, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                defs.push({
                    geometry: this.getGeometry('circle', 1.1, 12),
                    material: this.getMaterial(0x0044ff, { emissive: 0x001144 }),
                    localPosition: new THREE.Vector3(0, 0.3, 0),
                    localRotation: new THREE.Euler(-Math.PI / 2, 0, 0),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                break
            }

            case 'fence_wood': {
                // Post
                defs.push({
                    geometry: this.getGeometry('box', 0.15, 1.2, 0.15),
                    material: this.getMaterial(0x7A5C12, { roughness: 0.95 }),
                    localPosition: new THREE.Vector3(0, 0.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Rails
                for (let i = 0; i < 2; i++) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.08, 0.1, 2.0),
                        material: this.getMaterial(0x8B6914, { roughness: 0.9 }),
                        localPosition: new THREE.Vector3(0, i === 0 ? 0.4 : 0.9, 0),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'fence_iron': {
                // Post
                defs.push({
                    geometry: this.getGeometry('box', 0.1, 1.4, 0.1),
                    material: this.getMaterial(0x444444, { roughness: 0.4, metalness: 0.8 }),
                    localPosition: new THREE.Vector3(0, 0.7, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Finial
                defs.push({
                    geometry: this.getGeometry('cone', 0.06, 0.15, 4),
                    material: this.getMaterial(0x444444, { roughness: 0.4, metalness: 0.8 }),
                    localPosition: new THREE.Vector3(0, 1.47, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Horizontal bars
                for (const yPos of [0.3, 1.2]) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.06, 0.06, 2.0),
                        material: this.getMaterial(0x444444, { roughness: 0.4, metalness: 0.8 }),
                        localPosition: new THREE.Vector3(0, yPos, 0),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                // Pickets with tips
                for (let i = -3; i <= 3; i++) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.04, 1.0, 0.04),
                        material: this.getMaterial(0x444444, { roughness: 0.4, metalness: 0.8 }),
                        localPosition: new THREE.Vector3(0, 0.5, i * 0.28),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                    defs.push({
                        geometry: this.getGeometry('cone', 0.035, 0.12, 4),
                        material: this.getMaterial(0x444444, { roughness: 0.4, metalness: 0.8 }),
                        localPosition: new THREE.Vector3(0, 1.06, i * 0.28),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'wall_stone': {
                defs.push({
                    geometry: this.getGeometry('box', 0.6, 1.5, 2.0),
                    material: this.getMaterial(0x888888, { roughness: 0.95, flatShading: true }),
                    localPosition: new THREE.Vector3(0, 0.75, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Cap stones
                for (let i = 0; i < 4; i++) {
                    defs.push({
                        geometry: this.getGeometry('dodecahedron', 0.18, 0),
                        material: this.getMaterial(0x888888, { roughness: 0.9, flatShading: true }),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * 0.15,
                            1.45 + rng.next() * 0.1,
                            -0.75 + i * 0.5
                        ),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                // Protruding stones
                for (let i = 0; i < 5; i++) {
                    defs.push({
                        geometry: this.getGeometry('dodecahedron', 0.12 + rng.next() * 0.08, 0),
                        material: this.getMaterial(0x888888, { roughness: 0.95, flatShading: true }),
                        localPosition: new THREE.Vector3(
                            rng.next() > 0.5 ? 0.3 : -0.3,
                            0.3 + rng.next() * 0.9,
                            (rng.next() - 0.5) * 0.9
                        ),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'wall_brick': {
                defs.push({
                    geometry: this.getGeometry('box', 0.5, 1.4, 2.0),
                    material: this.getMaterial(0x999999, { roughness: 1.0 }),
                    localPosition: new THREE.Vector3(0, 0.7, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Brick rows
                for (let row = 0; row < 5; row++) {
                    for (let col = 0; col < 4; col++) {
                        const offset = (row % 2 === 0) ? 0 : 0.25
                        defs.push({
                            geometry: this.getGeometry('box', 0.52, 0.22, 0.45),
                            material: this.getMaterial(0xAA5544, { roughness: 0.85 }),
                            localPosition: new THREE.Vector3(0, 0.15 + row * 0.28, -0.75 + col * 0.5 + offset),
                            localRotation: new THREE.Euler(),
                            localScale: new THREE.Vector3(1, 1, 1)
                        })
                    }
                }
                // Cap row
                for (let col = 0; col < 4; col++) {
                    defs.push({
                        geometry: this.getGeometry('box', 0.55, 0.08, 0.48),
                        material: this.getMaterial(0x8B3A3A, { roughness: 0.9 }),
                        localPosition: new THREE.Vector3(0, 1.42, -0.75 + col * 0.5),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'hedge_row': {
                defs.push({
                    geometry: this.getGeometry('box', 0.8, 1.2, 2.0),
                    material: this.getMaterial(0x2E7D32, { roughness: 0.9 }),
                    localPosition: new THREE.Vector3(0, 0.6, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
                // Bumpy sides
                for (let i = 0; i < 8; i++) {
                    const s = 0.18 + rng.next() * 0.12
                    const side = rng.next() > 0.5
                    defs.push({
                        geometry: this.getGeometry('icosahedron', s, 0),
                        material: this.getMaterial(i % 2 === 0 ? 0x2E7D32 : 0x1B5E20, { roughness: 0.95 }),
                        localPosition: new THREE.Vector3(
                            side ? (rng.next() > 0.5 ? 0.4 : -0.4) : (rng.next() - 0.5) * 0.3,
                            side ? (0.3 + rng.next() * 0.7) : (1.1 + rng.next() * 0.15),
                            -0.8 + (i / 8) * 1.6
                        ),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'log_fence': {
                // Posts
                for (let i = -1; i <= 1; i += 2) {
                    const topR = 0.08 + rng.next() * 0.04
                    defs.push({
                        geometry: this.getGeometry('cylinder', topR, 0.12, 1.2, 6),
                        material: this.getMaterial(0x5D4037, { roughness: 1.0 }),
                        localPosition: new THREE.Vector3(0, 0.6, i * 0.8),
                        localRotation: new THREE.Euler(0, 0, (rng.next() - 0.5) * 0.05),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                // Horizontal logs
                for (let i = 0; i < 2; i++) {
                    defs.push({
                        geometry: this.getGeometry('cylinder', 0.07, 0.08, 2.0, 6),
                        material: this.getMaterial(0x5D4037, { roughness: 1.0 }),
                        localPosition: new THREE.Vector3(0, i === 0 ? 0.35 : 0.8, 0),
                        localRotation: new THREE.Euler(Math.PI / 2, 0, (rng.next() - 0.5) * 0.03),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            default: {
                defs.push({
                    geometry: this.getGeometry('box', 1, 1, 1),
                    material: this.getMaterial(0x999999),
                    localPosition: new THREE.Vector3(0, 0.5, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
            }
        }

        return defs
    }

    /**
     * Get scatter object definitions
     */
    private getScatterDefinitions(type: string, seed: number): MeshDef[] {
        const rng = new SeededRandom(seed.toString())
        const defs: MeshDef[] = []

        switch (type) {
            case 'grass': {
                const bladeCount = 3 + Math.floor(rng.next() * 3)
                for (let i = 0; i < bladeCount; i++) {
                    const height = 0.3 + rng.next() * 0.3
                    const width = 0.05 + rng.next() * 0.05
                    defs.push({
                        geometry: this.getGeometry('cone', width, height, 3),
                        material: this.getMaterial(0x4a7c3e, { roughness: 1.0, side: THREE.DoubleSide }),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * 0.2,
                            height / 2,
                            (rng.next() - 0.5) * 0.2
                        ),
                        localRotation: new THREE.Euler(
                            (rng.next() - 0.5) * 0.5,
                            rng.next() * Math.PI * 2,
                            (rng.next() - 0.5) * 0.5
                        ),
                        localScale: new THREE.Vector3(1, 1, 0.1)
                    })
                }
                break
            }

            case 'flowers': {
                const stemHeight = 0.3 + rng.next() * 0.2
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.02, 0.02, stemHeight, 4),
                    material: this.getMaterial(0x2e7d32),
                    localPosition: new THREE.Vector3(0, stemHeight / 2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })

                const hue = rng.next()
                const petalColor = new THREE.Color().setHSL(hue, 0.8, 0.6)
                defs.push({
                    geometry: this.getGeometry('dodecahedron', 0.1, 0),
                    material: this.getMaterial(petalColor.getHex()),
                    localPosition: new THREE.Vector3(0, stemHeight, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 0.5, 1)
                })
                break
            }

            case 'stones': {
                const size = 0.2 + rng.next() * 0.3
                defs.push({
                    geometry: this.getGeometry('dodecahedron', size, 0),
                    material: this.getMaterial(0x888888, { roughness: 0.9, flatShading: true }),
                    localPosition: new THREE.Vector3(
                        0,
                        (size * (0.6 + (rng.next() - 0.5) * 0.4)) / 2 - 0.05,
                        0
                    ),
                    localRotation: new THREE.Euler(rng.next() * Math.PI, rng.next() * Math.PI, rng.next() * Math.PI),
                    localScale: new THREE.Vector3(
                        1 + (rng.next() - 0.5) * 0.4,
                        0.6 + (rng.next() - 0.5) * 0.4,
                        1 + (rng.next() - 0.5) * 0.4
                    )
                })
                break
            }

            case 'mushrooms': {
                const mushHeight = 0.2 + rng.next() * 0.2
                defs.push({
                    geometry: this.getGeometry('cylinder', 0.04, 0.06, mushHeight, 5),
                    material: this.getMaterial(0xececec),
                    localPosition: new THREE.Vector3(0, mushHeight / 2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })

                const capWidth = 0.15 + rng.next() * 0.1
                const capColor = rng.next() > 0.5 ? 0xff4444 : 0x8d6e63
                defs.push({
                    geometry: this.getGeometry('cone', capWidth, capWidth * 0.8, 6),
                    material: this.getMaterial(capColor),
                    localPosition: new THREE.Vector3(0, mushHeight + capWidth * 0.2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })

                // White dots for red mushrooms
                if (capColor === 0xff4444) {
                    for (let i = 0; i < 3; i++) {
                        defs.push({
                            geometry: this.getGeometry('sphere', 0.02, 4, 4),
                            material: this.getMaterial(0xffffff),
                            localPosition: new THREE.Vector3(
                                (rng.next() - 0.5) * capWidth * 0.8,
                                mushHeight + capWidth * 0.4,
                                (rng.next() - 0.5) * capWidth * 0.8
                            ),
                            localRotation: new THREE.Euler(),
                            localScale: new THREE.Vector3(1, 1, 1)
                        })
                    }
                }
                break
            }

            case 'debris': {
                const pieceCount = 2 + Math.floor(rng.next() * 3)
                for (let i = 0; i < pieceCount; i++) {
                    const dSize = 0.2 + rng.next() * 0.2
                    defs.push({
                        geometry: this.getGeometry('box', dSize, 0.05, 0.05),
                        material: this.getMaterial(0x5d4037, { roughness: 1.0 }),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * 0.5,
                            0.05,
                            (rng.next() - 0.5) * 0.5
                        ),
                        localRotation: new THREE.Euler(rng.next(), rng.next() * Math.PI, rng.next()),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            case 'foliage': {
                const bushSize = 0.3 + rng.next() * 0.3
                defs.push({
                    geometry: this.getGeometry('icosahedron', bushSize, 0),
                    material: this.getMaterial(0x2e7d32, { roughness: 1 }),
                    localPosition: new THREE.Vector3(0, bushSize * 0.8, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })

                for (let i = 0; i < 3; i++) {
                    const s = bushSize * (0.3 + rng.next() * 0.4)
                    defs.push({
                        geometry: this.getGeometry('icosahedron', s, 0),
                        material: this.getMaterial(0x2e7d32, { roughness: 1 }),
                        localPosition: new THREE.Vector3(
                            (rng.next() - 0.5) * bushSize,
                            bushSize * 0.5 + rng.next() * 0.3,
                            (rng.next() - 0.5) * bushSize
                        ),
                        localRotation: new THREE.Euler(),
                        localScale: new THREE.Vector3(1, 1, 1)
                    })
                }
                break
            }

            default: {
                defs.push({
                    geometry: this.getGeometry('sphere', 0.2, 5, 5),
                    material: this.getMaterial(0x999999),
                    localPosition: new THREE.Vector3(0, 0.2, 0),
                    localRotation: new THREE.Euler(),
                    localScale: new THREE.Vector3(1, 1, 1)
                })
            }
        }

        return defs
    }

    /**
     * Get collision data for a mesh type
     */
    getCollisionData(type: string, position: THREE.Vector3, rotation: THREE.Euler, scale: THREE.Vector3): Array<{ x: number, z: number, radius: number }> {
        const collisions: Array<{ x: number, z: number, radius: number }> = []

        // Calculate bounds based on mesh type
        let localWidth = 1
        let localDepth = 1

        switch (type) {
            case 'rock': localWidth = 1.2; localDepth = 1.0; break
            case 'tree': localWidth = 0.6; localDepth = 0.6; break
            case 'tree_dead': localWidth = 0.6; localDepth = 0.6; break
            case 'shrub': localWidth = 0.8; localDepth = 0.8; break
            case 'crystal': localWidth = 0.6; localDepth = 0.6; break
            case 'crate': localWidth = 1.2; localDepth = 1.2; break
            case 'barrel': localWidth = 1.2; localDepth = 1.2; break
            case 'wall': localWidth = 4; localDepth = 0.8; break
            case 'fence': localWidth = 4; localDepth = 0.2; break
            case 'pillar': localWidth = 1.2; localDepth = 1.2; break
            case 'pillar_broken': localWidth = 1.2; localDepth = 1.2; break
            case 'statue': localWidth = 1.5; localDepth = 1.5; break
            case 'well': localWidth = 2.4; localDepth = 2.4; break
            case 'fence_wood': localWidth = 0.15; localDepth = 2.0; break
            case 'fence_iron': localWidth = 0.1; localDepth = 2.0; break
            case 'wall_stone': localWidth = 0.6; localDepth = 2.0; break
            case 'wall_brick': localWidth = 0.5; localDepth = 2.0; break
            case 'hedge_row': localWidth = 0.8; localDepth = 2.0; break
            case 'log_fence': localWidth = 0.2; localDepth = 2.0; break
        }

        const scaledWidth = localWidth * scale.x
        const scaledDepth = localDepth * scale.z
        const localLong = Math.max(scaledWidth, scaledDepth)
        const localShort = Math.min(scaledWidth, scaledDepth)
        const aspectRatio = localLong / (localShort || 0.1)
        const isZLong = scaledDepth >= scaledWidth

        if (aspectRatio > 2.0 && localLong > 1.0) {
            // Elongated: distribute circles
            const segCount = Math.ceil(localLong / localShort)
            const segSpacing = localLong / segCount
            const rotY = rotation.y
            const cosR = Math.cos(rotY)
            const sinR = Math.sin(rotY)

            for (let s = 0; s < segCount; s++) {
                const localOffset = -localLong / 2 + segSpacing * (s + 0.5)
                const localX = isZLong ? 0 : localOffset
                const localZ = isZLong ? localOffset : 0
                const wx = cosR * localX - sinR * localZ
                const wz = sinR * localX + cosR * localZ
                collisions.push({
                    x: position.x + wx,
                    z: position.z + wz,
                    radius: localShort / 2 + 0.1
                })
            }
        } else {
            collisions.push({
                x: position.x,
                z: position.z,
                radius: localLong / 2
            })
        }

        return collisions
    }

    getDrawCallCount(): number {
        return this.instancedMeshes.filter(m => m.count > 0).length
    }

    dispose() {
        for (const mesh of this.instancedMeshes) {
            this.envGroup.remove(mesh)
            mesh.geometry.dispose()
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose())
            } else {
                mesh.material.dispose()
            }
        }
        this.instancedMeshes = []
        this.scene.remove(this.envGroup)
    }
}
