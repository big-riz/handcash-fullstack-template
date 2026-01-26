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
    }
}

export function UpgradeCard({ title, desc, imageUrl, itemId, onClick, rarity = 'Common' }: { title: string, desc: string, imageUrl?: string, itemId?: string, onClick: () => void, rarity?: string }) {
    const styles = rarityStyles[rarity as keyof typeof rarityStyles] || rarityStyles.Common

    return (
        <div className="relative group snap-center">
            <button
                onClick={onClick}
                className={`relative bg-black/70 border-4 ${styles.border} p-5 md:p-8 rounded-[2.5rem] md:rounded-[4rem] text-left transition-all hover:bg-white/10 hover:border-primary/50 hover:scale-[1.02] active:scale-95 shadow-2xl ${styles.glow} overflow-hidden ring-1 ring-white/10 w-[220px] md:w-[280px] max-w-[calc(100vw-2rem)] h-[280px] md:h-[340px] flex flex-col shrink-0 touch-target`}
            >
                <div className="mb-5 md:mb-8 w-14 md:w-24 h-14 md:h-24 rounded-[1.2rem] md:rounded-[2rem] bg-white/5 flex items-center justify-center group-hover:bg-primary/30 transition-all group-hover:rotate-12 group-hover:scale-110 overflow-hidden shrink-0">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="w-full h-full object-cover rounded-[1.2rem] md:rounded-[2rem]"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-white text-2xl md:text-3xl font-black">
                            {title.charAt(0)}
                        </div>
                    )}
                </div>
                <h3 className="text-xl md:text-3xl font-black italic uppercase text-white mb-1 md:mb-2 group-hover:text-primary transition-colors tracking-tighter leading-tight">{title}</h3>
                <p className="text-[11px] md:text-sm text-white/50 font-black leading-tight tracking-tight opacity-70 line-clamp-4">{desc}</p>
                <div className={`absolute top-6 md:top-8 right-6 md:right-10 text-[9px] md:text-[10px] font-black uppercase ${styles.text} tracking-[0.3em] md:tracking-[0.5em] group-hover:text-primary/40 transition-colors`}>{rarity}</div>

            </button>
        </div>
    )
}
