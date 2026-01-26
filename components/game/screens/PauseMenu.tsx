import { Button } from "@/components/ui/button"
import { Play, Home, RotateCcw, Volume2, VolumeX, Music } from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface PauseMenuProps {
    isMobile: boolean
    onResume: () => void
    onRestart: () => void
    onMainMenu: () => void
    musicVolume: number
    sfxVolume: number
    onMusicVolumeChange: (value: number) => void
    onSfxVolumeChange: (value: number) => void
}

export function PauseMenu({
    isMobile,
    onResume,
    onRestart,
    onMainMenu,
    musicVolume,
    sfxVolume,
    onMusicVolumeChange,
    onSfxVolumeChange
}: PauseMenuProps) {
    return (
        <div className={`absolute inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 ${isMobile ? 'safe-area-inset-top safe-area-inset-bottom overflow-y-auto' : ''}`}>
            <div className={`bg-black/90 border-4 border-cyan-500/40 ${isMobile ? 'p-5' : 'p-12'} ${isMobile ? 'rounded-[2rem]' : 'rounded-[3rem]'} flex flex-col items-center shadow-[0_0_60px_rgba(34,211,238,0.4)] max-w-2xl w-full mx-4`}>
                <h2 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-black italic uppercase tracking-tighter text-white mb-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.5)]`}>
                    PAUSED
                </h2>

                {/* Settings */}
                <div className="w-full space-y-6 mb-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-white font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                            <Volume2 className="w-5 h-5" />
                            Audio Settings
                        </h3>

                        {/* Music Volume */}
                        <div className="space-y-3 mb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Music className="w-4 h-4 text-purple-400" />
                                    <span className="text-white/80 text-sm font-bold">Music</span>
                                </div>
                                <span className="text-white/60 text-sm font-mono">{Math.round(musicVolume * 100)}%</span>
                            </div>
                            <Slider
                                value={[musicVolume]}
                                onValueChange={(values) => onMusicVolumeChange(values[0])}
                                min={0}
                                max={1}
                                step={0.01}
                                className="w-full"
                            />
                        </div>

                        {/* SFX Volume */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Volume2 className="w-4 h-4 text-cyan-400" />
                                    <span className="text-white/80 text-sm font-bold">Sound Effects</span>
                                </div>
                                <span className="text-white/60 text-sm font-mono">{Math.round(sfxVolume * 100)}%</span>
                            </div>
                            <Slider
                                value={[sfxVolume]}
                                onValueChange={(values) => onSfxVolumeChange(values[0])}
                                min={0}
                                max={1}
                                step={0.01}
                                className="w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} gap-4`}>
                    <Button
                        onClick={onResume}
                        size="lg"
                        className={`${isMobile ? 'h-14 w-full touch-target' : 'h-16 px-12'} rounded-[2rem] bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-black font-black uppercase tracking-wider md:tracking-widest shadow-[0_0_30px_rgba(34,211,238,0.5)] transition-all active:scale-95`}
                    >
                        <Play className="w-5 h-5 mr-2" />
                        Resume
                    </Button>
                    <Button
                        onClick={onRestart}
                        variant="outline"
                        size="lg"
                        className={`${isMobile ? 'h-14 w-full touch-target' : 'h-16 px-12'} rounded-[2rem] bg-white/5 border-white/20 text-white hover:bg-white/10 active:bg-white/5 font-black uppercase tracking-wider md:tracking-widest transition-all active:scale-95`}
                    >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Restart
                    </Button>
                    <Button
                        onClick={onMainMenu}
                        variant="outline"
                        size="lg"
                        className={`${isMobile ? 'h-14 w-full touch-target' : 'h-16 px-12'} rounded-[2rem] bg-white/5 border-white/20 text-white hover:bg-white/10 active:bg-white/5 font-black uppercase tracking-wider md:tracking-widest transition-all active:scale-95`}
                    >
                        <Home className="w-5 h-5 mr-2" />
                        Main Menu
                    </Button>
                </div>
            </div>
        </div>
    )
}
