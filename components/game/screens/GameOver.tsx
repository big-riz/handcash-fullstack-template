import { Button } from "@/components/ui/button"
import { Skull, Zap, Shield, Heart, Trophy } from "lucide-react"

interface GameOverProps {
    isMobile: boolean
    playerLevel: number
    gameTime: number
    isNewHighScore?: boolean
    onRestart: () => void
    onMainMenu: () => void
    kills?: number
    damageDealt?: number
    damageTaken?: number
    killedBy?: { type: string; isBoss: boolean; isElite: boolean } | null
}

function formatKillerName(source: { type: string; isBoss: boolean; isElite: boolean }): string {
    const prefix = source.isBoss ? '' : source.isElite ? 'Elite ' : ''
    const name = source.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return `${prefix}${name}`
}

export function GameOver({
    isMobile,
    playerLevel,
    gameTime,
    isNewHighScore = false,
    onRestart,
    onMainMenu,
    kills = 0,
    damageDealt = 0,
    damageTaken = 0,
    killedBy
}: GameOverProps) {
    const dps = gameTime > 0 ? (damageDealt / gameTime).toFixed(0) : '0'
    return (
        <div className={`absolute inset-0 bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center ${isMobile ? 'p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto' : 'p-8'} z-50 animate-in fade-in zoom-in duration-500`}>
            <div className={`bg-black/60 border-4 border-red-500/30 ${isMobile ? 'p-5' : 'p-12 md:p-16'} ${isMobile ? 'rounded-[2.5rem]' : 'rounded-[4rem]'} flex flex-col items-center shadow-2xl ring-2 ring-red-500/10 max-w-4xl w-full`}>
                <h2 className={`${isMobile ? 'text-5xl' : 'text-6xl md:text-[8rem]'} font-black italic uppercase tracking-tighter text-white ${isMobile ? 'mb-3' : 'mb-4'} drop-shadow-[0_0_60px_rgba(220,38,38,1)] text-center leading-none`}>FALLEN</h2>

                {killedBy && (
                    <div className={`flex items-center gap-2 ${isMobile ? 'mb-3' : 'mb-4'}`}>
                        <Skull className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} text-red-400`} />
                        <span className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold uppercase tracking-wider text-red-300/90`}>
                            Slain by {formatKillerName(killedBy)}
                        </span>
                    </div>
                )}

                {isNewHighScore && (
                    <div className="flex items-center gap-2 mb-4 animate-bounce">
                        <Trophy className="w-6 h-6 text-yellow-400" />
                        <span className={`${isMobile ? 'text-xl' : 'text-2xl'} font-black italic uppercase text-yellow-400`}>New High Score!</span>
                        <Trophy className="w-6 h-6 text-yellow-400" />
                    </div>
                )}

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
            </div>
        </div>
    )
}
