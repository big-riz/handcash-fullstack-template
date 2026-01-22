// World of Warcraft-style rarity colors
export const RARITY_COLORS = {
    common: {
        bg: "bg-[#9d9d9d]/20",
        border: "border-[#9d9d9d]/40",
        text: "text-[#9d9d9d]",
        glow: "shadow-[0_0_10px_rgba(157,157,157,0.3)]",
    },
    uncommon: {
        bg: "bg-[#1eff00]/20",
        border: "border-[#1eff00]/40",
        text: "text-[#1eff00]",
        glow: "shadow-[0_0_10px_rgba(30,255,0,0.3)]",
    },
    rare: {
        bg: "bg-[#0070dd]/20",
        border: "border-[#0070dd]/40",
        text: "text-[#0070dd]",
        glow: "shadow-[0_0_10px_rgba(0,112,221,0.3)]",
    },
    epic: {
        bg: "bg-[#a335ee]/20",
        border: "border-[#a335ee]/40",
        text: "text-[#a335ee]",
        glow: "shadow-[0_0_10px_rgba(163,53,238,0.3)]",
    },
    legendary: {
        bg: "bg-[#ff8000]/20",
        border: "border-[#ff8000]/40",
        text: "text-[#ff8000]",
        glow: "shadow-[0_0_10px_rgba(255,128,0,0.3)]",
    },
    artifact: {
        bg: "bg-[#e6cc80]/20",
        border: "border-[#e6cc80]/40",
        text: "text-[#e6cc80]",
        glow: "shadow-[0_0_10px_rgba(230,204,128,0.3)]",
    },
    heirloom: {
        bg: "bg-[#00ccff]/20",
        border: "border-[#00ccff]/40",
        text: "text-[#00ccff]",
        glow: "shadow-[0_0_10px_rgba(0,204,255,0.3)]",
    },
} as const

export type RarityType = keyof typeof RARITY_COLORS

export function getRarityClasses(rarity?: string): string {
    if (!rarity) return ""

    const normalizedRarity = rarity.toLowerCase() as RarityType
    const colors = RARITY_COLORS[normalizedRarity]

    if (!colors) return ""

    return `${colors.bg} ${colors.border} ${colors.text} ${colors.glow}`
}

export function getRarityTextClass(rarity?: string): string {
    if (!rarity) return ""

    const normalizedRarity = rarity.toLowerCase() as RarityType
    const colors = RARITY_COLORS[normalizedRarity]

    return colors?.text || ""
}
