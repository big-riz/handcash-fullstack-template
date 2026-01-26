
import * as THREE from 'three'
import { Player } from '../components/game/entities/Player'
import { EntityManager } from '../components/game/entities/EntityManager'
import { SpawnSystem } from '../components/game/systems/SpawnSystem'
import { AbilitySystem } from '../components/game/systems/AbilitySystem'
import { LevelUpSystem } from '../components/game/systems/LevelUpSystem' 
import { VFXManager } from '../components/game/systems/VFXManager'
import { BotController } from '../components/game/core/BotController' // New Import
import { SeededRandom } from '../lib/SeededRandom'
import { WORLDS } from '../components/game/data/worlds'
import characters from '../components/game/data/characters'

// --- MOCKS ---

class HeadlessVFXManager extends VFXManager {
    constructor() {
        super(new THREE.Scene()) // Pass dummy scene
    }
    createDamageNumber(x: number, z: number, amount: number, color: string, scale: number) {}
    createFloatingText(x: number, z: number, text: string, color: string | number, scale: number) {}
    createEmoji(x: number, z: number, emoji: string, scale: number) {}
    update(deltaTime: number) {}
    cleanup() {}
}

class HeadlessEntityManager extends EntityManager {
    public totalKills = 0
    public totalGemsSpawned = 0

    spawnGem(x: number, z: number, value: number) {
        this.totalKills++ // Approximate kills by gems spawned
        this.totalGemsSpawned++
        super.spawnGem(x, z, value)
    }
}

// --- SIMULATION CONFIG ---

const CONFIG = {
    durationSeconds: 1800, // 30 minutes
    tickRate: 60, // Hz
    logInterval: 5, // Seconds
    characterId: 'gopnik',
    worldId: 'dark_forest',
    seed: 'sim_test_001'
}

// --- MAIN ---

