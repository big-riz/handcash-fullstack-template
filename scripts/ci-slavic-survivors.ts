#!/usr/bin/env tsx
/**
 * Slavic Survivors Continuous Integration Validator
 *
 * Validates all game data integrity, cross-references between systems,
 * balance sanity checks, and type coverage. Run with: npm run ci:game
 *
 * Exit code 0 = all checks pass
 * Exit code 1 = one or more checks failed
 */

// ─── Data Imports ──────────────────────────────────────────────────────
import enemies from '../components/game/data/enemies'
import actives from '../components/game/data/actives'
import passives from '../components/game/data/passives'
import evolutions from '../components/game/data/evolutions'
import characters from '../components/game/data/characters'
import { WORLDS } from '../components/game/data/worlds'
import { darkForestTimeline } from '../components/game/data/dark_forest_timeline'
import { frozenWasteTimeline } from '../components/game/data/frozen_waste_timeline'
import { catacombsTimeline } from '../components/game/data/catacombs_timeline'

// ─── Types ─────────────────────────────────────────────────────────────
interface CheckResult {
    name: string
    status: 'PASS' | 'FAIL' | 'WARN'
    details: string[]
}

// ─── Helpers ───────────────────────────────────────────────────────────
const enemyIds = new Set(enemies.map((e: any) => e.id))
const activeIds = new Set(actives.map((a: any) => a.id))
const passiveIds = new Set(passives.map((p: any) => p.id))
const evolutionIds = new Set(evolutions.map((e: any) => e.id))
const characterIds = new Set(characters.map((c: any) => c.id))
const allItemIds = new Set([...activeIds, ...passiveIds, ...evolutionIds])

// Known AbilityType values from AbilitySystem.ts
const knownAbilityTypes = new Set([
    'dagger', 'holywater', 'stake', 'cross', 'salt', 'tt33', 'propaganda_tower',
    'ak_radioactive', 'ak_ghzel', 'ak_corrupted', 'ak_mushroom', 'nuclear_pigeon', 'lada',
    'peppermill', 'shank', 'kabar', 'knuckles', 'stilleto', 'grail', 'soviet_stick', 'skull_screen', 'visors',
    'kvass_reactor', 'vampire_rat', 'pig_luggage', 'big_biz_lada', 'dadushka_chair', 'gopnik_gondola', 'tank_stroller', 'haunted_lada', 'gzhel_smg',
    'soul_siphon', 'silver_tt33', 'melter',
    'vodka_flamethrower', 'phantom_blade', 'orbital_tank', 'death_pigeon', 'immortal_lada', 'propaganda_storm',
    'assassins_edge', 'iron_fist', 'blessed_flood', 'divine_cross',
    'storm_blades', 'bone_daggers', 'blazing_stakes', 'eternal_grail', 'nuclear_spray'
])

const knownPassiveTypes = new Set([
    'beer_coin', 'boss_shoe', 'dove_coin', 'garlic_ring', 'holy_bread', 'battle_scarf',
    'holy_cheese', 'spy_hat', 'infinity_purse', 'ruby_ushanka', 'sunflower_pouch', 'pickled_gpu',
    'bone_charm', 'crypt_lantern'
])

const results: CheckResult[] = []

function check(name: string, fn: () => { status: 'PASS' | 'FAIL' | 'WARN', details: string[] }) {
    try {
        const result = fn()
        results.push({ name, ...result })
    } catch (err: any) {
        results.push({ name, status: 'FAIL', details: [`Exception: ${err.message}`] })
    }
}

// ─── Checks ────────────────────────────────────────────────────────────

// 1. Enemy data integrity
check('Enemy IDs are unique', () => {
    const ids = enemies.map((e: any) => e.id)
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique enemy types`] }
        : { status: 'FAIL', details: [`Duplicate enemy IDs: ${dupes.join(', ')}`] }
})

check('Enemy stats are valid', () => {
    const issues: string[] = []
    for (const e of enemies as any[]) {
        if (!e.id || !e.name) issues.push(`Enemy missing id/name: ${JSON.stringify(e)}`)
        if (typeof e.hp !== 'number' || e.hp <= 0) issues.push(`${e.id}: hp must be > 0 (got ${e.hp})`)
        if (typeof e.damage !== 'number' || e.damage <= 0) issues.push(`${e.id}: damage must be > 0 (got ${e.damage})`)
        if (typeof e.speed !== 'number' || e.speed < 0) issues.push(`${e.id}: speed must be >= 0 (got ${e.speed})`)
        if (e.speed > 10) issues.push(`${e.id}: speed ${e.speed} seems very high (>10)`)
        if (e.hp > 20000) issues.push(`${e.id}: hp ${e.hp} seems very high (>20000)`)
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${enemies.length} enemies have valid stats`] }
        : { status: 'FAIL', details: issues }
})

// 2. Active weapon data integrity
check('Active weapon IDs are unique', () => {
    const ids = actives.map((a: any) => a.id)
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique active weapons`] }
        : { status: 'FAIL', details: [`Duplicate active IDs: ${dupes.join(', ')}`] }
})

check('Active weapons have required fields', () => {
    const issues: string[] = []
    for (const a of actives as any[]) {
        if (!a.id) issues.push(`Active missing id`)
        if (!a.name) issues.push(`${a.id}: missing name`)
        if (!a.description) issues.push(`${a.id}: missing description`)
        if (!a.category) issues.push(`${a.id}: missing category`)
        if (!a.rarity) issues.push(`${a.id}: missing rarity`)
        if (typeof a.minLevel !== 'number') issues.push(`${a.id}: missing minLevel`)
        if (!Array.isArray(a.tags) || a.tags.length === 0) issues.push(`${a.id}: missing or empty tags`)
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${actives.length} actives have required fields`] }
        : { status: 'FAIL', details: issues }
})

