import { getItemMetadata, resolveItemIcon } from "@/components/game/utils/itemUtils"
import activeData from '@/components/game/data/actives'
import { ItemTemplate } from "@/lib/item-templates-storage"

export function ItemIcon({ id, className = "w-6 h-6", showGlow = true, imageUrl, itemTemplates }: { id: string, className?: string, showGlow?: boolean, imageUrl?: string, itemTemplates?: ItemTemplate[] }) {
    const meta = getItemMetadata(id)
    const name = meta?.name || id

    // Determine if active (weapon) or passive for glow color
    const isWeapon = activeData.some(a => (a as any).id === id)
    const glowColor = isWeapon
        ? 'shadow-[0_0_12px_rgba(251,146,60,0.6)]' // Orange/amber glow for actives
        : 'shadow-[0_0_12px_rgba(147,197,253,0.6)]' // Blue glow for passives
    const bgGlow = isWeapon
        ? 'bg-gradient-to-br from-orange-400/30 to-red-500/20'
        : 'bg-gradient-to-br from-blue-400/30 to-cyan-500/20'

    // Try to resolve image if not provided
    const finalImageUrl = imageUrl || (itemTemplates ? resolveItemIcon(id, itemTemplates) : undefined)

    if (finalImageUrl) {
        return (
            <div className={`${className} relative rounded-lg overflow-hidden ${showGlow ? glowColor : ''}`}>
                {showGlow && <div className={`absolute inset-0 ${bgGlow} rounded-lg`} />}
                <img
                    src={finalImageUrl}
                    alt={name}
                    className="w-full h-full object-cover rounded-lg relative z-10"
                />
            </div>
        )
    }

    // Fallback: colored placeholder based on item type
    const bgColor = isWeapon ? 'bg-orange-500/40' : 'bg-blue-500/40'
    return (
        <div className={`${className} ${bgColor} rounded-lg flex items-center justify-center text-white/80 text-xs font-bold ${showGlow ? glowColor : ''}`}>
            {name.charAt(0).toUpperCase()}
        </div>
    )
}
