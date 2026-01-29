export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private soundBuffers: Map<string, AudioBuffer> = new Map();
    private musicSource: AudioBufferSourceNode | null = null;
    private isMuted = false;
    private masterGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private basePath = '/audio/';
    private preloadedSfx: Set<string> = new Set();

    // Adaptive music
    private currentMusicIntensity = 0; // 0 = calm, 1 = intense
    private targetMusicIntensity = 0;
    private currentBiome: string | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            // Try to resume context if it was previously created
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.audioContext.resume();
            if (this.audioContext) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.connect(this.audioContext.destination);

                this.musicGain = this.audioContext.createGain();
                this.musicGain.connect(this.masterGain);
                
                this.sfxGain = this.audioContext.createGain();
                this.sfxGain.connect(this.masterGain);
            }
        }
    }

    public static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    // Sound variations
    private soundVariations: Record<string, string[]> = {
        'whoosh': ['sfx/whoosh.wav', 'sfx/whoosh-var1.wav', 'sfx/whoosh-var2.wav'],
        'pop': ['sfx/pop.wav'],
        'punch': ['sfx/punch.wav', 'sfx/punch-var1.wav', 'sfx/punch-var2.wav'],
        'fanfare': ['sfx/fanfare.wav', 'sfx/fanfare-var1.wav', 'sfx/fanfare-var2.wav'],
    };

    // Preload all slapstick comedy SFX
    public async preloadSlapstickSfx() {
        const allFiles = Object.values(this.soundVariations).flat();
        await Promise.all(allFiles.map(f => this.loadSound(f)));
        allFiles.forEach(f => this.preloadedSfx.add(f));
    }

    // Pick random variation of a sound
    private getRandomVariation(soundType: string): string {
        const variations = this.soundVariations[soundType];
        if (!variations || variations.length === 0) return `sfx/${soundType}.wav`;
        return variations[Math.floor(Math.random() * variations.length)];
    }

    // Play a preloaded file-based SFX
    private async playFileSfx(filename: string, volume = 0.3) {
        if (!this.audioContext || !this.sfxGain) return;
        const buffer = await this.loadSound(filename);
        if (!buffer) return;
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        source.buffer = buffer;
        gain.gain.value = volume;
        source.connect(gain);
        gain.connect(this.sfxGain);
        source.start(0);
    }

    // Play random variation of a sound type
    private async playRandomSfx(soundType: string, volume = 0.3) {
        const filename = this.getRandomVariation(soundType);
        await this.playFileSfx(filename, volume);
    }

    private async loadSound(url: string): Promise<AudioBuffer | null> {
        if (!this.audioContext) return null;
        const fullUrl = this.basePath + url;
        if (this.soundBuffers.has(fullUrl)) {
            return this.soundBuffers.get(fullUrl)!;
        }

        try {
            const response = await fetch(fullUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.soundBuffers.set(fullUrl, audioBuffer);
            return audioBuffer;
        } catch (error) {
            console.error(`Failed to load sound: ${fullUrl}`, error);
            return null;
        }
    }
    
    // Generic sound effect player using Web Audio API
    private playSfx(type: OscillatorType, frequency: number, duration: number, volume: number = 0.5, modulation?: { type: OscillatorType, frequency: number }) {
        if (!this.audioContext || !this.sfxGain) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, now);

        gainNode.connect(this.sfxGain);
        gainNode.gain.setValueAtTime(volume, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    // --- Volume Reference ---
    // UI sounds: 0.08-0.15 (subtle - buttons, hovers, clicks)
    // Combat sounds: 0.1-0.2 (noticeable but not overwhelming - attacks, hits)
    // Event sounds: 0.15-0.2 (important moments - level up, victory, game over)
    // Special sounds: 0.25-0.35 (very important - player hurt, explosions)
    // All durations kept short: 0.03-0.15s for most sounds

    // --- UI Sound Effects ---
    public playUIHover() {
        this.playSfx('sine', 800, 0.03, 0.08);
    }

    public playUISelect() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        gainNode.connect(this.sfxGain);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }

    public playUIBack() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(500, now);
        oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.06);
        gainNode.connect(this.sfxGain);
        gainNode.gain.setValueAtTime(0.06, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + 0.06);
    }

    public playUIError() {
        this.playSfx('sawtooth', 150, 0.08, 0.15);
    }

    public playUIClick() {
        this.playUISelect();
    }

    // --- Game Event Sounds ---
    public playLevelUp() {
        this.playRandomSfx('fanfare', 0.15);
    }

    public playGameOver() {
        this.playSfx('sawtooth', 150, 0.1, 0.2);
    }

    // --- Combat Sounds ---
    public playEnemyHurt() {
        this.playSfx('square', 200, 0.04, 0.1);
    }

    private lastEnemyDieTime = 0;
    private enemyDieCooldown = 50; // Max ~20 pops per second

    public playEnemyDie() {
        const now = performance.now();
        if (now - this.lastEnemyDieTime < this.enemyDieCooldown) return;
        this.lastEnemyDieTime = now;
        this.playFileSfx('sfx/pop.wav', 0.15);
    }

    public playPlayerHurt() {
        this.playSfx('sawtooth', 120, 0.08, 0.15); // Quick impact sound
        this.playVoicePlayerHurt(); // Voice line with cooldown
    }

    public playGemPickup() {
        this.playFileSfx('sfx/pop.wav', 0.15);
    }

    public playWhoosh() {
        this.playRandomSfx('whoosh', 0.2);
    }

    public playPlayerAttack(weaponType: 'whip' | 'axe' | 'pistol' | 'rifle' | 'burst' | 'laser' | 'default' = 'default') {
        switch (weaponType) {
            case 'whip':
                this.playSfx('sine', 600, 0.06, 0.15);
                break;
            case 'axe':
                this.playSfx('square', 300, 0.08, 0.18);
                break;
            case 'pistol':
                this.playSfx('square', 180, 0.05, 0.12);
                break;
            case 'rifle':
                this.playSfx('sawtooth', 120, 0.06, 0.15);
                break;
            case 'burst':
                this.playSfx('square', 200, 0.03, 0.1);
                break;
            case 'laser':
                if (!this.audioContext || !this.sfxGain) return;
                const now = this.audioContext.currentTime;
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(1200, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
                gain.connect(this.sfxGain);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.connect(gain);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            default:
                this.playSfx('triangle', 440, 0.05, 0.12);
                break;
        }
    }

    public playAuraDamage() {
        this.playSfx('sine', 350, 0.04, 0.06);
    }

    public playCompanionAttack() {
        this.playSfx('triangle', 700, 0.04, 0.08);
    }

    public playVehicleRam() {
        this.playSfx('sawtooth', 80, 0.05, 0.12);
    }

    public playVehicleActivate() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(60, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.25);
    }

    // --- Special Event Sounds ---
    public playVictory() {
        this.playRandomSfx('fanfare', 0.35);
    }

    public playEvolution() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.3);
        setTimeout(() => this.playSfx('sine', 1500, 0.06, 0.15), 200);
        setTimeout(() => this.playSfx('sine', 1800, 0.06, 0.12), 280);
    }

    public playReroll() {
        if (!this.audioContext || !this.sfxGain) return;
        for (let i = 0; i < 4; i++) {
            setTimeout(() => this.playSfx('triangle', 400 + Math.random() * 200, 0.03, 0.08), i * 30);
        }
    }

    public playEnemySpawn(isElite: boolean) {
        if (isElite) {
            this.playSfx('triangle', 300, 0.08, 0.15);
        }
    }

    public playPlayerHeal() {
        this.playSfx('sine', 660, 0.06, 0.1);
    }

    public playMusic(url: string) {
        // Music playback disabled - no audio files
        return;
    }

    public stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop(0);
            this.musicSource = null;
        }
    }

    public toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1, this.audioContext!.currentTime);
        }
    }

    public getMuteState() {
        return this.isMuted;
    }

    public setMusicVolume(volume: number) {
        if (this.musicGain && this.audioContext) {
            this.musicGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext.currentTime);
        }
    }

    public setSfxVolume(volume: number) {
        if (this.sfxGain && this.audioContext) {
            this.sfxGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext.currentTime);
        }
    }

    public getMusicVolume(): number {
        return this.musicGain?.gain.value ?? 1;
    }

    public getSfxVolume(): number {
        return this.sfxGain?.gain.value ?? 1;
    }

    // --- Biome-Specific Music ---
    public playBiomeMusic(biomeId: string) {
        this.currentBiome = biomeId;
        // Music files removed - no background music
        // Keep procedural sound effects only
    }

    // --- Adaptive Music Intensity ---
    // enemyDensity should be 0-1 (0 = no enemies, 1 = lots of enemies)
    public updateMusicIntensity(enemyDensity: number) {
        this.targetMusicIntensity = Math.max(0, Math.min(1, enemyDensity));

        // Smooth transition toward target intensity
        const step = 0.01;
        if (Math.abs(this.currentMusicIntensity - this.targetMusicIntensity) > step) {
            if (this.currentMusicIntensity < this.targetMusicIntensity) {
                this.currentMusicIntensity += step;
            } else {
                this.currentMusicIntensity -= step;
            }

            // Adjust music volume based on intensity (0.3 at calm, 1.0 at intense)
            const baseVolume = 0.3 + (this.currentMusicIntensity * 0.7);
            if (this.musicGain && this.audioContext) {
                const currentMusicVolume = this.musicGain.gain.value;
                // Only adjust if user hasn't manually set volume to 0
                if (currentMusicVolume > 0) {
                    this.musicGain.gain.setValueAtTime(baseVolume, this.audioContext.currentTime);
                }
            }
        }
    }

    // --- Additional Weapon Sounds ---
    public playExplosion() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    public playFireSound() {
        this.playSfx('sawtooth', 100, 0.1, 0.12);
        setTimeout(() => this.playSfx('sawtooth', 120, 0.08, 0.1), 50);
    }

    public playIceSound() {
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.15);
    }

    public playPoisonSound() {
        this.playSfx('triangle', 250, 0.08, 0.08);
    }

    public playHolySound() {
        if (!this.audioContext || !this.sfxGain) return;
        this.playSfx('sine', 659.25, 0.1, 0.15); // E5
        setTimeout(() => this.playSfx('sine', 783.99, 0.08, 0.12), 50); // G5
    }

    public playCriticalHit() {
        this.playRandomSfx('punch', 0.25);
    }

    public playStatusEffect(effectType: 'poison' | 'burn' | 'freeze' | 'slow' | 'curse' | 'bleed') {
        switch (effectType) {
            case 'poison':
                this.playPoisonSound();
                break;
            case 'burn':
                this.playFireSound();
                break;
            case 'freeze':
                this.playIceSound();
                break;
            case 'slow':
                this.playSfx('sine', 200, 0.06, 0.08);
                break;
            case 'curse':
                this.playSfx('sawtooth', 120, 0.1, 0.1);
                break;
            case 'bleed':
                this.playSfx('square', 180, 0.05, 0.09);
                break;
        }
    }

    public playBossSpawn() {
        this.playSfx('sawtooth', 80, 0.2, 0.3);
    }

    public playAchievementUnlock() {
        if (!this.audioContext || !this.sfxGain) return;
        // Triumphant sound
        this.playSfx('sine', 523.25, 0.08, 0.15); // C5
        setTimeout(() => this.playSfx('sine', 659.25, 0.08, 0.15), 80); // E5
        setTimeout(() => this.playSfx('sine', 783.99, 0.1, 0.18), 160); // G5
    }

    public playPrestige() {
        if (!this.audioContext || !this.sfxGain) return;
        // Epic ascending sound
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const freq = 400 + (i * 200);
                this.playSfx('sine', freq, 0.08, 0.2);
            }, i * 100);
        }
    }

    // --- Voice Lines ---
    private voiceGain: GainNode | null = null;
    private voiceVolume = 0.7;

    // Flavor voice lines by category (50% chance to play one randomly)
    private flavorLines: Record<string, string[]> = {
        'upgrade': [
            'flavor-upgrade-1-pick-wrong-one-potatoes.mp3',
            'flavor-upgrade-2-not-multiple-choice.mp3',
            'flavor-upgrade-3-babushka-knows.mp3',
            'flavor-upgrade-4-ancestors-watching.mp3',
        ],
        'evolved': [
            'flavor-evolved-1-real-firepower.mp3',
            'flavor-evolved-2-new-lada.mp3',
        ],
        'boss': [
            'flavor-boss-1-three-winters.mp3',
            'flavor-boss-2-show-what-made-of.mp3',
        ],
        'death': [
            'flavor-death-1-drink-vodka.mp3',
            'flavor-death-2-grandmother-lasted.mp3',
            'flavor-death-3-back-to-gulag.mp3',
        ],
        'victory': [
            'flavor-victory-1-slavic-warrior.mp3',
            'flavor-victory-2-motherland-celebrates.mp3',
            'flavor-victory-3-celebrate-borscht.mp3',
        ],
        'damage': [
            'damage-01.mp3',
            'damage-02.mp3',
            'damage-03.mp3',
            'damage-04.mp3',
            'damage-05.mp3',
            'damage-06.mp3',
            'damage-07.mp3',
            'damage-08.mp3',
            'damage-09.mp3',
            'damage-10.mp3',
        ],
    };

    // Track damage voiceline so it can be interrupted
    private currentDamageSource: AudioBufferSourceNode | null = null;
    private lastDamageVoiceTime = 0;
    private damageVoiceCooldown = 3000; // Min 3 seconds between damage voicelines

    private async playVoiceLine(filename: string) {
        if (!this.audioContext || !this.sfxGain) return;

        if (!this.voiceGain) {
            this.voiceGain = this.audioContext.createGain();
            this.voiceGain.connect(this.masterGain!);
            this.voiceGain.gain.value = this.voiceVolume;
        }

        const buffer = await this.loadSound(`voicelines/${filename}`);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        source.start(0);
    }

    private playFlavorLine(category: string, delayMs: number = 1500) {
        // 50% chance to skip flavor
        if (Math.random() < 0.5) return;

        const lines = this.flavorLines[category];
        if (!lines || lines.length === 0) return;

        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        setTimeout(() => this.playVoiceLine(randomLine), delayMs);
    }

    private stopDamageVoiceline() {
        if (this.currentDamageSource) {
            try {
                this.currentDamageSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentDamageSource = null;
        }
    }

    private stopAllInterruptibleVoicelines() {
        this.stopTimelineVoiceline();
        this.stopDamageVoiceline();
    }

    public async playVoicePlayerHurt() {
        // Cooldown to prevent spam
        const now = Date.now();
        if (now - this.lastDamageVoiceTime < this.damageVoiceCooldown) return;
        this.lastDamageVoiceTime = now;

        if (!this.audioContext || !this.sfxGain) return;

        if (!this.voiceGain) {
            this.voiceGain = this.audioContext.createGain();
            this.voiceGain.connect(this.masterGain!);
            this.voiceGain.gain.value = this.voiceVolume;
        }

        const lines = this.flavorLines['damage'];
        const randomLine = lines[Math.floor(Math.random() * lines.length)];
        const buffer = await this.loadSound(`voicelines/${randomLine}`);
        if (!buffer) return;

        // Stop previous damage voiceline if playing
        this.stopDamageVoiceline();

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        source.onended = () => {
            if (this.currentDamageSource === source) {
                this.currentDamageSource = null;
            }
        };
        this.currentDamageSource = source;
        source.start(0);
    }

    public playVoiceChooseUpgrade() {
        this.stopAllInterruptibleVoicelines();
        this.playVoiceLine('func-choose-upgrade.mp3');
        this.playFlavorLine('upgrade');
    }

    public playVoiceWeaponEvolved() {
        this.stopAllInterruptibleVoicelines();
        this.playVoiceLine('func-weapon-evolved.mp3');
        this.playFlavorLine('evolved');
    }

    public playVoiceBossApproaching() {
        this.stopAllInterruptibleVoicelines();
        this.playVoiceLine('func-boss-incoming.mp3');
        this.playFlavorLine('boss');
    }

    public playVoiceYouDied() {
        this.stopAllInterruptibleVoicelines();
        this.playVoiceLine('func-game-over.mp3');
        this.playFlavorLine('death');
    }

    public playVoiceVictory() {
        this.stopAllInterruptibleVoicelines();
        this.playVoiceLine('func-victory.mp3');
        this.playFlavorLine('victory');
    }

    public setVoiceVolume(volume: number) {
        this.voiceVolume = Math.max(0, Math.min(1, volume));
        if (this.voiceGain && this.audioContext) {
            this.voiceGain.gain.setValueAtTime(this.voiceVolume, this.audioContext.currentTime);
        }
    }

    public getVoiceVolume(): number {
        return this.voiceVolume;
    }

    // --- Timeline Voicelines ---
    private timelineVoicelineCache: Map<string, AudioBuffer> = new Map();
    private currentTimelineSource: AudioBufferSourceNode | null = null;

    public async playTimelineVoiceline(filename: string): Promise<boolean> {
        if (!this.audioContext || !this.sfxGain) return false;

        if (!this.voiceGain) {
            this.voiceGain = this.audioContext.createGain();
            this.voiceGain.connect(this.masterGain!);
            this.voiceGain.gain.value = this.voiceVolume;
        }

        const fullPath = `voicelines/timeline/${filename}`;
        const buffer = await this.loadSound(fullPath);
        if (!buffer) {
            console.warn(`[AudioManager] Timeline voiceline not found: ${fullPath}`);
            return false;
        }

        // Stop any currently playing timeline voiceline
        this.stopTimelineVoiceline();

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.voiceGain);
        source.onended = () => {
            if (this.currentTimelineSource === source) {
                this.currentTimelineSource = null;
            }
        };
        this.currentTimelineSource = source;
        source.start(0);
        return true;
    }

    public stopTimelineVoiceline() {
        if (this.currentTimelineSource) {
            try {
                this.currentTimelineSource.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentTimelineSource = null;
        }
    }

    public async preloadTimelineVoicelines(filenames: string[]) {
        const promises = filenames.map(f => this.loadSound(`voicelines/timeline/${f}`));
        await Promise.all(promises);
    }
}
