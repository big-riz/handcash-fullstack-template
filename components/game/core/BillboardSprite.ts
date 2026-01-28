/**
 * BillboardSprite.ts
 *
 * Creates 2D billboarded sprites with shaded sphere illusion for enemies.
 * Much more performant than 3D geometry.
 */

import * as THREE from 'three'

export class BillboardSprite {
    sprite: THREE.Sprite
    private baseMaterial: THREE.SpriteMaterial

    constructor(color: number, radius: number = 0.5, scene: THREE.Scene) {
        // Create sprite material with shaded sphere appearance
        this.baseMaterial = new THREE.SpriteMaterial({
            map: this.createSphereTexture(color),
            transparent: true,
            depthTest: true,
            depthWrite: false,
        })

        this.sprite = new THREE.Sprite(this.baseMaterial)
        this.sprite.scale.set(radius * 2, radius * 2, 1)
        this.sprite.renderOrder = 10 // Render after ground but before UI

        scene.add(this.sprite)
    }

    /**
     * Create a texture that looks like a shaded 3D sphere
     */
    private createSphereTexture(color: number): THREE.Texture {
        const canvas = document.createElement('canvas')
        canvas.width = 128
        canvas.height = 128
        const ctx = canvas.getContext('2d')!

        const centerX = 64
        const centerY = 64
        const radius = 60

        // Convert hex color to RGB
        const r = (color >> 16) & 255
        const g = (color >> 8) & 255
        const b = color & 255

        // Create radial gradient for sphere shading
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3, // Light source offset (top-left)
            centerY - radius * 0.3,
            radius * 0.1,
            centerX,
            centerY,
            radius
        )

        // Highlight (lighter)
        const highlightR = Math.min(255, r + 80)
        const highlightG = Math.min(255, g + 80)
        const highlightB = Math.min(255, b + 80)
        gradient.addColorStop(0, `rgba(${highlightR}, ${highlightG}, ${highlightB}, 1)`)

        // Base color
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, 1)`)

        // Shadow (darker)
        const shadowR = Math.floor(r * 0.3)
        const shadowG = Math.floor(g * 0.3)
        const shadowB = Math.floor(b * 0.3)
        gradient.addColorStop(0.9, `rgba(${shadowR}, ${shadowG}, ${shadowB}, 1)`)

        // Edge fade
        gradient.addColorStop(1, `rgba(${shadowR}, ${shadowG}, ${shadowB}, 0)`)

        // Draw sphere
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()

        // Add subtle rim light on the edge
        const rimGradient = ctx.createRadialGradient(
            centerX, centerY, radius * 0.85,
            centerX, centerY, radius
        )
        rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
        rimGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0)')
        rimGradient.addColorStop(1, 'rgba(255, 255, 255, 0.2)')

        ctx.fillStyle = rimGradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }

    /**
     * Update color (creates new texture)
     */
    setColor(color: number) {
        const newTexture = this.createSphereTexture(color)
        if (this.baseMaterial.map) {
            this.baseMaterial.map.dispose()
        }
        this.baseMaterial.map = newTexture
        this.baseMaterial.needsUpdate = true
    }

    /**
     * Set opacity (for ghost enemies)
     */
    setOpacity(opacity: number) {
        this.baseMaterial.opacity = opacity
    }

    /**
     * Set scale (for elite enemies)
     */
    setScale(scale: number) {
        const baseRadius = 0.5
        this.sprite.scale.set(baseRadius * 2 * scale, baseRadius * 2 * scale, 1)
    }

    /**
     * Update position (sprites are always billboarded automatically by THREE.js)
     */
    setPosition(x: number, y: number, z: number) {
        this.sprite.position.set(x, y, z)
    }

    /**
     * Set visibility
     */
    setVisible(visible: boolean) {
        this.sprite.visible = visible
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.baseMaterial.map) {
            this.baseMaterial.map.dispose()
        }
        this.baseMaterial.dispose()
        this.sprite.removeFromParent()
    }
}
