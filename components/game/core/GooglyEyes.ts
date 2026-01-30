/**
 * GooglyEyes.ts
 *
 * Adds googly eyes to boss enemies that react to movement.
 * Supports different expressions (angry, sad, happy, etc.)
 */

import * as THREE from 'three'

export type EyeExpression = 'normal' | 'angry' | 'sad' | 'evil' | 'tired' | 'surprised'

export class GooglyEyes {
    private leftEye: THREE.Sprite
    private rightEye: THREE.Sprite
    private leftPupil: THREE.Sprite
    private rightPupil: THREE.Sprite
    private leftBrow?: THREE.Sprite
    private rightBrow?: THREE.Sprite

    private eyeRadius: number
    private pupilRadius: number
    private expression: EyeExpression

    constructor(
        scene: THREE.Scene,
        scale: number = 1.0,
        expression: EyeExpression = 'normal'
    ) {
        this.eyeRadius = 0.3 * scale
        this.pupilRadius = 0.12 * scale
        this.expression = expression

        // Create left eye white
        this.leftEye = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.createEyeWhiteTexture(),
                transparent: true,
                depthTest: true,
            })
        )
        this.leftEye.scale.set(this.eyeRadius * 2, this.eyeRadius * 2, 1)
        this.leftEye.renderOrder = 11 // Above enemy sprite
        scene.add(this.leftEye)

        // Create right eye white
        this.rightEye = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.createEyeWhiteTexture(),
                transparent: true,
                depthTest: true,
            })
        )
        this.rightEye.scale.set(this.eyeRadius * 2, this.eyeRadius * 2, 1)
        this.rightEye.renderOrder = 11
        scene.add(this.rightEye)

        // Create left pupil
        this.leftPupil = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.createPupilTexture(),
                transparent: true,
                depthTest: true,
            })
        )
        this.leftPupil.scale.set(this.pupilRadius * 2, this.pupilRadius * 2, 1)
        this.leftPupil.renderOrder = 12 // Above eye white
        scene.add(this.leftPupil)

        // Create right pupil
        this.rightPupil = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: this.createPupilTexture(),
                transparent: true,
                depthTest: true,
            })
        )
        this.rightPupil.scale.set(this.pupilRadius * 2, this.pupilRadius * 2, 1)
        this.rightPupil.renderOrder = 12
        scene.add(this.rightPupil)

        // Create eyebrows if expression needs them
        if (expression !== 'normal') {
            const browTexture = this.createEyebrowTexture(expression)

            this.leftBrow = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: browTexture.clone(),
                    transparent: true,
                    depthTest: true,
                })
            )
            this.leftBrow.scale.set(this.eyeRadius * 2.5, this.eyeRadius * 0.5, 1)
            this.leftBrow.renderOrder = 12
            scene.add(this.leftBrow)

            this.rightBrow = new THREE.Sprite(
                new THREE.SpriteMaterial({
                    map: browTexture.clone(),
                    transparent: true,
                    depthTest: true,
                })
            )
            this.rightBrow.scale.set(this.eyeRadius * 2.5, this.eyeRadius * 0.5, 1)
            this.rightBrow.renderOrder = 12
            scene.add(this.rightBrow)
        }
    }

    /**
     * Create white circle for eye
     */
    private createEyeWhiteTexture(): THREE.Texture {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 64
        const ctx = canvas.getContext('2d')!

        const centerX = 32
        const centerY = 32
        const radius = 28

        // White circle with black border
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3
        ctx.stroke()

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }

    /**
     * Create black pupil
     */
    private createPupilTexture(): THREE.Texture {
        const canvas = document.createElement('canvas')
        canvas.width = 32
        canvas.height = 32
        const ctx = canvas.getContext('2d')!

        const centerX = 16
        const centerY = 16
        const radius = 12

        // Black circle with slight highlight
        const gradient = ctx.createRadialGradient(
            centerX - 4, centerY - 4, 2,
            centerX, centerY, radius
        )
        gradient.addColorStop(0, '#555555')
        gradient.addColorStop(0.3, '#000000')
        gradient.addColorStop(1, '#000000')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.fill()

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }

    /**
     * Create eyebrow based on expression
     */
    private createEyebrowTexture(expression: EyeExpression): THREE.Texture {
        const canvas = document.createElement('canvas')
        canvas.width = 64
        canvas.height = 32
        const ctx = canvas.getContext('2d')!

        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 4
        ctx.lineCap = 'round'

        switch (expression) {
            case 'angry':
                // Angled down towards center (angry)
                ctx.beginPath()
                ctx.moveTo(8, 24)
                ctx.lineTo(56, 8)
                ctx.stroke()
                break

            case 'sad':
                // Angled down towards outside (sad)
                ctx.beginPath()
                ctx.moveTo(8, 8)
                ctx.lineTo(56, 20)
                ctx.stroke()
                break

            case 'evil':
                // Sharp angle (evil)
                ctx.beginPath()
                ctx.moveTo(8, 20)
                ctx.lineTo(32, 8)
                ctx.lineTo(56, 20)
                ctx.stroke()
                break

            case 'tired':
                // Droopy (tired)
                ctx.beginPath()
                ctx.moveTo(8, 12)
                ctx.quadraticCurveTo(32, 24, 56, 12)
                ctx.stroke()
                break

            case 'surprised':
                // High arch (surprised)
                ctx.beginPath()
                ctx.moveTo(8, 20)
                ctx.quadraticCurveTo(32, 8, 56, 20)
                ctx.stroke()
                break

            default:
                // Straight (normal)
                ctx.beginPath()
                ctx.moveTo(8, 16)
                ctx.lineTo(56, 16)
                ctx.stroke()
                break
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true
        return texture
    }

    /**
     * Update eyes based on enemy position and velocity
     */
    update(
        position: THREE.Vector3,
        velocity: THREE.Vector3,
        yOffset: number = 1.0,
        playerPosition?: THREE.Vector3
    ) {
        const eyeSeparation = this.eyeRadius * 1.5

        // Position eyes above enemy
        const eyeY = position.y + yOffset

        this.leftEye.position.set(position.x - eyeSeparation, eyeY, position.z)
        this.rightEye.position.set(position.x + eyeSeparation, eyeY, position.z)

        // Make pupils look toward the player
        const maxPupilOffset = this.eyeRadius * 0.5

        if (playerPosition) {
            const dx = playerPosition.x - position.x
            const dz = playerPosition.z - position.z
            const dist = Math.sqrt(dx * dx + dz * dz)

            if (dist > 0.1) {
                const offsetX = (dx / dist) * maxPupilOffset
                const offsetZ = (dz / dist) * maxPupilOffset

                this.leftPupil.position.set(
                    this.leftEye.position.x + offsetX,
                    eyeY,
                    this.leftEye.position.z + offsetZ
                )
                this.rightPupil.position.set(
                    this.rightEye.position.x + offsetX,
                    eyeY,
                    this.rightEye.position.z + offsetZ
                )
            } else {
                this.leftPupil.position.copy(this.leftEye.position)
                this.rightPupil.position.copy(this.rightEye.position)
            }
        } else {
            // Fallback: center pupils
            this.leftPupil.position.copy(this.leftEye.position)
            this.rightPupil.position.copy(this.rightEye.position)
        }

        // Position eyebrows if they exist
        if (this.leftBrow && this.rightBrow) {
            const browYOffset = this.eyeRadius * 1.2
            this.leftBrow.position.set(
                position.x - eyeSeparation,
                eyeY + browYOffset,
                position.z
            )
            this.rightBrow.position.set(
                position.x + eyeSeparation,
                eyeY + browYOffset,
                position.z
            )
        }
    }

    /**
     * Set visibility of all eye components
     */
    setVisible(visible: boolean) {
        this.leftEye.visible = visible
        this.rightEye.visible = visible
        this.leftPupil.visible = visible
        this.rightPupil.visible = visible
        if (this.leftBrow) this.leftBrow.visible = visible
        if (this.rightBrow) this.rightBrow.visible = visible
    }

    /**
     * Cleanup
     */
    dispose() {
        // Dispose textures
        const leftEyeMat = this.leftEye.material as THREE.SpriteMaterial
        if (leftEyeMat.map) leftEyeMat.map.dispose()
        leftEyeMat.dispose()

        const rightEyeMat = this.rightEye.material as THREE.SpriteMaterial
        if (rightEyeMat.map) rightEyeMat.map.dispose()
        rightEyeMat.dispose()

        const leftPupilMat = this.leftPupil.material as THREE.SpriteMaterial
        if (leftPupilMat.map) leftPupilMat.map.dispose()
        leftPupilMat.dispose()

        const rightPupilMat = this.rightPupil.material as THREE.SpriteMaterial
        if (rightPupilMat.map) rightPupilMat.map.dispose()
        rightPupilMat.dispose()

        if (this.leftBrow) {
            const leftBrowMat = this.leftBrow.material as THREE.SpriteMaterial
            if (leftBrowMat.map) leftBrowMat.map.dispose()
            leftBrowMat.dispose()
            this.leftBrow.removeFromParent()
        }

        if (this.rightBrow) {
            const rightBrowMat = this.rightBrow.material as THREE.SpriteMaterial
            if (rightBrowMat.map) rightBrowMat.map.dispose()
            rightBrowMat.dispose()
            this.rightBrow.removeFromParent()
        }

        // Remove from scene
        this.leftEye.removeFromParent()
        this.rightEye.removeFromParent()
        this.leftPupil.removeFromParent()
        this.rightPupil.removeFromParent()
    }
}
