/**
 * VFXManager.ts
 *
 * Handles ephemeral visual effects like damage numbers and hit flashes.
 * Optimized with texture caching to avoid creating new canvases each frame.
 */

import * as THREE from 'three'

// Cached textures for damage numbers - initialized lazily to avoid SSR issues
const colorTextureCache: Map<string, THREE.Texture> = new Map()
let textureInitialized = false

function initializeTextureCacheIfNeeded(): void {
    if (textureInitialized || typeof document === 'undefined') return
    textureInitialized = true
}

interface VFXEffect {
    sprite: THREE.Sprite
    velocity: THREE.Vector3
    life: number
    maxLife: number
    rotation: number
    baseScale: THREE.Vector3
    fadeType: 'scale' | 'opacity'
}

export class VFXManager {
    private effects: VFXEffect[] = []
    private effectCount = 0
    private maxEffects = 500

    private spritePool: THREE.Sprite[] = []
    private materialPool: THREE.SpriteMaterial[] = []
    private screenShakeIntensity: number = 0
    private screenShakeDecay: number = 0

    // Reusable vectors
    private static _tempScale = new THREE.Vector3()

    constructor(private scene: THREE.Scene) {
        // Pre-allocate effect slots
        for (let i = 0; i < this.maxEffects; i++) {
            this.effects.push({
                sprite: null!,
                velocity: new THREE.Vector3(),
                life: 0,
                maxLife: 0,
                rotation: 0,
                baseScale: new THREE.Vector3(),
                fadeType: 'opacity'
            })
        }
    }

