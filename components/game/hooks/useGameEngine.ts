import { useRef, useEffect, useState, MutableRefObject } from "react"
import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { ProfiledGameLoop } from "../core/ProfiledGameLoop"
import { PerformanceProfiler, PerformanceMetrics, GameStatsHistory } from "../core/PerformanceProfiler"
import { InputManager } from "../core/Input"
import { BotController } from "../core/BotController"
import { Player } from "../entities/Player"
import { EntityManager } from "../entities/EntityManager"
import { SpawnSystem } from "../systems/SpawnSystem"
import { AbilitySystem } from "../systems/AbilitySystem"
import { VFXManager } from "../systems/VFXManager"
import { SeededRandom } from "@/lib/SeededRandom"
import { ReplayRecorder, ReplayPlayer, ReplayData, ReplayEventType } from "@/lib/ReplaySystem"
import { EventSystem } from "../systems/EventSystem"
import { AudioManager } from "../core/AudioManager"
import { SpriteSystem } from "../core/SpriteSystem"
import { BenchmarkMode } from "../debug/BenchmarkMode"

import { ItemTemplate } from "@/lib/item-templates-storage"
import { CharacterInfo } from "../types"
import { WORLDS } from "@/components/game/data/worlds"
import { getCustomLevel } from "@/lib/custom-levels-storage"
import { CustomLevelData, MeshPlacement, PaintedArea, SplinePath } from "@/components/game/debug/LevelEditor"
import { generateScatterObject } from "@/components/game/utils/scatterUtils"
import { generateMeshObject } from "@/components/game/utils/meshUtils"
import { MESH_TYPES } from "@/components/game/data/meshes"
import { generateProceduralMeshes } from "@/components/game/utils/proceduralMeshGenerator"
import { PROCEDURAL_MESH_CONFIGS } from "@/components/game/data/proceduralMeshConfigs"
import activeData from '@/components/game/data/actives'
import passiveData from '@/components/game/data/passives'
import evolutionData from '@/components/game/data/evolutions'
import characterDataImport from '@/components/game/data/characters'
import { getItemInfo, resolveItemIcon } from "../utils/itemUtils"

const characterData: CharacterInfo[] = characterDataImport as CharacterInfo[]

// Global cache for custom levels (shared across all instances)
let customLevelsCache: any[] = []

// Helper function to get world data (including custom levels) - SYNCHRONOUS
// Note: This is called very frequently, keep logging minimal
let lastLoggedWorldId: string | null = null
function getWorldData(worldId: string) {
    // Try default worlds first
    const defaultWorld = WORLDS.find(w => w.id === worldId)
    if (defaultWorld) {
        return defaultWorld
    }

    // Try custom levels from cache
    const customLevel = customLevelsCache.find(l => l.id === worldId)
    if (customLevel) {
        // Only log once per world to avoid spam
        if (worldId !== lastLoggedWorldId) {
            console.log(`[GameEngine] Loaded custom level: ${customLevel.name} (${worldId})`)
            lastLoggedWorldId = worldId
        }
        return customLevel
    }

    // Fallback to first world
    console.warn(`[GameEngine] World ${worldId} not found, using default (cache has ${customLevelsCache.length} levels)`)
    return WORLDS[0]
}

// Update custom levels cache (called from component)
export function updateCustomLevelsCache(levels: any[]) {
    customLevelsCache = levels
    lastLoggedWorldId = null // Reset so next level load will log

    if (levels.length > 0) {
        console.log(`[GameEngine] Updated cache with ${levels.length} custom level(s):`,
            levels.map(l => `${l.name} (${l.id})`).join(', '))
    }
}

interface UseGameEngineProps {
    containerRef: MutableRefObject<HTMLDivElement | null>
    gameState: string
    setGameState: (state: any) => void
    selectedWorldId: string
    selectedCharacterId: string
    setPlayerHp: (hp: number) => void
    setPlayerMaxHp: (hp: number) => void
    setPlayerLevel: (lvl: number) => void
    setPlayerXp: (xp: number) => void
    setPlayerXpTarget: (xp: number) => void
    setGameTime: (time: number) => void
    setKills: (kills: number) => void
    setDamageDealt: (damage: number) => void
    setDamageTaken: (damage: number) => void
    setActiveSynergies: (synergies: {name: string, description: string}[]) => void
    setDifficultyMultiplier: (multiplier: number) => void
    setTotalRuns: (updater: (prev: number) => number) => void
    scores: any[]
    setScores: (scores: any[]) => void
    user: any
    playerName: string
    setPlayerName: (name: string) => void
    setShowScoreInput: (show: boolean) => void
    setSelectedCharacterId: (id: string) => void
    setSelectedWorldId: (id: string) => void
    setWorldStars: (updater: (prev: Record<string, number>) => Record<string, number>) => void
    setUnlockedCharacters: (updater: (prev: Set<string>) => Set<string>) => void
    setNewHeroUnlocked: (hero: string | null) => void
    itemTemplates: ItemTemplate[]
    submitReplayToDB: (overrideName?: string) => void
    saveScore: () => void
    banishedItems: Set<string>
    setBanishedItems: (set: Set<string>) => void
    replayPaused: boolean
    replaySpeed: number
    gameSpeed: number
    isBotActive: boolean
    setWaveNotification: (message: string | null) => void
    // Performance Profiler
    setProfilerMetrics: (metrics: PerformanceMetrics | null) => void
    setProfilerWarnings: (warnings: string[]) => void
    setFPSHistory: (history: number[]) => void
    setGameStatsHistory: (history: GameStatsHistory) => void
    // External Refs
    playerRef: MutableRefObject<Player | null>
    abilitySystemRef: MutableRefObject<AbilitySystem | null>
    replayRef: MutableRefObject<ReplayRecorder | null>
    audioManagerRef: MutableRefObject<AudioManager | null>
}

