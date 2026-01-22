/**
 * GameLoop.ts
 * 
 * Fixed timestep game loop implementation (60Hz)
 * Uses accumulator pattern to ensure consistent physics simulation
 * regardless of frame rate.
 */

export class GameLoop {
    private lastTime = 0
    private accumulator = 0
    private readonly fixedDeltaTime = 1000 / 60 // 60 FPS in milliseconds
    private animationFrameId: number | null = null
    private isRunning = false

    // FPS tracking
    private fpsFrames: number[] = []
    private currentFps = 0

    constructor(
        private updateCallback: (deltaTime: number) => void,
        private renderCallback: (alpha: number) => void,
        private fpsCallback?: (fps: number) => void
    ) { }

    start() {
        if (this.isRunning) return
        this.isRunning = true
        this.lastTime = performance.now()
        this.accumulator = 0
        this.loop(this.lastTime)
    }

    stop() {
        this.isRunning = false
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId)
            this.animationFrameId = null
        }
    }

    private loop = (currentTime: number) => {
        if (!this.isRunning) return

        // Calculate frame time
        const frameTime = currentTime - this.lastTime
        this.lastTime = currentTime

        // Update FPS counter
        this.updateFps(frameTime)

        // Add frame time to accumulator (capped to prevent spiral of death)
        this.accumulator += Math.min(frameTime, 250)

        // Fixed timestep updates
        while (this.accumulator >= this.fixedDeltaTime) {
            this.updateCallback(this.fixedDeltaTime / 1000) // Convert to seconds
            this.accumulator -= this.fixedDeltaTime
        }

        // Calculate interpolation alpha for smooth rendering
        const alpha = this.accumulator / this.fixedDeltaTime

        // Render with interpolation
        this.renderCallback(alpha)

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame(this.loop)
    }

    private updateFps(frameTime: number) {
        const currentFps = 1000 / frameTime
        this.fpsFrames.push(currentFps)

        if (this.fpsFrames.length > 60) {
            this.fpsFrames.shift()
        }

        const avgFps = this.fpsFrames.reduce((a, b) => a + b, 0) / this.fpsFrames.length
        this.currentFps = Math.round(avgFps)

        if (this.fpsCallback) {
            this.fpsCallback(this.currentFps)
        }
    }

    getFps(): number {
        return this.currentFps
    }

    isActive(): boolean {
        return this.isRunning
    }
}