const VALID_CATEGORIES = ['ActiveWeapon', 'Companion', 'Vehicle', 'Deployable']
const VALID_RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']

check('Active weapon categories are valid', () => {
    const issues: string[] = []
    const categoryCounts: Record<string, number> = {}
    for (const a of actives as any[]) {
        if (!VALID_CATEGORIES.includes(a.category)) {
            issues.push(`${a.id}: invalid category "${a.category}" (expected: ${VALID_CATEGORIES.join(', ')})`)
        }
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1
    }
    if (issues.length > 0) return { status: 'FAIL', details: issues }
    const details = Object.entries(categoryCounts).map(([c, n]) => `${c}: ${n}`)
    return { status: 'PASS', details: [`Category distribution: ${details.join(', ')}`] }
})

check('Active weapon rarities are valid', () => {
    const issues: string[] = []
    for (const a of actives as any[]) {
        if (!VALID_RARITIES.includes(a.rarity)) {
            issues.push(`${a.id}: invalid rarity "${a.rarity}" (expected: ${VALID_RARITIES.join(', ')})`)
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All actives have valid rarities`] }
        : { status: 'FAIL', details: issues }
})

check('Passive rarities are valid', () => {
    const issues: string[] = []
    for (const p of passives as any[]) {
        if (!VALID_RARITIES.includes(p.rarity)) {
            issues.push(`${p.id}: invalid rarity "${p.rarity}" (expected: ${VALID_RARITIES.join(', ')})`)
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All passives have valid rarities`] }
        : { status: 'FAIL', details: issues }
})

// 3. Passive data integrity
check('Passive IDs are unique', () => {
    const ids = passives.map((p: any) => p.id)
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique passives`] }
        : { status: 'FAIL', details: [`Duplicate passive IDs: ${dupes.join(', ')}`] }
})

check('Passives have statBonus', () => {
    const issues: string[] = []
    for (const p of passives as any[]) {
        if (!p.statBonus || typeof p.statBonus !== 'object') {
            issues.push(`${p.id}: missing statBonus object`)
        } else if (Object.keys(p.statBonus).length === 0) {
            issues.push(`${p.id}: statBonus is empty`)
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${passives.length} passives have stat bonuses`] }
        : { status: 'FAIL', details: issues }
})

// 4. Evolution cross-references
check('Evolution base weapons exist in actives', () => {
    const issues: string[] = []
    for (const e of evolutions as any[]) {
        if (!activeIds.has(e.baseWeapon) && !knownAbilityTypes.has(e.baseWeapon)) {
            issues.push(`Evolution "${e.id}": baseWeapon "${e.baseWeapon}" not found in actives or ability types`)
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${evolutions.length} evolution base weapons valid`] }
        : { status: 'FAIL', details: issues }
})

check('Evolution required passives exist', () => {
    const issues: string[] = []
    for (const e of evolutions as any[]) {
        if (!passiveIds.has(e.requiresPassive)) {
            issues.push(`Evolution "${e.id}": requiresPassive "${e.requiresPassive}" not in passives data`)
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All evolution passive requirements valid`] }
        : { status: 'FAIL', details: issues }
})

check('Evolution IDs are unique', () => {
    const ids = evolutions.map((e: any) => e.id)
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique evolutions`] }
        : { status: 'FAIL', details: [`Duplicate evolution IDs: ${dupes.join(', ')}`] }
})

// 5. Character cross-references
check('Character starting weapons exist', () => {
    const issues: string[] = []
    for (const c of characters as any[]) {
        if (!activeIds.has(c.startingWeapon) && !knownAbilityTypes.has(c.startingWeapon)) {
            issues.push(`Character "${c.id}": startingWeapon "${c.startingWeapon}" not in actives`)
        }
        if (c.startingActives) {
            for (const a of c.startingActives) {
                if (!activeIds.has(a) && !knownAbilityTypes.has(a)) {
                    issues.push(`Character "${c.id}": startingActive "${a}" not in actives`)
                }
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${characters.length} character starting weapons valid`] }
        : { status: 'FAIL', details: issues }
})

