import { WORLDS } from '@/components/game/data/worlds'
import { UpgradeCard } from "@/components/game/ui/UpgradeCard"
import { AudioManager } from "../core/AudioManager"

interface LevelUpProps {
    selectedWorldId: string
    playerLevel: number
    choices: any[]
    onChoose: (id: string) => void
    rerolls?: number
    onReroll?: () => void
    audioManager: AudioManager | null
    isAirdrop?: boolean
}

export function LevelUp({
    selectedWorldId,
    playerLevel,
    choices,
    onChoose,
    audioManager,
    isAirdrop = false
}: LevelUpProps) {
    const handleChoose = (id: string) => {
        audioManager?.playUISelect();
        onChoose(id);
    };

    return (
        <div className={`absolute inset-0 ${isAirdrop ? 'bg-gradient-to-b from-yellow-900/90 to-black/95' : 'bg-black/90'} backdrop-blur-3xl flex flex-col items-center justify-start p-4 md:p-8 z-50 overflow-y-auto pt-8 md:pt-12 pb-8 scrollbar-hide safe-area-inset-top safe-area-inset-bottom animate-in fade-in duration-300`}>
            <div className="mb-4 md:mb-6 text-center animate-in zoom-in slide-in-from-bottom-4 duration-500 shrink-0">
                <div className={`inline-block px-3 md:px-4 py-1 ${isAirdrop ? 'bg-yellow-500/30 border-yellow-400/50' : 'bg-primary/20 border-primary/30'} border rounded-full mb-2 md:mb-3`}>
                    <span className={`text-[8px] md:text-[10px] font-black ${isAirdrop ? 'text-yellow-400' : 'text-primary'} uppercase tracking-[0.3em] md:tracking-[0.4em]`}>
                        {isAirdrop ? '📦 Supply Drop' : 'Choose Your Upgrade'}
                    </span>
                </div>
                <h2 className={`text-2xl md:text-5xl font-black italic uppercase tracking-tighter ${isAirdrop ? 'text-yellow-400 drop-shadow-[0_0_40px_rgba(255,215,0,0.5)]' : 'text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]'} leading-none px-2`}>
                    {isAirdrop ? "AIRDROP REWARD" : (WORLDS.find(w => w.id === selectedWorldId)?.lootThemeName || "DIVINE FAVOR")}
                </h2>
                <p className="text-white/40 font-bold tracking-[0.2em] md:tracking-[0.3em] uppercase text-[10px] md:text-xs mt-2 md:mt-3 font-mono">
                    {isAirdrop ? 'FREE UPGRADE' : `LEVEL ${playerLevel}`}
                </p>
            </div>

            {/* Card Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 w-full max-w-7xl mx-auto px-2 md:px-4 pb-4">
                {choices.map((choice, index) => (
                    <div
                        key={choice.id}
                        className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
                        style={{ animationDelay: `${150 + Math.min(index * 30, 300)}ms` }}
                    >
                        <UpgradeCard
                            title={choice.title}
                            desc={choice.desc}
                            imageUrl={choice.imageUrl}
                            itemId={choice.itemId || choice.id}
                            rarity={choice.rarity}
                            level={choice.level || 0}
                            locked={choice.locked || false}
                            lockReason={choice.lockReason || ''}
                            onClick={() => handleChoose(choice.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}
