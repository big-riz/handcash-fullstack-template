export type GroundTexturePreset = 'none' | 'mossy_patches' | 'snow_ice' | 'stone_cracks' | 'dirt_mud' | 'grass_field' | 'custom'

export interface GroundTextureConfig {
    preset: GroundTexturePreset
    noiseScale: number          // frequency, 0.5–8.0
    secondaryColor: number      // hex blended with groundColor
    intensity: number           // blend strength 0–1
    octaves?: number            // default 3
    lacunarity?: number         // default 2.0
    persistence?: number        // default 0.5
    detailColor?: number        // optional fine detail color
    detailScale?: number        // detail noise frequency
    detailIntensity?: number    // detail blend strength
}

export interface WorldData {
    id: string
    name: string
    description: string
    maxLevel: number
    winCondition: 'level' | 'time' | 'kills'
    winValue: number // e.g. 10 for level, 300 for time (seconds)
    allowedUpgrades: string[] // 'all' or list of IDs
    availableEnemies: string[] // List of enemy types allowed in this world
    difficultyMultiplier: number
    lootThemeName: string
    theme: {
        skyColor: number
        groundColor: number
        groundTexture?: GroundTextureConfig
    }
    disableBackgroundSpawning?: boolean // If true, only timeline events spawn enemies
}

export const WORLDS: WorldData[] = [
    {
        id: 'dark_forest',
        name: 'Dark Forest',
        description: 'The ancient woods where Perun strikes.',
        maxLevel: 30,
        winCondition: 'level',
        winValue: 30,
        allowedUpgrades: [
            // Actives
            'tt33', 'shank', 'stilleto', 'peppermill', 'soviet_stick', 'stake',
            'knuckles', 'holywater', 'cross', 'kabar', 'dagger', 'grail', 'kvass_reactor', 'ak_radioactive',
            // Passives (All passives available)
            'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
            'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
            'bone_charm', 'crypt_lantern',
            // Evolutions
            'silver_tt33', 'vodka_flamethrower', 'phantom_blade',
            'assassins_edge', 'iron_fist', 'blessed_flood', 'divine_cross',
            'storm_blades', 'bone_daggers', 'blazing_stakes', 'eternal_grail', 'nuclear_spray'
        ],
        availableEnemies: [
            'drifter', 'screecher', 'bruiser', 'domovoi', 'werewolf', 'forest_wraith', 'guardian_golem',
            'sapling', 'tox_shroom', 'stone_golem', 'spirit_wolf', 'leshy_shaman',
            'ancient_treant', 'wasp_swarm', 'golem_destroyer', 'shadow_stalker', 'chernobog',
            'vodnik', 'leshy'
        ],
        difficultyMultiplier: 1.0,
        lootThemeName: 'ANCIENT RELICS',
        theme: {
            skyColor: 0x1a1e1a,
            groundColor: 0x3d453d,
            groundTexture: {
                preset: 'mossy_patches',
                noiseScale: 3.0,
                secondaryColor: 0x0a1a08,
                intensity: 0.85,
                octaves: 4,
                lacunarity: 2.0,
                persistence: 0.5,
                detailColor: 0x6a5030,
                detailScale: 6.0,
                detailIntensity: 0.3
            }
        }
    },
    {
        id: 'frozen_waste',
        name: 'Frozen Siberian Waste',
        description: 'A cold hell where only the strongest survive.',
        maxLevel: 50,
        winCondition: 'level',
        winValue: 50,
        allowedUpgrades: [
            // Actives
            'gzhel_smg', 'skull_screen', 'visors', 'kvass_reactor', 'haunted_lada',
            'propaganda_tower', 'nuclear_pigeon', 'tank_stroller', 'tt33',
            'holywater', 'cross', 'kabar', 'knuckles', 'shank', 'stilleto', 'dagger', 'grail',
            'stake', 'ak_radioactive',
            // Passives (All passives available)
            'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
            'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
            'bone_charm', 'crypt_lantern',
            // Evolutions
            'silver_tt33', 'melter', 'soul_siphon', 'immortal_lada',
            'propaganda_storm', 'death_pigeon', 'orbital_tank',
            'assassins_edge', 'iron_fist', 'blessed_flood', 'divine_cross',
            'storm_blades', 'bone_daggers', 'blazing_stakes', 'eternal_grail', 'nuclear_spray'
        ],
        availableEnemies: [
            'zmora', 'kikimora', 'drifter', 'bruiser',
            'screecher', 'spirit_wolf', 'stone_golem', 'ancient_treant', 'werewolf', 'leshy',
            'frost_elemental', 'snow_wraith', 'ice_golem', 'blizzard_wolf'
        ],
        difficultyMultiplier: 1.5,
        lootThemeName: 'SOVIET SURPLUS',
        theme: {
            skyColor: 0x88aabb,
            groundColor: 0xddeeff,
            groundTexture: {
                preset: 'snow_ice',
                noiseScale: 2.5,
                secondaryColor: 0x556688,
                intensity: 0.8,
                octaves: 3,
                lacunarity: 2.0,
                persistence: 0.45,
                detailColor: 0x99bbdd,
                detailScale: 5.0,
                detailIntensity: 0.25
            }
        }
    },
    {
        id: 'catacombs',
        name: 'Underground Catacombs',
        description: 'Ancient burial chambers beneath the Slavic lands. The dead do not rest easy.',
        maxLevel: 40,
        winCondition: 'level',
        winValue: 40,
        allowedUpgrades: [
            // Actives - mix of starter and mid-tier weapons
            'tt33', 'shank', 'knuckles', 'dagger', 'holywater', 'cross', 'kabar',
            'grail', 'stake', 'peppermill', 'soviet_stick', 'skull_screen', 'stilleto', 'kvass_reactor', 'ak_radioactive',
            // Passives (All passives available)
            'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
            'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
            'bone_charm', 'crypt_lantern',
            // Evolutions
            'silver_tt33', 'vodka_flamethrower', 'phantom_blade',
            'assassins_edge', 'iron_fist', 'blessed_flood', 'divine_cross', 'soul_siphon',
            'storm_blades', 'bone_daggers', 'blazing_stakes', 'eternal_grail', 'nuclear_spray'
        ],
        availableEnemies: [
            'drifter', 'screecher', 'bruiser', 'domovoi',
            'frost_bat', 'bone_crawler', 'flame_wraith', 'stone_golem', 'crypt_guardian'
        ],
        difficultyMultiplier: 1.2,
        lootThemeName: 'CRYPT TREASURES',
        theme: {
            skyColor: 0x0a0a15,
            groundColor: 0x2a2a35,
            groundTexture: {
                preset: 'stone_cracks',
                noiseScale: 4.0,
                secondaryColor: 0x050510,
                intensity: 0.9,
                octaves: 5,
                lacunarity: 2.2,
                persistence: 0.55,
                detailColor: 0x555568,
                detailScale: 8.0,
                detailIntensity: 0.25
            }
        }
    }
]
