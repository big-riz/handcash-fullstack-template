/**
 * Example Level Blueprints
 *
 * Well-designed levels demonstrating strong pacing, readable combat spaces,
 * fair difficulty curves, and interesting player choices. These blueprints
 * can be loaded via the automation system.
 */

import type { LevelBlueprint } from './level-automation'

/**
 * Haunted Grove - A 10-minute level with 6 phases
 *
 * Design principles:
 * - 3 enemy intro phases: each introduces 1-2 new enemy types
 * - Breathing room between intensity spikes (15-20s lulls)
 * - Elites gate mid-game, bosses gate late-game
 * - Total enemy count ramps logarithmically, not linearly
 * - Final 60s is an overwhelming "survive" phase
 * - Messages telegraph every new threat
 */
export const HAUNTED_GROVE_BLUEPRINT: LevelBlueprint = {
    id: 'example_haunted_grove',
    name: 'Haunted Grove',
    description: 'A cursed clearing where restless spirits gather. Survive 10 minutes to escape.',
    settings: {
        maxLevel: 25,
        winCondition: 'time',
        winValue: 600,
        difficultyMultiplier: 1.0,
        lootThemeName: 'CURSED RELICS',
        disableBackgroundSpawning: true,
        availableEnemies: [
            'drifter', 'screecher', 'bruiser', 'domovoi', 'sapling',
            'tox_shroom', 'spirit_wolf', 'forest_wraith', 'stone_golem',
            'werewolf', 'guardian_golem', 'shadow_stalker'
        ],
    },
    theme: { skyColor: 0x0d120d, groundColor: 0x2a3525 },
    border: { type: 'tree', size: 80 },

    // --- Timeline: 6 Phases ---
    timeline: [
        // Phase 1: Gentle Start (0:00 - 1:30)
        // Player learns movement and basic attacks
        { time: 1, enemyType: 'drifter', count: 5 },
        { time: 5, enemyType: 'drifter', count: 8 },
        { time: 10, enemyType: 'sapling', count: 6 },
        { time: 18, enemyType: 'drifter', count: 10 },
        { time: 25, enemyType: 'sapling', count: 10 },
        { time: 35, enemyType: 'drifter', count: 12 },
        { time: 45, enemyType: 'screecher', count: 3, message: 'Piercing cries echo from the mist!' },
        { time: 55, enemyType: 'drifter', count: 15 },
        { time: 65, enemyType: 'sapling', count: 12 },
        { time: 75, enemyType: 'screecher', count: 5 },
        { time: 85, enemyType: 'drifter', count: 18 },

        // Phase 2: First Escalation (1:30 - 3:00)
        // Bruisers and domovoi add tactical variety
        { time: 95, enemyType: 'bruiser', count: 2, message: 'Heavy footsteps shake the ground...' },
        { time: 105, enemyType: 'domovoi', count: 20 },
        { time: 115, enemyType: 'drifter', count: 20 },
        { time: 125, enemyType: 'screecher', count: 8 },
        { time: 135, enemyType: 'bruiser', count: 3 },
        { time: 145, enemyType: 'domovoi', count: 25 },
        { time: 155, enemyType: 'tox_shroom', count: 6, message: 'Toxic spores drift through the trees!' },
        { time: 165, enemyType: 'drifter', count: 22 },
        { time: 175, enemyType: 'sapling', count: 15 },

        // Phase 3: Spirit Assault (3:00 - 5:00)
        // Spirit wolves and wraiths require repositioning
        { time: 185, enemyType: 'spirit_wolf', count: 5, message: 'Ghostly howls surround you!' },
        { time: 195, enemyType: 'drifter', count: 25 },
        { time: 210, enemyType: 'domovoi', count: 30 },
        { time: 225, enemyType: 'spirit_wolf', count: 8 },
        { time: 235, enemyType: 'tox_shroom', count: 10 },
        { time: 250, enemyType: 'bruiser', count: 5 },
        { time: 260, enemyType: 'forest_wraith', count: 1, isElite: true, message: 'An ancient wraith materializes!' },
        { time: 270, enemyType: 'screecher', count: 12 },
        { time: 280, enemyType: 'drifter', count: 30 },
        { time: 295, enemyType: 'spirit_wolf', count: 10 },

        // Phase 4: The Stone Trial (5:00 - 7:00)
        // Stone golems force kiting; first boss test
        { time: 305, enemyType: 'stone_golem', count: 3, message: 'The earth trembles beneath you!' },
        { time: 315, enemyType: 'domovoi', count: 35 },
        { time: 330, enemyType: 'spirit_wolf', count: 12 },
        { time: 345, enemyType: 'bruiser', count: 7 },
        { time: 355, enemyType: 'forest_wraith', count: 2, isElite: true },
        { time: 365, enemyType: 'tox_shroom', count: 12 },
        { time: 380, enemyType: 'guardian_golem', count: 1, isBoss: true, message: 'The Guardian of the Grove awakens!' },
        { time: 385, enemyType: 'sapling', count: 25 },
        { time: 395, enemyType: 'stone_golem', count: 4 },
        { time: 410, enemyType: 'drifter', count: 35 },

        // Phase 5: The Hunt (7:00 - 9:00)
        // Werewolves and shadow stalkers punish standing still
        { time: 425, enemyType: 'werewolf', count: 2, isElite: true, message: 'The moon rises, and the hunt begins!' },
        { time: 435, enemyType: 'shadow_stalker', count: 4 },
        { time: 445, enemyType: 'domovoi', count: 40 },
        { time: 460, enemyType: 'spirit_wolf', count: 15 },
        { time: 475, enemyType: 'stone_golem', count: 5 },
        { time: 485, enemyType: 'werewolf', count: 3, isElite: true },
        { time: 495, enemyType: 'shadow_stalker', count: 8, message: 'Shadows lengthen and twist...' },
        { time: 510, enemyType: 'forest_wraith', count: 3, isElite: true },
        { time: 520, enemyType: 'bruiser', count: 10 },
        { time: 530, enemyType: 'screecher', count: 20 },

        // Phase 6: Final Stand (9:00 - 10:00)
        // Everything at once; pure survival
        { time: 540, enemyType: 'drifter', count: 50, message: 'The grove unleashes its fury!' },
        { time: 545, enemyType: 'domovoi', count: 50 },
        { time: 550, enemyType: 'spirit_wolf', count: 20 },
        { time: 555, enemyType: 'shadow_stalker', count: 10 },
        { time: 560, enemyType: 'stone_golem', count: 6 },
        { time: 565, enemyType: 'werewolf', count: 4, isElite: true },
        { time: 570, enemyType: 'guardian_golem', count: 1, isBoss: true, message: 'A second Guardian rises!' },
        { time: 575, enemyType: 'forest_wraith', count: 4, isElite: true },
        { time: 580, enemyType: 'drifter', count: 60 },
        { time: 585, enemyType: 'screecher', count: 25 },
        { time: 590, enemyType: 'tox_shroom', count: 15 },
        { time: 595, enemyType: 'bruiser', count: 12 },
    ],

    // Arena meshes - rocks and trees create natural cover
    meshes: [
        // Central clearing rocks (cover)
        { meshType: 'rock', position: { x: -8, y: 0, z: -5 }, scale: { x: 2, y: 2, z: 2 }, hasCollision: true },
        { meshType: 'rock', position: { x: 10, y: 0, z: 7 }, scale: { x: 1.5, y: 1.5, z: 1.5 }, hasCollision: true },
        { meshType: 'rock', position: { x: -3, y: 0, z: 12 }, scale: { x: 1.8, y: 1.8, z: 1.8 }, hasCollision: true },

        // Dead trees for atmosphere and light cover
        { meshType: 'tree_dead', position: { x: 15, y: 0, z: -10 }, scale: { x: 1.2, y: 1.2, z: 1.2 }, hasCollision: true },
        { meshType: 'tree_dead', position: { x: -20, y: 0, z: 8 }, scale: { x: 1.4, y: 1.4, z: 1.4 }, hasCollision: true },
        { meshType: 'tree_dead', position: { x: 5, y: 0, z: -18 }, scale: { x: 1.3, y: 1.3, z: 1.3 }, hasCollision: true },

        // Shrubs for visual interest (no collision)
        { meshType: 'shrub', position: { x: -12, y: 0, z: -15 }, hasCollision: false },
        { meshType: 'shrub', position: { x: 18, y: 0, z: 15 }, hasCollision: false },
        { meshType: 'shrub', position: { x: -18, y: 0, z: -8 }, hasCollision: false },

        // Ruins as chokepoint
        { meshType: 'ruins_brick', position: { x: 0, y: 0, z: -20 }, scale: { x: 2.5, y: 2.5, z: 2.5 }, hasCollision: true },
        { meshType: 'pillar_broken', position: { x: 4, y: 0, z: -18 }, scale: { x: 1.5, y: 1.5, z: 1.5 }, hasCollision: true },
        { meshType: 'pillar_broken', position: { x: -4, y: 0, z: -18 }, scale: { x: 1.5, y: 1.5, z: 1.5 }, hasCollision: true },
    ],

    // Decorative scatter
    scatterAreas: [
        { meshType: 'grass', center: { x: 0, y: 0 }, size: 40, density: 30 },
        { meshType: 'mushrooms', center: { x: -15, y: -10 }, size: 15, density: 60 },
        { meshType: 'foliage', center: { x: 12, y: 8 }, size: 20, density: 40 },
        { meshType: 'stones', center: { x: 5, y: -15 }, size: 10, density: 50 },
    ],
}

