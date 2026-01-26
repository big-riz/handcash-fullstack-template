export interface MetaUpgrade {
    id: string
    name: string
    description: string
    icon: string
    category: 'combat' | 'economy' | 'utility'
    cost: number // Sunflower Seeds cost
    maxLevel: number
    currentLevel: number
    effect: (level: number) => {
        maxHp?: number
        growth?: number
        rerolls?: number
        startingGold?: number
        damageMultiplier?: number
        cooldownMultiplier?: number
        moveSpeed?: number
        luck?: number
    }
}

export const META_UPGRADES: Omit<MetaUpgrade, 'currentLevel'>[] = [
    // Combat Upgrades
    {
        id: 'extra_hp',
        name: 'Hardy Constitution',
        description: '+10 max HP per level',
        icon: '❤️',
        category: 'combat',
        cost: 100,
        maxLevel: 10,
        effect: (level) => ({ maxHp: level * 10 })
    },
    {
        id: 'starting_damage',
        name: 'Initial Might',
        description: '+5% damage per level',
        icon: '⚔️',
        category: 'combat',
        cost: 150,
        maxLevel: 5,
        effect: (level) => ({ damageMultiplier: 1 + (level * 0.05) })
    },
    {
        id: 'starting_speed',
        name: 'Swift Start',
        description: '+0.2 movement speed per level',
        icon: '💨',
        category: 'combat',
        cost: 120,
        maxLevel: 5,
        effect: (level) => ({ moveSpeed: level * 0.2 })
    },
    {
        id: 'cooldown_boost',
        name: 'Quick Reflexes',
        description: '+5% cooldown reduction per level',
        icon: '⚡',
        category: 'combat',
        cost: 200,
        maxLevel: 5,
        effect: (level) => ({ cooldownMultiplier: 1 - (level * 0.05) })
    },

    // Economy Upgrades
    {
        id: 'xp_boost',
        name: 'Experience Gain',
        description: '+5% XP gain per level',
        icon: '📈',
        category: 'economy',
        cost: 200,
        maxLevel: 10,
        effect: (level) => ({ growth: 1 + (level * 0.05) })
    },
    {
        id: 'extra_reroll',
        name: 'Fortune Favors',
        description: '+1 reroll per level',
        icon: '🎲',
        category: 'economy',
        cost: 300,
        maxLevel: 3,
        effect: (level) => ({ rerolls: level })
    },
    {
        id: 'starting_gold',
        name: 'Wealthy Start',
        description: '+50 starting gold per level',
        icon: '💰',
        category: 'economy',
        cost: 250,
        maxLevel: 5,
        effect: (level) => ({ startingGold: level * 50 })
    },
    {
        id: 'luck_boost',
        name: 'Lucky Streak',
        description: '+10% luck per level',
        icon: '🍀',
        category: 'economy',
        cost: 180,
        maxLevel: 5,
        effect: (level) => ({ luck: 1 + (level * 0.1) })
    },

    // Utility Upgrades
    {
        id: 'revival_boost',
        name: 'Extra Lives',
        description: '+1 revival per level',
        icon: '💚',
        category: 'utility',
        cost: 500,
        maxLevel: 2,
        effect: (level) => ({}) // Handled separately in player initialization
    },
    {
        id: 'permanent_magnet',
        name: 'Magnetic Field',
        description: '+1 magnet range per level',
        icon: '🧲',
        category: 'utility',
        cost: 150,
        maxLevel: 5,
        effect: (level) => ({}) // Handled separately
    }
]

export interface MetaProgress {
    sunflowerSeeds: number
    upgrades: Record<string, number> // upgrade id -> level
    totalRunsCompleted: number
    totalSeeds: number // Lifetime seeds earned
    prestigeLevel: number
    prestigeMultiplier: number
}

export class MetaProgressionStorage {
    private static STORAGE_KEY = 'slavic_meta_progression'

