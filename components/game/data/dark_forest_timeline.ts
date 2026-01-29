export interface TimelineEvent {
    time: number; // Time in seconds
    enemyType: string;
    count: number;
    isBoss?: boolean;
    isElite?: boolean;
    message?: string;
}

// Voice Lines (used in gameplay):
// - Level Up: "LEVEL UP! You are growing stronger like mighty bear eating honey!"
// - Weapon Evolved: "WEAPON EVOLVED! Now you smash enemies like babushka smashes potatoes!"
// - Boss Approaching: "BIG BOSS IS COMING! Hide behind the turnips!"
// - Player Hurt: "Oof! That hurt more than stepping on LEGO in cold Siberian night!"
// - Victory: "VICTORY! You are champion! Even the bears applaud!"
// - Choose Upgrade: "Choose wisely comrade! Wrong choice means more potatoes to peel!"

export const darkForestTimeline: TimelineEvent[] = [
    // --- Phase 1: Aggressive Start (0:00 - 1:30) ---
    // Immediate pressure - enemies spawn fast and close
    { time: 0.5, enemyType: 'drifter', count: 6 },
    { time: 1.5, enemyType: 'drifter', count: 8 },
    { time: 2.5, enemyType: 'sapling', count: 10 },
    { time: 4, enemyType: 'drifter', count: 10 },
    { time: 5.5, enemyType: 'screecher', count: 4 },
    { time: 7, enemyType: 'sapling', count: 12 },
    { time: 8.5, enemyType: 'drifter', count: 12 },
    { time: 10, enemyType: 'screecher', count: 5 },
    { time: 11.5, enemyType: 'drifter', count: 15 },
    { time: 13, enemyType: 'sapling', count: 15 },
    { time: 15, enemyType: 'drifter', count: 18 },
    { time: 17.5, enemyType: 'screecher', count: 6 },
    { time: 20, enemyType: 'drifter', count: 20 },
    { time: 22.5, enemyType: 'sapling', count: 18 },
    { time: 25, enemyType: 'bruiser', count: 2 },
    { time: 27.5, enemyType: 'drifter', count: 22 },
    { time: 30, enemyType: 'screecher', count: 8 },
    { time: 32.5, enemyType: 'drifter', count: 25 },
    { time: 35, enemyType: 'sapling', count: 20 },
    { time: 37.5, enemyType: 'drifter', count: 25 },
    { time: 40, enemyType: 'screecher', count: 10 },
    { time: 45, enemyType: 'sapling', count: 20 },
    { time: 50, enemyType: 'bruiser', count: 3 },
    { time: 55, enemyType: 'drifter', count: 28 },
    { time: 60, enemyType: 'domovoi', count: 30 },
    { time: 67.5, enemyType: 'screecher', count: 10 },
    { time: 75, enemyType: 'drifter', count: 30 },
    { time: 82.5, enemyType: 'tox_shroom', count: 8 },
    { time: 90, enemyType: 'bruiser', count: 5 },

    // --- Phase 2: Ramping Intensity (1:30 - 4:00) ---
    { time: 95, enemyType: 'forest_wraith', count: 1, isElite: true },
    { time: 100, enemyType: 'drifter', count: 35 },
    { time: 105, enemyType: 'domovoi', count: 40 },
    { time: 112.5, enemyType: 'screecher', count: 15 },
    { time: 120, enemyType: 'stone_golem', count: 3 },
    { time: 127.5, enemyType: 'tox_shroom', count: 12 },
    { time: 135, enemyType: 'sapling', count: 30 },
    { time: 142.5, enemyType: 'drifter', count: 40 },
    { time: 150, enemyType: 'werewolf', count: 1, isElite: true },
    { time: 160, enemyType: 'bruiser', count: 7 },
    { time: 170, enemyType: 'screecher', count: 20 },
    { time: 180, enemyType: 'domovoi', count: 50 },
    { time: 190, enemyType: 'stone_golem', count: 4 },
    { time: 200, enemyType: 'tox_shroom', count: 15 },
    { time: 210, enemyType: 'drifter', count: 50 },
    { time: 225, enemyType: 'spirit_wolf', count: 8 },
    { time: 240, enemyType: 'leshy_shaman', count: 3 },

    // --- Phase 3: The First Major Horde (4:00 - 6:00) ---
    { time: 245, enemyType: 'drifter', count: 60 },
    { time: 250, enemyType: 'screecher', count: 25 },
    { time: 255, enemyType: 'bruiser', count: 10 },
    { time: 262.5, enemyType: 'tox_shroom', count: 18 },
    { time: 270, enemyType: 'guardian_golem', count: 1, isBoss: true },
    { time: 275, enemyType: 'sapling', count: 40 },
    { time: 285, enemyType: 'domovoi', count: 60 },
    { time: 300, enemyType: 'werewolf', count: 2, isElite: true },
    { time: 315, enemyType: 'drifter', count: 50 },
    { time: 330, enemyType: 'stone_golem', count: 6 },
    { time: 345, enemyType: 'screecher', count: 30 },
    { time: 360, enemyType: 'spirit_wolf', count: 15 },

    // --- Phase 4: Arcane Threats Intensify (6:00 - 9:00) ---
    { time: 370, enemyType: 'leshy_shaman', count: 5 },
    { time: 380, enemyType: 'forest_wraith', count: 3, isElite: true },
    { time: 390, enemyType: 'bruiser', count: 12 },
    { time: 405, enemyType: 'tox_shroom', count: 20 },
    { time: 420, enemyType: 'spirit_wolf', count: 20 },
    { time: 435, enemyType: 'ancient_treant', count: 1, isBoss: true },
    { time: 440, enemyType: 'sapling', count: 50 },
    { time: 450, enemyType: 'leshy_shaman', count: 6 },
    { time: 465, enemyType: 'screecher', count: 25 },
    { time: 480, enemyType: 'stone_golem', count: 8 },
    { time: 495, enemyType: 'spirit_wolf', count: 25 },
    { time: 510, enemyType: 'werewolf', count: 4, isElite: true },
    { time: 525, enemyType: 'wasp_swarm', count: 5 },
    { time: 540, enemyType: 'drifter', count: 70 },

    // --- Phase 5: The Unrelenting Swarm (9:00 - 12:30) ---
    { time: 550, enemyType: 'domovoi', count: 80 },
    { time: 560, enemyType: 'golem_destroyer', count: 1, isBoss: true },
    { time: 570, enemyType: 'bruiser', count: 15 },
    { time: 585, enemyType: 'tox_shroom', count: 25 },
    { time: 600, enemyType: 'leshy_shaman', count: 8 },
    { time: 615, enemyType: 'spirit_wolf', count: 30 },
    { time: 630, enemyType: 'screecher', count: 40 },
    { time: 645, enemyType: 'wasp_swarm', count: 8 },
    { time: 660, enemyType: 'stone_golem', count: 10 },
    { time: 675, enemyType: 'shadow_stalker', count: 6 },
    { time: 690, enemyType: 'drifter', count: 80 },
    { time: 705, enemyType: 'domovoi', count: 100 },
    { time: 720, enemyType: 'ancient_treant', count: 2, isElite: true },
    { time: 735, enemyType: 'werewolf', count: 5, isElite: true },
    { time: 750, enemyType: 'guardian_golem', count: 2, isElite: true },

    // --- Phase 6: The Elite Hunt (12:30 - 14:30) ---
    { time: 760, enemyType: 'golem_destroyer', count: 1, isElite: true },
    { time: 770, enemyType: 'shadow_stalker', count: 10 },
    { time: 780, enemyType: 'leshy_shaman', count: 10 },
    { time: 795, enemyType: 'forest_wraith', count: 5, isElite: true },
    { time: 810, enemyType: 'spirit_wolf', count: 40 },
    { time: 825, enemyType: 'bruiser', count: 20 },
    { time: 840, enemyType: 'werewolf', count: 8, isElite: true },
    { time: 855, enemyType: 'shadow_stalker', count: 15 },
    { time: 870, enemyType: 'stone_golem', count: 15 },

    // --- Final Phase: The End Boss (14:30 - 15:00) ---
    { time: 885, enemyType: 'chernobog', count: 1, isBoss: true },
    { time: 887.5, enemyType: 'shadow_stalker', count: 10 },
    { time: 890, enemyType: 'forest_wraith', count: 5, isElite: true },
    { time: 892.5, enemyType: 'spirit_wolf', count: 20 },
    { time: 897.5, enemyType: 'drifter', count: 50 },
];
