import { SimplexNoise2D } from './SimplexNoise'
import { GroundTextureConfig, GroundTexturePreset } from '../data/worlds'

function hexToRGB(hex: number): [number, number, number] {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]
}

function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
}

function smoothstep(edge0: number, edge1: number, x: number): number {
    const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
    return t * t * (3 - 2 * t)
}

function fbm(noise: SimplexNoise2D, x: number, y: number, octaves: number, lacunarity: number, persistence: number): number {
    let value = 0
    let amplitude = 1
    let frequency = 1
    let maxAmp = 0
    for (let i = 0; i < octaves; i++) {
        value += noise.noise2D(x * frequency, y * frequency) * amplitude
        maxAmp += amplitude
        amplitude *= persistence
        frequency *= lacunarity
    }
    return value / maxAmp // normalized to [-1, 1]
}

// Seamless tileable FBM using 4-corner blend: samples noise at (u,v) plus
// three offset copies, then bilinearly blends based on position within tile
function fbmSeamless(
    noise: SimplexNoise2D, u: number, v: number, scale: number,
    octaves: number, lacunarity: number, persistence: number
): number {
    const sx = u * scale
    const sy = v * scale
    const n00 = fbm(noise, sx, sy, octaves, lacunarity, persistence)
    const n10 = fbm(noise, sx - scale, sy, octaves, lacunarity, persistence)
    const n01 = fbm(noise, sx, sy - scale, octaves, lacunarity, persistence)
    const n11 = fbm(noise, sx - scale, sy - scale, octaves, lacunarity, persistence)
    const bx = u // 0..1 within tile
    const by = v
    const top = lerp(n00, n10, bx)
    const bot = lerp(n01, n11, bx)
    return lerp(top, bot, by)
}

type ShapeFn = (raw: number) => number

const shapeFunctions: Record<GroundTexturePreset, ShapeFn> = {
    none: () => 0,
    mossy_patches: (v) => smoothstep(0.1, 0.45, (v + 1) * 0.5),
    snow_ice: (v) => Math.pow(Math.max(0, (v + 1) * 0.5), 2.5),
    stone_cracks: (v) => 1 - Math.abs(v),
    dirt_mud: (v) => (v + 1) * 0.5,
    grass_field: (v) => (v + 1) * 0.5,
    custom: (v) => (v + 1) * 0.5,
}

export function generateGroundTexture(
    baseColor: number,
    config: GroundTextureConfig,
    canvasSize: number = 2048,
    worldSeed: number = 42
): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = canvasSize
    canvas.height = canvasSize
    const ctx = canvas.getContext('2d')!
    const imageData = ctx.createImageData(canvasSize, canvasSize)
    const data = imageData.data

    const [br, bg, bb] = hexToRGB(baseColor)
    const [sr, sg, sb] = hexToRGB(config.secondaryColor)

    const octaves = config.octaves ?? 3
    const lacunarity = config.lacunarity ?? 2.0
    const persistence = config.persistence ?? 0.5
    const shape = shapeFunctions[config.preset] || shapeFunctions.custom

    const noise = new SimplexNoise2D(worldSeed)
    const detailNoise = config.detailColor != null ? new SimplexNoise2D(worldSeed + 7919) : null
    const [dr, dg, db] = config.detailColor != null ? hexToRGB(config.detailColor) : [0, 0, 0]
    const detailScale = config.detailScale ?? 4.0
    const detailIntensity = config.detailIntensity ?? 0.1

    const invSize = 1 / canvasSize
    const noiseScale = config.noiseScale
    const intensity = config.intensity

    for (let y = 0; y < canvasSize; y++) {
        const v = y * invSize // 0..1
        for (let x = 0; x < canvasSize; x++) {
            const u = x * invSize // 0..1
            const raw = fbmSeamless(noise, u, v, noiseScale, octaves, lacunarity, persistence)
            const t = shape(raw) * intensity

            let r = lerp(br, sr, t)
            let g = lerp(bg, sg, t)
            let b = lerp(bb, sb, t)

            if (detailNoise) {
                const dRaw = fbmSeamless(detailNoise, u, v, detailScale, octaves, lacunarity, persistence)
                const dt = ((dRaw + 1) * 0.5) * detailIntensity
                r = lerp(r, dr, dt)
                g = lerp(g, dg, dt)
                b = lerp(b, db, dt)
            }

            const idx = (y * canvasSize + x) * 4
            data[idx] = Math.max(0, Math.min(255, r))
            data[idx + 1] = Math.max(0, Math.min(255, g))
            data[idx + 2] = Math.max(0, Math.min(255, b))
            data[idx + 3] = 255
        }
    }

    ctx.putImageData(imageData, 0, 0)
    return canvas
}

export const GROUND_TEXTURE_PRESETS: Record<Exclude<GroundTexturePreset, 'none'>, Omit<GroundTextureConfig, 'preset'>> = {
    mossy_patches: {
        noiseScale: 3.0,
        secondaryColor: 0x1a2e1a,
        intensity: 0.6,
        octaves: 4,
        lacunarity: 2.0,
        persistence: 0.5,
        detailColor: 0x4a3a2a,
        detailScale: 6.0,
        detailIntensity: 0.15
    },
    snow_ice: {
        noiseScale: 2.5,
        secondaryColor: 0x8899aa,
        intensity: 0.5,
        octaves: 3,
        lacunarity: 2.0,
        persistence: 0.45,
        detailColor: 0xbbccdd,
        detailScale: 5.0,
        detailIntensity: 0.1
    },
    stone_cracks: {
        noiseScale: 4.0,
        secondaryColor: 0x0f0f18,
        intensity: 0.7,
        octaves: 5,
        lacunarity: 2.2,
        persistence: 0.55,
        detailColor: 0x3a3a45,
        detailScale: 8.0,
        detailIntensity: 0.12
    },
    dirt_mud: {
        noiseScale: 2.0,
        secondaryColor: 0x3a2a1a,
        intensity: 0.5,
        octaves: 3,
        lacunarity: 2.0,
        persistence: 0.5,
        detailColor: 0x2a1a0a,
        detailScale: 4.0,
        detailIntensity: 0.1
    },
    grass_field: {
        noiseScale: 2.5,
        secondaryColor: 0x2a5a1a,
        intensity: 0.4,
        octaves: 3,
        lacunarity: 2.0,
        persistence: 0.5,
        detailColor: 0x4a6a2a,
        detailScale: 5.0,
        detailIntensity: 0.12
    },
    custom: {
        noiseScale: 2.0,
        secondaryColor: 0x333333,
        intensity: 0.5,
        octaves: 3,
        lacunarity: 2.0,
        persistence: 0.5
    }
}
