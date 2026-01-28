import React, { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Star, Plus, Wrench, Skull, Play, Trophy, Clock, Map, Settings } from "lucide-react"
import { WORLDS } from "@/components/game/data/worlds"
import { AudioManager } from "../core/AudioManager"
import { CustomLevelData } from "../debug/LevelEditor"

interface TestMenuProps {
    isMobile: boolean
    selectedWorldId: string
    setSelectedWorldId: (id: string) => void
    worldStars: Record<string, number>
    setGameState: (state: any) => void
    audioManager: AudioManager | null
    isLocalhost?: boolean
    customLevels?: CustomLevelData[]
    onOpenLevelEditor?: () => void
}

export function MainMenu({
    isMobile,
    selectedWorldId,
    setSelectedWorldId,
    worldStars,
    setGameState,
    audioManager,
    isLocalhost,
    customLevels = [],
    onOpenLevelEditor
}: TestMenuProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const playHover = () => audioManager?.playUIHover();
    const playSelect = () => audioManager?.playUISelect();

    // Combine default worlds and custom levels, sorted by difficulty
    const allWorlds = [...WORLDS, ...customLevels].sort((a, b) =>
        a.difficultyMultiplier - b.difficultyMultiplier
    );

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop += e.deltaY;
        }
    };

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-2">Slavic Survivors</h1>
                <p className="text-primary font-black tracking-[0.3em] uppercase text-xs animate-pulse">Select Your Destination</p>
            </div>

            {/* World Selection - Centered Verbose List */}
            <div className="relative w-full max-w-4xl mb-12">
                {/* Create Level Button - Top Left */}
                <div className="absolute -top-16 left-0 z-40">
                    <div
                        onClick={() => { playSelect(); onOpenLevelEditor(); }}
                        onMouseEnter={playHover}
                        className="flex items-center gap-3 px-4 py-2 border-2 border-dashed rounded-xl transition-all group hover:scale-105 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/40 hover:border-purple-400 cursor-pointer"
                    >
                        <Plus className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-300 font-bold uppercase text-xs tracking-wider">Create Custom World</span>
                    </div>
                </div>

                {/* Verbose Centered World Cards */}
                <div className="relative">
                    <div
                        ref={scrollContainerRef}
                        onWheel={handleWheel}
                        className="flex flex-col items-center gap-4 px-4 max-h-[70vh] sm:max-h-[600px] overflow-y-auto w-full custom-scrollbar py-4 pr-2 scroll-smooth">
                        {allWorlds.map(world => {
                            const isCustom = !WORLDS.find(w => w.id === world.id);
                            const isSelected = selectedWorldId === world.id;

                            return (
                                <div
                                    key={world.id}
                                    onClick={() => { playSelect(); setSelectedWorldId(world.id); }}
                                    onMouseEnter={playHover}
                                    className={`
                                        cursor-pointer border-2 rounded-2xl p-6 transition-all relative group
                                        flex flex-col md:flex-row items-center gap-6 w-full max-w-2xl
                                        ${isSelected
                                            ? 'bg-indigo-600/30 border-primary shadow-[0_0_30px_rgba(74,222,128,0.1)]'
                                            : 'bg-slate-800/40 border-white/10 hover:border-white/30 hover:bg-slate-800/60'
                                        }
                                    `}
                                >
                                    {/* Selected Indicator Glow */}
                                    {isSelected && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none z-0 rounded-2xl" />
                                    )}

                                    {/* Icon/Visual Side */}
                                    <div className="flex-shrink-0 w-24 h-24 rounded-2xl bg-black/40 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform relative z-10">
                                        {isCustom ? (
                                            <Wrench className="w-10 h-10 text-purple-400 opacity-80" />
                                        ) : (
                                            <Map className="w-10 h-10 text-indigo-400 opacity-80" />
                                        )}

                                        {/* Level Badge */}
                                        <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-white/20 px-2 py-0.5 rounded text-[10px] font-mono text-white/60">
                                            LVL {world.maxLevel}
                                        </div>
                                    </div>

                                    {/* Content Side */}
                                    <div className="flex-1 text-center md:text-left relative z-10">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                            <h3 className="font-black italic uppercase text-2xl text-white leading-tight tracking-tight group-hover:text-primary transition-colors">
                                                {world.name}
                                            </h3>
                                            <div className="flex justify-center md:justify-start gap-0.5">
                                                {[1, 2, 3, 4, 5].map(star => (
                                                    <Skull
                                                        key={star}
                                                        className={`w-3.5 h-3.5 ${star <= Math.ceil(world.difficultyMultiplier) ? 'text-red-500 fill-red-500/20' : 'text-white/10'}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <p className="text-sm text-white/50 mb-4 line-clamp-2 italic">
                                            {world.description || "A challenging world for seasoned survivors."}
                                        </p>

                                        {/* Footer Stats */}
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-lg border border-white/5">
                                                <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                                                <span className="text-[10px] font-bold text-white/70 uppercase">Survivor Mode</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-lg border border-white/5">
                                                <Clock className="w-3.5 h-3.5 text-cyan-500" />
                                                <span className="text-[10px] font-bold text-white/70 uppercase">Infinite</span>
                                            </div>
                                            <div className="flex items-center gap-2 px-3 py-1 bg-black/30 rounded-lg border border-white/5">
                                                <Settings className="w-3.5 h-3.5 text-purple-500" />
                                                <span className="text-[10px] font-bold text-white/70 uppercase">Difficulty x{world.difficultyMultiplier}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Play Button Interaction */}
                                    <div className={`
                                        flex-shrink-0 transition-all duration-300 relative z-10
                                        ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-50'}
                                    `}>
                                        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-black">
                                            <Play className="w-6 h-6 fill-current" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {/* Scroll Fade Indicator */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none rounded-b-2xl" />
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
                <Button onClick={() => { playSelect(); setGameState("characterSelect"); }} onMouseEnter={playHover} size="lg" className="h-[90px] px-16 text-3xl font-black rounded-[2.5rem] shadow-green-500/40 shadow-[0_0_60px_rgba(74,222,128,0.2)] bg-green-500 text-black hover:bg-green-400 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.1em] w-full">
                    Select Hero
                </Button>
                <Button onClick={() => { playSelect(); setGameState("leaderboard"); }} onMouseEnter={playHover} variant="outline" size="lg" className="h-[90px] px-16 text-3xl font-black rounded-[2.5rem] border-4 border-white/20 hover:border-white text-white hover:bg-white/10 active:scale-95 transition-all uppercase tracking-[0.1em] w-full">
                    Legends
                </Button>
            </div>
        </div>
    )
}