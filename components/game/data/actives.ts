const actives = [
    {
        "id": "garlic",
        "name": "Czosnek Halo\n(Garlic Halo)",
        "description": "A damaging aura that keeps spirits at bay.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Circle",
        "tags": [
            "area",
            "ritual"
        ]
    },
    {
        "id": "dagger",
        "name": "Hussar Lances",
        "description": "Shoot piercing blades in movement direction.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Sword",
        "tags": [
            "projectile",
            "ritual"
        ]
    },
    {
        "id": "holywater",
        "name": "Svyata Voda\n(Holy Water)",
        "description": "Create lingering damage pools on the ground.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Zap",
        "tags": [
            "zone",
            "ritual"
        ]
    },
    {
        "id": "stake",
        "name": "Aspen Stake",
        "description": "Auto-targets nearest enemies with high damage.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Sword",
        "tags": [
            "projectile",
            "ritual"
        ]
    },
    {
        "id": "cross",
        "name": "Krzyż Boomerang\n(Cross Boomerang)",
        "description": "A holy cross that returns to you, piercing enemies.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 2,
        "icon": "RotateCcw",
        "tags": [
            "projectile",
            "ritual"
        ]
    },
    {
        "id": "salt",
        "name": "Solny Krąg\n(Salt Circle)",
        "description": "A protective circle of salt that wards off spirits.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 3,
        "icon": "Circle",
        "tags": [
            "zone",
            "ritual"
        ]
    },
    {
        "id": "tt33",
        "name": "TT33 Handgun",
        "description": "Rapid single shots at nearest enemy. Likes crit.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 3,
        "icon": "Sword",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "peppermill",
        "name": "Peppermill Gun",
        "description": "Sprays bullets like spices everywhere.",
        "category": "ActiveWeapon",
        "rarity": "Uncommon",
        "minLevel": 3,
        "icon": "Cloud",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "gzhel_smg",
        "name": "Gzhel SMG",
        "description": "Fine china rapid fire. Fragile but deadly.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 7,
        "icon": "Crosshair",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "shank",
        "name": "Babushka's Shank",
        "description": "Short range, high bleed damage.",
        "category": "ActiveWeapon",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Sword",
        "tags": [
            "melee",
            "contraband"
        ]
    },
    {
        "id": "kabar",
        "name": "Kabar Knife",
        "description": "Military grade steel. Slices through armor.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 4,
        "icon": "Sword",
        "tags": [
            "melee",
            "contraband"
        ]
    },
    {
        "id": "knuckles",
        "name": "Ceramic Knuckles",
        "description": "Hard-hitting melee punches.",
        "category": "ActiveWeapon",
        "rarity": "Uncommon",
        "minLevel": 3,
        "icon": "Circle",
        "tags": [
            "melee",
            "contraband"
        ]
    },
    {
        "id": "stilleto",
        "name": "Stilleto",
        "description": "Throwing knives that pierce multiple enemies.",
        "category": "ActiveWeapon",
        "rarity": "Rare",
        "minLevel": 6,
        "icon": "Sword",
        "tags": [
            "projectile",
            "contraband"
        ]
    },
    {
        "id": "grail",
        "name": "Gopnik Grail",
        "description": "Spills holy liquid that damages enemies and heals you.",
        "category": "ActiveWeapon",
        "rarity": "Legendary",
        "minLevel": 11,
        "icon": "Beaker",
        "tags": [
            "area",
            "ritual"
        ]
    },
    {
        "id": "soviet_stick",
        "name": "Soviet Stick",
        "description": "A symbol of authority. Huge knockback.",
        "category": "ActiveWeapon",
        "rarity": "Uncommon",
        "minLevel": 2,
        "icon": "Sword",
        "tags": [
            "melee",
            "contraband"
        ]
    },
    {
        "id": "skull_screen",
        "name": "Skull Screen",
        "description": "Rotating skulls that block projectiles and damage enemies.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 9,
        "icon": "Skull",
        "tags": [
            "area",
            "ritual"
        ]
    },
    {
        "id": "visors",
        "name": "Orthodox Visors",
        "description": "Shoots holy lasers from eyes.",
        "category": "ActiveWeapon",
        "rarity": "Legendary",
        "minLevel": 13,
        "icon": "Zap",
        "tags": [
            "projectile",
            "ritual"
        ]
    },
    {
        "id": "propaganda_tower",
        "name": "Propaganda Tower",
        "description": "Deploy stationary towers that damage and slow.",
        "category": "Deployable",
        "rarity": "Rare",
        "minLevel": 4,
        "icon": "Trophy",
        "tags": [
            "deployable",
            "contraband"
        ]
    },
    {
        "id": "kvass_reactor",
        "name": "Kvass Reactor",
        "description": "Deploys a healing zone that boosts speed.",
        "category": "Deployable",
        "rarity": "Epic",
        "minLevel": 6,
        "icon": "Beaker",
        "tags": [
            "deployable",
            "contraband"
        ]
    },
    {
        "id": "ak_radioactive",
        "name": "Radioactive AK",
        "description": "Fast nuclear bursts. Chance to melt enemies.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 6,
        "icon": "Zap",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "ak_ghzel",
        "name": "Ghzel AK",
        "description": "Artisanal precision. High critical hit chance.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 6,
        "icon": "Crosshair",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "ak_corrupted",
        "name": "Corrupted AK",
        "description": "Demonic weapon that siphons life from foes.",
        "category": "ActiveWeapon",
        "rarity": "Legendary",
        "minLevel": 7,
        "icon": "Skull",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "ak_mushroom",
        "name": "Mushroom AK",
        "description": "Fires rounds that burst into toxic spore clouds.",
        "category": "ActiveWeapon",
        "rarity": "Epic",
        "minLevel": 9,
        "icon": "Cloud",
        "tags": [
            "projectile",
            "gun",
            "contraband"
        ]
    },
    {
        "id": "nuclear_pigeon",
        "name": "Nuclear Pigeon",
        "description": "A radioactive companion that orbits and protects.",
        "category": "Companion",
        "rarity": "Legendary",
        "minLevel": 9,
        "icon": "Bird",
        "tags": [
            "companion",
            "contraband"
        ]
    },
    {
        "id": "vampire_rat",
        "name": "Vampire Rat",
        "description": "Scurries around biting enemies for you.",
        "category": "Companion",
        "rarity": "Rare",
        "minLevel": 3,
        "icon": "Skull",
        "tags": [
            "companion",
            "ritual"
        ]
    },
    {
        "id": "pig_luggage",
        "name": "Pig Luggage",
        "description": "Follows you and occasionally drops ammo/food.",
        "category": "Companion",
        "rarity": "Uncommon",
        "minLevel": 3,
        "icon": "Car",
        "tags": [
            "companion",
            "contraband"
        ]
    },
    {
        "id": "lada",
        "name": "Lada Vehicle",
        "description": "Periodic armored push. Crust anything in your path.",
        "category": "Vehicle",
        "rarity": "Legendary",
        "minLevel": 11,
        "icon": "Car",
        "tags": [
            "vehicle",
            "contraband"
        ]
    },
    {
        "id": "big_biz_lada",
        "name": "Big Biz Lada",
        "description": "Gold plated tankiness. Generates coins while driving.",
        "category": "Vehicle",
        "rarity": "Legendary",
        "minLevel": 15,
        "icon": "Car",
        "tags": [
            "vehicle",
            "contraband"
        ]
    },
    {
        "id": "dadushka_chair",
        "name": "Dadushka Chair",
        "description": "Comfortable slaughter. Slow but high armor.",
        "category": "Vehicle",
        "rarity": "Rare",
        "minLevel": 7,
        "icon": "Car",
        "tags": [
            "vehicle",
            "contraband"
        ]
    },
    {
        "id": "gopnik_gondola",
        "name": "Gopnik Gondola",
        "description": "Float over enemies. Ignores terrain collision.",
        "category": "Vehicle",
        "rarity": "Epic",
        "minLevel": 12,
        "icon": "Car",
        "tags": [
            "vehicle",
            "contraband"
        ]
    },
    {
        "id": "tank_stroller",
        "name": "Tank Stroller",
        "description": "Heavily armored personal transport.",
        "category": "Vehicle",
        "rarity": "Epic",
        "minLevel": 10,
        "icon": "Shield",
        "tags": [
            "vehicle",
            "contraband"
        ]
    },
    {
        "id": "haunted_lada",
        "name": "Haunted Lada",
        "description": "Ghost car that phases through enemies dealing cold damage.",
        "category": "Vehicle",
        "rarity": "Legendary",
        "minLevel": 13,
        "icon": "Cloud",
        "tags": [
            "vehicle",
            "ritual"
        ]
    }
];

export default actives;
