export interface CharacterInfo {
    id: string
    name: string
    description: string
    startingWeapon: string
    sprite: string
    unlockPrice?: number
    isUnlocked?: boolean
    startingActives?: string[]
    startingPassives?: string[]
    stats?: {
        maxHp?: number
        moveSpeed?: number
        might?: number
        area?: number
        luck?: number
        curse?: number
        greed?: number
        regen?: number
        cooldownMultiplier?: number
        armor?: number
        amount?: number
        growth?: number
    }
}

export interface GameComment {
    id: number
    handle: string
    avatarUrl?: string
    content: string
    createdAt: string
    parentId?: number | null
}

// Status Effect System
export enum StatusEffectType {
    POISON = 'poison',
    SLOW = 'slow',
    CURSE = 'curse',
    BURN = 'burn',
    FREEZE = 'freeze',
    BLEED = 'bleed'
}

export interface StatusEffect {
    type: StatusEffectType
    duration: number // Time remaining in seconds
    damage?: number // DoT damage per second
    slowAmount?: number // Movement speed reduction (0-1)
    statReduction?: number // Stat reduction percentage (0-1)
    stacks?: number // Number of stacks (for bleed)
}