check('Character starting passives exist', () => {
    const issues: string[] = []
    for (const c of characters as any[]) {
        if (c.startingPassives) {
            for (const p of c.startingPassives) {
                if (!passiveIds.has(p)) {
                    issues.push(`Character "${c.id}": startingPassive "${p}" not in passives data`)
                }
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All character starting passives valid`] }
        : { status: 'FAIL', details: issues }
})

check('Character arsenal weapons exist', () => {
    const issues: string[] = []
    for (const c of characters as any[]) {
        if (c.arsenal?.weapons) {
            for (const w of c.arsenal.weapons) {
                if (!activeIds.has(w) && !knownAbilityTypes.has(w)) {
                    issues.push(`Character "${c.id}": arsenal weapon "${w}" not in actives`)
                }
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All character arsenal weapons valid`] }
        : { status: 'FAIL', details: issues }
})

check('Character arsenal passives exist', () => {
    const issues: string[] = []
    for (const c of characters as any[]) {
        if (c.arsenal?.passives) {
            for (const p of c.arsenal.passives) {
                if (!passiveIds.has(p)) {
                    issues.push(`Character "${c.id}": arsenal passive "${p}" not in passives data`)
                }
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All character arsenal passives valid`] }
        : { status: 'FAIL', details: issues }
})

check('Character IDs are unique', () => {
    const ids = characters.map((c: any) => c.id)
    const dupes = ids.filter((id: string, i: number) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique characters`] }
        : { status: 'FAIL', details: [`Duplicate character IDs: ${dupes.join(', ')}`] }
})

check('Character stats are reasonable', () => {
    const issues: string[] = []
    for (const c of characters as any[]) {
        const s = c.stats
        if (!s) { issues.push(`${c.id}: missing stats`); continue }
        if (s.maxHp <= 0) issues.push(`${c.id}: maxHp ${s.maxHp} must be > 0`)
        if (s.moveSpeed <= 0) issues.push(`${c.id}: moveSpeed ${s.moveSpeed} must be > 0`)
        if (s.maxHp > 500) issues.push(`${c.id}: maxHp ${s.maxHp} seems very high`)
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All character stats within range`] }
        : issues.some(i => i.includes('must be'))
            ? { status: 'FAIL', details: issues }
            : { status: 'WARN', details: issues }
})

// 6. World data validation
check('World IDs are unique', () => {
    const ids = WORLDS.map(w => w.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    return dupes.length === 0
        ? { status: 'PASS', details: [`${ids.length} unique worlds`] }
        : { status: 'FAIL', details: [`Duplicate world IDs: ${dupes.join(', ')}`] }
})

check('World availableEnemies reference valid enemy types', () => {
    const issues: string[] = []
    for (const w of WORLDS) {
        for (const eType of w.availableEnemies) {
            if (!enemyIds.has(eType)) {
                issues.push(`World "${w.id}": availableEnemy "${eType}" not in enemies data`)
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All world enemy references valid`] }
        : { status: 'FAIL', details: issues }
})

check('World allowedUpgrades reference valid items', () => {
    const issues: string[] = []
    const warnings: string[] = []
    for (const w of WORLDS) {
        for (const itemId of w.allowedUpgrades) {
            if (!allItemIds.has(itemId)) {
                issues.push(`World "${w.id}": allowedUpgrade "${itemId}" not found in actives/passives/evolutions`)
            }
        }
        // Check that world has at least some actives and passives
        const worldActives = w.allowedUpgrades.filter(id => activeIds.has(id))
        const worldPassives = w.allowedUpgrades.filter(id => passiveIds.has(id))
        if (worldActives.length === 0) warnings.push(`World "${w.id}": no active weapons in allowedUpgrades`)
        if (worldPassives.length === 0) warnings.push(`World "${w.id}": no passives in allowedUpgrades`)
    }
    if (issues.length > 0) return { status: 'FAIL', details: [...issues, ...warnings] }
    if (warnings.length > 0) return { status: 'WARN', details: warnings }
    return { status: 'PASS', details: [`All world upgrade references valid`] }
})

check('World win conditions are valid', () => {
    const issues: string[] = []
    for (const w of WORLDS) {
        if (!['level', 'time', 'kills'].includes(w.winCondition)) {
            issues.push(`World "${w.id}": invalid winCondition "${w.winCondition}"`)
        }
        if (w.winValue <= 0) issues.push(`World "${w.id}": winValue must be > 0`)
        if (w.difficultyMultiplier <= 0) issues.push(`World "${w.id}": difficultyMultiplier must be > 0`)
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All world win conditions valid`] }
        : { status: 'FAIL', details: issues }
})

// 7. Timeline validation
function validateTimeline(name: string, timeline: any[]): CheckResult {
    const issues: string[] = []
    let prevTime = -1

    for (let i = 0; i < timeline.length; i++) {
        const evt = timeline[i]

        // Time ordering
        if (evt.time < prevTime) {
            issues.push(`Event #${i}: time ${evt.time}s is before previous ${prevTime}s (not sorted)`)
        }
        prevTime = evt.time

        // Enemy type exists
        if (!enemyIds.has(evt.enemyType)) {
            issues.push(`Event #${i} (${evt.time}s): enemyType "${evt.enemyType}" not in enemies data`)
        }

        // Count is valid
        if (typeof evt.count !== 'number' || evt.count <= 0) {
            issues.push(`Event #${i} (${evt.time}s): count must be > 0 (got ${evt.count})`)
        }

        // Time is non-negative
        if (evt.time < 0) {
            issues.push(`Event #${i}: negative time ${evt.time}`)
        }
    }

    return {
        name: `Timeline "${name}" integrity`,
        status: issues.length === 0 ? 'PASS' : 'FAIL',
        details: issues.length === 0 ? [`${timeline.length} events, last at ${prevTime}s`] : issues
    }
}

results.push(validateTimeline('Dark Forest', darkForestTimeline))
results.push(validateTimeline('Frozen Waste', frozenWasteTimeline))
results.push(validateTimeline('Catacombs', catacombsTimeline))

// 8. Timeline enemies match world's availableEnemies (WARN only - timelines can spawn extras)
check('Dark Forest timeline uses world-available enemies', () => {
    const worldEnemies = new Set(WORLDS.find(w => w.id === 'dark_forest')?.availableEnemies || [])
    const timelineEnemies = new Set(darkForestTimeline.map(e => e.enemyType))
    const extras = [...timelineEnemies].filter(e => !worldEnemies.has(e))
    if (extras.length === 0) {
        return { status: 'PASS', details: [`All timeline enemies in world's availableEnemies`] }
    }
    return {
        status: 'WARN',
        details: [`Timeline spawns enemies not in availableEnemies: ${extras.join(', ')}`,
            `(This is OK for scripted events but background spawner won't use these)`]
    }
})

check('Frozen Waste timeline uses world-available enemies', () => {
    const worldEnemies = new Set(WORLDS.find(w => w.id === 'frozen_waste')?.availableEnemies || [])
    const timelineEnemies = new Set(frozenWasteTimeline.map(e => e.enemyType))
    const extras = [...timelineEnemies].filter(e => !worldEnemies.has(e))
    if (extras.length === 0) {
        return { status: 'PASS', details: [`All timeline enemies in world's availableEnemies`] }
    }
    return {
        status: 'WARN',
        details: [`Timeline spawns enemies not in availableEnemies: ${extras.join(', ')}`,
            `(This is OK for scripted events but background spawner won't use these)`]
    }
})

check('Catacombs timeline uses world-available enemies', () => {
    const worldEnemies = new Set(WORLDS.find(w => w.id === 'catacombs')?.availableEnemies || [])
    const timelineEnemies = new Set(catacombsTimeline.map(e => e.enemyType))
    const extras = [...timelineEnemies].filter(e => !worldEnemies.has(e))
    if (extras.length === 0) {
        return { status: 'PASS', details: [`All timeline enemies in world's availableEnemies`] }
    }
    return {
        status: 'WARN',
        details: [`Timeline spawns enemies not in availableEnemies: ${extras.join(', ')}`,
            `(This is OK for scripted events but background spawner won't use these)`]
    }
})

// 9. AbilitySystem type coverage
check('All actives data IDs are in AbilityType union', () => {
    const missing: string[] = []
    for (const a of actives as any[]) {
        if (!knownAbilityTypes.has(a.id)) {
            missing.push(a.id)
        }
    }
    if (missing.length === 0) return { status: 'PASS', details: [`All ${actives.length} active IDs in AbilityType`] }
    return {
        status: 'WARN',
        details: [`Active IDs not in AbilityType union (need weapon impl): ${missing.join(', ')}`]
    }
})

check('All passives data IDs are in PassiveType union', () => {
    const missing: string[] = []
    for (const p of passives as any[]) {
        if (!knownPassiveTypes.has(p.id)) {
            missing.push(p.id)
        }
    }
    if (missing.length === 0) return { status: 'PASS', details: [`All ${passives.length} passive IDs in PassiveType`] }
    return { status: 'FAIL', details: [`Passive IDs not in PassiveType union: ${missing.join(', ')}`] }
})

// 10. Evolution consistency between data/evolutions.ts and AbilitySystem hardcoded rules
check('Evolutions in data match AbilitySystem hardcoded rules', () => {
    // AbilitySystem has these hardcoded evolutions:
    const abilitySystemEvolutions = [
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

    const dataEvos = new Map(evolutions.map((e: any) => [e.id, e]))
    const issues: string[] = []
    const warnings: string[] = []

    // Check hardcoded ones exist in data
    for (const evo of abilitySystemEvolutions) {
        const dataEvo = dataEvos.get(evo.evolvedAbility)
        if (!dataEvo) {
            issues.push(`AbilitySystem evolution "${evo.evolvedAbility}" not in evolutions data`)
        } else {
            if (dataEvo.baseWeapon !== evo.baseAbility) {
                issues.push(`"${evo.evolvedAbility}": baseWeapon mismatch - AbilitySystem="${evo.baseAbility}", data="${dataEvo.baseWeapon}"`)
            }
            if (dataEvo.requiresPassive !== evo.requiredPassive) {
                issues.push(`"${evo.evolvedAbility}": requiresPassive mismatch - AbilitySystem="${evo.requiredPassive}", data="${dataEvo.requiresPassive}"`)
            }
        }
    }

    // Check data evolutions beyond what AbilitySystem supports
    const supported = new Set(abilitySystemEvolutions.map(e => e.evolvedAbility))
    for (const e of evolutions as any[]) {
        if (!supported.has(e.id)) {
            warnings.push(`Evolution "${e.id}" in data but NOT in AbilitySystem hardcoded rules (not functional)`)
        }
    }

    if (issues.length > 0) return { status: 'FAIL', details: [...issues, ...warnings] }
    if (warnings.length > 0) return { status: 'WARN', details: warnings }
    return { status: 'PASS', details: [`All evolutions consistent`] }
})

// 11. Synergy validation (items referenced in synergies exist)
check('Synergy required items exist', () => {
    // Hardcoded synergies from AbilitySystem
    const synergies = [
        { id: 'soviet_arsenal', items: ['tt33', 'battle_scarf', 'propaganda_tower'] },
        { id: 'gopnik_gang', items: ['shank', 'beer_coin', 'boss_shoe'] },
        { id: 'nuclear_winter', items: ['nuclear_pigeon', 'pickled_gpu', 'ruby_ushanka'] },
        { id: 'speed_demon', items: ['boss_shoe', 'beer_coin', 'dove_coin'] },
        { id: 'tank_build', items: ['battle_scarf', 'holy_bread', 'ruby_ushanka'] },
        { id: 'lucky_charm', items: ['dove_coin', 'infinity_purse', 'sunflower_pouch'] },
        { id: 'undead_hunter', items: ['stake', 'spy_hat', 'dove_coin'] },
        { id: 'holy_crusade', items: ['cross', 'holywater', 'holy_bread'] },
        { id: 'crypt_raider', items: ['kabar', 'dagger', 'boss_shoe'] },
        { id: 'skull_warrior', items: ['skull_screen', 'knuckles', 'bone_charm'] },
    ]

    const issues: string[] = []
    for (const syn of synergies) {
        for (const item of syn.items) {
            if (!activeIds.has(item) && !passiveIds.has(item) && !knownAbilityTypes.has(item)) {
                issues.push(`Synergy "${syn.id}": item "${item}" not found in game data`)
            }
        }
    }
    return issues.length === 0
        ? { status: 'PASS', details: [`All ${synergies.length} synergy item references valid`] }
        : { status: 'FAIL', details: issues }
})

// 12. Evolution-world accessibility: every evolution in a world must have both ingredients in that world
check('World evolutions are achievable (base weapon + passive in same world)', () => {
    const evoMap = new Map(evolutions.map((e: any) => [e.id, e]))
    const issues: string[] = []
    const details: string[] = []

    for (const w of WORLDS) {
        const worldItems = new Set(w.allowedUpgrades)
        const worldEvos = w.allowedUpgrades.filter(id => evoMap.has(id))

        for (const evoId of worldEvos) {
            const evo = evoMap.get(evoId)!
            const hasBase = worldItems.has(evo.baseWeapon)
            const hasPassive = worldItems.has(evo.requiresPassive)

            if (!hasBase && !hasPassive) {
                issues.push(`World "${w.id}": evolution "${evoId}" missing BOTH base weapon "${evo.baseWeapon}" AND passive "${evo.requiresPassive}"`)
            } else if (!hasBase) {
                issues.push(`World "${w.id}": evolution "${evoId}" missing base weapon "${evo.baseWeapon}"`)
            } else if (!hasPassive) {
                issues.push(`World "${w.id}": evolution "${evoId}" missing passive "${evo.requiresPassive}"`)
            } else {
                details.push(`${w.id}: ${evoId} (${evo.baseWeapon} + ${evo.requiresPassive})`)
            }
        }
    }

    if (issues.length > 0) return { status: 'FAIL', details: issues }
    return { status: 'PASS', details: details.length > 0 ? details : ['No evolutions in worlds'] }
})

// Also check that every evolution appears in at least one world
check('All evolutions are available in at least one world', () => {
    const worldEvolutions = new Set<string>()
    for (const w of WORLDS) {
        for (const id of w.allowedUpgrades) {
            if (evolutionIds.has(id)) worldEvolutions.add(id)
        }
    }

    const missing = evolutions.filter((e: any) => !worldEvolutions.has(e.id)).map((e: any) => e.id)
    if (missing.length === 0) return { status: 'PASS', details: [`All ${evolutions.length} evolutions in at least one world`] }
    return { status: 'WARN', details: [`Evolutions not in any world: ${missing.join(', ')}`] }
})

// 12b. Balance sanity checks
check('Enemy HP distribution is reasonable', () => {
    const hps = enemies.map((e: any) => ({ id: e.id, hp: e.hp }))
    const sorted = [...hps].sort((a, b) => a.hp - b.hp)
    const min = sorted[0]
    const max = sorted[sorted.length - 1]
    const median = sorted[Math.floor(sorted.length / 2)]

    const details = [
        `HP range: ${min.id}(${min.hp}) to ${max.id}(${max.hp})`,
        `Median: ${median.id}(${median.hp})`,
        `Total enemies: ${enemies.length}`
    ]

    // Warn if huge gap between regular and boss HP
    const bosses = hps.filter(e => e.hp >= 1000)
    const regular = hps.filter(e => e.hp < 1000)
    if (bosses.length > 0 && regular.length > 0) {
        const maxRegular = Math.max(...regular.map(e => e.hp))
        const minBoss = Math.min(...bosses.map(e => e.hp))
        if (minBoss / maxRegular > 20) {
            details.push(`Large gap between regular (max ${maxRegular}) and boss (min ${minBoss}) HP`)
        }
    }

    return { status: 'PASS', details }
})

check('Rarity distribution across actives', () => {
    const rarities: Record<string, number> = {}
    for (const a of actives as any[]) {
        rarities[a.rarity] = (rarities[a.rarity] || 0) + 1
    }
    const details = Object.entries(rarities).map(([r, c]) => `${r}: ${c}`)
    return { status: 'PASS', details }
})

check('Rarity distribution across passives', () => {
    const rarities: Record<string, number> = {}
    for (const p of passives as any[]) {
        rarities[p.rarity] = (rarities[p.rarity] || 0) + 1
    }
    const details = Object.entries(rarities).map(([r, c]) => `${r}: ${c}`)
    return { status: 'PASS', details }
})

// 13. No orphaned items (items that appear in no character arsenal and no world)
check('No orphaned active weapons', () => {
    const referenced = new Set<string>()
    for (const c of characters as any[]) {
        if (c.startingWeapon) referenced.add(c.startingWeapon)
        if (c.startingActives) c.startingActives.forEach((a: string) => referenced.add(a))
        if (c.arsenal?.weapons) c.arsenal.weapons.forEach((w: string) => referenced.add(w))
    }
    for (const w of WORLDS) {
        w.allowedUpgrades.forEach(id => referenced.add(id))
    }
    // Also check evolutions base weapons
    for (const e of evolutions as any[]) {
        referenced.add(e.baseWeapon)
    }

    const orphaned = actives.filter((a: any) => !referenced.has(a.id)).map((a: any) => a.id)
    if (orphaned.length === 0) return { status: 'PASS', details: [`All actives referenced`] }
    return { status: 'WARN', details: [`Unreferenced actives: ${orphaned.join(', ')}`] }
})

check('No orphaned passives', () => {
    const referenced = new Set<string>()
    for (const c of characters as any[]) {
        if (c.startingPassives) c.startingPassives.forEach((p: string) => referenced.add(p))
        if (c.arsenal?.passives) c.arsenal.passives.forEach((p: string) => referenced.add(p))
    }
    for (const w of WORLDS) {
        w.allowedUpgrades.forEach(id => referenced.add(id))
    }
    for (const e of evolutions as any[]) {
        referenced.add(e.requiresPassive)
    }

    const orphaned = passives.filter((p: any) => !referenced.has(p.id)).map((p: any) => p.id)
    if (orphaned.length === 0) return { status: 'PASS', details: [`All passives referenced`] }
    return { status: 'WARN', details: [`Unreferenced passives: ${orphaned.join(', ')}`] }
})

// 14. Character can reach evolution requirements
check('Characters can reach their evolution combos', () => {
    const warnings: string[] = []

    // AbilitySystem hardcoded evolutions
    const evoRules = [
        { base: 'skull_screen', passive: 'garlic_ring', name: 'soul_siphon' },
        { base: 'tt33', passive: 'spy_hat', name: 'silver_tt33' },
        { base: 'gzhel_smg', passive: 'pickled_gpu', name: 'melter' },
        { base: 'peppermill', passive: 'beer_coin', name: 'vodka_flamethrower' },
        { base: 'shank', passive: 'dove_coin', name: 'phantom_blade' },
        { base: 'tank_stroller', passive: 'ruby_ushanka', name: 'orbital_tank' },
        { base: 'nuclear_pigeon', passive: 'spy_hat', name: 'death_pigeon' },
        { base: 'haunted_lada', passive: 'holy_cheese', name: 'immortal_lada' },
        { base: 'propaganda_tower', passive: 'pickled_gpu', name: 'propaganda_storm' },
        { base: 'kabar', passive: 'battle_scarf', name: 'assassins_edge' },
        { base: 'knuckles', passive: 'holy_bread', name: 'iron_fist' },
        { base: 'holywater', passive: 'garlic_ring', name: 'blessed_flood' },
        { base: 'cross', passive: 'holy_cheese', name: 'divine_cross' },
        { base: 'stilleto', passive: 'boss_shoe', name: 'storm_blades' },
        { base: 'dagger', passive: 'bone_charm', name: 'bone_daggers' },
        { base: 'stake', passive: 'crypt_lantern', name: 'blazing_stakes' },
        { base: 'grail', passive: 'infinity_purse', name: 'eternal_grail' },
        { base: 'ak_radioactive', passive: 'sunflower_pouch', name: 'nuclear_spray' },
    ]

    for (const c of characters as any[]) {
        const weapons = new Set([c.startingWeapon, ...(c.startingActives || []), ...(c.arsenal?.weapons || [])])
        const psvs = new Set([...(c.startingPassives || []), ...(c.arsenal?.passives || [])])

        for (const evo of evoRules) {
            if (weapons.has(evo.base) && psvs.has(evo.passive)) {
                // Character can achieve this evolution
            } else if (weapons.has(evo.base) && !psvs.has(evo.passive)) {
                warnings.push(`${c.id}: has ${evo.base} but NOT ${evo.passive} (can't evolve to ${evo.name})`)
            }
        }
    }

    if (warnings.length === 0) return { status: 'PASS', details: [`Evolution reachability OK`] }
    return { status: 'WARN', details: warnings }
})

// 15. Timeline boss presence
check('Each world timeline has at least one boss event', () => {
    const issues: string[] = []
    const dfBosses = darkForestTimeline.filter(e => e.isBoss)
    const fwBosses = frozenWasteTimeline.filter(e => e.isBoss)
    const catBosses = catacombsTimeline.filter(e => e.isBoss)

    if (dfBosses.length === 0) issues.push(`Dark Forest timeline has no boss events`)
    if (fwBosses.length === 0) issues.push(`Frozen Waste timeline has no boss events`)
    if (catBosses.length === 0) issues.push(`Catacombs timeline has no boss events`)

    if (issues.length > 0) return { status: 'FAIL', details: issues }
    return {
        status: 'PASS',
        details: [
            `Dark Forest: ${dfBosses.length} boss events (${dfBosses.map(b => `${b.enemyType}@${b.time}s`).join(', ')})`,
            `Frozen Waste: ${fwBosses.length} boss events (${fwBosses.map(b => `${b.enemyType}@${b.time}s`).join(', ')})`,
            `Catacombs: ${catBosses.length} boss events (${catBosses.map(b => `${b.enemyType}@${b.time}s`).join(', ')})`
        ]
    }
})

// 16. Total spawn counts (balance info)
check('Timeline spawn totals', () => {
    const dfTotal = darkForestTimeline.reduce((sum, e) => sum + e.count, 0)
    const fwTotal = frozenWasteTimeline.reduce((sum, e) => sum + e.count, 0)
    const catTotal = catacombsTimeline.reduce((sum, e) => sum + e.count, 0)
    const dfDuration = Math.max(...darkForestTimeline.map(e => e.time))
    const fwDuration = Math.max(...frozenWasteTimeline.map(e => e.time))
    const catDuration = Math.max(...catacombsTimeline.map(e => e.time))

    return {
        status: 'PASS',
        details: [
            `Dark Forest: ${dfTotal} total spawns across ${darkForestTimeline.length} events (${(dfDuration / 60).toFixed(1)} min)`,
            `Frozen Waste: ${fwTotal} total spawns across ${frozenWasteTimeline.length} events (${(fwDuration / 60).toFixed(1)} min)`,
            `Catacombs: ${catTotal} total spawns across ${catacombsTimeline.length} events (${(catDuration / 60).toFixed(1)} min)`
        ]
    }
})

// 17. Synergy world achievability
check('Synergies are achievable in at least one world', () => {
    const synergies = [
        { id: 'soviet_arsenal', items: ['tt33', 'battle_scarf', 'propaganda_tower'] },
        { id: 'gopnik_gang', items: ['shank', 'beer_coin', 'boss_shoe'] },
        { id: 'nuclear_winter', items: ['nuclear_pigeon', 'pickled_gpu', 'ruby_ushanka'] },
        { id: 'speed_demon', items: ['boss_shoe', 'beer_coin', 'dove_coin'] },
        { id: 'tank_build', items: ['battle_scarf', 'holy_bread', 'ruby_ushanka'] },
        { id: 'lucky_charm', items: ['dove_coin', 'infinity_purse', 'sunflower_pouch'] },
        { id: 'undead_hunter', items: ['stake', 'spy_hat', 'dove_coin'] },
        { id: 'holy_crusade', items: ['cross', 'holywater', 'holy_bread'] },
        { id: 'crypt_raider', items: ['kabar', 'dagger', 'boss_shoe'] },
        { id: 'skull_warrior', items: ['skull_screen', 'knuckles', 'bone_charm'] },
    ]

    const issues: string[] = []
    const details: string[] = []

    for (const syn of synergies) {
        const availableWorlds: string[] = []
        for (const w of WORLDS) {
            const worldItems = new Set(w.allowedUpgrades)
            if (syn.items.every(item => worldItems.has(item))) {
                availableWorlds.push(w.id)
            }
        }
        if (availableWorlds.length === 0) {
            const missingByWorld: string[] = []
            for (const w of WORLDS) {
                const worldItems = new Set(w.allowedUpgrades)
                const missing = syn.items.filter(item => !worldItems.has(item))
                if (missing.length > 0) {
                    missingByWorld.push(`${w.id} missing: ${missing.join(', ')}`)
                }
            }
            issues.push(`Synergy "${syn.id}" unreachable - no world has all items (${missingByWorld.join('; ')})`)
        } else {
            details.push(`${syn.id}: achievable in ${availableWorlds.join(', ')}`)
        }
    }

    if (issues.length > 0) return { status: 'WARN', details: [...issues, ...details] }
    return { status: 'PASS', details }
})

// 18. Timeline spawn gap detection
function checkTimelineGaps(name: string, timeline: any[]): CheckResult {
    const duration = Math.max(...timeline.map((e: any) => e.time))
    // Scale threshold: short timelines (< 15min) use 15s, longer ones use 30s
    const GAP_THRESHOLD = duration > 900 ? 30 : 15
    const gaps: { from: number, to: number, gap: number }[] = []

    for (let i = 1; i < timeline.length; i++) {
        const gap = timeline[i].time - timeline[i - 1].time
        if (gap > GAP_THRESHOLD) {
            gaps.push({ from: timeline[i - 1].time, to: timeline[i].time, gap })
        }
    }

    // Compute average gap for context
    let totalGap = 0
    for (let i = 1; i < timeline.length; i++) {
        totalGap += timeline[i].time - timeline[i - 1].time
    }
    const avgGap = totalGap / (timeline.length - 1)

    if (gaps.length === 0) {
        return {
            name: `Timeline "${name}" pacing (no gaps > ${GAP_THRESHOLD}s)`,
            status: 'PASS',
            details: [`No spawn gaps > ${GAP_THRESHOLD}s. Avg gap: ${avgGap.toFixed(1)}s over ${(duration / 60).toFixed(1)} min`]
        }
    }

    const maxGap = Math.max(...gaps.map(g => g.gap))
    const bigGaps = gaps.filter(g => g.gap > GAP_THRESHOLD * 1.5)

    return {
        name: `Timeline "${name}" pacing (${gaps.length} gaps > ${GAP_THRESHOLD}s)`,
        status: bigGaps.length > 3 ? 'WARN' : 'PASS',
        details: [
            `${gaps.length} gaps > ${GAP_THRESHOLD}s (max: ${maxGap.toFixed(1)}s, avg: ${avgGap.toFixed(1)}s)`,
            ...(bigGaps.length > 0 ? [`Largest gaps: ${bigGaps.slice(0, 5).map(g =>
                `${(g.from / 60).toFixed(1)}m→${(g.to / 60).toFixed(1)}m (${g.gap.toFixed(0)}s)`
            ).join(', ')}`] : [])
        ]
    }
}

results.push(checkTimelineGaps('Dark Forest', darkForestTimeline))
results.push(checkTimelineGaps('Frozen Waste', frozenWasteTimeline))
results.push(checkTimelineGaps('Catacombs', catacombsTimeline))

// 19. Character starting weapon uniqueness
check('Characters have unique starting weapons', () => {
    const weaponMap = new Map<string, string[]>()
    for (const c of characters as any[]) {
        const w = c.startingWeapon
        if (!weaponMap.has(w)) weaponMap.set(w, [])
        weaponMap.get(w)!.push(c.id)
    }

    const dupes = [...weaponMap.entries()].filter(([_, chars]) => chars.length > 1)
    if (dupes.length > 0) {
        return {
            status: 'FAIL',
            details: dupes.map(([w, chars]) => `"${w}" shared by: ${chars.join(', ')}`)
        }
    }

    const details = [...weaponMap.entries()].map(([w, [char]]) => `${char}: ${w}`)
    return { status: 'PASS', details }
})

// 20. World content minimums
check('Each world has sufficient actives and passives', () => {
    const issues: string[] = []
    const details: string[] = []
    for (const w of WORLDS) {
        const worldActives = w.allowedUpgrades.filter(id => activeIds.has(id))
        const worldPassives = w.allowedUpgrades.filter(id => passiveIds.has(id))
        const worldEvos = w.allowedUpgrades.filter(id => evolutionIds.has(id))
        if (worldActives.length < 5) issues.push(`World "${w.id}": only ${worldActives.length} actives (minimum 5)`)
        if (worldPassives.length < 5) issues.push(`World "${w.id}": only ${worldPassives.length} passives (minimum 5)`)
        details.push(`${w.id}: ${worldActives.length} actives, ${worldPassives.length} passives, ${worldEvos.length} evolutions`)
    }
    if (issues.length > 0) return { status: 'FAIL', details: [...issues, ...details] }
    return { status: 'PASS', details }
})

check('Each world has sufficient enemy variety', () => {
    const issues: string[] = []
    const details: string[] = []
    for (const w of WORLDS) {
        if (w.availableEnemies.length < 5) {
            issues.push(`World "${w.id}": only ${w.availableEnemies.length} enemy types (minimum 5)`)
        }
        details.push(`${w.id}: ${w.availableEnemies.length} enemy types`)
    }
    if (issues.length > 0) return { status: 'FAIL', details: [...issues, ...details] }
    return { status: 'PASS', details }
})

check('Each timeline spans at least 10 minutes', () => {
    const timelines = [
        { name: 'Dark Forest', tl: darkForestTimeline },
        { name: 'Frozen Waste', tl: frozenWasteTimeline },
        { name: 'Catacombs', tl: catacombsTimeline }
    ]
    const issues: string[] = []
    const details: string[] = []
    for (const { name, tl } of timelines) {
        const duration = Math.max(...tl.map(e => e.time))
        if (duration < 600) {
            issues.push(`Timeline "${name}": only ${(duration / 60).toFixed(1)} min (minimum 10 min)`)
        }
        details.push(`${name}: ${(duration / 60).toFixed(1)} min`)
    }
    if (issues.length > 0) return { status: 'FAIL', details: [...issues, ...details] }
    return { status: 'PASS', details }
})

// 21. Character-world compatibility (each character can play each world)
check('All characters have weapons available in each world', () => {
    const warnings: string[] = []
    const details: string[] = []
    for (const c of characters as any[]) {
        for (const w of WORLDS) {
            const worldItems = new Set(w.allowedUpgrades)
            if (!worldItems.has(c.startingWeapon)) {
                warnings.push(`${c.id}: starting weapon "${c.startingWeapon}" not in ${w.id}`)
            }
        }
    }
    if (warnings.length > 0) return { status: 'WARN', details: warnings }
    return { status: 'PASS', details: [`All characters can play in all worlds`] }
})

// ─── Report ────────────────────────────────────────────────────────────

const passed = results.filter(r => r.status === 'PASS').length
const warned = results.filter(r => r.status === 'WARN').length
const failed = results.filter(r => r.status === 'FAIL').length

console.log('\n' + '='.repeat(70))
console.log('  SLAVIC SURVIVORS - Continuous Integration Report')
console.log('='.repeat(70))
console.log(`  ${new Date().toISOString()}`)
console.log('='.repeat(70) + '\n')

for (const r of results) {
    const icon = r.status === 'PASS' ? '[PASS]' : r.status === 'WARN' ? '[WARN]' : '[FAIL]'
    console.log(`${icon} ${r.name}`)
    for (const d of r.details) {
        console.log(`       ${d}`)
    }
}

console.log('\n' + '-'.repeat(70))
console.log(`  SUMMARY: ${passed} passed, ${warned} warnings, ${failed} failed (${results.length} total)`)
console.log('-'.repeat(70))

// Game data summary
console.log('\n  GAME DATA SUMMARY:')
console.log(`    Enemies:    ${enemies.length}`)
console.log(`    Actives:    ${actives.length}`)
console.log(`    Passives:   ${passives.length}`)
console.log(`    Evolutions: ${evolutions.length}`)
console.log(`    Characters: ${characters.length}`)
console.log(`    Worlds:     ${WORLDS.length}`)
console.log(`    Dark Forest Timeline: ${darkForestTimeline.length} events`)
console.log(`    Frozen Waste Timeline: ${frozenWasteTimeline.length} events`)
console.log(`    Catacombs Timeline: ${catacombsTimeline.length} events`)
console.log('')

if (failed > 0) {
    console.log('  ** CI FAILED ** - Fix the above issues before merging.\n')
    process.exit(1)
} else if (warned > 0) {
    console.log('  CI PASSED with warnings. Review above items.\n')
    process.exit(0)
} else {
    console.log('  CI PASSED - All checks green.\n')
    process.exit(0)
}
