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
            // Actives
            'garlic', 'dagger', 'holywater', 'stake', 'cross', 'salt', 'ak_mushroom', 'nuclear_pigeon',
            'grail', 'skull_screen', 'visors', 'vampire_rat', 'haunted_lada', 'shank', 'knuckles',
            // Passives
            'hp', 'speed', 'magnet', 'area', 'damage', 'regen', 'garlic_ring', 'salt_passive',
            'dove_coin', 'holy_bread', 'holy_cheese', 'sunflower_pouch',
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
            // Actives
            'tt33', 'ak_radioactive', 'ak_ghzel', 'ak_corrupted', 'propaganda_tower', 'lada', 'nuclear_pigeon',
            'peppermill', 'gzhel_smg', 'kabar', 'stilleto', 'soviet_stick', 'kvass_reactor', 'pig_luggage',
            'big_biz_lada', 'dadushka_chair', 'gopnik_gondola', 'tank_stroller',
            // Passives
            'hp', 'speed', 'magnet', 'armor', 'damage', 'icon', 'silver', 'iron',
            'beer_coin', 'infinity_purse', 'spy_hat', 'pickled_gpu', 'battle_scarf', 'ruby_ushanka',
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
