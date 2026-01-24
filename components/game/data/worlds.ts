export interface WorldData {
    id: string
    name: string
    description: string
    maxLevel: number
    winCondition: 'level' | 'time'
    winValue: number // e.g. 10 for level, 300 for time (seconds)
    allowedUpgrades: string[] // 'all' or list of IDs
    availableEnemies: string[] // List of enemy types allowed in this world
    difficultyMultiplier: number
    lootThemeName: string
    theme: {
        skyColor: number
        groundColor: number
    }
}

export const WORLDS: WorldData[] = [
    {
        id: 'dark_forest',
        name: 'Dark Forest',
        description: 'The ancient woods where Perun strikes.',
        maxLevel: 10,
        winCondition: 'level',
        winValue: 10,
        allowedUpgrades: [
            // Actives (Exactly 5 per world)
            'tt33', 'shank', 'stilleto', 'peppermill', 'soviet_stick',
            // Passives (All passives available)
            'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
            'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
            // Evolutions
            'soul_siphon'
        ],
        availableEnemies: ['drifter', 'screecher', 'bruiser', 'domovoi'],
        difficultyMultiplier: 1.0,
        lootThemeName: 'ANCIENT RELICS',
        theme: {
            skyColor: 0x1a1e1a,
            groundColor: 0x3d453d
        }
    },
    {
        id: 'frozen_waste',
        name: 'Frozen Siberian Waste',
        description: 'A cold hell where only the strongest survive.',
        maxLevel: 20,
        winCondition: 'level',
        winValue: 15,
        allowedUpgrades: [
            // Actives (Exactly 5 per world)
            'gzhel_smg', 'skull_screen', 'visors', 'kvass_reactor', 'haunted_lada',
            // Passives (All passives available)
            'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
            'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
            // Evolutions
            'silver_tt33', 'melter'
        ],
        availableEnemies: ['zmora', 'kikimora', 'drifter', 'bruiser'],
        difficultyMultiplier: 1.5,
        lootThemeName: 'SOVIET SURPLUS',
        theme: {
            skyColor: 0x88aabb,
            groundColor: 0xddeeff
        }
    }
]
