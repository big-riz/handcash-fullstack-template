import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneWithSkeleton } from 'three/examples/jsm/utils/SkeletonUtils.js'

export interface CharacterInstance {
    model: THREE.Group
    mixer: THREE.AnimationMixer | null  // null for shared animation mode
    action: THREE.AnimationAction | null
    baseSpeed: number
    bones: THREE.Bone[]  // cached bone references for fast sync
    isPlayer: boolean
    inUse: boolean  // for pooling
}

export class CharacterModelManager {
    private loader: GLTFLoader
    private loadedModel: THREE.Group | null = null
    private animations: THREE.AnimationClip[] = []
    private instances: Map<string, CharacterInstance> = new Map()
    private isLoaded = false
    private loadPromise: Promise<void> | null = null
    private scene: THREE.Scene | null = null

    // Shared animation: one master mixer for all non-player instances
    private masterModel: THREE.Group | null = null
    private masterMixer: THREE.AnimationMixer | null = null
    private masterAction: THREE.AnimationAction | null = null
    private masterBones: THREE.Bone[] = []

    // Pre-allocated pool for enemies
    private enemyPool: CharacterInstance[] = []
    private poolSize = 0

    constructor() {
        this.loader = new GLTFLoader()
    }

    async load(url: string = '/models/lil-gop.glb'): Promise<void> {
        if (this.isLoaded) return
        if (this.loadPromise) return this.loadPromise

        this.loadPromise = new Promise((resolve, reject) => {
            this.loader.load(
                url,
                (gltf) => {
                    this.loadedModel = gltf.scene
                    this.animations = gltf.animations
                    this.isLoaded = true

                    // Setup base model
                    this.loadedModel.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.castShadow = true
                            child.receiveShadow = true
                        }
                    })

                    // Create master model for shared animation (not added to scene)
                    this.masterModel = cloneWithSkeleton(this.loadedModel) as THREE.Group
                    this.masterModel.visible = false

                    // Cache master bones
                    this.masterBones = []
                    this.masterModel.traverse((child) => {
                        if (child instanceof THREE.Bone) {
                            this.masterBones.push(child)
                        }
                    })

                    // Setup master mixer
                    if (this.animations.length > 0) {
                        this.masterMixer = new THREE.AnimationMixer(this.masterModel)
                        const clip = this.animations[0].clone()
                        this.masterAction = this.masterMixer.clipAction(clip)
                        this.masterAction.setLoop(THREE.LoopRepeat, Infinity)
                        this.masterAction.play()
                    }

                    console.log(`[CharacterModelManager] Loaded model with ${this.animations.length} animation(s), ${this.masterBones.length} bones (shared animation mode)`)
                    if (this.animations.length > 0) {
                        console.log(`[CharacterModelManager] Animations:`, this.animations.map(a => `${a.name} (${a.duration}s, ${a.tracks.length} tracks)`))
                    } else {
                        console.warn(`[CharacterModelManager] WARNING: No animations found in model!`)
                    }

                    resolve()
                },
                undefined,
                (error) => {
                    console.error('[CharacterModelManager] Failed to load model:', error)
                    reject(error)
                }
            )
        })

        return this.loadPromise
    }

    setScene(scene: THREE.Scene) {
        this.scene = scene
    }

    /**
     * Pre-allocate a pool of enemy instances to avoid lag spikes on spawn
     */
    preallocatePool(size: number): void {
        if (!this.isLoaded || !this.loadedModel || !this.scene) {
            console.warn('[CharacterModelManager] Cannot preallocate - not loaded or no scene')
            return
        }

        console.log(`[CharacterModelManager] Pre-allocating ${size} enemy instances...`)
        const startTime = performance.now()

        for (let i = 0; i < size; i++) {
            const model = cloneWithSkeleton(this.loadedModel) as THREE.Group
            model.visible = false

            // Cache bones
            const bones: THREE.Bone[] = []
            model.traverse((child) => {
                if (child instanceof THREE.Bone) {
                    bones.push(child)
                }
            })

            // Create with default gray material (will be recolored on use)
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const mat = new THREE.MeshStandardMaterial({
                        color: 0x888888,
                        roughness: 0.7,
                        metalness: 0.2,
                    })
                    child.material = mat
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })

            const instance: CharacterInstance = {
                model,
                mixer: null,
                action: null,
                baseSpeed: 1.0,
                bones,
                isPlayer: false,
                inUse: false
            }

            this.enemyPool.push(instance)
            this.scene.add(model)
        }

        this.poolSize = size
        console.log(`[CharacterModelManager] Pool allocated in ${(performance.now() - startTime).toFixed(1)}ms`)
    }

    /**
     * Get an instance from the pool or create new if pool exhausted
     */
    private getFromPool(): CharacterInstance | null {
        // Find unused instance in pool
        for (const instance of this.enemyPool) {
            if (!instance.inUse) {
                instance.inUse = true
                return instance
            }
        }
        return null
    }

    /**
     * Return an instance to the pool
     */
    private returnToPool(instance: CharacterInstance): void {
        instance.inUse = false
        instance.model.visible = false
    }

    /**
     * Create an instance of the character model
     * @param id Unique identifier for this instance
     * @param scale Scale factor for the model
     * @param flatColor If provided, replaces all materials with a flat colored material
     * @param isPlayer If true, uses own mixer; if false, uses shared animation
     */
    createInstance(id: string, scale: number = 1.0, flatColor?: number, isPlayer: boolean = false): CharacterInstance | null {
        if (!this.isLoaded || !this.loadedModel || !this.scene) {
            console.warn('[CharacterModelManager] Cannot create instance - not loaded or no scene')
            return null
        }

        // For enemies, try to get from pool first
        if (!isPlayer) {
            const pooled = this.getFromPool()
            if (pooled) {
                pooled.model.scale.setScalar(scale)

                // Update color
                if (flatColor !== undefined) {
                    pooled.model.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            const mat = child.material as THREE.MeshStandardMaterial
                            if (mat.isMeshStandardMaterial) {
                                mat.color.setHex(flatColor)
                                mat.emissive.setHex(0x000000)
                                mat.emissiveIntensity = 0
                            }
                        }
                    })
                }

                this.instances.set(id, pooled)
                return pooled
            }
            // Pool exhausted - fall through to create new
        }

        // Clone the model with skeleton
        const model = cloneWithSkeleton(this.loadedModel) as THREE.Group
        model.scale.setScalar(scale)

        // Cache bones for this instance
        const bones: THREE.Bone[] = []
        model.traverse((child) => {
            if (child instanceof THREE.Bone) {
                bones.push(child)
            }
        })

        // Apply flat color material for enemies (not player)
        if (flatColor !== undefined && !isPlayer) {
            model.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    const flatMat = new THREE.MeshStandardMaterial({
                        color: flatColor,
                        roughness: 0.7,
                        metalness: 0.2,
                    })
                    child.material = flatMat
                    child.castShadow = true
                    child.receiveShadow = true
                }
            })
        }

        let mixer: THREE.AnimationMixer | null = null
        let action: THREE.AnimationAction | null = null

        // Only player gets its own mixer; enemies use shared animation
        if (isPlayer && this.animations.length > 0) {
            mixer = new THREE.AnimationMixer(model)
            const clip = this.animations[0].clone()
            action = mixer.clipAction(clip)
            action.setLoop(THREE.LoopRepeat, Infinity)
            action.clampWhenFinished = false
            action.enabled = true
            action.setEffectiveWeight(1.0)
            action.setEffectiveTimeScale(1.0)
            action.play()
            console.log(`[CharacterModelManager] Player animation created, duration: ${clip.duration}s`)
        }

        const instance: CharacterInstance = {
            model,
            mixer,
            action,
            baseSpeed: 1.0,
            bones,
            isPlayer,
            inUse: true
        }

        this.instances.set(id, instance)
        this.scene.add(model)

        return instance
    }

    /**
     * Update shared animation once per frame - call this ONCE before updateInstance calls
     */
    updateSharedAnimation(deltaTime: number) {
        if (this.masterMixer && deltaTime > 0) {
            this.masterMixer.update(deltaTime)
        }
    }

    /**
     * Sync bone transforms from master to an instance (for shared animation)
     */
    private syncBonesToInstance(instance: CharacterInstance) {
        if (instance.isPlayer || instance.bones.length !== this.masterBones.length) return

        for (let i = 0; i < this.masterBones.length; i++) {
            const masterBone = this.masterBones[i]
            const instanceBone = instance.bones[i]

            instanceBone.position.copy(masterBone.position)
            instanceBone.quaternion.copy(masterBone.quaternion)
            instanceBone.scale.copy(masterBone.scale)
        }
    }

    updateInstance(
        id: string,
        position: THREE.Vector3,
        velocity: THREE.Vector3,
        deltaTime: number,
        baseMovementSpeed: number = 5.0
    ) {
        const instance = this.instances.get(id)
        if (!instance) return

        // Update position
        instance.model.position.copy(position)

        // Calculate speed for animation timing
        const speed = velocity.length()
        const speedRatio = speed / baseMovementSpeed

        if (instance.isPlayer) {
            // Player has own mixer
            if (instance.action) {
                const animationSpeed = 0.3 + (speedRatio * 2.0 * instance.baseSpeed)
                instance.action.timeScale = Math.min(animationSpeed, 4.0)
            }
            if (instance.mixer && deltaTime > 0) {
                instance.mixer.update(deltaTime)
            }
        } else {
            // Enemy uses shared animation - sync bones from master
            this.syncBonesToInstance(instance)
        }

        // Orient model to face movement direction
        if (speed > 0.1) {
            const angle = Math.atan2(velocity.x, velocity.z)
            instance.model.rotation.y = angle
        }
    }

    /**
     * Batch update all enemy instances efficiently
     * Call updateSharedAnimation first, then this
     */
    updateAllEnemyInstances(
        updates: Array<{
            id: string
            position: THREE.Vector3
            velocity: THREE.Vector3
            baseMovementSpeed: number
        }>
    ) {
        for (const update of updates) {
            const instance = this.instances.get(update.id)
            if (!instance || instance.isPlayer) continue

            // Update position
            instance.model.position.copy(update.position)

            // Sync bones from master (only if bones exist)
            if (this.masterBones.length > 0) {
                this.syncBonesToInstance(instance)
            }

            // Orient model to face movement direction
            const speed = update.velocity.length()
            if (speed > 0.1) {
                const angle = Math.atan2(update.velocity.x, update.velocity.z)
                instance.model.rotation.y = angle
            }
        }
    }

    setInstanceVisible(id: string, visible: boolean) {
        const instance = this.instances.get(id)
        if (instance) {
            instance.model.visible = visible
        }
    }

    setInstanceTint(id: string, tint: THREE.Color) {
        const instance = this.instances.get(id)
        if (!instance) return

        instance.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial
                if (mat.isMeshStandardMaterial) {
                    mat.emissive.copy(tint)
                    mat.emissiveIntensity = 0.5
                }
            }
        })
    }

    clearInstanceTint(id: string) {
        const instance = this.instances.get(id)
        if (!instance) return

        instance.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial
                if (mat.isMeshStandardMaterial) {
                    mat.emissiveIntensity = 0
                }
            }
        })
    }

    /**
     * Set elite/super enemy glow effect
     */
    setInstanceGlow(id: string, glowColor: number, intensity: number = 0.5) {
        const instance = this.instances.get(id)
        if (!instance) return

        instance.model.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                const mat = child.material as THREE.MeshStandardMaterial
                if (mat.isMeshStandardMaterial) {
                    mat.emissive.setHex(glowColor)
                    mat.emissiveIntensity = intensity
                }
            }
        })
    }

    /**
     * Set instance scale (for elite/super enemies)
     */
    setInstanceScale(id: string, scale: number) {
        const instance = this.instances.get(id)
        if (instance) {
            instance.model.scale.setScalar(scale)
        }
    }

    removeInstance(id: string) {
        const instance = this.instances.get(id)
        if (instance) {
            // Return pooled instances to pool instead of destroying
            if (!instance.isPlayer && this.enemyPool.includes(instance)) {
                this.returnToPool(instance)
            } else if (this.scene) {
                this.scene.remove(instance.model)
                if (instance.mixer) {
                    instance.mixer.stopAllAction()
                }
            }
            this.instances.delete(id)
        }
    }

    getInstance(id: string): CharacterInstance | undefined {
        return this.instances.get(id)
    }

    dispose() {
        const ids = Array.from(this.instances.keys())
        for (const id of ids) {
            this.removeInstance(id)
        }
        this.instances.clear()

        // Cleanup pool
        for (const instance of this.enemyPool) {
            if (this.scene) {
                this.scene.remove(instance.model)
            }
        }
        this.enemyPool = []
        this.poolSize = 0

        // Cleanup master
        if (this.masterMixer) {
            this.masterMixer.stopAllAction()
            this.masterMixer = null
        }
        this.masterModel = null
        this.masterBones = []
        this.masterAction = null

        this.loadedModel = null
        this.animations = []
        this.isLoaded = false
        this.loadPromise = null
    }
}
