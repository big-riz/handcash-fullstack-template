import { Button } from "@/components/ui/button"
import { Skull, Zap, Shield, Heart, Sparkles } from "lucide-react"

interface GameOverProps {
    isMobile: boolean
    playerLevel: number
    gameTime: number
    showScoreInput: boolean
    playerName: string
    setPlayerName: (name: string | ((prev: string) => string)) => void
    onSaveScore: () => void
    onRestart: () => void
    onMainMenu: () => void
    kills?: number
    damageDealt?: number
    damageTaken?: number
}

export function GameOver({
    isMobile,
    playerLevel,
    gameTime,
    showScoreInput,
    playerName,
    setPlayerName,
    onSaveScore,
    onRestart,
    onMainMenu,
    kills = 0,
    damageDealt = 0,
    damageTaken = 0
}: GameOverProps) {
    const dps = gameTime > 0 ? (damageDealt / gameTime).toFixed(0) : '0'
    return (
        <div className={`absolute inset-0 bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center ${isMobile ? 'p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto' : 'p-8'} z-50 animate-in fade-in zoom-in duration-500`}>
            <div className={`bg-black/60 border-4 border-red-500/30 ${isMobile ? 'p-5' : 'p-12 md:p-16'} ${isMobile ? 'rounded-[2.5rem]' : 'rounded-[4rem]'} flex flex-col items-center shadow-2xl ring-2 ring-red-500/10 max-w-4xl w-full`}>
                <h2 className={`${isMobile ? 'text-5xl' : 'text-6xl md:text-[8rem]'} font-black italic uppercase tracking-tighter text-white ${isMobile ? 'mb-3' : 'mb-4'} drop-shadow-[0_0_60px_rgba(220,38,38,1)] text-center leading-none`}>FALLEN</h2>

                {!showScoreInput ? (
                    <>
                        <div className={`flex flex-col items-center gap-2 ${isMobile ? 'mb-6' : 'mb-12'}`}>
                            <div className={`text-white/40 font-black uppercase tracking-[0.3em] ${isMobile ? 'text-xs' : 'text-sm'}`}>Final Accomplishment</div>
                            <div className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-6xl'} text-cyan-400 font-black italic uppercase tracking-tighter`}>Level {playerLevel} Survival</div>
                            <div className="flex items-center gap-4 mt-2">
                                <div className={`${isMobile ? 'text-base' : 'text-xl'} text-white/60 font-mono`}>{Math.floor(gameTime / 60)}m {(gameTime % 60).toFixed(0)}s on the clock</div>
                            </div>

                            {/* Stats Breakdown */}
                            <div className={`grid grid-cols-2 gap-3 mt-6 w-full max-w-md ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                                    <Skull className="w-5 h-5 text-red-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-[10px] uppercase font-black">Eliminated</span>
                                        <span className="text-white font-black text-lg">{kills.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-yellow-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-[10px] uppercase font-black">DPS</span>
                                        <span className="text-white font-black text-lg">{dps}</span>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-400" />
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-[10px] uppercase font-black">Damage Dealt</span>
                                        <span className="text-white font-black text-lg">{damageDealt.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-red-500" />
                                    <div className="flex flex-col">
                                        <span className="text-white/40 text-[10px] uppercase font-black">Damage Taken</span>
                                        <span className="text-white font-black text-lg">{damageTaken.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                        </div>
                        <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} ${isMobile ? 'gap-3' : 'gap-6 md:gap-10'}`}>
                            <Button onClick={onRestart} size="lg" className={`${isMobile ? 'h-16 px-8 text-lg w-full touch-target' : 'h-20 md:h-24 px-12 md:px-20 text-xl md:text-3xl'} rounded-[2.5rem] bg-white text-black hover:bg-white/90 font-black uppercase tracking-wider md:tracking-widest shadow-white/30 shadow-2xl transition-all active:scale-95`}>TRY AGAIN</Button>
                            <Button onClick={onMainMenu} variant="outline" size="lg" className={`${isMobile ? 'h-16 px-8 text-lg w-full touch-target' : 'h-20 md:h-24 px-12 md:px-20 text-xl md:text-3xl'} rounded-[2.5rem] bg-white/5 border-white/20 text-white hover:bg-white/10 active:bg-white/5 font-black uppercase tracking-wider md:tracking-widest transition-all active:scale-95`}>BACK</Button>
                        </div>
                    </>
                ) : (
                    <div className={`flex flex-col items-center ${isMobile ? 'gap-4' : 'gap-8'} w-full`}>
                        <div className="text-center">
                            <h3 className={`${isMobile ? 'text-2xl' : 'text-3xl md:text-5xl'} font-black italic uppercase text-primary animate-bounce mb-2`}>NEW HIGH SCORE!</h3>
                            <p className={`text-white/60 font-black uppercase tracking-[0.2em] ${isMobile ? 'text-xs' : 'text-sm'}`}>Enter your initials for the Hall of Heroes</p>
                        </div>

                        <div className={`flex ${isMobile ? 'gap-2' : 'gap-4'}`}>
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className={`${isMobile ? 'w-14 h-16 text-4xl' : 'w-20 h-24 text-6xl'} bg-black/80 border-4 border-primary/50 rounded-2xl flex items-center justify-center font-black text-white italic drop-shadow-[0_0_20px_rgba(255,100,0,0.5)] shadow-inner`}>
                                    {playerName[i] || "_"}
                                </div>
                            ))}
                        </div>

                        <input
                            autoFocus
                            maxLength={4}
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            onKeyDown={(e) => e.key === 'Enter' && playerName.length === 4 && onSaveScore()}
                            className="absolute opacity-0 pointer-events-none"
                        />

                        <div className={`grid ${isMobile ? 'grid-cols-6' : 'grid-cols-6 md:grid-cols-9'} ${isMobile ? 'gap-1.5' : 'gap-2'} max-w-2xl w-full pointer-events-auto`}>
                            {"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("").map(char => (
                                <Button
                                    key={char}
                                    variant="outline"
                                    onClick={() => { if (playerName.length < 4) setPlayerName(prev => prev + char) }}
                                    className={`${isMobile ? 'h-10 min-w-0 text-base touch-target' : 'h-12 w-12 text-xl'} font-black bg-white/5 border-white/10 hover:bg-primary hover:text-black active:scale-95 transition-all`}
                                >
                                    {char}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                onClick={() => setPlayerName(prev => prev.slice(0, -1))}
                                className={`${isMobile ? 'h-10 touch-target' : 'h-12'} col-span-2 font-black text-xs bg-red-500/20 border-red-500/30 hover:bg-red-500 active:scale-95 uppercase tracking-tighter`}
                            >
                                Del
                            </Button>
                            <Button
                                disabled={playerName.length !== 4}
                                onClick={onSaveScore}
                                className={`${isMobile ? 'h-10 touch-target' : 'h-12'} col-span-3 font-black text-sm bg-primary text-black hover:bg-primary/80 active:scale-95 uppercase tracking-widest disabled:opacity-30 transition-all`}
                            >
                                Confirm
                            </Button>
                        </div>
                        <div className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} text-white/30 font-bold uppercase tracking-widest mt-4`}>Tip: You can use your keyboard!</div>
                    </div>
                )}
            </div>
        </div>
    )
}
