/**
 * SeededRandom.ts
 * 
 * A simple seeded pseudo-random number generator (LCG or Mulberry32).
 * Used for deterministic game replays.
 */

export class SeededRandom {
    private state: number;

    constructor(seed: string | number) {
        if (typeof seed === 'string') {
            this.state = this.hashString(seed);
        } else {
            this.state = seed || Date.now();
        }
    }

    private hashString(str: string): number {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }

    /**
     * Mulberry32 algorithm
     */
    next(): number {
        let t = this.state += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    nextInRange(min: number, max: number): number {
        return min + this.next() * (max - min);
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.nextInRange(min, max + 1));
    }
}
