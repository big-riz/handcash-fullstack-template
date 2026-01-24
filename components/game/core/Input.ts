/**
 * Input.ts
 * 
 * Handles keyboard and touch input for player movement and game controls
 * Supports WASD and arrow keys for movement, ESC for pause, and touch/pointer input
 */

export class InputManager {
    private keys = new Map<string, boolean>()
    private keyDownHandler: (e: KeyboardEvent) => void
    private keyUpHandler: (e: KeyboardEvent) => void
    
    // Touch/pointer input
    private touchActive = false
    private touchX = 0
    private touchY = 0
    private touchStartX = 0
    private touchStartY = 0
    private pointerDownHandler: (e: PointerEvent) => void
    private pointerMoveHandler: (e: PointerEvent) => void
    private pointerUpHandler: (e: PointerEvent) => void

    constructor() {
        this.keyDownHandler = this.onKeyDown.bind(this)
        this.keyUpHandler = this.onKeyUp.bind(this)
        this.pointerDownHandler = this.onPointerDown.bind(this)
        this.pointerMoveHandler = this.onPointerMove.bind(this)
        this.pointerUpHandler = this.onPointerUp.bind(this)
    }

    start() {
        window.addEventListener('keydown', this.keyDownHandler)
        window.addEventListener('keyup', this.keyUpHandler)
        window.addEventListener('pointerdown', this.pointerDownHandler)
        window.addEventListener('pointermove', this.pointerMoveHandler)
        window.addEventListener('pointerup', this.pointerUpHandler)
        window.addEventListener('pointercancel', this.pointerUpHandler)
    }

    stop() {
        window.removeEventListener('keydown', this.keyDownHandler)
        window.removeEventListener('keyup', this.keyUpHandler)
        window.removeEventListener('pointerdown', this.pointerDownHandler)
        window.removeEventListener('pointermove', this.pointerMoveHandler)
        window.removeEventListener('pointerup', this.pointerUpHandler)
        window.removeEventListener('pointercancel', this.pointerUpHandler)
        this.keys.clear()
        this.touchActive = false
    }

    private onKeyDown(e: KeyboardEvent) {
        this.keys.set(e.code, true)
    }

    private onKeyUp(e: KeyboardEvent) {
        this.keys.set(e.code, false)
    }

    private onPointerDown(e: PointerEvent) {
        // Ignore if clicking on UI elements (buttons, etc)
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('[role="button"]')) {
            return
        }

        this.touchActive = true
        this.touchStartX = e.clientX
        this.touchStartY = e.clientY
        this.touchX = e.clientX
        this.touchY = e.clientY
    }

    private onPointerMove(e: PointerEvent) {
        if (this.touchActive) {
            this.touchX = e.clientX
            this.touchY = e.clientY
        }
    }

    private onPointerUp(e: PointerEvent) {
        this.touchActive = false
        this.touchX = 0
        this.touchY = 0
        this.touchStartX = 0
        this.touchStartY = 0
    }

    isKeyDown(code: string): boolean {
        return this.keys.get(code) || false
    }

    /**
     * Get movement input as a normalized 2D vector
     * Returns { x, z } where x is horizontal and z is vertical (on XZ plane)
     */
    getMovementInput(): { x: number; z: number } {
        let x = 0
        let z = 0

        // Keyboard input (WASD/Arrows)
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) z += 1
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) z -= 1
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x += 1
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x -= 1

        // Touch/pointer input
        if (this.touchActive) {
            const deltaX = this.touchX - this.touchStartX
            const deltaY = this.touchY - this.touchStartY
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            // Only register movement if touch moved at least 10 pixels
            if (distance > 10) {
                // Convert screen coordinates to game coordinates
                // Inverted X because camera looks down at the scene
                x -= deltaX / 100 // Scale down the sensitivity
                z -= deltaY / 100 // Negative because screen Y is inverted
            }
        }

        // Normalize diagonal movement
        const length = Math.sqrt(x * x + z * z)
        if (length > 0) {
            x /= length
            z /= length
        }

        return { x, z }
    }

    /**
     * Check if pause key (ESC) was just pressed
     */
    isPausePressed(): boolean {
        return this.isKeyDown('Escape')
    }

    /**
     * Clear all key and touch states (useful when game loses focus)
     */
    clearAll() {
        this.keys.clear()
        this.touchActive = false
        this.touchX = 0
        this.touchY = 0
        this.touchStartX = 0
        this.touchStartY = 0
    }
}
