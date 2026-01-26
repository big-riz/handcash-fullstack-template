import { Button } from "@/components/ui/button"
import { RotateCcw, Trophy } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { WORLDS } from "@/components/game/data/worlds"
import { CharacterInfo } from "../types"
import { formatDateTime } from "@/lib/date-utils"

interface LeaderboardProps {
    scores: any[]
    leaderboardWorldId: string
    setLeaderboardWorldId: (id: string) => void
    setGameState: (state: any) => void
    characterData: CharacterInfo[]
    startReplay: (score: any) => void
}

export function Leaderboard({
    scores,
    leaderboardWorldId,
    setLeaderboardWorldId,
    setGameState,
    characterData,
    startReplay
}: LeaderboardProps) {
    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-6 md:p-12 z-50 animate-in fade-in duration-300">
            <div className="bg-black/80 backdrop-blur-md border-4 border-primary/20 p-6 md:p-12 rounded-[4rem] w-full max-w-6xl shadow-[0_0_80px_rgba(0,0,0,0.9)] ring-1 ring-white/10 relative overflow-hidden">
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

                <div className="max-h-[70vh] overflow-auto pr-6 custom-scrollbar relative z-10 w-full text-left overflow-x-auto">
                    {scores.filter(s => (s.worldId || 'dark_forest') === leaderboardWorldId).length > 0 ? (
                        (() => {
                            const world = WORLDS.find(w => w.id === leaderboardWorldId)
                            const completionLevel = world?.winValue || world?.maxLevel || 10
                            const sortedScores = [...scores]
                                .filter(s => (s.worldId || 'dark_forest') === leaderboardWorldId)
                                .sort((a, b) => {
                                    if (leaderboardWorldId === 'dark_forest' && world?.winCondition === 'level') {
                                        const aCompleted = a.level >= completionLevel
                                        const bCompleted = b.level >= completionLevel
                                        if (aCompleted && bCompleted) return a.time - b.time
                                        if (aCompleted !== bCompleted) return aCompleted ? -1 : 1
                                    }
                                    return b.level - a.level || b.time - a.time
                                })
                            return (
                                <div className="w-full min-w-[600px]">
                                    <table className="w-full text-left text-sm md:text-base border-separate border-spacing-y-2">
                                        <thead className="sticky top-0 bg-black/80 backdrop-blur-md">
                                            <tr className="text-xs uppercase tracking-[0.3em] text-white/40">
                                                <th className="py-3 px-4">Rank</th>
                                                <th className="py-3 px-4">Player</th>
                                                <th className="py-3 px-4">Character</th>
                                                <th className="py-3 px-4">Level</th>
                                                <th className="py-3 px-4">Final Time</th>
                                                <th className="py-3 px-4 text-right">Replay</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedScores.map((s, i) => {
                                                const char = characterData.find(c => c.id === s.characterId) || characterData[0]
                                                const timeLabel = `${Math.floor(s.time / 60)}:${(s.time % 60).toFixed(0).padStart(2, '0')}`
                                                return (
                                                    <tr key={i} className="bg-white/5 hover:bg-white/10 transition-colors">
                                                        <td className="py-4 px-4 font-black">
                                                            <span className={`${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : i === 2 ? 'text-amber-600' : 'text-white/60'} text-2xl`}>#{i + 1}</span>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative">
                                                                    <Avatar className="w-12 h-12 border-2 border-white/10 shadow-2xl">
                                                                        <AvatarImage src={s.avatarUrl} />
                                                                        <AvatarFallback className="bg-gradient-to-br from-white/10 to-white/5 font-black text-white">{s.name.charAt(0)}</AvatarFallback>
                                                                    </Avatar>
                                                                    {i < 3 && <Trophy className={`absolute -top-2 -left-2 w-6 h-6 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'} drop-shadow-lg`} />}
                                                                </div>
                                                                                                                                            <div className="flex flex-col">
                                                                                                                                                <span className="text-lg md:text-xl tracking-tighter text-white font-black uppercase">{s.name}</span>
                                                                                                                                                <div className="flex items-center gap-2">
                                                                                                                                                    {s.handle && <span className="text-xs text-primary/60 font-mono tracking-widest uppercase">@{s.handle}</span>}
                                                                                                                                                    <span className="text-[10px] text-white/30 font-mono uppercase">
                                                                                                                                                        {formatDateTime(s.createdAt)}
                                                                                                                                                    </span>
                                                                                                                                                </div>
                                                                                                                                            </div>                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative w-10 h-10 rounded-full bg-black border border-white/20 overflow-hidden shadow-lg" title={char.name}>
                                                                    <div className="absolute inset-0 w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(/sprites/${char.sprite}.png)` }} />
                                                                </div>
                                                                <span className="font-bold text-white/80 uppercase">{char.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-4 font-black text-primary">LVL {s.level}</td>
                                                        <td className="py-4 px-4 font-mono text-white/70">{timeLabel}</td>
                                                        <td className="py-4 px-4 text-right">
                                                            {s.seed && s.events ? (
                                                                <Button
                                                                    onClick={() => startReplay(s)}
                                                                    size="sm"
                                                                    className="h-10 px-4 bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-black text-xs font-black uppercase rounded-[2rem] border border-cyan-500/30 transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                                                                >
                                                                    Review
                                                                </Button>
                                                            ) : (
                                                                <span className="text-xs text-white/30 uppercase">N/A</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        })()
                    ) : (
                        <div className="py-20 text-center text-white/20 italic font-black uppercase tracking-[0.5em] text-2xl">No legends recorded yet...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