export function useGameEngine({
    containerRef,
    gameState,
    setGameState,
    selectedWorldId,
    selectedCharacterId,
    setPlayerHp,
    setPlayerMaxHp,
    setPlayerLevel,
    setPlayerXp,
    setPlayerXpTarget,
    setGameTime,
    setKills,
    setDamageDealt,
    setDamageTaken,
    setActiveSynergies,
    setDifficultyMultiplier,
    setTotalRuns,
    scores,
    setScores,
    user,
    playerName,
    setPlayerName,
    setShowScoreInput,
    setSelectedCharacterId,
    setSelectedWorldId,
    setWorldStars,
    setUnlockedCharacters,
    setNewHeroUnlocked,
    itemTemplates,
    submitReplayToDB,
    saveScore,
    banishedItems,
    setBanishedItems,
    replayPaused,
    replaySpeed,
    gameSpeed,
    isBotActive,
    setWaveNotification,
    setProfilerMetrics,
    setProfilerWarnings,
    setFPSHistory,
    setGameStatsHistory,
    playerRef,
    abilitySystemRef,
    replayRef,
    audioManagerRef
}: UseGameEngineProps) {

    // Internal Refs
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const gameLoopRef = useRef<ProfiledGameLoop | null>(null)
    const inputManagerRef = useRef<InputManager | null>(null)
    const botControllerRef = useRef<BotController | null>(null)
    const benchmarkRef = useRef<BenchmarkMode | null>(null)
    // playerRef passed from prop
    const entityManagerRef = useRef<EntityManager | null>(null)
    const spawnSystemRef = useRef<SpawnSystem | null>(null)
    // abilitySystemRef passed from prop
    const eventSystemRef = useRef<EventSystem | null>(null)
    const vfxManagerRef = useRef<VFXManager | null>(null)
    const spriteSystemRef = useRef<SpriteSystem | null>(null)
    const rngRef = useRef<SeededRandom | null>(null)
    // replayRef passed from prop
    const replayPlayerRef = useRef<ReplayPlayer | null>(null)
    const pendingReplaySeed = useRef<string | null>(null) // Stores seed for replay that needs to be initialized
    const allowPostVictoryRef = useRef(false) // Legacy - allows continuing after final victory
    const shownVictoryMilestonesRef = useRef<Set<number>>(new Set()) // Tracks which victory levels (10, 20, 30) have been shown
    const pendingLevelUpAfterVictoryRef = useRef(false) // Tracks if level-up should show after victory screen
    const replayFrameRef = useRef<number>(0)
    const gameTimeRef = useRef<number>(0)
    const obstaclesRef = useRef<{ x: number, z: number, radius: number }[]>([])
    const levelUpChoices = useRef<any[]>([])
    const missingItemsRef = useRef<Set<string>>(new Set())
    const gltfLoaderRef = useRef<GLTFLoader | null>(null)
    const loadedModelsRef = useRef<Map<string, { model: THREE.Group, collisionRadius: number }>>(new Map())
    const sceneGltfObjectsRef = useRef<THREE.Object3D[]>([])

    const gameStateRef = useRef(gameState)
    useEffect(() => { gameStateRef.current = gameState }, [gameState])

    const isBotActiveRef = useRef(isBotActive)
    useEffect(() => { isBotActiveRef.current = isBotActive }, [isBotActive])

    const replayPausedRef = useRef(replayPaused)
    useEffect(() => { replayPausedRef.current = replayPaused }, [replayPaused])

    const replaySpeedRef = useRef(replaySpeed)
    useEffect(() => { replaySpeedRef.current = replaySpeed }, [replaySpeed])

    const gameSpeedRef = useRef(gameSpeed)
    useEffect(() => { gameSpeedRef.current = gameSpeed }, [gameSpeed])

    // Camera Constants
    const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
    const cameraDistance = 35
    const cameraPitch = 55 * (Math.PI / 180)
    const cameraZoomRef = useRef<number>(1.0) // Dynamic zoom level (1.0 = default)
    const minZoom = 0.5 // Max zoom out (see more)
    const maxZoom = 2.5 // Max zoom in (see less)

    // Logic Functions
    const getLevelUpChoices = () => {
        const p = playerRef.current
        const as = abilitySystemRef.current
        if (!p || !as) return []

        const currentWorld = getWorldData(selectedWorldId)
        const allowed = [...(currentWorld.allowedUpgrades || ['all'])]
        const levelGateBonus = selectedWorldId === 'frozen_waste' ? 3 : 0
        const gatingLevel = p.stats.level + levelGateBonus

        const character = characterData.find(c => c.id === selectedCharacterId) || characterData[0]

        // Get character's arsenal (character-specific items)
        const characterArsenal = (character as any).arsenal || { weapons: [], passives: [] }
        const characterWeapons = characterArsenal.weapons || []
        const characterPassives = characterArsenal.passives || []

        // For backwards compatibility, also allow starting items
        if (character.startingWeapon && !characterWeapons.includes(character.startingWeapon)) {
            characterWeapons.push(character.startingWeapon)
        }

        const ownedItems = as.getUpgrades().map(u => u.id)

        const actives = activeData.filter(a => {
            if (banishedItems.has(a.id)) return false
            // Check if item is in character's weapon arsenal OR already owned
            const isInCharacterArsenal = characterWeapons.includes(a.id)
            const isOwned = ownedItems.includes(a.id)
            // Only allow if it's in character's arsenal or already owned (for upgrades)
            return isInCharacterArsenal || isOwned
        }).map(a => {
            const imageUrl = resolveItemIcon(a.id, itemTemplates)
            return {
                id: a.id,
                itemId: a.id, // Keep original ID for emoji fallback
                title: a.name,
                desc: a.description,
                minLevel: a.minLevel,
                imageUrl: imageUrl,
                rarity: (a as any).rarity || 'Common'
            }
        })

        const passives = passiveData.filter(p => {
            if (banishedItems.has(p.id)) return false
            // Check if item is in character's passive arsenal OR already owned
            const isInCharacterArsenal = characterPassives.includes(p.id)
            const isOwned = ownedItems.includes(p.id)
            // Only allow if it's in character's arsenal or already owned (for upgrades)
            return isInCharacterArsenal || isOwned
        }).map(p => {
            const imageUrl = resolveItemIcon(p.id, itemTemplates)
            return {
                id: p.id,
                itemId: p.id, // Keep original ID for emoji fallback
                title: p.name,
                desc: p.description,
                minLevel: p.minLevel,
                imageUrl: imageUrl,
                rarity: (p as any).rarity || 'Common'
            }
        })

        const evos = as.getAvailableEvolutions().filter(evo => {
            return allowed.includes('all') || allowed.includes(evo.evolvedAbility) || ownedItems.includes(evo.evolvedAbility)
        }).map(evo => {
            let title = "Evolution"
            if (evo.evolvedAbility === 'soul_siphon') title = "Soul Siphon"
            else if (evo.evolvedAbility === 'silver_tt33') title = "Silver TT33"
            else if (evo.evolvedAbility === 'melter') title = "The Melter"
            const imageUrl = resolveItemIcon(evo.evolvedAbility, itemTemplates)
            return {
                id: `evolve_${evo.evolvedAbility}`,
                itemId: evo.evolvedAbility, // Keep evolution ID for emoji fallback
                title: title,
                desc: "ULTIMATE EVOLUTION: Massive power spike!",
                imageUrl: imageUrl,
                rarity: 'Evolution'
            }
        })

        const validActives = actives.filter(a => {
            const level = as.getAbilityLevel(a.id as any)
            if (level === 0) {
                if (gatingLevel < (a.minLevel ?? 0)) return false
                return as.canAddActive()
            }
            return level < 5
        })

        const validPassives = passives.filter(p => {
            const level = as.getPassiveLevel(p.id as any)
            if (level === 0) {
                if (gatingLevel < (p.minLevel ?? 0)) return false
                return as.canAddPassive()
            }
            return level < 5
        })

        const rarities: Record<string, number> = { 'Common': 100, 'Uncommon': 60, 'Rare': 30, 'Epic': 15, 'Legendary': 5, 'Evolution': 2 }
        const luck = p.stats.luck || 1.0
        const poolWithWeights = [
            ...validActives.map(item => ({ item, weight: (rarities[item.rarity] || 100) * (item.rarity === 'Common' ? 1 : luck) })),
            ...validPassives.map(item => ({ item, weight: (rarities[item.rarity] || 100) * (item.rarity === 'Common' ? 1 : luck) })),
            ...evos.map(item => ({ item, weight: (rarities['Evolution'] || 2) * luck }))
        ]

        const rng = rngRef.current || { next: () => Math.random() }
        const result: any[] = []

        while (result.length < 4 && poolWithWeights.length > 0) {
            const totalWeight = poolWithWeights.reduce((sum, entry) => sum + entry.weight, 0)
            let random = rng.next() * totalWeight
            let foundIndex = -1
            for (let i = 0; i < poolWithWeights.length; i++) {
                random -= poolWithWeights[i].weight
                if (random <= 0) {
                    foundIndex = i
                    break
                }
            }
            if (foundIndex !== -1) {
                const selectedEntry = poolWithWeights.splice(foundIndex, 1)[0]
                const selected = selectedEntry.item
                const isPassiveProp = passiveData.some(p => p.id === selected.id)
                const isEvo = selected.id.startsWith('evolve_')
                let desc = selected.desc
                if (!isEvo) {
                    const level = isPassiveProp ? as.getPassiveLevel(selected.id as any) : as.getAbilityLevel(selected.id as any)
                    const nextLevelDescription = as.getUpgradeDescription(selected.id, level + 1)
                    desc = level > 0 ? `Level ${level + 1}: ${nextLevelDescription}` : `New: ${nextLevelDescription}`
                }
                result.push({ ...selected, desc })
            } else {
                break
            }
        }
        return result
    }

    const checkHighScore = (level: number) => {
        const scoresForThisMap = scores.filter(s => (s.worldId || 'dark_forest') === selectedWorldId)
        const isHighScore = scoresForThisMap.length < 10 || level > (scoresForThisMap[scoresForThisMap.length - 1]?.level || 0)
        if (isHighScore) {
            saveScore()
        } else {
            submitReplayToDB()
        }
    }

    const handleUpgrade = (type: string, fromReplay = false) => {
        const as = abilitySystemRef.current
        if (!as) return

        if ((gameStateRef.current === "playing" || gameStateRef.current === "levelUp") && replayRef.current && !fromReplay) {
            replayRef.current.recordLevelUp(type)
        }

        if (type.startsWith('evolve_')) {
            const evoId = type.replace('evolve_', '')
            const evos = as.getAvailableEvolutions()
            const rule = evos.find(r => r.evolvedAbility === evoId)
            if (rule) as.evolve(rule)
        } else if (passiveData.some(p => p.id === type)) {
            as.addPassive(type as any)
        } else if (activeData.some(a => (a as any).id === type)) {
            as.addAbility(type as any)
        }
        audioManagerRef.current?.playUIClick();

        if (fromReplay) {
            setGameState("replaying")
        } else {
            setGameState("playing")
        }
    }

    const resetGame = (forReplay: boolean = false, overrideSeed?: string, overrideCharId?: string, overrideWorldId?: string) => {
        const p = playerRef.current
        const scene = sceneRef.current
        const em = entityManagerRef.current
        const vm = vfxManagerRef.current

        if (p && scene && em && vm) {
            allowPostVictoryRef.current = false
            shownVictoryMilestonesRef.current.clear() // Reset victory milestones for new game
            pendingLevelUpAfterVictoryRef.current = false // Reset pending level-up flag
            p.position.set(0, 0, 0)
            p.velocity.set(0, 0, 0)
            p.stats.currentHp = 100
            p.stats.maxHp = 100
            p.stats.level = 1
            p.stats.xp = 0
            p.stats.xpToNextLevel = 35
            setBanishedItems(new Set())
            p.stats.moveSpeed = 8.0
            p.stats.magnet = 2.5
            p.stats.armor = 0
            p.stats.areaMultiplier = 1.0
            p.stats.cooldownMultiplier = 1.0
            p.stats.damageMultiplier = 1.0

            setPlayerLevel(1)
            setGameTime(0)
            setKills(0)
            setDamageDealt(0)
            setDamageTaken(0)
            gameTimeRef.current = 0

            // Reset profiler for new game (preserves across level ups, resets on new game)
            const loop = gameLoopRef.current
            if (loop) {
                loop.getProfiler().reset()
            }

            const character = characterData.find(c => c.id === (overrideCharId || selectedCharacterId)) || characterData[0]
            if (character.stats) {
                p.stats.maxHp = character.stats.maxHp || 100
                p.stats.currentHp = p.stats.maxHp
                p.stats.moveSpeed = (character.stats.moveSpeed || 1.0) * 8.0
                p.stats.areaMultiplier = character.stats.area || 1.0
                p.stats.damageMultiplier = character.stats.might || 1.0
                p.stats.luck = character.stats.luck || 1.0
                p.stats.curse = character.stats.curse || 1.0
                p.stats.regen = character.stats.regen || 0
                p.stats.cooldownMultiplier = character.stats.cooldownMultiplier || 1.0
                p.stats.armor = character.stats.armor || 0
                p.stats.amount = character.stats.amount || 0
                p.stats.growth = character.stats.growth || 1.0
            }

            // No meta-progression bonuses - removed

            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)

            em.cleanup()
            em.setObstacles(obstaclesRef.current)
            vm.cleanup()
            abilitySystemRef.current?.cleanup()

            const newSeed = overrideSeed || Date.now().toString()
            const gameRNG = new SeededRandom(newSeed + "_game")
            const uiRNG = new SeededRandom(newSeed + "_ui")
            rngRef.current = uiRNG

            const startingWeapon = character.startingWeapon as any
            const startingActives = [startingWeapon, ...(character.startingActives || [])] as any[]
            const startingPassives = (character.startingPassives || []) as any[]

            abilitySystemRef.current = new AbilitySystem(scene, p, em, vm, gameRNG, audioManagerRef.current, startingActives, startingPassives)

            const currentWorldTemplate = getWorldData(overrideWorldId || selectedWorldId)
            const currentWorld = {
                ...currentWorldTemplate,
                allowedUpgrades: [...currentWorldTemplate.allowedUpgrades]
            }

            if (!currentWorld.allowedUpgrades.includes(startingWeapon)) {
                currentWorld.allowedUpgrades.push(startingWeapon)
            }

            replayRef.current = forReplay ? null : new ReplayRecorder(newSeed, (user?.publicProfile.handle || ''), selectedCharacterId, selectedWorldId)
            spawnSystemRef.current = new SpawnSystem(em, p, gameRNG)
            spawnSystemRef.current.setWorld(currentWorld)
            spawnSystemRef.current.setWaveMessageCallback((message: string) => {
                setWaveNotification(message)
                // Auto-clear notification after 4 seconds
                setTimeout(() => setWaveNotification(null), 4000)
            })
            eventSystemRef.current = new EventSystem({ spawnSystem: spawnSystemRef.current, entityManager: em, vfxManager: vm, player: p })
        }
        cameraTargetRef.current.set(0, 0, 0)
    }

    const startReplay = (score: any) => {
        if (score.seed && score.events) {
            // 1. Store the replay seed for initialization after systems are rebuilt
            pendingReplaySeed.current = score.seed

            // 2. Set the state to trigger the world/character rebuild via the main useEffect.
            if (score.characterId) setSelectedCharacterId(score.characterId)
            if (score.worldId) setSelectedWorldId(score.worldId)

            // 3. Prepare the replay player data.
            const replayData: ReplayData = {
                seed: score.seed,
                startTime: Date.now(),
                gameVersion: '0.1.0-alpha',
                events: score.events,
                finalLevel: score.level,
                finalTime: score.time,
                playerName: score.name,
                characterId: score.characterId,
                worldId: score.worldId
            }
            replayPlayerRef.current = new ReplayPlayer(replayData)
            replayFrameRef.current = 0

            // 4. Set the game state to begin playback on the next render.
            setGameState("replaying")
        }
    }

    // Main Effect
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(0x1a1e1a)
        scene.fog = new THREE.FogExp2(0x1a1e1a, 0.012)
        sceneRef.current = scene

        const WorldPreset = getWorldData(selectedWorldId)
        const skyColor = WorldPreset.theme?.skyColor || 0x1a1e1a
        const groundColor = WorldPreset.theme?.groundColor || 0x3d453d
        scene.background = new THREE.Color(skyColor)
        scene.fog = new THREE.FogExp2(skyColor, 0.012)

        const width = container.clientWidth
        const height = container.clientHeight
        const aspect = width / height
        const frustumSize = 24
        const camera = new THREE.OrthographicCamera(frustumSize * aspect / -2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / -2, 0.1, 1000)
        camera.position.set(0, cameraDistance * Math.sin(cameraPitch), -cameraDistance * Math.cos(cameraPitch))
        camera.lookAt(0, 0, 0)
        camera.zoom = cameraZoomRef.current
        camera.updateProjectionMatrix()
        cameraRef.current = camera

        const renderer = new THREE.WebGLRenderer({ antialias: true })
        renderer.setSize(width, height)
        renderer.setPixelRatio(window.devicePixelRatio)
        renderer.shadowMap.enabled = true
        renderer.shadowMap.type = THREE.PCFSoftShadowMap
        container.innerHTML = ""
        container.appendChild(renderer.domElement)
        renderer.domElement.addEventListener('contextmenu', (e) => e.preventDefault())
        rendererRef.current = renderer

        const groundGeo = new THREE.PlaneGeometry(3000, 3000)
        const envGroup = new THREE.Group()
        scene.add(envGroup)
        const groundMat = new THREE.MeshStandardMaterial({ roughness: 0.8, metalness: 0.1, color: groundColor })
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.01
        ground.receiveShadow = true
        scene.add(ground)

        let currentObstacles: { x: number, z: number, radius: number }[] = []

        // Check if built-in world with procedural config
        if (PROCEDURAL_MESH_CONFIGS[selectedWorldId]) {
            currentObstacles = generateProceduralMeshes(selectedWorldId, envGroup)
        } else {
            // Check for custom level data
            const customWorld = getWorldData(selectedWorldId) as CustomLevelData
            
            // 1. Render Painted Areas (Ground detail)
            if (customWorld.paintedAreas && customWorld.paintedAreas.length > 0) {
                // Create a single canvas for the entire painted texture
                const canvas = document.createElement('canvas')
                canvas.width = 2048
                canvas.height = 2048
                const ctx = canvas.getContext('2d')
                
                if (ctx) {
                    // Base layer: Ground Color
                    ctx.fillStyle = `#${(customWorld.theme.groundColor || 0x3d453d).toString(16).padStart(6, '0')}`
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    
                    // Paint layer for compositing
                    const paintCanvas = document.createElement('canvas')
                    paintCanvas.width = canvas.width
                    paintCanvas.height = canvas.height
                    const pCtx = paintCanvas.getContext('2d')

                    if (pCtx) {
                        const scale = canvas.width / 3000
                        const centerOffset = 1500

                        customWorld.paintedAreas.forEach(area => {
                            if (area.type === 'color' && area.color) {
                                pCtx.save()
                                
                                if (area.isEraser) {
                                    pCtx.globalCompositeOperation = 'destination-out'
                                    pCtx.fillStyle = 'rgba(0,0,0,1)'
                                } else {
                                    pCtx.globalCompositeOperation = 'source-over'
                                    pCtx.fillStyle = area.color
                                }

                                pCtx.globalAlpha = area.opacity ?? 1.0
                                const blurAmount = (1.0 - (area.hardness ?? 1.0)) * 20
                                if (blurAmount > 0) {
                                    pCtx.shadowBlur = blurAmount
                                    pCtx.shadowColor = area.isEraser ? 'rgba(0,0,0,1)' : area.color
                                }

                                const points = area.points.map(p => ({
                                    x: (p.x + centerOffset) * scale,
                                    y: (p.y + centerOffset) * scale
                                }))

                                if (area.shape === 'circle') {
                                    const width = Math.abs(points[1].x - points[0].x)
                                    const radius = width / 2
                                    const centerX = (points[0].x + points[2].x) / 2
                                    const centerY = (points[0].y + points[2].y) / 2
                                    pCtx.beginPath()
                                    pCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
                                    pCtx.fill()
                                } else if (points.length >= 3) {
                                    pCtx.beginPath()
                                    pCtx.moveTo(points[0].x, points[0].y)
                                    for (let i = 1; i < points.length; i++) {
                                        pCtx.lineTo(points[i].x, points[i].y)
                                    }
                                    pCtx.closePath()
                                    pCtx.fill()
                                }
                                
                                pCtx.restore()
                            }
                        })
                        // Composite paint onto base
                        ctx.drawImage(paintCanvas, 0, 0)
                    }

                    // Apply the final texture to the ground material
                    const texture = new THREE.CanvasTexture(canvas)
                    texture.wrapS = THREE.RepeatWrapping
                    texture.wrapT = THREE.RepeatWrapping
                    texture.colorSpace = THREE.SRGBColorSpace
                    if (ground.material instanceof THREE.MeshStandardMaterial) {
                        if (ground.material.map) ground.material.map.dispose()
                        ground.material.map = texture
                        ground.material.needsUpdate = true
                    }
                }

                // Render scatter objects on top of the texture
                customWorld.paintedAreas.forEach(area => {
                    if (area.type === 'scatter') {
                        const group = new THREE.Group()
                        const count = Math.floor((area.density || 50) / 5)
                        let seed = 0;
                        for (let i = 0; i < area.id.length; i++) {
                            seed = ((seed << 5) - seed) + area.id.charCodeAt(i);
                            seed |= 0;
                        }

                        for (let i = 0; i < count; i++) {
                            const scatterObject = generateScatterObject(area.meshType || 'grass', seed + i)
                            const points = area.points
                            const minX = Math.min(...points.map(p => p.x))
                            const maxX = Math.max(...points.map(p => p.x))
                            const minZ = Math.min(...points.map(p => p.y))
                            const maxZ = Math.max(...points.map(p => p.y))
                            scatterObject.position.set(
                                minX + Math.random() * (maxX - minX),
                                0, 
                                minZ + Math.random() * (maxZ - minZ)
                            )
                            group.add(scatterObject)
                        }
                        envGroup.add(group)
                    }
                })
            }

            // 2. Render Mesh Placements (Obstacles)
            if (customWorld.meshPlacements && customWorld.meshPlacements.length > 0) {
                // Initialize GLTF loader if not already done
                if (!gltfLoaderRef.current) {
                    gltfLoaderRef.current = new GLTFLoader()
                }

                customWorld.meshPlacements.forEach(placement => {
                    // Check if this is a custom mesh (GLB/GLTF)
                    const customDef = customWorld.customMeshDefinitions?.find(d => d.id === placement.meshType)

                    if (customDef) {
                        // ... (same GLTF loading logic)
                        const handleLoadSuccess = (gltfScene: THREE.Group | THREE.Scene, collisionRadius: number) => {
                            // Clone and position the model (same positioning as built-in mesh types)
                            const clone = gltfScene.clone(true)

                            // Position using same logic as built-in mesh types (center at placement.position.y)
                            clone.position.set(placement.position.x, placement.position.y, placement.position.z)
                            clone.rotation.set(placement.rotation.x, placement.rotation.y, placement.rotation.z)
                            clone.scale.set(
                                placement.scale.x * (customDef.scale || 1),
                                placement.scale.y * (customDef.scale || 1),
                                placement.scale.z * (customDef.scale || 1)
                            )

                            // Enable shadows
                            clone.traverse((child) => {
                                if (child instanceof THREE.Mesh) {
                                    child.castShadow = true
                                    child.receiveShadow = true
                                }
                            })

                            // Track for cleanup and add to scene
                            sceneGltfObjectsRef.current.push(clone)
                            envGroup.add(clone)

                            // Add collision
                            if (placement.hasCollision && collisionRadius > 0) {
                                currentObstacles.push({
                                    x: placement.position.x,
                                    z: placement.position.z,
                                    radius: collisionRadius * Math.max(placement.scale.x, placement.scale.z)
                                })
                            }
                        }

                        const handleLoadError = () => {
                            console.warn('Failed to load GLB:', customDef.url)
                            // Fallback to red cube
                            const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1)
                            const fallbackMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
                            const fallbackMesh = new THREE.Mesh(fallbackGeometry, fallbackMaterial)
                            fallbackMesh.position.set(placement.position.x, placement.position.y + 0.5, placement.position.z)
                            fallbackMesh.rotation.set(placement.rotation.x, placement.rotation.y, placement.rotation.z)
                            fallbackMesh.scale.set(
                                placement.scale.x,
                                placement.scale.y,
                                placement.scale.z
                            )
                            fallbackMesh.castShadow = true
                            fallbackMesh.receiveShadow = true

                            sceneGltfObjectsRef.current.push(fallbackMesh)
                            envGroup.add(fallbackMesh)

                            if (placement.hasCollision) {
                                currentObstacles.push({
                                    x: placement.position.x,
                                    z: placement.position.z,
                                    radius: 1.0
                                })
                            }
                        }

                        // Check cache first
                        if (loadedModelsRef.current.has(customDef.url)) {
                            // Use cached model
                            const cached = loadedModelsRef.current.get(customDef.url)
                            if (cached) {
                                handleLoadSuccess(cached.model, cached.collisionRadius)
                            }
                        } else {
                            // Load new GLB
                            gltfLoaderRef.current?.load(
                                customDef.url,
                                (gltf) => {
                                    const model = gltf.scene

                                    // Center and calculate bounds
                                    const box = new THREE.Box3().setFromObject(model)
                                    const center = box.getCenter(new THREE.Vector3())
                                    const size = box.getSize(new THREE.Vector3())

                                    // Center the model horizontally but keep base at origin
                                    model.position.x -= center.x
                                    model.position.z -= center.z
                                    model.position.y -= center.y

                                    // Calculate collision radius
                                    const collisionRadius = Math.max(size.x, size.z) * (customDef.scale || 1) * 0.5

                                    // Cache the model
                                    loadedModelsRef.current.set(customDef.url, {
                                        model: model,
                                        collisionRadius: collisionRadius
                                    })

                                    handleLoadSuccess(model, collisionRadius)
                                },
                                undefined,
                                handleLoadError
                            )
                        }
                    } else {
                        // Handle built-in mesh types using our new utility
                        const mesh = generateMeshObject(placement.meshType)

                        // Apply scale first, then measure LOCAL bounding box before rotation
                        mesh.scale.set(placement.scale.x, placement.scale.y, placement.scale.z)

                        let localSize: THREE.Vector3 | null = null
                        if (placement.hasCollision) {
                            const localBox = new THREE.Box3().setFromObject(mesh)
                            localSize = localBox.getSize(new THREE.Vector3())
                        }

                        // Now apply position and rotation for rendering
                        mesh.position.set(placement.position.x, placement.position.y, placement.position.z)
                        mesh.rotation.set(placement.rotation.x, placement.rotation.y, placement.rotation.z)

                        envGroup.add(mesh)

                        if (placement.hasCollision && localSize) {
                            // Use LOCAL (pre-rotation) dimensions for collision shape
                            const localLong = Math.max(localSize.x, localSize.z)
                            const localShort = Math.min(localSize.x, localSize.z)
                            const aspectRatio = localLong / (localShort || 0.1)
                            const isLocalZLong = localSize.z >= localSize.x

                            if (aspectRatio > 2.0 && localLong > 1.0) {
                                // Elongated mesh: distribute circles along the local long axis,
                                // then rotate circle positions by placement rotation
                                const segCount = Math.ceil(localLong / localShort)
                                const segSpacing = localLong / segCount
                                const rotY = placement.rotation.y
                                const cosR = Math.cos(rotY)
                                const sinR = Math.sin(rotY)

                                for (let s = 0; s < segCount; s++) {
                                    const localOffset = -localLong / 2 + segSpacing * (s + 0.5)
                                    // Place along local long axis, then rotate into world space
                                    const localX = isLocalZLong ? 0 : localOffset
                                    const localZ = isLocalZLong ? localOffset : 0
                                    const wx = cosR * localX - sinR * localZ
                                    const wz = sinR * localX + cosR * localZ
                                    currentObstacles.push({
                                        x: placement.position.x + wx,
                                        z: placement.position.z + wz,
                                        radius: localShort / 2 + 0.1
                                    })
                                }
                            } else {
                                currentObstacles.push({
                                    x: placement.position.x,
                                    z: placement.position.z,
                                    radius: Math.max(localSize.x, localSize.z) / 2
                                })
                            }
                        }
                    }
                })
            }

            // 3. Render Spline Paths (fences, walls, hedges along curves)
            if (customWorld.splinePaths && customWorld.splinePaths.length > 0) {
                customWorld.splinePaths.forEach((sp: SplinePath) => {
                    if (!sp.controlPoints || sp.controlPoints.length < 2) return

                    const points3D = sp.controlPoints.map((p: { x: number, z: number }) =>
                        new THREE.Vector3(p.x, 0, p.z)
                    )
                    const curve = new THREE.CatmullRomCurve3(points3D, sp.closed)
                    const totalLength = curve.getLength()
                    const count = Math.max(1, Math.floor(totalLength / sp.spacing))

                    for (let i = 0; i <= count; i++) {
                        const t = i / count
                        const point = curve.getPointAt(t)
                        const tangent = curve.getTangentAt(t)
                        const angle = Math.atan2(tangent.x, tangent.z)

                        const mesh = generateMeshObject(sp.meshType)
                        // Apply scale first, measure LOCAL bounding box before rotation
                        mesh.scale.setScalar(sp.scale)

                        let spLocalSize: THREE.Vector3 | null = null
                        if (sp.hasCollision) {
                            const localBox = new THREE.Box3().setFromObject(mesh)
                            spLocalSize = localBox.getSize(new THREE.Vector3())
                        }

                        // Now apply position and rotation for rendering
                        mesh.position.copy(point)
                        mesh.rotation.y = angle
                        mesh.traverse((child: THREE.Object3D) => {
                            if (child instanceof THREE.Mesh) {
                                child.castShadow = true
                                child.receiveShadow = true
                            }
                        })
                        envGroup.add(mesh)

                        if (sp.hasCollision && spLocalSize) {
                            const localLong = Math.max(spLocalSize.x, spLocalSize.z)
                            const localShort = Math.min(spLocalSize.x, spLocalSize.z)
                            const aspectRatio = localLong / (localShort || 0.1)
                            const isLocalZLong = spLocalSize.z >= spLocalSize.x

                            if (aspectRatio > 2.0 && localLong > 1.0) {
                                const segCount = Math.ceil(localLong / localShort)
                                const segSpacing = localLong / segCount
                                const cosA = Math.cos(angle)
                                const sinA = Math.sin(angle)

                                for (let s = 0; s < segCount; s++) {
                                    const localOff = -localLong / 2 + segSpacing * (s + 0.5)
                                    const localX = isLocalZLong ? 0 : localOff
                                    const localZ = isLocalZLong ? localOff : 0
                                    const wx = cosA * localX - sinA * localZ
                                    const wz = sinA * localX + cosA * localZ
                                    currentObstacles.push({
                                        x: point.x + wx,
                                        z: point.z + wz,
                                        radius: localShort / 2 + 0.1
                                    })
                                }
                            } else {
                                currentObstacles.push({
                                    x: point.x,
                                    z: point.z,
                                    radius: Math.max(spLocalSize.x, spLocalSize.z) / 2
                                })
                            }
                        }
                    }
                })
            }
        }
        obstaclesRef.current = currentObstacles

        const grid = new THREE.GridHelper(2000, 100, 0x555555, 0x444444)
        grid.position.y = -0.005
        scene.add(grid)
        scene.add(new THREE.AmbientLight(0xffffff, 1.2))

        const moonLight = new THREE.DirectionalLight(0xddeeff, 2.5)
        moonLight.position.set(20, 50, -30)
        moonLight.castShadow = true
        moonLight.shadow.mapSize.width = 2048
        moonLight.shadow.mapSize.height = 2048
        moonLight.shadow.bias = -0.0005
        moonLight.shadow.normalBias = 0.02
        moonLight.shadow.camera.left = -50
        moonLight.shadow.camera.right = 50
        moonLight.shadow.camera.top = 50
        moonLight.shadow.camera.bottom = -50
        scene.add(moonLight)
        scene.add(moonLight.target)

        // Sprite system DISABLED - using 3D meshes
        // const spriteSystem = SpriteSystem.getInstance()
        // spriteSystemRef.current = spriteSystem

        const initializeGame = async () => {
            const player = new Player(0, 0, audioManagerRef.current)
            player.useSpriteMode = false
            player.createMesh(scene)
            playerRef.current = player

            const vfx = new VFXManager(scene)
            vfxManagerRef.current = vfx

            const entityManager = new EntityManager(scene, player, vfx, audioManagerRef.current as AudioManager, null)
            entityManager.setObstacles(currentObstacles)
            if (selectedWorldId === 'frozen_waste') {
                entityManager.setGemTheme(0x0044bb, 0x0088ff)
            } else {
                entityManager.setGemTheme(0x00cccc, 0x00ffff)
            }
            entityManagerRef.current = entityManager

            const rng = new SeededRandom(Date.now().toString())
            rngRef.current = rng
            const replay = new ReplayRecorder(rng.next().toString(), user?.publicProfile.handle || '', selectedCharacterId, selectedWorldId)
            replayRef.current = replay

            const spawnSystem = new SpawnSystem(entityManager, player, rng)
            spawnSystemRef.current = spawnSystem
            spawnSystem.setWaveMessageCallback((message: string) => {
                setWaveNotification(message)
                // Auto-clear notification after 4 seconds
                setTimeout(() => setWaveNotification(null), 4000)
            })

            const abilitySystem = new AbilitySystem(scene, player, entityManager, vfx, rng, audioManagerRef.current)
            abilitySystemRef.current = abilitySystem

            const input = new InputManager()
            input.start()
            inputManagerRef.current = input

            const bot = new BotController(scene, player, entityManager)
            botControllerRef.current = bot

            const eventSystem = new EventSystem({ spawnSystem, entityManager, vfxManager: vfx, player })
            eventSystemRef.current = eventSystem
        }

        // Call async initialization
        initializeGame()

        const handleResize = () => {
            if (!container || !camera || !renderer) return
            const w = container.clientWidth
            const h = container.clientHeight
            camera.left = frustumSize * (w / h) / -2; camera.right = frustumSize * (w / h) / 2
            camera.updateProjectionMatrix()
            renderer.setSize(w, h)
        }
        window.addEventListener("resize", handleResize)

        const update = (deltaTime: number) => {
            const p = playerRef.current
            const im = inputManagerRef.current
            const em = entityManagerRef.current
            const ss = spawnSystemRef.current
            const as = abilitySystemRef.current
            const vm = vfxManagerRef.current

            if (!p || !im || !em || !ss || !as || !vm) return
            if (gameStateRef.current !== "playing" && gameStateRef.current !== "replaying") return
            if (gameStateRef.current === "replaying" && replayPausedRef.current) return

            // Handle zoom input (only during active gameplay)
            if (gameStateRef.current === "playing" && im) {
                const zoomDelta = im.getZoomInput()
                if (zoomDelta !== 0) {
                    // Adjust camera zoom (negative delta = zoom in, positive = zoom out)
                    cameraZoomRef.current -= zoomDelta * 0.1 // 0.1 for smooth zoom increments
                    cameraZoomRef.current = Math.max(minZoom, Math.min(maxZoom, cameraZoomRef.current))
                }
            }

            // Pre-filter entities once per frame for the bot
            const activeEnemies = isBotActiveRef.current ? em.enemies.filter(e => e.isActive) : []
            const activeGems = isBotActiveRef.current ? em.gems.filter(g => g.isActive) : []

            const iterations = gameStateRef.current === "replaying" 
                ? replaySpeedRef.current 
                : (isBotActiveRef.current ? gameSpeedRef.current : 1)

            for (let iter = 0; iter < iterations; iter++) {
                if (gameStateRef.current !== "playing" && gameStateRef.current !== "replaying") break;

                let movement = { x: 0, z: 0 };
                if (gameStateRef.current === "replaying" && replayPlayerRef.current) {
                    const events = replayPlayerRef.current.getEventsForFrame(replayFrameRef.current);
                    for (const event of events) {
                        const type = event[0];
                        if (type === ReplayEventType.LEVEL_UP) {
                            handleUpgrade(event[2], true);
                        } else if (type === ReplayEventType.DEATH) {
                            setGameState("gameOver");
                        }
                    }
                    movement = replayPlayerRef.current.currentInput;
                } else if (isBotActiveRef.current && botControllerRef.current) {
                    movement = botControllerRef.current.getInput(gameTimeRef.current);
                } else {
                    movement = im.getMovementInput();
                }
                const prevLevel = p.stats.level

                const loop = gameLoopRef.current

                // Profile entity updates
                if (loop) loop.mark('entityUpdate')
                p.update(deltaTime, movement.x, movement.z)
                ss.update(deltaTime)
                em.update(deltaTime)
                if (loop) loop.measureEnd('entityUpdate')

                // Profile ability system
                if (loop) loop.mark('abilityUpdate')
                as.update(deltaTime)
                if (loop) loop.measureEnd('abilityUpdate')

                // Profile particle system
                if (loop) loop.mark('particleSystem')
                vm.update(deltaTime)
                if (loop) loop.measureEnd('particleSystem')

                eventSystemRef.current?.update(deltaTime)

                // Update dynamic difficulty
                if (gameTimeRef.current > 0) {
                    const currentDPS = gameTimeRef.current > 0 ? em.totalDamageDealt / gameTimeRef.current : 0
                    ss.updateDifficulty(currentDPS, gameTimeRef.current, em.totalDamageTaken)
                    const difficultyMult = ss.getDifficultyMultiplier()
                    setDifficultyMultiplier(difficultyMult)
                }

                // Sprite updates DISABLED - using 3D meshes
                // if (spriteSystemRef.current && cameraRef.current) {
                //     const cameraPos = cameraRef.current.position
                //     p.updateSprite(deltaTime, cameraPos, spriteSystemRef.current)
                //     em.updateSprites(deltaTime, cameraPos)
                // }

                if (p.stats.currentHp <= 0) {
                    if (replayRef.current) {
                        replayRef.current.finish(p.stats.level, Math.floor(gameTimeRef.current))
                    }

                    // No seed rewards - meta progression removed

                    setGameState("gameOver")
                    if (gameStateRef.current === "playing") {
                        checkHighScore(p.stats.level)
                    }
                    break
                }
                else if (p.stats.level > prevLevel && gameStateRef.current !== "replaying") {
                    // Check if this level-up is also a victory milestone
                    const currentWorld = getWorldData(selectedWorldId)
                    const victoryMilestones = [10, 20, 30]
                    const isVictoryMilestone = currentWorld.winCondition === 'level' &&
                        victoryMilestones.includes(p.stats.level) &&
                        !shownVictoryMilestonesRef.current.has(p.stats.level)

                    if (isBotActiveRef.current) {
                        // BOT AUTO-UPGRADE
                        const choices = getLevelUpChoices()
                        if (choices.length > 0) {
                            const character = characterData.find(c => c.id === selectedCharacterId) || characterData[0]
                            const startingWeapon = character.startingWeapon

                            // Priority 1: Starting Weapon
                            let bestChoice = choices.find(c => c.id === startingWeapon)

                            // Priority 2: Evolution
                            if (!bestChoice) {
                                bestChoice = choices.find(c => c.rarity === 'Evolution')
                            }

                            // Priority 3: Existing Item (Upgrade)
                            if (!bestChoice) {
                                const ownedIds = abilitySystemRef.current?.getUpgrades().map(u => u.id) || []
                                bestChoice = choices.find(c => ownedIds.includes(c.id))
                            }

                            // Priority 4: First Available
                            if (!bestChoice) {
                                bestChoice = choices[0]
                            }

                            if (bestChoice) {
                                handleUpgrade(bestChoice.id)
                            }
                        }
                        // Do not break or change state, keep playing
                    } else if (isVictoryMilestone) {
                        // If this is a victory milestone, save level-up choices and show victory first
                        levelUpChoices.current = getLevelUpChoices()
                        pendingLevelUpAfterVictoryRef.current = true
                        // Victory screen will be shown on next frame
                    } else {
                        // Normal level-up
                        levelUpChoices.current = getLevelUpChoices()
                        setGameState("levelUp")
                        break
                    }
                }
                else if (gameStateRef.current === "playing") {
                    const currentWorld = getWorldData(selectedWorldId)
                    const currentStars = 0 // Optimization: we don't access worldStars state here to avoid dependency. Logic simplified.
                    // Wait, we need access to worldStars to update it. We passed setWorldStars.
                    // But we can't read current value easily without state.
                    // Simplification: Just calculate stars and update if needed. The setter handles 'prev'.

                    // VICTORY MILESTONES - Show at levels 10, 20, and 30
                    const victoryMilestones = [10, 20, 30]
                    const currentMilestone = victoryMilestones.find(m =>
                        p.stats.level === m && !shownVictoryMilestonesRef.current.has(m)
                    )

                    if (currentWorld.winCondition === 'level' && currentMilestone) {
                        // Mark this milestone as shown
                        shownVictoryMilestonesRef.current.add(currentMilestone)

                        // Determine stars based on milestone reached
                        let earnedStars = 0
                        if (currentMilestone === 30) earnedStars = 3
                        else if (currentMilestone === 20) earnedStars = 2
                        else if (currentMilestone === 10) earnedStars = 1

                        // No seed rewards - meta progression removed

                        setGameState("gameVictory")

                        // Update stars
                        setWorldStars(prev => {
                            const currentStars = prev[selectedWorldId] || 0
                            return earnedStars > currentStars ? { ...prev, [selectedWorldId]: earnedStars } : prev
                        })

                        // Unlock next character on ANY victory (1 star = level 10)
                        if (earnedStars >= 1) {
                            const currentIndex = characterData.findIndex(c => c.id === selectedCharacterId);
                            if (currentIndex !== -1 && currentIndex < characterData.length - 1) {
                                const nextChar = characterData[currentIndex + 1];
                                setUnlockedCharacters(prev => {
                                    if (prev.has(nextChar.id)) return prev;
                                    setNewHeroUnlocked(nextChar.name);
                                    const next = new Set(prev);
                                    next.add(nextChar.id);
                                    return next;
                                });
                            } else {
                                // No new character to unlock
                                setNewHeroUnlocked(null);
                            }
                        }

                        // Allow continuing past level 30
                        if (currentMilestone === 30) {
                            allowPostVictoryRef.current = true
                        }

                        // Update replay stats at victory milestone (without adding DEATH event, to allow continuation)
                        if (replayRef.current) {
                            replayRef.current.updateFinalStats(p.stats.level, Math.floor(gameTimeRef.current))
                        }

                        checkHighScore(p.stats.level)
                        break
                    }
                }

                if (gameStateRef.current === "playing" && replayRef.current) {
                    replayRef.current.recordInput(movement.x, movement.z)
                    replayRef.current.update()
                }

                gameTimeRef.current += deltaTime
            }

            if (gameStateRef.current === "replaying") {
                replayFrameRef.current++
            }

            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)
            setPlayerLevel(p.stats.level)
            setPlayerXp(p.stats.xp)
            setPlayerXpTarget(p.stats.xpToNextLevel)
            setGameTime(gameTimeRef.current)
            setKills(em.totalKills)
            setDamageDealt(em.totalDamageDealt)
            setDamageTaken(em.totalDamageTaken)

            // Update active synergies
            if (as) {
                const synergies = as.getActiveSynergies()
                setActiveSynergies(synergies.map(s => ({ name: s.name, description: s.description })))
            }

            moonLight.position.set(p.position.x + 20, 50, p.position.z - 30)
            moonLight.target.position.copy(p.position)
            cameraTargetRef.current.copy(p.position)

            // Update profiler entity counts
            const loop = gameLoopRef.current
            if (loop && em && vm) {
                const enemyCount = em.enemies?.filter(e => e.isActive).length ?? 0
                const projectileCount = em.projectiles?.filter(p => p.isActive).length ?? 0
                const xpGemCount = em.gems?.filter(g => g.isActive).length ?? 0
                // VFXManager doesn't expose particle count, estimate from active enemies
                const particleCount = Math.floor(enemyCount * 0.3) // Rough estimate

                loop.updateEntityCounts({
                    enemies: enemyCount,
                    projectiles: projectileCount,
                    particles: particleCount,
                    xpGems: xpGemCount,
                })

                // Update game stats for profiler graphs
                loop.updateGameStats({
                    totalDamage: em.totalDamageDealt || 0,
                    totalKills: em.totalKills || 0,
                    totalXP: p.stats.xp || 0,
                    gameTime: gameTimeRef.current,
                    enemyCount: enemyCount,
                })
            }

            // Update benchmark mode if active
            if (benchmarkRef.current?.isActive()) {
                benchmarkRef.current.update(deltaTime)
            }
        }

        const render = (alpha: number) => {
            if (!scene || !camera || !renderer || !playerRef.current) return

            const loop = gameLoopRef.current

            // Profile billboard updates
            if (loop) loop.mark('billboardUpdate')
            camera.position.x = cameraTargetRef.current.x
            camera.position.y = cameraDistance * Math.sin(cameraPitch)
            camera.position.z = cameraTargetRef.current.z - cameraDistance * Math.cos(cameraPitch)
            camera.lookAt(cameraTargetRef.current.x, 0, cameraTargetRef.current.z)

            // Apply zoom
            camera.zoom = cameraZoomRef.current
            camera.updateProjectionMatrix()
            if (loop) loop.measureEnd('billboardUpdate')

            // Profile scene render
            if (loop) loop.mark('sceneRender')
            renderer.render(scene, camera)
            if (loop) loop.measureEnd('sceneRender')

            // Update render stats for profiler
            if (loop) {
                loop.updateRenderStats({
                    drawCalls: renderer.info.render.calls,
                    triangles: renderer.info.render.triangles,
                    geometries: renderer.info.memory.geometries,
                    textures: renderer.info.memory.textures,
                })

                // Update profiler metrics for UI
                const profiler = loop.getProfiler()
                setProfilerMetrics(profiler.getMetrics())
                setProfilerWarnings(profiler.getWarnings())
                setFPSHistory(profiler.getFPSHistory())
                setGameStatsHistory(profiler.getGameStatsHistory())
            }
        }

        const loop = new ProfiledGameLoop(update, render, () => { }, true)
        gameLoopRef.current = loop

        // Initialize benchmark mode
        if (entityManagerRef.current && spawnSystemRef.current && playerRef.current) {
            benchmarkRef.current = new BenchmarkMode(
                entityManagerRef.current,
                spawnSystemRef.current,
                playerRef.current
            )

            // Expose benchmark commands to console
            if (typeof window !== 'undefined') {
                (window as any).benchmark = {
                    start: (preset: string) => benchmarkRef.current?.start(preset as any),
                    stop: () => benchmarkRef.current?.stop(),
                    spawn: (count: number, type: string) => benchmarkRef.current?.spawnWave(count, type),
                    circle: (count: number, radius: number, type: string) =>
                        benchmarkRef.current?.spawnCircle(count, radius, type),
                    grid: (rows: number, cols: number, spacing: number, type: string) =>
                        benchmarkRef.current?.spawnGrid(rows, cols, spacing, type),
                    presets: {
                        light: { enemyCount: 100 },
                        medium: { enemyCount: 300 },
                        heavy: { enemyCount: 500 },
                        extreme: { enemyCount: 1000 },
                    },
                    help: () => {
                        console.log(`
=== Benchmark Commands ===

benchmark.start(preset)  - Start benchmark mode
  Presets: 'light' (100), 'medium' (300), 'heavy' (500), 'extreme' (1000), 'mixed' (400)

benchmark.stop()         - Stop benchmark mode

benchmark.spawn(count, type) - Spawn enemies in wave
  Example: benchmark.spawn(100, 'drifter')

benchmark.circle(count, radius, type) - Spawn in circle
  Example: benchmark.circle(50, 30, 'screecher')

benchmark.grid(rows, cols, spacing, type) - Spawn in grid
  Example: benchmark.grid(10, 10, 5, 'bruiser')

benchmark.presets        - List available presets
                        `)
                    },
                }
                console.log('🎮 Benchmark mode ready. Type "benchmark.help()" for commands.')
            }
        }

        return () => {
            window.removeEventListener("resize", handleResize)
            loop.stop()
            inputManagerRef.current?.stop()
            botControllerRef.current?.cleanup()
            entityManagerRef.current?.cleanup()
            vfxManagerRef.current?.cleanup()
            playerRef.current?.dispose()

            // Cleanup GLB objects from previous scene
            sceneGltfObjectsRef.current.forEach(obj => {
                if (sceneRef.current?.children.includes(obj)) {
                    sceneRef.current.remove(obj)
                }
            })
            sceneGltfObjectsRef.current = []

            if (renderer) {
                renderer.dispose()
                if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
            }
        }
    }, [selectedWorldId, selectedCharacterId])

    useEffect(() => {
        if (gameState === "playing" || gameState === "replaying") {
            // If we have a pending replay, initialize it with the correct seed
            if (gameState === "replaying" && pendingReplaySeed.current) {
                const seed = pendingReplaySeed.current
                pendingReplaySeed.current = null // Clear the pending seed
                resetGame(true, seed) // forReplay = true, overrideSeed = seed
            }
            gameLoopRef.current?.start()
        } else {
            gameLoopRef.current?.stop()
        }
    }, [gameState])

    return {
        gameLoopRef,
        inputManagerRef,
        playerRef,
        entityManagerRef,
        spawnSystemRef,
        abilitySystemRef,
        eventSystemRef,
        vfxManagerRef,
        rngRef,
        replayRef,
        replayPlayerRef,
        allowPostVictoryRef,
        pendingLevelUpAfterVictoryRef,
        levelUpChoices,
        getLevelUpChoices,
        resetGame,
        startReplay,
        handleUpgrade
    }
}
