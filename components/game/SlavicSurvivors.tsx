import { useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { ItemTemplate } from "@/lib/item-templates-storage"
import { WORLDS } from '@/components/game/data/worlds'
import { CharacterInfo, GameComment } from "./types"
import characterDataImport from '@/components/game/data/characters'
const characterData: CharacterInfo[] = characterDataImport as CharacterInfo[]

import { useGameEngine, updateCustomLevelsCache } from "./hooks/useGameEngine"
import { MainMenu } from "./screens/MainMenu"
import { CharacterSelect } from "./screens/CharacterSelect"
import { Leaderboard } from "./screens/Leaderboard"
import { History } from "./screens/History"
import { HUD } from "./screens/HUD"
import { LevelUp } from "./screens/LevelUp"
import { GameOver } from "./screens/GameOver"
import { Victory } from "./screens/Victory"
import { ReplayControls } from "./screens/ReplayControls"
import { CommentsSection } from "./screens/CommentsSection"
import { PauseMenu } from "./screens/PauseMenu"
import { Achievements } from "./screens/Achievements"
import { getAchievementTracker } from "@/lib/achievement-tracker"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, Minimize2, Maximize2, ShieldAlert, Loader2, Check, Volume2, VolumeX } from "lucide-react"

import { InputManager } from "./core/Input"
import { BotController } from "./core/BotController" // New Import
import { Player } from "./entities/Player"
import { AbilitySystem } from "./systems/AbilitySystem"
import { ReplayRecorder } from "../../lib/ReplaySystem"
import { AudioManager } from "./core/AudioManager"
import { LevelEditor, CustomLevelData } from "./debug/LevelEditor"
import { loadCustomLevels, getCustomLevel } from "@/lib/custom-levels-storage"
import { PerformanceOverlay } from "./ui/PerformanceOverlay"
import { PerformanceMetrics, GameStatsHistory } from "./core/PerformanceProfiler"
import { AirdropIndicator } from "./ui/AirdropIndicator"

