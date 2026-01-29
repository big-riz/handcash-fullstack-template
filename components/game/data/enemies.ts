const enemies = [
    {
        "id": "drifter",
        "name": "Upiór Drifter",
        "hp": 15,
        "damage": 15,
        "speed": 3.0,
        "description": "Basic chaser"
    },
    {
        "id": "screecher",
        "name": "Strzyga Screecher",
        "hp": 35,
        "damage": 22,
        "speed": 5.0,
        "description": "Fast flanker"
    },
    {
        "id": "bruiser",
        "name": "Vurdalak Bruiser",
        "hp": 90,
        "damage": 35,
        "speed": 2.0,
        "description": "Slow tank"
    },
    {
        "id": "zmora",
        "name": "Zmora",
        "hp": 30,
        "damage": 18,
        "speed": 3.5,
        "description": "Ghost"
    },
    {
        "id": "domovoi",
        "name": "Domovoi Swarmlet",
        "hp": 5,
        "damage": 5,
        "speed": 4.0,
        "description": "Swarmlet"
    },
    {
        "id": "kikimora",
        "name": "Kikimora Snarer",
        "hp": 35,
        "damage": 20,
        "speed": 2.5,
        "description": "Snarer"
    },
    {
        "id": "leshy",
        "name": "Leshy",
        "hp": 15000,
        "damage": 50,
        "speed": 4.5,
        "description": "Forest Boss"
    },
    // --- NEW ENEMIES ---
    {
        "id": "sapling",
        "name": "Twisted Sapling",
        "hp": 8,
        "damage": 8,
        "speed": 2.8,
        "description": "Weak but numerous forest spawn."
    },
    {
        "id": "tox_shroom",
        "name": "Tox-Shroom",
        "hp": 25,
        "damage": 15,
        "speed": 1.0,
        "description": "Stationary, releases a damaging poison cloud on death."
    },
    {
        "id": "stone_golem",
        "name": "Stone Golem",
        "hp": 200,
        "damage": 45,
        "speed": 1.5,
        "description": "Extremely tough and slow. Hard to take down."
    },
    {
        "id": "spirit_wolf",
        "name": "Spirit Wolf",
        "hp": 80,
        "damage": 30,
        "speed": 5.5,
        "description": "Very fast, can pass through obstacles."
    },
    {
        "id": "leshy_shaman",
        "name": "Leshy Shaman",
        "hp": 60,
        "damage": 25,
        "speed": 2.5,
        "description": "Fires slow-moving projectiles and buffs other enemies."
    },
    {
        "id": "ancient_treant",
        "name": "Ancient Treant",
        "hp": 6000,
        "damage": 60,
        "speed": 1.0,
        "description": "Mini-boss. Summons saplings and has a stomp attack."
    },
    {
        "id": "wasp_swarm",
        "name": "Wasp Swarm",
        "hp": 50,
        "damage": 10,
        "speed": 5.5,
        "description": "A fast-moving swarm that is hard to hit."
    },
    {
        "id": "golem_destroyer",
        "name": "Golem Destroyer",
        "hp": 8000,
        "damage": 75,
        "speed": 2.0,
        "description": "Mini-boss. Periodically charges at the player."
    },
    {
        "id": "shadow_stalker",
        "name": "Shadow Stalker",
        "hp": 75,
        "damage": 35,
        "speed": 5.5,
        "description": "Becomes invisible and dashes to the player's last location."
    },
    {
        "id": "forest_wraith",
        "name": "Forest Wraith",
        "hp": 250,
        "damage": 45,
        "speed": 3.0,
        "description": "Elite enemy. Curses the player, reducing their defense."
    },
    {
        "id": "guardian_golem",
        "name": "Guardian Golem",
        "hp": 6000,
        "damage": 70,
        "speed": 2.2,
        "description": "Mini-boss. Creates rock walls to trap the player."
    },
    {
        "id": "werewolf",
        "name": "Werewolf Alpha",
        "hp": 1200,
        "damage": 50,
        "speed": 4.2,
        "description": "Elite enemy. Heals itself and enrages at low health."
    },
    {
        "id": "vodnik",
        "name": "Vodnik",
        "hp": 60,
        "damage": 20,
        "speed": 2.0,
        "description": "Aquatic creature that slows the player."
    },
    // Final Boss
    {
        "id": "chernobog",
        "name": "Chernobog",
        "hp": 30000,
        "damage": 100,
        "speed": 3.0,
        "description": "Lord of Darkness. Summons minions and casts powerful spells."
    },
    // --- CATACOMBS ENEMIES ---
    {
        "id": "frost_bat",
        "name": "Frost Bat",
        "hp": 15,
        "damage": 8,
        "speed": 5.5,
        "description": "Fast flying creature. Hard to hit but fragile."
    },
    {
        "id": "bone_crawler",
        "name": "Bone Crawler",
        "hp": 45,
        "damage": 22,
        "speed": 3.0,
        "description": "Skeletal horror that burrows and resurfaces near the player."
    },
    {
        "id": "flame_wraith",
        "name": "Flame Wraith",
        "hp": 70,
        "damage": 28,
        "speed": 5.0,
        "description": "Burning spirit that leaves fire trails."
    },
    {
        "id": "crypt_guardian",
        "name": "Crypt Guardian",
        "hp": 12000,
        "damage": 80,
        "speed": 1.8,
        "description": "Ancient underground boss. Summons bone crawlers and slams the ground."
    },
    // --- FROZEN WASTE ENEMIES ---
    {
        "id": "frost_elemental",
        "name": "Frost Elemental",
        "hp": 55,
        "damage": 22,
        "speed": 4.0,
        "description": "Living ice that creates slowing patches on the ground."
    },
    {
        "id": "snow_wraith",
        "name": "Snow Wraith",
        "hp": 180,
        "damage": 48,
        "speed": 5.5,
        "description": "Ghostly blizzard spirit that phases through obstacles."
    },
    {
        "id": "ice_golem",
        "name": "Ice Golem",
        "hp": 7000,
        "damage": 65,
        "speed": 1.5,
        "description": "Mini-boss. Massive frozen construct with devastating slam attacks."
    },
    {
        "id": "blizzard_wolf",
        "name": "Blizzard Wolf",
        "hp": 35,
        "damage": 16,
        "speed": 5.5,
        "description": "Fast frost-touched pack hunter. Attacks in groups."
    }
];

export default enemies;
