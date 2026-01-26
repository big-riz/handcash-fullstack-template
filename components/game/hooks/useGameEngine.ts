import { useRef, useEffect, useState, MutableRefObject } from "react"
import * as THREE from "three"
import { GameLoop } from "../core/GameLoop"
import { InputManager } from "../core/Input"
import { BotController } from "../core/BotController" // New Import
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

import { ItemTemplate } from "@/lib/item-templates-storage"
import { CharacterInfo } from "../types"
import { WORLDS } from "@/components/game/data/worlds"
import activeData from '@/components/game/data/actives'
import passiveData from '@/components/game/data/passives'
import evolutionData from '@/components/game/data/evolutions'
import characterDataImport from '@/components/game/data/characters'
import { getItemInfo, resolveItemIcon } from "../utils/itemUtils"

const characterData: CharacterInfo[] = characterDataImport as CharacterInfo[]

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
    playerRef,
    abilitySystemRef,
    replayRef,
    audioManagerRef
}: UseGameEngineProps) {

    // Internal Refs
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
    const gameLoopRef = useRef<GameLoop | null>(null)
    const inputManagerRef = useRef<InputManager | null>(null)
    const botControllerRef = useRef<BotController | null>(null)
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

    // Logic Functions
    const getLevelUpChoices = () => {
        const p = playerRef.current
        const as = abilitySystemRef.current
        if (!p || !as) return []

        const currentWorld = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
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

            const currentWorldTemplate = WORLDS.find(w => w.id === (overrideWorldId || selectedWorldId)) || WORLDS[0]
            const currentWorld = {
                ...currentWorldTemplate,
                allowedUpgrades: [...currentWorldTemplate.allowedUpgrades]
            }

            if (!currentWorld.allowedUpgrades.includes(startingWeapon)) {
                currentWorld.allowedUpgrades.push(startingWeapon)
            }

            replayRef.current = forReplay ? null : new ReplayRecorder(newSeed, (user?.publicProfile.displayName || playerName || 'ANON'), selectedCharacterId, selectedWorldId)
            spawnSystemRef.current = new SpawnSystem(em, p, gameRNG)
            spawnSystemRef.current.setWorld(currentWorld)
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

        const WorldPreset = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
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

        const treeCount = 300
        const objectRng = new SeededRandom("world_gen_" + selectedWorldId)
        const currentObstacles: { x: number, z: number, radius: number }[] = []

        if (selectedWorldId === 'dark_forest') {
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5)
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1.0 })
            const leavesGeo = new THREE.ConeGeometry(2, 6, 8)
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 })

            for (let i = 0; i < treeCount; i++) {
                const x = (objectRng.next() - 0.5) * 400
                const z = (objectRng.next() - 0.5) * 400
                if (Math.abs(x) < 15 && Math.abs(z) < 15) continue
                const treeGroup = new THREE.Group()
                treeGroup.position.set(x, 0, z)
                const scale = 0.8 + objectRng.next() * 0.8
                treeGroup.scale.set(scale, scale, scale)
                treeGroup.rotation.y = objectRng.next() * Math.PI * 2
                const trunk = new THREE.Mesh(trunkGeo, trunkMat)
                trunk.position.y = 0.75
                trunk.castShadow = true
                trunk.receiveShadow = true
                treeGroup.add(trunk)
                const leaves = new THREE.Mesh(leavesGeo, leavesMat)
                leaves.position.y = 3
                leaves.castShadow = true
                leaves.receiveShadow = true
                treeGroup.add(leaves)
                envGroup.add(treeGroup)
                currentObstacles.push({ x, z, radius: 1.2 * scale })
            }
        } else if (selectedWorldId === 'frozen_waste') {
            const iceGeo = new THREE.ConeGeometry(1, 4, 4)
            const iceMat = new THREE.MeshStandardMaterial({ color: 0xa5f3fc, roughness: 0.2, metalness: 0.8, emissive: 0xa5f3fc, emissiveIntensity: 0.2 })
            for (let i = 0; i < treeCount; i++) {
                const x = (objectRng.next() - 0.5) * 400
                const z = (objectRng.next() - 0.5) * 400
                if (Math.abs(x) < 15 && Math.abs(z) < 15) continue
                const ice = new THREE.Mesh(iceGeo, iceMat)
                ice.position.set(x, 0, z)
                const scale = 0.5 + objectRng.next() * 1.5
                ice.scale.set(scale, scale * (0.8 + objectRng.next()), scale)
                ice.rotation.y = objectRng.next() * Math.PI * 2
                ice.rotation.x = (objectRng.next() - 0.5) * 0.5
                ice.rotation.z = (objectRng.next() - 0.5) * 0.5
                ice.position.y = scale * 1.5
                ice.castShadow = true
                ice.receiveShadow = true
                envGroup.add(ice)
                currentObstacles.push({ x, z, radius: 1.8 * scale })
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
            const replay = new ReplayRecorder(rng.next().toString(), playerName || 'ANON', selectedCharacterId, selectedWorldId)
            replayRef.current = replay

            const spawnSystem = new SpawnSystem(entityManager, player, rng)
            spawnSystemRef.current = spawnSystem

            const abilitySystem = new AbilitySystem(scene, player, entityManager, vfx, rng)
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

                p.update(deltaTime, movement.x, movement.z)
                ss.update(deltaTime)
                em.update(deltaTime)
                as.update(deltaTime)
                vm.update(deltaTime)
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
                    const currentWorld = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
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
                    const currentWorld = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
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
        }

        const render = (alpha: number) => {
            if (!scene || !camera || !renderer || !playerRef.current) return
            camera.position.x = cameraTargetRef.current.x
            camera.position.y = cameraDistance * Math.sin(cameraPitch)
            camera.position.z = cameraTargetRef.current.z - cameraDistance * Math.cos(cameraPitch)
            camera.lookAt(cameraTargetRef.current.x, 0, cameraTargetRef.current.z)
            renderer.render(scene, camera)
        }

        const loop = new GameLoop(update, render, () => { })
        gameLoopRef.current = loop

        return () => {
            window.removeEventListener("resize", handleResize)
            loop.stop()
            inputManagerRef.current?.stop()
            botControllerRef.current?.cleanup()
            entityManagerRef.current?.cleanup()
            vfxManagerRef.current?.cleanup()
            playerRef.current?.dispose()
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
