/**
 * VFXManager.ts
 * 
 * Handles ephemeral visual effects like damage numbers and hit flashes.
 */

import * as THREE from 'three'

export class VFXManager {
    private effects: { sprite: THREE.Sprite; velocity: THREE.Vector3; life: number; maxLife: number; rotation: number }[] = []

    constructor(private scene: THREE.Scene) { }

    createDamageNumber(x: number, z: number, amount: number, color: string = 'white', scale: number = 1.0) {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 64
        const context = canvas.getContext('2d')
        if (!context) return

        context.font = 'Bold 40px Arial'
        context.fillStyle = color
        context.textAlign = 'center'
        context.shadowColor = 'rgba(0,0,0,0.5)'
        context.shadowBlur = 4
        context.fillText(Math.round(amount).toString(), 64, 40)

        const texture = new THREE.CanvasTexture(canvas)
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true })
        const sprite = new THREE.Sprite(material)

        sprite.position.set(x, 1, z)
        sprite.scale.set(1.5 * scale, 0.75 * scale, 1)

        this.scene.add(sprite)

        this.effects.push({
            sprite,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 2, 2.5, (Math.random() - 0.5) * 2),
            life: 1.0,
            maxLife: 1.0,
            rotation: (Math.random() - 0.5) * 2
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
        sprite.scale.set(1.2 * scale, 1.2 * scale, 1)

        this.scene.add(sprite)

        this.effects.push({
            sprite,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 4),
            life: 0.8,
            maxLife: 0.8,
            rotation: (Math.random() - 0.5) * 10
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

            if (effect.sprite.material instanceof THREE.SpriteMaterial) {
                effect.sprite.material.opacity = effect.life / effect.maxLife
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
