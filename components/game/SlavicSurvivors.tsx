"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import {
    Pause,
    Play,
    RotateCcw,
    Sword,
    Heart,
    Zap,
    Shield,
    Magnet,
    Trophy,
    Circle,
    Beaker,
    Crosshair,
    Skull,
    Cloud,
    Bird,
    Car,
    Clock,
    CircleDot,
    ExternalLink,
    Gift,
    ShieldAlert,
    Loader2,
    Activity,
    Rocket,
    Wind,
    Droplets,
    Flame,
    Target,
    MessageSquare,
    Send,
    ArrowLeft,
    FastForward
} from "lucide-react"
import * as THREE from "three"
import { GameLoop } from "./core/GameLoop"
import { InputManager } from "./core/Input"
import { Player } from "./entities/Player"
import { EntityManager } from "./entities/EntityManager"
import { SpawnSystem } from "./systems/SpawnSystem"
import { AbilitySystem } from "./systems/AbilitySystem"
import { VFXManager } from "./systems/VFXManager"
import { SeededRandom } from "../../lib/SeededRandom"
import { ReplayRecorder, ReplayPlayer, ReplayData, ReplayEventType } from "../../lib/ReplaySystem"
import { EventSystem } from "./systems/EventSystem"

import { ItemTemplate } from "@/lib/item-templates-storage"

import activeData from '@/components/game/data/actives'
import passiveData from '@/components/game/data/passives'
import evolutionData from '@/components/game/data/evolutions'
interface CharacterInfo {
    id: string
    name: string
    description: string
    startingWeapon: string
    sprite: string
    stats?: {
        maxHp?: number
        moveSpeed?: number
        might?: number
        area?: number
        luck?: number
        curse?: number
    }
}

import characterDataImport from '@/components/game/data/characters'
const characterData: CharacterInfo[] = characterDataImport as CharacterInfo[]
import { WORLDS, WorldData } from '@/components/game/data/worlds'

const iconMap: Record<string, any> = {
    Circle, Sword, Zap, RotateCcw, Trophy, Crosshair, Skull, Cloud, Bird, Car, Heart, Magnet, Shield, Beaker,
    Gift, Loader2, CircleDot, ShieldAlert, Activity, Rocket, Wind, Droplets, Flame, Target
}

const getItemMetadata = (id: string) => {
    // Check evolutions first
    const evolution = evolutionData.find(e => e.id === id || `evolve_${e.id}` === id)
    if (evolution) return { ...evolution, type: 'evolution', icon: (evolution as any).icon || 'Trophy' }

    const active = activeData.find(a => (a as any).id === id)
    if (active) return { ...active, type: 'active' }

    const passive = passiveData.find(p => p.id === id)
    if (passive) return { ...passive, type: 'passive' }

    return null
}

const getItemInfo = (id: string) => {
    const meta = getItemMetadata(id)
    if (meta) {
        return {
            name: meta.name.split('\n')[0], // Take first line of name
            desc: meta.description
        }
    }
    return { name: id, desc: "A mysterious power." }
}

const renderItemIcon = (id: string, className = "w-6 h-6") => {
    const meta = getItemMetadata(id)
    const iconKey = meta?.icon || 'Circle'
    const Icon = iconMap[iconKey] || Circle

    let colorClass = "text-primary"
    let animationClass = ""

    // Special item styling
    if (id === 'area') colorClass = "text-cyan-400"
    if (id === 'damage') colorClass = "text-purple-400"
    if (id === 'regen') { colorClass = "text-red-400"; animationClass = "animate-pulse" }
    if (id === 'soul_siphon') { colorClass = "text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" }
    if (id === 'melter') { colorClass = "text-lime-400"; animationClass = "animate-pulse" }
    if (id === 'ak_corrupted') colorClass = "text-red-600"
    if (id === 'ak_mushroom') colorClass = "text-purple-400"
    if (id === 'nuclear_pigeon') colorClass = "text-green-400"
    if (id === 'lada') colorClass = "text-gray-400"

    return <Icon className={`${className} ${colorClass} ${animationClass}`} />
}