    private getPooledSprite(texture: THREE.Texture): THREE.Sprite | null {
        if (this.effectCount >= this.maxEffects) return null

        let sprite: THREE.Sprite
        let material: THREE.SpriteMaterial

        if (this.spritePool.length > 0) {
            sprite = this.spritePool.pop()!
            material = sprite.material as THREE.SpriteMaterial
            material.map = texture
            material.opacity = 1
            material.visible = true
            material.depthTest = false
            material.depthWrite = false
            material.rotation = 0 // Reset rotation from previous effect
            sprite.visible = true
            sprite.renderOrder = 999
        } else if (this.materialPool.length > 0) {
            material = this.materialPool.pop()!
            material.map = texture
            material.opacity = 1
            material.visible = true
            material.depthTest = false
            material.depthWrite = false
            material.rotation = 0 // Reset rotation
            sprite = new THREE.Sprite(material)
            sprite.visible = true
            sprite.renderOrder = 999
        } else {
            material = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            })
            sprite = new THREE.Sprite(material)
            sprite.visible = true
            sprite.renderOrder = 999 // Render on top of everything
        }

        return sprite
    }

    private returnToPool(sprite: THREE.Sprite) {
        this.scene.remove(sprite)
        sprite.visible = false
        if (this.spritePool.length < 50) {
            this.spritePool.push(sprite)
        } else {
            // Don't dispose material - reuse it
            const mat = sprite.material as THREE.SpriteMaterial
            if (this.materialPool.length < 50) {
                mat.map = null
                this.materialPool.push(mat)
            } else {
                mat.dispose()
            }
        }
    }

    private addEffect(sprite: THREE.Sprite, vx: number, vy: number, vz: number, life: number, rotation: number, baseScale: THREE.Vector3, fadeType: 'scale' | 'opacity') {
        // Find an inactive slot
        for (let i = 0; i < this.maxEffects; i++) {
            const effect = this.effects[i]
            if (effect.life <= 0 || !effect.sprite) {
                effect.sprite = sprite
                effect.velocity.set(vx, vy, vz)
                effect.life = life
                effect.maxLife = life
                effect.rotation = rotation
                effect.baseScale.copy(baseScale)
                effect.fadeType = fadeType
                this.effectCount++
                this.scene.add(sprite)
                return
            }
        }
        // No slot available, return sprite to pool
        this.returnToPool(sprite)
    }

    createDamageNumber(x: number, z: number, amount: number, color: string = 'white', scale: number = 1.0, isCritical: boolean = false, isKill: boolean = false) {
        let finalColor = color
        let finalScale = scale

        // Critical hits in yellow with larger scale
        if (isCritical) {
            finalColor = '#FFD700'
            finalScale *= 1.5
        }

        // Kills in gold with even larger scale
        if (isKill) {
            finalColor = '#FFA500'
            finalScale *= 1.8
        }

        this.createFloatingTextFast(x, z, Math.round(amount).toString(), finalColor, finalScale)
    }

    // Optimized floating text using cached textures
    private createFloatingTextFast(x: number, z: number, text: string, color: string | number = 'white', scale: number = 1.0) {
        if (typeof document === 'undefined') return

        initializeTextureCacheIfNeeded()

        // Use cached texture for this color+text combo
        const cacheKey = `${text}_${color}`
        let texture = colorTextureCache.get(cacheKey)

        if (!texture) {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            const font = 'Bold 40px Arial'
            ctx.font = font
            const textMetrics = ctx.measureText(text)
            const padding = 10
            canvas.width = Math.ceil(textMetrics.width) + padding * 2
            canvas.height = 64

            ctx.font = font
            ctx.fillStyle = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color
            ctx.textAlign = 'center'
            ctx.shadowColor = 'rgba(0,0,0,0.5)'
            ctx.shadowBlur = 4
            ctx.fillText(text, canvas.width / 2, 45)

            texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace

            if (colorTextureCache.size < 500) {
                colorTextureCache.set(cacheKey, texture)
            }
        }

        const sprite = this.getPooledSprite(texture)
        if (!sprite) return

        // Position above the hit location
        sprite.position.set(x, 1.5, z)
        const aspectRatio = texture.image ? (texture.image as HTMLCanvasElement).width / (texture.image as HTMLCanvasElement).height : 2
        // Make damage numbers larger and more visible
        const scaleX = aspectRatio * scale * 1.5
        const scaleY = scale * 1.5
        sprite.scale.set(scaleX, scaleY, 1)

        // Find an inactive slot and add directly
        for (let i = 0; i < this.maxEffects; i++) {
            const effect = this.effects[i]
            if (effect.life <= 0 || !effect.sprite) {
                effect.sprite = sprite
                effect.velocity.set(0, 2.5, 0) // Slower upward movement
                effect.life = 1.2
                effect.maxLife = 1.2
                effect.rotation = 0
                effect.baseScale.set(scaleX, scaleY, 1)
                effect.fadeType = 'opacity'
                this.effectCount++
                this.scene.add(sprite)
                return
            }
        }
        // No slot, return to pool
        this.returnToPool(sprite)
    }

    createHealingNumber(x: number, z: number, amount: number) {
        this.createFloatingText(x, z, '+' + Math.round(amount).toString(), '#00FF88', 1.2)
    }

    // Screen shake effect
    triggerScreenShake(intensity: number = 0.3, duration: number = 0.3) {
        this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity)
        this.screenShakeDecay = intensity / duration
    }

    getScreenShakeOffset(): { x: number, y: number } {
        if (this.screenShakeIntensity <= 0) return { x: 0, y: 0 }
        return {
            x: (Math.random() - 0.5) * this.screenShakeIntensity * 2,
            y: (Math.random() - 0.5) * this.screenShakeIntensity * 2
        }
    }

    updateScreenShake(deltaTime: number) {
        if (this.screenShakeIntensity > 0) {
            this.screenShakeIntensity -= this.screenShakeDecay * deltaTime
            if (this.screenShakeIntensity < 0) this.screenShakeIntensity = 0
        }
    }

    // Cached particle textures by color
    private static particleTextureCache: Map<string, THREE.Texture> = new Map()

    // Particle burst effect
    createParticleBurst(x: number, z: number, count: number = 8, color: string | number = 0xFFFFFF, speed: number = 5) {
        if (typeof document === 'undefined') return
        if (this.effectCount >= this.maxEffects) return

        const colorStr = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color

        let texture = VFXManager.particleTextureCache.get(colorStr)
        if (!texture) {
            const canvas = document.createElement('canvas')
            canvas.width = 16
            canvas.height = 16
            const context = canvas.getContext('2d')
            if (!context) return

            context.fillStyle = colorStr
            context.beginPath()
            context.arc(8, 8, 4, 0, Math.PI * 2)
            context.fill()

            texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            VFXManager.particleTextureCache.set(colorStr, texture)
        }

        VFXManager._tempScale.set(0.5, 0.5, 1)

        for (let i = 0; i < count; i++) {
            const sprite = this.getPooledSprite(texture)
            if (!sprite) return

            const angle = (Math.PI * 2 * i) / actualCount
            sprite.position.set(x, 0.5, z)
            sprite.scale.copy(VFXManager._tempScale)

            this.addEffect(sprite, Math.cos(angle) * speed, speed * 0.5, Math.sin(angle) * speed, 0.4, 0, VFXManager._tempScale, 'opacity')
        }
    }

    // Cached level up texture
    private static levelUpTexture: THREE.Texture | null = null

    // Level up burst effect
    createLevelUpBurst(x: number, z: number) {
        if (typeof document === 'undefined') return
        if (this.effectCount >= this.maxEffects) return

        if (!VFXManager.levelUpTexture) {
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const context = canvas.getContext('2d')
            if (!context) return

            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
            gradient.addColorStop(0, 'rgba(255, 215, 0, 1)')
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
            context.fillStyle = gradient
            context.fillRect(0, 0, 32, 32)

            VFXManager.levelUpTexture = new THREE.CanvasTexture(canvas)
            VFXManager.levelUpTexture.colorSpace = THREE.SRGBColorSpace
        }

        VFXManager._tempScale.set(1.5, 1.5, 1)

        const particleCount = 12
        for (let i = 0; i < particleCount; i++) {
            const sprite = this.getPooledSprite(VFXManager.levelUpTexture)
            if (!sprite) return

            const angle = (Math.PI * 2 * i) / particleCount
            sprite.position.set(x + Math.cos(angle) * 2, 1, z + Math.sin(angle) * 2)
            sprite.scale.copy(VFXManager._tempScale)
            ;(sprite.material as THREE.SpriteMaterial).blending = THREE.AdditiveBlending

            this.addEffect(sprite, Math.cos(angle) * 8, 2, Math.sin(angle) * 8, 0.6, 0, VFXManager._tempScale, 'opacity')
        }
    }

    createFloatingText(x: number, z: number, text: string, color: string | number = 'white', scale: number = 1.0) {
        // Use the fast path
        this.createFloatingTextFast(x, z, text, color, scale)
    }

    // Cache for emoji textures
    private static emojiTextureCache: Map<string, THREE.Texture> = new Map()

    createEmoji(x: number, z: number, emoji: string, scale: number = 1.0) {
        if (typeof document === 'undefined') return
        if (this.effectCount >= this.maxEffects) return

        let texture = VFXManager.emojiTextureCache.get(emoji)
        if (!texture) {
            const canvas = document.createElement('canvas')
            canvas.width = 64
            canvas.height = 64
            const context = canvas.getContext('2d')
            if (!context) return

            context.font = '48px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'
            context.textAlign = 'center'
            context.textBaseline = 'middle'
            context.fillText(emoji, 32, 32)

            texture = new THREE.CanvasTexture(canvas)
            texture.colorSpace = THREE.SRGBColorSpace
            VFXManager.emojiTextureCache.set(emoji, texture)
        }

        const sprite = this.getPooledSprite(texture)
        if (!sprite) return

        sprite.position.set(x, 0.5, z)
        VFXManager._tempScale.set(1.2 * scale, 1.2 * scale, 1)
        sprite.scale.copy(VFXManager._tempScale)

        this.addEffect(sprite, (Math.random() - 0.5) * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 4, 0.6, (Math.random() - 0.5) * 10, VFXManager._tempScale, 'scale')
    }

    update(deltaTime: number) {
        this.updateScreenShake(deltaTime)

        for (let i = 0; i < this.maxEffects; i++) {
            const effect = this.effects[i]
            if (effect.life <= 0 || !effect.sprite) continue

            effect.life -= deltaTime

            // Move
            effect.sprite.position.x += effect.velocity.x * deltaTime
            effect.sprite.position.y += effect.velocity.y * deltaTime
            effect.sprite.position.z += effect.velocity.z * deltaTime

            // Rotate
            ;(effect.sprite.material as THREE.SpriteMaterial).rotation += effect.rotation * deltaTime

            // Gravity
            effect.velocity.y -= 12 * deltaTime

            const ratio = Math.max(0, effect.life / effect.maxLife)

            if (effect.fadeType === 'scale') {
                const scaleMod = ratio > 0.5 ? 1.0 : ratio * 2.0
                effect.sprite.scale.copy(effect.baseScale).multiplyScalar(scaleMod)
            } else {
                effect.sprite.scale.copy(effect.baseScale)
                ;(effect.sprite.material as THREE.SpriteMaterial).opacity = ratio
            }

            if (effect.life <= 0) {
                this.returnToPool(effect.sprite)
                effect.sprite = null!
                this.effectCount--
            }
        }
    }

    cleanup() {
        for (let i = 0; i < this.maxEffects; i++) {
            const effect = this.effects[i]
            if (effect.life > 0 && effect.sprite) {
                this.returnToPool(effect.sprite)
                effect.life = 0
            }
        }
        this.effectCount = 0

        // Clean up pools
        for (const sprite of this.spritePool) {
            (sprite.material as THREE.SpriteMaterial).dispose()
        }
        this.spritePool = []

        for (const mat of this.materialPool) {
            mat.dispose()
        }
        this.materialPool = []
    }
}