async function runSimulation() {
    console.log(`[SIM] Starting simulation: ${CONFIG.characterId} in ${CONFIG.worldId} (Seed: ${CONFIG.seed})`)
    
    // Setup 
    const scene = new THREE.Scene()
    
    // Player
    const player = new Player(0, 0)
    
    // Load Character Stats
    const charData = characters.find(c => c.id === CONFIG.characterId) || characters[0]
    if (charData.stats) {
        player.stats.maxHp = charData.stats.maxHp || 100
        player.stats.currentHp = player.stats.maxHp
        player.stats.moveSpeed = (charData.stats.moveSpeed || 1.0) * 8.0
        player.stats.xpToNextLevel = 30 // Increased from 25
        player.stats.growth = 1.0
    }
    
    // Systems
    const vfx = new HeadlessVFXManager()
    const entityManager = new HeadlessEntityManager(scene, player, vfx)
    const rng = new SeededRandom(CONFIG.seed)
    const spawnSystem = new SpawnSystem(entityManager, player, rng)
    
    const world = WORLDS.find(w => w.id === CONFIG.worldId) || WORLDS[0]
    spawnSystem.setWorld(world as any)

    // Abilities
    const startingWeapon = charData.startingWeapon
    const startingActives = ['garlic', startingWeapon, ...(charData.startingActives || [])]
    const startingPassives = (charData.startingPassives || [])
    
    const abilitySystem = new AbilitySystem(scene, player, entityManager, vfx, rng, null, startingActives as any[], startingPassives as any[])

    // Bot Controller (Headless Mode)
    const bot = new BotController(scene, player, entityManager, false)

    // Loop Variables
    const dt = 1.0 / CONFIG.tickRate
    let totalTime = 0
    let frameCount = 0
    let totalKills = 0
    let totalDamageDealt = 0
    let lastLogTime = 0

    console.log(`[SIM] Setup complete. Max HP: ${player.stats.maxHp}. Starting Loop...`)

    // Override Player createMesh to avoid issues if any (it uses Scene.add which is fine)
    player.createMesh(scene)

    // --- GAME LOOP ---
    
    try {
        while (totalTime < CONFIG.durationSeconds) {
            if (player.stats.currentHp <= 0) {
                console.log(`[SIM] 💀 PLAYER DIED at ${totalTime.toFixed(2)}s. Level: ${player.stats.level}`)
                break
            }

            const prevLevel = player.stats.level

            // AI Movement: Uses the shared BotController logic
            const { x: inputX, z: inputZ } = bot.getInput(totalTime)

            if (isNaN(inputX) || isNaN(inputZ)) {
                console.error(`[SIM] NaN Input Detected at T=${totalTime.toFixed(2)}s! input=(${inputX}, ${inputZ})`)
                break
            }

            // Updates
            player.update(dt, inputX, inputZ)

            if (isNaN(player.position.x) || isNaN(player.position.z)) {
                console.error(`[SIM] NaN Position Detected at T=${totalTime.toFixed(2)}s! Pos=(${player.position.x}, ${player.position.z})`)
                break
            }

            spawnSystem.update(dt)
            entityManager.update(dt)
            abilitySystem.update(dt)
            vfx.update(dt)

            // Auto-Level Up
            if (player.stats.level > prevLevel) {
                 // Use LevelUpSystem
                 const allowed = world.allowedUpgrades || ['all']
                 const choices = LevelUpSystem.getChoices(abilitySystem, player, allowed, rng)
                 
                 if (choices.length > 0) {
                     // BOT PRIORITY LOGIC (Hyper-Focus Garlic for survival - Simplified)
                     const ownedUpgrades = abilitySystem.getUpgrades()
                     const ownedIds = ownedUpgrades.map(u => u.id)

                     const topTierAoEActiveIds = ['garlic']; // Focus ONLY on garlic for this test
                     const hasMaxedGarlic = ownedUpgrades.some(u => u.id === 'garlic' && u.level >= 5);

                     let bestChoice = null;

                     // Priority 1: Level Up EXISTING GARLIC (absolute highest)
                     bestChoice = choices.find(c => 
                         c.id === 'garlic' && 
                         c.type === 'active' && 
                         ownedIds.includes(c.id) && 
                         abilitySystem.getAbilityLevel(c.id as any) < 5
                     );

                     // Priority 2: Level Up Garlic Ring (passive counterpart for AoE) - only if garlic active is maxed
                     if (!bestChoice && hasMaxedGarlic) {
                         bestChoice = choices.find(c => 
                            c.id === 'garlic_ring' && 
                            c.type === 'passive' && 
                            ownedIds.includes(c.id) && 
                            abilitySystem.getPassiveLevel(c.id as any) < 5
                         );
                     }

                     // Priority 3: Infinity Purse (Offensive Passive - XP Gain) - after AoE is maxed
                     if (!bestChoice && hasMaxedGarlic) {
                         bestChoice = choices.find(c => c.id === 'infinity_purse' && c.type === 'passive' && abilitySystem.getPassiveLevel(c.id as any) < 5)
                     }

                     // Priority 4: Holy Bread (Defensive Passive - Max HP) - after AoE and XP passive
                     if (!bestChoice && hasMaxedGarlic) {
                         bestChoice = choices.find(c => c.id === 'holy_bread' && c.type === 'passive' && abilitySystem.getPassiveLevel(c.id as any) < 5)
                     }

                     // Fallback: Just pick the first available if nothing specific matched
                     if (!bestChoice) {
                         bestChoice = choices[0]
                     }

                     if (bestChoice) {
                         if (bestChoice.type === 'evolution') {
                             const evoId = bestChoice.id.replace('evolve_', '')
                             const rules = abilitySystem.getAvailableEvolutions()
                             const rule = rules.find(r => r.evolvedAbility === evoId)
                             if (rule) abilitySystem.evolve(rule)
                         } else if (bestChoice.type === 'active') {
                             abilitySystem.addAbility(bestChoice.id as any)
                         } else if (bestChoice.type === 'passive') {
                             abilitySystem.addPassive(bestChoice.id as any)
                         }
                         console.log(`[SIM] 🆙 Level Up! Lvl ${player.stats.level}. Picked: ${bestChoice.title}`)
                     }
                 }
            }

            // Logging
            if (totalTime - lastLogTime >= CONFIG.logInterval) {
                const activeEnemies = entityManager.enemies.filter(e => e.isActive).length
                const activeGems = entityManager.gems.filter(g => g.isActive).length
                const dps = 0 // Need to track damage to calc this

                console.log(`[SIM] T=${totalTime.toFixed(1)}s | HP: ${Math.floor(player.stats.currentHp)}/${player.stats.maxHp} | Lvl: ${player.stats.level} | Enemies: ${activeEnemies} | Gems: ${activeGems} | Pos: (${player.position.x.toFixed(1)}, ${player.position.z.toFixed(1)})`)
                lastLogTime = totalTime
            }

            totalTime += dt
            frameCount++
        }
    } catch (e) {
        console.error("[SIM] CRASH:", e)
    }

    // Final Report
    console.log(`
    ════════════════════════════════════════
    🏁 SIMULATION COMPLETE
    ════════════════════════════════════════
    Result: ${player.stats.currentHp > 0 ? "SURVIVED" : "DIED"}
    Time: ${totalTime.toFixed(2)}s
    Level: ${player.stats.level}
    Kills: ${entityManager.totalKills}
    
    Weapons:
    ${abilitySystem.getUpgrades().map(u => `- ${u.id} (Lvl ${u.level})`).join('\n')}
    
    Stats:
    - Max HP: ${player.stats.maxHp}
    - Move Speed: ${player.stats.moveSpeed}
    - Might: ${player.stats.damageMultiplier}
    ════════════════════════════════════════
    `)
}

runSimulation()
