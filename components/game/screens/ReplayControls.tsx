import { Button } from "@/components/ui/button"
import { ArrowLeft, Play, Pause } from "lucide-react"

interface ReplayControlsProps {
    replayPaused: boolean
    setReplayPaused: (paused: boolean) => void
    replaySpeed: number
    setReplaySpeed: (speed: number) => void
    onExit: () => void
    gameTime: number
}

export function ReplayControls({
    replayPaused,
    setReplayPaused,
    replaySpeed,
    setReplaySpeed,
    onExit,
    gameTime
}: ReplayControlsProps) {
    return (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-6 bg-black/80 backdrop-blur-2xl px-10 py-6 rounded-[3rem] border-4 border-cyan-500/30 shadow-[0_0_60px_rgba(0,0,0,0.8)] z-50 animate-in slide-in-from-bottom-10">
            <Button
                onClick={onExit}
                variant="outline"
                className="bg-red-500/10 border-red-500/50 hover:bg-red-500 hover:text-white text-red-400 font-bold uppercase rounded-full w-14 h-14 p-0 transition-all active:scale-95"
                title="Exit Replay"
            >
                <ArrowLeft className="w-6 h-6" />
            </Button>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex flex-col items-center min-w-[80px]">
                <span className="text-[10px] text-white/40 uppercase font-black mb-1 tracking-[0.2em]">Time</span>
                <span className="text-xl text-cyan-400 font-mono font-bold">
                    {Math.floor(gameTime / 60)}:{(gameTime % 60).toFixed(0).padStart(2, '0')}
                </span>
            </div>

            <div className="h-10 w-px bg-white/10" />

            <Button
                onClick={() => setReplayPaused(!replayPaused)}
                variant="outline"
                className="bg-cyan-500/10 border-cyan-500/50 hover:bg-cyan-500 hover:text-black text-cyan-400 font-bold rounded-full w-20 h-20 p-0 shadow-lg shadow-cyan-500/20 transition-all active:scale-90"
            >
                {replayPaused ? <Play className="w-10 h-10 fill-current ml-1" /> : <Pause className="w-10 h-10 fill-current" />}
            </Button>

            <div className="h-10 w-px bg-white/10" />

            <div className="flex flex-col items-center">
                <span className="text-[10px] text-white/40 uppercase font-black mb-2 tracking-[0.2em]">Playback Speed</span>
                <div className="flex gap-2">
                    {[1, 2, 4, 8].map(speed => (
                        <Button
                            key={speed}
                            onClick={() => setReplaySpeed(speed)}
                            variant={replaySpeed === speed ? "default" : "outline"}
                            className={`h-10 px-4 font-black rounded-xl transition-all ${replaySpeed === speed ? 'bg-cyan-500 text-black border-cyan-500 shadow-lg shadow-cyan-500/40' : 'bg-black/40 border-white/20 text-white/60 hover:text-white hover:border-white/40'}`}
                        >
                            {speed}x
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    )
}
