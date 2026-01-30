import React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Clock, Trophy, Sword, Globe, Calendar, User, ArrowLeft, Loader2 } from "lucide-react"
import { useGameReplays, GameReplay } from "@/hooks/use-game-replays"
import { useAuth } from "@/lib/auth-context"

interface GameHistoryProps {
    onBack: () => void
    audioManager?: any
}

export function GameHistory({ onBack, audioManager }: GameHistoryProps) {
    const { user, isAuthenticated } = useAuth()
    const { replays, isLoading, error } = useGameReplays(user?.publicProfile?.handle, 20)

    const playHover = () => audioManager?.playUIHover();
    const playSelect = () => audioManager?.playUISelect();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    if (!isAuthenticated) {
        return (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 z-50">
                <div className="text-center max-w-md">
                    <h2 className="text-4xl font-black italic uppercase mb-4">Login Required</h2>
                    <p className="text-white/60 mb-8">Please login to view your game history</p>
                    <Button onClick={onBack} onMouseEnter={playHover} className="text-lg">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Menu
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col z-50">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <Button 
                        onClick={() => { playSelect(); onBack(); }} 
                        onMouseEnter={playHover}
                        variant="outline" 
                        size="lg"
                        className="border-2 border-white/20 hover:border-white hover:bg-white/10"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    
                    <div className="text-center">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Game History</h1>
                        <p className="text-white/60 text-sm mt-1">Your recent runs and achievements</p>
                    </div>

                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="w-12 h-12 animate-spin text-primary/50 mb-4" />
                            <p className="text-white/60 font-mono animate-pulse uppercase tracking-widest">Loading History...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-20">
                            <p className="text-red-400 mb-4">Failed to load game history</p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    ) : replays.length === 0 ? (
                        <div className="text-center py-20">
                            <Trophy className="w-16 h-16 text-white/20 mx-auto mb-4" />
                            <h3 className="text-2xl font-black uppercase mb-2">No Games Yet</h3>
                            <p className="text-white/60 mb-6">Start playing to see your game history here</p>
                            <Button onClick={onBack} onMouseEnter={playHover}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Menu
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {replays.map((replay) => (
                                <ReplayCard key={replay.id} replay={replay} formatTime={formatTime} formatDate={formatDate} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ReplayCard({ replay, formatTime, formatDate }: { 
    replay: GameReplay
    formatTime: (seconds: number) => string
    formatDate: (dateString: string) => string 
}) {
    return (
        <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl rounded-2xl p-6 hover:bg-primary/10 transition-all duration-300">
            <div className="flex items-center justify-between">
                {/* Left Section - Player Info */}
                <div className="flex items-center gap-4">
                    {replay.avatarUrl ? (
                        <img 
                            src={replay.avatarUrl} 
                            alt={replay.playerName}
                            className="w-12 h-12 rounded-full border-2 border-primary/30"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary/60" />
                        </div>
                    )}
                    
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{replay.playerName}</h3>
                            {replay.handle && (
                                <span className="text-sm text-white/60 font-mono">@{replay.handle}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-white/50">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(replay.createdAt)}
                            </div>
                            {replay.worldId && (
                                <div className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {replay.worldId.split('_')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center Section - Stats */}
                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-white/60 uppercase tracking-widest">Level</span>
                        </div>
                        <span className="text-2xl font-black text-white">{replay.finalLevel}</span>
                    </div>

                    <div className="text-center">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-white/60 uppercase tracking-widest">Time</span>
                        </div>
                        <span className="text-2xl font-black text-white font-mono">{formatTime(replay.finalTime)}</span>
                    </div>

                    {replay.characterId && (
                        <div className="text-center">
                            <div className="flex items-center gap-2 mb-1">
                                <Sword className="w-4 h-4 text-purple-400" />
                                <span className="text-xs text-white/60 uppercase tracking-widest">Hero</span>
                            </div>
                            <span className="text-sm font-bold text-white">{replay.characterId.split('-')[0]}</span>
                        </div>
                    )}
                </div>

            </div>
        </Card>
    )
}