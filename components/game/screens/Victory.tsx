import { Button } from "@/components/ui/button"
import { Trophy, Star, Skull, Zap, Shield, Heart, Sparkles } from "lucide-react"

interface VictoryProps {
    isMobile: boolean
    playerLevel: number
    gameTime: number
    onSaveScore?: () => void // Optional now if handled automatically
    onContinue: () => void
    onRestart: () => void
    onMainMenu: () => void
    newHeroUnlocked: string | null
    earnedStars: number
    kills?: number
    damageDealt?: number
    damageTaken?: number
}

export function Victory({
    isMobile,
    playerLevel,
    gameTime,
    onContinue,
    onRestart,
    onMainMenu,
    newHeroUnlocked,
    earnedStars,
    kills = 0,
    damageDealt = 0,
    damageTaken = 0
}: VictoryProps) {
    const dps = gameTime > 0 ? (damageDealt / gameTime).toFixed(0) : '0'
    return (
        <div className={`absolute inset-0 bg-gradient-to-br from-amber-950 via-orange-950 to-amber-950 backdrop-blur-xl flex flex-col items-center justify-center ${isMobile ? 'p-4 safe-area-inset-top safe-area-inset-bottom overflow-y-auto' : 'p-8'} z-50 animate-in fade-in zoom-in duration-700`} style={{ background: 'radial-gradient(circle, rgba(120,53,15,0.3) 0%, rgba(154,52,18,0.5) 50%, rgba(120,53,15,0.8) 100%)' }}>
            <div className={`bg-black/80 border-4 border-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.6)] ${isMobile ? 'p-5' : 'p-12 md:p-16'} ${isMobile ? 'rounded-[2.5rem]' : 'rounded-[4rem]'} flex flex-col items-center shadow-2xl max-w-4xl w-full relative`}>
                <Trophy className={`${isMobile ? 'w-16 h-16' : 'w-24 h-24'} text-yellow-400 ${isMobile ? 'mb-3' : 'mb-6'} animate-bounce drop-shadow-[0_0_30px_rgba(234,179,8,1)]`} />
                <h2 className={`${isMobile ? 'text-5xl' : 'text-6xl md:text-[8rem]'} font-black italic uppercase tracking-tighter text-white ${isMobile ? 'mb-3' : 'mb-4'} drop-shadow-[0_0_60px_rgba(255,255,255,0.8)] text-center leading-none`}>VICTORY</h2>

                <div className={`flex flex-col items-center gap-2 ${isMobile ? 'mb-6' : 'mb-12'}`}>
                    <div className={`text-white/40 font-black uppercase tracking-[0.3em] ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>
                        {playerLevel === 30 ? 'FINAL VICTORY' : 'MILESTONE REACHED'}
                    </div>
                    <div className={`${isMobile ? 'text-2xl' : 'text-4xl md:text-6xl'} text-yellow-400 font-black italic uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(234,179,8,0.8)] text-center`}>
                        {playerLevel === 30 ? 'LEGENDARY SURVIVAL' : `LEVEL ${playerLevel} CONQUERED`}
                    </div>

                    {/* Stars Display */}
                    <div className="flex gap-2 mt-4 mb-2">
                        {[1, 2, 3].map(star => (
                            <Star
                                key={star}
                                className={`${isMobile ? 'w-8 h-8' : 'w-12 h-12'} ${star <= earnedStars ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'} drop-shadow-lg`}
                            />
                        ))}
                    </div>

                    <div className={`${isMobile ? 'text-sm' : 'text-base md:text-lg'} text-white/60 font-mono mt-2`}>
                        {Math.floor(gameTime / 60)}m {(gameTime % 60).toFixed(0)}s - Level {playerLevel}
                        {playerLevel < 30 && <span className="text-primary ml-2">• Keep Going!</span>}
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

                    {newHeroUnlocked && (
                        <div className="mt-8 animate-in slide-in-from-bottom-4 duration-1000">
                            <div className="bg-primary/20 border border-primary/40 px-6 py-4 rounded-3xl flex flex-col items-center gap-2 shadow-[0_0_30px_rgba(255,100,0,0.2)]">
                                <span className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em]">Legendary Achievement</span>
                                <span className="text-white font-black text-xl italic uppercase tracking-tight">NEW HERO JOINED: <span className="text-primary">{newHeroUnlocked}</span></span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row flex-wrap'} ${isMobile ? 'gap-3' : 'gap-4 md:gap-6'} justify-center`}>
                    <Button onClick={onContinue} size="lg" className={`${isMobile ? 'h-16 px-8 text-base w-full touch-target' : 'h-20 md:h-24 px-8 md:px-12 text-lg md:text-2xl'} rounded-[2.5rem] bg-green-500 hover:bg-green-400 active:bg-green-600 text-black font-black uppercase tracking-wider md:tracking-widest shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all active:scale-95`}>
                        {playerLevel < 30 ? 'CONTINUE HUNT' : 'PUSH FURTHER'}
                    </Button>
                    <Button onClick={onRestart} size="lg" className={`${isMobile ? 'h-16 px-8 text-base w-full touch-target' : 'h-20 md:h-24 px-8 md:px-12 text-lg md:text-2xl'} rounded-[2.5rem] bg-yellow-400 text-black hover:bg-yellow-300 active:bg-yellow-500 font-black uppercase tracking-wider md:tracking-widest shadow-[0_0_30px_rgba(234,179,8,0.8)] transition-all active:scale-95`}>ANOTHER RUN</Button>
                    <Button onClick={onMainMenu} variant="outline" size="lg" className={`${isMobile ? 'h-16 px-8 text-base w-full touch-target' : 'h-20 md:h-24 px-8 md:px-12 text-lg md:text-2xl'} rounded-[2.5rem] bg-black/80 border-2 border-white/20 text-white hover:bg-black/90 active:bg-black/70 font-black uppercase tracking-wider md:tracking-widest transition-all active:scale-95`}>RETIRE</Button>
                </div>
            </div>
        </div>
    )
}
