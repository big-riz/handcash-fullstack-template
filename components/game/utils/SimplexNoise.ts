// 2D Simplex noise with seeded permutation table
// Self-contained, no external dependencies, deterministic via seed

const F2 = 0.5 * (Math.sqrt(3) - 1)
const G2 = (3 - Math.sqrt(3)) / 6

const grad3 = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1]
]

export class SimplexNoise2D {
    private perm: Uint8Array
    private permMod12: Uint8Array

    constructor(seed: number) {
        this.perm = new Uint8Array(512)
        this.permMod12 = new Uint8Array(512)

        const p = new Uint8Array(256)
        for (let i = 0; i < 256; i++) p[i] = i

        // Fisher-Yates shuffle with seeded PRNG (xorshift32)
        let s = seed >>> 0 || 1
        for (let i = 255; i > 0; i--) {
            s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
            const j = s % (i + 1)
            const tmp = p[i]; p[i] = p[j]; p[j] = tmp
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = p[i & 255]
            this.permMod12[i] = this.perm[i] % 12
        }
    }

    noise2D(xin: number, yin: number): number {
        const s = (xin + yin) * F2
        const i = Math.floor(xin + s)
        const j = Math.floor(yin + s)
        const t = (i + j) * G2

        const X0 = i - t
        const Y0 = j - t
        const x0 = xin - X0
        const y0 = yin - Y0

        const i1 = x0 > y0 ? 1 : 0
        const j1 = x0 > y0 ? 0 : 1

        const x1 = x0 - i1 + G2
        const y1 = y0 - j1 + G2
        const x2 = x0 - 1 + 2 * G2
        const y2 = y0 - 1 + 2 * G2

        const ii = i & 255
        const jj = j & 255
        const gi0 = this.permMod12[ii + this.perm[jj]]
        const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]]
        const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]]

        let n0 = 0, n1 = 0, n2 = 0

        let t0 = 0.5 - x0 * x0 - y0 * y0
        if (t0 >= 0) {
            t0 *= t0
            n0 = t0 * t0 * (grad3[gi0][0] * x0 + grad3[gi0][1] * y0)
        }

        let t1 = 0.5 - x1 * x1 - y1 * y1
        if (t1 >= 0) {
            t1 *= t1
            n1 = t1 * t1 * (grad3[gi1][0] * x1 + grad3[gi1][1] * y1)
        }

        let t2 = 0.5 - x2 * x2 - y2 * y2
        if (t2 >= 0) {
            t2 *= t2
            n2 = t2 * t2 * (grad3[gi2][0] * x2 + grad3[gi2][1] * y2)
        }

        return 70 * (n0 + n1 + n2)
    }
}
