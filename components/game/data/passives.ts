const passives = [
    // === COMMON PASSIVES (minLevel 1-3) ===
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

    // === UNCOMMON PASSIVES (minLevel 4-7) ===
    {
        "id": "dove_coin",
        "name": "Dove Coin",
        "description": "+20% Luck. Better drops and crits.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 4,
        "statBonus": {
            "luck": 0.2
        }
    },
    {
        "id": "garlic_ring",
        "name": "Garlic Charm",
        "description": "+15% Ability Area. Smells powerful.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 4,
        "statBonus": {
            "areaMultiplier": 0.15
        }
    },
    {
        "id": "bone_charm",
        "name": "Bone Charm",
        "description": "+10% Damage, +10 Max HP. Ancient relic.",
        "category": "Passive",
        "rarity": "Uncommon",
        "minLevel": 5,
        "statBonus": {
            "damageMultiplier": 0.10,
            "maxHp": 10
        }
    },

    // === RARE PASSIVES (minLevel 8-13) ===
    {
        "id": "holy_bread",
        "name": "Holy Bread",
        "description": "+40 Max Health. Blessed sustenance.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 8,
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
        "minLevel": 9,
        "statBonus": {
            "armor": 3.0
        }
    },
    {
        "id": "crypt_lantern",
        "name": "Crypt Lantern",
        "description": "+15% Ability Area, +0.5 HP/sec Regen. Guiding light.",
        "category": "Passive",
        "rarity": "Rare",
        "minLevel": 10,
        "statBonus": {
            "areaMultiplier": 0.15,
            "regen": 0.5
        }
    },

    // === EPIC PASSIVES (minLevel 14-19) ===
    {
        "id": "holy_cheese",
        "name": "Holy Cheese",
        "description": "+2.0 HP/sec Regeneration. Blessed dairy.",
        "category": "Passive",
        "rarity": "Epic",
        "minLevel": 14,
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
        "minLevel": 15,
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
        "minLevel": 16,
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
        "minLevel": 18,
        "statBonus": {
            "armor": 2.0,
            "damageMultiplier": 0.15
        }
    },

    // === LEGENDARY PASSIVES (minLevel 20+) ===
    {
        "id": "sunflower_pouch",
        "name": "Infinite Sunflower Pouch",
        "description": "+1 Projectile to all weapons. Seeds forever.",
        "category": "Passive",
        "rarity": "Legendary",
        "minLevel": 20,
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
        "minLevel": 22,
        "statBonus": {
            "cooldownMultiplier": -0.20
        }
    }
];

export default passives;