/**
 * Frozen Gauntlet - A shorter, intense 5-minute survival
 * Designed for experienced players. Higher enemy density, faster escalation.
 */
export const FROZEN_GAUNTLET_BLUEPRINT: LevelBlueprint = {
    id: 'example_frozen_gauntlet',
    name: 'Frozen Gauntlet',
    description: 'A brutal 5-minute challenge on frozen ground. Only the strongest survive.',
    settings: {
        maxLevel: 20,
        winCondition: 'time',
        winValue: 300,
        difficultyMultiplier: 1.3,
        lootThemeName: 'FROST SPOILS',
        disableBackgroundSpawning: true,
        availableEnemies: [
            'drifter', 'screecher', 'bruiser', 'zmora', 'kikimora',
            'blizzard_wolf', 'frost_elemental', 'ice_golem', 'snow_wraith',
            'spirit_wolf', 'frost_bat', 'stone_golem'
        ],
    },
    theme: { skyColor: 0x88aabb, groundColor: 0xccddee },
    border: { type: 'rock', size: 60 },

    timeline: [
        // Phase 1: Cold Start (0:00 - 1:00)
        { time: 1, enemyType: 'drifter', count: 8 },
        { time: 5, enemyType: 'zmora', count: 5, message: 'Zmora drift from the blizzard...' },
        { time: 12, enemyType: 'drifter', count: 12 },
        { time: 20, enemyType: 'kikimora', count: 4 },
        { time: 30, enemyType: 'zmora', count: 8 },
        { time: 40, enemyType: 'screecher', count: 6 },
        { time: 50, enemyType: 'drifter', count: 18 },

        // Phase 2: Frost Assault (1:00 - 2:30)
        { time: 60, enemyType: 'blizzard_wolf', count: 4, message: 'Frost-touched wolves encircle you!' },
        { time: 70, enemyType: 'zmora', count: 12 },
        { time: 80, enemyType: 'frost_bat', count: 8 },
        { time: 90, enemyType: 'bruiser', count: 4 },
        { time: 100, enemyType: 'blizzard_wolf', count: 6 },
        { time: 110, enemyType: 'kikimora', count: 8 },
        { time: 120, enemyType: 'drifter', count: 25 },
        { time: 130, enemyType: 'frost_elemental', count: 2, isElite: true, message: 'Ice elementals form from the storm!' },
        { time: 140, enemyType: 'spirit_wolf', count: 10 },

        // Phase 3: Ice Wall (2:30 - 4:00)
        { time: 155, enemyType: 'stone_golem', count: 3 },
        { time: 165, enemyType: 'snow_wraith', count: 5, message: 'Wraiths of snow and ice appear!' },
        { time: 175, enemyType: 'blizzard_wolf', count: 8 },
        { time: 185, enemyType: 'frost_bat', count: 12 },
        { time: 195, enemyType: 'ice_golem', count: 1, isBoss: true, message: 'The Ice Colossus rises!' },
        { time: 200, enemyType: 'zmora', count: 20 },
        { time: 210, enemyType: 'frost_elemental', count: 3, isElite: true },
        { time: 220, enemyType: 'drifter', count: 30 },
        { time: 230, enemyType: 'snow_wraith', count: 8 },

        // Phase 4: Blizzard Finale (4:00 - 5:00)
        { time: 240, enemyType: 'blizzard_wolf', count: 10, message: 'The blizzard reaches its peak!' },
        { time: 245, enemyType: 'drifter', count: 40 },
        { time: 250, enemyType: 'frost_elemental', count: 4, isElite: true },
        { time: 255, enemyType: 'zmora', count: 25 },
        { time: 260, enemyType: 'stone_golem', count: 5 },
        { time: 265, enemyType: 'snow_wraith', count: 10 },
        { time: 270, enemyType: 'ice_golem', count: 1, isBoss: true, message: 'Another Colossus emerges from the ice!' },
        { time: 275, enemyType: 'frost_bat', count: 15 },
        { time: 280, enemyType: 'spirit_wolf', count: 15 },
        { time: 285, enemyType: 'kikimora', count: 12 },
        { time: 290, enemyType: 'bruiser', count: 8 },
        { time: 295, enemyType: 'blizzard_wolf', count: 12 },
    ],

    meshes: [
        // Ice formations for cover
        { meshType: 'crystal', position: { x: -6, y: 0, z: -4 }, scale: { x: 2, y: 3, z: 2 }, hasCollision: true },
        { meshType: 'crystal', position: { x: 8, y: 0, z: 6 }, scale: { x: 1.5, y: 2.5, z: 1.5 }, hasCollision: true },
        { meshType: 'rock', position: { x: -10, y: 0, z: 10 }, scale: { x: 2.5, y: 2, z: 2.5 }, hasCollision: true },
        { meshType: 'rock', position: { x: 12, y: 0, z: -8 }, scale: { x: 2, y: 1.5, z: 2 }, hasCollision: true },
        // Crates for light cover
        { meshType: 'crate', position: { x: 0, y: 0, z: 15 }, hasCollision: true },
        { meshType: 'crate', position: { x: -2, y: 0, z: 15 }, hasCollision: true },
        { meshType: 'barrel', position: { x: 15, y: 0, z: 0 }, hasCollision: true },
    ],

    scatterAreas: [
        { meshType: 'stones', center: { x: 0, y: 0 }, size: 30, density: 20 },
        { meshType: 'debris', center: { x: -10, y: 5 }, size: 15, density: 40 },
    ],
}

export const EXAMPLE_BLUEPRINTS: Record<string, LevelBlueprint> = {
    haunted_grove: HAUNTED_GROVE_BLUEPRINT,
    frozen_gauntlet: FROZEN_GAUNTLET_BLUEPRINT,
}
