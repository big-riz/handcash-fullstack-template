/**
 * Airdrop.ts
 *
 * Supply crate that falls from the sky and grants an upgrade when collected.
 * Spawns after level 10, every 60 seconds.
 */

import * as THREE from 'three'

export class Airdrop {
    position: THREE.Vector3
    currentY: number
    isActive: boolean = false
    isFalling: boolean = false
    fallTimer: number = 0
    fallDuration: number = 5.0
    collectionRadius: number = 2.0
    startY: number = 50

    mesh: THREE.Group | null = null
    parachuteMesh: THREE.Mesh | null = null

    private landedTime: number = 0
    private maxGroundTime: number = 30.0 // Despawn after 30s on ground
    private bobPhase: number = 0

    constructor() {
        this.position = new THREE.Vector3()
        this.currentY = this.startY
    }

    spawn(x: number, z: number, fallDuration: number = 5.0): void {
        this.position.set(x, 0, z)
        this.currentY = this.startY
        this.fallDuration = fallDuration
        this.fallTimer = fallDuration
        this.isActive = true
        this.isFalling = true
        this.landedTime = 0
        this.bobPhase = 0

        if (this.mesh) {
            this.mesh.position.set(x, this.currentY, z)
            this.mesh.visible = true
        }
        if (this.parachuteMesh) {
            this.parachuteMesh.visible = true
        }
    }

    update(deltaTime: number): boolean {
        if (!this.isActive) return false

        if (this.isFalling) {
            this.fallTimer -= deltaTime
            const progress = 1 - (this.fallTimer / this.fallDuration)
            // Ease-out for smooth landing
            const easeOut = 1 - Math.pow(1 - progress, 2)
            this.currentY = this.startY * (1 - easeOut)

            if (this.fallTimer <= 0) {
                this.isFalling = false
                this.currentY = 0.6 // Settle on ground (crate height / 2)
                if (this.parachuteMesh) {
                    this.parachuteMesh.visible = false
                }
                return true // Landed
            }
        } else {
            // Bob on ground
            this.landedTime += deltaTime
            this.bobPhase += deltaTime * 2
            const bob = Math.sin(this.bobPhase) * 0.1
            this.currentY = 0.6 + bob

            // Auto-despawn after max ground time
            if (this.landedTime >= this.maxGroundTime) {
                this.despawn()
                return false
            }
        }

        if (this.mesh) {
            this.mesh.position.set(this.position.x, this.currentY, this.position.z)

            // Spin slowly while falling
            if (this.isFalling) {
                this.mesh.rotation.y += deltaTime * 0.5
            }
        }

        return false
    }

    createMesh(scene: THREE.Scene): void {
        if (this.mesh) return

        this.mesh = new THREE.Group()

        // Main crate (scaled up from meshUtils crate)
        const crateGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4)
        const crateMat = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Gold color
            roughness: 0.6,
            metalness: 0.3,
            emissive: 0xffa000,
            emissiveIntensity: 0.3
        })
        const crate = new THREE.Mesh(crateGeo, crateMat)
        crate.position.y = 0
        crate.castShadow = true
        crate.receiveShadow = true
        this.mesh.add(crate)

        // Add bands like the original crate
        const bandGeo = new THREE.BoxGeometry(2.5, 0.2, 2.5)
        const bandMat = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.9 })
        const band1 = new THREE.Mesh(bandGeo, bandMat)
        band1.position.y = 0.8
        this.mesh.add(band1)
        const band2 = new THREE.Mesh(bandGeo, bandMat)
        band2.position.y = -0.8
        this.mesh.add(band2)

        // Star emblem on front
        const starGeo = new THREE.CircleGeometry(0.5, 5)
        const starMat = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            emissive: 0xffff00,
            emissiveIntensity: 0.5
        })
        const star = new THREE.Mesh(starGeo, starMat)
        star.position.set(0, 0, 1.21)
        this.mesh.add(star)

        // Parachute
        const parachuteGeo = new THREE.ConeGeometry(3, 2, 8, 1, true)
        const parachuteMat = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        })
        this.parachuteMesh = new THREE.Mesh(parachuteGeo, parachuteMat)
        this.parachuteMesh.position.y = 4
        this.parachuteMesh.rotation.x = Math.PI
        this.mesh.add(this.parachuteMesh)

        // Parachute strings
        const stringMat = new THREE.LineBasicMaterial({ color: 0x444444 })
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2
            const points = [
                new THREE.Vector3(Math.cos(angle) * 0.3, 1.2, Math.sin(angle) * 0.3),
                new THREE.Vector3(Math.cos(angle) * 2.8, 4, Math.sin(angle) * 2.8)
            ]
            const stringGeo = new THREE.BufferGeometry().setFromPoints(points)
            const string = new THREE.Line(stringGeo, stringMat)
            this.mesh.add(string)
        }

        this.mesh.visible = false
        scene.add(this.mesh)
    }

    despawn(): void {
        this.isActive = false
        this.isFalling = false
        if (this.mesh) {
            this.mesh.visible = false
        }
    }

    isPlayerInRange(playerX: number, playerZ: number, playerRadius: number = 0.5): boolean {
        if (!this.isActive || this.isFalling) return false

        const dx = this.position.x - playerX
        const dz = this.position.z - playerZ
        const dist = Math.sqrt(dx * dx + dz * dz)
        return dist < (this.collectionRadius + playerRadius)
    }

    dispose(scene: THREE.Scene): void {
        if (this.mesh) {
            scene.remove(this.mesh)
            this.mesh.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.geometry.dispose()
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose()
                    }
                }
            })
            this.mesh = null
        }
        this.parachuteMesh = null
    }
}
