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

export type PassiveType = 'hp' | 'speed' | 'magnet' | 'armor' | 'area' | 'damage' | 'silver' | 'iron' | 'icon' | 'salt_passive' | 'garlic_ring' | 'regen' |
    'dove_coin' | 'beer_coin' | 'holy_bread' | 'holy_cheese' | 'sunflower_pouch' | 'infinity_purse' | 'spy_hat' | 'pickled_gpu' | 'battle_scarf' | 'ruby_ushanka'

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
        { baseAbility: 'garlic', requiredPassive: 'garlic_ring', evolvedAbility: 'soul_siphon' },
        { baseAbility: 'tt33', requiredPassive: 'silver', evolvedAbility: 'silver_tt33' },
        { baseAbility: 'ak_radioactive', requiredPassive: 'icon', evolvedAbility: 'melter' }
    ]

    constructor(
        private scene: THREE.Scene,
        private player: Player,
        private entityManager: EntityManager,
        private vfx: VFXManager,
        private rng: any, // SeededRandom
        startingWeapon: AbilityType = 'garlic'
    ) {
        // Safety check for RNG
        if (!this.rng || typeof this.rng.next !== 'function') {
            console.warn("AbilitySystem: Invalid RNG provided, falling back to Math.random wrapper");
            this.rng = { next: () => Math.random() };
        }
        this.addAbility(startingWeapon)
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

        // NEW WEAPONS (Mapped to existing classes for MVP)
        else if (type === 'peppermill') {
            ability = new TT33Weapon(this.player, this.entityManager, this.rng)
            ability.cooldown *= 0.5 // Fast fire
            ability.damage *= 0.6
        }
        else if (type === 'gzhel_smg') {
            ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx, this.rng)
            ability.cooldown *= 0.7
        }
        else if (type === 'shank' || type === 'kabar' || type === 'knuckles' || type === 'soviet_stick') {
            // Melee-ish (short range daggers)
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng)
            ability.projectileSpeed *= 0.5
            ability.projectileLife *= 0.4
            ability.damage *= 2.0
        }
        else if (type === 'stilleto') {
            ability = new DaggerWeapon(this.player, this.entityManager, this.rng)
            ability.projectileSpeed *= 1.5
            ability.cooldown *= 0.4
        }
        else if (type === 'grail' || type === 'skull_screen') {
            // Aura-ish
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.radius *= 0.8
            ability.damage *= 1.5
        }
        else if (type === 'visors') {
            // Laser eyes (fast projectiles)
            ability = new TT33Weapon(this.player, this.entityManager, this.rng)
            ability.damage *= 3.0
            ability.projectileSpeed *= 2.0
        }

        // DEPLOYABLES
        else if (type === 'kvass_reactor') {
            ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            // Logic to make it heal/speed boost would go here in full impl, for now it's a tower derivative
        }

        // COMPANIONS
        else if (type === 'vampire_rat' || type === 'pig_luggage') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.orbitSpeed *= 1.5
            ability.orbitRadius *= 0.7
        }

        // VEHICLES
        else if (['big_biz_lada', 'dadushka_chair', 'gopnik_gondola', 'tank_stroller', 'haunted_lada'].includes(type)) {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx, this.rng)
            ability.duration *= 1.2
            if (type === 'haunted_lada') ability.speed *= 1.3
            if (type === 'tank_stroller') ability.damage *= 2.0
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
        if (type === 'hp') {
            p.stats.maxHp += 20
            p.stats.currentHp = Math.min(p.stats.maxHp, p.stats.currentHp + 20)
        } else if (type === 'speed') {
            p.stats.moveSpeed += 0.5
        } else if (type === 'magnet') {
            p.stats.magnet += 1.5
        } else if (type === 'armor' || type === 'iron') {
            p.stats.armor += 1
        } else if (type === 'area') {
            p.stats.areaMultiplier *= 1.15
        } else if (type === 'damage' || type === 'silver') {
            p.stats.damageMultiplier *= 1.15
        } else if (type === 'icon') {
            p.stats.cooldownMultiplier *= 0.9 // Reduce cooldown
        } else if (type === 'salt_passive') {
            p.stats.areaMultiplier *= 1.1
            p.stats.damageMultiplier *= 1.05
        } else if (type === 'garlic_ring') {
            p.stats.areaMultiplier *= 1.1
        } else if (type === 'regen' || type === 'holy_cheese') {
            p.stats.regen += (type === 'holy_cheese' ? 2.0 : 1.0)
        } else if (type === 'dove_coin') {
            p.stats.luck += 0.2
        } else if (type === 'holy_bread') {
            p.stats.maxHp += 50
            p.stats.currentHp += 50
        } else if (type === 'beer_coin') {
            p.stats.moveSpeed += 0.2
            p.stats.armor += 1.0
        } else if (type === 'sunflower_pouch') {
            p.stats.amount += 1
        } else if (type === 'infinity_purse') {
            p.stats.greed += 0.5
        } else if (type === 'spy_hat') {
            p.stats.visionMultiplier += 0.2
            p.stats.critRate += 0.2

        } else if (type === 'pickled_gpu') {
            p.stats.cooldownMultiplier *= 0.85
        } else if (type === 'battle_scarf') {
            p.stats.armor += 3.0
        } else if (type === 'ruby_ushanka') {
            p.stats.armor += 2.0
            p.stats.damageMultiplier *= 1.1
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
        // Actives
        if (type === 'garlic') return GarlicAura.getUpgradeDesc(nextLevel)
        if (type === 'dagger') return DaggerWeapon.getUpgradeDesc(nextLevel)
        if (type === 'holywater') return HolyWaterWeapon.getUpgradeDesc(nextLevel)
        if (type === 'stake') return AspenStakeWeapon.getUpgradeDesc(nextLevel)
        if (type === 'cross') return CrossWeapon.getUpgradeDesc(nextLevel)
        if (type === 'salt') return SaltLineWeapon.getUpgradeDesc(nextLevel)
        if (type === 'tt33') return TT33Weapon.getUpgradeDesc(nextLevel)
        if (type === 'propaganda_tower') return PropagandaTower.getUpgradeDesc(nextLevel)
        if (type === 'ak_radioactive') return RadioactiveAKWeapon.getUpgradeDesc(nextLevel)
        if (type === 'ak_ghzel') return "Artisanal precision. High critical hit chance."
        if (type === 'ak_corrupted') return "Demonic weapon that siphons life from foes."
        if (type === 'ak_mushroom') return "Fires rounds that burst into toxic spore clouds."
        if (type === 'nuclear_pigeon') return "A radioactive companion that orbits and protects."
        if (type === 'lada') return "Periodic armored push. Crush anything in your path."

        // Evolutions
        if (type === 'soul_siphon') return "Evolved Garlic: Heals player on kill and massive area."
        if (type === 'silver_tt33') return "Evolved TT33: Silver rounds deal massive damage to bosses."
        if (type === 'melter') return "Evolved Radioactive AK: Melts enemy armor instantly."

        // Passives
        if (type === 'hp') return nextLevel === 1 ? "Old World Heart: +20 Max Vitality & Full Recovery." : `+20 Max HP (Total: +${nextLevel * 20}).`
        if (type === 'speed') return nextLevel === 1 ? "Wild Spirit: +0.5 Movement Speed." : `+0.5 Move Speed (Total: +${(nextLevel * 0.5).toFixed(1)}).`
        if (type === 'magnet') return nextLevel === 1 ? "Amber Stone: +1.5 Collection Radius." : `+1.5 Magnet Radius (Total: +${(nextLevel * 1.5).toFixed(1)}).`
        if (type === 'regen') return nextLevel === 1 ? "Health Regen: +1.0 HP Regeneration per second." : `+1.0 HP/s Regen (Total: ${nextLevel.toFixed(1)}/s).`
        if (type === 'iron') return nextLevel === 1 ? "Zhelezo: +1 Permanent Armor." : `+1 Armor (Total: ${nextLevel}).`
        if (type === 'area') return nextLevel === 1 ? "Vistula Reach: +15% Ability Area." : `+15% Area Multiplier.`
        if (type === 'damage') return nextLevel === 1 ? "Silver: +15% Total Damage." : `+15% Damage Multiplier.`
        if (type === 'damage') return nextLevel === 1 ? "Silver: +15% Total Damage." : `+15% Damage Multiplier.`
        if (type === 'icon') return nextLevel === 1 ? "Holy Icon: -10% Ability Cooldown." : `-10% Cooldown Multiplier.`


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
