/**
 * VFXManager.ts
 * 
 * Handles ephemeral visual effects like damage numbers and hit flashes.
 */

import * as THREE from 'three'

export class VFXManager {
    private effects: {
        sprite: THREE.Sprite;
        velocity: THREE.Vector3;
        life: number;
        maxLife: number;
        rotation: number;
        baseScale: THREE.Vector3;
        fadeType: 'scale' | 'opacity';
    }[] = []

    private particlePool: THREE.Sprite[] = []
    private screenShakeIntensity: number = 0
    private screenShakeDecay: number = 0

    constructor(private scene: THREE.Scene) { }

    // Pool management for better performance
    private getPooledSprite(texture: THREE.Texture): THREE.Sprite {
        if (this.particlePool.length > 0) {
            const sprite = this.particlePool.pop()!
            sprite.material.map = texture
            return sprite
        }
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
        return new THREE.Sprite(material)
    }

    private returnToPool(sprite: THREE.Sprite) {
        this.scene.remove(sprite)
        if (this.particlePool.length < 100) {
            this.particlePool.push(sprite)
        } else {
            sprite.material.dispose()
            if (sprite.material.map) sprite.material.map.dispose()
        }
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

        this.createFloatingText(x, z, Math.round(amount).toString(), finalColor, finalScale)
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

    // Particle burst effect (e.g., on enemy death, critical hit)
    createParticleBurst(x: number, z: number, count: number = 8, color: string | number = 0xFFFFFF, speed: number = 5) {
        const colorStr = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color

        for (let i = 0; i < count; i++) {
            const canvas = document.createElement('canvas')
            canvas.width = 16
            canvas.height = 16
            const context = canvas.getContext('2d')
            if (!context) continue

            // Draw a small circle
            context.fillStyle = colorStr
            context.beginPath()
            context.arc(8, 8, 4, 0, Math.PI * 2)
            context.fill()

            const texture = new THREE.CanvasTexture(canvas)
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
            const sprite = new THREE.Sprite(material)

            const angle = (Math.PI * 2 * i) / count
            const velocityX = Math.cos(angle) * speed
            const velocityZ = Math.sin(angle) * speed

            sprite.position.set(x, 0.5, z)
            const baseScale = new THREE.Vector3(0.5, 0.5, 1)
            sprite.scale.copy(baseScale)

            this.scene.add(sprite)

            this.effects.push({
                sprite,
                velocity: new THREE.Vector3(velocityX, speed * 0.5, velocityZ),
                life: 0.5,
                maxLife: 0.5,
                rotation: Math.random() * 10 - 5,
                baseScale,
                fadeType: 'opacity'
            })
        }
    }

    // Level up burst effect
    createLevelUpBurst(x: number, z: number) {
        // Golden ring expanding outward
        for (let i = 0; i < 16; i++) {
            const canvas = document.createElement('canvas')
            canvas.width = 32
            canvas.height = 32
            const context = canvas.getContext('2d')
            if (!context) continue

            const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16)
            gradient.addColorStop(0, 'rgba(255, 215, 0, 1)')
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')
            context.fillStyle = gradient
            context.fillRect(0, 0, 32, 32)

            const texture = new THREE.CanvasTexture(canvas)
            const material = new THREE.SpriteMaterial({ map: texture, transparent: true, blending: THREE.AdditiveBlending })
            const sprite = new THREE.Sprite(material)

            const angle = (Math.PI * 2 * i) / 16
            const radius = 2
            const velocityX = Math.cos(angle) * 8
            const velocityZ = Math.sin(angle) * 8

            sprite.position.set(x + Math.cos(angle) * radius, 1, z + Math.sin(angle) * radius)
            const baseScale = new THREE.Vector3(1.5, 1.5, 1)
            sprite.scale.copy(baseScale)

            this.scene.add(sprite)

            this.effects.push({
                sprite,
                velocity: new THREE.Vector3(velocityX, 2, velocityZ),
                life: 1.0,
                maxLife: 1.0,
                rotation: 0,
                baseScale,
                fadeType: 'opacity'
            })
        }
    }

