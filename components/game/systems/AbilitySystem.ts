/**
 * AbilitySystem.ts
 * 
 * Manages all active abilities and weapons for the player.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { DaggerWeapon } from '../content/weapons/DaggerWeapon'
import { MeleeWeapon } from '../content/weapons/MeleeWeapon'
import { HolyWaterWeapon } from '../content/weapons/HolyWaterWeapon'
import { AspenStakeWeapon } from '../content/weapons/AspenStakeWeapon'
import { CrossWeapon } from '../content/weapons/CrossWeapon'
import { SaltLineWeapon } from '../content/weapons/SaltLineWeapon'
import { TT33Weapon } from '../content/weapons/TT33Weapon'
import { RadioactiveAKWeapon } from '../content/weapons/RadioactiveAKWeapon'
import { GhzelAKWeapon } from '../content/weapons/GhzelAKWeapon'
import { CorruptedAKWeapon } from '../content/weapons/CorruptedAKWeapon'
import { MushroomAKWeapon } from '../content/weapons/MushroomAKWeapon'
import { NuclearPigeon } from '../content/weapons/NuclearPigeon'
import { LadaVehicle } from '../content/weapons/LadaVehicle'
import { PropagandaTower } from '../content/weapons/PropagandaTower'
import { GarlicAura } from '../content/weapons/GarlicAura'
import { VFXManager } from './VFXManager'
import { AudioManager } from '../core/AudioManager'

export type AbilityType = 'dagger' | 'holywater' | 'stake' | 'cross' | 'salt' | 'tt33' | 'propaganda_tower' |
    'ak_radioactive' | 'ak_ghzel' | 'ak_corrupted' | 'ak_mushroom' | 'nuclear_pigeon' | 'lada' |
    'peppermill' | 'shank' | 'kabar' | 'knuckles' | 'stilleto' | 'grail' | 'soviet_stick' | 'skull_screen' | 'visors' |
    'kvass_reactor' | 'vampire_rat' | 'pig_luggage' | 'big_biz_lada' | 'dadushka_chair' | 'gopnik_gondola' | 'tank_stroller' | 'haunted_lada' | 'gzhel_smg' |
    'soul_siphon' | 'silver_tt33' | 'melter' |
    'vodka_flamethrower' | 'phantom_blade' | 'orbital_tank' | 'death_pigeon' | 'immortal_lada' | 'propaganda_storm' |
    'assassins_edge' | 'iron_fist' | 'blessed_flood' | 'divine_cross' |
    'storm_blades' | 'bone_daggers' | 'blazing_stakes' | 'eternal_grail' | 'nuclear_spray'

export type PassiveType = 'beer_coin' | 'boss_shoe' | 'dove_coin' | 'garlic_ring' | 'holy_bread' | 'battle_scarf' |
    'holy_cheese' | 'spy_hat' | 'infinity_purse' | 'ruby_ushanka' | 'sunflower_pouch' | 'pickled_gpu' |
    'bone_charm' | 'crypt_lantern'

export interface UpgradeInfo {
    id: string
    level: number
    maxLevel: number
    type: 'active' | 'passive' | 'evolution'
}

export interface EvolutionRule {
    baseAbility: AbilityType
    requiredPassive: PassiveType
    evolvedAbility: AbilityType
}

export interface ItemSynergy {
    id: string
    name: string
    description: string
    requiredItems: string[] // IDs of items required (active or passive)
    bonusEffect: (stats: any) => void
}

export class AbilitySystem {
    private abilities: Map<AbilityType, any> = new Map()
    private passives: Map<PassiveType, number> = new Map() // type -> level

    private readonly MAX_ACTIVES = 6
    private readonly MAX_PASSIVES = 6
    private readonly MAX_LEVEL = 5

    private readonly evolutions: EvolutionRule[] = [
        { baseAbility: 'skull_screen', requiredPassive: 'garlic_ring', evolvedAbility: 'soul_siphon' },
        { baseAbility: 'tt33', requiredPassive: 'spy_hat', evolvedAbility: 'silver_tt33' },
        { baseAbility: 'gzhel_smg', requiredPassive: 'pickled_gpu', evolvedAbility: 'melter' },
        { baseAbility: 'peppermill', requiredPassive: 'beer_coin', evolvedAbility: 'vodka_flamethrower' },
        { baseAbility: 'shank', requiredPassive: 'dove_coin', evolvedAbility: 'phantom_blade' },
        { baseAbility: 'tank_stroller', requiredPassive: 'ruby_ushanka', evolvedAbility: 'orbital_tank' },
        { baseAbility: 'nuclear_pigeon', requiredPassive: 'spy_hat', evolvedAbility: 'death_pigeon' },
        { baseAbility: 'haunted_lada', requiredPassive: 'holy_cheese', evolvedAbility: 'immortal_lada' },
        { baseAbility: 'propaganda_tower', requiredPassive: 'pickled_gpu', evolvedAbility: 'propaganda_storm' },
        { baseAbility: 'kabar', requiredPassive: 'battle_scarf', evolvedAbility: 'assassins_edge' },
        { baseAbility: 'knuckles', requiredPassive: 'holy_bread', evolvedAbility: 'iron_fist' },
        { baseAbility: 'holywater', requiredPassive: 'garlic_ring', evolvedAbility: 'blessed_flood' },
        { baseAbility: 'cross', requiredPassive: 'holy_cheese', evolvedAbility: 'divine_cross' },
        { baseAbility: 'stilleto', requiredPassive: 'boss_shoe', evolvedAbility: 'storm_blades' },
        { baseAbility: 'dagger', requiredPassive: 'bone_charm', evolvedAbility: 'bone_daggers' },
        { baseAbility: 'stake', requiredPassive: 'crypt_lantern', evolvedAbility: 'blazing_stakes' },
        { baseAbility: 'grail', requiredPassive: 'infinity_purse', evolvedAbility: 'eternal_grail' },
        { baseAbility: 'ak_radioactive', requiredPassive: 'sunflower_pouch', evolvedAbility: 'nuclear_spray' }
    ]

    private readonly synergies: ItemSynergy[] = [
        {
            id: 'soviet_arsenal',
            name: 'Soviet Arsenal',
            description: '+30% cooldown reduction',
            requiredItems: ['tt33', 'battle_scarf', 'propaganda_tower'],
            bonusEffect: (stats) => { stats.cooldownMultiplier *= 0.7; }
        },
        {
            id: 'gopnik_gang',
            name: 'Gopnik Gang',
            description: '+2 melee range',
            requiredItems: ['shank', 'beer_coin', 'boss_shoe'],
            bonusEffect: (stats) => { stats.areaMultiplier *= 1.2; }
        },
        {
            id: 'nuclear_winter',
            name: 'Nuclear Winter',
            description: 'Radiation aura damages nearby enemies',
            requiredItems: ['nuclear_pigeon', 'pickled_gpu', 'ruby_ushanka'],
            bonusEffect: (stats) => { stats.damageMultiplier *= 1.25; stats.areaMultiplier *= 1.15; }
        },
        {
            id: 'speed_demon',
            name: 'Speed Demon',
            description: '+40% movement speed',
            requiredItems: ['boss_shoe', 'beer_coin', 'dove_coin'],
            bonusEffect: (stats) => { stats.moveSpeed *= 1.4; }
        },
        {
            id: 'tank_build',
            name: 'Tank Build',
            description: '+10 armor, +50 max HP',
            requiredItems: ['battle_scarf', 'holy_bread', 'ruby_ushanka'],
            bonusEffect: (stats) => { stats.armor += 10; stats.maxHp += 50; stats.currentHp += 50; }
        },
        {
            id: 'lucky_charm',
            name: 'Lucky Charm',
            description: '+100% luck, +50% XP gain',
            requiredItems: ['dove_coin', 'infinity_purse', 'sunflower_pouch'],
            bonusEffect: (stats) => { stats.luck *= 2.0; stats.growth *= 1.5; }
        },
        {
            id: 'undead_hunter',
            name: 'Undead Hunter',
            description: '+35% damage, +1 projectile',
            requiredItems: ['stake', 'spy_hat', 'dove_coin'],
            bonusEffect: (stats) => { stats.damageMultiplier *= 1.35; stats.amount += 1; }
        },
        {
            id: 'holy_crusade',
            name: 'Holy Crusade',
            description: '+50% damage, +20 max HP',
            requiredItems: ['cross', 'holywater', 'holy_bread'],
            bonusEffect: (stats) => { stats.damageMultiplier *= 1.5; stats.maxHp += 20; stats.currentHp += 20; }
        },
        {
            id: 'crypt_raider',
            name: 'Crypt Raider',
            description: '+25% crit chance, +0.3 speed',
            requiredItems: ['kabar', 'dagger', 'boss_shoe'],
            bonusEffect: (stats) => { stats.critRate += 0.25; stats.moveSpeed += 0.3; }
        },
        {
            id: 'skull_warrior',
            name: 'Skull Warrior',
            description: '+30% area, +20% damage',
            requiredItems: ['skull_screen', 'knuckles', 'bone_charm'],
            bonusEffect: (stats) => { stats.areaMultiplier *= 1.3; stats.damageMultiplier *= 1.2; }
        }
    ]

    private readonly passiveEffects: Record<PassiveType, (stats: any) => void> = {
        'beer_coin': (stats) => { stats.moveSpeed += 0.3; stats.armor += 1.0; },
        'boss_shoe': (stats) => { stats.moveSpeed += 0.5; },
        'dove_coin': (stats) => { stats.luck += 0.2; },
        'garlic_ring': (stats) => { stats.areaMultiplier *= 1.15; },
        'holy_bread': (stats) => { stats.maxHp += 40; stats.currentHp += 40; },
        'battle_scarf': (stats) => { stats.armor += 3.0; },
        'holy_cheese': (stats) => { stats.regen += 2.0; },
        'spy_hat': (stats) => { stats.critRate += 0.2; },
        'infinity_purse': (stats) => { stats.growth += 0.2; },
        'ruby_ushanka': (stats) => { stats.armor += 2.0; stats.damageMultiplier *= 1.15; },
        'sunflower_pouch': (stats) => { stats.amount += 1; },
        'pickled_gpu': (stats) => { stats.cooldownMultiplier *= 0.80; },
        'bone_charm': (stats) => { stats.damageMultiplier *= 1.10; stats.maxHp += 10; stats.currentHp += 10; },
        'crypt_lantern': (stats) => { stats.areaMultiplier *= 1.15; stats.regen += 0.5; },
    };

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        private audioManager: AudioManager | null,
        startingWeapons: AbilityType[] = ['tt33'],
        startingPassives: PassiveType[] = []
    ) {
        // RNG is required for deterministic gameplay
        if (!this.rng || typeof this.rng.next !== 'function') {
            throw new Error("AbilitySystem: RNG is required for deterministic gameplay");
        }

        startingWeapons.forEach(w => this.addAbility(w));
        startingPassives.forEach(p => this.addPassive(p));
    }

    addAbility(type: AbilityType) {
        if (this.abilities.has(type)) {
            const ability = this.abilities.get(type)
            if (ability.level < this.MAX_LEVEL) {
                ability.upgrade()
            }
            return
        }

        if (this.abilities.size >= this.MAX_ACTIVES) return

        this.createAbilityInstance(type)
        this.applySynergyBonuses()
    }

    private createAbilityInstance(type: AbilityType) {
        let ability: any

        // Existing Mappings
        if (type === 'dagger') ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
        else if (type === 'holywater') ability = new HolyWaterWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'stake') ability = new AspenStakeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
        else if (type === 'cross') ability = new CrossWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'salt') ability = new SaltLineWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'tt33') ability = new TT33Weapon(this.player, this.entityManager, this.rng, this.audioManager)
        else if (type === 'ak_radioactive') ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'ak_ghzel') ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'ak_corrupted') ability = new CorruptedAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'ak_mushroom') ability = new MushroomAKWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'nuclear_pigeon') ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'lada') ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
        else if (type === 'propaganda_tower') ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)

        // ============================================
        // WEAPON DIFFERENTIATION - DPS BALANCED
        // Base formula: DPS = 30 + (minLevel - 1) * 5
        // minLevel 1 = 30 DPS, minLevel 7 = 60 DPS, etc.
        // ============================================

        // === STARTER WEAPONS (minLevel 1, DPS ~30) ===

        // TT33 PISTOL - Balanced shooter (uses base TT33 stats: 15 dmg / 0.5s = 30 DPS)
        // (handled above in the base mapping)

        // BABUSHKA'S SHANK - Fast melee (12 dmg / 0.4s = 30 DPS)
        else if (type === 'shank') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.radius = 1.5 // Short reach
            ability.cooldown = 0.4 // Fast
            ability.damage = 12
            ability.swingDuration = 0.2 // Quick swipes
            ability.color = 0xaaaaaa // Silver/gray
        }

        // CERAMIC KNUCKLES - Slow power hits (30 dmg / 1.0s = 30 DPS)
        else if (type === 'knuckles') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.radius = 1.2 // Very close range
            ability.cooldown = 1.0 // Slow
            ability.damage = 30
            ability.swingDuration = 0.4 // Heavy punch
            ability.arcAngle = Math.PI * 0.4 // Narrower punch arc
            ability.color = 0xddaa88 // Ceramic color
        }

        // STILLETO - Multi-target knives (10 dmg * 2 / 0.67s = 30 DPS)
        else if (type === 'stilleto') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.projectileSpeed = 20
            ability.projectileLife = 1.0 // Good range
            ability.cooldown = 0.67
            ability.damage = 10
            ability.count = 2
        }

        // === UNCOMMON WEAPONS (minLevel 2-3, DPS ~35-40) ===

        // PEPPERMILL GUN - Spray (7 dmg / 0.2s = 35 DPS)
        else if (type === 'peppermill') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.cooldown = 0.2
            ability.damage = 7
        }

        // SOVIET STICK - Heavy hits (35 dmg / 1.0s = 35 DPS)
        else if (type === 'soviet_stick') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.radius = 2.5 // Good reach with a stick
            ability.cooldown = 1.0
            ability.damage = 35
            ability.swingDuration = 0.35 // Solid swing
            ability.arcAngle = Math.PI * 0.7 // Wide swing
            ability.color = 0x8B4513 // Brown wood color
        }

        // VAMPIRE RAT - Companion (minLevel 3, ~40 DPS equivalent)
        else if (type === 'vampire_rat') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.orbitSpeed = 3.0
            ability.orbitRadius = 2.5
            ability.damage = 16 // 16 dmg / 0.4 tick = 40 DPS
        }

        // PIG LUGGAGE - Utility companion (minLevel 3, lower DPS but drops pickups)
        else if (type === 'pig_luggage') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.orbitSpeed = 2.0
            ability.orbitRadius = 3.0
            ability.damage = 12 // 12 dmg / 0.4 tick = 30 DPS (utility focused)
        }

        // === RARE WEAPONS (minLevel 4-6, DPS ~45-55) ===

        // KABAR KNIFE - Armor piercer (27 dmg / 0.6s = 45 DPS)
        else if (type === 'kabar') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.projectileSpeed = 14
            ability.projectileLife = 0.6
            ability.cooldown = 0.6
            ability.damage = 27
        }

        // GOPNIK GRAIL - Holy aura (18 dmg / 0.4s = 45 DPS per enemy)
        else if (type === 'grail') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.radius = 3.5
            ability.damage = 18
        }

        // PROPAGANDA TOWER - Deployable (minLevel 5, ~50 DPS)
        // (uses existing PropagandaTower class)

        // DADUSHKA CHAIR - Vehicle (minLevel 6, ~55 DPS)
        else if (type === 'dadushka_chair') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.damage = 55
        }

        // TANK STROLLER - Vehicle (minLevel 6, ~55 DPS)
        else if (type === 'tank_stroller') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.damage = 55
        }

        // === EPIC WEAPONS (minLevel 7-9, DPS ~60-70) ===

        // GZHEL SMG - Burst fire (15 dmg / 0.25s = 60 DPS)
        else if (type === 'gzhel_smg') {
            ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.cooldown = 0.25
            ability.damage = 15
        }

        // KVASS REACTOR - Healing deployable (minLevel 7)
        else if (type === 'kvass_reactor') {
            ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 24 // 60 DPS equivalent
        }

        // SKULL SCREEN - Orbital (26 dmg / 0.4s = 65 DPS per enemy)
        else if (type === 'skull_screen') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.radius = 4.0
            ability.damage = 26
        }

        // GOPNIK GONDOLA - Vehicle (minLevel 9, ~70 DPS)
        else if (type === 'gopnik_gondola') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 70
        }

        // === LEGENDARY WEAPONS (minLevel 10+, DPS ~75-95) ===

        // ORTHODOX VISORS - Laser (38 dmg / 0.5s = 76 DPS)
        else if (type === 'visors') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.damage = 38
            ability.cooldown = 0.5
        }

        // NUCLEAR PIGEON - Nuke companion (minLevel 11, ~80 DPS)
        // (uses existing class, boosted below)

        // HAUNTED LADA - Ghost vehicle (minLevel 12, ~85 DPS)
        else if (type === 'haunted_lada') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 85
            ability.speed = 1.3
        }

        // BIG BIZ LADA - Gold tank (minLevel 14, ~95 DPS)
        else if (type === 'big_biz_lada') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 95
        }

        // Evolutions (Reuse existing classes with boosted stats or new effects)
        else if (type === 'soul_siphon') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8 // Special level for evo
            ability.damage *= 4
            ability.radius *= 1.6
        } else if (type === 'silver_tt33') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 3
            ability.cooldown *= 0.5
        } else if (type === 'melter') {
            ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 5
            ability.cooldown *= 0.4
        } else if (type === 'vodka_flamethrower') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 45
            ability.cooldown = 0.1
        } else if (type === 'phantom_blade') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.radius = 2.5
            ability.cooldown = 0.2
            ability.damage = 50
            ability.swingDuration = 0.1
            ability.color = 0x6633ff
        } else if (type === 'orbital_tank') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 200
        } else if (type === 'death_pigeon') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 5
        } else if (type === 'immortal_lada') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 170
            ability.speed = 1.5
        } else if (type === 'propaganda_storm') {
            ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 4
        } else if (type === 'assassins_edge') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 60
            ability.cooldown = 0.3
            ability.projectileSpeed = 22
        } else if (type === 'iron_fist') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.radius = 2.0
            ability.cooldown = 0.5
            ability.damage = 80
            ability.swingDuration = 0.25
            ability.arcAngle = Math.PI * 0.6
            ability.color = 0xffcc00
        } else if (type === 'blessed_flood') {
            ability = new HolyWaterWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.level = 8
            ability.damage *= 4
        } else if (type === 'divine_cross') {
            ability = new CrossWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.level = 8
            ability.damage *= 4
        } else if (type === 'storm_blades') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 35
            ability.cooldown = 0.15
            ability.count = 5
            ability.projectileSpeed = 28
        } else if (type === 'bone_daggers') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage = 45
            ability.cooldown = 0.35
            ability.count = 4
            ability.projectileSpeed = 18
        } else if (type === 'blazing_stakes') {
            ability = new AspenStakeWeapon(this.player, this.entityManager, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 5
            ability.cooldown *= 0.4
        } else if (type === 'eternal_grail') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.radius = 6.0
            ability.damage = 40
        } else if (type === 'nuclear_spray') {
            ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx, this.rng, this.audioManager)
            ability.level = 8
            ability.damage *= 4
            ability.cooldown *= 0.3
        }

        if (ability) {
            this.abilities.set(type, ability)
        }
    }

    evolve(rule: EvolutionRule) {
        const base = this.abilities.get(rule.baseAbility)
        if (base) {
            base.cleanup()
            this.abilities.delete(rule.baseAbility)
            this.createAbilityInstance(rule.evolvedAbility)
            this.audioManager?.playEvolution()
            if (this.vfx) {
                this.vfx.createEmoji(this.player.position.x, this.player.position.z, '🌟', 2.0)
            }
        }
    }

    addPassive(type: PassiveType) {
        const currentLevel = this.passives.get(type) || 0
        if (currentLevel >= this.MAX_LEVEL) return

        if (currentLevel === 0 && this.passives.size >= this.MAX_PASSIVES) return

        const nextLevel = currentLevel + 1
        this.passives.set(type, nextLevel)
        this.applyPassiveEffect(type, nextLevel)
        this.applySynergyBonuses()
    }

    private applyPassiveEffect(type: PassiveType, level: number) {
        const effect = this.passiveEffects[type];
        if (effect) {
            effect(this.player.stats);
        }
    }

    /**
     * Get currently active synergies based on player's items
     */
    getActiveSynergies(): ItemSynergy[] {
        const activeSynergies: ItemSynergy[] = []

        // Collect all item IDs player has
        const playerItems = new Set<string>()

        // Add all active abilities
        for (const abilityId of this.abilities.keys()) {
            playerItems.add(abilityId)
        }

        // Add all passives
        for (const passiveId of this.passives.keys()) {
            playerItems.add(passiveId)
        }

        // Check each synergy
        for (const synergy of this.synergies) {
            const hasAllItems = synergy.requiredItems.every(itemId => playerItems.has(itemId))
            if (hasAllItems) {
                activeSynergies.push(synergy)
            }
        }

        return activeSynergies
    }

    /**
     * Apply all active synergy bonuses to player stats
     * Call this whenever items change
     */
    applySynergyBonuses() {
        const activeSynergies = this.getActiveSynergies()

        for (const synergy of activeSynergies) {
            synergy.bonusEffect(this.player.stats)
        }
    }

    getAvailableEvolutions(): EvolutionRule[] {
        return this.evolutions.filter(rule => {
            const ability = this.abilities.get(rule.baseAbility)
            const passiveLevel = this.passives.get(rule.requiredPassive) || 0
            return ability && ability.level >= this.MAX_LEVEL && passiveLevel > 0
        })
    }

    getUpgradeDescription(type: string, nextLevel: number): string {
        // ============================================
        // ACTIVE WEAPONS - Use static methods where available
        // ============================================
        if (type === 'dagger') return DaggerWeapon.getUpgradeDesc(nextLevel)
        if (type === 'holywater') return HolyWaterWeapon.getUpgradeDesc(nextLevel)
        if (type === 'stake') return AspenStakeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'cross') return CrossWeapon.getUpgradeDesc(nextLevel)
        if (type === 'salt') return SaltLineWeapon.getUpgradeDesc(nextLevel)
        if (type === 'ak_radioactive') return RadioactiveAKWeapon.getUpgradeDesc(nextLevel)
        if (type === 'shank') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'knuckles') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'soviet_stick') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'grail') return GarlicAura.getUpgradeDesc(nextLevel)
        if (type === 'skull_screen') return GarlicAura.getUpgradeDesc(nextLevel)

        // TT33 - matches TT33Weapon.upgrade()
        if (type === 'tt33') {
            switch (nextLevel) {
                case 1: return "Rapid shots at nearest enemy."
                case 2: return "Polished barrel (+20% damage)."
                case 3: return "Hair trigger (+20% attack speed)."
                case 4: return "High-velocity rounds (+50% damage)."
                case 5: return "Semi-auto mastery (+30% attack speed)."
                default: return ""
            }
        }

        // Stilleto - DaggerWeapon variant
        if (type === 'stilleto') {
            switch (nextLevel) {
                case 1: return "Fast throwing knives at multiple targets."
                case 2: return "Extra blade (+1 knife)."
                case 3: return "Sharper blades (+50% damage)."
                case 4: return "Faster throwing (+30% attack speed)."
                case 5: return "Blade Master (+1 knife)."
                default: return ""
            }
        }

        // Peppermill - TT33 variant with faster fire
        if (type === 'peppermill') {
            switch (nextLevel) {
                case 1: return "Rapid spray of bullets."
                case 2: return "Larger magazine (+20% damage)."
                case 3: return "Oiled mechanism (+20% fire rate)."
                case 4: return "Hollow points (+50% damage)."
                case 5: return "Overclocked (+30% fire rate)."
                default: return ""
            }
        }

        // Kabar - DaggerWeapon variant
        if (type === 'kabar') {
            switch (nextLevel) {
                case 1: return "Armor-piercing throwing blade."
                case 2: return "Serrated edge (+1 blade)."
                case 3: return "Hardened steel (+50% damage)."
                case 4: return "Quick draw (+30% attack speed)."
                case 5: return "Combat mastery (+1 blade)."
                default: return ""
            }
        }

        // Visors - TT33 variant with high damage
        if (type === 'visors') {
            switch (nextLevel) {
                case 1: return "Devastating holy lasers."
                case 2: return "Focused beam (+20% damage)."
                case 3: return "Rapid pulse (+20% fire rate)."
                case 4: return "Overcharge (+50% damage)."
                case 5: return "Divine fury (+30% fire rate)."
                default: return ""
            }
        }

        // Gzhel SMG - GhzelAKWeapon
        if (type === 'gzhel_smg') {
            switch (nextLevel) {
                case 1: return "Rapid bursts with high crit."
                case 2: return "Extended mag (+20% damage)."
                case 3: return "Burst fire (+20% fire rate)."
                case 4: return "AP rounds (+50% damage)."
                case 5: return "Full auto (+30% fire rate)."
                default: return ""
            }
        }

        // Deployables
        if (type === 'propaganda_tower') return PropagandaTower.getUpgradeDesc(nextLevel)
        if (type === 'kvass_reactor') {
            switch (nextLevel) {
                case 1: return "Deploy healing zone that boosts speed."
                case 2: return "Wider zone (+30% radius)."
                case 3: return "Stronger brew (+50% heal)."
                case 4: return "Faster ferment (+30% tick rate)."
                case 5: return "Unlimited refills (+50% area, +25% heal)."
                default: return ""
            }
        }

        // Companions
        if (type === 'nuclear_pigeon') return NuclearPigeon.getUpgradeDesc(nextLevel)
        if (type === 'vampire_rat') {
            switch (nextLevel) {
                case 1: return "Companion that bites nearby enemies."
                case 2: return "Sharper teeth (+30% damage)."
                case 3: return "Faster scurry (+20% orbit speed)."
                case 4: return "Bloodthirst (+50% damage)."
                case 5: return "Swarm (+1 rat companion)."
                default: return ""
            }
        }
        if (type === 'pig_luggage') {
            switch (nextLevel) {
                case 1: return "Companion that drops health pickups."
                case 2: return "Better snout (+20% drop rate)."
                case 3: return "Faster trot (+20% orbit speed)."
                case 4: return "Lucky pig (+50% drop rate)."
                case 5: return "Golden pig (drops coins too)."
                default: return ""
            }
        }

        // Vehicles
        if (type === 'haunted_lada') {
            switch (nextLevel) {
                case 1: return "Ghost car phases through enemies."
                case 2: return "Cold aura (+30% damage)."
                case 3: return "Faster drift (+20% speed)."
                case 4: return "Freezing touch (+50% damage)."
                case 5: return "Phantom overdrive (+30% speed, phases walls)."
                default: return ""
            }
        }
        if (type === 'big_biz_lada') {
            switch (nextLevel) {
                case 1: return "Gold tank generates coins while ramming."
                case 2: return "Reinforced bumper (+30% damage)."
                case 3: return "Gold plating (+20% coin gen)."
                case 4: return "Tank treads (+50% damage)."
                case 5: return "Oligarch mode (+50% coins, +30% damage)."
                default: return ""
            }
        }
        if (type === 'dadushka_chair') {
            switch (nextLevel) {
                case 1: return "Armored wheelchair with high defense."
                case 2: return "Steel frame (+30% damage)."
                case 3: return "Rubber wheels (+20% speed)."
                case 4: return "Spikes (+50% damage)."
                case 5: return "Tank mode (+30% armor, +25% damage)."
                default: return ""
            }
        }
        if (type === 'gopnik_gondola') {
            switch (nextLevel) {
                case 1: return "Floating vehicle ignores terrain."
                case 2: return "Sharper hull (+30% damage)."
                case 3: return "Jet propulsion (+20% speed)."
                case 4: return "Ramming prow (+50% damage)."
                case 5: return "Flying fortress (+30% speed, +25% damage)."
                default: return ""
            }
        }
        if (type === 'tank_stroller') {
            switch (nextLevel) {
                case 1: return "Armored stroller crushes enemies."
                case 2: return "Heavy treads (+30% damage)."
                case 3: return "Motor upgrade (+20% speed)."
                case 4: return "Battering ram (+50% damage)."
                case 5: return "War machine (+30% area, +25% damage)."
                default: return ""
            }
        }

        // ============================================
        // EVOLUTIONS
        // ============================================
        if (type === 'soul_siphon') return "Heals on kill, massive area."
        if (type === 'silver_tt33') return "Silver rounds crush bosses."
        if (type === 'melter') return "Melts enemy armor instantly."
        if (type === 'vodka_flamethrower') return "Ignites enemies with burning vodka streams."
        if (type === 'phantom_blade') return "Invisible strikes from the shadows."
        if (type === 'orbital_tank') return "360-degree orbital devastation."
        if (type === 'death_pigeon') return "Critical nuclear strikes from above."
        if (type === 'immortal_lada') return "Self-healing cursed vehicle."
        if (type === 'propaganda_storm') return "Rapid-fire mind control towers."
        if (type === 'assassins_edge') return "Armor-shredding critical blade."
        if (type === 'iron_fist') return "Devastating multi-hit punches."
        if (type === 'blessed_flood') return "Healing pools that burn enemies."
        if (type === 'divine_cross') return "Multi-bouncing holy projectiles."
        if (type === 'storm_blades') return "Lightning-fast chain knives."
        if (type === 'bone_daggers') return "Splitting necromantic daggers."
        if (type === 'blazing_stakes') return "Burning stakes ignite the ground."
        if (type === 'eternal_grail') return "Infinite holy aura of massive range."
        if (type === 'nuclear_spray') return "Multi-projectile radioactive barrage."

        // ============================================
        // PASSIVES - Stack per level
        // ============================================
        if (type === 'beer_coin') return nextLevel === 1 ? "+0.3 Speed, +1 Armor." : `+0.3 speed, +1 armor.`
        if (type === 'boss_shoe') return nextLevel === 1 ? "+0.5 Movement Speed." : `+0.5 speed.`
        if (type === 'dove_coin') return nextLevel === 1 ? "+20% Luck." : `+20% luck.`
        if (type === 'garlic_ring') return nextLevel === 1 ? "+15% Ability Area." : `+15% area.`
        if (type === 'holy_bread') return nextLevel === 1 ? "+40 Max Health." : `+40 max HP.`
        if (type === 'battle_scarf') return nextLevel === 1 ? "+3 Armor." : `+3 armor.`
        if (type === 'holy_cheese') return nextLevel === 1 ? "+2.0 HP/sec Regen." : `+2.0 HP/s regen.`
        if (type === 'spy_hat') return nextLevel === 1 ? "+20% Crit Chance." : `+20% crit.`
        if (type === 'infinity_purse') return nextLevel === 1 ? "+20% Experience Gain." : `+20% exp.`
        if (type === 'ruby_ushanka') return nextLevel === 1 ? "+2 Armor, +15% Damage." : `+2 armor, +15% damage.`
        if (type === 'sunflower_pouch') return nextLevel === 1 ? "+1 Projectile to all weapons." : `+1 projectile.`
        if (type === 'pickled_gpu') return nextLevel === 1 ? "-20% Cooldowns." : `-20% cooldowns.`
        if (type === 'bone_charm') return nextLevel === 1 ? "+10% Damage, +10 Max HP." : `+10% damage, +10 HP.`
        if (type === 'crypt_lantern') return nextLevel === 1 ? "+15% Area, +0.5 HP/sec." : `+15% area, +0.5 regen.`

        return "A powerful upgrade!"
    }

    getUpgrades(): UpgradeInfo[] {
        const upgrades: UpgradeInfo[] = []

        // Active abilities
        for (const [id, ability] of this.abilities.entries()) {
            upgrades.push({ id, level: ability.level, maxLevel: this.MAX_LEVEL, type: 'active' })
        }

        // Passives
        for (const [id, level] of this.passives.entries()) {
            upgrades.push({ id, level, maxLevel: this.MAX_LEVEL, type: 'passive' })
        }

        return upgrades
    }

    canAddActive(): boolean {
        return this.abilities.size < this.MAX_ACTIVES
    }

    canAddPassive(): boolean {
        return this.passives.size < this.MAX_PASSIVES
    }

    getAbilityLevel(type: AbilityType): number {
        return this.abilities.get(type)?.level || 0
    }

    getPassiveLevel(type: PassiveType): number {
        return this.passives.get(type) || 0
    }

    getMinActiveLevel(): number {
        if (this.abilities.size === 0) return 0
        let min = this.MAX_LEVEL
        for (const ability of this.abilities.values()) {
            if (ability.level < min) min = ability.level
        }
        return min
    }

    getMinPassiveLevel(): number {
        if (this.passives.size === 0) return 0
        let min = this.MAX_LEVEL
        for (const level of this.passives.values()) {
            if (level < min) min = level
        }
        return min
    }

    update(deltaTime: number) {
        for (const ability of this.abilities.values()) {
            ability.update(deltaTime)
        }
    }

    cleanup() {
        for (const ability of this.abilities.values()) {
            ability.cleanup()
        }
        this.abilities.clear()
        this.passives.clear()
    }
}
