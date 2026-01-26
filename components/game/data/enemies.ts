const enemies = [
    {
        "id": "drifter",
        "name": "Upiór Drifter",
        "hp": 10,
        "damage": 10,
        "speed": 3.0,
        "description": "Basic chaser"
    },
    {
        "id": "screecher",
        "name": "Strzyga Screecher",
        "hp": 20,
        "damage": 15,
        "speed": 5.0,
        "description": "Fast flanker"
    },
    {
        "id": "bruiser",
        "name": "Vurdalak Bruiser",
        "hp": 50,
        "damage": 25,
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
        "hp": 5000,
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
        "hp": 100,
        "damage": 30,
        "speed": 1.5,
        "description": "Extremely tough and slow. Hard to take down."
    },
    {
        "id": "spirit_wolf",
        "name": "Spirit Wolf",
        "hp": 40,
        "damage": 20,
        "speed": 6.0,
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
        "hp": 2500,
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
        "hp": 4000,
        "damage": 75,
        "speed": 2.0,
        "description": "Mini-boss. Periodically charges at the player."
    },
    {
        "id": "shadow_stalker",
        "name": "Shadow Stalker",
        "hp": 75,
        "damage": 35,
        "speed": 7.0,
        "description": "Becomes invisible and dashes to the player's last location."
    },
    {
        "id": "forest_wraith",
        "name": "Forest Wraith",
        "hp": 120,
        "damage": 30,
        "speed": 3.0,
        "description": "Elite enemy. Curses the player, reducing their defense."
    },
    {
        "id": "guardian_golem",
        "name": "Guardian Golem",
        "hp": 3000,
        "damage": 70,
        "speed": 2.2,
        "description": "Mini-boss. Creates rock walls to trap the player."
    },
    {
        "id": "werewolf",
        "name": "Werewolf Alpha",
        "hp": 800,
        "damage": 40,
        "speed": 6.5,
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
        "hp": 15000,
        "damage": 100,
        "speed": 3.0,
        "description": "Lord of Darkness. Summons minions and casts powerful spells."
    }
];

export default enemies;
