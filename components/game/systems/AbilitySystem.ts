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
    'soul_siphon' | 'silver_tt33' | 'melter'

export type PassiveType = 'hp' | 'speed' | 'magnet' | 'armor' | 'area' | 'damage' | 'silver' | 'iron' | 'icon' | 'salt_passive' | 'garlic_ring' | 'regen'

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
        private vfx: VFXManager
    ) {
        // Start with Czosnek Halo (Garlic)
        this.addAbility('garlic')
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
        if (type === 'garlic') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'dagger') {
            ability = new DaggerWeapon(this.player, this.entityManager)
        } else if (type === 'holywater') {
            ability = new HolyWaterWeapon(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'stake') {
            ability = new AspenStakeWeapon(this.player, this.entityManager)
        } else if (type === 'cross') {
            ability = new CrossWeapon(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'salt') {
            ability = new SaltLineWeapon(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'tt33') {
            ability = new TT33Weapon(this.player, this.entityManager)
        } else if (type === 'ak_radioactive') {
            ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx)
        } else if (type === 'ak_ghzel') {
            ability = new GhzelAKWeapon(this.player, this.entityManager, this.vfx)
        } else if (type === 'ak_corrupted') {
            ability = new CorruptedAKWeapon(this.player, this.entityManager, this.vfx)
        } else if (type === 'ak_mushroom') {
            ability = new MushroomAKWeapon(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'nuclear_pigeon') {
            ability = new NuclearPigeon(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'lada') {
            ability = new LadaVehicle(this.scene, this.player, this.entityManager, this.vfx)
        } else if (type === 'propaganda_tower') {
            ability = new PropagandaTower(this.scene, this.player, this.entityManager, this.vfx)
        }
        // Evolutions (Reuse existing classes with boosted stats or new effects)
        else if (type === 'soul_siphon') {
            ability = new GarlicAura(this.scene, this.player, this.entityManager, this.vfx)
            ability.level = 8 // Special level for evo
            ability.damage *= 4
            ability.radius *= 1.6
        } else if (type === 'silver_tt33') {
            ability = new TT33Weapon(this.player, this.entityManager)
            ability.level = 8
            ability.damage *= 3
            ability.cooldown *= 0.5
        } else if (type === 'melter') {
            ability = new RadioactiveAKWeapon(this.player, this.entityManager, this.vfx)
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
        } else if (type === 'regen') {
            p.stats.regen += 1.0 // +1 HP per second
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
