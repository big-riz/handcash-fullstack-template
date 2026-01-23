
import { SpawnSystem } from './SpawnSystem'
import { EntityManager } from '../entities/EntityManager'
import { VFXManager } from './VFXManager'
import { Player } from '../entities/Player'

export interface GameEvent {
    id: string
    name: string
    description: string
    startTime: number // seconds
    duration: number // seconds
    active: boolean
    onStart: (systems: SystemContext) => void
    onEnd: (systems: SystemContext) => void
    update?: (deltaTime: number, systems: SystemContext) => void
}

export interface SystemContext {
    spawnSystem: SpawnSystem
    entityManager: EntityManager
    vfxManager: VFXManager
    player: Player
}

export class EventSystem {
    private events: GameEvent[] = []
    private currentTime = 0

    constructor(private context: SystemContext) {
        this.setupEvents()
    }

    private setupEvents() {
        // Boss spawn is handled directly in SpawnSystem.ts
    }

    update(deltaTime: number) {
        this.currentTime += deltaTime

        for (const event of this.events) {
            const isActive = this.currentTime >= event.startTime && this.currentTime < (event.startTime + event.duration)

            if (isActive && !event.active) {
                event.active = true
                event.onStart(this.context)
            } else if (!isActive && event.active) {
                event.active = false
                event.onEnd(this.context)
            }

            if (event.active && event.update) {
                event.update(deltaTime, this.context)
            }
        }
    }

    getActiveEvents(): GameEvent[] {
        return this.events.filter(e => e.active)
    }
}
