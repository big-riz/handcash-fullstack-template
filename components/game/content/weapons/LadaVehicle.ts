/**
 * LadaVehicle.ts
 * 
 * Lada Vehicle - A temporary power-up that drives through enemies.
 */

import * as THREE from 'three'
import { Player } from '../../entities/Player'
import { EntityManager } from '../../entities/EntityManager'
import { VFXManager } from '../../systems/VFXManager'
import { AudioManager } from '../../core/AudioManager'
import { loadWeaponModel, disposeWeaponModel, WEAPON_GLB_URLS } from '../../core/WeaponModelLoader'

export class LadaVehicle {
    public level = 1
    private model: THREE.Object3D | null = null
    private isActive = false
    public duration = 5
    private timer = 0
    private cooldown = 20
    private cooldownTimer = 0
    private lastRamTime = 0
    public variantId: string = 'lada'
    private glbLoaded = false

    // Stats
    public damage = 50
    public speed = 15

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        private audioManager: AudioManager | null = null
    ) { }

    private preloaded = false
    private ensurePreload() {
        if (this.preloaded) return
        this.preloaded = true
        const url = WEAPON_GLB_URLS[this.variantId]
        if (url) loadWeaponModel(url).catch(() => {})
    }

    update(deltaTime: number) {
        this.ensurePreload()
        if (this.isActive) {
            this.timer += deltaTime
            if (this.model) {
                this.model.position.copy(this.player.position)
                this.model.position.y = 0.5

                if (this.player.velocity.length() > 0.1) {
                    this.model.rotation.y = Math.atan2(this.player.velocity.x, this.player.velocity.z)
                }

                for (const enemy of this.entityManager.enemies) {
                    if (enemy.isActive && enemy.position.distanceTo(this.model.position) < 2.5) {
                        enemy.takeDamage(this.damage, this.vfx)
                        if (this.timer - this.lastRamTime > 0.3) {
                            this.audioManager?.playVehicleRam();
                            this.lastRamTime = this.timer;
                        }
                        if (this.rng.next() < 0.1) {
                            this.vfx.createEmoji(enemy.position.x, enemy.position.z, '💥', 0.5)
                        }
                    }
                }
            }

            if (this.timer >= this.duration) {
                this.deactivate()
            }
        } else {
            this.cooldownTimer += deltaTime
            if (this.cooldownTimer >= this.cooldown) {
                this.activate()
            }
        }
    }

    private activate() {
        this.isActive = true
        this.timer = 0
        this.lastRamTime = 0

        this.audioManager?.playVehicleActivate();

        const url = WEAPON_GLB_URLS[this.variantId]
        if (url && !this.glbLoaded) {
            loadWeaponModel(url).then((m) => {
                if (!this.isActive) { disposeWeaponModel(m); return }
                this.glbLoaded = true
                this.model = m
                // Normalize to ~2.5 units long
                const box = new THREE.Box3().setFromObject(m)
                const size = box.getSize(new THREE.Vector3())
                const maxDim = Math.max(size.x, size.y, size.z)
                const s = 2.5 / (maxDim || 1)
                m.scale.setScalar(s)
                this.scene.add(m)
            }).catch(() => {
                this.createFallbackMesh()
            })
        } else if (this.glbLoaded && this.model) {
            this.model.visible = true
            this.scene.add(this.model)
        } else {
            this.createFallbackMesh()
        }

        if (this.vfx) {
            this.vfx.createEmoji(this.player.position.x, this.player.position.z, '🚗', 1.0)
        }
    }

    private createFallbackMesh() {
        const geo = new THREE.BoxGeometry(1.5, 0.8, 2.5)
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
        this.model = new THREE.Mesh(geo, mat)
        this.scene.add(this.model)
    }

    private deactivate() {
        this.isActive = false
        this.cooldownTimer = 0
        if (this.model) {
            this.scene.remove(this.model)
            if (!this.glbLoaded) {
                disposeWeaponModel(this.model)
                this.model = null
            } else {
                this.model.visible = false
            }
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.duration += 2
        if (this.level === 3) this.damage *= 1.5
        if (this.level === 4) this.cooldown -= 5
        if (this.level === 5) {
            this.duration += 3
            this.damage *= 2
        }
    }

    cleanup() {
        this.isActive = false
        this.cooldownTimer = 0
        if (this.model) {
            this.scene.remove(this.model)
            disposeWeaponModel(this.model)
            this.model = null
            this.glbLoaded = false
        }
    }
}
