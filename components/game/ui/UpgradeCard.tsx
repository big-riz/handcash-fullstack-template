import { Button } from "@/components/ui/button"

const rarityStyles = {
    Common: {
        border: 'border-white/10',
        glow: 'shadow-white/10',
        text: 'text-white/30'
    },
    Uncommon: {
        border: 'border-green-500/30',
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
        text: 'text-green-400/50'
    },
    Rare: {
        border: 'border-blue-500/40',
        glow: 'shadow-[0_0_25px_rgba(59,130,246,0.4)]',
        text: 'text-blue-400/50'
    },
    Epic: {
        border: 'border-purple-500/50',
        glow: 'shadow-[0_0_30px_rgba(168,85,247,0.5)]',
        text: 'text-purple-400/50'
    },
    Legendary: {
        border: 'border-orange-500/60',
        glow: 'shadow-[0_0_40px_rgba(249,115,22,0.6)]',
        text: 'text-orange-400/50'
    },
    Evolution: {
        border: 'border-yellow-400/70',
        glow: 'shadow-[0_0_50px_rgba(250,204,21,0.7)]',
        text: 'text-yellow-400/70'
    }
}

export function UpgradeCard({ title, desc, imageUrl, itemId, onClick, rarity = 'Common', level = 0, locked = false, lockReason = '' }: { title: string, desc: string, imageUrl?: string, itemId?: string, onClick: () => void, rarity?: string, level?: number, locked?: boolean, lockReason?: string }) {
    const styles = rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.Common
    const isOwned = level > 0
    const isEvolution = rarity === 'Evolution'
    const isMaxed = level >= 5

    return (
        <div className="relative group">
            <button
                onClick={locked ? undefined : onClick}
                disabled={locked}
                className={`relative w-full border-2 md:border-4 p-3 md:p-5 rounded-xl md:rounded-2xl text-left transition-all shadow-xl overflow-hidden ring-1 ring-white/10 min-h-[160px] md:min-h-[200px] flex flex-col touch-target ${
                    locked
                        ? 'bg-black/40 border-white/5 cursor-not-allowed opacity-50'
                        : `bg-black/70 ${styles.border} ${styles.glow} hover:bg-white/10 hover:border-primary/50 hover:scale-[1.02] active:scale-95`
                }`}
            >
                <div className={`mb-2 md:mb-4 w-10 md:w-14 h-10 md:h-14 rounded-lg md:rounded-xl bg-white/5 flex items-center justify-center transition-all overflow-hidden shrink-0 ${locked ? '' : 'group-hover:bg-primary/30 group-hover:rotate-6 group-hover:scale-110'}`}>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className={`w-full h-full object-cover rounded-lg md:rounded-xl ${locked ? 'grayscale' : ''}`}
                        />
                    ) : (
                        <div className={`w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-white text-lg md:text-xl font-black ${locked ? 'grayscale' : ''}`}>
                            {title.charAt(0)}
                        </div>
                    )}
                </div>
                <h3 className={`text-sm md:text-lg font-black italic uppercase mb-1 tracking-tight leading-tight line-clamp-2 ${locked ? 'text-white/40' : 'text-white group-hover:text-primary'} transition-colors`}>{title}</h3>
                <p className={`text-[9px] md:text-xs font-medium leading-tight tracking-tight line-clamp-3 flex-1 ${locked ? 'text-white/30' : 'text-white/50 opacity-70'}`}>
                    {locked ? lockReason : desc}
                </p>
                <div className={`absolute top-2 md:top-3 right-2 md:right-3 text-[7px] md:text-[8px] font-black uppercase tracking-wider ${locked ? 'text-white/20' : `${styles.text} group-hover:text-primary/40`} transition-colors`}>{rarity}</div>
                {/* Level indicator */}
                {!isEvolution && (
                    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div
                                key={i}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i <= level ? (locked ? 'bg-white/30' : 'bg-primary') : 'bg-white/20'}`}
                            />
                        ))}
                    </div>
                )}
                {/* NEW badge for unowned unlocked items */}
                {!isOwned && !isEvolution && !locked && (
                    <div className="absolute top-2 md:top-3 left-2 md:left-3 px-1.5 py-0.5 bg-green-500/80 rounded text-[6px] md:text-[7px] font-black text-white uppercase">
                        New
                    </div>
                )}
                {/* LOCKED badge */}
                {locked && !isMaxed && (
                    <div className="absolute top-2 md:top-3 left-2 md:left-3 px-1.5 py-0.5 bg-red-500/60 rounded text-[6px] md:text-[7px] font-black text-white uppercase">
                        Locked
                    </div>
                )}
                {/* MAX badge */}
                {isMaxed && (
                    <div className="absolute top-2 md:top-3 left-2 md:left-3 px-1.5 py-0.5 bg-yellow-500/80 rounded text-[6px] md:text-[7px] font-black text-white uppercase">
                        Max
                    </div>
                )}
            </button>
        </div>
    )
}
