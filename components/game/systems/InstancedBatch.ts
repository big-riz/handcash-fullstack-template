/**
 * InstancedBatch.ts
 *
 * Batches health bars, XP gems, and projectiles using InstancedMesh.
 * Reduces hundreds of individual draw calls down to a handful.
 *
 * Health bars: 400 → 2 draw calls
 * XP gems:     30 → 1 draw call
 * Projectiles: 50 → 1 draw call
 */

import * as THREE from 'three'

const _matrix = new THREE.Matrix4()
const _pos = new THREE.Vector3()
const _scale = new THREE.Vector3(1, 1, 1)
const _identityQuat = new THREE.Quaternion()
const _euler = new THREE.Euler()
const _quat = new THREE.Quaternion()
const _color = new THREE.Color()

// ─── Health Bars ────────────────────────────────────────────────────────────

export class InstancedHealthBars {
    private bgMesh: THREE.InstancedMesh
    private fillMesh: THREE.InstancedMesh
    private maxInstances: number

    constructor(scene: THREE.Scene, maxInstances = 600) {
        this.maxInstances = maxInstances

        const bgGeo = new THREE.PlaneGeometry(1, 0.08)
        bgGeo.rotateX(-Math.PI / 2)
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x222222,
            side: THREE.DoubleSide,
            depthTest: false,
        })
        this.bgMesh = new THREE.InstancedMesh(bgGeo, bgMat, maxInstances)
        this.bgMesh.renderOrder = 999
        this.bgMesh.frustumCulled = false
        this.bgMesh.count = 0
        scene.add(this.bgMesh)

        const fillGeo = new THREE.PlaneGeometry(1, 0.064)
        fillGeo.rotateX(-Math.PI / 2)
        const fillMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
            depthTest: false,
        })
        this.fillMesh = new THREE.InstancedMesh(fillGeo, fillMat, maxInstances)
        this.fillMesh.renderOrder = 1000
        this.fillMesh.frustumCulled = false
        this.fillMesh.count = 0
        scene.add(this.fillMesh)
    }

    updateBars(enemies: Array<{
        x: number; z: number; radius: number
        currentHp: number; maxHp: number
        isActive: boolean
    }>) {
        let count = 0

        for (const e of enemies) {
            if (!e.isActive) continue
            const hpPercent = e.currentHp / e.maxHp
            if (hpPercent >= 1) continue
            if (count >= this.maxInstances) break

            const barWidth = Math.max(0.4, e.radius * 1.5)
            const barY = e.radius * 2 + 0.4

            // Background bar
            _pos.set(e.x, barY, e.z)
            _scale.set(barWidth, 1, 1)
            _matrix.compose(_pos, _identityQuat, _scale)
            this.bgMesh.setMatrixAt(count, _matrix)

            // Fill bar
            const fillWidth = barWidth * hpPercent
            const fillOffset = -(barWidth * (1 - hpPercent)) / 2
            _pos.set(e.x + fillOffset, barY, e.z)
            _scale.set(fillWidth, 1, 1)
            _matrix.compose(_pos, _identityQuat, _scale)
            this.fillMesh.setMatrixAt(count, _matrix)

            // HP color: green → yellow → red
            if (hpPercent > 0.5) {
                const t = (hpPercent - 0.5) * 2
                _color.setRGB(1 - t, 1, 0)
            } else {
                const t = hpPercent * 2
                _color.setRGB(1, t, 0)
            }
            this.fillMesh.setColorAt(count, _color)

            count++
        }

        this.bgMesh.count = count
        this.fillMesh.count = count

        if (count > 0) {
            this.bgMesh.instanceMatrix.needsUpdate = true
            this.fillMesh.instanceMatrix.needsUpdate = true
            if (this.fillMesh.instanceColor) this.fillMesh.instanceColor.needsUpdate = true
        }
    }

    dispose() {
        this.bgMesh.geometry.dispose()
        ;(this.bgMesh.material as THREE.Material).dispose()
        this.bgMesh.removeFromParent()

        this.fillMesh.geometry.dispose()
        ;(this.fillMesh.material as THREE.Material).dispose()
        this.fillMesh.removeFromParent()
    }
}