export function SlavicSurvivors() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [gameState, setGameState] = useState<"menu" | "characterSelect" | "playing" | "paused" | "gameOver" | "levelUp" | "replaying" | "leaderboard" | "gameVictory" | "myHistory">("menu")
    const [fps, setFps] = useState<number>(0)

    // UI HUD Stats
    const [playerHp, setPlayerHp] = useState<number>(100)
    const [playerMaxHp, setPlayerMaxHp] = useState<number>(100)
    const [playerLevel, setPlayerLevel] = useState<number>(1)
    const [playerXp, setPlayerXp] = useState<number>(0)
    const [playerXpTarget, setPlayerXpTarget] = useState<number>(10)
    const [totalRuns, setTotalRuns] = useState<number>(0)
    const [scores, setScores] = useState<{ id?: number, name: string, handle?: string, avatarUrl?: string, level: number, time: number, seed?: string, events?: any[], characterId?: string, worldId?: string }[]>([])
    const [userHistory, setUserHistory] = useState<{ id?: number, name: string, handle?: string, avatarUrl?: string, level: number, time: number, seed?: string, events?: any[], characterId?: string, worldId?: string, createdAt?: string }[]>([])
    const [gameComments, setGameComments] = useState<{ id: number, handle: string, avatarUrl?: string, content: string, createdAt: string, parentId?: number | null }[]>([])
    const [replyingTo, setReplyingTo] = useState<{ id: number, handle: string } | null>(null)
    const [newComment, setNewComment] = useState("")
    const [isPostingComment, setIsPostingComment] = useState(false)
    const [gameTime, setGameTime] = useState<number>(0)
    const [showScoreInput, setShowScoreInput] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [playerName, setPlayerName] = useState("")
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [authReason, setAuthReason] = useState<string | null>(null)
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('gopnik')
    const [selectedWorldId, setSelectedWorldId] = useState<string>('dark_forest')
    const [leaderboardWorldId, setLeaderboardWorldId] = useState<string>('dark_forest')
    const [replayPaused, setReplayPaused] = useState(false)
    const [replaySpeed, setReplaySpeed] = useState(1)

    const replayPausedRef = useRef(false)
    useEffect(() => { replayPausedRef.current = replayPaused }, [replayPaused])
    const replaySpeedRef = useRef(1)
    useEffect(() => { replaySpeedRef.current = replaySpeed }, [replaySpeed])

    const { user } = useAuth()

    // Three.js refs
    const sceneRef = useRef<THREE.Scene | null>(null)
    const cameraRef = useRef<THREE.OrthographicCamera | null>(null)
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null)

    const gameStateRef = useRef(gameState)
    useEffect(() => { gameStateRef.current = gameState }, [gameState])

    // Game systems refs
    const gameLoopRef = useRef<GameLoop | null>(null)
    const inputManagerRef = useRef<InputManager | null>(null)
    const playerRef = useRef<Player | null>(null)
    const entityManagerRef = useRef<EntityManager | null>(null)
    const spawnSystemRef = useRef<SpawnSystem | null>(null)
    const abilitySystemRef = useRef<AbilitySystem | null>(null)
    const eventSystemRef = useRef<EventSystem | null>(null)
    const vfxManagerRef = useRef<VFXManager | null>(null)
    const rngRef = useRef<SeededRandom | null>(null)
    const replayRef = useRef<ReplayRecorder | null>(null)
    const replayPlayerRef = useRef<ReplayPlayer | null>(null)
    const replayFrameRef = useRef<number>(0)
    const gameTimeRef = useRef<number>(0)
    const obstaclesRef = useRef<{ x: number, z: number, radius: number }[]>([])
    const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([])

    const getItemIcon = (id: string, name: string): string | undefined => {
        if (!itemTemplates.length) return undefined
        const match = itemTemplates.find(t => t.name.toLowerCase() === name.toLowerCase())
        return match ? (match.imageUrl || undefined) : undefined
    }

    // Camera follow
    const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
    const cameraDistance = 35
    const cameraPitch = 55 * (Math.PI / 180)

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

        // Use container width
        const width = container.clientWidth || window.innerWidth
        const height = 960

        const aspect = width / height
        const frustumSize = 24
        const camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2, frustumSize * aspect / 2,
            frustumSize / 2, frustumSize / -2,
            0.1, 1000
        )

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
        rendererRef.current = renderer

        // Brighter Ground 
        const groundGeo = new THREE.PlaneGeometry(3000, 3000)
        // Create environment group to hold world-specific objects
        const envGroup = new THREE.Group()
        scene.add(envGroup)

        // Ground Material based on world
        const groundMat = new THREE.MeshStandardMaterial({
            roughness: 0.8,
            metalness: 0.1,
            color: groundColor
        })
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.01
        ground.receiveShadow = true
        scene.add(ground)

        // Procedural World Decoration
        const treeCount = 300
        const objectRng = new SeededRandom("world_gen_" + selectedWorldId)
        const currentObstacles: { x: number, z: number, radius: number }[] = []

        if (selectedWorldId === 'dark_forest') {
            // Forest Generation: Cone Trees
            const trunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 1.5)
            const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 1.0 })
            const leavesGeo = new THREE.ConeGeometry(2, 6, 8)
            const leavesMat = new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.8 })

            for (let i = 0; i < treeCount; i++) {
                const x = (objectRng.next() - 0.5) * 400
                const z = (objectRng.next() - 0.5) * 400

                // Keep clear area around spawn
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

                // Add collision data (Radius approx 1.2 * scale)
                currentObstacles.push({ x, z, radius: 1.2 * scale })
            }
        } else if (selectedWorldId === 'frozen_waste') {
            // Siberia Generation: Ice Spikes
            const iceGeo = new THREE.ConeGeometry(1, 4, 4)
            const iceMat = new THREE.MeshStandardMaterial({
                color: 0xa5f3fc,
                roughness: 0.2,
                metalness: 0.8,
                emissive: 0xa5f3fc,
                emissiveIntensity: 0.2
            })

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
                ice.position.y = scale * 1.5 // approximate height adjust
                ice.castShadow = true
                ice.receiveShadow = true

                envGroup.add(ice)

                // Add collision data (Radius approx 1.8 * scale)
                currentObstacles.push({ x, z, radius: 1.8 * scale })
            }
        }

        // Pass obstacles to system
        obstaclesRef.current = currentObstacles
        obstaclesRef.current = currentObstacles
        // Removed early setObstacles call

        const grid = new THREE.GridHelper(2000, 100, 0x555555, 0x444444)
        grid.position.y = -0.005
        scene.add(grid)

        // VERY BRIGHT LIGHTING
        scene.add(new THREE.AmbientLight(0xffffff, 1.2))

        const moonLight = new THREE.DirectionalLight(0xddeeff, 2.5)
        moonLight.position.set(20, 50, -30)
        moonLight.castShadow = true
        moonLight.shadow.mapSize.width = 2048
        moonLight.shadow.mapSize.height = 2048
        moonLight.shadow.bias = -0.0005
        moonLight.shadow.normalBias = 0.02
        moonLight.shadow.camera.left = -50 // Tighter bounds to improve resolution density
        moonLight.shadow.camera.right = 50
        moonLight.shadow.camera.top = 50
        moonLight.shadow.camera.bottom = -50
        scene.add(moonLight)
        scene.add(moonLight.target)

        const player = new Player(0, 0)
        player.createMesh(scene)
        playerRef.current = player

        const vfx = new VFXManager(scene)
        vfxManagerRef.current = vfx

        const entityManager = new EntityManager(scene, player, vfx)
        entityManager.setObstacles(currentObstacles)

        // XP Gem color based on world
        if (selectedWorldId === 'frozen_waste') {
            entityManager.setGemTheme(0x0044bb, 0x0088ff) // Darker blue for snow
        } else {
            entityManager.setGemTheme(0x00cccc, 0x00ffff) // Default teal
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

        const eventSystem = new EventSystem({
            spawnSystem,
            entityManager,
            vfxManager: vfx,
            player
        })
        eventSystemRef.current = eventSystem




        const handleResize = () => {
            if (!container || !camera || !renderer) return
            const w = container.clientWidth
            const h = 800
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

            // PAUSE LOGIC if not playing
            if (gameStateRef.current !== "playing" && gameStateRef.current !== "replaying") return

            // REPLAY PAUSE
            if (gameStateRef.current === "replaying" && replayPausedRef.current) return

            const iterations = gameStateRef.current === "replaying" ? replaySpeedRef.current : 1

            for (let iter = 0; iter < iterations; iter++) {
                if (gameStateRef.current !== "playing" && gameStateRef.current !== "replaying") break

                let movement = { x: 0, z: 0 }

                if (gameStateRef.current === "replaying" && replayPlayerRef.current) {
                    const events = replayPlayerRef.current.getEventsForFrame(replayFrameRef.current)
                    for (const event of events) {
                        const type = event[0]
                        if (type === ReplayEventType.LEVEL_UP) {
                            handleUpgrade(event[2], true) // true = fromReplay
                        } else if (type === ReplayEventType.DEATH) {
                            setGameState("gameOver")
                        }
                    }
                    movement = replayPlayerRef.current.currentInput
                    replayFrameRef.current++
                } else {
                    movement = im.getMovementInput()
                }
                const prevLevel = p.stats.level

                p.update(deltaTime, movement.x, movement.z)
                ss.update(deltaTime)
                em.update(deltaTime)
                as.update(deltaTime)
                vm.update(deltaTime)
                eventSystemRef.current?.update(deltaTime)

                if (p.stats.currentHp <= 0) {
                    // Ensure replay captures final state BEFORE triggering score saves
                    if (replayRef.current) {
                        replayRef.current.finish(p.stats.level, Math.floor(gameTimeRef.current))
                    }
                    setGameState("gameOver")
                    if (gameStateRef.current === "playing") {
                        checkHighScore(p.stats.level)
                    }
                    break
                }
                else if (p.stats.level > prevLevel && gameStateRef.current !== "replaying") {
                    levelUpChoices.current = getLevelUpChoices()
                    setGameState("levelUp")
                    break
                }
                // Win Condition Check
                else if (gameStateRef.current === "playing") {
                    const currentWorld = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
                    if (currentWorld.winCondition === 'level' && p.stats.level >= currentWorld.maxLevel) {
                        setGameState("gameVictory")
                        if (replayRef.current) {
                            replayRef.current.finish(p.stats.level, Math.floor(gameTimeRef.current))
                        }
                        checkHighScore(p.stats.level)
                        break
                    }
                }

                gameTimeRef.current += deltaTime
            }

            // Sync visual components once per frame after all iterations
            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)
            setPlayerLevel(p.stats.level)
            setPlayerXp(p.stats.xp)
            setPlayerXpTarget(p.stats.xpToNextLevel)
            setGameTime(gameTimeRef.current)

            moonLight.position.set(p.position.x + 20, 50, p.position.z - 30)
            moonLight.target.position.copy(p.position)

            cameraTargetRef.current.copy(p.position)

            // RECORDING
            if (gameStateRef.current === "playing" && replayRef.current) {
                const imLoc = inputManagerRef.current!
                const movement = imLoc.getMovementInput()
                replayRef.current.recordInput(movement.x, movement.z)
                replayRef.current.update()
            }
        }

        const render = (alpha: number) => {
            if (!scene || !camera || !renderer || !playerRef.current) return
            camera.position.x = cameraTargetRef.current.x
            camera.position.y = cameraDistance * Math.sin(cameraPitch)
            camera.position.z = cameraTargetRef.current.z - cameraDistance * Math.cos(cameraPitch)
            camera.lookAt(cameraTargetRef.current.x, 0, cameraTargetRef.current.z)
            renderer.render(scene, camera)
        }

        const loop = new GameLoop(update, render, setFps)
        gameLoopRef.current = loop

        return () => {
            window.removeEventListener("resize", handleResize)
            loop.stop()
            inputManagerRef.current?.stop()
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
            gameLoopRef.current?.start()
        } else {
            gameLoopRef.current?.stop()
            // Replay finishing is now handled directly in the update loop on death 
            // to avoid race conditions with score submission.
        }
    }, [gameState])

    const fetchGlobalScores = () => {
        fetch('/api/replays?limit=10')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const globalScores = data.map((r: any) => ({
                        id: r.id,
                        name: r.playerName,
                        handle: r.handle,
                        avatarUrl: r.avatarUrl,
                        level: r.finalLevel,
                        time: r.finalTime,
                        seed: r.seed,
                        events: r.events,
                        worldId: r.worldId,
                        characterId: r.characterId
                    }))
                    setScores(globalScores)
                }
            })
            .catch(err => console.error("Failed to fetch global scores:", err))
    }

    useEffect(() => {
        const savedScores = localStorage.getItem('slavic_scores')
        const savedRuns = localStorage.getItem('slavic_total_runs')
        if (savedScores) setScores(JSON.parse(savedScores))
        if (savedRuns) setTotalRuns(parseInt(savedRuns))

        fetchGlobalScores()

        // Fetch item templates for icons
        fetch("/api/pool-stats")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.pools) {
                    const defaultPool = data.pools.find((p: any) => p.poolName === 'default')
                    if (defaultPool) {
                        setItemTemplates(defaultPool.items)
                    }
                }
            })
            .catch(err => console.error("Failed to fetch templates:", err))
    }, [])

    const fetchUserHistory = async () => {
        if (!user) return
        try {
            const res = await fetch(`/api/replays?handle=${user.publicProfile.handle}&limit=50`)
            const data = await res.json()
            if (Array.isArray(data)) {
                const mappedHistory = data.map((r: any) => ({
                    id: r.id,
                    name: r.playerName,
                    handle: r.handle,
                    avatarUrl: r.avatarUrl,
                    level: r.finalLevel,
                    time: r.finalTime,
                    seed: r.seed,
                    events: r.events,
                    worldId: r.worldId,
                    characterId: r.characterId,
                    createdAt: r.createdAt
                }))
                setUserHistory(mappedHistory)
            }
        } catch (err) {
            console.error("Failed to fetch user history:", err)
        }
    }

    useEffect(() => {
        if (gameState === 'menu') {
            fetchGlobalScores()
            fetchComments()
            fetchUserHistory()
        } else if (gameState === 'myHistory') {
            fetchUserHistory()
        }
    }, [gameState, user])

    const fetchComments = async () => {
        try {
            const res = await fetch('/api/comments')
            const data = await res.json()
            if (Array.isArray(data)) setGameComments(data)
        } catch (err) {
            console.error("Failed to fetch comments:", err)
        }
    }

    const postComment = async (parentId?: number) => {
        if (!newComment.trim() || !user || isPostingComment) return
        setIsPostingComment(true)
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: newComment.trim(),
                    parentId: parentId || null
                })
            })
            if (res.ok) {
                const posted = await res.json()
                setGameComments(prev => [posted, ...prev])
                setNewComment("")
                setReplyingTo(null)
            }
        } catch (err) {
            console.error("Failed to post comment:", err)
        } finally {
            setIsPostingComment(false)
        }
    }

    useEffect(() => {
        localStorage.setItem('slavic_scores', JSON.stringify(scores))
        localStorage.setItem('slavic_total_runs', totalRuns.toString())
    }, [scores, totalRuns])

    const checkHighScore = (level: number) => {
        const scoresForThisMap = scores.filter(s => (s.worldId || 'dark_forest') === selectedWorldId)
        const isHighScore = scoresForThisMap.length < 10 || level > (scoresForThisMap[scoresForThisMap.length - 1]?.level || 0)
        if (isHighScore) {
            if (user) {
                // Auto-save for HandCash users
                saveScore()
            } else {
                setShowScoreInput(true)
            }
        } else {
            // Still save to DB for verification/archive even if not a leaderboard hit
            submitReplayToDB()
        }
    }

    const submitReplayToDB = (overrideName?: string) => {
        if (!replayRef.current) return
        const replayData = replayRef.current.getReplayData()

        fetch('/api/replays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName: overrideName || user?.publicProfile.displayName || playerName || 'ANON',
                handle: user?.publicProfile.handle || null,
                avatarUrl: user?.publicProfile.avatarUrl || null,
                seed: replayData.seed,
                events: replayData.events,
                finalLevel: replayData.finalLevel,
                finalTime: replayData.finalTime,
                gameVersion: replayData.gameVersion,
                characterId: replayData.characterId || selectedCharacterId,
                worldId: replayData.worldId || selectedWorldId,
                userId: user?.id || null
            })
        }).then(() => {
            fetchUserHistory()
        }).catch(err => console.error("Failed to save replay to DB:", err))
    }

    const saveScore = () => {
        const finalName = (user?.publicProfile.displayName || playerName || 'ANON').toUpperCase()
        if (!user && playerName.length !== 4) return

        const replayData = replayRef.current?.getReplayData()

        const newScore = {
            name: finalName,
            handle: user?.publicProfile.handle,
            avatarUrl: user?.publicProfile.avatarUrl,
            level: replayData?.finalLevel || playerRef.current?.stats.level || playerLevel,
            time: replayData?.finalTime || Math.floor(gameTimeRef.current) || Math.floor(gameTime),
            seed: replayData?.seed,
            events: replayData?.events,
            characterId: replayData?.characterId || selectedCharacterId,
            worldId: replayData?.worldId || selectedWorldId
        }

        // Keep top 10 per map
        const allNewScores = [...scores, newScore]
        const scoresPerMap: Record<string, any[]> = {}

        allNewScores.forEach(s => {
            const wid = s.worldId || 'dark_forest'
            if (!scoresPerMap[wid]) scoresPerMap[wid] = []
            scoresPerMap[wid].push(s)
        })

        const finalScores: any[] = []
        Object.keys(scoresPerMap).forEach(wid => {
            const sortedMapScores = scoresPerMap[wid]
                .sort((a, b) => b.level - a.level || b.time - a.time)
                .slice(0, 10)
            finalScores.push(...sortedMapScores)
        })

        setScores(finalScores)
        setLeaderboardWorldId(newScore.worldId)
        setShowScoreInput(false)
        setPlayerName("")

        // Push this high score to global history
        submitReplayToDB(finalName)
    }

    const resetGame = (forReplay: boolean = false, overrideSeed?: string, overrideCharId?: string, overrideWorldId?: string) => {
        const p = playerRef.current
        const scene = sceneRef.current
        const em = entityManagerRef.current
        const vm = vfxManagerRef.current

        if (p && scene && em && vm) {
            p.position.set(0, 0, 0)
            p.velocity.set(0, 0, 0)
            p.stats.currentHp = 100
            p.stats.maxHp = 100
            p.stats.level = 1
            p.stats.xp = 0
            p.stats.xpToNextLevel = 25
            p.stats.moveSpeed = 8.0
            p.stats.magnet = 2.5
            p.stats.armor = 0
            p.stats.areaMultiplier = 1.0
            p.stats.cooldownMultiplier = 1.0
            p.stats.damageMultiplier = 1.0

            setPlayerLevel(1)
            setGameTime(0)
            gameTimeRef.current = 0

            const character = characterData.find(c => c.id === (overrideCharId || selectedCharacterId)) || characterData[0]

            // Apply Character Stats
            if (character.stats) {
                p.stats.maxHp = character.stats.maxHp || 100
                p.stats.currentHp = p.stats.maxHp
                p.stats.moveSpeed = (character.stats.moveSpeed || 1.0) * 8.0 // Base speed 8.0
                p.stats.areaMultiplier = character.stats.area || 1.0
                p.stats.damageMultiplier = character.stats.might || 1.0
                p.stats.luck = character.stats.luck || 1.0
                p.stats.curse = character.stats.curse || 1.0
            }

            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)

            em.cleanup()
            em.setObstacles(obstaclesRef.current)
            vm.cleanup()
            abilitySystemRef.current?.cleanup()

            const newSeed = overrideSeed || Date.now().toString()

            // Create two deterministic RNGs from the base seed
            const gameRNG = new SeededRandom(newSeed + "_game")
            const uiRNG = new SeededRandom(newSeed + "_ui")

            rngRef.current = uiRNG

            // Pass starting weapon from character
            const startingWeapon = character.startingWeapon as any
            abilitySystemRef.current = new AbilitySystem(scene, p, em, vm, gameRNG, startingWeapon)

            const currentWorldTemplate = WORLDS.find(w => w.id === (overrideWorldId || selectedWorldId)) || WORLDS[0]
            // Create a local run-time world object to avoid modifying the global template
            const currentWorld = {
                ...currentWorldTemplate,
                allowedUpgrades: [...currentWorldTemplate.allowedUpgrades]
            }

            // Ensure starting weapon is "allowed" even if not in world pool, so it can be upgraded
            if (!currentWorld.allowedUpgrades.includes(startingWeapon)) {
                currentWorld.allowedUpgrades.push(startingWeapon)
            }

            replayRef.current = forReplay ? null : new ReplayRecorder(newSeed, (user?.publicProfile.displayName || playerName || 'ANON'), selectedCharacterId, selectedWorldId)

            spawnSystemRef.current = new SpawnSystem(em, p, gameRNG)
            spawnSystemRef.current.setWorld(currentWorld)

            eventSystemRef.current = new EventSystem({
                spawnSystem: spawnSystemRef.current,
                entityManager: em,
                vfxManager: vm,
                player: p
            })


        }
        cameraTargetRef.current.set(0, 0, 0)
    }

    const startReplay = (score: any) => {
        const p = playerRef.current
        const scene = sceneRef.current
        const em = entityManagerRef.current
        const vm = vfxManagerRef.current

        if (p && scene && em && vm && score.seed && score.events) {
            // Apply replay's specific character and world before reset
            if (score.characterId) setSelectedCharacterId(score.characterId)
            if (score.worldId) setSelectedWorldId(score.worldId)

            resetGame(true, score.seed, score.characterId, score.worldId)

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

            setReplayPaused(false)
            setReplaySpeed(1)
            setGameState("replaying")
        }
    }

    const handleUpgrade = (type: string, fromReplay = false) => {
        const as = abilitySystemRef.current
        if (!as) return

        // Record if this is a live game
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

        if (fromReplay) {
            setGameState("replaying")
        } else {
            setGameState("playing")
        }
    }

    const getLevelUpChoices = () => {
        const as = abilitySystemRef.current
        if (!as) return []

        const currentWorld = WORLDS.find(w => w.id === selectedWorldId) || WORLDS[0]
        const allowed = [...(currentWorld.allowedUpgrades || ['all'])]
        const levelGateBonus = selectedWorldId === 'frozen_waste' ? 3 : 0
        const gatingLevel = playerLevel + levelGateBonus

        // Always allow the character's starting weapon to be upgraded
        const character = characterData.find(c => c.id === selectedCharacterId) || characterData[0]
        if (character.startingWeapon && !allowed.includes(character.startingWeapon)) {
            allowed.push(character.startingWeapon)
        }

        // Filter based on world AND items already owned (we always allow upgrading what you have)
        const ownedItems = as.getUpgrades().map(u => u.id)

        const actives = activeData.filter(a => {
            const isAllowed = allowed.includes('all') || allowed.includes(a.id)
            const isOwned = ownedItems.includes(a.id)
            return isAllowed || isOwned
        }).map(a => {
            const Icon = iconMap[a.icon] || Circle
            return {
                id: a.id,
                title: a.name,
                desc: a.description,
                minLevel: a.minLevel,
                icon: <Icon className={`w-10 h-10 md:w-12 md:h-12 ${a.rarity === 'Legendary' ? 'text-yellow-400' : 'text-white'}`} />
            }
        })

        const passives = passiveData.filter(p => {
            const isAllowed = allowed.includes('all') || allowed.includes(p.id)
            const isOwned = ownedItems.includes(p.id)
            return isAllowed || isOwned
        }).map(p => {
            const Icon = iconMap[p.icon] || Circle
            return {
                id: p.id,
                title: p.name,
                desc: p.description,
                minLevel: p.minLevel,
                icon: <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
            }
        })

        const evos = as.getAvailableEvolutions().filter(evo => {
            // Check if evolved ability is allowed by world
            return allowed.includes('all') || allowed.includes(evo.evolvedAbility) || ownedItems.includes(evo.evolvedAbility)
        }).map(evo => {
            let title = "Evolution"
            if (evo.evolvedAbility === 'soul_siphon') title = "Soul Siphon"
            else if (evo.evolvedAbility === 'silver_tt33') title = "Silver TT33"
            else if (evo.evolvedAbility === 'melter') title = "The Melter"

            return {
                id: `evolve_${evo.evolvedAbility}`,
                title: title,
                desc: "ULTIMATE EVOLUTION: Massive power spike!",
                icon: <Trophy className="text-yellow-400 w-10 h-10 md:w-12 md:h-12 animate-bounce" />
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

        let allPool = [...validActives, ...validPassives]

        // Update descriptions to show current level
        let finalChoices = allPool.map(choice => {
            const isPassive = passives.some(p => p.id === choice.id)
            const level = isPassive ? as.getPassiveLevel(choice.id as any) : as.getAbilityLevel(choice.id as any)
            const nextLevelDescription = as.getUpgradeDescription(choice.id, level + 1)
            return {
                ...choice,
                desc: level > 0 ? `Level ${level + 1}: ${nextLevelDescription}` : `New: ${nextLevelDescription}`
            }
        })

        // Shuffle and take 4 (including evos) using deterministic RNG
        const rng = rngRef.current
        finalChoices = finalChoices.sort(() => (rng ? rng.next() : Math.random()) - 0.5)
        const result = [...evos]
        while (result.length < 4 && finalChoices.length > 0) {
            result.push(finalChoices.shift()!)
        }

        return result
    }

    const levelUpChoices = useRef<any[]>([])

    useEffect(() => {
        const checkAccess = async () => {
            if (!user) return
            const hostname = typeof window !== "undefined" ? window.location.hostname : ""
            const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
            if (isLocalhost) {
                setIsAuthorized(true)
                setAuthReason(null)
                return
            }
            try {
                const response = await fetch("/api/game/check-access")
                const data = await response.json()
                if (data.success) {
                    setIsAuthorized(data.authorized)
                    setAuthReason(data.reason)
                }
            } catch (err) {
                console.error("Access check failed:", err)
            }
        }
        checkAccess()
    }, [user])

    const xpPercent = Math.min(100, (playerXp / playerXpTarget) * 100)
    const hpPercent = Math.min(100, (playerHp / playerMaxHp) * 100)

    return (
        <div className="relative w-[100vw] left-1/2 -translate-x-1/2 space-y-3 font-sans select-none overflow-x-hidden pt-2">
            {/* Header Card - More Compact */}
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-4 shadow-xl mx-4 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary leading-none">Slavic Survivors</h2>
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Authentic Folklore Rogue-lite</p>
                </div>
                <div className="flex gap-2">
                    {gameState === "menu" && <Button onClick={() => setGameState("playing")} size="default" className="bg-primary hover:bg-primary/90 font-black px-6 h-10">START HUNT</Button>}
                </div>
            </div>

            {/* FULL WIDTH Game Viewport Container */}
            <div className="relative bg-[#1a1e1a] border-y-8 border-card overflow-hidden shadow-2xl w-full translate-x-0">
                <div ref={containerRef} className="w-full h-[960px]" />

                {/* HUD Overlay */}
                {/* HUD Overlay */}
                <div className="absolute top-0 left-0 w-full p-6 md:p-10 pointer-events-none z-30">
                    {/* Status Bars and Clock Container */}
                    <div className="flex justify-between items-start relative">
                        {/* Left: XP and HP */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-cyan-400 font-black italic text-base uppercase tracking-widest drop-shadow-lg">Level {playerLevel}</span>
                                    <span className="text-white font-mono text-xs drop-shadow-md">{Math.floor(playerXp)} / {playerXpTarget} XP</span>
                                </div>
                                <div className="w-80 h-4 bg-black/80 rounded-full p-[3px] border-2 border-white/20 overflow-hidden shadow-2xl">
                                    <div className="h-full bg-gradient-to-r from-teal-400 to-teal-200 rounded-full transition-all duration-150 shadow-[0_0_20px_rgba(45,212,191,1)]" style={{ width: `${xpPercent}%` }} />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-red-500 font-black italic text-base uppercase tracking-widest drop-shadow-lg">Vitality</span>
                                    <span className="text-white font-mono text-xs drop-shadow-md">{Math.floor(playerHp)} / {playerMaxHp} HP</span>
                                </div>
                                <div className="w-80 h-4 bg-black/80 rounded-full p-[3px] border-2 border-white/20 overflow-hidden shadow-2xl">
                                    <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-75 shadow-[0_0_20px_rgba(239,68,68,1)]" style={{ width: `${hpPercent}%` }} />
                                </div>
                            </div>

                        </div>

                        {/* Centered Buff HUD */}
                        <div className="absolute top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-auto max-w-[80vw]">
                            <div className="flex flex-wrap justify-center gap-3">
                                {abilitySystemRef.current?.getUpgrades().map(item => {
                                    const info = getItemInfo(item.id)
                                    return (
                                        <div key={item.id} className="bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-xl flex flex-col items-center group relative shadow-2xl">
                                            {/* Hover Tooltip */}
                                            <div className="absolute top-full mt-3 w-48 bg-black/90 border border-white/20 p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex flex-col items-center text-center">
                                                <div className="font-bold text-primary uppercase text-xs mb-1">
                                                    {info.name}
                                                </div>
                                                <div className="text-[10px] text-white/70 leading-tight">
                                                    {info.desc}
                                                </div>
                                                <div className="absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-black/90 border-l border-t border-white/20 rotate-45"></div>
                                            </div>

                                            <div className="group-hover:scale-110 transition-transform">
                                                {renderItemIcon(item.id)}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-primary text-black text-[10px] font-black px-1.5 rounded-full border border-black ring-2 ring-primary/20 shadow-lg">
                                                {item.level}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Center: Clock */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto">
                            <div className="bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border-4 border-cyan-500/40 text-cyan-400 font-black flex items-center gap-4 shadow-[0_0_40px_rgba(34,211,238,0.4)] ring-1 ring-white/10 scale-110">
                                <Clock className="w-8 h-8 animate-pulse text-cyan-400" />
                                <span className="text-4xl tabular-nums italic drop-shadow-md">
                                    {Math.floor(gameTime / 60)}:{(gameTime % 60).toFixed(0).padStart(2, '0')}
                                </span>
                                {gameState === "replaying" && replaySpeed > 1 && (
                                    <div className="flex flex-col -gap-1 items-start leading-none opacity-80">
                                        <span className="text-xs text-cyan-300 font-black uppercase tracking-tighter">SPEED</span>
                                        <span className="text-xl text-cyan-200 font-black">{replaySpeed}x</span>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Right: Spacer for balance / Stats Toggle */}
                        <div className="w-80 flex justify-end items-start gap-2 pointer-events-auto">
                            {(gameState === "playing" || gameState === "paused") && (
                                <>
                                    <Button onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")} variant="outline" size="icon" className="h-10 w-10 bg-black/60 border-white/20 hover:bg-white/10 text-white backdrop-blur-md">
                                        {gameState === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                    </Button>
                                    <Button onClick={() => { resetGame(); setGameState("menu"); }} variant="ghost" size="icon" className="h-10 w-10 bg-black/60 border-white/20 border hover:bg-white/10 text-white backdrop-blur-md"><RotateCcw className="w-4 h-4" /></Button>
                                </>
                            )}
                            <Button
                                onClick={() => setShowStats(!showStats)}
                                variant="outline"
                                className="bg-black/60 border-white/20 hover:bg-white/10 text-white font-bold uppercase tracking-widest backdrop-blur-md"
                            >
                                {showStats ? 'Hide Stats' : 'Stats'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* RPG Stat Sheet Side Panel */}
                {(gameState === "playing" || gameState === "paused" || gameState === "replaying") && showStats && (
                    <div className="absolute top-32 right-4 w-72 bg-black/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl z-20 pointer-events-auto">
                        <h3 className="text-xl font-black italic uppercase text-white mb-4 border-b border-white/10 pb-2">Hunter Stats</h3>
                        <div className="space-y-2 text-sm font-mono">
                            <StatRow label="Might" value={`${Math.round(playerRef.current?.stats.damageMultiplier! * 100)}%`} icon={<Sword className="w-4 h-4 text-red-400" />} />
                            <StatRow label="Armor" value={playerRef.current?.stats.armor.toFixed(0)} icon={<Shield className="w-4 h-4 text-gray-400" />} />
                            <StatRow label="Max Health" value={playerRef.current?.stats.maxHp.toFixed(0)} icon={<Heart className="w-4 h-4 text-red-600" />} />
                            <StatRow label="Recovery" value={`${playerRef.current?.stats.regen.toFixed(1)}/s`} icon={<Heart className="w-4 h-4 text-pink-400" />} />
                            <StatRow label="Cooldown" value={`${Math.round((1 - playerRef.current?.stats.cooldownMultiplier!) * 100)}%`} icon={<Clock className="w-4 h-4 text-blue-400" />} />
                            <StatRow label="Area" value={`${Math.round(playerRef.current?.stats.areaMultiplier! * 100)}%`} icon={<Circle className="w-4 h-4 text-purple-400" />} />
                            <StatRow label="Speed" value={`${Math.round(playerRef.current?.stats.projectileSpeedMultiplier! * 100)}%`} icon={<Zap className="w-4 h-4 text-yellow-400" />} />
                            <StatRow label="Duration" value={`${Math.round(playerRef.current?.stats.durationMultiplier! * 100)}%`} icon={<Clock className="w-4 h-4 text-green-400" />} />
                            <StatRow label="Amount" value={`+${playerRef.current?.stats.amount}`} icon={<Cloud className="w-4 h-4 text-white" />} />
                            <StatRow label="MoveSpeed" value={playerRef.current?.stats.moveSpeed.toFixed(1)} icon={<Zap className="w-4 h-4 text-cyan-400" />} />
                            <StatRow label="Magnet" value={playerRef.current?.stats.magnet.toFixed(1)} icon={<Magnet className="w-4 h-4 text-blue-300" />} />
                            <StatRow label="Luck" value={`${Math.round(playerRef.current?.stats.luck! * 100)}%`} icon={<Gift className="w-4 h-4 text-emerald-400" />} />
                            <StatRow label="Growth" value={`${Math.round(playerRef.current?.stats.growth! * 100)}%`} icon={<Trophy className="w-4 h-4 text-amber-300" />} />
                            <StatRow label="Greed" value={`${Math.round(playerRef.current?.stats.greed! * 100)}%`} icon={<CircleDot className="w-4 h-4 text-yellow-500" />} />
                            <StatRow label="Curse" value={`${Math.round(playerRef.current?.stats.curse! * 100)}%`} icon={<Skull className="w-4 h-4 text-purple-900" />} />
                            <div className="pt-2 border-t border-white/10 grid grid-cols-4 gap-1 text-center text-xs">
                                <div className="flex flex-col items-center"><span className="text-white/50">Rev</span><span>{playerRef.current?.stats.revivals}</span></div>
                                <div className="flex flex-col items-center"><span className="text-white/50">Rer</span><span>{playerRef.current?.stats.rerolls}</span></div>
                                <div className="flex flex-col items-center"><span className="text-white/50">Skp</span><span>{playerRef.current?.stats.skips}</span></div>
                                <div className="flex flex-col items-center"><span className="text-white/50">Ban</span><span>{playerRef.current?.stats.banishes}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Game Overlays */}
                {gameState === "menu" && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 animate-in fade-in duration-500">
                        <div className="mb-12 text-center">
                            <h1 className="text-6xl md:text-9xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-2">Slavic Survivors</h1>
                            <p className="text-primary font-black tracking-[0.6em] uppercase text-xs md:text-base animate-pulse">Select Your Destination</p>
                        </div>

                        {/* World Selection */}
                        <div className="flex gap-6 mb-16 overflow-x-auto max-w-full p-4 snap-x">
                            {WORLDS.map(world => (
                                <div
                                    key={world.id}
                                    onClick={() => setSelectedWorldId(world.id)}
                                    className={`cursor-pointer border-4 rounded-[2rem] p-8 w-80 md:w-96 transition-all relative overflow-hidden group hover:scale-105 shrink-0 snap-center
                                        ${selectedWorldId === world.id
                                            ? 'border-green-400 bg-green-400/10 scale-105 shadow-[0_0_50px_rgba(74,222,128,0.3)]'
                                            : 'border-white/10 bg-black/40 hover:border-white/40 grayscale hover:grayscale-0'}`}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-50 text-[10px] font-mono border-b border-l border-white/20 rounded-bl-xl">ID: {world.id.toUpperCase()}</div>
                                    <h3 className="font-black italic uppercase text-3xl mb-4 text-white leading-none mt-4">{world.name}</h3>
                                    <p className="text-sm uppercase font-bold text-white/50 mb-8 leading-relaxed h-12">{world.description}</p>

                                    <div className="space-y-3 font-mono text-xs">
                                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                                            <span className="text-white/40">DIFFICULTY</span>
                                            <span className={`font-black ${world.difficultyMultiplier > 1 ? 'text-red-400' : 'text-green-400'}`}>{(world.difficultyMultiplier * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-black/30 p-3 rounded-lg border border-white/5">
                                            <span className="text-white/40">VICTORY LEVEL</span>
                                            <span className="text-yellow-400 font-bold">{world.maxLevel}</span>
                                        </div>
                                    </div>

                                    {selectedWorldId === world.id && (
                                        <div className="absolute inset-0 border-4 border-green-500 rounded-[2rem] animate-pulse pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col md:flex-row gap-6">
                            <Button onClick={() => setGameState("characterSelect")} size="lg" className="h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl font-black rounded-[2.5rem] shadow-green-500/40 shadow-[0_0_60px_rgba(74,222,128,0.2)] bg-green-500 text-black hover:bg-green-400 hover:scale-110 active:scale-95 transition-all uppercase tracking-[0.2em] w-full md:w-auto">
                                Select Hero
                            </Button>
                            <Button onClick={() => setGameState("leaderboard")} variant="outline" size="lg" className="h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl font-black rounded-[2.5rem] border-4 border-white/20 hover:border-white hover:bg-white/10 text-white hover:scale-110 active:scale-95 transition-all uppercase tracking-[0.2em] w-full md:w-auto">
                                Legends
                            </Button>
                            <Button onClick={() => setGameState("myHistory")} variant="outline" size="lg" className="h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl font-black rounded-[2.5rem] border-4 border-cyan-500/20 hover:border-cyan-500 hover:bg-cyan-500/10 text-white hover:scale-110 active:scale-95 transition-all uppercase tracking-[0.2em] w-full md:w-auto">
                                My History
                            </Button>
                        </div>
                    </div>
                )}

                {gameState === "characterSelect" && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 animate-in fade-in zoom-in duration-300">
                        <div className="mb-4 text-center">
                            <div className="flex items-center justify-center gap-4 mb-2">
                                <Button variant="ghost" onClick={() => setGameState("menu")} className="rounded-full h-12 w-12 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white">
                                    <RotateCcw className="w-5 h-5" />
                                </Button>
                                <h2 className="text-4xl font-black italic uppercase text-white tracking-tight">Choose Your Fighter</h2>
                            </div>
                            <p className="text-white/40 font-mono text-sm tracking-widest uppercase">Select a hero to brave the {WORLDS.find(w => w.id === selectedWorldId)?.name}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 w-full max-w-7xl px-4">
                            {characterData.map(char => (
                                <div
                                    key={char.id}
                                    onClick={() => setSelectedCharacterId(char.id)}
                                    className={`cursor-pointer border-4 rounded-[2.5rem] p-6 transition-all relative overflow-hidden group flex flex-col
                                        ${selectedCharacterId === char.id
                                            ? 'border-primary bg-primary/10 scale-105 z-10 shadow-[0_0_40px_rgba(255,100,0,0.3)]'
                                            : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                                >
                                    <div className="flex-1 flex flex-col items-center text-center justify-center mb-6 relative">
                                        <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-black/50 overflow-hidden border-4 ${selectedCharacterId === char.id ? 'border-primary' : 'border-white/10'} mb-6 shadow-2xl relative`}>
                                            <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent" />
                                            {/* Sprite/Placeholder */}
                                            <div className="absolute inset-0 flex items-center justify-center font-black text-6xl text-white/5 uppercase select-none">{char.id.slice(0, 2)}</div>
                                            <div className={`w-full h-full bg-cover bg-center transition-all duration-700 ${selectedCharacterId === char.id && 'scale-110'}`} style={{ backgroundImage: `url(/sprites/${char.sprite}.png)` }} />
                                        </div>
                                        <h3 className="font-black italic uppercase text-2xl md:text-3xl text-white mb-2 leading-none">{char.name}</h3>
                                        <p className="text-white/60 text-sm font-medium leading-relaxed px-2 mb-4">{char.description}</p>

                                        {/* Starting Weapon Badge */}
                                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full mb-2">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-tighter">STARTING</span>
                                            <div className="flex items-center gap-2">
                                                {renderItemIcon(char.startingWeapon, "w-4 h-4")}
                                                <span className="text-[10px] font-bold text-white uppercase truncate max-w-[100px]">
                                                    {getItemInfo(char.startingWeapon).name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-2">
                                        <div className="flex justify-between text-xs font-mono font-bold text-white/40 border-b border-white/5 pb-2 mb-2">
                                            <span>STATS</span>
                                            <span>MODIFIERS</span>
                                        </div>
                                        {Object.entries(char.stats || {}).map(([key, val]: [string, any]) => (
                                            <div key={key} className="flex justify-between text-sm items-center">
                                                <span className="uppercase text-white/60 font-bold text-[10px] tracking-wider">{key}</span>
                                                <span className={`font-mono font-bold ${val > 1 ? 'text-green-400' : val < 1 ? 'text-red-400' : 'text-white/40'}`}>
                                                    {val === 1 ? '-' : val > 1 ? `+${Math.round((val - 1) * 100)}%` : `-${Math.round((1 - val) * 100)}%`}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {selectedCharacterId === char.id && (
                                        <div className="absolute inset-0 border-4 border-primary rounded-[2.5rem] animate-pulse pointer-events-none" />
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-4">
                            <div className="flex gap-4">
                                <Button onClick={() => setGameState("menu")} variant="outline" size="lg" className="h-[80px] px-12 text-2xl font-black rounded-[2rem] border-4 border-white/20 hover:border-white text-white hover:bg-white/10 uppercase tracking-[0.2em] transition-all active:scale-95">
                                    BACK
                                </Button>
                            </div>
                            <Button onClick={() => { resetGame(false); setGameState("playing"); }} size="lg" className="h-[80px] px-24 text-4xl font-black rounded-[2rem] shadow-primary/60 shadow-[0_0_60px_rgba(255,100,0,0.5)] bg-primary text-black hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4">
                                BEGIN HUNT
                            </Button>
                        </div>
                    </div>
                )}

                {gameState === "myHistory" && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 z-50 animate-in fade-in duration-300">
                        <div className="bg-black/80 backdrop-blur-md border-4 border-cyan-500/20 p-6 md:p-12 rounded-[4rem] w-full max-w-5xl shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 relative overflow-hidden">
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

                            <div className="flex flex-col md:flex-row justify-between items-center mb-10 relative z-10 gap-6">
                                <h3 className="text-4xl md:text-6xl font-black italic uppercase text-cyan-400 tracking-[0.3em] drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">My Sessions</h3>
                                <Button onClick={() => setGameState("menu")} variant="ghost" className="h-16 w-16 rounded-full hover:bg-white/10 group">
                                    <RotateCcw className="w-8 h-8 text-white/40 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar relative z-10 w-full text-left">
                                {userHistory.length > 0 ? (
                                    userHistory.map((s, i) => {
                                        const char = characterData.find(c => c.id === s.characterId) || characterData[0]
                                        const world = WORLDS.find(w => w.id === s.worldId) || WORLDS[0]
                                        return (
                                            <div key={i} className="flex justify-between items-center text-white/80 font-bold border-b-2 border-white/5 pb-6 pt-2 hover:bg-white/5 px-6 rounded-2xl transition-all group animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 50}ms` }}>
                                                <div className="flex items-center gap-6 md:gap-8">
                                                    <div className="relative">
                                                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/50 border-4 ${s.level >= world.maxLevel ? 'border-yellow-500' : 'border-white/10'} overflow-hidden group-hover:scale-110 transition-all shadow-xl relative flex items-center justify-center`}>
                                                            <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(/sprites/${char.sprite}.png)` }} />
                                                            <span className="text-white/10 font-black text-2xl uppercase select-none">{char.name.charAt(0)}</span>
                                                        </div>
                                                        {s.level >= world.maxLevel && <Trophy className="absolute -top-2 -right-2 w-6 h-6 text-yellow-500 drop-shadow-lg" />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-2xl md:text-3xl tracking-tighter text-white font-black uppercase group-hover:text-cyan-400 transition-colors leading-tight">{char.name}</span>
                                                        <span className="text-[10px] md:text-xs text-white/40 font-mono tracking-widest uppercase mt-1 italic">{world.name} • {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Unknown Date'}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-6 md:gap-10 items-center">
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-cyan-400 font-black italic text-xl md:text-2xl drop-shadow-md tracking-tighter">LVL {s.level}</span>
                                                        <span className="text-xs md:text-sm uppercase opacity-40 font-mono tracking-widest mt-1 italic">{Math.floor(s.time / 60)}:{(s.time % 60).toFixed(0).padStart(2, '0')}</span>
                                                    </div>
                                                    {s.seed && s.events && (
                                                        <Button
                                                            onClick={() => startReplay(s)}
                                                            size="lg"
                                                            className="h-14 md:h-16 px-6 md:px-8 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black text-xs md:text-sm font-black uppercase rounded-[2rem] border-2 border-cyan-500/30 transition-all shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95"
                                                        >
                                                            Watch Replay
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="py-20 text-center text-white/20 italic font-black uppercase tracking-[0.5em] text-2xl">No personal records yet...</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === "leaderboard" && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 z-50 animate-in fade-in duration-300">
                        <div className="bg-black/80 backdrop-blur-md border-4 border-primary/20 p-6 md:p-12 rounded-[4rem] w-full max-w-5xl shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

                            <div className="flex flex-col md:flex-row justify-between items-center mb-10 relative z-10 gap-6">
                                <h3 className="text-4xl md:text-6xl font-black italic uppercase text-primary tracking-[0.3em] drop-shadow-[0_0_20px_rgba(255,100,0,0.5)]">Hall of Heroes</h3>

                                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-sm">
                                    {WORLDS.map(world => (
                                        <button
                                            key={world.id}
                                            onClick={() => setLeaderboardWorldId(world.id)}
                                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${leaderboardWorldId === world.id
                                                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                                                : 'text-white/40 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            {world.name}
                                        </button>
                                    ))}
                                </div>

                                <Button onClick={() => setGameState("menu")} variant="ghost" className="h-16 w-16 rounded-full hover:bg-white/10 group">
                                    <RotateCcw className="w-8 h-8 text-white/40 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar relative z-10 w-full text-left">
                                {scores.filter(s => (s.worldId || 'dark_forest') === leaderboardWorldId).length > 0 ? (
                                    scores.filter(s => (s.worldId || 'dark_forest') === leaderboardWorldId).map((s, i) => {
                                        const char = characterData.find(c => c.id === s.characterId) || characterData[0]
                                        return (
                                            <div key={i} className="flex justify-between items-center text-white/80 font-bold border-b-2 border-white/5 pb-6 pt-2 hover:bg-white/5 px-6 rounded-2xl transition-all group animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                                <div className="flex items-center gap-8 md:gap-10">
                                                    <span className={`${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/20'} w-10 italic font-black text-3xl md:text-5xl drop-shadow-md`}>#{i + 1}</span>
                                                    <div className="relative">
                                                        <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/10 shadow-2xl group-hover:border-primary transition-all group-hover:scale-110">
                                                            <AvatarImage src={s.avatarUrl} />
                                                            <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 font-black text-2xl text-white">{s.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        {/* Character Badge */}
                                                        <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-black border-2 border-white/20 overflow-hidden shadow-lg z-10 flex items-center justify-center" title={char.name}>
                                                            <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(/sprites/${char.sprite}.png)` }} />
                                                            <span className="text-white/20 font-black text-[10px] uppercase select-none">{char.name.charAt(0)}</span>
                                                        </div>
                                                        {i < 3 && <Trophy className={`absolute -top-3 -left-3 w-8 h-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : ''} drop-shadow-lg z-20`} />}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-3xl md:text-4xl tracking-tighter text-white font-black uppercase group-hover:text-primary transition-colors leading-tight drop-shadow-md">{s.name}</span>
                                                        {s.handle && <span className="text-xs md:text-sm text-primary/60 font-mono tracking-widest uppercase mt-1">@{s.handle}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex gap-8 md:gap-12 items-center">
                                                    <div className="flex flex-col items-end shrink-0">
                                                        <span className="text-primary font-black italic text-xl md:text-2xl drop-shadow-md tracking-tighter">LVL {s.level}</span>
                                                        <span className="text-xs md:text-sm uppercase opacity-40 font-mono tracking-widest mt-1 italic">{Math.floor(s.time / 60)}:{(s.time % 60).toFixed(0).padStart(2, '0')}</span>
                                                    </div>
                                                    {s.seed && s.events && (
                                                        <Button
                                                            onClick={() => startReplay(s)}
                                                            size="lg"
                                                            className="h-14 md:h-16 px-8 md:px-10 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black text-sm md:text-base font-black uppercase rounded-[2rem] border-2 border-cyan-500/30 transition-all shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:scale-105 active:scale-95"
                                                        >
                                                            Review Session
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="py-20 text-center text-white/20 italic font-black uppercase tracking-[0.5em] text-2xl">No legends recorded yet...</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === "levelUp" && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-start p-6 md:p-12 z-50 overflow-y-auto pt-16 pb-20">
                        <div className="mb-8 text-center animate-pulse shrink-0">
                            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                                {WORLDS.find(w => w.id === selectedWorldId)?.lootThemeName || "RELIQUARY OPEN"}
                            </h2>
                            <p className="text-primary font-black tracking-[0.3em] uppercase text-sm mt-2 font-mono">CHOOSE YOUR POWER</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-5xl w-full mx-auto">
                            {levelUpChoices.current.map((choice) => (
                                <UpgradeCard
                                    key={choice.id}
                                    title={choice.title}
                                    desc={choice.desc}
                                    icon={choice.icon}
                                    onClick={() => handleUpgrade(choice.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {gameState === "gameOver" && (
                    <div className="absolute inset-0 bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 animate-in fade-in zoom-in duration-500">
                        <div className="bg-black/60 border-4 border-red-500/30 p-12 md:p-16 rounded-[4rem] flex flex-col items-center shadow-2xl ring-2 ring-red-500/10 max-w-4xl w-full">
                            <h2 className="text-6xl md:text-[8rem] font-black italic uppercase tracking-tighter text-white mb-4 drop-shadow-[0_0_60px_rgba(220,38,38,1)] text-center leading-none">FALLEN</h2>

                            {!showScoreInput ? (
                                <>
                                    <div className="flex flex-col items-center gap-2 mb-12">
                                        <div className="text-white/40 font-black uppercase tracking-[0.3em] text-sm">Final Accomplishment</div>
                                        <div className="text-4xl md:text-6xl text-cyan-400 font-black italic uppercase italic tracking-tighter">Level {playerLevel} Survival</div>
                                        <div className="text-xl text-white/60 font-mono mt-2">{Math.floor(gameTime / 60)}m {(gameTime % 60).toFixed(0)}s on the clock</div>
                                    </div>
                                    <div className="flex gap-6 md:gap-10">
                                        <Button onClick={() => {
                                            setTotalRuns(r => r + 1);
                                            resetGame(false);
                                            setGameState("playing")
                                        }} size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-white text-black hover:bg-white/90 font-black text-xl md:text-3xl uppercase tracking-widest shadow-white/30 shadow-2xl transition-all active:scale-95">TRY AGAIN</Button>
                                        <Button onClick={() => {
                                            setTotalRuns(r => r + 1);
                                            resetGame(false);
                                            setGameState("menu");
                                        }} variant="outline" size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-white/5 border-white/20 text-white hover:bg-white/10 font-black text-xl md:text-3xl uppercase tracking-widest transition-all">BACK</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-8 w-full">
                                    <div className="text-center">
                                        <h3 className="text-3xl md:text-5xl font-black italic uppercase text-primary animate-bounce mb-2">NEW HIGH SCORE!</h3>
                                        <p className="text-white/60 font-black uppercase tracking-[0.2em]">Enter your initials for the Hall of Heroes</p>
                                    </div>

                                    <div className="flex gap-4">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="w-20 h-24 bg-black/80 border-4 border-primary/50 rounded-2xl flex items-center justify-center text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(255,100,0,0.5)] shadow-inner">
                                                {playerName[i] || "_"}
                                            </div>
                                        ))}
                                    </div>

                                    <input
                                        autoFocus
                                        maxLength={4}
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        onKeyDown={(e) => e.key === 'Enter' && playerName.length === 4 && saveScore()}
                                        className="absolute opacity-0 pointer-events-none"
                                    />

                                    <div className="grid grid-cols-6 md:grid-cols-9 gap-2 max-w-2xl pointer-events-auto">
                                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map(char => (
                                            <Button
                                                key={char}
                                                variant="outline"
                                                onClick={() => { if (playerName.length < 4) setPlayerName(prev => prev + char) }}
                                                className="h-12 w-12 font-black text-xl bg-white/5 border-white/10 hover:bg-primary hover:text-black transition-all"
                                            >
                                                {char}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            onClick={() => setPlayerName(prev => prev.slice(0, -1))}
                                            className="h-12 col-span-2 font-black text-xs bg-red-500/20 border-red-500/30 hover:bg-red-500 uppercase tracking-tighter"
                                        >
                                            Del
                                        </Button>
                                        <Button
                                            disabled={playerName.length !== 4}
                                            onClick={saveScore}
                                            className="h-12 col-span-3 font-black text-sm bg-primary text-black hover:bg-primary/80 uppercase tracking-widest disabled:opacity-30"
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-4">Tip: You can use your keyboard!</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {gameState === "gameVictory" && (
                    <div className="absolute inset-0 bg-yellow-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50 animate-in fade-in zoom-in duration-700">
                        <div className="bg-black/60 border-4 border-yellow-500/30 p-12 md:p-16 rounded-[4rem] flex flex-col items-center shadow-2xl ring-2 ring-yellow-500/10 max-w-4xl w-full">
                            <Trophy className="w-24 h-24 text-yellow-500 mb-6 animate-bounce drop-shadow-[0_0_30px_rgba(234,179,8,1)]" />
                            <h2 className="text-6xl md:text-[8rem] font-black italic uppercase tracking-tighter text-white mb-4 drop-shadow-[0_0_60px_rgba(234,179,8,1)] text-center leading-none">VICTORY</h2>

                            {!showScoreInput ? (
                                <>
                                    <div className="flex flex-col items-center gap-2 mb-12">
                                        <div className="text-white/40 font-black uppercase tracking-[0.3em] text-sm">Task Completed</div>
                                        <div className="text-4xl md:text-6xl text-yellow-400 font-black italic uppercase tracking-tighter">Legendary Survival</div>
                                        <div className="text-xl text-white/60 font-mono mt-2">{Math.floor(gameTime / 60)}m {(gameTime % 60).toFixed(0)}s - Final Level {playerLevel}</div>
                                    </div>

                                    <div className="flex gap-6 md:gap-10">
                                        <Button onClick={() => {
                                            setTotalRuns(r => r + 1);
                                            resetGame(false);
                                            setGameState("playing")
                                        }} size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-yellow-500 text-black hover:bg-yellow-400 font-black text-xl md:text-3xl uppercase tracking-widest shadow-yellow-500/30 shadow-2xl transition-all active:scale-95">ANOTHER RUN</Button>
                                        <Button onClick={() => {
                                            setTotalRuns(r => r + 1);
                                            resetGame(false);
                                            setGameState("menu");
                                        }} variant="outline" size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-white/5 border-white/20 text-white hover:bg-white/10 font-black text-xl md:text-3xl uppercase tracking-widest transition-all">RETIRE</Button>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-8 w-full">
                                    <div className="text-center">
                                        <h3 className="text-3xl md:text-5xl font-black italic uppercase text-yellow-500 animate-bounce mb-2">RECORD RECORDED!</h3>
                                        <p className="text-white/60 font-black uppercase tracking-[0.2em]">Enter your initials for the Hall of Heroes</p>
                                    </div>

                                    <div className="flex gap-4">
                                        {[0, 1, 2, 3].map((i) => (
                                            <div key={i} className="w-20 h-24 bg-black/80 border-4 border-yellow-500/50 rounded-2xl flex items-center justify-center text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(234,179,8,1)] shadow-inner">
                                                {playerName[i] || "_"}
                                            </div>
                                        ))}
                                    </div>

                                    <input
                                        autoFocus
                                        maxLength={4}
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                                        onKeyDown={(e) => e.key === 'Enter' && playerName.length === 4 && saveScore()}
                                        className="absolute opacity-0 pointer-events-none"
                                    />

                                    <div className="grid grid-cols-6 md:grid-cols-9 gap-2 max-w-2xl pointer-events-auto">
                                        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map(char => (
                                            <Button
                                                key={char}
                                                variant="outline"
                                                onClick={() => { if (playerName.length < 4) setPlayerName(prev => prev + char) }}
                                                className="h-12 w-12 font-black text-xl bg-white/5 border-white/10 hover:bg-yellow-500 hover:text-black transition-all"
                                            >
                                                {char}
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            onClick={() => setPlayerName(prev => prev.slice(0, -1))}
                                            className="h-12 col-span-2 font-black text-xs bg-red-500/20 border-red-500/30 hover:bg-red-500 uppercase tracking-tighter"
                                        >
                                            Del
                                        </Button>
                                        <Button
                                            disabled={playerName.length !== 4}
                                            onClick={saveScore}
                                            className="h-12 col-span-3 font-black text-sm bg-yellow-500 text-black hover:bg-yellow-500/80 uppercase tracking-widest disabled:opacity-30"
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                    <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-4">Tip: You can use your keyboard!</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Replay Controls Overlay */}
                {gameState === "replaying" && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-6 bg-black/80 backdrop-blur-2xl px-10 py-6 rounded-[3rem] border-4 border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50 animate-in slide-in-from-bottom-10">
                        <Button
                            onClick={() => { resetGame(); setGameState("leaderboard"); }}
                            variant="outline"
                            className="bg-red-500/10 border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 font-bold uppercase rounded-full w-14 h-14 p-0 transition-all active:scale-95"
                            title="Exit Replay"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>

                        <div className="h-10 w-px bg-white/10" />

                        <Button
                            onClick={() => setReplayPaused(!replayPaused)}
                            variant="outline"
                            className="bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold rounded-full w-20 h-20 p-0 shadow-lg shadow-cyan-500/20 transition-all active:scale-90"
                        >
                            {replayPaused ? <Play className="w-10 h-10 fill-current ml-1" /> : <Pause className="w-10 h-10 fill-current" />}
                        </Button>

                        <div className="h-10 w-px bg-white/10" />

                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-white/40 uppercase font-black mb-2 tracking-[0.2em]">Playback Speed</span>
                            <div className="flex gap-2">
                                {[1, 2, 4, 8].map(speed => (
                                    <Button
                                        key={speed}
                                        onClick={() => setReplaySpeed(speed)}
                                        variant={replaySpeed === speed ? "default" : "outline"}
                                        className={`h-10 px-4 font-black rounded-xl transition-all ${replaySpeed === speed ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/40' : 'bg-black/40 border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                                    >
                                        {speed}x
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}


                {isAuthorized === false && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center z-[100] animate-in fade-in duration-700">
                        <div className="bg-red-500/10 border-4 border-red-500/20 p-12 rounded-[4rem] max-w-2xl w-full shadow-[0_0_100px_rgba(220,38,38,0.2)] relative overflow-hidden">
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />

                            <div className="mb-8 p-6 bg-red-500/20 rounded-full w-fit mx-auto ring-8 ring-red-500/5">
                                <ShieldAlert className="w-16 h-16 text-red-500" />
                            </div>

                            <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none">ACCESS <span className="text-red-500">DENIED</span></h2>
                            <p className="text-xl md:text-2xl text-white/60 font-medium mb-10 leading-relaxed uppercase tracking-widest">
                                {authReason || "You do not possess the necessary relic to enter these lands."}
                            </p>

                            <div className="flex flex-col gap-4">
                                <Button variant="outline" className="h-20 text-xl font-black uppercase rounded-3xl border-white/10 hover:bg-white/5" onClick={() => window.location.reload()}>
                                    <RotateCcw className="w-6 h-6 mr-3" /> Retry Check
                                </Button>
                                <p className="text-xs text-white/20 uppercase tracking-[0.3em] font-mono mt-4">Required: {authReason?.includes("Missing") ? "COLLECTION ITEM" : "AUTHORIZED ACCESS"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {isAuthorized === null && user && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-[100]">
                        <div className="flex flex-col items-center gap-6">
                            <Loader2 className="w-16 h-16 animate-spin text-primary" />
                            <span className="text-primary font-black uppercase tracking-[0.5em] animate-pulse">VERIFYING RELICS...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div className="max-w-6xl mx-auto px-4 pb-20">
                <div className="bg-card/40 backdrop-blur-xl border-4 border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <MessageSquare className="w-8 h-8 text-primary" />
                        <h3 className="text-3xl md:text-4xl font-black italic uppercase text-white tracking-tighter">Hunter's Tavern</h3>
                    </div>

                    {user ? (
                        <div className="flex flex-col gap-4 mb-10">
                            {replyingTo && (
                                <div className="flex justify-between items-center bg-primary/10 border border-primary/20 p-3 rounded-xl animate-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-4 bg-primary rounded-full" />
                                        <span className="text-xs text-primary font-bold uppercase">Replying to @{replyingTo.handle}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)} className="h-6 px-2 text-[10px] text-white/40 hover:text-white uppercase font-bold">Cancel</Button>
                                </div>
                            )}
                            <div className="flex gap-4 items-start">
                                <Avatar className="w-12 h-12 border-2 border-primary shadow-lg shrink-0">
                                    <AvatarImage src={user.publicProfile.avatarUrl} />
                                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{user.publicProfile.handle.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-3">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        placeholder={replyingTo ? `Write your reply to @${replyingTo.handle}...` : "Leave a message for other hunters..."}
                                        className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:border-primary/50 outline-none transition-all min-h-[100px] resize-none font-medium"
                                    />
                                    <div className="flex justify-end">
                                        <Button 
                                            onClick={() => postComment(replyingTo?.id)} 
                                            disabled={!newComment.trim() || isPostingComment}
                                            className="bg-primary text-black font-black uppercase px-8 rounded-xl h-12 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            {isPostingComment ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> {replyingTo ? 'Post Reply' : 'Post Message'}</>}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-10">
                            <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Login with HandCash to join the conversation</p>
                        </div>
                    )}

                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                        {gameComments.length > 0 ? (
                            gameComments
                                .filter(c => !c.parentId) // Only top-level comments first
                                .map((comment) => {
                                    const replies = gameComments.filter(r => r.parentId === comment.id)
                                    return (
                                        <div key={comment.id} className="space-y-4">
                                            {/* Top-level Comment */}
                                            <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <Avatar className="w-10 h-10 border border-white/10 shrink-0">
                                                    <AvatarImage src={comment.avatarUrl} />
                                                    <AvatarFallback className="bg-white/5 text-white/40">{comment.handle.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 group-hover:border-white/10 transition-all relative">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-primary font-black text-sm uppercase tracking-tighter">@{comment.handle}</span>
                                                        <span className="text-[10px] text-white/20 font-mono font-bold uppercase">{new Date(comment.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-white/80 text-sm leading-relaxed font-medium mb-3">{comment.content}</p>
                                                    <div className="flex justify-start">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => {
                                                                setReplyingTo({ id: comment.id, handle: comment.handle })
                                                                // Scroll to textarea
                                                                document.querySelector('textarea')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                                            }}
                                                            className="h-7 px-3 text-[10px] text-white/40 hover:text-primary hover:bg-primary/5 uppercase font-black transition-all"
                                                        >
                                                            Reply
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Nested Replies */}
                                            {replies.length > 0 && (
                                                <div className="ml-10 space-y-4 border-l-2 border-white/5 pl-6">
                                                    {replies.map((reply) => (
                                                        <div key={reply.id} className="flex gap-3 group animate-in fade-in slide-in-from-left-2 duration-500">
                                                            <Avatar className="w-8 h-8 border border-white/10 shrink-0">
                                                                <AvatarImage src={reply.avatarUrl} />
                                                                <AvatarFallback className="bg-white/5 text-white/40">{reply.handle.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 bg-white/[0.03] rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-all">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-primary font-black text-[11px] uppercase tracking-tighter">@{reply.handle}</span>
                                                                    <span className="text-[9px] text-white/20 font-mono font-bold uppercase">{new Date(reply.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-white/70 text-xs leading-relaxed font-medium">{reply.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                        ) : (
                            <div className="py-12 text-center text-white/10 italic font-black uppercase tracking-[0.3em]">The tavern is quiet... for now.</div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}

function UpgradeCard({ title, desc, icon, onClick }: { title: string, desc: string, icon: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className="group relative bg-black/60 border-4 border-white/5 p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] text-left transition-all hover:bg-white/10 hover:border-primary/50 hover:scale-[1.02] active:scale-95 shadow-2xl overflow-hidden ring-1 ring-white/10"
        >
            <div className="mb-6 md:mb-8 w-16 md:w-20 h-16 md:h-20 rounded-[1.5rem] md:rounded-[2rem] bg-white/5 flex items-center justify-center group-hover:bg-primary/30 transition-all group-hover:rotate-12 group-hover:scale-110">
                {icon}
            </div>
            <h3 className="text-3xl md:text-4xl font-black italic uppercase text-white mb-2 md:mb-3 group-hover:text-primary transition-colors tracking-tighter">{title}</h3>
            <p className="text-base md:text-lg text-white/50 font-black leading-tight tracking-tight opacity-70">{desc}</p>
            <div className="absolute top-8 right-10 text-[10px] font-black uppercase text-white/5 tracking-[0.5em] group-hover:text-primary/40 transition-colors">Ancient Relic</div>

            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
        </button>
    )
}


function StatRow({ label, value, icon }: { label: string, value: string | undefined, icon: any }) {
    return (
        <div className="flex justify-between items-center bg-white/5 p-1.5 rounded hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-2 text-white/80 uppercase text-[10px] tracking-wider font-bold">
                {icon}
                {label}
            </div>
            <div className="text-white font-bold">{value}</div>
        </div>
    )
}
