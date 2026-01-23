const passives = [
    {
        "id": "hp",
        "name": "Old World Heart",
        "description": "+20 Max Vitality & Full Recovery.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Heart",
        "statBonus": {
            "maxHp": 20
        }
    },
    {
        "id": "speed",
        "name": "Wild Spirit",
        "description": "+0.5 Movement Speed.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Zap",
        "statBonus": {
            "moveSpeed": 0.5
        }
    },
    {
        "id": "magnet",
        "name": "Amber Stone",
        "description": "+1.5 Collection Radius.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Magnet",
        "statBonus": {
            "magnet": 1.5
        }
    },
    {
        "id": "regen",
        "name": "Health Regen",
        "description": "+1.0 HP Regeneration per second.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 1,
        "icon": "Heart",
        "statBonus": {
            "regen": 1.0
        }
    },
    {
        "id": "iron",
        "name": "Zhelezo\n(Iron)",
        "description": "+1 Permanent Armor & Knockback Resist.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 1,
        "icon": "Shield",
        "statBonus": {
            "armor": 1.0
        }
    },
    {
        "id": "area",
        "name": "Vistula Reach",
        "description": "+15% Ability Area Multiplier.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 2,
        "icon": "Circle",
        "statBonus": {
            "areaMultiplier": 0.15
        }
    },
    {
        "id": "damage",
        "name": "Silver",
        "description": "+15% Total Damage Multiplier.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 4,
        "icon": "Beaker",
        "statBonus": {
            "damageMultiplier": 0.15
        }
    },
    {
        "id": "icon",
        "name": "Ikona\n(Icon)",
        "description": "+10% Cooldown Reduction.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 7,
        "icon": "RotateCcw",
        "statBonus": {
            "cooldownMultiplier": -0.10
        }
    },
    {
        "id": "garlic_ring",
        "name": "Garlic Ring",
        "description": "+10% Ability Area. Required for Soul Siphon.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 3,
        "icon": "Circle",
        "statBonus": {
            "areaMultiplier": 0.10
        }
    },
    {
        "id": "salt_passive",
        "name": "Sol\n(Salt)",
        "description": "+10% Area & +5% Damage.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 5,
        "icon": "Circle",
        "statBonus": {
            "areaMultiplier": 0.10,
            "damageMultiplier": 0.05
        }
    },
    {
        "id": "silver",
        "name": "Srebro\n(Silver)",
        "description": "+15% Total Damage Multiplier.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 4,
        "icon": "Beaker",
        "statBonus": {
            "damageMultiplier": 0.15
        }
    },
    {
        "id": "dove_coin",
        "name": "Dove Coin",
        "description": "Increases Luck by 20%. Birds love you.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 2,
        "icon": "Bird",
        "statBonus": {
            "luck": 0.2
        }
    },
    {
        "id": "beer_coin",
        "name": "Beer Coin",
        "description": "Slight movement wobbly speed (+0.2) and damage reduction.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "icon": "Beaker",
        "statBonus": {
            "moveSpeed": 0.2,
            "armor": 1.0
        }
    },
    {
        "id": "holy_bread",
        "name": "Holy Bread",
        "description": "Increases Max Health by 50.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 3,
        "icon": "Heart",
        "statBonus": {
            "maxHp": 50
        }
    },
    {
        "id": "holy_cheese",
        "name": "Holy Cheese",
        "description": "Tasty regeneration. +2.0 HP/sec.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 6,
        "icon": "Heart",
        "statBonus": {
            "regen": 2.0
        }
    },
    {
        "id": "sunflower_pouch",
        "name": "Infinite Sunflower Pouch",
        "description": "Seeds everywhere. +1 Amount to all projectiles.",
        "category": "Passive",
        "rarity": "Legendary",
        "minLevel": 9,
        "icon": "Cloud",
        "statBonus": {
            "amount": 1
        }
    },
    {
        "id": "infinity_purse",
        "name": "Babushka's Infinity Purse",
        "description": "Deep pockets. +50% Greed (Gold Gain).",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 7,
        "icon": "Trophy",
        "statBonus": {
            "greed": 0.5
        }
    },
    {
        "id": "spy_hat",
        "name": "Gopnik Spy Hat",
        "description": "See further. +20% Vision Range and Crit Chance.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 6,
        "icon": "Crosshair",
        "statBonus": {
            "crit": 0.2
        }
    },
    {
        "id": "pickled_gpu",
        "name": "Pickled GPU",
        "description": "Overclocked fermentation. -15% Cooldowns.",
        "category": "Passive",
        "rarity": "Legendary",
        "minLevel": 10,
        "icon": "Zap",
        "statBonus": {
            "cooldownMultiplier": -0.15
        }
    },
    {
        "id": "battle_scarf",
        "name": "Babushka's Battle Scarf",
        "description": "Warm and plotted. +3 Armor and slows attackers.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 5,
        "icon": "Shield",
        "statBonus": {
            "armor": 3.0
        }
    },
    {
        "id": "ruby_ushanka",
        "name": "Ruby Ushanka",
        "description": "Stylish protection. +2 Armor and +10% Damage.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 8,
        "icon": "Shield",
        "statBonus": {
            "armor": 2.0,
            "damageMultiplier": 0.1
        }
    }
];

export default passives;