export function SlavicSurvivors() {
    const containerRef = useRef<HTMLDivElement>(null)
    const [gameState, setGameState] = useState<"menu" | "characterSelect" | "playing" | "paused" | "gameOver" | "levelUp" | "airdropLevelUp" | "replaying" | "leaderboard" | "gameVictory" | "myHistory" | "achievements">("menu")
    const [customLevels, setCustomLevels] = useState<CustomLevelData[]>([])
    
    // Stats
    const [playerHp, setPlayerHp] = useState<number>(100)
    const [playerMaxHp, setPlayerMaxHp] = useState<number>(100)
    const [playerLevel, setPlayerLevel] = useState<number>(1)
    const [playerXp, setPlayerXp] = useState<number>(0)
    const [playerXpTarget, setPlayerXpTarget] = useState<number>(10)
    const [totalRuns, setTotalRuns] = useState<number>(0)
    const [kills, setKills] = useState<number>(0)
    const [scores, setScores] = useState<{ id?: number, name: string, handle?: string, avatarUrl?: string, level: number, time: number, seed?: string, events?: any[], characterId?: string, worldId?: string }[]>([])
    const [userHistory, setUserHistory] = useState<any[]>([])
    const [gameComments, setGameComments] = useState<GameComment[]>([])
    const [replyingTo, setReplyingTo] = useState<{ id: number, handle: string } | null>(null)
    const [newComment, setNewComment] = useState("")
    const [isPostingComment, setIsPostingComment] = useState(false)
    const [gameTime, setGameTime] = useState<number>(0)
    const [damageDealt, setDamageDealt] = useState<number>(0)
    const [damageTaken, setDamageTaken] = useState<number>(0)
    const [difficultyMultiplier, setDifficultyMultiplier] = useState<number>(1.0)
    const [isNewHighScore, setIsNewHighScore] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [isCheckingAuth, setIsCheckingAuth] = useState(false)
    const [hasCompletedAuthCheck, setHasCompletedAuthCheck] = useState(false)
    const [authReason, setAuthReason] = useState<string | null>(null)
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('gopnik')
    const [selectedWorldId, setSelectedWorldId] = useState<string>('dark_forest')
    const [leaderboardWorldId, setLeaderboardWorldId] = useState<string>('dark_forest')
    const [replayPaused, setReplayPaused] = useState(false)
    const [replaySpeed, setReplaySpeed] = useState(1)
    const [isMobile, setIsMobile] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [banishedItems, setBanishedItems] = useState<Set<string>>(new Set())
    const [unlockedCharacters, setUnlockedCharacters] = useState<Set<string>>(new Set(['gopnik']))
    const [worldStars, setWorldStars] = useState<Record<string, number>>({})
    const [newHeroUnlocked, setNewHeroUnlocked] = useState<string | null>(null)
    const [isBotActive, setIsBotActive] = useState(false) // Bot State
    const [gameSpeed, setGameSpeed] = useState(1) // Bot Game Speed
    const [isLocalhost, setIsLocalhost] = useState(false)
    const [confirmReset, setConfirmReset] = useState(false) // Mobile Reset Confirmation
    const [isMuted, setIsMuted] = useState(false)
    const [musicVolume, setMusicVolume] = useState(1)
    const [sfxVolume, setSfxVolume] = useState(1)
    const [activeSynergies, setActiveSynergies] = useState<{name: string, description: string}[]>([])
    const [levelEditorOpen, setLevelEditorOpen] = useState(false)
    const [waveNotification, setWaveNotification] = useState<string | null>(null)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

    // Performance Profiler
    const [profilerVisible, setProfilerVisible] = useState(false)
    const [profilerMetrics, setProfilerMetrics] = useState<PerformanceMetrics | null>(null)
    const [profilerWarnings, setProfilerWarnings] = useState<string[]>([])
    const [fpsHistory, setFPSHistory] = useState<number[]>([])
    const [gameStatsHistory, setGameStatsHistory] = useState<GameStatsHistory>({
        damage: [], kills: [], xp: [], dps: [], enemies: [], timestamps: []
    })

    // Achievement tracking
    const achievementTracker = getAchievementTracker()
    const [achievements, setAchievements] = useState(achievementTracker.getAchievements())

    // Meta progression removed

    const replayPausedRef = useRef(false)
    const [itemTemplates, setItemTemplates] = useState<ItemTemplate[]>([])
    const [isLoaded, setIsLoaded] = useState(false)
    const [choicesRefreshKey, setChoicesRefreshKey] = useState(0)

    const { user } = useAuth()
    const userRef = useRef(user)
    const audioManagerRef = useRef<AudioManager | null>(null)

    // Keep userRef in sync with user
    useEffect(() => {
        userRef.current = user
    }, [user])

    // Lifted Refs for Engine
    const inputManagerRef = useRef<InputManager | null>(null)
    const botControllerRef = useRef<BotController | null>(null)
    const playerRef = useRef<Player | null>(null)
    const abilitySystemRef = useRef<AbilitySystem | null>(null)
    const replayRef = useRef<ReplayRecorder | null>(null)

    useEffect(() => {
        audioManagerRef.current = AudioManager.getInstance();
        setIsMuted(audioManagerRef.current.getMuteState());

        // Load saved volume settings
        const savedMusicVolume = localStorage.getItem('slavic_music_volume');
        const savedSfxVolume = localStorage.getItem('slavic_sfx_volume');

        if (savedMusicVolume) {
            const vol = parseFloat(savedMusicVolume);
            setMusicVolume(vol);
            audioManagerRef.current.setMusicVolume(vol);
        }

        if (savedSfxVolume) {
            const vol = parseFloat(savedSfxVolume);
            setSfxVolume(vol);
            audioManagerRef.current.setSfxVolume(vol);
        }
    }, []);

    useEffect(() => {
        if (!audioManagerRef.current) return;

        // Biome-specific music
        if (gameState === "playing") {
            audioManagerRef.current.playBiomeMusic(selectedWorldId);
        } else {
            audioManagerRef.current.stopMusic();
        }

        if (gameState === "levelUp") {
            audioManagerRef.current.playLevelUp();
            audioManagerRef.current.playVoiceChooseUpgrade();
        } else if (gameState === "gameOver") {
            audioManagerRef.current.playGameOver();
            setTimeout(() => audioManagerRef.current?.playVoiceYouDied(), 600);
        } else if (gameState === "gameVictory") {
            audioManagerRef.current.playVictory();
            setTimeout(() => audioManagerRef.current?.playVoiceVictory(), 800);
        }
    }, [gameState]);

    const handleToggleMute = () => {
        if (!audioManagerRef.current) return;
        audioManagerRef.current.toggleMute();
        setIsMuted(audioManagerRef.current.getMuteState());
    };

    const handleMusicVolumeChange = (volume: number) => {
        if (!audioManagerRef.current) return;
        audioManagerRef.current.setMusicVolume(volume);
        setMusicVolume(volume);
        localStorage.setItem('slavic_music_volume', volume.toString());
    };

    const handleSfxVolumeChange = (volume: number) => {
        if (!audioManagerRef.current) return;
        audioManagerRef.current.setSfxVolume(volume);
        setSfxVolume(volume);
        localStorage.setItem('slavic_sfx_volume', volume.toString());
    };

    // Data Fetching & Persistence
    useEffect(() => {
        if (typeof window !== "undefined") {
            const localhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
            setIsLocalhost(localhost);

            // Load custom levels on localhost
            if (localhost) {
                loadCustomLevels().then(levels => {
                    setCustomLevels(levels)
                    updateCustomLevelsCache(levels) // Update game engine cache
                }).catch(err => {
                    console.error('[LevelEditor] Failed to load custom levels:', err)
                })
            }
        }
        const saved = localStorage.getItem('slavic_survivors_unlocked_heros')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setUnlockedCharacters(new Set(['gopnik', ...parsed]))
                }
            } catch (e) { console.error("Failed to parse unlocked heroes", e) }
        }
        setIsLoaded(true)

        const savedScores = localStorage.getItem('slavic_scores')
        const savedRuns = localStorage.getItem('slavic_total_runs')
        if (savedScores) setScores(JSON.parse(savedScores))
        if (savedRuns) setTotalRuns(parseInt(savedRuns))

        const savedChars = localStorage.getItem('slavic_unlocked_chars')
        if (savedChars) {
            try {
                const charArray = JSON.parse(savedChars)
                if (Array.isArray(charArray)) setUnlockedCharacters(new Set(charArray))
            } catch (e) { }
        }

        const savedStars = localStorage.getItem('slavic_world_stars')
        if (savedStars) {
            try {
                setWorldStars(JSON.parse(savedStars))
            } catch (e) { }
        }

        fetchGlobalScores()
        fetch("/api/pool-stats")
            .then(res => res.json())
            .then(data => {
                console.log('[ItemTemplates] API Response:', data)
                if (data.success && data.pools) {
                    const defaultPool = data.pools.find((p: any) => p.poolName === 'default')
                    if (defaultPool && defaultPool.items) {
                        console.log('[ItemTemplates] Loaded', defaultPool.items.length, 'templates')
                        setItemTemplates(defaultPool.items)
                    } else {
                        console.warn('[ItemTemplates] No default pool found in API response')
                    }
                } else {
                    console.warn('[ItemTemplates] Invalid API response format')
                }
            })
            .catch(err => {
                console.error("[ItemTemplates] Failed to fetch:", err)
                // Set empty array so the game doesn't crash
                setItemTemplates([])
            })
    }, [])

    useEffect(() => {
        if (isLoaded && unlockedCharacters.size > 0) {
            localStorage.setItem('slavic_survivors_unlocked_heros', JSON.stringify(Array.from(unlockedCharacters)))
            localStorage.setItem('slavic_unlocked_chars', JSON.stringify(Array.from(unlockedCharacters)))
        }
    }, [unlockedCharacters, isLoaded])

    useEffect(() => {
        localStorage.setItem('slavic_world_stars', JSON.stringify(worldStars))
    }, [worldStars])

    useEffect(() => {
        localStorage.setItem('slavic_scores', JSON.stringify(scores))
        localStorage.setItem('slavic_total_runs', totalRuns.toString())
    }, [scores, totalRuns])

    const fetchGlobalScores = async () => {
        // Fetch scores for all worlds in parallel
        const worlds = WORLDS.map(w => w.id)
        try {
            const allScores: any[] = []
            const results = await Promise.all(
                worlds.map(worldId =>
                    fetch(`/api/replays?worldId=${worldId}&limit=25`)
                        .then(res => res.json())
                        .catch(() => [])
                )
            )
            results.forEach(data => {
                if (Array.isArray(data)) {
                    allScores.push(...data.map((r: any) => ({
                        id: r.id, name: r.playerName, handle: r.handle, avatarUrl: r.avatarUrl,
                        level: r.finalLevel, time: r.finalTime, seed: r.seed, events: r.events,
                        worldId: r.worldId, characterId: r.characterId, createdAt: r.createdAt
                    })))
                }
            })
            setScores(allScores)
        } catch (err) {
            console.error("Failed to fetch global scores:", err)
        }
    }

    const fetchUserHistory = async () => {
        if (!user) return
        try {
            const res = await fetch(`/api/replays?handle=${user.publicProfile.handle}&limit=50`)
            const data = await res.json()
            if (Array.isArray(data)) {
                setUserHistory(data.map((r: any) => ({
                    id: r.id, name: r.playerName, handle: r.handle, avatarUrl: r.avatarUrl,
                    level: r.finalLevel, time: r.finalTime, seed: r.seed, events: r.events,
                    worldId: r.worldId, characterId: r.characterId, createdAt: r.createdAt
                })))
            }
        } catch (err) { console.error("Failed to fetch user history:", err) }
    }

    const fetchComments = async () => {
        try {
            const res = await fetch('/api/comments')
            const data = await res.json()
            if (Array.isArray(data)) setGameComments(data)
        } catch (err) { console.error("Failed to fetch comments:", err) }
    }

    useEffect(() => {
        if (gameState === 'menu') {
            fetchGlobalScores()
            fetchComments()
            fetchUserHistory()

            // Reload custom levels when returning to menu to ensure latest levels are shown
            if (isLocalhost) {
                loadCustomLevels().then(levels => {
                    setCustomLevels(levels)
                    updateCustomLevelsCache(levels)
                }).catch(err => {
                    console.error('[LevelEditor] Failed to reload custom levels:', err)
                })
            }
        } else if (gameState === 'myHistory') {
            fetchUserHistory()
        }
    }, [gameState, user, isLocalhost])

    const postComment = async (parentId?: number) => {
        if (!newComment.trim() || !user || isPostingComment) return
        setIsPostingComment(true)
        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment.trim(), parentId: parentId || null })
            })
            if (res.ok) {
                const posted = await res.json()
                setGameComments(prev => [posted, ...prev])
                setNewComment("")
                setReplyingTo(null)
            }
        } catch (err) { console.error("Failed to post comment:", err) } finally { setIsPostingComment(false) }
    }

    const submitReplayToDB = () => {
        const currentUser = userRef.current
        console.log("[Replay] submitReplayToDB called", { hasReplayRef: !!replayRef.current, hasUser: !!currentUser })
        if (!replayRef.current) {
            console.log("[Replay] Skipping - no replay recorder")
            return
        }
        if (!currentUser) {
            console.log("[Replay] Skipping score submission - user not authenticated")
            return
        }
        const replayData = replayRef.current.getReplayData()
        console.log("[Replay] Submitting replay:", { level: replayData.finalLevel, time: replayData.finalTime, worldId: replayData.worldId })
        fetch('/api/replays', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName: currentUser.publicProfile.handle,
                handle: currentUser.publicProfile.handle,
                avatarUrl: currentUser.publicProfile.avatarUrl || null,
                seed: replayData.seed,
                events: replayData.events,
                finalLevel: replayData.finalLevel,
                finalTime: replayData.finalTime,
                gameVersion: replayData.gameVersion,
                characterId: replayData.characterId || selectedCharacterId,
                worldId: replayData.worldId || selectedWorldId,
                userId: currentUser.publicProfile.id || null
            })
        })
        .then(res => res.json())
        .then(data => {
            console.log("[Replay] Score submission result:", data)
            // Check if this was a new high score (new entry or updated existing)
            if (data.success && (data.updated === true || !data.updated)) {
                // updated === true means beat previous score, no updated field means new entry
                setIsNewHighScore(data.updated !== false)
            }
            fetchUserHistory()
            fetchGlobalScores()
        })
        .catch(err => console.error("[Replay] Failed to save replay to DB:", err))
    }

    const {
        resetGame,
        startReplay,
        handleUpgrade,
        getLevelUpChoices,
        getActiveAirdrops,
        toggleUncapped,
        levelUpChoices,
        allowPostVictoryRef,
        pendingLevelUpAfterVictoryRef,
        spawnSystemRef,
        entityManagerRef
    } = useGameEngine({
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
        user,
        setSelectedCharacterId,
        setSelectedWorldId,
        setWorldStars,
        setUnlockedCharacters,
        setNewHeroUnlocked,
        itemTemplates,
        submitReplayToDB,
        banishedItems,
        setBanishedItems,
        replayPaused,
        replaySpeed,
        gameSpeed,
        isBotActive,
        playerRef,
        abilitySystemRef,
        replayRef,
        audioManagerRef,
        setWaveNotification,
        setProfilerMetrics,
        setProfilerWarnings,
        setFPSHistory,
        setGameStatsHistory
    })

    // Expose entityManager globally for console debugging and benchmarking
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).gameEngine = {
                entityManager: entityManagerRef.current
            }
        }
        return () => {
            if (typeof window !== 'undefined') {
                delete (window as any).gameEngine
            }
        }
    }, [entityManagerRef])

    // Regenerate level-up choices when templates load
    useEffect(() => {
        if (itemTemplates.length > 0 && gameState === "levelUp" && getLevelUpChoices) {
            console.log('[LevelUp] Regenerating choices with loaded templates')
            const newChoices = getLevelUpChoices()
            if (levelUpChoices.current && newChoices.length > 0) {
                // Check if current choices are missing imageUrls
                const currentHasImages = levelUpChoices.current.some(c => c.imageUrl)
                const newHasImages = newChoices.some(c => c.imageUrl)

                // Only regenerate if new choices have images and current don't
                if (newHasImages && !currentHasImages) {
                    console.log('[LevelUp] Updating choices with imageUrls')
                    levelUpChoices.current = newChoices
                    // Force a re-render by incrementing the key
                    setChoicesRefreshKey(prev => prev + 1)
                }
            }
        }
    }, [itemTemplates, gameState, getLevelUpChoices])

    // Mobile & Fullscreen
    useEffect(() => {
        const checkMobile = () => setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
        checkMobile()
        const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    // Window size for airdrop indicator
    useEffect(() => {
        const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const toggleFullscreen = async () => {
        try {
            if (document.fullscreenElement) await document.exitFullscreen()
            else await document.documentElement.requestFullscreen()
        } catch (e) { console.error('Fullscreen toggle failed:', e) }
    }

    // Performance Profiler Keyboard Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Toggle profiler overlay (F3)
            if (e.key === 'F3') {
                e.preventDefault()
                setProfilerVisible(v => !v)
            }

            // Toggle uncapped FPS mode (F5)
            if (e.key === 'F5') {
                e.preventDefault()
                const uncapped = toggleUncapped()
                console.log(`[FPS] Uncapped mode: ${uncapped ? 'ON (max FPS)' : 'OFF (vsync)'}`)
            }

            // Export profiler report (F4)
            if (e.key === 'F4') {
                e.preventDefault()
                if (profilerMetrics) {
                    // Generate report text
                    const m = profilerMetrics
                    let report = '=== PERFORMANCE REPORT ===\n\n'
                    report += `Timestamp: ${new Date().toLocaleString()}\n\n`
                    report += `--- Frame Statistics ---\n`
                    report += `FPS: ${m.fps.toFixed(1)} / 60\n`
                    report += `Frame Time: ${m.frameTime.toFixed(2)}ms / 16.67ms\n`
                    report += `Avg Frame Time: ${m.avgFrameTime.toFixed(2)}ms\n`
                    report += `Min/Max: ${m.minFrameTime.toFixed(2)}ms / ${m.maxFrameTime.toFixed(2)}ms\n\n`
                    report += `--- Entity Counts ---\n`
                    report += `Total: ${m.totalEntities} / 2250\n`
                    report += `Enemies: ${m.enemyCount}\n`
                    report += `Projectiles: ${m.projectileCount}\n`
                    report += `Particles: ${m.particleCount}\n`
                    report += `XP Gems: ${m.xpGemCount}\n\n`
                    report += `--- Render Statistics ---\n`
                    report += `Draw Calls: ${m.drawCalls}\n`
                    report += `Triangles: ${m.triangles.toLocaleString()}\n`
                    report += `Geometries: ${m.geometries}\n`
                    report += `Textures: ${m.textures}\n\n`
                    report += `--- Timing Breakdown ---\n`
                    report += `Update: ${m.updateTime.toFixed(2)}ms\n`
                    report += `Render: ${m.renderTime.toFixed(2)}ms\n`
                    report += `Entity Update: ${m.timings.entityUpdate.toFixed(2)}ms\n`
                    report += `Collision: ${m.timings.collisionDetection.toFixed(2)}ms\n`
                    report += `Particles: ${m.timings.particleSystem.toFixed(2)}ms\n`
                    report += `Billboard: ${m.timings.billboardUpdate.toFixed(2)}ms\n`
                    report += `Scene: ${m.timings.sceneRender.toFixed(2)}ms\n\n`
                    if (m.memoryUsageMB > 0) {
                        report += `--- Memory ---\n`
                        report += `Heap: ${m.memoryUsageMB.toFixed(1)}MB\n\n`
                    }
                    if (profilerWarnings.length > 0) {
                        report += `--- Warnings ---\n`
                        profilerWarnings.forEach(w => report += `${w}\n`)
                    }

                    // Log to console
                    console.log(report)
                    console.log('📊 Raw profiler data:', {
                        metrics: m,
                        fpsHistory,
                        warnings: profilerWarnings,
                    })

                    // Download as file
                    const blob = new Blob([report], { type: 'text/plain' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `performance-report-${Date.now()}.txt`
                    a.click()
                    URL.revokeObjectURL(url)

                    console.log('✅ Performance report exported')
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [profilerMetrics, profilerWarnings, fpsHistory, toggleUncapped])

    // Access Check
    useEffect(() => {
        const checkAccess = async () => {
            if (!user) {
                setIsCheckingAuth(false)
                setHasCompletedAuthCheck(false)
                return
            }

            setIsCheckingAuth(true)
            setHasCompletedAuthCheck(false)

            const hostname = typeof window !== "undefined" ? window.location.hostname : ""
            if (hostname === "localhost" || hostname === "127.0.0.1") {
                setIsAuthorized(true)
                setHasCompletedAuthCheck(true)
                setIsCheckingAuth(false)
                return
            }

            try {
                const response = await fetch("/api/game/check-access")
                const data = await response.json()
                if (data.success) {
                    setIsAuthorized(data.authorized)
                    setAuthReason(data.reason)
                }
                setHasCompletedAuthCheck(true)
                setIsCheckingAuth(false)
            } catch (err) {
                console.error("Access check failed:", err)
                setHasCompletedAuthCheck(true)
                setIsCheckingAuth(false)
            }
        }
        checkAccess()
    }, [user])

    // Prevent accidental reload during gameplay
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (gameState === "playing" || gameState === "paused" || gameState === "levelUp") {
                e.preventDefault()
                e.returnValue = ""
                return ""
            }
        }
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload)
    }, [gameState])

    return (
        <div className={`relative full-viewport overflow-hidden bg-[#1a1e1a] prevent-pull-refresh`}>
            {/* Header Card Removed */}

            <div className={`relative w-full h-full`}>
                <div ref={containerRef} className={`w-full h-full relative z-0`} style={{ touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none' }} />

                <HUD
                    isMobile={isMobile}
                    gameState={gameState}
                    playerHp={playerHp}
                    playerMaxHp={playerMaxHp}
                    playerLevel={playerLevel}
                    playerXp={playerXp}
                    playerXpTarget={playerXpTarget}
                    gameTime={gameTime}
                    kills={kills}
                    replaySpeed={replaySpeed}
                    upgrades={abilitySystemRef.current?.getUpgrades() ?? []}
                    showStats={showStats}
                    setShowStats={setShowStats}
                    setGameState={setGameState}
                    onReset={() => { resetGame(); setGameState("menu"); }}
                    playerStats={playerRef.current?.stats}
                    itemTemplates={itemTemplates}
                    statusEffects={playerRef.current?.statusEffects ?? []}
                    activeSynergies={activeSynergies}
                    difficultyMultiplier={difficultyMultiplier}
                    spawnSystem={spawnSystemRef.current}
                    entityManager={entityManagerRef.current}
                    waveNotification={waveNotification}
                />

                {/* Airdrop Direction Indicator */}
                {gameState === "playing" && playerRef.current && windowSize.width > 0 && (
                    <AirdropIndicator
                        airdrops={getActiveAirdrops()}
                        playerX={playerRef.current.position.x}
                        playerZ={playerRef.current.position.z}
                        screenWidth={windowSize.width}
                        screenHeight={windowSize.height}
                    />
                )}

                {/* Mobile Fullscreen Toggle */}
                {(gameState === "playing" || gameState === "paused" || gameState === "levelUp") && (
                    <div className={`absolute ${isMobile ? 'top-20 right-2' : 'top-24 right-4'} pointer-events-auto z-40 flex flex-col gap-2 items-end safe-area-inset-top safe-area-inset-right`}>
                        <Button onClick={handleToggleMute} size="icon" variant="ghost" className={`${isMobile ? 'h-14 w-14' : 'h-12 w-12'} touch-target rounded-xl bg-black/80 backdrop-blur-md border-2 border-white/20 hover:bg-white/10 hover:border-white/40 active:scale-95 transition-all shadow-lg`}>
                            {isMuted ? <VolumeX className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-white`} /> : <Volume2 className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} text-white`} />}
                        </Button>
                        {isLocalhost && (
                            <>
                                {isBotActive && (
                                    <div className="flex flex-col gap-1 bg-black/50 backdrop-blur-md p-2 rounded-xl border border-white/10 mb-2">
                                        <span className="text-[10px] text-white/50 font-mono uppercase text-center tracking-wider">Sim Speed</span>
                                        <div className="flex gap-1">
                                            {[1, 2, 4, 10].map(speed => (
                                                <Button
                                                    key={speed}
                                                    onClick={() => setGameSpeed(speed)}
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${gameSpeed === speed ? 'bg-primary text-primary-foreground shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/5 text-white hover:bg-white/20'}`}
                                                >
                                                    {speed}x
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <Button 
                                    onClick={() => {
                                        setIsBotActive(!isBotActive);
                                        if (!isBotActive) setGameSpeed(1); // Reset speed on activate? Or keep previous? Let's default 1 for safety.
                                    }} 
                                    size="icon" 
                                    variant="ghost" 
                                    className={`h-12 w-12 rounded-xl backdrop-blur-md border-2 border-white/20 transition-all shadow-lg ${isBotActive ? 'bg-green-500/80 text-black animate-pulse' : 'bg-black/80 text-white hover:bg-white/10'}`}
                                    title="Toggle Bot Mode"
                                >
                                    {isBotActive ? "BOT" : "MAN"}
                                </Button>
                            </>
                        )}
                        {isMobile && (
                        <Button onClick={toggleFullscreen} size="icon" variant="ghost" className="h-12 w-12 rounded-xl bg-black/80 backdrop-blur-md border-2 border-white/20 hover:bg-white/10 hover:border-white/40 transition-all shadow-lg">
                            {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
                        </Button>
                        )}
                    </div>
                )}

                {/* Mobile Controls */}
                {isMobile && (gameState === "playing" || gameState === "paused") && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-auto z-40 safe-area-inset-bottom">
                        <Button onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")} size="icon" className="h-16 w-16 touch-target rounded-2xl bg-black/90 backdrop-blur-md border-2 border-white/30 hover:bg-white/10 active:scale-95 text-white shadow-2xl">
                            {gameState === "paused" ? <Play className="w-7 h-7" /> : <Pause className="w-7 h-7" />}
                        </Button>
                        <Button
                            onClick={() => {
                                if (confirmReset) {
                                    resetGame();
                                    setGameState("menu");
                                    setConfirmReset(false);
                                } else {
                                    setConfirmReset(true);
                                    setTimeout(() => setConfirmReset(false), 3000);
                                }
                            }}
                            size="icon"
                            className={`h-16 w-16 touch-target rounded-2xl backdrop-blur-md border-2 hover:bg-white/10 active:scale-95 text-white shadow-2xl transition-all ${confirmReset ? 'bg-red-500/90 border-red-500 animate-pulse' : 'bg-black/90 border-white/30'}`}
                        >
                            {confirmReset ? <Check className="w-7 h-7" /> : <RotateCcw className="w-7 h-7" />}
                        </Button>
                    </div>
                )}

                {gameState === "menu" && (
                    <MainMenu
                        isMobile={isMobile}
                        selectedWorldId={selectedWorldId}
                        setSelectedWorldId={setSelectedWorldId}
                        worldStars={worldStars}
                        setGameState={setGameState}
                        audioManager={audioManagerRef.current}
                        isLocalhost={isLocalhost}
                        customLevels={customLevels}
                        onOpenLevelEditor={() => setLevelEditorOpen(true)}
                    />
                )}

                {gameState === "characterSelect" && (
                    <CharacterSelect
                        isMobile={isMobile}
                        characterData={characterData}
                        unlockedCharacters={unlockedCharacters}
                        selectedCharacterId={selectedCharacterId}
                        setSelectedCharacterId={setSelectedCharacterId}
                        setGameState={setGameState}
                        resetGame={resetGame}
                        selectedWorldId={selectedWorldId}
                        itemTemplates={itemTemplates}
                        audioManager={audioManagerRef.current}
                    />
                )}

                {gameState === "leaderboard" && (
                    <Leaderboard
                        scores={scores}
                        leaderboardWorldId={leaderboardWorldId}
                        setLeaderboardWorldId={setLeaderboardWorldId}
                        setGameState={setGameState}
                        characterData={characterData}
                        startReplay={startReplay}
                    />
                )}

                {gameState === "myHistory" && (
                    <History
                        userHistory={userHistory}
                        setGameState={setGameState}
                        characterData={characterData}
                        startReplay={startReplay}
                    />
                )}

                {gameState === "achievements" && (
                    <Achievements
                        isMobile={isMobile}
                        achievements={achievements}
                        onBack={() => setGameState("menu")}
                    />
                )}

                {gameState === "levelUp" && (
                    <LevelUp
                        key={choicesRefreshKey}
                        selectedWorldId={selectedWorldId}
                        playerLevel={playerLevel}
                        choices={levelUpChoices.current}
                        onChoose={handleUpgrade}
                        rerolls={playerRef.current?.stats.rerolls ?? 0}
                        onReroll={() => {
                            if (playerRef.current && playerRef.current.stats.rerolls > 0) {
                                playerRef.current.stats.rerolls--;
                                levelUpChoices.current = getLevelUpChoices();
                                handleUpgrade('REROLL_INTERNAL', false);
                                setGameState("playing");
                                setTimeout(() => setGameState("levelUp"), 10);
                            }
                        }}
                        audioManager={audioManagerRef.current}
                    />
                )}

                {gameState === "airdropLevelUp" && (
                    <LevelUp
                        key={`airdrop-${choicesRefreshKey}`}
                        selectedWorldId={selectedWorldId}
                        playerLevel={playerLevel}
                        choices={levelUpChoices.current}
                        onChoose={handleUpgrade}
                        rerolls={0}
                        onReroll={() => {}}
                        audioManager={audioManagerRef.current}
                        isAirdrop={true}
                    />
                )}

                {gameState === "paused" && (
                    <PauseMenu
                        isMobile={isMobile}
                        onResume={() => setGameState("playing")}
                        onRestart={() => { setTotalRuns(r => r + 1); resetGame(false); setGameState("playing"); }}
                        onMainMenu={() => { setTotalRuns(r => r + 1); resetGame(false); setGameState("menu"); }}
                        musicVolume={musicVolume}
                        sfxVolume={sfxVolume}
                        onMusicVolumeChange={handleMusicVolumeChange}
                        onSfxVolumeChange={handleSfxVolumeChange}
                    />
                )}

                {gameState === "gameOver" && (
                    <GameOver
                        isMobile={isMobile}
                        playerLevel={playerLevel}
                        gameTime={gameTime}
                        isNewHighScore={isNewHighScore}
                        onRestart={() => { setTotalRuns(r => r + 1); setIsNewHighScore(false); resetGame(false); setGameState("playing"); }}
                        onMainMenu={() => { setTotalRuns(r => r + 1); setIsNewHighScore(false); resetGame(false); setGameState("menu"); }}
                        kills={kills}
                        damageDealt={damageDealt}
                        damageTaken={damageTaken}
                    />
                )}

                {gameState === "gameVictory" && (
                    <Victory
                        isMobile={isMobile}
                        playerLevel={playerLevel}
                        gameTime={gameTime}
                        onContinue={() => {
                            if (allowPostVictoryRef) allowPostVictoryRef.current = true;
                            // Check if there's a pending level-up after victory
                            if (pendingLevelUpAfterVictoryRef && pendingLevelUpAfterVictoryRef.current) {
                                pendingLevelUpAfterVictoryRef.current = false;
                                setGameState("levelUp");
                            } else {
                                setGameState("playing");
                            }
                        }}
                        onRestart={() => { setTotalRuns(r => r + 1); resetGame(false); setGameState("playing"); }}
                        onMainMenu={() => { setTotalRuns(r => r + 1); resetGame(false); setGameState("menu"); }}
                        newHeroUnlocked={newHeroUnlocked}
                        earnedStars={playerLevel >= 30 ? 3 : playerLevel >= 20 ? 2 : 1}
                        kills={kills}
                        damageDealt={damageDealt}
                        damageTaken={damageTaken}
                    />
                )}

                {gameState === "replaying" && (
                    <ReplayControls
                        replayPaused={replayPaused}
                        setReplayPaused={setReplayPaused}
                        replaySpeed={replaySpeed}
                        setReplaySpeed={setReplaySpeed}
                        onExit={() => { resetGame(); setGameState("leaderboard"); }}
                        gameTime={gameTime}
                    />
                )}

                {hasCompletedAuthCheck && isAuthorized === false && (
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

                {(isCheckingAuth || (isAuthorized === null && user)) && (
                    <div className="absolute inset-0 bg-black flex items-center justify-center z-[100]">
                        <div className="flex flex-col items-center gap-6">
                            <Loader2 className="w-16 h-16 animate-spin text-primary" />
                            <span className="text-primary font-black uppercase tracking-[0.5em] animate-pulse">VERIFYING RELICS...</span>
                        </div>
                    </div>
                )}

                {/* Level Editor Debug Mode */}
                {isLocalhost && (
                    <LevelEditor
                        isVisible={levelEditorOpen}
                        onClose={async () => {
                            setLevelEditorOpen(false)
                            // Reload levels when editor closes to ensure main menu shows latest
                            const levels = await loadCustomLevels()
                            setCustomLevels(levels)
                            updateCustomLevelsCache(levels)
                        }}
                        onLevelsChanged={async () => {
                            // Reload custom levels when they are saved/deleted in the editor
                            const levels = await loadCustomLevels()
                            setCustomLevels(levels)
                            updateCustomLevelsCache(levels) // Update game engine cache
                        }}
                        onTestLevel={async (levelData) => {
                            console.log(`[LevelEditor] Testing level: "${levelData.name}" (${levelData.timeline?.length || 0} events, background: ${levelData.disableBackgroundSpawning ? 'OFF' : 'ON'})`)
                            // Reload custom levels to include the newly saved/updated level
                            const levels = await loadCustomLevels()
                            setCustomLevels(levels)
                            updateCustomLevelsCache(levels) // Update game engine cache
                            // Select this level
                            setSelectedWorldId(levelData.id)
                            setLevelEditorOpen(false)
                            setGameState('characterSelect')
                        }}
                    />
                )}

                {/* Performance Profiler Overlay */}
                {profilerMetrics && (
                    <PerformanceOverlay
                        metrics={profilerMetrics}
                        warnings={profilerWarnings}
                        fpsHistory={fpsHistory}
                        frameTimeHistory={[]}
                        entityCountHistory={[]}
                        gameStatsHistory={gameStatsHistory}
                        visible={profilerVisible}
                    />
                )}
            </div>
        </div>
    )
}