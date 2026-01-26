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
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        gainNode.connect(this.sfxGain);
        gainNode.gain.setValueAtTime(0.12, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        oscillator.connect(gainNode);
        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    public playUIError() {
        this.playSfx('sawtooth', 150, 0.08, 0.15);
    }

    public playUIClick() {
        this.playUISelect();
    }

    // --- Game Event Sounds ---
    public playLevelUp() {
        if (!this.audioContext) return;
        this.playSfx('sine', 440, 0.08, 0.15);
        setTimeout(() => this.playSfx('sine', 660, 0.08, 0.15), 80);
        setTimeout(() => this.playSfx('sine', 880, 0.1, 0.18), 160);
    }

    public playGameOver() {
        this.playSfx('sawtooth', 220, 0.15, 0.08);
        setTimeout(() => this.playSfx('sawtooth', 110, 0.2, 0.06), 100);
    }

    // --- Combat Sounds ---
    public playEnemyHurt() {
        this.playSfx('square', 180, 0.025, 0.08);
    }

    public playEnemyDie() {
        this.playSfx('sawtooth', 100, 0.05, 0.1);
    }

    public playPlayerHurt() {
        // Make player damage more noticeable with higher volume, longer duration, and harsher sound
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        // Use sawtooth for a harsher, more noticeable impact sound
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.1);

        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.35, now); // Much louder (was 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.12);
    }

    public playGemPickup() {
        this.playSfx('sine', 880, 0.06, 0.1);
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
        if (!this.audioContext || !this.sfxGain) return;
        this.playSfx('sine', 523.25, 0.1, 0.15);
        setTimeout(() => this.playSfx('sine', 659.25, 0.1, 0.15), 100);
        setTimeout(() => this.playSfx('sine', 783.99, 0.1, 0.15), 200);
        setTimeout(() => this.playSfx('sine', 1046.50, 0.15, 0.18), 300);
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
            this.playSfx('sawtooth', 150, 0.1, 0.15);
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
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
        gain.connect(this.sfxGain);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        osc.start(now);
        osc.stop(now + 0.1);
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
        if (!this.audioContext || !this.sfxGain) return;
        const now = this.audioContext.currentTime;

        // Deep rumble
        const osc1 = this.audioContext.createOscillator();
        const gain1 = this.audioContext.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(50, now);
        gain1.connect(this.sfxGain);
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc1.connect(gain1);
        osc1.start(now);
        osc1.stop(now + 1.0);

        // High impact
        setTimeout(() => {
            const osc2 = this.audioContext!.createOscillator();
            const gain2 = this.audioContext!.createGain();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(200, now + 0.3);
            gain2.connect(this.sfxGain!);
            gain2.gain.setValueAtTime(0.25, now + 0.3);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
            osc2.connect(gain2);
            osc2.start(now + 0.3);
            osc2.stop(now + 0.8);
        }, 300);
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
}
