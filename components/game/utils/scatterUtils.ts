import * as THREE from 'three'
import { SeededRandom } from '@/lib/SeededRandom'

/**
 * Procedurally generates a mesh/group for a specific scatter type.
 * Returns a THREE.Group containing the generated geometry.
 */
export function generateScatterObject(type: string, seed: number): THREE.Object3D {
    const rng = new SeededRandom(seed.toString())
    const group = new THREE.Group()

    switch (type) {
        case 'grass':
            // Grass: Clump of 3-5 blades
            const bladeCount = 3 + Math.floor(rng.next() * 3)
            const grassMat = new THREE.MeshStandardMaterial({ 
                color: 0x4a7c3e, 
                roughness: 1.0,
                side: THREE.DoubleSide
            })
            
            for (let i = 0; i < bladeCount; i++) {
                // Blade is a simple tapered plane/cone
                const height = 0.3 + rng.next() * 0.3
                const width = 0.05 + rng.next() * 0.05
                const geo = new THREE.ConeGeometry(width, height, 3)
                // Flatten to look like a blade
                geo.scale(1, 1, 0.1)
                
                const blade = new THREE.Mesh(geo, grassMat)
                blade.position.x = (rng.next() - 0.5) * 0.2
                blade.position.z = (rng.next() - 0.5) * 0.2
                blade.position.y = height / 2
                
                // Random rotation
                blade.rotation.y = rng.next() * Math.PI * 2
                // Lean
                blade.rotation.x = (rng.next() - 0.5) * 0.5
                blade.rotation.z = (rng.next() - 0.5) * 0.5
                
                blade.castShadow = true
                blade.receiveShadow = true
                group.add(blade)
            }
            break

        case 'flowers':
            // Flower: Stem + Petals
            const stemHeight = 0.3 + rng.next() * 0.2
            const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, stemHeight, 4)
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32 })
            const stem = new THREE.Mesh(stemGeo, stemMat)
            stem.position.y = stemHeight / 2
            stem.castShadow = true
            group.add(stem)

            // Flower head
            const petalColor = new THREE.Color().setHSL(rng.next(), 0.8, 0.6)
            const headGeo = new THREE.DodecahedronGeometry(0.1, 0)
            const headMat = new THREE.MeshStandardMaterial({ color: petalColor })
            const head = new THREE.Mesh(headGeo, headMat)
            head.position.y = stemHeight
            head.scale.set(1, 0.5, 1) // Flattened
            head.castShadow = true
            group.add(head)
            break

        case 'stones':
            // Stone: Low poly rock
            const size = 0.2 + rng.next() * 0.3
            const rockGeo = new THREE.DodecahedronGeometry(size, 0)
            const rockMat = new THREE.MeshStandardMaterial({ 
                color: 0x888888, 
                roughness: 0.9, 
                flatShading: true 
            })
            const rock = new THREE.Mesh(rockGeo, rockMat)
            
            // Random distortion
            rock.scale.set(
                1 + (rng.next() - 0.5) * 0.4,
                0.6 + (rng.next() - 0.5) * 0.4, // Flatter
                1 + (rng.next() - 0.5) * 0.4
            )
            rock.position.y = (size * rock.scale.y) / 2 - 0.05 // Embed slightly
            rock.rotation.set(rng.next() * Math.PI, rng.next() * Math.PI, rng.next() * Math.PI)
            rock.castShadow = true
            rock.receiveShadow = true
            group.add(rock)
            break

        case 'mushrooms':
            // Mushroom: Stem + Cap
            const mushHeight = 0.2 + rng.next() * 0.2
            const mushStemGeo = new THREE.CylinderGeometry(0.04, 0.06, mushHeight, 5)
            const mushStemMat = new THREE.MeshStandardMaterial({ color: 0xececec })
            const mushStem = new THREE.Mesh(mushStemGeo, mushStemMat)
            mushStem.position.y = mushHeight / 2
            mushStem.castShadow = true
            group.add(mushStem)

            const capWidth = 0.15 + rng.next() * 0.1
            const capGeo = new THREE.ConeGeometry(capWidth, capWidth * 0.8, 6)
            const capColor = rng.next() > 0.5 ? 0xff4444 : 0x8d6e63 // Red or Brown
            const capMat = new THREE.MeshStandardMaterial({ color: capColor })
            const cap = new THREE.Mesh(capGeo, capMat)
            cap.position.y = mushHeight + (capWidth * 0.2)
            cap.castShadow = true
            group.add(cap)
            
            // White dots for red mushrooms
            if (capColor === 0xff4444) {
                const dotGeo = new THREE.SphereGeometry(0.02, 4, 4)
                const dotMat = new THREE.MeshBasicMaterial({ color: 0xffffff })
                for(let i=0; i<3; i++) {
                    const dot = new THREE.Mesh(dotGeo, dotMat)
                    dot.position.y = mushHeight + (capWidth * 0.4)
                    dot.position.x = (rng.next() - 0.5) * capWidth * 0.8
                    dot.position.z = (rng.next() - 0.5) * capWidth * 0.8
                    group.add(dot)
                }
            }
            break

        case 'debris':
            // Debris: Broken planks / shards
            const pieceCount = 2 + Math.floor(rng.next() * 3)
            const debrisMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 1.0 })
            
            for (let i = 0; i < pieceCount; i++) {
                const dSize = 0.2 + rng.next() * 0.2
                const dGeo = new THREE.BoxGeometry(dSize, 0.05, 0.05)
                const debris = new THREE.Mesh(dGeo, debrisMat)
                debris.position.set(
                    (rng.next() - 0.5) * 0.5,
                    0.05,
                    (rng.next() - 0.5) * 0.5
                )
                debris.rotation.set(rng.next(), rng.next() * Math.PI, rng.next())
                debris.castShadow = true
                debris.receiveShadow = true
                group.add(debris)
            }
            break
            
        case 'foliage':
            // Bush: Collection of spheres
            const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 1 })
            const bushSize = 0.3 + rng.next() * 0.3
            const mainGeo = new THREE.IcosahedronGeometry(bushSize, 0)
            const mainBush = new THREE.Mesh(mainGeo, bushMat)
            mainBush.position.y = bushSize * 0.8
            mainBush.castShadow = true
            mainBush.receiveShadow = true
            group.add(mainBush)
            
            // Add smaller lumps
            for(let i=0; i<3; i++) {
                const s = bushSize * (0.3 + rng.next() * 0.4)
                const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), bushMat)
                lump.position.set(
                    (rng.next() - 0.5) * bushSize,
                    bushSize * 0.5 + (rng.next() * 0.3),
                    (rng.next() - 0.5) * bushSize
                )
                lump.castShadow = true
                group.add(lump)
            }
            break

        default:
            // Fallback sphere
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.2, 5, 5),
                new THREE.MeshStandardMaterial({ color: 0x999999 })
            )
            sphere.position.y = 0.2
            group.add(sphere)
    }

    return group
}
