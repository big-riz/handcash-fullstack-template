export interface Achievement {
    id: string
    name: string
    description: string
    icon: string // Emoji or icon identifier
    category: 'combat' | 'collection' | 'skill' | 'exploration' | 'challenge'
    isUnlocked: boolean
    progress: number // 0-1, for achievements with progressive goals
    target: number // Target value for progressive achievements
    unlockedAt?: Date
}

export const ACHIEVEMENTS: Omit<Achievement, 'isUnlocked' | 'progress' | 'unlockedAt'>[] = [
    // Combat Achievements
    {
        id: 'kill_1000',
        name: 'Exterminator',
        description: 'Eliminate 1,000 enemies',
        icon: '💀',
        category: 'combat',
        target: 1000
    },
    {
        id: 'kill_5000',
        name: 'Mass Destroyer',
        description: 'Eliminate 5,000 enemies',
        icon: '☠️',
        category: 'combat',
        target: 5000
    },
    {
        id: 'survive_30min',
        name: 'Survivor',
        description: 'Survive for 30 minutes',
        icon: '⏰',
        category: 'combat',
        target: 1800 // 30 minutes in seconds
    },
    {
        id: 'defeat_all_bosses',
        name: 'Boss Slayer',
        description: 'Defeat all boss enemies',
        icon: '👑',
        category: 'combat',
        target: 5 // Number of unique bosses
    },
    {
        id: 'deal_1million_damage',
        name: 'Damage Dealer',
        description: 'Deal 1,000,000 total damage',
        icon: '⚔️',
        category: 'combat',
        target: 1000000
    },

    // Collection Achievements
    {
        id: 'unlock_all_characters',
        name: 'Hero Collector',
        description: 'Unlock all playable characters',
        icon: '👥',
        category: 'collection',
        target: 6 // Total number of characters
    },
    {
        id: 'max_all_weapons',
        name: 'Arsenal Master',
        description: 'Max upgrade all weapons to level 5',
        icon: '🔫',
        category: 'collection',
        target: 20 // Number of weapons
    },
    {
        id: 'collect_all_passives',
        name: 'Item Hoarder',
        description: 'Collect all passive items',
        icon: '📦',
        category: 'collection',
        target: 12 // Number of passives
    },

    // Skill Achievements
    {
        id: 'no_damage_run',
        name: 'Untouchable',
        description: 'Complete a run without taking damage',
        icon: '🛡️',
        category: 'skill',
        target: 1
    },
    {
        id: 'speed_run_15min',
        name: 'Speedrunner',
        description: 'Win in under 15 minutes',
        icon: '⚡',
        category: 'skill',
        target: 900 // 15 minutes in seconds
    },
    {
        id: 'high_score_100k',
        name: 'Score Chaser',
        description: 'Achieve a score of 100,000+',
        icon: '🏆',
        category: 'skill',
        target: 100000
    },
    {
        id: 'level_50',
        name: 'Power Leveler',
        description: 'Reach level 50 in a single run',
        icon: '📈',
        category: 'skill',
        target: 50
    },

    // Exploration Achievements
    {
        id: 'all_evolutions',
        name: 'Evolution Master',
        description: 'Discover all weapon evolutions',
        icon: '🧬',
        category: 'exploration',
        target: 10 // Number of evolutions
    },
    {
        id: 'complete_all_worlds',
        name: 'World Traveler',
        description: 'Complete all worlds',
        icon: '🌍',
        category: 'exploration',
        target: 2 // Number of worlds
    },
    {
        id: 'all_synergies',
        name: 'Synergy Expert',
        description: 'Activate all item synergies',
        icon: '✨',
        category: 'exploration',
        target: 8 // Number of synergies
    },

    // Challenge Achievements
    {
        id: 'curse_5_win',
        name: 'Cursed Victor',
        description: 'Win with 5+ curse',
        icon: '😈',
        category: 'challenge',
        target: 5
    },
    {
        id: 'no_passives_win',
        name: 'Purist',
        description: 'Win without any passive items',
        icon: '🚫',
        category: 'challenge',
        target: 1
    },
    {
        id: 'single_weapon_win',
        name: 'Weapon Specialist',
        description: 'Win with only one weapon',
        icon: '🎯',
        category: 'challenge',
        target: 1
    },
    {
        id: 'frozen_waste_victory',
        name: 'Ice Cold',
        description: 'Complete Frozen Waste',
        icon: '❄️',
        category: 'challenge',
        target: 1
    }
]

export class AchievementTracker {
    private achievements: Map<string, Achievement>
    private listeners: ((achievement: Achievement) => void)[] = []

    constructor() {
        this.achievements = new Map()
        this.loadFromStorage()
    }

    private loadFromStorage() {
        if (typeof window === 'undefined') return

        const saved = localStorage.getItem('slavic_achievements')
        if (saved) {
            try {
                const data = JSON.parse(saved)
                for (const [id, achievement] of Object.entries(data)) {
                    this.achievements.set(id, achievement as Achievement)
                }
            } catch (e) {
                console.error('Failed to load achievements:', e)
            }
        }

        // Initialize missing achievements
        for (const template of ACHIEVEMENTS) {
            if (!this.achievements.has(template.id)) {
                this.achievements.set(template.id, {
                    ...template,
                    isUnlocked: false,
                    progress: 0
                })
            }
        }
    }

    private saveToStorage() {
        if (typeof window === 'undefined') return

        const data: Record<string, Achievement> = {}
        for (const [id, achievement] of this.achievements.entries()) {
            data[id] = achievement
        }
        localStorage.setItem('slavic_achievements', JSON.stringify(data))
    }

    getAchievements(): Achievement[] {
        return Array.from(this.achievements.values())
    }

    getAchievementsByCategory(category: Achievement['category']): Achievement[] {
        return this.getAchievements().filter(a => a.category === category)
    }

    updateProgress(id: string, progress: number) {
        const achievement = this.achievements.get(id)
        if (!achievement || achievement.isUnlocked) return

        achievement.progress = Math.min(progress, achievement.target)

        if (achievement.progress >= achievement.target && !achievement.isUnlocked) {
            this.unlock(id)
        } else {
            this.saveToStorage()
        }
    }

    incrementProgress(id: string, amount: number = 1) {
        const achievement = this.achievements.get(id)
        if (!achievement || achievement.isUnlocked) return

        this.updateProgress(id, achievement.progress + amount)
    }

    unlock(id: string) {
        const achievement = this.achievements.get(id)
        if (!achievement || achievement.isUnlocked) return

        achievement.isUnlocked = true
        achievement.progress = achievement.target
        achievement.unlockedAt = new Date()

        this.saveToStorage()

        // Notify listeners
        for (const listener of this.listeners) {
            listener(achievement)
        }
    }

    onAchievementUnlocked(callback: (achievement: Achievement) => void) {
        this.listeners.push(callback)
    }

    getUnlockedCount(): number {
        return this.getAchievements().filter(a => a.isUnlocked).length
    }

    getTotalCount(): number {
        return this.achievements.size
    }

    getCompletionPercentage(): number {
        const total = this.getTotalCount()
        if (total === 0) return 0
        return (this.getUnlockedCount() / total) * 100
    }
}

// Singleton instance
let instance: AchievementTracker | null = null

export function getAchievementTracker(): AchievementTracker {
    if (!instance) {
        instance = new AchievementTracker()
    }
    return instance
}
