/**
 * AbilitySystem.ts
 * 
 * Manages all active abilities and weapons for the player.
 */

import * as THREE from 'three'
import { Player } from '../entities/Player'
import { EntityManager } from '../entities/EntityManager'
import { GarlicAura } from './GarlicAura'
import { DaggerWeapon } from './DaggerWeapon'
import { MeleeWeapon } from './MeleeWeapon'
import { HolyWaterWeapon } from './HolyWaterWeapon'
import { AspenStakeWeapon } from './AspenStakeWeapon'
import { CrossWeapon } from './CrossWeapon'
import { SaltLineWeapon } from './SaltLineWeapon'
import { TT33Weapon } from './TT33Weapon'
import { RadioactiveAKWeapon } from './RadioactiveAKWeapon'
import { GhzelAKWeapon } from './GhzelAKWeapon'
import { CorruptedAKWeapon } from './CorruptedAKWeapon'
import { MushroomAKWeapon } from './MushroomAKWeapon'
import { NuclearPigeon } from './NuclearPigeon'
import { LadaVehicle } from './LadaVehicle'
import { PropagandaTower } from './PropagandaTower'
import { VFXManager } from './VFXManager'

export type AbilityType = 'garlic' | 'dagger' | 'holywater' | 'stake' | 'cross' | 'salt' | 'tt33' | 'propaganda_tower' |
    'ak_radioactive' | 'ak_ghzel' | 'ak_corrupted' | 'ak_mushroom' | 'nuclear_pigeon' | 'lada' |
    'peppermill' | 'shank' | 'kabar' | 'knuckles' | 'stilleto' | 'grail' | 'soviet_stick' | 'skull_screen' | 'visors' |
    'kvass_reactor' | 'vampire_rat' | 'pig_luggage' | 'big_biz_lada' | 'dadushka_chair' | 'gopnik_gondola' | 'tank_stroller' | 'haunted_lada' | 'gzhel_smg' |
    'soul_siphon' | 'silver_tt33' | 'melter'

export type PassiveType = 'beer_coin' | 'boss_shoe' | 'dove_coin' | 'garlic_ring' | 'holy_bread' | 'battle_scarf' |
    'holy_cheese' | 'spy_hat' | 'infinity_purse' | 'ruby_ushanka' | 'sunflower_pouch' | 'pickled_gpu'

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

export class AbilitySystem {
    private abilities: Map<AbilityType, any> = new Map()
    private passives: Map<PassiveType, number> = new Map() // type -> level

    private readonly MAX_ACTIVES = 6
    private readonly MAX_PASSIVES = 6
    private readonly MAX_LEVEL = 5

