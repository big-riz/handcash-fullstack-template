/**
 * ReplaySystem.ts
 * 
 * Optimized for compact data storage.
 */

export enum ReplayEventType {
    INPUT = 0,
    LEVEL_UP = 1,
    DEATH = 2,
    START = 3,
    CHECKPOINT = 4
}

/**
 * Compact Event Format: [type, frame, ...data]
 * INPUT: [0, frame, x, z] (x, z rounded to 2 decimals)
 * LEVEL_UP: [1, frame, abilityId]
 * DEATH: [2, frame, level, time]
 * CHECKPOINT: [4, frame, x*100, z*100, level, kills]
 */
export type CompactEvent = [number, number, ...any[]];

export interface ReplayData {
    seed: string;
    startTime: number;
    gameVersion: string;
    events: CompactEvent[];
    finalLevel: number;
    finalTime: number;
    playerName: string;
    characterId?: string;
    worldId?: string;
}

export class ReplayRecorder {
    private data: ReplayData;
    private currentFrame: number = 0;
    private lastInput: { x: number, z: number } = { x: 0, z: 0 };

    constructor(seed: string, playerName: string, characterId: string, worldId: string) {
        this.data = {
            seed,
            startTime: Date.now(),
            gameVersion: '0.1.0-alpha',
            events: [],
            finalLevel: 1,
            finalTime: 0,
            playerName,
            characterId,
            worldId
        };
    }

    recordInput(x: number, z: number) {
        // Only record if input has changed significantly
        if (x !== this.lastInput.x || z !== this.lastInput.z) {
            this.data.events.push([
                ReplayEventType.INPUT,
                this.currentFrame,
                parseFloat(x.toFixed(4)),
                parseFloat(z.toFixed(4))
            ]);
            this.lastInput = { x, z };
        }
    }

    recordLevelUp(abilityId: string) {
        this.data.events.push([
            ReplayEventType.LEVEL_UP,
            this.currentFrame,
            abilityId
        ]);
    }

    recordCheckpoint(playerX: number, playerZ: number, level: number, kills: number) {
        this.data.events.push([
            ReplayEventType.CHECKPOINT,
            this.currentFrame,
            Math.round(playerX * 100),
            Math.round(playerZ * 100),
            level,
            kills
        ]);
    }

    update() {
        this.currentFrame++;
    }

    updateFinalStats(level: number, time: number) {
        this.data.finalLevel = level;
        this.data.finalTime = time;
    }

    finish(level: number, time: number) {
        this.updateFinalStats(level, time);
        this.data.events.push([
            ReplayEventType.DEATH,
            this.currentFrame,
            level,
            Math.floor(time)
        ]);
    }

    getReplayData(): ReplayData {
        return this.data;
    }

    getSerialized(): string {
        return JSON.stringify(this.data);
    }
}

export class ReplayPlayer {
    private data: ReplayData;
    private eventIndex: number = 0;
    private currentFrame: number = 0;
    public currentInput: { x: number, z: number } = { x: 0, z: 0 };

    constructor(data: ReplayData) {
        this.data = data;
    }

    reset() {
        this.eventIndex = 0;
        this.currentFrame = 0;
        this.currentInput = { x: 0, z: 0 };
    }

    update() {
        this.currentFrame++;
    }

    getEventsForFrame(frame: number): CompactEvent[] {
        const result: CompactEvent[] = [];
        while (this.eventIndex < this.data.events.length && this.data.events[this.eventIndex][1] <= frame) {
            const event = this.data.events[this.eventIndex];
            if (event[0] === ReplayEventType.INPUT) {
                this.currentInput = { x: event[2], z: event[3] };
            }
            result.push(event);
            this.eventIndex++;
        }
        return result;
    }

    getSeed(): string {
        return this.data.seed;
    }

    getCharacterId(): string | undefined {
        return this.data.characterId;
    }

    getWorldId(): string | undefined {
        return this.data.worldId;
    }

    isFinished(): boolean {
        return this.eventIndex >= this.data.events.length;
    }

    verifyCheckpoint(event: CompactEvent, playerX: number, playerZ: number, level: number, kills: number): boolean {
        if (event[0] !== ReplayEventType.CHECKPOINT) return true;

        const [, frame, expectedX, expectedZ, expectedLevel, expectedKills] = event;
        const actualX = Math.round(playerX * 100);
        const actualZ = Math.round(playerZ * 100);

        if (actualX !== expectedX || actualZ !== expectedZ || level !== expectedLevel || kills !== expectedKills) {
            console.error(
                `REPLAY DIVERGENCE at frame ${frame}: ` +
                `pos (${actualX},${actualZ}) != (${expectedX},${expectedZ}), ` +
                `level ${level} != ${expectedLevel}, kills ${kills} != ${expectedKills}`
            );
            return false;
        }
        return true;
    }
}
