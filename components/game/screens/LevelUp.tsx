import { WORLDS } from '@/components/game/data/worlds'
import { UpgradeCard } from "@/components/game/ui/UpgradeCard"
import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"
import { AudioManager } from "../core/AudioManager"

interface LevelUpProps {
    selectedWorldId: string
    playerLevel: number
    choices: any[]
    onChoose: (id: string) => void
    rerolls: number
    onReroll: () => void
    audioManager: AudioManager | null
}

export function LevelUp({
    selectedWorldId,
    playerLevel,
    choices,
    onChoose,
    rerolls,
    onReroll,
    audioManager
}: LevelUpProps) {
    const handleChoose = (id: string) => {
        audioManager?.playUISelect();
        onChoose(id);
    };
    const handleReroll = () => {
        audioManager?.playReroll();
        onReroll();
    };
    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-3xl flex flex-col items-center justify-start p-4 md:p-12 z-50 overflow-y-auto pt-12 md:pt-16 pb-24 md:pb-20 scrollbar-hide safe-area-inset-top safe-area-inset-bottom">
            <div className="mb-6 md:mb-8 text-center animate-in zoom-in duration-500 shrink-0">
                <div className="inline-block px-3 md:px-4 py-1 bg-primary/20 border border-primary/30 rounded-full mb-3 md:mb-4">
                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-[0.3em] md:tracking-[0.4em]">Ancient Reliquary Opened</span>
                </div>
                <h2 className="text-3xl md:text-7xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)] leading-none px-2">
                    {WORLDS.find(w => w.id === selectedWorldId)?.lootThemeName || "DIVINE FAVOR"}
                </h2>
                <p className="text-white/40 font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-[10px] md:text-xs mt-3 md:mt-4 font-mono">LEVEL {playerLevel} ACCOMPLISHED</p>
            </div>

            {/* Card Container - Single Row Scrollable */}
            <div className="flex flex-nowrap justify-start lg:justify-center gap-3 md:gap-6 w-full mx-auto mb-12 md:mb-16 px-4 md:px-10 overflow-x-auto scrollbar-hide no-scrollbar smooth-scroll pb-6 md:pb-8 snap-x snap-mandatory">
                {choices.map((choice, index) => (
                    <div
                        key={choice.id}
                        className="animate-in slide-in-from-bottom-12 fade-in duration-700 fill-mode-both"
                        style={{ animationDelay: `${index * 150}ms` }}
                    >
                        <UpgradeCard
                            title={choice.title}
                            desc={choice.desc}
                            imageUrl={choice.imageUrl}
                            itemId={choice.itemId || choice.id}
                            rarity={choice.rarity}
                            onClick={() => handleChoose(choice.id)}
                        />
                    </div>
                ))}
            </div>

            {/* Meta Choice Buttons (Reroll, Skip) */}
            <div className="sticky bottom-0 left-0 w-full flex justify-center gap-3 md:gap-8 mt-auto py-6 md:py-8 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none safe-area-inset-bottom z-10">
                <div className="flex gap-3 md:gap-4 pointer-events-auto">
                    <Button
                        onClick={handleReroll}
                        disabled={rerolls <= 0}
                        variant="outline"
                        className="h-14 md:h-14 px-6 md:px-8 touch-target bg-black/80 border-2 border-primary/20 rounded-2xl flex flex-col gap-0 transition-all hover:border-primary hover:bg-primary/10 group active:scale-95 disabled:opacity-30"
                    >
                        <span className="text-[9px] md:text-[10px] font-black text-primary/50 uppercase tracking-wider md:tracking-widest group-hover:text-primary transition-colors">Reroll ({rerolls})</span>
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary" />
                            <span className="text-white font-black italic uppercase text-xs md:text-sm">Try Fate</span>
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    )
}
