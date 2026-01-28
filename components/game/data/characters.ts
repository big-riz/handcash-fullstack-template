const characters = [
    {
        "id": "gopnik",
        "name": "Boris the Gopnik",
        "description": "Squatting champion. Master of street fighting. High survival and speed.",
        "startingWeapon": "tt33",
        "startingPassives": [],
        "sprite": "gopnik",
        "stats": {
            "maxHp": 120,
            "moveSpeed": 1.2,
            "might": 1.0,
            "area": 1.0,
            "armor": 2,
            "regen": 0.5
        },
        "arsenal": {
            "weapons": ["tt33", "knuckles", "peppermill", "gzhel_smg", "ak_radioactive"],
            "passives": ["beer_coin", "dove_coin", "spy_hat", "battle_scarf", "sunflower_pouch", "pickled_gpu", "holy_bread"]
        }
    },
    {
        "id": "babushka",
        "name": "Babushka Zina",
        "description": "Don't mess with grandma. Master of melee and healing. Massive area effects.",
        "startingWeapon": "shank",
        "startingPassives": ["holy_bread"],
        "sprite": "babushka",
        "stats": {
            "maxHp": 120,
            "moveSpeed": 1.0,
            "might": 1.2,
            "area": 1.5,
            "armor": 2,
            "regen": 0.3,
            "luck": 1.2
        },
        "arsenal": {
            "weapons": ["shank", "soviet_stick", "kabar", "grail", "holywater"],
            "passives": ["holy_bread", "garlic_ring", "holy_cheese", "ruby_ushanka", "infinity_purse", "dove_coin", "battle_scarf"]
        }
    },
    {
        "id": "hunter",
        "name": "Vadim Hunter",
        "description": "Professional monster slayer. Fast and precise with projectiles. Speed demon.",
        "startingWeapon": "stilleto",
        "startingPassives": ["battle_scarf"],
        "sprite": "hunter",
        "stats": {
            "maxHp": 100,
            "moveSpeed": 1.1,
            "might": 1.1,
            "area": 0.9,
            "cooldownMultiplier": 0.8
        },
        "arsenal": {
            "weapons": ["stilleto", "kabar", "peppermill", "visors", "dagger", "stake"],
            "passives": ["battle_scarf", "boss_shoe", "spy_hat", "pickled_gpu", "sunflower_pouch", "beer_coin", "bone_charm", "crypt_lantern"]
        }
    },
    {
        "id": "biz_man",
        "name": "Big Biznisman",
        "description": "Time is money. Companion specialist with high luck. Rich and greedy.",
        "startingWeapon": "pig_luggage",
        "startingPassives": ["beer_coin"],
        "sprite": "biz_man",
        "stats": {
            "maxHp": 90,
            "moveSpeed": 1.0,
            "might": 1.0,
            "luck": 2.0,
            "greed": 2.0
        },
        "arsenal": {
            "weapons": ["pig_luggage", "vampire_rat", "nuclear_pigeon", "propaganda_tower", "haunted_lada"],
            "passives": ["beer_coin", "infinity_purse", "ruby_ushanka", "sunflower_pouch", "pickled_gpu", "spy_hat", "holy_cheese"]
        }
    },
    {
        "id": "oligarch",
        "name": "The Oligarch",
        "description": "Wealth is the ultimate armor. Vehicle master. Tanky but slow.",
        "startingWeapon": "big_biz_lada",
        "startingPassives": ["infinity_purse"],
        "sprite": "oligarch",
        "stats": {
            "maxHp": 250,
            "moveSpeed": 0.75,
            "might": 0.85,
            "luck": 1.5,
            "armor": 10,
            "regen": 0.5
        },
        "arsenal": {
            "weapons": ["big_biz_lada", "tank_stroller", "dadushka_chair", "gopnik_gondola", "haunted_lada"],
            "passives": ["infinity_purse", "holy_bread", "ruby_ushanka", "garlic_ring", "holy_cheese"]
        }
    },
    {
        "id": "chernobyl",
        "name": "Chernobyl Ghost",
        "description": "A remnant of the exclusion zone. Nuclear damage specialist. Massive power, dying fast.",
        "startingWeapon": "kvass_reactor",
        "startingActives": ["nuclear_pigeon"],
        "startingPassives": ["pickled_gpu"],
        "sprite": "chernobyl",
        "stats": {
            "maxHp": 80,
            "moveSpeed": 1.1,
            "might": 2.5,
            "area": 3.0,
            "regen": -1.0,
            "curse": 1.5
        },
        "arsenal": {
            "weapons": ["kvass_reactor", "nuclear_pigeon", "skull_screen", "gzhel_smg", "ak_radioactive"],
            "passives": ["pickled_gpu", "garlic_ring", "ruby_ushanka", "sunflower_pouch", "holy_cheese", "spy_hat"]
        }
    },
    {
        "id": "spirit",
        "name": "Slavic Spirit",
        "description": "Pure energy and magic. Orbital and area specialist. Infinite magic, zero armor.",
        "startingWeapon": "grail",
        "startingActives": ["cross"],
        "startingPassives": ["ruby_ushanka"],
        "sprite": "spirit",
        "stats": {
            "maxHp": 40,
            "moveSpeed": 1.4,
            "might": 0.5,
            "cooldownMultiplier": 0.2,
            "armor": -5,
            "amount": 2
        },
        "arsenal": {
            "weapons": ["grail", "cross", "skull_screen", "visors", "salt"],
            "passives": ["ruby_ushanka", "garlic_ring", "pickled_gpu", "sunflower_pouch", "holy_cheese", "infinity_purse"]
        }
    },
    {
        "id": "necromancer",
        "name": "Koshchei the Deathless",
        "description": "His death is hidden far away. Master of curses and bone magic. Area control specialist.",
        "startingWeapon": "dagger",
        "startingActives": ["holywater"],
        "startingPassives": ["bone_charm"],
        "sprite": "necromancer",
        "stats": {
            "maxHp": 70,
            "moveSpeed": 1.0,
            "might": 1.5,
            "area": 2.0,
            "armor": 0,
            "regen": 0.2
        },
        "arsenal": {
            "weapons": ["dagger", "holywater", "skull_screen", "cross", "grail", "salt", "stake"],
            "passives": ["bone_charm", "crypt_lantern", "garlic_ring", "holy_cheese", "holy_bread", "spy_hat", "pickled_gpu", "infinity_purse"]
        }
    }
];

export default characters;
