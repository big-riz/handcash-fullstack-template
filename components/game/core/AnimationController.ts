/**
 * AnimationState - Defines a single animation state
 */
export interface AnimationState {
  name: string
  frames: number[]
  fps: number
  loop: boolean
  nextState?: string
}

/**
 * AnimationController - Manages frame-based animations for sprites
 */
export class AnimationController {
  private states: Map<string, AnimationState>
  private currentState: string
  private frameTime: number
  private currentFrameIndex: number
  private timeAccumulator: number

  constructor(states: Record<string, Omit<AnimationState, 'name'>>, initialState: string = 'idle') {
    this.states = new Map()

    // Convert states object to Map
    Object.entries(states).forEach(([name, state]) => {
      this.states.set(name, { name, ...state })
    })

    this.currentState = initialState
    this.currentFrameIndex = 0
    this.timeAccumulator = 0

    const state = this.states.get(initialState)
    this.frameTime = state ? 1 / state.fps : 0.1
  }

  /**
   * Set the current animation state
   * @param stateName Name of the state to transition to
   */
  setState(stateName: string): void {
    if (stateName === this.currentState) return

    const state = this.states.get(stateName)
    if (!state) {
      console.warn(`Animation state "${stateName}" not found`)
      return
    }

    this.currentState = stateName
    this.currentFrameIndex = 0
    this.timeAccumulator = 0
    this.frameTime = 1 / state.fps
  }

  /**
   * Update animation and return current frame number
   * @param deltaTime Time since last update in seconds
   * @returns Current frame number to display
   */
  update(deltaTime: number): number {
    const state = this.states.get(this.currentState)
    if (!state || state.frames.length === 0) {
      return 0
    }

    this.timeAccumulator += deltaTime

    // Advance frame if enough time has passed
    if (this.timeAccumulator >= this.frameTime) {
      this.timeAccumulator -= this.frameTime
      this.currentFrameIndex++

      // Handle end of animation
      if (this.currentFrameIndex >= state.frames.length) {
        if (state.loop) {
          this.currentFrameIndex = 0
        } else {
          this.currentFrameIndex = state.frames.length - 1

          // Transition to next state if defined
          if (state.nextState) {
            this.setState(state.nextState)
          }
        }
      }
    }

    return state.frames[this.currentFrameIndex]
  }

  /**
   * Get the current animation state name
   */
  getCurrentState(): string {
    return this.currentState
  }

  /**
   * Check if the current animation has finished (for non-looping animations)
   */
  isFinished(): boolean {
    const state = this.states.get(this.currentState)
    if (!state || state.loop) return false

    return this.currentFrameIndex >= state.frames.length - 1
  }
}
