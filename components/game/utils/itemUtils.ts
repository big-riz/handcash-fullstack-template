import activeData from '@/components/game/data/actives'
import passiveData from '@/components/game/data/passives'
import evolutionData from '@/components/game/data/evolutions'
import { ItemTemplate } from '@/lib/item-templates-storage'

export const getItemMetadata = (id: string) => {
    // Check evolutions first
    const evolution = evolutionData.find(e => e.id === id || `evolve_${e.id}` === id)
    if (evolution) return { ...evolution, type: 'evolution', icon: (evolution as any).icon || 'Trophy' }

    const active = activeData.find(a => (a as any).id === id)
    if (active) return { ...active, type: 'active' }

    const passive = passiveData.find(p => p.id === id)
    if (passive) return { ...passive, type: 'passive' }

    return null
}

export const getItemInfo = (id: string) => {
    const meta = getItemMetadata(id)
    if (meta) {
        return {
            name: meta.name.split('\n')[0], // Take first line of name
            desc: meta.description
        }
    }
    return { name: id, desc: "A mysterious power." }
}

// Emoji/Icon fallback map for when templates aren't loaded
export const DEFAULT_ITEM_EMOJIS: Record<string, string> = {
    // Starter Weapons
    'tt33': '🔫',
    'shank': '🔪',
    'knuckles': '👊',
    'stilleto': '🗡️',
    'cross': '✝️',

    // Uncommon Weapons
    'holy_water': '💧',
    'salt_line': '🧂',
    'ak47': '🔫',
    'peppermill': '🌶️',
    'propaganda': '📻',
    'lada': '🚗',
    'pigeon': '🕊️',

    // Rare+ Weapons
    'aspen_stake': '🪵',
    'ghzel_ak': '🔫',
    'corrupted_ak': '🔫',
    'mushroom_ak': '🍄',
    'radioactive_ak': '☢️',
    'tank_stroller': '🛒',

    // Passives - Food
    'garlic_ring': '🧄',
    'holy_bread': '🍞',
    'holy_cheese': '🧀',
    'pickled_gpu': '💾',
    'beer_coin': '🍺',
    'vodka_shot': '🥃',

    // Passives - Equipment
    'battle_scarf': '🧣',
    'boss_shoe': '👞',
    'gopnik_cap': '🧢',
    'spy_hat': '🎩',
    'ruby_ushanka': '👑',
    'babushka_coat': '🧥',

    // Passives - Coins/Items
    'dove_coin': '🕊️',
    'tracker_chip': '📡',
    'magnet_ore': '🧲',
    'clover_charm': '🍀',

    // Evolutions
    'soul_siphon': '💀',
    'silver_tt33': '🔫',
    'melter': '🔥',
    'vodka_flamethrower': '🔥',
    'phantom_blade': '👻',
    'orbital_tank': '🛸',
    'death_pigeon': '💀',
    'immortal_lada': '🚗',
    'propaganda_storm': '📻'
}

// Fallback placeholder images (empty for now, could be data URIs)
const DEFAULT_ITEM_IMAGES: Record<string, string> = {}

export const getItemEmoji = (id: string): string | undefined => {
    // Remove 'evolve_' prefix if present
    const cleanId = id.startsWith('evolve_') ? id.replace('evolve_', '') : id
    return DEFAULT_ITEM_EMOJIS[cleanId]
}

export const resolveItemIcon = (id: string, templates: ItemTemplate[]): string | undefined => {
    // If templates aren't loaded yet, return undefined
    if (!templates || !templates.length) {
        return DEFAULT_ITEM_IMAGES[id]
    }

    const meta = getItemMetadata(id)
    const name = meta?.name || id

    // Normalize name for better matching (remove line breaks, extra spaces)
    const normalizeName = (n: string) => n.toLowerCase().replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
    const normalizedSearchName = normalizeName(name)

    // Try exact match first
    let match = templates.find(t => normalizeName(t.name) === normalizedSearchName)
    if (match) {
        return match.imageUrl
    }

    // Try matching by ID directly
    match = templates.find(t => t.name.toLowerCase().includes(id.toLowerCase()) || id.toLowerCase().includes(t.name.toLowerCase()))
    if (match) {
        return match.imageUrl
    }

    // Try partial match
    match = templates.find(t => {
        const templateName = normalizeName(t.name)
        return templateName.includes(normalizedSearchName) || normalizedSearchName.includes(templateName)
    })
    if (match) {
        return match.imageUrl
    }

    // Try matching by key words (e.g., "TT33" matches "TT33 Handgun" or "TT33 Pistol")
    const searchWords = normalizedSearchName.split(' ').filter(w => w.length > 2)
    match = templates.find(t => {
        const templateWords = normalizeName(t.name).split(' ')
        return searchWords.some(sw => templateWords.some(tw => tw.includes(sw) || sw.includes(tw)))
    })
    if (match) {
        return match.imageUrl
    }

    return DEFAULT_ITEM_IMAGES[id]
}

