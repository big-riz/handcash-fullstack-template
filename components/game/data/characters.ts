const characters = [
    {
        "id": "gopnik",
        "name": "Boris the Gopnik",
        "description": "Squatting champion. Starts with the trusty TT33 Pistol.",
        "startingWeapon": "tt33",
        "sprite": "gopnik",
        "stats": {
            "maxHp": 100,
            "moveSpeed": 1.0,
            "might": 1.0,
            "area": 1.0
        }
    },
    {
        "id": "babushka",
        "name": "Babushka Zina",
        "description": "Don't mess with grandma. Starts with her trusty Shank.",
        "startingWeapon": "shank",
        "sprite": "babushka",
        "stats": {
            "maxHp": 80,
            "moveSpeed": 0.8,
            "might": 1.2,
            "area": 1.3
        }
    },
    {
        "id": "hunter",
        "name": "Vadim Hunter",
        "description": "Professional monster slayer. Starts with Stilleto knives.",
        "startingWeapon": "stilleto",
        "sprite": "hunter",
        "stats": {
            "maxHp": 120,
            "moveSpeed": 1.1,
            "might": 1.1,
            "area": 0.9
        }
    },
    {
        "id": "biz_man",
        "name": "Big Biznisman",
        "description": "Time is money. Starts with Pig Luggage companion.",
        "startingWeapon": "pig_luggage",
        "sprite": "biz_man",
        "stats": {
            "maxHp": 90,
            "moveSpeed": 1.0,
            "might": 1.0,
            "luck": 1.5
        }
    },
    {
        "id": "oligarch",
        "name": "The Oligarch",
        "description": "Wealth is the ultimate armor. High greed but very slow.",
        "startingWeapon": "big_biz_lada",
        "sprite": "oligarch",
        "stats": {
            "maxHp": 150,
            "moveSpeed": 0.7,
            "might": 0.8,
            "luck": 2.0
        }
    },
    {
        "id": "chernobyl",
        "name": "Chernobyl Ghost",
        "description": "A remnant of the exclusion zone. Massive area and damage, but losing life.",
        "startingWeapon": "kvass_reactor",
        "sprite": "chernobyl",
        "stats": {
            "maxHp": 70,
            "moveSpeed": 1.1,
            "might": 2.0,
            "area": 2.5,
            "regen": -1.0
        }
    },
    {
        "id": "spirit",
        "name": "Slavic Spirit",
        "description": "Pure energy and folklore magic. Near-instant cooldowns, but fragile.",
        "startingWeapon": "grail",
        "sprite": "spirit",
        "stats": {
            "maxHp": 50,
            "moveSpeed": 1.3,
            "might": 0.6,
            "cooldownMultiplier": 0.4
        }
    }
];

export default characters;
