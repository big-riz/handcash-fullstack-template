const passives = [
    // === COMMON PASSIVES (minLevel 1) ===
    {
        "id": "beer_coin",
        "name": "Beer Coin",
        "description": "+0.3 Speed, +1 Armor. Slightly wobbly.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "statBonus": {
            "moveSpeed": 0.3,
            "armor": 1.0
        }
    },
    {
        "id": "boss_shoe",
        "name": "Boss Shoe",
        "description": "+0.5 Movement Speed. Walk like a boss.",
        "category": "Passive",
        "rarity": "Common",
        "minLevel": 1,
        "statBonus": {
            "moveSpeed": 0.5
        }
    },

    // === UNCOMMON PASSIVES (minLevel 2-3) ===
    {
        "id": "dove_coin",
        "name": "Dove Coin",
        "description": "+20% Luck. Better drops and crits.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 2,
        "statBonus": {
            "luck": 0.2
        }
    },
    {
        "id": "garlic_ring",
        "name": "Garlic Ring",
        "description": "+15% Ability Area. Smells powerful.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 2,
        "statBonus": {
            "areaMultiplier": 0.15
        }
    },

    // === RARE PASSIVES (minLevel 3-5) ===
    {
        "id": "holy_bread",
        "name": "Holy Bread",
        "description": "+40 Max Health. Blessed sustenance.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 3,
        "statBonus": {
            "maxHp": 40
        }
    },
    {
        "id": "battle_scarf",
        "name": "Babushka's Battle Scarf",
        "description": "+3 Armor. Warm and protective.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 4,
        "statBonus": {
            "armor": 3.0
        }
    },

    // === EPIC PASSIVES (minLevel 6-8) ===
    {
        "id": "holy_cheese",
        "name": "Holy Cheese",
        "description": "+2.0 HP/sec Regeneration. Blessed dairy.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 5,
        "statBonus": {
            "regen": 2.0
        }
    },
    {
        "id": "spy_hat",
        "name": "Gopnik Spy Hat",
        "description": "+20% Critical Hit Chance. See everything.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 6,
        "statBonus": {
            "crit": 0.2
        }
    },
    {
        "id": "infinity_purse",
        "name": "Babushka's Infinity Purse",
        "description": "+20% Experience Gain. Bottomless knowledge.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 7,
        "statBonus": {
            "growth": 0.2
        }
    },
    {
        "id": "ruby_ushanka",
        "name": "Ruby Ushanka",
        "description": "+2 Armor, +15% Damage. Royal headwear.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 8,
        "statBonus": {
            "armor": 2.0,
            "damageMultiplier": 0.15
        }
    },

    // === LEGENDARY PASSIVES (minLevel 9+) ===
    {
        "id": "sunflower_pouch",
        "name": "Infinite Sunflower Pouch",
        "description": "+1 Projectile to all weapons. Seeds forever.",
        "category": "Passive",
        "rarity": "Legendary",
        "minLevel": 9,
        "statBonus": {
            "amount": 1
        }
    },
    {
        "id": "pickled_gpu",
        "name": "Pickled GPU",
        "description": "-20% Cooldowns. Overclocked fermentation.",
        "category": "Passive",
        "rarity": "Legendary",
        "minLevel": 10,
        "statBonus": {
            "cooldownMultiplier": -0.20
        }
    }
];

export default passives;
