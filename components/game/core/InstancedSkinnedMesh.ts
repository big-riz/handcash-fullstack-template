/**
 * InstancedSkinnedMesh.ts
 *
 * GPU-instanced skinned mesh rendering for hundreds of animated characters.
 * All instances share the same skeleton/animation but have independent transforms.
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export class InstancedSkinnedMesh {
    private scene: THREE.Scene
    private instancedMesh: THREE.InstancedMesh | null = null
    private maxInstances: number
    private activeCount = 0

    // Skeleton data
    private skeleton: THREE.Skeleton | null = null
    private mixer: THREE.AnimationMixer | null = null
    private boneTexture: THREE.DataTexture | null = null
    private boneTextureSize: number = 0

    // Keep original mesh in scene (hidden) for proper skeleton updates
    private originalMesh: THREE.SkinnedMesh | null = null
    private originalScene: THREE.Group | null = null

    // Bind matrices for proper skinning
    private bindMatrix: THREE.Matrix4 | null = null
    private bindMatrixInverse: THREE.Matrix4 | null = null

    // Instance data
    private instanceColors: Float32Array
    private instanceActive: boolean[]
    private colorAttribute: THREE.InstancedBufferAttribute | null = null

    // Reusable matrix to avoid GC
    private tempMatrix = new THREE.Matrix4()

    private isLoaded = false

    constructor(scene: THREE.Scene, maxInstances: number = 500) {
        this.scene = scene
        this.maxInstances = maxInstances
        this.instanceColors = new Float32Array(maxInstances * 3)
        this.instanceActive = new Array(maxInstances).fill(false)
    }

    async load(url: string): Promise<void> {
        const loader = new GLTFLoader()

        return new Promise((resolve, reject) => {
            loader.load(
                url,
                (gltf) => {
                    // Find the skinned mesh
                    let foundMesh: THREE.SkinnedMesh | null = null
                    gltf.scene.traverse((child) => {
                        if (child instanceof THREE.SkinnedMesh && !foundMesh) {
                            foundMesh = child
                        }
                    })

                    if (!foundMesh) {
                        console.warn('[InstancedSkinnedMesh] No skinned mesh found in model')
                        resolve()
                        return
                    }

                    const skinnedMesh = foundMesh as THREE.SkinnedMesh
                    this.originalMesh = skinnedMesh
                    this.skeleton = skinnedMesh.skeleton
                    this.originalScene = gltf.scene

                    // Capture bind matrices for proper skinning transformation
                    this.bindMatrix = skinnedMesh.bindMatrix.clone()
                    this.bindMatrixInverse = skinnedMesh.bindMatrixInverse.clone()

                    // Add original scene to our scene (hidden) - needed for bone world matrices
                    // Reset to origin so bone matrices are in local space
                    gltf.scene.position.set(0, 0, 0)
                    gltf.scene.rotation.set(0, 0, 0)
                    gltf.scene.scale.set(1, 1, 1)
                    gltf.scene.visible = false
                    this.scene.add(gltf.scene)

                    // Initialize skeleton's boneMatrices
                    // This ensures boneMatrices Float32Array is properly allocated
                    if (!this.skeleton.boneMatrices || this.skeleton.boneMatrices.length === 0) {
                        // Force skeleton to compute its bone matrices
                        gltf.scene.updateMatrixWorld(true)
                        this.skeleton.update()
                    }

                    // Use Three.js's built-in bone texture computation
                    const boneCount = this.skeleton.bones.length

                    // Let Three.js compute the bone texture - this handles all the format details
                    if (typeof this.skeleton.computeBoneTexture === 'function') {
                        this.skeleton.computeBoneTexture()
                    }

                    // Get the skeleton's bone texture
                    if (this.skeleton.boneTexture) {
                        this.boneTexture = this.skeleton.boneTexture as THREE.DataTexture
                        this.boneTextureSize = this.boneTexture.image.width
                        console.log(`[InstancedSkinnedMesh] Using skeleton boneTexture: ${this.boneTextureSize}x${this.boneTextureSize}`)
                    } else {
                        // Fallback: create our own bone texture
                        console.log(`[InstancedSkinnedMesh] Creating custom bone texture`)
                        this.boneTextureSize = Math.max(4, Math.pow(2, Math.ceil(Math.log2(Math.ceil(Math.sqrt(boneCount * 4))))))
                        const textureData = new Float32Array(this.boneTextureSize * this.boneTextureSize * 4)
                        this.boneTexture = new THREE.DataTexture(
                            textureData,
                            this.boneTextureSize,
                            this.boneTextureSize,
                            THREE.RGBAFormat,
                            THREE.FloatType
                        )
                        this.boneTexture.minFilter = THREE.NearestFilter
                        this.boneTexture.magFilter = THREE.NearestFilter
                        this.boneTexture.needsUpdate = true
                    }

                    // Setup animation on the original mesh's root
                    if (gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(skinnedMesh)
                        const action = this.mixer.clipAction(gltf.animations[0])
                        action.play()
                    }

                    // Create the instanced mesh with custom material
                    this.createInstancedMesh(skinnedMesh)

                    // Debug: Log skeleton info
                    console.log(`[InstancedSkinnedMesh] Loaded with ${boneCount} bones, texture size ${this.boneTextureSize}x${this.boneTextureSize}, ${this.maxInstances} max instances`)
                    console.log(`[InstancedSkinnedMesh] Skeleton boneMatrices length: ${this.skeleton.boneMatrices?.length || 0}`)
                    console.log(`[InstancedSkinnedMesh] Skeleton bones[0] position:`, this.skeleton.bones[0]?.position)
                    console.log(`[InstancedSkinnedMesh] Geometry skinIndex:`, skinnedMesh.geometry.attributes.skinIndex)
                    console.log(`[InstancedSkinnedMesh] Geometry skinWeight:`, skinnedMesh.geometry.attributes.skinWeight)

                    this.isLoaded = true
                    resolve()
                },
                undefined,
                reject
            )
        })
    }

    private createInstancedMesh(skinnedMesh: THREE.SkinnedMesh): void {
        const geometry = skinnedMesh.geometry.clone()

        // Ensure skinIndex and skinWeight are present
        if (!geometry.attributes.skinIndex || !geometry.attributes.skinWeight) {
            console.error('[InstancedSkinnedMesh] Geometry missing skinIndex or skinWeight attributes')
            return
        }

        // Create custom shader material for instanced skinning
        // Use GLSL 300 es for texelFetch support (matches Three.js internal skinning)
        const material = new THREE.ShaderMaterial({
            glslVersion: THREE.GLSL3,
            uniforms: {
                boneTexture: { value: this.boneTexture },
                bindMatrix: { value: this.bindMatrix },
                bindMatrixInverse: { value: this.bindMatrixInverse },
            },
            vertexShader: `
                precision highp float;
                precision highp sampler2D;

                uniform sampler2D boneTexture;
                uniform mat4 bindMatrix;
                uniform mat4 bindMatrixInverse;

                in vec4 skinIndex;
                in vec4 skinWeight;
                in vec3 instanceColor;

                out vec3 vNormal;
                out vec3 vColor;

                mat4 getBoneMatrix(float i) {
                    int size = textureSize(boneTexture, 0).x;
                    int j = int(i) * 4;
                    int x = j % size;
                    int y = j / size;
                    vec4 v1 = texelFetch(boneTexture, ivec2(x, y), 0);
                    vec4 v2 = texelFetch(boneTexture, ivec2(x + 1, y), 0);
                    vec4 v3 = texelFetch(boneTexture, ivec2(x + 2, y), 0);
                    vec4 v4 = texelFetch(boneTexture, ivec2(x + 3, y), 0);
                    return mat4(v1, v2, v3, v4);
                }

                void main() {
                    vColor = instanceColor;

                    // Get bone matrices
                    mat4 boneMatX = getBoneMatrix(skinIndex.x);
                    mat4 boneMatY = getBoneMatrix(skinIndex.y);
                    mat4 boneMatZ = getBoneMatrix(skinIndex.z);
                    mat4 boneMatW = getBoneMatrix(skinIndex.w);

                    // Transform vertex to bind pose space first
                    vec4 skinVertex = bindMatrix * vec4(position, 1.0);

                    // Apply skinning
                    vec4 skinnedPosition = vec4(0.0);
                    skinnedPosition += boneMatX * skinVertex * skinWeight.x;
                    skinnedPosition += boneMatY * skinVertex * skinWeight.y;
                    skinnedPosition += boneMatZ * skinVertex * skinWeight.z;
                    skinnedPosition += boneMatW * skinVertex * skinWeight.w;

                    // Apply instance transform then view/projection
                    vec4 worldPosition = instanceMatrix * skinnedPosition;
                    gl_Position = projectionMatrix * viewMatrix * worldPosition;

                    // Transform normal to bind pose space
                    vec3 bindNormal = mat3(bindMatrix) * normal;

                    // Apply skinning to normal
                    mat3 boneNormalX = mat3(boneMatX);
                    mat3 boneNormalY = mat3(boneMatY);
                    mat3 boneNormalZ = mat3(boneMatZ);
                    mat3 boneNormalW = mat3(boneMatW);

                    vec3 skinnedNormal = vec3(0.0);
                    skinnedNormal += boneNormalX * bindNormal * skinWeight.x;
                    skinnedNormal += boneNormalY * bindNormal * skinWeight.y;
                    skinnedNormal += boneNormalZ * bindNormal * skinWeight.z;
                    skinnedNormal += boneNormalW * bindNormal * skinWeight.w;

                    vNormal = normalize(mat3(instanceMatrix) * skinnedNormal);
                }
            `,
            fragmentShader: `
                precision highp float;

                in vec3 vNormal;
                in vec3 vColor;

                out vec4 fragColor;

                void main() {
                    // Simple directional lighting
                    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
                    float diff = max(dot(vNormal, lightDir), 0.0);
                    float ambient = 0.4;

                    vec3 color = vColor * (ambient + diff * 0.6);
                    fragColor = vec4(color, 1.0);
                }
            `,
            side: THREE.DoubleSide,
        })

        // Create instanced mesh
        this.instancedMesh = new THREE.InstancedMesh(geometry, material, this.maxInstances)
        this.instancedMesh.count = 0
        this.instancedMesh.frustumCulled = false

        // Add instance color attribute
        this.colorAttribute = new THREE.InstancedBufferAttribute(this.instanceColors, 3)
        geometry.setAttribute('instanceColor', this.colorAttribute)

        // Initialize all instance matrices to zero scale (hidden)
        this.tempMatrix.makeScale(0, 0, 0)
        for (let i = 0; i < this.maxInstances; i++) {
            this.instancedMesh.setMatrixAt(i, this.tempMatrix)
        }
        this.instancedMesh.instanceMatrix.needsUpdate = true

        this.scene.add(this.instancedMesh)
    }

    /**
     * Update the shared animation (call once per frame)
     */
    updateAnimation(deltaTime: number): void {
        if (!this.mixer || !this.skeleton || !this.boneTexture || !this.originalScene) return

        // Update animation mixer
        this.mixer.update(deltaTime)

        // Force update the ENTIRE scene hierarchy (bones may be siblings of mesh)
        this.originalScene.updateMatrixWorld(true)

        // Update skeleton - this computes boneMatrices and updates boneTexture if it owns it
        this.skeleton.update()

        // If we're using a custom texture (not the skeleton's), copy data manually
        if (this.boneTexture !== this.skeleton.boneTexture) {
            const boneMatrices = this.skeleton.boneMatrices
            const textureData = this.boneTexture.image.data as Float32Array
            const len = Math.min(boneMatrices.length, textureData.length)
            for (let i = 0; i < len; i++) {
                textureData[i] = boneMatrices[i]
            }
        }

        // Mark bone texture as needing update
        this.boneTexture.needsUpdate = true
    }

    /**
     * Allocate an instance slot
     */
    allocate(): number {
        for (let i = 0; i < this.maxInstances; i++) {
            if (!this.instanceActive[i]) {
                this.instanceActive[i] = true
                this.activeCount++
                this.updateCount()
                return i
            }
        }
        return -1 // Pool exhausted
    }

    /**
     * Free an instance slot
     */
    free(index: number): void {
        if (index < 0 || index >= this.maxInstances) return
        if (!this.instanceActive[index]) return

        this.instanceActive[index] = false
        this.activeCount--

        // Hide this instance by scaling to 0
        this.tempMatrix.makeScale(0, 0, 0)
        this.instancedMesh?.setMatrixAt(index, this.tempMatrix)
        if (this.instancedMesh) {
            this.instancedMesh.instanceMatrix.needsUpdate = true
        }

        this.updateCount()
    }

    /**
     * Update instance transform and color
     */
    setInstance(
        index: number,
        position: THREE.Vector3,
        rotation: number,
        scale: number,
        color: number
    ): void {
        if (!this.instancedMesh || index < 0 || index >= this.maxInstances) return

        // Build transform matrix: Scale -> Rotate -> Translate
        this.tempMatrix.makeRotationY(rotation)
        this.tempMatrix.scale(new THREE.Vector3(scale, scale, scale))
        this.tempMatrix.setPosition(position)
        this.instancedMesh.setMatrixAt(index, this.tempMatrix)
        this.instancedMesh.instanceMatrix.needsUpdate = true

        // Set color
        const r = ((color >> 16) & 255) / 255
        const g = ((color >> 8) & 255) / 255
        const b = (color & 255) / 255
        this.instanceColors[index * 3] = r
        this.instanceColors[index * 3 + 1] = g
        this.instanceColors[index * 3 + 2] = b
        if (this.colorAttribute) {
            this.colorAttribute.needsUpdate = true
        }
    }

    /**
     * Set visibility of an instance
     */
    setVisible(index: number, visible: boolean): void {
        if (!this.instancedMesh || index < 0 || index >= this.maxInstances) return

        if (!visible) {
            this.tempMatrix.makeScale(0, 0, 0)
            this.instancedMesh.setMatrixAt(index, this.tempMatrix)
            this.instancedMesh.instanceMatrix.needsUpdate = true
        }
    }

    private updateCount(): void {
        if (this.instancedMesh) {
            // Set count to max active index + 1 for proper rendering
            let maxActive = 0
            for (let i = this.maxInstances - 1; i >= 0; i--) {
                if (this.instanceActive[i]) {
                    maxActive = i + 1
                    break
                }
            }
            this.instancedMesh.count = maxActive
        }
    }

    getActiveCount(): number {
        return this.activeCount
    }

    isReady(): boolean {
        return this.isLoaded
    }

    dispose(): void {
        if (this.instancedMesh) {
            this.scene.remove(this.instancedMesh)
            this.instancedMesh.geometry.dispose()
            if (this.instancedMesh.material instanceof THREE.Material) {
                this.instancedMesh.material.dispose()
            }
        }
        if (this.originalScene) {
            this.scene.remove(this.originalScene)
        }
        // Don't dispose boneTexture - it's owned by the skeleton
        this.boneTexture = null
        this.mixer = null
        this.skeleton = null
        this.originalMesh = null
        this.originalScene = null
        this.bindMatrix = null
        this.bindMatrixInverse = null
    }
}
