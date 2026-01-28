import { AbilitySystem, AbilityType, PassiveType } from './AbilitySystem'
import { Player } from '../entities/Player'
import activeData from '../data/actives'
import passiveData from '../data/passives'

export interface LevelUpChoice {
    id: string
    title: string
    desc: string
    minLevel?: number
    imageUrl?: string
    rarity: string
    type: 'active' | 'passive' | 'evolution'
    level: number
}

export class LevelUpSystem {
    static getChoices(
        abilitySystem: AbilitySystem,
        player: Player,
        allowedUpgrades: string[],
        rng: any,
        banishedItems: Set<string> = new Set()
    ): LevelUpChoice[] {
        const ownedItems = abilitySystem.getUpgrades().map(u => u.id)
        const gatingLevel = player.stats.level // Simplification: assume simple level gating

        // Filter Actives
        const actives = activeData.filter(a => {
            if (banishedItems.has(a.id)) return false
            const isAllowed = allowedUpgrades.includes('all') || allowedUpgrades.includes(a.id)
            return isAllowed
        }).map(a => ({
            id: a.id,
            title: a.name,
            desc: a.description,
            minLevel: a.minLevel,
            rarity: (a as any).rarity || 'Common',
            type: 'active' as const
        }))

        // Filter Passives
        const passives = passiveData.filter(p => {
            if (banishedItems.has(p.id)) return false
            const isAllowed = allowedUpgrades.includes('all') || allowedUpgrades.includes(p.id)
            return isAllowed
        }).map(p => ({
            id: p.id,
            title: p.name,
            desc: p.description,
            minLevel: p.minLevel,
            rarity: (p as any).rarity || 'Common',
            type: 'passive' as const
        }))

        // Filter Evolutions
        const evos = abilitySystem.getAvailableEvolutions().filter(evo => {
            return allowedUpgrades.includes('all') || allowedUpgrades.includes(evo.evolvedAbility)
        }).map(evo => {
            let title = "Evolution"
            if (evo.evolvedAbility === 'soul_siphon') title = "Soul Siphon"
            else if (evo.evolvedAbility === 'silver_tt33') title = "Silver TT33"
            else if (evo.evolvedAbility === 'melter') title = "The Melter"
            
            return {
                id: `evolve_${evo.evolvedAbility}`,
                title: title,
                desc: "ULTIMATE EVOLUTION: Massive power spike!",
                minLevel: 0,
                rarity: 'Evolution',
                type: 'evolution' as const
            }
        })

        // Check Capacity & Levels
        const minActiveLevel = abilitySystem.getMinActiveLevel()
        const minPassiveLevel = abilitySystem.getMinPassiveLevel()

        const validActives = actives.filter(a => {
            const level = abilitySystem.getAbilityLevel(a.id as AbilityType)
            const passesLevelCheck = level < 5
            const passesAddCheck = level === 0 ? abilitySystem.canAddActive() : true
            const passesGatingCheck = level === 0 ? (gatingLevel >= (a.minLevel ?? 0)) : true
            // Can only upgrade if all owned weapons are at this level or higher
            const passesBalanceCheck = level === 0 || level <= minActiveLevel

            return passesLevelCheck && passesAddCheck && passesGatingCheck && passesBalanceCheck
        })

        const validPassives = passives.filter(p => {
            const level = abilitySystem.getPassiveLevel(p.id as PassiveType)
            if (level === 0) {
                if (gatingLevel < (p.minLevel ?? 0)) return false
                return abilitySystem.canAddPassive()
            }
            // Can only upgrade if all owned passives are at this level or higher
            const passesBalanceCheck = level <= minPassiveLevel
            return level < 5 && passesBalanceCheck
        })

        // Build result with all valid choices
        const result: LevelUpChoice[] = []

        // Add all valid actives with dynamic descriptions
        for (const item of validActives) {
            const level = abilitySystem.getAbilityLevel(item.id as AbilityType)
            const nextDesc = abilitySystem.getUpgradeDescription(item.id, level + 1)
            const desc = level > 0 ? `Lv${level + 1}: ${nextDesc}` : nextDesc
            result.push({ ...item, desc, level })
        }

        // Add all valid passives with dynamic descriptions
        for (const item of validPassives) {
            const level = abilitySystem.getPassiveLevel(item.id as PassiveType)
            const nextDesc = abilitySystem.getUpgradeDescription(item.id, level + 1)
            const desc = level > 0 ? `Lv${level + 1}: ${nextDesc}` : nextDesc
            result.push({ ...item, desc, level })
        }

        // Add all evolutions
        for (const item of evos) {
            result.push({ ...item, level: 0 })
        }

        return result
    }
}
