/**
 * Input.ts
 * 
 * Handles keyboard input for player movement and game controls
 * Supports WASD and arrow keys for movement, ESC for pause
 */

export class InputManager {
    private keys = new Map<string, boolean>()
    private keyDownHandler: (e: KeyboardEvent) => void
    private keyUpHandler: (e: KeyboardEvent) => void

    constructor() {
        this.keyDownHandler = this.onKeyDown.bind(this)
        this.keyUpHandler = this.onKeyUp.bind(this)
    }

    start() {
        window.addEventListener('keydown', this.keyDownHandler)
        window.addEventListener('keyup', this.keyUpHandler)
    }

    stop() {
        window.removeEventListener('keydown', this.keyDownHandler)
        window.removeEventListener('keyup', this.keyUpHandler)
        this.keys.clear()
    }

    private onKeyDown(e: KeyboardEvent) {
        this.keys.set(e.code, true)
    }

    private onKeyUp(e: KeyboardEvent) {
        this.keys.set(e.code, false)
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

        // WASD
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) z += 1
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) z -= 1
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x += 1
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x -= 1

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
     * Clear all key states (useful when game loses focus)
     */
    clearAll() {
        this.keys.clear()
    }
}
