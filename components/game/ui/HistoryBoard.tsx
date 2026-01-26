import React from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Trophy } from 'lucide-react'
import { WORLDS } from '../data/worlds'
import characters from '../data/characters'
import { CharacterInfo } from '../types'
import { formatDateTime } from '@/lib/date-utils'

interface HistoryBoardProps {
    userHistory: any[]
    setGameState: (state: any) => void
    startReplay: (score: any) => void
}

export function HistoryBoard({
    userHistory,
    setGameState,
    startReplay
}: HistoryBoardProps) {
    const characterData = characters as unknown as CharacterInfo[]

    return (
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
                                            {s.level >= world.maxLevel && <Trophy className="w-8 h-8 text-yellow-500 drop-shadow-lg" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-2xl md:text-3xl tracking-tighter text-white font-black uppercase group-hover:text-cyan-400 transition-colors leading-tight">{char.name}</span>
                                            <span className="text-[10px] md:text-xs text-white/40 font-mono tracking-widest uppercase mt-1 italic">{world.name} • {formatDateTime(s.createdAt)}</span>
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
    )
}