    static getProgress(): MetaProgress {
        if (typeof window === 'undefined') {
            return this.getDefaultProgress()
        }

        const saved = localStorage.getItem(this.STORAGE_KEY)
        if (saved) {
            try {
                return JSON.parse(saved)
            } catch (e) {
                console.error('Failed to load meta progression:', e)
            }
        }

        return this.getDefaultProgress()
    }

    static saveProgress(progress: MetaProgress) {
        if (typeof window === 'undefined') return

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(progress))
    }

    static getDefaultProgress(): MetaProgress {
        return {
            sunflowerSeeds: 0,
            upgrades: {},
            totalRunsCompleted: 0,
            totalSeeds: 0,
            prestigeLevel: 0,
            prestigeMultiplier: 1.0
        }
    }

    static awardSeeds(amount: number) {
        const progress = this.getProgress()
        progress.sunflowerSeeds += amount
        progress.totalSeeds += amount
        this.saveProgress(progress)
    }

    static purchaseUpgrade(upgradeId: string): boolean {
        const progress = this.getProgress()
        const upgrade = META_UPGRADES.find(u => u.id === upgradeId)

        if (!upgrade) return false

        const currentLevel = progress.upgrades[upgradeId] || 0
        if (currentLevel >= upgrade.maxLevel) return false

        const cost = upgrade.cost * (currentLevel + 1) // Cost scales with level
        if (progress.sunflowerSeeds < cost) return false

        progress.sunflowerSeeds -= cost
        progress.upgrades[upgradeId] = currentLevel + 1
        this.saveProgress(progress)

        return true
    }

    static getUpgradeLevel(upgradeId: string): number {
        const progress = this.getProgress()
        return progress.upgrades[upgradeId] || 0
    }

    static calculateSeedsEarned(playerLevel: number, gameTime: number, kills: number): number {
        // Base seeds calculation
        let seeds = 0

        // Level contribution (10 seeds per level)
        seeds += playerLevel * 10

        // Time contribution (1 seed per minute)
        seeds += Math.floor(gameTime / 60)

        // Kills contribution (1 seed per 50 kills)
        seeds += Math.floor(kills / 50)

        // Apply prestige multiplier
        const progress = this.getProgress()
        seeds = Math.floor(seeds * progress.prestigeMultiplier)

        return Math.max(10, seeds) // Minimum 10 seeds per run
    }

    static prestige(): boolean {
        const progress = this.getProgress()

        // Require all upgrades to be maxed
        const allMaxed = META_UPGRADES.every(upgrade => {
            const level = progress.upgrades[upgrade.id] || 0
            return level >= upgrade.maxLevel
        })

        if (!allMaxed) return false

        // Reset upgrades but increase multiplier
        progress.upgrades = {}
        progress.prestigeLevel += 1
        progress.prestigeMultiplier = 1.0 + (progress.prestigeLevel * 0.1) // +10% per prestige

        this.saveProgress(progress)
        return true
    }

    static getAppliedBonuses(): MetaProgress['upgrades'] & {
        maxHp?: number
        growth?: number
        rerolls?: number
        startingGold?: number
        damageMultiplier?: number
        cooldownMultiplier?: number
        moveSpeed?: number
        luck?: number
        revivals?: number
        magnet?: number
    } {
        const progress = this.getProgress()
        const bonuses: any = {}

        for (const upgrade of META_UPGRADES) {
            const level = progress.upgrades[upgrade.id] || 0
            if (level > 0) {
                const effects = upgrade.effect(level)
                for (const [key, value] of Object.entries(effects)) {
                    if (bonuses[key] !== undefined) {
                        bonuses[key] += value
                    } else {
                        bonuses[key] = value
                    }
                }
            }
        }

        // Special handling for revival and magnet
        bonuses.revivals = progress.upgrades['revival_boost'] || 0
        bonuses.magnet = progress.upgrades['permanent_magnet'] || 0

        return bonuses
    }
}
