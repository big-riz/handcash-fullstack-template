const characters = [
    {
        "id": "gopnik",
        "name": "Boris the Gopnik",
        "description": "Squatting champion. Starts with the trusty TT33 Pistol. High survival and speed.",
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
        }
    },
    {
        "id": "babushka",
        "name": "Babushka Zina",
        "description": "Don't mess with grandma. Starts with her trusty Shank and Holy Bread. Massive area effects.",
        "startingWeapon": "shank",
        "startingPassives": ["holy_bread"],
        "sprite": "babushka",
        "stats": {
            "maxHp": 80,
            "moveSpeed": 0.8,
            "might": 1.2,
            "area": 1.5,
            "luck": 1.2
        }
    },
    {
        "id": "hunter",
        "name": "Vadim Hunter",
        "description": "Professional monster slayer. Starts with Stilleto and Battle Scarf. Fast attacks.",
        "startingWeapon": "stilleto",
        "startingPassives": ["battle_scarf"],
        "sprite": "hunter",
        "stats": {
            "maxHp": 100,
            "moveSpeed": 1.1,
            "might": 1.1,
            "area": 0.9,
            "cooldownMultiplier": 0.8
        }
    },
    {
        "id": "biz_man",
        "name": "Big Biznisman",
        "description": "Time is money. Starts with Pig Luggage and Beer Coin. Rich and lucky.",
        "startingWeapon": "pig_luggage",
        "startingPassives": ["beer_coin"],
        "sprite": "biz_man",
        "stats": {
            "maxHp": 90,
            "moveSpeed": 1.0,
            "might": 1.0,
            "luck": 2.0,
            "greed": 2.0
        }
    },
    {
        "id": "oligarch",
        "name": "The Oligarch",
        "description": "Wealth is the ultimate armor. Starts with Lada and Infinity Purse. Tanky but slow.",
        "startingWeapon": "big_biz_lada",
        "startingPassives": ["infinity_purse"],
        "sprite": "oligarch",
        "stats": {
            "maxHp": 250,
            "moveSpeed": 0.6,
            "might": 0.7,
            "luck": 1.5,
            "armor": 10
        }
    },
    {
        "id": "chernobyl",
        "name": "Chernobyl Ghost",
        "description": "A remnant of the exclusion zone. Starts with Reactor, Pigeon, and Pickled GPU. Massive power, dying fast.",
        "startingWeapon": "kvass_reactor",
        "startingActives": ["nuclear_pigeon"],
        "startingPassives": ["pickled_gpu"],
        "sprite": "chernobyl",
        "stats": {
            "maxHp": 60,
            "moveSpeed": 1.1,
            "might": 2.5,
            "area": 3.0,
            "regen": -2.0,
            "curse": 1.5
        }
    },
    {
        "id": "spirit",
        "name": "Slavic Spirit",
        "description": "Pure energy and magic. Starts with Grail, Cross, and Ruby Ushanka. Infinite magic, zero armor.",
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
        }
    }
];

export default characters;