    private readonly evolutions: EvolutionRule[] = [
        { baseAbility: 'skull_screen', requiredPassive: 'garlic_ring', evolvedAbility: 'soul_siphon' },
        { baseAbility: 'tt33', requiredPassive: 'spy_hat', evolvedAbility: 'silver_tt33' },
        { baseAbility: 'gzhel_smg', requiredPassive: 'pickled_gpu', evolvedAbility: 'melter' }
    ]

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        startingWeapons: AbilityType[] = ['tt33'],
        startingPassives: PassiveType[] = []
    ) {
        // Safety check for RNG
        if (!this.rng || typeof this.rng.next !== 'function') {
            console.warn("AbilitySystem: Invalid RNG provided, falling back to Math.random wrapper");
            this.rng = { next: () => Math.random() };
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
    }

    private createAbilityInstance(type: AbilityType) {
        let ability: any

        // Existing Mappings
        if (type === 'garlic') ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'dagger') ability = new DaggerWeapon(this.player, this.entityManager, this.rng)
        else if (type === 'holywater') ability = new HolyWaterWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'stake') ability = new AspenStakeWeapon(this.player, this.entityManager, this.rng)
        else if (type === 'cross') ability = new CrossWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'salt') ability = new SaltLineWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'tt33') ability = new TT33Weapon(this.player, this.entityManager, this.rng)
        else if (type === 'ak_radioactive') ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'ak_ghzel') ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'ak_corrupted') ability = new CorruptedAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'ak_mushroom') ability = new MushroomAKWeapon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'nuclear_pigeon') ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'lada') ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
        else if (type === 'propaganda_tower') ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx, this.rng)

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
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng)
            ability.radius = 1.5 // Short reach
            ability.cooldown = 0.4 // Fast
            ability.damage = 12
            ability.swingDuration = 0.2 // Quick swipes
            ability.color = 0xaaaaaa // Silver/gray
        }

        // CERAMIC KNUCKLES - Slow power hits (30 dmg / 1.0s = 30 DPS)
        else if (type === 'knuckles') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng)
            ability.radius = 1.2 // Very close range
            ability.cooldown = 1.0 // Slow
            ability.damage = 30
            ability.swingDuration = 0.4 // Heavy punch
            ability.arcAngle = Math.PI * 0.4 // Narrower punch arc
            ability.color = 0xddaa88 // Ceramic color
        }

        // STILLETO - Multi-target knives (10 dmg * 2 / 0.67s = 30 DPS)
        else if (type === 'stilleto') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng)
            ability.projectileSpeed = 20
            ability.projectileLife = 1.0 // Good range
            ability.cooldown = 0.67
            ability.damage = 10
            ability.count = 2
        }

        // === UNCOMMON WEAPONS (minLevel 2-3, DPS ~35-40) ===

        // PEPPERMILL GUN - Spray (7 dmg / 0.2s = 35 DPS)
        else if (type === 'peppermill') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng)
            ability.cooldown = 0.2
            ability.damage = 7
        }

        // SOVIET STICK - Heavy hits (35 dmg / 1.0s = 35 DPS)
        else if (type === 'soviet_stick') {
            ability = new MeleeWeapon(this.player, this.entityManager, this.rng)
            ability.radius = 2.5 // Good reach with a stick
            ability.cooldown = 1.0
            ability.damage = 35
            ability.swingDuration = 0.35 // Solid swing
            ability.arcAngle = Math.PI * 0.7 // Wide swing
            ability.color = 0x8B4513 // Brown wood color
        }

        // VAMPIRE RAT - Companion (minLevel 3, ~40 DPS equivalent)
        else if (type === 'vampire_rat') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.orbitSpeed = 3.0
            ability.orbitRadius = 2.5
            ability.damage = 16 // 16 dmg / 0.4 tick = 40 DPS
        }

        // PIG LUGGAGE - Utility companion (minLevel 3, lower DPS but drops pickups)
        else if (type === 'pig_luggage') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.orbitSpeed = 2.0
            ability.orbitRadius = 3.0
            ability.damage = 12 // 12 dmg / 0.4 tick = 30 DPS (utility focused)
        }

        // === RARE WEAPONS (minLevel 4-6, DPS ~45-55) ===

        // KABAR KNIFE - Armor piercer (27 dmg / 0.6s = 45 DPS)
        else if (type === 'kabar') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng)
            ability.projectileSpeed = 14
            ability.projectileLife = 0.6
            ability.cooldown = 0.6
            ability.damage = 27
        }

        // GOPNIK GRAIL - Holy aura (18 dmg / 0.4s = 45 DPS per enemy)
        else if (type === 'grail') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.radius = 3.5
            ability.damage = 18
        }

        // PROPAGANDA TOWER - Deployable (minLevel 5, ~50 DPS)
        // (uses existing PropagandaTower class)

        // DADUSHKA CHAIR - Vehicle (minLevel 6, ~55 DPS)
        else if (type === 'dadushka_chair') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 55
        }

        // TANK STROLLER - Vehicle (minLevel 6, ~55 DPS)
        else if (type === 'tank_stroller') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.damage = 55
        }

        // === EPIC WEAPONS (minLevel 7-9, DPS ~60-70) ===

        // GZHEL SMG - Burst fire (15 dmg / 0.25s = 60 DPS)
        else if (type === 'gzhel_smg') {
            ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
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
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng)
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
            ability = new TT33Weapon(this.player, this.entityManager, this.rng)
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
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.level = 8 // Special level for evo
            ability.damage *= 4
            ability.radius *= 1.6
        } else if (type === 'silver_tt33') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng)
            ability.level = 8
            ability.damage *= 3
            ability.cooldown *= 0.5
        } else if (type === 'melter') {
            ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
            ability.level = 8
            ability.damage *= 5
            ability.cooldown *= 0.4
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
    }

    private applyPassiveEffect(type: PassiveType, level: number) {
        const p = this.player
        if (type === 'beer_coin') {
            p.stats.moveSpeed += 0.3
            p.stats.armor += 1.0
        } else if (type === 'boss_shoe') {
            p.stats.moveSpeed += 0.5
        } else if (type === 'dove_coin') {
            p.stats.luck += 0.2
        } else if (type === 'garlic_ring') {
            p.stats.areaMultiplier *= 1.15
        } else if (type === 'holy_bread') {
            p.stats.maxHp += 40
            p.stats.currentHp += 40
        } else if (type === 'battle_scarf') {
            p.stats.armor += 3.0
        } else if (type === 'holy_cheese') {
            p.stats.regen += 2.0
        } else if (type === 'spy_hat') {
            p.stats.critRate += 0.2
        } else if (type === 'infinity_purse') {
            p.stats.growth += 0.2
        } else if (type === 'ruby_ushanka') {
            p.stats.armor += 2.0
            p.stats.damageMultiplier *= 1.15
        } else if (type === 'sunflower_pouch') {
            p.stats.amount += 1
        } else if (type === 'pickled_gpu') {
            p.stats.cooldownMultiplier *= 0.80
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
        // ACTIVE WEAPONS
        // ============================================

        // Legacy weapons (kept for backwards compatibility)
        if (type === 'garlic') return GarlicAura.getUpgradeDesc(nextLevel)
        if (type === 'dagger') return DaggerWeapon.getUpgradeDesc(nextLevel)
        if (type === 'holywater') return HolyWaterWeapon.getUpgradeDesc(nextLevel)
        if (type === 'stake') return AspenStakeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'cross') return CrossWeapon.getUpgradeDesc(nextLevel)
        if (type === 'salt') return SaltLineWeapon.getUpgradeDesc(nextLevel)
        if (type === 'ak_radioactive') return RadioactiveAKWeapon.getUpgradeDesc(nextLevel)
        if (type === 'ak_ghzel') return "Artisanal precision. High critical hit chance."
        if (type === 'ak_corrupted') return "Demonic weapon that siphons life from foes."
        if (type === 'ak_mushroom') return "Fires rounds that burst into toxic spore clouds."
        if (type === 'lada') return "Periodic armored push. Crush anything in your path."

        // New weapons - descriptions without "Level X:" prefix (added by UI)
        if (type === 'tt33') return nextLevel === 1 ? "Reliable shots at nearest enemy." : `+20% damage.`
        if (type === 'shank') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'knuckles') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'stilleto') return nextLevel === 1 ? "Fast knives at multiple targets." : `+1 extra knife.`
        if (type === 'peppermill') return nextLevel === 1 ? "Rapid bullet spray." : `+10% fire rate.`
        if (type === 'soviet_stick') return MeleeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'kabar') return nextLevel === 1 ? "Armor-piercing blade." : `+20% damage.`
        if (type === 'grail') return nextLevel === 1 ? "Holy damage aura." : `+15% area.`
        if (type === 'skull_screen') return nextLevel === 1 ? "Orbiting skulls." : `+15% damage, +10% area.`
        if (type === 'visors') return nextLevel === 1 ? "Devastating holy lasers." : `+25% damage.`
        if (type === 'gzhel_smg') return nextLevel === 1 ? "Rapid bursts with high crit." : `+15% fire rate.`

        // Deployables
        if (type === 'propaganda_tower') return nextLevel === 1 ? "Deploy tower that damages enemies." : `+1 tower, +10% damage.`
        if (type === 'kvass_reactor') return nextLevel === 1 ? "Deploy healing zone." : `+20% heal rate.`

        // Companions
        if (type === 'nuclear_pigeon') return nextLevel === 1 ? "Radioactive companion that orbits." : `+20% damage.`
        if (type === 'vampire_rat') return nextLevel === 1 ? "Fast companion that bites." : `+15% attack speed.`
        if (type === 'pig_luggage') return nextLevel === 1 ? "Companion that drops pickups." : `+20% drop rate.`

        // Vehicles
        if (type === 'haunted_lada') return nextLevel === 1 ? "Ghost car phases through." : `+15% speed.`
        if (type === 'big_biz_lada') return nextLevel === 1 ? "Gold tank generates coins." : `+20% gold.`
        if (type === 'dadushka_chair') return nextLevel === 1 ? "Armored slow vehicle." : `+15% armor.`
        if (type === 'gopnik_gondola') return nextLevel === 1 ? "Floating vehicle." : `+15% damage.`
        if (type === 'tank_stroller') return nextLevel === 1 ? "Armored transport." : `+25% crush damage.`

        // ============================================
        // EVOLUTIONS
        // ============================================
        if (type === 'soul_siphon') return "Heals on kill, massive area."
        if (type === 'silver_tt33') return "Silver rounds crush bosses."
        if (type === 'melter') return "Melts enemy armor instantly."

        // ============================================
        // PASSIVES - descriptions without "Level X:" prefix (added by UI)
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
