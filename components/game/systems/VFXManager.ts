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

    constructor(private scene: THREE.Scene) { }

    createDamageNumber(x: number, z: number, amount: number, color: string = 'white', scale: number = 1.0) {
        this.createFloatingText(x, z, Math.round(amount).toString(), color, scale)
    }

    createFloatingText(x: number, z: number, text: string, color: string | number = 'white', scale: number = 1.0) {
        const canvas = document.createElement('canvas')
        canvas.width = 512
        canvas.height = 64
        const context = canvas.getContext('2d')
        if (!context) return

        context.font = 'Bold 40px Arial'
        context.fillStyle = typeof color === 'number' ? '#' + color.toString(16).padStart(6, '0') : color
        context.textAlign = 'center'
        context.shadowColor = 'rgba(0,0,0,0.5)'
        context.shadowBlur = 4
        context.fillText(text, 256, 45) // Centered at 256, slightly lower y for descenders

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(material)

        sprite.position.set(x, 2, z)
        const baseScale = new THREE.Vector3(6.0 * scale, 0.75 * scale, 1)
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
                this.scene.remove(effect.sprite)
                effect.sprite.material.dispose()
                if (effect.sprite.material.map) effect.sprite.material.map.dispose()
                this.effects.splice(i, 1)
            }
        }
    }

    cleanup() {
        for (const effect of this.effects) {
            this.scene.remove(effect.sprite)
            effect.sprite.material.dispose()
            if (effect.sprite.material.map) effect.sprite.material.map.dispose()
        }
        this.effects = []
    }
}
