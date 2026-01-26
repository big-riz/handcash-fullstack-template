import { Button } from "@/components/ui/button"
import { Star } from "lucide-react"
import { WORLDS } from "@/components/game/data/worlds"
import { AudioManager } from "../core/AudioManager"

interface MainMenuProps {
    isMobile: boolean
    selectedWorldId: string
    setSelectedWorldId: (id: string) => void
    worldStars: Record<string, number>
    setGameState: (state: any) => void
    audioManager: AudioManager | null
}

export function MainMenu({
    isMobile,
    selectedWorldId,
    setSelectedWorldId,
    worldStars,
    setGameState,
    audioManager
}: MainMenuProps) {
    const playHover = () => audioManager?.playUIHover();
    const playSelect = () => audioManager?.playUISelect();
    return (
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center ${isMobile ? 'justify-start pt-8 safe-area-inset-top' : 'justify-center'} ${isMobile ? 'p-4' : 'p-8'} z-50 animate-in fade-in duration-500 overflow-y-auto scrollbar-hide`}>
            <div className={`${isMobile ? 'mb-4' : 'mb-12'} text-center`}>
                <h1 className={`${isMobile ? 'text-3xl' : 'text-6xl md:text-9xl'} font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] mb-2`}>Slavic Survivors</h1>
                <p className={`text-primary font-black tracking-[0.3em] uppercase ${isMobile ? 'text-[9px]' : 'text-xs md:text-base'} animate-pulse`}>Select Your Destination</p>
            </div>

            {/* World Selection */}
            <div className={`flex ${isMobile ? 'gap-3 mb-6' : 'gap-6 mb-16'} overflow-x-auto max-w-full ${isMobile ? 'p-2' : 'p-4'} snap-x smooth-scroll scrollbar-hide`}>
                {WORLDS.map(world => (
                    <div
                        key={world.id}
                        onClick={() => { playSelect(); setSelectedWorldId(world.id); }}
                        onMouseEnter={playHover}
                        className={`cursor-pointer border-4 rounded-[2rem] ${isMobile ? 'p-4 w-64' : 'p-8 w-80 md:w-96'} transition-all relative overflow-hidden group hover:scale-105 shrink-0 snap-center
                                        ${selectedWorldId === world.id
                                ? 'border-green-400 bg-green-400/10 scale-105 shadow-[0_0_50px_rgba(74,222,128,0.3)]'
                                : 'border-white/10 bg-black/40 hover:border-white/40 grayscale hover:grayscale-0'}`}
                    >
                        <div className={`absolute top-0 right-0 ${isMobile ? 'p-2' : 'p-4'} opacity-50 text-[10px] font-mono border-b border-l border-white/20 rounded-bl-xl`}>ID: {world.id.toUpperCase()}</div>

                        {/* Star Rating */}
                        <div className="flex gap-1 mb-2 mt-4 ml-1">
                            {[1, 2, 3].map(star => (
                                <Star
                                    key={star}
                                    className={`w-4 h-4 ${star <= (worldStars[world.id] || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                                />
                            ))}
                        </div>

                        <h3 className={`font-black italic uppercase ${isMobile ? 'text-2xl mb-2' : 'text-3xl mb-4'} text-white leading-none mt-2`}>{world.name}</h3>
                        <p className={`${isMobile ? 'text-xs' : 'text-sm'} uppercase font-bold text-white/50 ${isMobile ? 'mb-4 h-8' : 'mb-8 h-12'} leading-relaxed`}>{world.description}</p>

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

            <div className={`flex flex-col md:flex-row ${isMobile ? 'gap-3 w-full px-4 pb-6 safe-area-inset-bottom' : 'gap-6'}`}>
                <Button onClick={() => { playSelect(); setGameState("characterSelect"); }} onMouseEnter={playHover} size="lg" className={`${isMobile ? 'h-16 px-10 text-xl touch-target' : 'h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl'} font-black rounded-[2.5rem] shadow-green-500/40 shadow-[0_0_60px_rgba(74,222,128,0.2)] bg-green-500 text-black hover:bg-green-400 hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.1em] w-full md:w-auto`}>
                    Select Hero
                </Button>
                <Button onClick={() => { playSelect(); setGameState("leaderboard"); }} onMouseEnter={playHover} variant="outline" size="lg" className={`${isMobile ? 'h-14 px-8 text-lg touch-target' : 'h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl'} font-black rounded-[2.5rem] border-4 border-white/20 hover:border-white hover:bg-white/10 text-white hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.1em] w-full md:w-auto`}>
                    Legends
                </Button>
                <Button onClick={() => { playSelect(); setGameState("myHistory"); }} onMouseEnter={playHover} variant="outline" size="lg" className={`${isMobile ? 'h-14 px-8 text-lg touch-target' : 'h-[90px] md:h-[110px] px-16 md:px-20 text-3xl md:text-4xl'} font-black rounded-[2.5rem] border-4 border-cyan-500/20 hover:border-cyan-500 hover:bg-cyan-500/10 text-white hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.1em] w-full md:w-auto`}>
                    My History
                </Button>
            </div>
        </div>
    )
}
