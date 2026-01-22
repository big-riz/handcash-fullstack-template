"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
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
    Loader2
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

export function SlavicSurvivors() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [gameState, setGameState] = useState<"menu" | "playing" | "paused" | "gameOver" | "levelUp" | "replaying" | "leaderboard">("menu")
    const [fps, setFps] = useState<number>(0)

    // UI HUD Stats
    const [playerHp, setPlayerHp] = useState<number>(100)
    const [playerMaxHp, setPlayerMaxHp] = useState<number>(100)
    const [playerLevel, setPlayerLevel] = useState<number>(1)
    const [playerXp, setPlayerXp] = useState<number>(0)
    const [playerXpTarget, setPlayerXpTarget] = useState<number>(10)
    const [totalRuns, setTotalRuns] = useState<number>(0)
    const [scores, setScores] = useState<{ id?: number, name: string, handle?: string, avatarUrl?: string, level: number, time: number, seed?: string, events?: any[] }[]>([])
    const [gameTime, setGameTime] = useState<number>(0)
    const [showScoreInput, setShowScoreInput] = useState(false)
    const [playerName, setPlayerName] = useState("")
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [authReason, setAuthReason] = useState<string | null>(null)

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
    const vfxManagerRef = useRef<VFXManager | null>(null)
    const rngRef = useRef<SeededRandom | null>(null)
    const replayRef = useRef<ReplayRecorder | null>(null)
    const replayPlayerRef = useRef<ReplayPlayer | null>(null)
    const replayFrameRef = useRef<number>(0)
    const gameTimeRef = useRef<number>(0)

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
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x3d453d,
            roughness: 0.8,
            metalness: 0.1
        })
        const ground = new THREE.Mesh(groundGeo, groundMat)
        ground.rotation.x = -Math.PI / 2
        ground.position.y = -0.01
        ground.receiveShadow = true
        scene.add(ground)

        const grid = new THREE.GridHelper(2000, 100, 0x555555, 0x444444)
        grid.position.y = -0.005
        scene.add(grid)

        // VERY BRIGHT LIGHTING
        scene.add(new THREE.AmbientLight(0xffffff, 1.2))

        const moonLight = new THREE.DirectionalLight(0xddeeff, 2.5)
        moonLight.position.set(20, 50, -30)
        moonLight.castShadow = true
        moonLight.shadow.camera.left = -100
        moonLight.shadow.camera.right = 100
        moonLight.shadow.camera.top = 100
        moonLight.shadow.camera.bottom = -100
        scene.add(moonLight)
        scene.add(moonLight.target)

        const player = new Player(0, 0)
        player.createMesh(scene)
        playerRef.current = player

        const vfx = new VFXManager(scene)
        vfxManagerRef.current = vfx

        const entityManager = new EntityManager(scene, player, vfx)
        entityManagerRef.current = entityManager

        const rng = new SeededRandom(Date.now().toString())
        rngRef.current = rng
        const replay = new ReplayRecorder(rng.next().toString(), playerName || 'ANON')
        replayRef.current = replay

        const spawnSystem = new SpawnSystem(entityManager, player, rng)
        spawnSystemRef.current = spawnSystem

        const abilitySystem = new AbilitySystem(scene, player, entityManager, vfx)
        abilitySystemRef.current = abilitySystem

        const input = new InputManager()
        input.start()
        inputManagerRef.current = input

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

            moonLight.position.set(p.position.x + 20, 50, p.position.z - 30)
            moonLight.target.position.copy(p.position)

            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)
            setPlayerLevel(p.stats.level)
            setPlayerXp(p.stats.xp)
            setPlayerXpTarget(p.stats.xpToNextLevel)

            if (p.stats.currentHp <= 0) {
                // Ensure replay captures final state BEFORE triggering score saves
                if (replayRef.current) {
                    replayRef.current.finish(p.stats.level, Math.floor(gameTimeRef.current))
                }
                setGameState("gameOver")
                checkHighScore(p.stats.level)
            }
            else if (p.stats.level > prevLevel && gameStateRef.current !== "replaying") {
                levelUpChoices.current = getLevelUpChoices()
                setGameState("levelUp")
            }

            cameraTargetRef.current.copy(p.position)
            gameTimeRef.current += deltaTime
            setGameTime(gameTimeRef.current)

            // RECORDING
            if (gameStateRef.current === "playing" && replayRef.current) {
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
    }, [])

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
                        events: r.events
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
    }, [])

    useEffect(() => {
        if (gameState === 'menu') {
            fetchGlobalScores()
        }
    }, [gameState])

    useEffect(() => {
        localStorage.setItem('slavic_scores', JSON.stringify(scores))
        localStorage.setItem('slavic_total_runs', totalRuns.toString())
    }, [scores, totalRuns])

    const checkHighScore = (level: number) => {
        const isHighScore = scores.length < 10 || level > (scores[scores.length - 1]?.level || 0)
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
                userId: null
            })
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
            events: replayData?.events
        }

        const newScores = [...scores, newScore]
            .sort((a, b) => b.level - a.level || b.time - a.time)
            .slice(0, 10)

        setScores(newScores)
        setShowScoreInput(false)
        setPlayerName("")

        // Push this high score to global history
        submitReplayToDB(finalName)
    }

    const resetGame = (forReplay: boolean = false) => {
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
            p.stats.xpToNextLevel = 10
            p.stats.moveSpeed = 8.0
            p.stats.magnet = 2.5
            p.stats.armor = 0
            p.stats.areaMultiplier = 1.0
            p.stats.cooldownMultiplier = 1.0
            p.stats.damageMultiplier = 1.0

            setPlayerLevel(1)
            setGameTime(0)
            gameTimeRef.current = 0

            p.stats.maxHp = 100
            p.stats.currentHp = 100
            p.stats.damageMultiplier = 1.0
            p.stats.moveSpeed = 8.0

            setPlayerHp(p.stats.currentHp)
            setPlayerMaxHp(p.stats.maxHp)

            em.cleanup()
            vm.cleanup()
            abilitySystemRef.current?.cleanup()

            abilitySystemRef.current = new AbilitySystem(scene, p, em, vm)

            const newSeed = Date.now().toString()

            replayRef.current = forReplay ? null : new ReplayRecorder(newSeed, (user?.publicProfile.displayName || playerName || 'ANON'))

            // Create two deterministic RNGs from the base seed
            const gameRNG = new SeededRandom(newSeed + "_game")
            const uiRNG = new SeededRandom(newSeed + "_ui")

            rngRef.current = uiRNG
            spawnSystemRef.current = new SpawnSystem(em, p, gameRNG)
        }
        cameraTargetRef.current.set(0, 0, 0)
    }

    const startReplay = (score: any) => {
        const p = playerRef.current
        const scene = sceneRef.current
        const em = entityManagerRef.current
        const vm = vfxManagerRef.current

        if (p && scene && em && vm && score.seed && score.events) {
            resetGame(true)

            // Re-init systems with the specific stored seed
            const gameRNG = new SeededRandom(score.seed + "_game")
            const uiRNG = new SeededRandom(score.seed + "_ui")
            rngRef.current = uiRNG

            const replayData: ReplayData = {
                seed: score.seed,
                startTime: Date.now(),
                gameVersion: '0.1.0-alpha',
                events: score.events,
                finalLevel: score.level,
                finalTime: score.time,
                playerName: score.name
            }

            replayPlayerRef.current = new ReplayPlayer(replayData)
            replayFrameRef.current = 0

            spawnSystemRef.current = new SpawnSystem(em, p, gameRNG)

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
        } else if (type === 'hp' || type === 'speed' || type === 'magnet' || type === 'armor' || type === 'area' || type === 'damage' || type === 'silver' || type === 'iron' || type === 'icon' || type === 'salt_passive' || type === 'garlic_ring' || type === 'regen') {
            as.addPassive(type as any)
        } else if (type === 'garlic' || type === 'dagger' || type === 'holywater' || type === 'stake' || type === 'cross' || type === 'salt' || type === 'tt33' ||
            type === 'propaganda_tower' || type === 'ak_radioactive' || type === 'ak_ghzel' || type === 'ak_corrupted' || type === 'ak_mushroom' || type === 'nuclear_pigeon' || type === 'lada') {
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

        const actives = [
            { id: 'garlic', title: "Czosnek Halo", desc: "A damaging aura that keeps spirits at bay.", minLevel: 1, icon: <Circle className="text-white w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'dagger', title: "Hussar Lances", desc: "Shoot piercing blades in movement direction.", minLevel: 1, icon: <Sword className="text-blue-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'holywater', title: "Svyata Voda", desc: "Create lingering damage pools on the ground.", minLevel: 1, icon: <Zap className="text-blue-500 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'stake', title: "Aspen Stake", desc: "Auto-targets nearest enemies with high damage.", minLevel: 2, icon: <Sword className="text-orange-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'cross', title: "Krzyż Boomerang", desc: "A holy cross that returns to you, piercing enemies.", minLevel: 3, icon: <RotateCcw className="text-yellow-500 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'salt', title: 'Solny Krąg', desc: 'A protective circle of salt that wards off spirits.', minLevel: 4, icon: <Circle className="text-white w-10 h-10 md:w-12 md:h-12 border-2 border-dashed rounded-full" /> },
            { id: 'tt33', title: 'TT33 Handgun', desc: 'Rapid single shots at nearest enemy. Likes crit.', minLevel: 5, icon: <Sword className="text-gray-300 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'propaganda_tower', title: 'Propaganda Tower', desc: 'Deploy stationary towers that damage and slow.', minLevel: 6, icon: <Trophy className="text-red-500 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'ak_radioactive', title: 'Radioactive AK', desc: 'Fast nuclear bursts. Chance to melt enemies.', minLevel: 8, icon: <Zap className="text-green-500 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'ak_ghzel', title: 'Ghzel AK', desc: 'Artisanal precision. High critical hit chance.', minLevel: 9, icon: <Crosshair className="text-blue-300 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'ak_corrupted', title: 'Corrupted AK', desc: "Demonic weapon that siphons life from foes.", minLevel: 10, icon: <Skull className="text-red-600 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'ak_mushroom', title: 'Mushroom AK', desc: 'Fires rounds that burst into toxic spore clouds.', minLevel: 12, icon: <Cloud className="text-purple-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'nuclear_pigeon', title: 'Nuclear Pigeon', desc: 'A radioactive companion that orbits and protects.', minLevel: 13, icon: <Bird className="text-green-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'lada', title: 'Lada Vehicle', desc: 'Periodic armored push. Crust anything in your path.', minLevel: 15, icon: <Car className="text-gray-400 w-10 h-10 md:w-12 md:h-12" /> },
        ]

        const passives = [
            { id: 'hp', title: "Old World Heart", desc: "+20 Max Vitality & Full Recovery.", minLevel: 1, icon: <Heart className="text-red-500 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'speed', title: "Wild Spirit", desc: "+0.5 Movement Speed.", minLevel: 1, icon: <Zap className="text-yellow-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'magnet', title: "Amber Stone", desc: "+1.5 Collection Radius.", minLevel: 1, icon: <Magnet className="text-cyan-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'regen', title: "Health Regen", desc: "+1.0 HP Regeneration per second.", minLevel: 1, icon: <Heart className="text-red-400 w-10 h-10 md:w-12 md:h-12 animate-pulse" /> },
            { id: 'iron', title: "Zhelezo (Iron)", desc: "+1 Permanent Armor & Knockback Resist.", minLevel: 2, icon: <Shield className="text-gray-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'area', title: 'Vistula Reach', desc: '+15% Ability Area Multiplier.', minLevel: 3, icon: <Circle className="text-cyan-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'garlic_ring', title: "Garlic Ring", desc: "+10% Ability Area. Required for Soul Siphon.", minLevel: 5, icon: <Circle className="text-white w-10 h-10 md:w-12 md:h-12 border-4 border-white/20" /> },
            { id: 'silver', title: "Srebro (Silver)", desc: "+15% Total Damage Multiplier.", minLevel: 6, icon: <Beaker className="text-purple-400 w-10 h-10 md:w-12 md:h-12" /> },
            { id: 'salt_passive', title: "Sol (Salt)", desc: "+10% Area & +5% Damage.", minLevel: 7, icon: <Circle className="text-white w-10 h-10 md:w-12 md:h-12 opacity-50" /> },
            { id: 'icon', title: "Ikona (Icon)", desc: "+10% Cooldown Reduction.", minLevel: 10, icon: <RotateCcw className="text-cyan-400 w-10 h-10 md:w-12 md:h-12" /> },
        ]

        const evos = as.getAvailableEvolutions().map(evo => {
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
                if (playerLevel < (a.minLevel ?? 0)) return false
                return as.canAddActive()
            }
            return level < 5
        })

        const validPassives = passives.filter(p => {
            const level = as.getPassiveLevel(p.id as any)
            if (level === 0) {
                if (playerLevel < (p.minLevel ?? 0)) return false
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
                    {(gameState === "playing" || gameState === "paused") && (
                        <Button onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")} variant="outline" size="icon" className="h-10 w-10">
                            {gameState === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </Button>
                    )}
                    {gameState !== "menu" && <Button onClick={() => { resetGame(); setGameState("menu"); }} variant="ghost" size="icon" className="h-10 w-10"><RotateCcw className="w-4 h-4" /></Button>}
                </div>
            </div>

            {/* FULL WIDTH Game Viewport Container */}
            <div className="relative bg-[#1a1e1a] border-y-8 border-card overflow-hidden shadow-2xl w-full translate-x-0">
                <div ref={containerRef} className="w-full h-[960px]" />

                {/* HUD Overlay */}
                {gameState !== "menu" && (
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
                                        <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-150 shadow-[0_0_20px_rgba(34,211,238,1)]" style={{ width: `${xpPercent}%` }} />
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
                                    {abilitySystemRef.current?.getUpgrades().map(item => (
                                        <div key={item.id} className="bg-black/60 backdrop-blur-md border border-white/20 p-2 rounded-xl flex flex-col items-center group relative shadow-2xl">
                                            <div className="text-primary group-hover:scale-110 transition-transform">
                                                {/* Passives */}
                                                {item.id === 'hp' && <Heart className="w-6 h-6" />}
                                                {item.id === 'speed' && <Zap className="w-6 h-6" />}
                                                {item.id === 'magnet' && <Magnet className="w-6 h-6" />}
                                                {item.id === 'armor' && <Shield className="w-6 h-6" />}
                                                {item.id === 'area' && <Circle className="w-6 h-6 text-cyan-400" />}
                                                {item.id === 'damage' && <Sword className="w-6 h-6 text-purple-400" />}
                                                {item.id === 'icon' && <RotateCcw className="w-6 h-6 text-cyan-400" />}
                                                {item.id === 'garlic_ring' && <Circle className="w-6 h-6 text-white" />}
                                                {item.id === 'salt_passive' && <Circle className="w-6 h-6 text-white opacity-50" />}
                                                {item.id === 'iron' && <Shield className="w-6 h-6 text-gray-400" />}
                                                {item.id === 'silver' && <Beaker className="w-6 h-6 text-purple-400" />}
                                                {item.id === 'regen' && <Heart className="w-6 h-6 text-red-400 animate-pulse" />}

                                                {/* Actives */}
                                                {item.id === 'garlic' && <Circle className="w-6 h-6 text-white" />}
                                                {item.id === 'dagger' && <Sword className="w-6 h-6 text-blue-400" />}
                                                {item.id === 'holywater' && <Zap className="w-6 h-6 text-blue-500" />}
                                                {item.id === 'stake' && <Sword className="w-6 h-6 text-orange-400" />}
                                                {item.id === 'cross' && <RotateCcw className="w-6 h-6 text-yellow-500" />}
                                                {item.id === 'salt' && <Circle className="w-6 h-6 text-white border-dashed border" />}
                                                {item.id === 'tt33' && <Sword className="w-6 h-6 text-gray-300" />}
                                                {item.id === 'propaganda_tower' && <Trophy className="w-6 h-6 text-red-500" />}
                                                {item.id === 'ak_radioactive' && <Zap className="w-6 h-6 text-green-500" />}
                                                {item.id === 'ak_ghzel' && <Crosshair className="w-6 h-6 text-blue-300" />}
                                                {item.id === 'ak_corrupted' && <Skull className="w-6 h-6 text-red-600" />}
                                                {item.id === 'ak_mushroom' && <Cloud className="w-6 h-6 text-purple-400" />}
                                                {item.id === 'nuclear_pigeon' && <Bird className="w-6 h-6 text-green-400" />}
                                                {item.id === 'lada' && <Car className="w-6 h-6 text-gray-400" />}

                                                {/* Evolutions */}
                                                {item.id === 'soul_siphon' && <Circle className="w-6 h-6 text-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" />}
                                                {item.id === 'silver_tt33' && <Sword className="w-6 h-6 text-slate-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />}
                                                {item.id === 'melter' && <Zap className="w-6 h-6 text-lime-400 animate-pulse" />}
                                            </div>
                                            <div className="absolute -bottom-2 -right-2 bg-primary text-black text-[10px] font-black px-1.5 rounded-full border border-black ring-2 ring-primary/20 shadow-lg">
                                                {item.level}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Center: Clock */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto">
                                <div className="bg-black/80 backdrop-blur-2xl px-8 py-4 rounded-[2rem] border-4 border-cyan-500/40 text-cyan-400 font-black flex items-center gap-4 shadow-[0_0_40px_rgba(34,211,238,0.4)] ring-1 ring-white/10 scale-110">
                                    <Clock className="w-8 h-8 animate-pulse text-cyan-400" />
                                    <span className="text-4xl tabular-nums italic drop-shadow-md">
                                        {Math.floor(gameTime / 60)}:{(gameTime % 60).toFixed(0).padStart(2, '0')}
                                    </span>
                                </div>
                            </div>

                            {/* Right: Spacer for balance */}
                            <div className="w-80" />
                        </div>
                    </div>
                )}

                {/* Game Overlays */}
                {gameState === "menu" && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center z-40">
                        <div className="space-y-2 mb-10 scale-75 md:scale-100 transition-transform">
                            <h1 className="text-8xl md:text-[10rem] leading-none font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]">Slavic</h1>
                            <h1 className="text-9xl md:text-[11rem] leading-none font-black italic uppercase tracking-tighter text-primary -mt-6 md:-mt-10 drop-shadow-[0_20px_60px_rgba(255,100,0,0.6)]">Survivors</h1>
                        </div>
                        <div className="flex flex-col md:flex-row gap-6">
                            <Button onClick={() => { resetGame(false); setGameState("playing"); }} size="lg" className="h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl font-black rounded-[2.5rem] shadow-primary/60 shadow-[0_0_60px_rgba(255,100,0,0.4)] bg-primary hover:scale-110 active:scale-95 transition-all uppercase tracking-[0.2em] w-full md:w-auto">Start the Hunt</Button>
                            <Button onClick={() => setGameState("leaderboard")} variant="outline" size="lg" className="h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl font-black rounded-[2.5rem] border-4 border-white/20 hover:border-primary hover:bg-white/10 text-white hover:scale-110 active:scale-95 transition-all uppercase tracking-[0.2em] w-full md:w-auto">Hall of Heroes</Button>
                        </div>
                    </div>
                )}

                {gameState === "leaderboard" && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 z-50 animate-in fade-in duration-300">
                        <div className="bg-black/80 backdrop-blur-md border-4 border-primary/20 p-6 md:p-12 rounded-[4rem] w-full max-w-5xl shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 relative overflow-hidden">
                            {/* Decorative Background Element */}
                            <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
                            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />

                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <h3 className="text-4xl md:text-6xl font-black italic uppercase text-primary tracking-[0.3em] drop-shadow-[0_0_20px_rgba(255,100,0,0.5)]">Hall of Heroes</h3>
                                <Button onClick={() => setGameState("menu")} variant="ghost" className="h-16 w-16 rounded-full hover:bg-white/10 group">
                                    <RotateCcw className="w-8 h-8 text-white/40 group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                                </Button>
                            </div>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar relative z-10 w-full text-left">
                                {scores.length > 0 ? (
                                    scores.map((s, i) => (
                                        <div key={i} className="flex justify-between items-center text-white/80 font-bold border-b-2 border-white/5 pb-6 pt-2 hover:bg-white/5 px-6 rounded-2xl transition-all group animate-in fade-in slide-in-from-right duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                                            <div className="flex items-center gap-8 md:gap-10">
                                                <span className={`${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/20'} w-10 italic font-black text-3xl md:text-5xl drop-shadow-md`}>#{i + 1}</span>
                                                <div className="relative">
                                                    <Avatar className="w-16 h-16 md:w-20 md:h-20 border-4 border-white/10 shadow-2xl group-hover:border-primary transition-all group-hover:scale-110">
                                                        <AvatarImage src={s.avatarUrl} />
                                                        <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 font-black text-2xl text-white">{s.name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    {i < 3 && <Trophy className={`absolute -top-3 -right-3 w-8 h-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : ''} drop-shadow-lg`} />}
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
                                    ))
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
                            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.4)]">RELIQUARY OPEN</h2>
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
                                        }} size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-white text-black hover:bg-white/90 font-black text-xl md:text-3xl uppercase tracking-widest shadow-white/30 shadow-2xl transition-all active:scale-95">RETRIBUTION</Button>
                                        <Button onClick={() => {
                                            setTotalRuns(r => r + 1);
                                            resetGame(false);
                                            setGameState("menu");
                                        }} variant="outline" size="lg" className="h-20 md:h-24 px-12 md:px-20 rounded-[2.5rem] bg-white/5 border-white/20 text-white hover:bg-white/10 font-black text-xl md:text-3xl uppercase tracking-widest transition-all">RETREAT</Button>
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

            {/* Visual Legend */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 pb-12">
                <div className="bg-card/40 backdrop-blur-sm border-2 border-cyan-500/20 rounded-[3rem] p-10 flex items-center gap-10 hover:border-cyan-500/40 transition-all duration-300 group">
                    <Magnet className="w-12 h-12 text-cyan-400 group-hover:scale-125 transition-transform" />
                    <div><h4 className="font-black italic uppercase text-lg tracking-[0.2em] text-cyan-400 mb-1">Amber Pull</h4><p className="text-sm text-muted-foreground uppercase leading-tight font-black opacity-60">Magnetism of the Soil</p></div>
                </div>
                <div className="bg-card/40 backdrop-blur-sm border-2 border-blue-500/20 rounded-[3rem] p-10 flex items-center gap-10 hover:border-blue-500/40 transition-all duration-300 group">
                    <Sword className="w-12 h-12 text-blue-400 group-hover:scale-125 transition-transform" />
                    <div><h4 className="font-black italic uppercase text-lg tracking-[0.2em] text-blue-400 mb-1">Hussar Lance</h4><p className="text-sm text-muted-foreground uppercase leading-tight font-black opacity-60">Piercing Ranged Strike</p></div>
                </div>
                <div className="bg-card/30 backdrop-blur-sm border-2 border-red-500/20 rounded-[3rem] p-10 flex items-center gap-10 hover:border-red-500/40 transition-all duration-300 group">
                    <Heart className="w-12 h-12 text-red-500 group-hover:scale-125 transition-transform" />
                    <div><h4 className="font-black italic uppercase text-lg tracking-[0.2em] text-red-500 mb-1">Old Vitality</h4><p className="text-sm text-muted-foreground uppercase leading-tight font-black opacity-60">Endurance of the Night</p></div>
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

