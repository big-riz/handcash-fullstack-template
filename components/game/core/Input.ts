/**
 * Input.ts
 *
 * Handles keyboard and touch input for player movement and game controls
 *
 * Keyboard: WASD and arrow keys for movement, ESC for pause, Q/E or +/- for zoom
 * Touch: Direct position control
 *   - Tap and hold anywhere on screen to move in that direction
 *   - Player moves towards the tapped position
 *   - Simple, intuitive mobile controls
 * Zoom: Mouse wheel or Q/E keys
 */

export class InputManager {
    private keys = new Map<string, boolean>()
    private keyDownHandler: (e: KeyboardEvent) => void
    private keyUpHandler: (e: KeyboardEvent) => void

    // Touch/pointer input - Direct position control
    private touchActive = false
    private touchX = 0
    private touchY = 0
    private pointerDownHandler: (e: PointerEvent) => void
    private pointerMoveHandler: (e: PointerEvent) => void
    private pointerUpHandler: (e: PointerEvent) => void

    // Zoom input
    private zoomDelta = 0
    private wheelHandler: (e: WheelEvent) => void

    constructor() {
        this.keyDownHandler = this.onKeyDown.bind(this)
        this.keyUpHandler = this.onKeyUp.bind(this)
        this.pointerDownHandler = this.onPointerDown.bind(this)
        this.pointerMoveHandler = this.onPointerMove.bind(this)
        this.pointerUpHandler = this.onPointerUp.bind(this)
        this.wheelHandler = this.onWheel.bind(this)
    }

    start() {
        window.addEventListener('keydown', this.keyDownHandler)
        window.addEventListener('keyup', this.keyUpHandler)

        // Use non-passive event listeners for touch to allow preventDefault
        window.addEventListener('pointerdown', this.pointerDownHandler, { passive: false })
        window.addEventListener('pointermove', this.pointerMoveHandler, { passive: false })
        window.addEventListener('pointerup', this.pointerUpHandler, { passive: false })
        window.addEventListener('pointercancel', this.pointerUpHandler, { passive: false })

        // Wheel listener for zoom
        window.addEventListener('wheel', this.wheelHandler, { passive: false })
    }

    stop() {
        window.removeEventListener('keydown', this.keyDownHandler)
        window.removeEventListener('keyup', this.keyUpHandler)
        window.removeEventListener('pointerdown', this.pointerDownHandler)
        window.removeEventListener('pointermove', this.pointerMoveHandler)
        window.removeEventListener('pointerup', this.pointerUpHandler)
        window.removeEventListener('pointercancel', this.pointerUpHandler)
        window.removeEventListener('wheel', this.wheelHandler)
        this.keys.clear()
        this.touchActive = false
        this.zoomDelta = 0
    }

    private onKeyDown(e: KeyboardEvent) {
        this.keys.set(e.code, true)
    }

    private onKeyUp(e: KeyboardEvent) {
        this.keys.set(e.code, false)
    }

    private onPointerDown(e: PointerEvent) {
        // Ignore if clicking on UI elements (buttons, inputs, etc)
        const target = e.target as HTMLElement
        if (target.closest('button') || 
            target.closest('[role="button"]') || 
            target.closest('input') || 
            target.closest('select') || 
            target.closest('textarea') ||
            target.closest('a')) {
            return
        }

        // Prevent default to avoid text selection and scrolling
        e.preventDefault()
        
        this.touchActive = true
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
    }

    private onWheel(e: WheelEvent) {
        // Ignore if hovering over UI elements
        const target = e.target as HTMLElement
        if (target.closest('button') || target.closest('[role="button"]') || target.closest('input')) {
            return
        }

        e.preventDefault()
        // Normalize wheel delta (different browsers have different values)
        this.zoomDelta += Math.sign(e.deltaY)
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

        // Touch/pointer input - Direct position control
        if (this.touchActive) {
            // Calculate direction from screen center to touch position
            const screenCenterX = window.innerWidth / 2
            const screenCenterY = window.innerHeight / 2
            
            const deltaX = this.touchX - screenCenterX
            const deltaY = this.touchY - screenCenterY
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            // Minimum distance threshold to prevent jittery movement near center
            const deadZone = 30
            
            if (distance > deadZone) {
                // Calculate normalized direction vector
                const dirX = deltaX / distance
                const dirY = deltaY / distance
                
                // Apply movement at full speed
                // Screen X maps to game X (inverted), Screen Y maps to game Z (inverted)
                x -= dirX
                z -= dirY
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
     * Get zoom input (mouse wheel + keyboard)
     * Returns delta value: negative = zoom in, positive = zoom out
     */
    getZoomInput(): number {
        let delta = this.zoomDelta
        this.zoomDelta = 0 // Reset delta after reading

        // Keyboard zoom: Q = zoom in, E = zoom out (or +/-)
        if (this.isKeyDown('KeyQ') || this.isKeyDown('Minus')) {
            delta -= 0.5 // Zoom in
        }
        if (this.isKeyDown('KeyE') || this.isKeyDown('Equal')) {
            delta += 0.5 // Zoom out
        }

        return delta
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
        this.zoomDelta = 0
    }
}
