import { Button } from "@/components/ui/button"
import { Clock, Play, Pause, RotateCcw, Sword, Shield, Heart, Circle, Zap, Cloud, Magnet, Gift, Trophy, Skull, Check, X, Sparkles, Users } from "lucide-react"
import { ItemIcon } from "@/components/game/ui/ItemIcon"
import { StatRow } from "@/components/game/ui/StatRow"
import { StatusBar } from "@/components/game/ui/StatusBar"
import { getItemInfo } from "@/components/game/utils/itemUtils"
import { ItemTemplate } from "@/lib/item-templates-storage"
import { StatusEffect } from "@/components/game/types"
import { useState, useEffect } from "react"
import { SpawnSystem } from "@/components/game/systems/SpawnSystem"
import { EntityManager } from "@/components/game/entities/EntityManager"

export interface ActiveSynergy {
    name: string
    description: string
}

interface HUDProps {
    isMobile: boolean
    gameState: string
    playerHp: number
    playerMaxHp: number
    playerLevel: number
    playerXp: number
    playerXpTarget: number
    gameTime: number
    kills: number
    replaySpeed: number
    upgrades: any[]
    showStats: boolean
    setShowStats: (show: boolean) => void
    setGameState: (state: any) => void
    onReset: () => void
    playerStats?: { // Optional because playerRef might be null initially
        damageMultiplier: number
        armor: number
        regen: number
        cooldownMultiplier: number
        areaMultiplier: number
        projectileSpeedMultiplier: number
        durationMultiplier: number
        amount: number
        moveSpeed: number
        magnet: number
        luck: number
        growth: number
        curse: number
        revivals: number
        rerolls: number
    }
    itemTemplates: ItemTemplate[]
    statusEffects?: StatusEffect[]
    activeSynergies?: ActiveSynergy[]
    difficultyMultiplier?: number
    spawnSystem?: SpawnSystem | null
    entityManager?: EntityManager | null
    waveNotification?: string | null
}

