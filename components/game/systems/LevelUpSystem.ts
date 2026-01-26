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
                const validActives = actives.filter(a => {
                    const level = abilitySystem.getAbilityLevel(a.id as AbilityType)
                    const passesLevelCheck = level < 5
                    const passesAddCheck = level === 0 ? abilitySystem.canAddActive() : true // Can always upgrade if owned
                    const passesGatingCheck = level === 0 ? (gatingLevel >= (a.minLevel ?? 0)) : true // Gating only for new items
        
                    return passesLevelCheck && passesAddCheck && passesGatingCheck
                })
        
                const validPassives = passives.filter(p => {
                    const level = abilitySystem.getPassiveLevel(p.id as PassiveType)
            if (level === 0) {
                if (gatingLevel < (p.minLevel ?? 0)) return false
                return abilitySystem.canAddPassive()
            }
            return level < 5
        })

        const rarities: Record<string, number> = {
            'Common': 100,
            'Uncommon': 60,
            'Rare': 30,
            'Epic': 15,
            'Legendary': 5,
            'Evolution': 2
        }

        const luck = player.stats.luck || 1.0
        
        // Build weighted pool
        const poolWithWeights = [
            ...validActives.map(item => ({
                item,
                weight: (rarities[item.rarity] || 100) * (item.rarity === 'Common' ? 1 : luck)
            })),
            ...validPassives.map(item => ({
                item,
                weight: (rarities[item.rarity] || 100) * (item.rarity === 'Common' ? 1 : luck)
            })),
            ...evos.map(item => ({
                item,
                weight: (rarities['Evolution'] || 2) * luck
            }))
        ]

        const result: LevelUpChoice[] = []

        // Select up to 4 unique items
        // We clone the pool so we can remove selected items
        const currentPool = [...poolWithWeights]

        while (result.length < 4 && currentPool.length > 0) {
            const totalWeight = currentPool.reduce((sum, entry) => sum + entry.weight, 0)
            let random = rng.next() * totalWeight
            
            let foundIndex = -1
            for (let i = 0; i < currentPool.length; i++) {
                random -= currentPool[i].weight
                if (random <= 0) {
                    foundIndex = i
                    break
                }
            }

            if (foundIndex !== -1) {
                const selectedEntry = currentPool.splice(foundIndex, 1)[0]
                const selected = selectedEntry.item
                
                // Generate dynamic description
                let desc = selected.desc
                if (selected.type !== 'evolution') {
                    const level = selected.type === 'active' 
                        ? abilitySystem.getAbilityLevel(selected.id as AbilityType)
                        : abilitySystem.getPassiveLevel(selected.id as PassiveType)
                    
                    const nextDesc = abilitySystem.getUpgradeDescription(selected.id, level + 1)
                    desc = level > 0 ? `Level ${level + 1}: ${nextDesc}` : `New: ${nextDesc}`
                }

                result.push({ ...selected, desc })
            } else {
                break
            }
        }

        return result
    }
}