// ─── XP Gems ────────────────────────────────────────────────────────────────

export class InstancedGems {
    private mesh: THREE.InstancedMesh
    private maxInstances: number

    constructor(scene: THREE.Scene, color: number, emissive: number, maxInstances = 200) {
        this.maxInstances = maxInstances

        const geometry = new THREE.IcosahedronGeometry(0.2, 1)
        const material = new THREE.MeshBasicMaterial({
            color: emissive,
            transparent: true,
            opacity: 0.95,
        })

        this.mesh = new THREE.InstancedMesh(geometry, material, maxInstances)
        this.mesh.frustumCulled = false
        this.mesh.renderOrder = 500
        this.mesh.count = 0
        scene.add(this.mesh)
    }

    updateGems(gems: Array<{ x: number; y: number; z: number; isActive: boolean }>) {
        let count = 0
        for (const g of gems) {
            if (!g.isActive) continue
            if (count >= this.maxInstances) break

            _pos.set(g.x, g.y, g.z)
            _scale.set(1, 1, 1)
            _matrix.compose(_pos, _identityQuat, _scale)
            this.mesh.setMatrixAt(count, _matrix)
            count++
        }

        this.mesh.count = count
        if (count > 0) {
            this.mesh.instanceMatrix.needsUpdate = true
        }
    }

    setColor(color: number, emissive: number) {
        const mat = this.mesh.material as THREE.MeshBasicMaterial
        mat.color.setHex(emissive)
    }

    dispose() {
        this.mesh.geometry.dispose()
        ;(this.mesh.material as THREE.Material).dispose()
        this.mesh.removeFromParent()
    }
}

// ─── Projectiles ────────────────────────────────────────────────────────────

export class InstancedProjectiles {
    private mesh: THREE.InstancedMesh
    private maxInstances: number

    constructor(scene: THREE.Scene, maxInstances = 300) {
        this.maxInstances = maxInstances

        const geometry = new THREE.ConeGeometry(0.2, 0.6, 8)
        geometry.rotateX(Math.PI / 2)
        const material = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.8,
            roughness: 0.2,
            emissive: 0xffffff,
            emissiveIntensity: 0.2,
        })

        this.mesh = new THREE.InstancedMesh(geometry, material, maxInstances)
        this.mesh.frustumCulled = false
        this.mesh.count = 0
        scene.add(this.mesh)
    }

    updateProjectiles(projectiles: Array<{
        x: number; z: number; vx: number; vz: number
        isActive: boolean
        isEnemy: boolean; appliesSlow: boolean; appliesCurse: boolean
    }>) {
        let count = 0
        for (const p of projectiles) {
            if (!p.isActive) continue
            if (count >= this.maxInstances) break

            const angle = Math.atan2(p.vx, p.vz)
            _pos.set(p.x, 0.5, p.z)
            _euler.set(0, angle, 0)
            _quat.setFromEuler(_euler)
            _scale.set(1, 1, 1)
            _matrix.compose(_pos, _quat, _scale)
            this.mesh.setMatrixAt(count, _matrix)

            if (p.appliesCurse) {
                _color.setHex(0x8800ff)
            } else if (p.appliesSlow) {
                _color.setHex(0x0066ff)
            } else if (p.isEnemy) {
                _color.setHex(0xff4444)
            } else {
                _color.setHex(0xcccccc)
            }
            this.mesh.setColorAt(count, _color)

            count++
        }

        this.mesh.count = count
        if (count > 0) {
            this.mesh.instanceMatrix.needsUpdate = true
            if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true
        }
    }

    dispose() {
        this.mesh.geometry.dispose()
        ;(this.mesh.material as THREE.Material).dispose()
        this.mesh.removeFromParent()
    }
}