export function HUD({
    isMobile,
    gameState,
    playerHp,
    playerMaxHp,
    playerLevel,
    playerXp,
    playerXpTarget,
    gameTime,
    kills,
    replaySpeed,
    upgrades,
    showStats,
    setShowStats,
    setGameState,
    onReset,
    playerStats,
    itemTemplates,
    statusEffects = [],
    activeSynergies = [],
    difficultyMultiplier = 1.0,
    spawnSystem,
    entityManager,
    waveNotification
}: HUDProps) {
    const xpPercent = Math.min(100, (playerXp / playerXpTarget) * 100)
    const hpPercent = Math.min(100, (playerHp / playerMaxHp) * 100)

    // Enemy count
    const activeEnemies = entityManager?.enemies.filter(e => e.isActive).length ?? 0

    // Upcoming waves
    const upcomingWaves = spawnSystem?.getUpcomingWaves(999) ?? []
    const currentTime = spawnSystem?.getElapsedTime() ?? 0

    const [confirmReset, setConfirmReset] = useState(false)

    useEffect(() => {
        if (confirmReset) {
            const timer = setTimeout(() => setConfirmReset(false), 3000)
            return () => clearTimeout(timer)
        }
    }, [confirmReset])

    const handleResetClick = () => {
        if (confirmReset) {
            onReset()
            setConfirmReset(false)
        } else {
            setConfirmReset(true)
        }
    }

    return (
        <div className={`absolute inset-0 ${isMobile ? 'p-2' : 'p-6 md:p-10'} pointer-events-none z-30`}>
            {/* Wave Notification - Flavor Message */}
            {waveNotification && gameState === "playing" && (
                <div className={`absolute ${isMobile ? 'bottom-24' : 'bottom-14'} left-1/2 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-2 duration-500 z-50 pointer-events-none max-w-[80vw]`}>
                    <div className={`bg-black/80 backdrop-blur-md border border-white/15 ${isMobile ? 'px-4 py-2 rounded-lg' : 'px-6 py-3 rounded-xl'} shadow-[0_0_30px_rgba(0,0,0,0.5)]`}>
                        <p className={`${isMobile ? 'text-xs' : 'text-base'} font-bold italic text-amber-200/90 text-center`}>
                            {waveNotification}
                        </p>
                    </div>
                </div>
            )}

            {/* Status Bars and Clock Container */}
            <div className="flex justify-between items-start relative">
                {/* Left: XP and HP */}
                <div className={isMobile ? 'space-y-2' : 'space-y-6'}>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end px-2">
                            <span className={`text-cyan-400 font-black italic ${isMobile ? 'text-xs' : 'text-base'} uppercase tracking-widest drop-shadow-lg`}>Level {playerLevel}</span>
                            <span className={`text-white font-mono ${isMobile ? 'text-[10px]' : 'text-xs'} drop-shadow-md`}>{Math.floor(playerXp)} / {playerXpTarget} XP</span>
                        </div>
                        <div className={`${isMobile ? 'w-32 h-2' : 'w-80 h-4'} bg-black/80 rounded-full p-[3px] border-2 border-white/20 overflow-hidden shadow-2xl`}>
                            <div className="h-full bg-gradient-to-r from-teal-400 to-teal-200 rounded-full transition-all duration-150 shadow-[0_0_20px_rgba(45,212,191,1)]" style={{ width: `${xpPercent}%` }} />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-end px-2">
                            <span className={`text-red-500 font-black italic ${isMobile ? 'text-xs' : 'text-base'} uppercase tracking-widest drop-shadow-lg`}>Vitality</span>
                            <span className={`text-white font-mono ${isMobile ? 'text-[10px]' : 'text-xs'} drop-shadow-md`}>{Math.floor(playerHp)} / {playerMaxHp} HP</span>
                        </div>
                        <div className={`${isMobile ? 'w-32 h-2' : 'w-80 h-4'} bg-black/80 rounded-full p-[3px] border-2 border-white/20 overflow-hidden shadow-2xl`}>
                            <div className="h-full bg-gradient-to-r from-red-700 to-red-500 rounded-full transition-all duration-75 shadow-[0_0_20px_rgba(239,68,68,1)]" style={{ width: `${hpPercent}%` }} />
                        </div>
                        {/* Status Effects Bar */}
                        {statusEffects.length > 0 && (
                            <div className="mt-2">
                                <StatusBar statusEffects={statusEffects} isMobile={isMobile} />
                            </div>
                        )}
                    </div>

                    {/* Wave Queue Timeline */}
                    {upcomingWaves.length > 0 && gameState === "playing" && (
                        <div className={`absolute left-1/2 transform -translate-x-1/2 w-11/12 max-w-2xl ${isMobile ? 'top-40' : 'bottom-6'}`}>
                            {/* Timeline Line */}
                            <div className="relative h-1 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-full">
                                {/* Current Position Marker */}
                                <div className="absolute top-1/2 left-0 w-0.5 h-4 bg-green-500 transform -translate-y-1/2 rounded-full shadow-lg" />

                                {/* Wave Nodes */}
                                {upcomingWaves.map((wave, idx) => {
                                    const timeUntil = Math.max(0, wave.time - currentTime)
                                    // Fixed 75 second window for timeline (25% more than 60s)
                                    const maxTime = 75
                                    const position = Math.max(0, Math.min(100, (timeUntil / maxTime) * 100))

                                    // Only show waves within the 75s window
                                    if (timeUntil > maxTime) return null

                                    const isImminent = timeUntil < 5
                                    const isSoon = timeUntil < 15

                                    let nodeColor = 'bg-white/40'
                                    if (wave.isBoss) nodeColor = 'bg-purple-500'
                                    else if (wave.isElite) nodeColor = 'bg-orange-500'

                                    return (
                                        <div
                                            key={idx}
                                            className="group absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 cursor-pointer"
                                            style={{ left: `${position}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 border border-white/20 rounded px-2 py-1 text-center whitespace-nowrap text-[9px] pointer-events-none z-50">
                                                <div className="font-bold uppercase text-white/90">{wave.count}x {wave.enemyType.replace(/_/g, ' ')}</div>
                                                <div className="text-white/50 text-[8px]">
                                                    {timeUntil < 1 ? 'NOW' : timeUntil < 60 ? `${Math.ceil(timeUntil)}s` : `${Math.floor(timeUntil / 60)}m`}
                                                </div>
                                            </div>

                                            {/* Node */}
                                            <div className={`w-2.5 h-2.5 rounded-full ${nodeColor} shadow-lg transition-all group-hover:w-3.5 group-hover:h-3.5`} />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Centered Buff HUD */}
                <div className={`absolute ${isMobile ? 'top-16' : 'top-32'} left-1/2 -translate-x-1/2 flex flex-col items-center ${isMobile ? 'gap-1' : 'gap-3'} pointer-events-auto max-w-[90vw] px-2`}>
                    {/* Active Synergies */}
                    {activeSynergies.length > 0 && (
                        <div className={`flex flex-wrap justify-center ${isMobile ? 'gap-1 mb-1' : 'gap-2 mb-2'} relative`}>
                            {activeSynergies.map(synergy => (
                                <div
                                    key={synergy.name}
                                    className={`bg-gradient-to-r from-purple-600/80 to-pink-600/80 backdrop-blur-md border-2 border-purple-400/60 ${isMobile ? 'px-2 py-1 rounded-lg' : 'px-3 py-2 rounded-xl'} flex items-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] group relative`}
                                >
                                    <Sparkles className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-yellow-300 animate-pulse`} />
                                    <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-black text-white uppercase tracking-wider`}>
                                        {synergy.name}
                                    </span>
                                    {/* Tooltip */}
                                    <div className="absolute top-full mt-2 w-48 bg-black/95 backdrop-blur-sm border border-purple-400/60 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999] text-center shadow-2xl">
                                        <div className="text-purple-300 text-xs font-bold mb-1">{synergy.name}</div>
                                        <div className="text-white/80 text-[10px]">{synergy.description}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className={`flex flex-wrap justify-center ${isMobile ? 'gap-1' : 'gap-3'}`}>
                        {upgrades.map(item => {
                            const info = getItemInfo(item.id)
                            return (
                                <div key={item.id} className={`bg-black/60 backdrop-blur-md border border-white/20 ${isMobile ? 'p-1 rounded-lg' : 'p-2 rounded-xl'} flex flex-col items-center group relative shadow-2xl`}>
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
                                        <ItemIcon id={item.id} className={isMobile ? "w-4 h-4" : "w-6 h-6"} itemTemplates={itemTemplates} />
                                    </div>
                                    <div className={`absolute ${isMobile ? '-bottom-1 -right-1' : '-bottom-2 -right-2'} bg-primary text-black ${isMobile ? 'text-[8px] px-1' : 'text-[10px] px-1.5'} font-black rounded-full border border-black ring-2 ring-primary/20 shadow-lg`}>
                                        {item.level}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Center: Clock */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center gap-2">
                    <div className={`bg-black/80 backdrop-blur-2xl ${isMobile ? 'px-3 py-2 rounded-xl border-2' : 'px-8 py-4 rounded-[2rem] border-4'} border-cyan-500/40 text-cyan-400 font-black flex items-center ${isMobile ? 'gap-2' : 'gap-4'} shadow-[0_0_40px_rgba(34,211,238,0.4)] ring-1 ring-white/10 ${isMobile ? '' : 'scale-110'}`}>
                        <Clock className={`${isMobile ? 'w-4 h-4' : 'w-8 h-8'} animate-pulse text-cyan-400`} />
                        <span className={`${isMobile ? 'text-xl' : 'text-4xl'} tabular-nums italic drop-shadow-md`}>
                            {Math.floor(gameTime / 60)}:{(gameTime % 60).toFixed(0).padStart(2, '0')}
                        </span>
                        {gameState === "replaying" && replaySpeed > 1 && (
                            <div className="flex flex-col -gap-1 items-start leading-none opacity-80">
                                <span className="text-xs text-cyan-300 font-black uppercase tracking-tighter">SPEED</span>
                                <span className="text-xl text-cyan-200 font-black">{replaySpeed}x</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 border-l border-white/20 pl-4 ml-2">
                            <Skull className="w-5 h-5 text-red-500" />
                            <span className="text-xl text-white drop-shadow-md">{kills}</span>
                        </div>
                        <div className="flex items-center gap-1 border-l border-white/20 pl-4 ml-2">
                            <Users className="w-5 h-5 text-orange-400" />
                            <span className="text-xl text-white drop-shadow-md">{activeEnemies}</span>
                        </div>
                    </div>

                    {/* Difficulty Multiplier Indicator */}
                    {difficultyMultiplier !== 1.0 && (
                        <div className={`bg-black/90 backdrop-blur-xl ${isMobile ? 'px-2 py-1 rounded-lg border' : 'px-4 py-2 rounded-xl border-2'} ${
                            difficultyMultiplier > 1.0
                                ? 'border-red-500/60 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                                : 'border-green-500/60 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                        } flex items-center ${isMobile ? 'gap-1' : 'gap-2'} font-black animate-in slide-in-from-top duration-500`}>
                            <Trophy className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${difficultyMultiplier > 1.0 ? 'text-red-400' : 'text-green-400'}`} />
                            <span className={`${isMobile ? 'text-xs' : 'text-sm'} uppercase tracking-wider`}>
                                {difficultyMultiplier > 1.0 ? 'HARDER' : 'EASIER'}
                            </span>
                            <span className={`${isMobile ? 'text-sm' : 'text-lg'} tabular-nums`}>
                                {Math.abs((difficultyMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Right: Spacer for balance / Stats Toggle */}
                <div className={`${isMobile ? 'w-auto' : 'w-80'} flex justify-end items-start gap-2 pointer-events-auto`}>
                    {(gameState === "playing" || gameState === "paused") && !isMobile && (
                        <>
                            <Button onClick={() => setGameState(gameState === "paused" ? "playing" : "paused")} variant="outline" size="icon" className="h-10 w-10 bg-black/60 border-white/20 hover:bg-white/10 text-white backdrop-blur-md">
                                {gameState === "paused" ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                            </Button>
                            <Button 
                                onClick={handleResetClick} 
                                variant={confirmReset ? "destructive" : "ghost"} 
                                size="icon" 
                                className={`h-10 w-10 bg-black/60 border-white/20 border hover:bg-white/10 text-white backdrop-blur-md transition-all ${confirmReset ? 'bg-red-500/80 hover:bg-red-600 border-red-500' : ''}`}
                            >
                                {confirmReset ? <Check className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                            </Button>
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

            {/* RPG Stat Sheet Panel - Responsive */}
            {(gameState === "playing" || gameState === "paused" || gameState === "replaying") && showStats && playerStats && (
                <div className={`absolute ${isMobile ? 'inset-x-4 bottom-6 pb-6 safe-area-inset-bottom max-h-[60vh] overflow-y-auto' : 'top-32 right-4 w-72'} bg-black/90 backdrop-blur-xl border ${isMobile ? 'border-2' : 'border'} border-white/20 ${isMobile ? 'rounded-2xl p-4' : 'rounded-xl p-4'} shadow-2xl z-40 pointer-events-auto scrollbar-hide`}>
                    <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-2">
                        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-black italic uppercase text-white`}>Hunter Stats</h3>
                        {isMobile && (
                            <Button onClick={() => setShowStats(false)} size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                    <div className={`space-y-2 ${isMobile ? 'text-xs' : 'text-sm'} font-mono`}>
                        <StatRow label="Might" value={`${Math.round(playerStats.damageMultiplier * 100)}%`} icon={<Sword className="w-4 h-4 text-red-400" />} />
                        <StatRow label="Armor" value={playerStats.armor.toFixed(0)} icon={<Shield className="w-4 h-4 text-gray-400" />} />
                        <StatRow label="Max Health" value={playerMaxHp.toFixed(0)} icon={<Heart className="w-4 h-4 text-red-600" />} />
                        <StatRow label="Recovery" value={`${playerStats.regen.toFixed(1)}/s`} icon={<Heart className="w-4 h-4 text-pink-400" />} />
                        <StatRow label="Cooldown" value={`${Math.round((1 - playerStats.cooldownMultiplier) * 100)}%`} icon={<Clock className="w-4 h-4 text-blue-400" />} />
                        <StatRow label="Area" value={`${Math.round(playerStats.areaMultiplier * 100)}%`} icon={<Circle className="w-4 h-4 text-purple-400" />} />
                        <StatRow label="Speed" value={`${Math.round(playerStats.projectileSpeedMultiplier * 100)}%`} icon={<Zap className="w-4 h-4 text-yellow-400" />} />
                        <StatRow label="Duration" value={`${Math.round(playerStats.durationMultiplier * 100)}%`} icon={<Clock className="w-4 h-4 text-green-400" />} />
                        <StatRow label="Amount" value={`+${playerStats.amount}`} icon={<Cloud className="w-4 h-4 text-white" />} />
                        <StatRow label="MoveSpeed" value={playerStats.moveSpeed.toFixed(1)} icon={<Zap className="w-4 h-4 text-cyan-400" />} />
                        <StatRow label="Magnet" value={playerStats.magnet.toFixed(1)} icon={<Magnet className="w-4 h-4 text-blue-300" />} />
                        <StatRow label="Luck" value={`${Math.round(playerStats.luck * 100)}%`} icon={<Gift className="w-4 h-4 text-emerald-400" />} />
                        <StatRow label="Growth" value={`${Math.round(playerStats.growth * 100)}%`} icon={<Trophy className="w-4 h-4 text-amber-300" />} />
                        <StatRow label="Curse" value={`${Math.round(playerStats.curse * 100)}%`} icon={<Skull className="w-4 h-4 text-purple-900" />} />
                        <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-1 text-center text-xs">
                            <div className="flex flex-col items-center"><span className="text-white/50">Revivals</span><span>{playerStats.revivals}</span></div>
                            <div className="flex flex-col items-center"><span className="text-white/50">Rerolls</span><span>{playerStats.rerolls}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