    createFloatingText(x: number, z: number, text: string, color: string | number = 'white', scale: number = 1.0) {
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        if (!context) return

        const font = 'Bold 40px Arial'
        context.font = font

        // Measure text and set canvas size dynamically
        const textMetrics = context.measureText(text)
        const padding = 10
        canvas.width = textMetrics.width + padding * 2
        canvas.height = 64 // Height can remain fixed

        // Redraw with new dimensions
        context.font = font // Font is reset when canvas is resized
        context.fillStyle = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color
        context.textAlign = 'center'
        context.shadowColor = 'rgba(0,0,0,0.5)'
        context.shadowBlur = 4
        context.fillText(text, canvas.width / 2, 45) // Centered

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(material)

        sprite.position.set(x, 2, z)

        // Adjust scale based on new canvas aspect ratio
        const aspectRatio = canvas.width / canvas.height
        const baseScale = new THREE.Vector3(aspectRatio * 1.0 * scale, 1.0 * scale, 1) // Keep height consistent, adjust width by aspect
        sprite.scale.copy(baseScale)

        this.scene.add(sprite)

        this.effects.push({
            sprite,
            velocity: new THREE.Vector3(0, 3.5, 0),
            life: 2.0,
            maxLife: 2.0,
            rotation: 0,
            baseScale,
            fadeType: 'opacity'
        })
    }

    createEmoji(x: number, z: number, emoji: string, scale: number = 1.0) {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const context = canvas.getContext('2d')
        if (!context) return

        context.font = '48px Arial'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillText(emoji, 32, 32)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(material)

        sprite.position.set(x, 0.5, z)
        const baseScale = new THREE.Vector3(1.2 * scale, 1.2 * scale, 1)
        sprite.scale.copy(baseScale)

        this.scene.add(sprite)

        this.effects.push({
            sprite,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 4),
            life: 0.8,
            maxLife: 0.8,
            rotation: (Math.random() - 0.5) * 10,
            baseScale,
            fadeType: 'scale'
        })
    }

    update(deltaTime: number) {
        // Update screen shake
        this.updateScreenShake(deltaTime)

        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i]
            effect.life -= deltaTime

            // Move
            effect.sprite.position.x += effect.velocity.x * deltaTime
            effect.sprite.position.y += effect.velocity.y * deltaTime
            effect.sprite.position.z += effect.velocity.z * deltaTime

            // Rotate
            effect.sprite.material.rotation += effect.rotation * deltaTime

            // Gravity
            effect.velocity.y -= 12 * deltaTime

            // Life ratio (1.0 at birth, 0.0 at death)
            const ratio = Math.max(0, effect.life / effect.maxLife)

            if (effect.fadeType === 'scale') {
                // Scale-based fade (for emojis)
                // Stay large for the first 50% of life, then shrink quickly
                const scaleMod = ratio > 0.5 ? 1.0 : ratio * 2.0
                effect.sprite.scale.copy(effect.baseScale).multiplyScalar(scaleMod)

                if (effect.sprite.material instanceof THREE.SpriteMaterial) {
                    effect.sprite.material.opacity = 1.0
                }
            } else {
                // Opacity-based fade (for text)
                effect.sprite.scale.copy(effect.baseScale)
                if (effect.sprite.material instanceof THREE.SpriteMaterial) {
                    effect.sprite.material.opacity = ratio
                }
            }

            if (effect.life <= 0) {
                this.returnToPool(effect.sprite)
                this.effects.splice(i, 1)
            }
        }
    }

    cleanup() {
        for (const effect of this.effects) {
            this.returnToPool(effect.sprite)
        }
        this.effects = []

        // Clean up particle pool
        for (const sprite of this.particlePool) {
            sprite.material.dispose()
            if (sprite.material.map) sprite.material.map.dispose()
        }
        this.particlePool = []
    }
}
