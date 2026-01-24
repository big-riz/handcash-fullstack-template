const actives = [
    // === STARTER WEAPONS (Common, minLevel 1) ===
    {
        "id": "tt33",
        "name": "TT33 Pistol",
        "description": "Balanced shots at nearest enemy. Reliable.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "tags": ["projectile", "gun"]
    },
    {
        "id": "shank",
        "name": "Babushka's Shank",
        "description": "Very fast close-range stabs. High damage.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "tags": ["melee"]
    },
    {
        "id": "knuckles",
        "name": "Ceramic Knuckles",
        "description": "Slow but devastating punches. Massive hits.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "tags": ["melee"]
    },
    {
        "id": "stilleto",
        "name": "Stilleto",
        "description": "Fast throwing knives at multiple targets.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "tags": ["projectile"]
    },

    // === UNCOMMON WEAPONS (minLevel 2-3) ===
    {
        "id": "peppermill",
        "name": "Peppermill Gun",
        "description": "Rapid spray of bullets. Quantity over quality.",
        "category": "ActiveWeapon",
        "rarity": "Uncommon",
        "minLevel": 2,
        "tags": ["projectile", "gun"]
    },
    {
        "id": "soviet_stick",
        "name": "Soviet Stick",
        "description": "Slow heavy strikes. Massive damage per hit.",
        "category": "ActiveWeapon",
        "rarity": "Uncommon",
        "minLevel": 2,
        "tags": ["melee"]
    },
    {
        "id": "vampire_rat",
        "name": "Vampire Rat",
        "description": "Companion that scurries and bites enemies.",
        "category": "Companion",
        "rarity": "Uncommon",
        "minLevel": 3,
        "tags": ["companion"]
    },
    {
        "id": "pig_luggage",
        "name": "Pig Luggage",
        "description": "Companion that drops health pickups.",
        "category": "Companion",
        "rarity": "Uncommon",
        "minLevel": 3,
        "tags": ["companion"]
    },

    // === RARE WEAPONS (minLevel 4-6) ===
    {
        "id": "kabar",
        "name": "Kabar Knife",
        "description": "Armor-piercing blade. High single-target damage.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 4,
        "tags": ["melee"]
    },
    {
        "id": "grail",
        "name": "Gopnik Grail",
        "description": "Holy aura that damages nearby enemies.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 4,
        "tags": ["area"]
    },
    {
        "id": "propaganda_tower",
        "name": "Propaganda Tower",
        "description": "Deploy towers that damage and slow enemies.",
        "category": "Deployable",
        "rarity": "Rare",
        "minLevel": 5,
        "tags": ["deployable"]
    },
    {
        "id": "dadushka_chair",
        "name": "Dadushka Chair",
        "description": "Slow armored vehicle. High defense.",
        "category": "Vehicle",
        "rarity": "Rare",
        "minLevel": 6,
        "tags": ["vehicle"]
    },
    {
        "id": "tank_stroller",
        "name": "Tank Stroller",
        "description": "Armored transport. Crushes enemies.",
        "category": "Vehicle",
        "rarity": "Rare",
        "minLevel": 6,
        "tags": ["vehicle"]
    },

    // === EPIC WEAPONS (minLevel 7-10) ===
    {
        "id": "gzhel_smg",
        "name": "Gzhel SMG",
        "description": "Rapid bursts with high crit chance.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 7,
        "tags": ["projectile", "gun"]
    },
    {
        "id": "kvass_reactor",
        "name": "Kvass Reactor",
        "description": "Deploy healing zones that boost speed.",
        "category": "Deployable",
        "rarity": "Epic",
        "minLevel": 7,
        "tags": ["deployable"]
    },
    {
        "id": "skull_screen",
        "name": "Skull Screen",
        "description": "Orbiting skulls damage nearby enemies.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 8,
        "tags": ["orbital"]
    },
    {
        "id": "gopnik_gondola",
        "name": "Gopnik Gondola",
        "description": "Floating vehicle. Ignores terrain.",
        "category": "Vehicle",
        "rarity": "Epic",
        "minLevel": 9,
        "tags": ["vehicle"]
    },

    // === LEGENDARY WEAPONS (minLevel 11+) ===
    {
        "id": "visors",
        "name": "Orthodox Visors",
        "description": "Devastating holy lasers. High damage.",
        "category": "ActiveWeapon",
        "rarity": "Legendary",
        "minLevel": 10,
        "tags": ["projectile"]
    },
    {
        "id": "nuclear_pigeon",
        "name": "Nuclear Pigeon",
        "description": "Radioactive companion. Orbits and nukes.",
        "category": "Companion",
        "rarity": "Legendary",
        "minLevel": 11,
        "tags": ["companion"]
    },
    {
        "id": "haunted_lada",
        "name": "Haunted Lada",
        "description": "Ghost car. Phases through dealing cold damage.",
        "category": "Vehicle",
        "rarity": "Legendary",
        "minLevel": 12,
        "tags": ["vehicle"]
    },
    {
        "id": "big_biz_lada",
        "name": "Big Biz Lada",
        "description": "Gold tank. Generates coins while ramming.",
        "category": "Vehicle",
        "rarity": "Legendary",
        "minLevel": 14,
        "tags": ["vehicle"]
    }
];

export default actives;
