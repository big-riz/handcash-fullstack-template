import * as THREE from 'three'
import { SeededRandom } from '@/lib/SeededRandom'

// --- Procedural canvas texture generators ---

function createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#8B6914'
    ctx.fillRect(0, 0, 64, 64)
    // Wood grain lines
    for (let i = 0; i < 20; i++) {
        const y = Math.random() * 64
        ctx.strokeStyle = `rgba(60, 40, 10, ${0.15 + Math.random() * 0.2})`
        ctx.lineWidth = 0.5 + Math.random() * 1.5
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(64, y + (Math.random() - 0.5) * 4)
        ctx.stroke()
    }
    // Knots
    for (let i = 0; i < 2; i++) {
        ctx.fillStyle = 'rgba(50, 30, 5, 0.3)'
        ctx.beginPath()
        ctx.arc(Math.random() * 64, Math.random() * 64, 2 + Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
}

function createBarkTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#5D4037'
    ctx.fillRect(0, 0, 64, 64)
    for (let i = 0; i < 30; i++) {
        const y = Math.random() * 64
        ctx.strokeStyle = `rgba(30, 20, 10, ${0.2 + Math.random() * 0.25})`
        ctx.lineWidth = 1 + Math.random() * 2
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.bezierCurveTo(16, y + (Math.random() - 0.5) * 8, 48, y + (Math.random() - 0.5) * 8, 64, y + (Math.random() - 0.5) * 6)
        ctx.stroke()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 2)
    return tex
}

function createStoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#777777'
    ctx.fillRect(0, 0, 128, 128)
    // Random stone shapes
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * 128
        const y = Math.random() * 128
        const w = 15 + Math.random() * 30
        const h = 10 + Math.random() * 20
        const shade = 100 + Math.floor(Math.random() * 50)
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade + 5})`
        ctx.fillRect(x, y, w, h)
        ctx.strokeStyle = 'rgba(40, 40, 40, 0.4)'
        ctx.lineWidth = 1
        ctx.strokeRect(x, y, w, h)
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 1)
    return tex
}

function createBrickTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    // Mortar background
    ctx.fillStyle = '#999999'
    ctx.fillRect(0, 0, 128, 128)
    // Brick rows
    const brickW = 30
    const brickH = 14
    const gap = 2
    for (let row = 0; row < 8; row++) {
        const offset = (row % 2 === 0) ? 0 : brickW / 2
        const y = row * (brickH + gap)
        for (let col = -1; col < 5; col++) {
            const x = col * (brickW + gap) + offset
            const r = 130 + Math.floor(Math.random() * 25)
            const g = 50 + Math.floor(Math.random() * 20)
            const b = 40 + Math.floor(Math.random() * 20)
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`
            ctx.fillRect(x, y, brickW, brickH)
        }
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 1)
    return tex
}

function createIronTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#444444'
    ctx.fillRect(0, 0, 32, 64)
    // Subtle vertical striations
    for (let i = 0; i < 10; i++) {
        const x = Math.random() * 32
        ctx.strokeStyle = `rgba(80, 80, 80, ${0.15 + Math.random() * 0.2})`
        ctx.lineWidth = 0.5 + Math.random()
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x + (Math.random() - 0.5) * 3, 64)
        ctx.stroke()
    }
    // Rust spots
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(120, 60, 20, ${0.1 + Math.random() * 0.15})`
        ctx.beginPath()
        ctx.arc(Math.random() * 32, Math.random() * 64, 1 + Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(1, 2)
    return tex
}

function createHedgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#2E7D32'
    ctx.fillRect(0, 0, 64, 64)
    // Leaf clusters
    for (let i = 0; i < 60; i++) {
        const x = Math.random() * 64
        const y = Math.random() * 64
        const g = 80 + Math.floor(Math.random() * 60)
        ctx.fillStyle = `rgb(${20 + Math.floor(Math.random() * 30)}, ${g}, ${15 + Math.floor(Math.random() * 20)})`
        ctx.beginPath()
        ctx.arc(x, y, 1.5 + Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
    }
    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2, 2)
    return tex
}

/**
 * Procedurally generates a mesh/group for a specific placement mesh type.
 * Returns a THREE.Group containing the generated geometry.
 */
export function generateMeshObject(type: string, seed: number = 0): THREE.Object3D {
    const rng = new SeededRandom(seed.toString())
    const group = new THREE.Group()

    switch (type) {
        case 'rock': {
            const size = 1.0
            const geo = new THREE.DodecahedronGeometry(size, 0)
            const mat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true })
            const rock = new THREE.Mesh(geo, mat)
            rock.scale.set(1.2, 0.8, 1.0)
            rock.position.y = 0.4
            rock.castShadow = true
            rock.receiveShadow = true
            group.add(rock)
            break
        }

        case 'tree': {
            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 6)
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1 })
            const trunk = new THREE.Mesh(trunkGeo, trunkMat)
            trunk.position.y = 0.75
            trunk.castShadow = true
            trunk.receiveShadow = true
            group.add(trunk)

            // Leaves (Cones)
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x4a7c3e, roughness: 0.8 })
            for (let i = 0; i < 3; i++) {
                const leavesGeo = new THREE.ConeGeometry(1.2 - i * 0.3, 1.5, 8)
                const leaves = new THREE.Mesh(leavesGeo, leavesMat)
                leaves.position.y = 1.5 + i * 0.8
                leaves.castShadow = true
                leaves.receiveShadow = true
                group.add(leaves)
            }
            break
        }

        case 'tree_dead': {
            const trunkGeo = new THREE.CylinderGeometry(0.15, 0.3, 2.5, 5)
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2d1b0d, roughness: 1 })
            const trunk = new THREE.Mesh(trunkGeo, trunkMat)
            trunk.position.y = 1.25
            trunk.rotation.z = 0.1
            trunk.castShadow = true
            trunk.receiveShadow = true
            group.add(trunk)
            
            // Add a few branches
            for(let i=0; i<3; i++) {
                const bGeo = new THREE.CylinderGeometry(0.05, 0.1, 1.0, 4)
                const branch = new THREE.Mesh(bGeo, trunkMat)
                branch.position.y = 1.0 + i * 0.5
                branch.position.x = (i % 2 === 0 ? 0.3 : -0.3)
                branch.rotation.z = (i % 2 === 0 ? 0.8 : -0.8)
                branch.castShadow = true
                group.add(branch)
            }
            break
        }

        case 'shrub': {
            const bushMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 1 })
            for(let i=0; i<5; i++) {
                const s = 0.4 + rng.next() * 0.4
                const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), bushMat)
                lump.position.set(
                    (rng.next() - 0.5) * 0.8,
                    s * 0.5,
                    (rng.next() - 0.5) * 0.8
                )
                lump.castShadow = true
                lump.receiveShadow = true
                group.add(lump)
            }
            break
        }

        case 'crystal': {
            const crystalGeo = new THREE.OctahedronGeometry(0.6, 0)
            const crystalMat = new THREE.MeshStandardMaterial({ 
                color: 0x00ffff, 
                emissive: 0x00ffff, 
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9,
                roughness: 0.1
            })
            const crystal = new THREE.Mesh(crystalGeo, crystalMat)
            crystal.position.y = 0.6
            crystal.scale.set(0.6, 1.2, 0.6)
            crystal.castShadow = true
            group.add(crystal)
            
            // Smaller side crystals
            for(let i=0; i<3; i++) {
                const side = crystal.clone()
                side.scale.set(0.3, 0.6, 0.3)
                side.position.set(
                    Math.cos(i * 2) * 0.4,
                    0.3,
                    Math.sin(i * 2) * 0.4
                )
                side.rotation.x = 0.5
                group.add(side)
            }
            break
        }

        case 'crate': {
            const geo = new THREE.BoxGeometry(1.2, 1.2, 1.2)
            const mat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 })
            const crate = new THREE.Mesh(geo, mat)
            crate.position.y = 0.6
            crate.castShadow = true
            crate.receiveShadow = true
            group.add(crate)
            
            // Add bands
            const bandGeo = new THREE.BoxGeometry(1.25, 0.1, 1.25)
            const bandMat = new THREE.MeshStandardMaterial({ color: 0x5d4037 })
            const band1 = new THREE.Mesh(bandGeo, bandMat)
            band1.position.y = 0.9
            group.add(band1)
            const band2 = new THREE.Mesh(bandGeo, bandMat)
            band2.position.y = 0.3
            group.add(band2)
            break
        }

        case 'barrel': {
            const geo = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 12)
            const mat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 })
            const barrel = new THREE.Mesh(geo, mat)
            barrel.position.y = 0.6
            barrel.castShadow = true
            barrel.receiveShadow = true
            group.add(barrel)
            
            // Rings
            const ringGeo = new THREE.CylinderGeometry(0.61, 0.61, 0.1, 12, 1, true)
            const ringMat = new THREE.MeshStandardMaterial({ color: 0x333333 })
            const ring1 = new THREE.Mesh(ringGeo, ringMat)
            ring1.position.y = 0.9
            group.add(ring1)
            const ring2 = new THREE.Mesh(ringGeo, ringMat)
            ring2.position.y = 0.3
            group.add(ring2)
            break
        }

        case 'wall': {
            const geo = new THREE.BoxGeometry(4, 2, 0.8)
            const mat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.9 })
            const wall = new THREE.Mesh(geo, mat)
            wall.position.y = 1.0
            wall.castShadow = true
            wall.receiveShadow = true
            group.add(wall)
            break
        }

        case 'fence': {
            const mat = new THREE.MeshStandardMaterial({ color: 0x795548 })
            // Posts
            for(let i=0; i<2; i++) {
                const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), mat)
                post.position.set(i === 0 ? -1.8 : 1.8, 0.6, 0)
                post.castShadow = true
                group.add(post)
            }
            // Rails
            for(let i=0; i<2; i++) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 0.1), mat)
                rail.position.set(0, i === 0 ? 0.4 : 0.9, 0)
                rail.castShadow = true
                group.add(rail)
            }
            break
        }

        case 'pillar': {
            const baseGeo = new THREE.BoxGeometry(1.2, 0.4, 1.2)
            const mat = new THREE.MeshStandardMaterial({ color: 0x999999 })
            const base = new THREE.Mesh(baseGeo, mat)
            base.position.y = 0.2
            base.castShadow = true
            base.receiveShadow = true
            group.add(base)
            
            const columnGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 12)
            const column = new THREE.Mesh(columnGeo, mat)
            column.position.y = 1.9
            column.castShadow = true
            column.receiveShadow = true
            group.add(column)
            
            const top = base.clone()
            top.position.y = 3.6
            group.add(top)
            break
        }

        case 'pillar_broken': {
            const mat = new THREE.MeshStandardMaterial({ color: 0x888888 })
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), mat)
            base.position.y = 0.2
            base.castShadow = true
            base.receiveShadow = true
            group.add(base)
            
            const column = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 12), mat)
            column.position.y = 1.0
            column.rotation.x = 0.1
            column.castShadow = true
            group.add(column)
            break
        }

        case 'ruins_brick': {
            const mat = new THREE.MeshStandardMaterial({ color: 0x7b1f1f })
            for(let i=0; i<8; i++) {
                const brick = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), mat)
                brick.position.set(
                    (rng.next() - 0.5) * 1.0,
                    0.1 + rng.next() * 0.4,
                    (rng.next() - 0.5) * 1.0
                )
                brick.rotation.set(rng.next(), rng.next() * Math.PI, rng.next())
                brick.castShadow = true
                group.add(brick)
            }
            break
        }

        case 'statue': {
            const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
            const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 1.5), mat)
            base.position.y = 0.25
            base.castShadow = true
            group.add(base)
            
            const mid = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.5, 1.0), mat)
            mid.position.y = 1.25
            mid.castShadow = true
            group.add(mid)
            
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), mat)
            head.position.y = 2.4
            head.castShadow = true
            group.add(head)
            break
        }

        case 'well': {
            const mat = new THREE.MeshStandardMaterial({ color: 0x555555 })
            const geo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 12, 1, true)
            const wall = new THREE.Mesh(geo, mat)
            wall.position.y = 0.4
            wall.castShadow = true
            group.add(wall)
            
            const waterGeo = new THREE.CircleGeometry(1.1, 12)
            const waterMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x001144 })
            const water = new THREE.Mesh(waterGeo, waterMat)
            water.rotation.x = -Math.PI / 2
            water.position.y = 0.3
            group.add(water)
            break
        }

        case 'fence_wood': {
            const woodTex = createWoodTexture()
            const mat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9, map: woodTex })
            const postMat = new THREE.MeshStandardMaterial({ color: 0x7A5C12, roughness: 0.95, map: woodTex })
            // Post at origin
            const post = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.2, 0.15), postMat)
            post.position.y = 0.6
            post.castShadow = true
            group.add(post)
            // Two horizontal rails along Z
            for (let i = 0; i < 2; i++) {
                const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 2.0), mat)
                rail.position.set(0, i === 0 ? 0.4 : 0.9, 0)
                rail.castShadow = true
                group.add(rail)
            }
            break
        }

        case 'fence_iron': {
            const ironTex = createIronTexture()
            const ironMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.8, map: ironTex })
            // Post
            const ironPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), ironMat)
            ironPost.position.y = 0.7
            ironPost.castShadow = true
            group.add(ironPost)
            // Top finial (spear point)
            const finial = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.15, 4), ironMat)
            finial.position.set(0, 1.47, 0)
            finial.castShadow = true
            group.add(finial)
            // Horizontal bars (top + bottom)
            for (const yPos of [0.3, 1.2]) {
                const bar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 2.0), ironMat)
                bar.position.set(0, yPos, 0)
                bar.castShadow = true
                group.add(bar)
            }
            // Vertical pickets with pointed tips
            for (let i = -3; i <= 3; i++) {
                const picket = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 0.04), ironMat)
                picket.position.set(0, 0.5, i * 0.28)
                picket.castShadow = true
                group.add(picket)
                const tip = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), ironMat)
                tip.position.set(0, 1.06, i * 0.28)
                group.add(tip)
            }
            break
        }

        case 'wall_stone': {
            const stoneTex = createStoneTexture()
            const stoneMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.95, flatShading: true, map: stoneTex })
            // Main wall body along Z
            const wallBody = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.5, 2.0), stoneMat)
            wallBody.position.y = 0.75
            wallBody.castShadow = true
            wallBody.receiveShadow = true
            group.add(wallBody)
            // Cap stones on top
            const capMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.9, flatShading: true })
            for (let i = 0; i < 4; i++) {
                const cap = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), capMat)
                cap.position.set(
                    (rng.next() - 0.5) * 0.15,
                    1.45 + rng.next() * 0.1,
                    -0.75 + i * 0.5
                )
                cap.castShadow = true
                group.add(cap)
            }
            // Protruding stones
            for (let i = 0; i < 5; i++) {
                const bump = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + rng.next() * 0.08, 0), stoneMat)
                bump.position.set(
                    (rng.next() > 0.5 ? 0.3 : -0.3),
                    0.3 + rng.next() * 0.9,
                    (rng.next() - 0.5) * 0.9
                )
                bump.castShadow = true
                group.add(bump)
            }
            break
        }

        case 'wall_brick': {
            const brickTex = createBrickTexture()
            const brickMat = new THREE.MeshStandardMaterial({ color: 0xAA5544, roughness: 0.85, map: brickTex })
            const mortarMat = new THREE.MeshStandardMaterial({ color: 0x999999, roughness: 1.0 })
            // Base mortar body
            const brickBody = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 2.0), mortarMat)
            brickBody.position.y = 0.7
            brickBody.receiveShadow = true
            group.add(brickBody)
            // Brick rows
            for (let row = 0; row < 5; row++) {
                for (let col = 0; col < 4; col++) {
                    const offset = (row % 2 === 0) ? 0 : 0.25
                    const brick = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.22, 0.45), brickMat)
                    brick.position.set(0, 0.15 + row * 0.28, -0.75 + col * 0.5 + offset)
                    brick.castShadow = true
                    group.add(brick)
                }
            }
            // Top cap row
            const capMat = new THREE.MeshStandardMaterial({ color: 0x8B3A3A, roughness: 0.9 })
            for (let col = 0; col < 4; col++) {
                const cap = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.48), capMat)
                cap.position.set(0, 1.42, -0.75 + col * 0.5)
                group.add(cap)
            }
            break
        }

        case 'hedge_row': {
            const hedgeTex = createHedgeTexture()
            const hedgeMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.9, map: hedgeTex })
            const darkHedge = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.95, map: hedgeTex })
            // Main hedge box along Z
            const hedgeBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 2.0), hedgeMat)
            hedgeBody.position.y = 0.6
            hedgeBody.castShadow = true
            hedgeBody.receiveShadow = true
            group.add(hedgeBody)
            // Bumpy sides and top
            for (let i = 0; i < 8; i++) {
                const s = 0.18 + rng.next() * 0.12
                const lump = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), i % 2 === 0 ? hedgeMat : darkHedge)
                const side = rng.next() > 0.5
                lump.position.set(
                    side ? ((rng.next() > 0.5 ? 0.4 : -0.4)) : (rng.next() - 0.5) * 0.3,
                    side ? (0.3 + rng.next() * 0.7) : (1.1 + rng.next() * 0.15),
                    -0.8 + (i / 8) * 1.6
                )
                lump.castShadow = true
                group.add(lump)
            }
            break
        }

        case 'log_fence': {
            const barkTex = createBarkTexture()
            const logMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 1.0, map: barkTex })
            // Two upright log posts (slightly irregular)
            for (let i = -1; i <= 1; i += 2) {
                const topR = 0.08 + rng.next() * 0.04
                const logPost = new THREE.Mesh(new THREE.CylinderGeometry(topR, 0.12, 1.2, 6), logMat)
                logPost.position.set(0, 0.6, i * 0.8)
                logPost.rotation.z = (rng.next() - 0.5) * 0.05
                logPost.castShadow = true
                group.add(logPost)
            }
            // Two horizontal logs
            for (let i = 0; i < 2; i++) {
                const hLog = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.0, 6), logMat)
                hLog.rotation.x = Math.PI / 2
                hLog.position.set(0, i === 0 ? 0.35 : 0.8, 0)
                hLog.rotation.z = (rng.next() - 0.5) * 0.03
                hLog.castShadow = true
                group.add(hLog)
            }
            break
        }

        default: {
            const geo = new THREE.BoxGeometry(1, 1, 1)
            const mat = new THREE.MeshStandardMaterial({ color: 0x999999 })
            const box = new THREE.Mesh(geo, mat)
            box.position.y = 0.5
            box.castShadow = true
            group.add(box)
            break
        }
    }

    return group
}

/**
 * Formation definitions — composite objects built from multiple mesh types.
 * Each formation is a function that returns a THREE.Group with deterministic placement.
 */

export interface FormationPiece {
    type: string
    offsetX: number
    offsetZ: number
    scale: number
    rotationY: number
}

export interface FormationResult {
    group: THREE.Group
    pieces: FormationPiece[] // local-space offsets for per-piece collision
}

export type FormationFactory = (rng: SeededRandom, seed: number) => FormationResult

function buildFormation(pieces: FormationPiece[], rng: SeededRandom, seed: number): FormationResult {
    const group = new THREE.Group()
    for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i]
        const obj = generateMeshObject(p.type, seed * 1000 + i)
        obj.position.set(p.offsetX, 0, p.offsetZ)
        obj.scale.multiplyScalar(p.scale)
        obj.rotation.y = p.rotationY
        group.add(obj)
    }
    return { group, pieces }
}

const FORMATION_FACTORIES: Record<string, FormationFactory> = {
    // Dense tree cluster — a copse of trees with undergrowth
    tree_copse: (rng, seed) => {
        const pieces: FormationPiece[] = []
        const count = 4 + Math.floor(rng.next() * 3)
        for (let i = 0; i < count; i++) {
            const angle = rng.next() * Math.PI * 2
            const dist = 0.5 + rng.next() * 2.5
            pieces.push({
                type: rng.next() > 0.3 ? 'tree' : 'tree_dead',
                offsetX: Math.cos(angle) * dist,
                offsetZ: Math.sin(angle) * dist,
                scale: 0.6 + rng.next() * 1.4,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        // Fill gaps with shrubs
        for (let i = 0; i < 3; i++) {
            const angle = rng.next() * Math.PI * 2
            const dist = rng.next() * 2.0
            pieces.push({
                type: 'shrub',
                offsetX: Math.cos(angle) * dist,
                offsetZ: Math.sin(angle) * dist,
                scale: 0.5 + rng.next() * 0.8,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        return buildFormation(pieces, rng, seed)
    },

    // Stone circle — ring of rocks with a pillar or statue center
    stone_circle: (rng, seed) => {
        const pieces: FormationPiece[] = []
        const count = 5 + Math.floor(rng.next() * 4)
        const radius = 2.5 + rng.next() * 1.5
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (rng.next() - 0.5) * 0.3
            pieces.push({
                type: rng.next() > 0.7 ? 'pillar_broken' : 'rock',
                offsetX: Math.cos(angle) * radius,
                offsetZ: Math.sin(angle) * radius,
                scale: 0.8 + rng.next() * 1.2,
                rotationY: angle + Math.PI,
            })
        }
        // Center piece
        pieces.push({
            type: rng.next() > 0.5 ? 'pillar' : 'statue',
            offsetX: (rng.next() - 0.5) * 0.4,
            offsetZ: (rng.next() - 0.5) * 0.4,
            scale: 1.0 + rng.next() * 0.8,
            rotationY: rng.next() * Math.PI * 2,
        })
        return buildFormation(pieces, rng, seed)
    },

    // Ruined wall segment — crumbling wall with rubble
    ruined_wall: (rng, seed) => {
        const pieces: FormationPiece[] = []
        const segments = 2 + Math.floor(rng.next() * 3)
        const wallType = rng.next() > 0.5 ? 'wall_stone' : 'wall_brick'
        for (let i = 0; i < segments; i++) {
            pieces.push({
                type: wallType,
                offsetX: 0,
                offsetZ: -2 + i * 2.2,
                scale: 0.8 + rng.next() * 0.6,
                rotationY: (rng.next() - 0.5) * 0.15,
            })
        }
        // Scatter rubble around
        for (let i = 0; i < 4; i++) {
            pieces.push({
                type: rng.next() > 0.5 ? 'ruins_brick' : 'rock',
                offsetX: (rng.next() - 0.5) * 3.0,
                offsetZ: (rng.next() - 0.5) * (segments * 2),
                scale: 0.4 + rng.next() * 0.6,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        return buildFormation(pieces, rng, seed)
    },

    // Crystal cluster — big crystal surrounded by smaller ones
    crystal_cluster: (rng, seed) => {
        const pieces: FormationPiece[] = []
        // Central large crystal
        pieces.push({
            type: 'crystal',
            offsetX: 0,
            offsetZ: 0,
            scale: 1.5 + rng.next() * 1.5,
            rotationY: rng.next() * Math.PI * 2,
        })
        // Surrounding crystals
        const count = 4 + Math.floor(rng.next() * 4)
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + (rng.next() - 0.5) * 0.5
            const dist = 1.0 + rng.next() * 1.5
            pieces.push({
                type: 'crystal',
                offsetX: Math.cos(angle) * dist,
                offsetZ: Math.sin(angle) * dist,
                scale: 0.3 + rng.next() * 0.7,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        // A few rocks at the base
        for (let i = 0; i < 2; i++) {
            const angle = rng.next() * Math.PI * 2
            pieces.push({
                type: 'rock',
                offsetX: Math.cos(angle) * (1.5 + rng.next()),
                offsetZ: Math.sin(angle) * (1.5 + rng.next()),
                scale: 0.4 + rng.next() * 0.5,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        return buildFormation(pieces, rng, seed)
    },

    // Graveyard cluster — pillars/statues with scattered ruins
    graveyard: (rng, seed) => {
        const pieces: FormationPiece[] = []
        const rows = 2 + Math.floor(rng.next() * 2)
        const cols = 2 + Math.floor(rng.next() * 2)
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const types = ['pillar_broken', 'pillar', 'statue', 'rock']
                pieces.push({
                    type: types[Math.floor(rng.next() * types.length)],
                    offsetX: (r - (rows - 1) / 2) * (1.8 + rng.next() * 0.5),
                    offsetZ: (c - (cols - 1) / 2) * (1.8 + rng.next() * 0.5),
                    scale: 0.6 + rng.next() * 0.8,
                    rotationY: rng.next() * Math.PI * 2,
                })
            }
        }
        // Scattered rubble
        for (let i = 0; i < 3; i++) {
            pieces.push({
                type: 'ruins_brick',
                offsetX: (rng.next() - 0.5) * 4,
                offsetZ: (rng.next() - 0.5) * 4,
                scale: 0.5 + rng.next() * 0.5,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        return buildFormation(pieces, rng, seed)
    },

    // Temple ruins — rectangular pillar grid with crumbled walls, rubble, and a central statue
    temple_ruins: (rng, seed) => {
        const pieces: FormationPiece[] = []
        // Determine temple size
        const rows = 2 + Math.floor(rng.next() * 2) // 2-3 rows
        const cols = 3 + Math.floor(rng.next() * 3) // 3-5 cols
        const spacingX = 2.5 + rng.next() * 0.5
        const spacingZ = 2.5 + rng.next() * 0.5
        const halfW = ((cols - 1) * spacingZ) / 2
        const halfD = ((rows - 1) * spacingX) / 2

        // Pillar grid — some intact, some broken
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Skip interior pillars (only perimeter)
                if (r > 0 && r < rows - 1 && c > 0 && c < cols - 1) continue
                const intact = rng.next() > 0.4
                pieces.push({
                    type: intact ? 'pillar' : 'pillar_broken',
                    offsetX: r * spacingX - halfD,
                    offsetZ: c * spacingZ - halfW,
                    scale: 0.9 + rng.next() * 0.5,
                    rotationY: (rng.next() - 0.5) * 0.2,
                })
            }
        }

        // Partial walls between some pillars
        const wallCount = 1 + Math.floor(rng.next() * 3)
        for (let i = 0; i < wallCount; i++) {
            const side = Math.floor(rng.next() * 4) // 0=front, 1=back, 2=left, 3=right
            let wx: number, wz: number, ry: number
            if (side < 2) {
                // Front or back wall
                wx = side === 0 ? -halfD : halfD
                wz = (rng.next() - 0.5) * halfW
                ry = 0
            } else {
                // Left or right wall
                wx = (rng.next() - 0.5) * halfD
                wz = side === 2 ? -halfW : halfW
                ry = Math.PI / 2
            }
            pieces.push({
                type: rng.next() > 0.5 ? 'wall_stone' : 'wall_brick',
                offsetX: wx,
                offsetZ: wz,
                scale: 0.7 + rng.next() * 0.5,
                rotationY: ry + (rng.next() - 0.5) * 0.15,
            })
        }

        // Central altar / statue
        pieces.push({
            type: rng.next() > 0.4 ? 'statue' : 'pillar',
            offsetX: (rng.next() - 0.5) * 0.6,
            offsetZ: (rng.next() - 0.5) * 0.6,
            scale: 1.2 + rng.next() * 0.6,
            rotationY: rng.next() * Math.PI * 2,
        })

        // Scattered rubble inside and around
        const rubbleCount = 4 + Math.floor(rng.next() * 4)
        for (let i = 0; i < rubbleCount; i++) {
            pieces.push({
                type: rng.next() > 0.5 ? 'ruins_brick' : 'rock',
                offsetX: (rng.next() - 0.5) * (halfD * 2 + 2),
                offsetZ: (rng.next() - 0.5) * (halfW * 2 + 2),
                scale: 0.3 + rng.next() * 0.6,
                rotationY: rng.next() * Math.PI * 2,
            })
        }

        // Optional steps / platform base (flat rock at ground level)
        if (rng.next() > 0.4) {
            pieces.push({
                type: 'rock',
                offsetX: -halfD - 1.5,
                offsetZ: 0,
                scale: 0.4 + rng.next() * 0.3,
                rotationY: 0,
            })
        }

        return buildFormation(pieces, rng, seed)
    },

    // Rocky outcrop — large boulder surrounded by smaller rocks
    rocky_outcrop: (rng, seed) => {
        const pieces: FormationPiece[] = []
        // Big central rock
        pieces.push({
            type: 'rock',
            offsetX: 0,
            offsetZ: 0,
            scale: 2.0 + rng.next() * 2.0,
            rotationY: rng.next() * Math.PI * 2,
        })
        // Surrounding smaller rocks
        const count = 4 + Math.floor(rng.next() * 5)
        for (let i = 0; i < count; i++) {
            const angle = rng.next() * Math.PI * 2
            const dist = 1.5 + rng.next() * 2.0
            pieces.push({
                type: 'rock',
                offsetX: Math.cos(angle) * dist,
                offsetZ: Math.sin(angle) * dist,
                scale: 0.3 + rng.next() * 1.0,
                rotationY: rng.next() * Math.PI * 2,
            })
        }
        return buildFormation(pieces, rng, seed)
    },
}

/**
 * Generate a formation by name. Returns null if formation type not found.
 */
export function generateFormation(formationType: string, seed: number): FormationResult | null {
    const factory = FORMATION_FACTORIES[formationType]
    if (!factory) return null
    const rng = new SeededRandom(`formation_${formationType}_${seed}`)
    return factory(rng, seed)
}
