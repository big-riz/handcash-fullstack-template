import { Droplet, Snowflake, Flame, Skull, Wind, HeartCrack } from "lucide-react"
import { StatusEffect, StatusEffectType } from "../types"

interface StatusBarProps {
    statusEffects: StatusEffect[]
    isMobile?: boolean
}

const statusIcons: Record<StatusEffectType, { icon: React.ElementType; color: string; name: string }> = {
    [StatusEffectType.POISON]: { icon: Droplet, color: '#00FF00', name: 'Poison' },
    [StatusEffectType.SLOW]: { icon: Wind, color: '#87CEEB', name: 'Slow' },
    [StatusEffectType.CURSE]: { icon: Skull, color: '#8B008B', name: 'Curse' },
    [StatusEffectType.BURN]: { icon: Flame, color: '#FF4500', name: 'Burn' },
    [StatusEffectType.FREEZE]: { icon: Snowflake, color: '#00BFFF', name: 'Freeze' },
    [StatusEffectType.BLEED]: { icon: HeartCrack, color: '#DC143C', name: 'Bleed' },
}

export function StatusBar({ statusEffects, isMobile = false }: StatusBarProps) {
    if (statusEffects.length === 0) return null

    return (
        <div className={`flex ${isMobile ? 'gap-1' : 'gap-2'} items-center`}>
            {statusEffects.map((effect, index) => {
                const iconData = statusIcons[effect.type]
                if (!iconData) return null

                const Icon = iconData.icon
                const timeRemaining = Math.ceil(effect.duration)
                const stacks = effect.stacks && effect.stacks > 1 ? effect.stacks : null

                return (
                    <div
                        key={`${effect.type}-${index}`}
                        className={`relative bg-black/60 backdrop-blur-md border-2 ${isMobile ? 'p-1 rounded-lg' : 'p-2 rounded-xl'} flex flex-col items-center shadow-lg group`}
                        style={{ borderColor: iconData.color }}
                    >
                        {/* Icon */}
                        <Icon
                            className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'}`}
                            style={{ color: iconData.color }}
                        />

                        {/* Timer */}
                        <div
                            className={`${isMobile ? 'text-[8px]' : 'text-[10px]'} font-black text-white mt-1`}
                        >
                            {timeRemaining}s
                        </div>

                        {/* Stack count */}
                        {stacks && (
                            <div
                                className={`absolute ${isMobile ? '-top-1 -right-1' : '-top-2 -right-2'} bg-red-600 text-white ${isMobile ? 'text-[8px] px-1' : 'text-[10px] px-1.5'} font-black rounded-full border border-black`}
                            >
                                x{stacks}
                            </div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 w-32 bg-black/90 border border-white/20 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
                            <div className="text-white text-xs font-bold">{iconData.name}</div>
                            <div className="text-white/60 text-[10px]">
                                {effect.damage && `${effect.damage.toFixed(1)} damage/s`}
                                {effect.slowAmount && `${Math.round(effect.slowAmount * 100)}% slow`}
                                {effect.statReduction && `${Math.round(effect.statReduction * 100)}% weaker`}
                                {stacks && ` (${stacks} stacks)`}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
