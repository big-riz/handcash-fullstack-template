/**
 * Input.ts
 * 
 * Handles keyboard and touch input for player movement and game controls
 * 
 * Keyboard: WASD and arrow keys for movement, ESC for pause
 * Touch: Virtual joystick style - touch and drag to move
 *   - Touch anywhere on screen (except UI buttons)
 *   - Drag in the direction you want to move
 *   - Distance from touch start determines movement speed (up to max radius)
 *   - Small dead zone prevents accidental movement
 *   - Smooth, responsive controls optimized for mobile gameplay
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
        
        // Use non-passive event listeners for touch to allow preventDefault
        window.addEventListener('pointerdown', this.pointerDownHandler, { passive: false })
        window.addEventListener('pointermove', this.pointerMoveHandler, { passive: false })
        window.addEventListener('pointerup', this.pointerUpHandler, { passive: false })
        window.addEventListener('pointercancel', this.pointerUpHandler, { passive: false })
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
        if (target.closest('button') || target.closest('[role="button"]') || target.closest('input')) {
            return
        }

        // Prevent default to avoid text selection and scrolling
        e.preventDefault()
        
        this.touchActive = true
        this.touchStartX = e.clientX
        this.touchStartY = e.clientY
        this.touchX = e.clientX
        this.touchY = e.clientY
    }

    private onPointerMove(e: PointerEvent) {
        if (this.touchActive) {
            e.preventDefault()
            this.touchX = e.clientX
            this.touchY = e.clientY
        }
    }

    private onPointerUp(e: PointerEvent) {
        if (this.touchActive) {
            e.preventDefault()
        }
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

        // Touch/pointer input - Virtual joystick style
        if (this.touchActive) {
            const deltaX = this.touchX - this.touchStartX
            const deltaY = this.touchY - this.touchStartY
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            // Dead zone threshold (minimum movement before registering input)
            const deadZone = 5
            
            if (distance > deadZone) {
                // Virtual joystick with maximum effective radius
                const maxRadius = 80 // Maximum distance for full speed
                const normalizedDistance = Math.min(distance, maxRadius) / maxRadius
                
                // Calculate direction from the delta
                const dirX = deltaX / distance
                const dirY = deltaY / distance
                
                // Apply movement with distance-based intensity
                // Screen X maps to game X (inverted), Screen Y maps to game Z (inverted)
                x -= dirX * normalizedDistance
                z -= dirY * normalizedDistance
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
