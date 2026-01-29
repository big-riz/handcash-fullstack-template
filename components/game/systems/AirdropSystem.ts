/**
 * AirdropSystem.ts
 *
 * Manages supply crate airdrops that fall from the sky.
 * - Activates after player reaches level 10
 * - Spawns airdrops every 60 seconds
 * - Airdrops fall for 5 seconds before landing
 * - Player collects by walking to the crate
 * - Grants a single upgrade choice on collection
 */

import * as THREE from 'three'
import { Airdrop } from '../entities/Airdrop'
import { Player } from '../entities/Player'
import { SeededRandom } from '@/lib/SeededRandom'

export interface AirdropData {
    x: number
    z: number
    fallTimer: number
    isFalling: boolean
}

export class AirdropSystem {
    private airdrops: Airdrop[] = []
    private inactiveAirdrops: Airdrop[] = []
    private timeSinceLastDrop: number = 0
    private isEnabled: boolean = false

    private config = {
        minLevel: 10,
        interval: 60, // seconds
        fallDuration: 5, // seconds
        spawnDistanceMin: 30,
        spawnDistanceMax: 50
    }

    private scene: THREE.Scene
    private player: Player
    private rng: SeededRandom

    private onCollect: ((airdrop: Airdrop) => void) | null = null

    constructor(scene: THREE.Scene, player: Player, rng: SeededRandom) {
        this.scene = scene
        this.player = player
        this.rng = rng
    }

    setCollectCallback(callback: (airdrop: Airdrop) => void): void {
        this.onCollect = callback
    }

    update(deltaTime: number, playerLevel: number): void {
        // Enable system when player reaches minimum level
        if (!this.isEnabled && playerLevel >= this.config.minLevel) {
            this.isEnabled = true
            this.timeSinceLastDrop = this.config.interval * 0.75 // First drop after 15 seconds
            console.log('[AirdropSystem] Enabled at level', playerLevel)
        }

        if (!this.isEnabled) return

        // Spawn timer
        this.timeSinceLastDrop += deltaTime
        if (this.timeSinceLastDrop >= this.config.interval) {
            this.timeSinceLastDrop = 0
            this.spawnAirdrop()
        }

        // Update all active airdrops
        for (const airdrop of this.airdrops) {
            if (airdrop.isActive) {
                airdrop.update(deltaTime)

                // Check collection
                if (!airdrop.isFalling && airdrop.isPlayerInRange(
                    this.player.position.x,
                    this.player.position.z,
                    this.player.radius
                )) {
                    this.collectAirdrop(airdrop)
                }
            } else {
                // Return to pool
                if (!this.inactiveAirdrops.includes(airdrop)) {
                    this.inactiveAirdrops.push(airdrop)
                }
            }
        }
    }

    spawnAirdrop(): Airdrop {
        // Get airdrop from pool or create new
        let airdrop = this.inactiveAirdrops.pop()
        if (!airdrop) {
            airdrop = new Airdrop()
            airdrop.createMesh(this.scene)
            this.airdrops.push(airdrop)
        }

        // Calculate spawn position
        const angle = this.rng.next() * Math.PI * 2
        const distance = this.config.spawnDistanceMin +
            this.rng.next() * (this.config.spawnDistanceMax - this.config.spawnDistanceMin)

        const x = this.player.position.x + Math.cos(angle) * distance
        const z = this.player.position.z + Math.sin(angle) * distance

        airdrop.spawn(x, z, this.config.fallDuration)

        console.log(`[AirdropSystem] Spawned airdrop at (${x.toFixed(1)}, ${z.toFixed(1)})`)
        return airdrop
    }

    private collectAirdrop(airdrop: Airdrop): void {
        console.log('[AirdropSystem] Airdrop collected!')
        airdrop.despawn()

        if (this.onCollect) {
            this.onCollect(airdrop)
        }
    }

    getActiveAirdrops(): AirdropData[] {
        const data: AirdropData[] = []
        for (const airdrop of this.airdrops) {
            if (airdrop.isActive) {
                data.push({
                    x: airdrop.position.x,
                    z: airdrop.position.z,
                    fallTimer: airdrop.fallTimer,
                    isFalling: airdrop.isFalling
                })
            }
        }
        return data
    }

    cleanup(): void {
        for (const airdrop of this.airdrops) {
            airdrop.dispose(this.scene)
        }
        this.airdrops = []
        this.inactiveAirdrops = []
        this.timeSinceLastDrop = 0
        this.isEnabled = false
    }
}
