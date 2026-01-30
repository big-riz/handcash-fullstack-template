/**
 * PropagandaTower.ts
 * 
 * A deployable structure that pulses, damaging and slowing nearby enemies.
 */

import * as THREE from 'three'
import { Player } from '../../entities/Player'
import { EntityManager } from '../../entities/EntityManager'
import { VFXManager } from '../../systems/VFXManager'
import { AudioManager } from '../../core/AudioManager'
import { loadWeaponModel, disposeWeaponModel, WEAPON_GLB_URLS } from '../../core/WeaponModelLoader'

export class PropagandaTower {
    public level = 1
    private cooldown = 5.0
    private timer = 0
    private activeTowers: THREE.Object3D[] = []
    private slowEffectQueue: { enemy: any; timer: number; amount: number }[] = []
    public variantId: string = 'propaganda_tower'

    // Stats
    public damage = 15
    private range = 4
    private duration = 12
    private slowAmount = 0.5

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
        this.timer += deltaTime
        if (this.timer >= (this.cooldown * this.player.stats.cooldownMultiplier)) {
            this.deploy()
            this.timer = 0
        }

        // Pulse logic for active towers
        for (let i = this.activeTowers.length - 1; i >= 0; i--) {
            const tower = this.activeTowers[i]
            const data = tower.userData
            data.age += deltaTime

            if (data.age >= this.duration) {
                this.scene.remove(tower)
                this.activeTowers.splice(i, 1)
                continue
            }

            // Pulse every 1s
            data.pulseTimer += deltaTime
            if (data.pulseTimer >= 1.0) {
                data.pulseTimer = 0
                this.pulse(tower)
            }

            // Visual rotation or scale pulse - using age instead of Date.now()
            tower.rotation.y += deltaTime * 2
            const s = 1 + Math.sin(data.age * 5) * 0.1
            tower.scale.set(s, s, s)
        }

        // Process slow effect removals
        for (let i = this.slowEffectQueue.length - 1; i >= 0; i--) {
            const effect = this.slowEffectQueue[i]
            effect.timer -= deltaTime
            if (effect.timer <= 0) {
                if (effect.enemy.isActive) {
                    effect.enemy.stats.moveSpeed /= (1 - effect.amount)
                }
                this.slowEffectQueue.splice(i, 1)
            }
        }
    }

    private deploy() {
        const px = this.player.position.x
        const pz = this.player.position.z

        const url = WEAPON_GLB_URLS[this.variantId]
        if (url) {
            loadWeaponModel(url).then((model) => {
                const box = new THREE.Box3().setFromObject(model)
                const size = box.getSize(new THREE.Vector3())
                const maxDim = Math.max(size.x, size.y, size.z)
                const s = 2.0 / (maxDim || 1)
                model.scale.setScalar(s)
                model.position.set(px, 0, pz)
                model.userData = { age: 0, pulseTimer: 0 }
                this.scene.add(model)
                this.activeTowers.push(model)
            }).catch(() => {
                this.deployFallback(px, pz)
            })
        } else {
            this.deployFallback(px, pz)
        }

        if (this.vfx) {
            this.vfx.createEmoji(px, pz, '🚩', 1.0)
        }
    }

    private deployFallback(px: number, pz: number) {
        const group = new THREE.Group()
        const baseGeo = new THREE.CylinderGeometry(0.3, 0.5, 1.5, 8)
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x444444 })
        const base = new THREE.Mesh(baseGeo, baseMat)
        base.position.y = 0.75
        group.add(base)
        const topGeo = new THREE.ConeGeometry(0.4, 0.8, 4)
        const topMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0x330000 })
        const top = new THREE.Mesh(topGeo, topMat)
        top.position.y = 1.6
        group.add(top)
        group.position.set(px, 0, pz)
        group.userData = { age: 0, pulseTimer: 0 }
        this.scene.add(group)
        this.activeTowers.push(group)
    }

    private pulse(tower: THREE.Object3D) {
        const effectiveRange = this.range * this.player.stats.areaMultiplier
        const effectiveDamage = this.damage * this.player.stats.damageMultiplier

        let hitAny = false;
        for (const enemy of this.entityManager.enemies) {
            if (enemy.isActive && enemy.position.distanceTo(tower.position) < effectiveRange) {
                hitAny = true;
                enemy.takeDamage(effectiveDamage, this.vfx)

                // Deterministic Slow using a queue instead of setTimeout
                const slowVal = this.slowAmount
                enemy.stats.moveSpeed *= (1 - slowVal)
                this.slowEffectQueue.push({
                    enemy: enemy,
                    timer: 0.8,
                    amount: slowVal
                })
            }
        }
        if (hitAny) {
            this.audioManager?.playAuraDamage();
        }
    }

    static getUpgradeDesc(level: number): string {
        switch (level) {
            case 1: return "Deploy stationary towers that damage and slow."
            case 2: return "Wider broadcasts (+20% range)."
            case 3: return "Powerful rhetoric (+30% damage)."
            case 4: return "Sturdier anchors (+4s duration)."
            case 5: return "Rapid deployment (+20% attack speed)."
            default: return ""
        }
    }

    upgrade() {
        this.level++
        if (this.level === 2) this.range *= 1.2
        else if (this.level === 3) this.damage *= 1.3
        else if (this.level === 4) this.duration += 4
        else if (this.level === 5) this.cooldown *= 0.8
    }

    cleanup() {
        for (const tower of this.activeTowers) {
            this.scene.remove(tower)
            disposeWeaponModel(tower)
        }
        this.activeTowers = []
    }
}
