"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Package, Loader2, Info, Crown, Star, Gem, Award, Shield, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRarityClasses, RARITY_COLORS } from "@/lib/rarity-colors"
import { usePoolProgress } from "@/hooks/use-mint-progress"

interface MintItem {
    id: string;
    name: string;
    rarity: string;
    supplyLimit: number;
    minted: number;
    remaining: number | string;
    imageUrl?: string;
}

interface MintStats {
    poolName: string;
    totalTemplates: number;
    totalSupplyLimit: number;
    totalMinted: number;
    items: MintItem[];
}

// Rarity hierarchy (lower number = more rare)
const RARITY_ORDER: Record<string, number> = {
    'artifact': 1,
    'legendary': 2,
    'heirloom': 3,
    'epic': 4,
    'rare': 5,
    'uncommon': 6,
    'common': 7,
}

// Rarity tier definitions for display
const RARITY_TIERS = {
    premium: ['artifact', 'legendary', 'heirloom'], // Full expanded cards
    enhanced: ['epic', 'rare'], // Medium cards
    standard: ['uncommon', 'common'], // Compact cards
}

// Rarity icons
const RARITY_ICONS: Record<string, any> = {
    'artifact': Crown,
    'legendary': Star,
    'heirloom': Award,
    'epic': Gem,
    'rare': Shield,
}

function getRarityTier(rarity: string): 'premium' | 'enhanced' | 'standard' {
    const normalized = rarity.toLowerCase()
    if (RARITY_TIERS.premium.includes(normalized)) return 'premium'
    if (RARITY_TIERS.enhanced.includes(normalized)) return 'enhanced'
    return 'standard'
}

export function StatsSection() {
    const [pools, setPools] = useState<MintStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Live Pool Progress for the default pool
    const { poolItems: liveItems, totalMinted: liveMinted, totalSupplyLimit: liveLimit, isAnimating: isProgressAnimating } = usePoolProgress("default")

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/pool-stats");
                const data = await response.json();
                if (data.pools) {
                    setPools(data.pools);
                }
            } catch (error) {
                console.error("Failed to fetch pool stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 md:py-24 gap-4">
                <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-primary/50" />
                <p className="text-fluid-xs md:text-fluid-sm text-muted-foreground font-mono animate-pulse uppercase tracking-widest">Extracting Metric Data...</p>
            </div>
        );
    }

    return (
        <div className="py-12 md:py-24 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center mb-12 md:mb-16">
                <h2 className="text-fluid-4xl md:text-fluid-5xl font-black italic tracking-tighter uppercase mb-2 text-center px-4">Mint Economics</h2>
                <div className="h-1 md:h-1.5 w-16 md:w-24 bg-primary mb-4 md:mb-6" />
                <p className="text-fluid-sm md:text-fluid-base text-muted-foreground text-center max-w-xl font-medium px-4">
                    Supply and demand analysis of the Gopnik ecosystem. Real-time depletion metrics per mint.
                </p>
            </div>

            {pools.map((pool) => {
                // Use live data if this is the default pool and we have live data
                const isDefaultPool = pool.poolName === 'default'
                const displayItems = (isDefaultPool && liveItems && liveItems.length > 0) ? liveItems : pool.items
                const displayMinted = (isDefaultPool && liveMinted) ? liveMinted : pool.totalMinted
                const displayLimit = (isDefaultPool && liveLimit) ? liveLimit : pool.totalSupplyLimit

                // Sort items by rarity (rarest first)
                const sortedItems = [...displayItems].sort((a, b) => {
                    const orderA = RARITY_ORDER[a.rarity.toLowerCase()] || 999
                    const orderB = RARITY_ORDER[b.rarity.toLowerCase()] || 999
                    return orderA - orderB
                })

                // Group items by rarity tier
                const premiumItems = sortedItems.filter(item => getRarityTier(item.rarity) === 'premium')
                const enhancedItems = sortedItems.filter(item => getRarityTier(item.rarity) === 'enhanced')
                const standardItems = sortedItems.filter(item => getRarityTier(item.rarity) === 'standard')

                return (
                    <div key={pool.poolName} className="mb-12 md:mb-20">
                        {/* Pool Header Card */}
                        <Card className="p-6 md:p-8 rounded-2xl md:rounded-[3rem] border-primary/20 bg-primary/5 mb-6 md:mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-10">
                                <TrendingUp className="w-16 h-16 md:w-32 md:h-32" />
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative z-10">
                                <div>
                                    <Badge className="mb-2 bg-primary text-background font-black italic uppercase rounded-full text-[9px] md:text-[10px] px-2 md:px-3">
                                        Active Mint
                                    </Badge>
                                    <h3 className="text-fluid-3xl md:text-fluid-4xl font-black italic uppercase tracking-tight">{pool.poolName}</h3>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Minted</span>
                                            {isProgressAnimating && isDefaultPool && <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" />}
                                        </div>
                                        <span className={`text-fluid-2xl md:text-fluid-3xl font-black transition-all duration-300 ${isProgressAnimating && isDefaultPool ? "text-yellow-400 scale-110" : ""}`}>
                                            {displayMinted.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Collection Cap</span>
                                        <span className="text-fluid-2xl md:text-fluid-3xl font-black">{displayLimit > 0 ? displayLimit.toLocaleString() : "∞"}</span>
                                    </div>
                                    <div className="flex flex-col col-span-2 lg:col-span-1">
                                        <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Depletion</span>
                                        <span className={`text-fluid-2xl md:text-fluid-3xl font-black transition-all duration-300 ${isProgressAnimating && isDefaultPool ? "text-yellow-400" : "text-primary"}`}>
                                            {displayLimit > 0 ? Math.round((displayMinted / displayLimit) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 md:mt-10 relative">
                                <Progress
                                    value={displayLimit > 0 ? (displayMinted / displayLimit) * 100 : 0}
                                    className={`h-1.5 md:h-2 rounded-full bg-primary/10 transition-all duration-500 ${isProgressAnimating && isDefaultPool ? "shadow-[0_0_15px_rgba(234,179,8,0.5)]" : ""}`}
                                />
                                {isProgressAnimating && isDefaultPool && (
                                    <div className="absolute top-0 right-0 h-full w-2 bg-yellow-400 blur-sm animate-pulse" style={{ left: `${(displayMinted / displayLimit) * 100}%` }} />
                                )}
                            </div>
                        </Card>

                        {/* Premium Tiers (Grid 1x1 or 2x2) */}
                        {premiumItems.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6">
                                {premiumItems.map((item) => (
                                    <ItemCard key={item.id} item={item} variant="premium" />
                                ))}
                            </div>
                        )}

                        {/* Enhanced Tiers (Grid 2x2 or 3x3) */}
                        {enhancedItems.length > 0 && (
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                                {enhancedItems.map((item) => (
                                    <ItemCard key={item.id} item={item} variant="enhanced" />
                                ))}
                            </div>
                        )}

                        {/* Standard Tiers (Grid 3x3 or 4x4) */}
                        {standardItems.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                                {standardItems.map((item) => (
                                    <ItemCard key={item.id} item={item} variant="standard" />
                                ))}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function ItemCard({ item, variant }: { item: MintItem; variant: 'premium' | 'enhanced' | 'standard' }) {
    const rarityColor = RARITY_COLORS[item.rarity.toLowerCase()] || '#ffffff'
    const RarityIcon = RARITY_ICONS[item.rarity.toLowerCase()] || Package
    const percentage = item.supplyLimit > 0 ? Math.round((item.minted / item.supplyLimit) * 100) : 0

    if (variant === 'premium') {
        return (
            <Card className="relative overflow-hidden group hover:border-primary/40 transition-all duration-500 bg-card/40 backdrop-blur-xl border-primary/10 p-6 md:p-8">
                <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/5 blur-3xl rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24 group-hover:bg-primary/10 transition-colors" />

                <div className="flex items-start justify-between relative z-10 gap-4">
                    <div className="flex-1">
                        <Badge className={`mb-3 md:mb-4 px-3 md:px-4 py-1 rounded-full text-[10px] md:text-xs font-black uppercase italic tracking-widest border-2 ${getRarityClasses(item.rarity)}`}>
                            <RarityIcon className="w-3 h-3 md:w-3.5 md:h-3.5 mr-1.5 md:mr-2 inline" />
                            {item.rarity}
                        </Badge>
                        <h4 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-4 md:mb-6 leading-none">{item.name}</h4>

                        <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6 md:mb-8">
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Minted</p>
                                <p className="text-xl md:text-3xl font-black">{item.minted}</p>
                            </div>
                            <div>
                                <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 opacity-60">Supply</p>
                                <p className="text-xl md:text-3xl font-black">{item.supplyLimit}</p>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-end mb-2 md:mb-3">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest opacity-40">Saturation</span>
                                <span className="text-sm md:text-lg font-black italic text-primary">{percentage}%</span>
                            </div>
                            <Progress value={percentage} className="h-2 md:h-3 bg-primary/10 rounded-full" />
                        </div>
                    </div>
                </div>
            </Card>
        )
    }

    if (variant === 'enhanced') {
        return (
            <Card className="p-4 md:p-6 border-primary/10 hover:border-primary/30 transition-all duration-300 bg-card/30 group">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <Badge className={`px-2 md:px-3 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border ${getRarityClasses(item.rarity)}`}>
                        {item.rarity}
                    </Badge>
                    <span className="text-[10px] md:text-xs font-mono opacity-40">{item.minted}/{item.supplyLimit}</span>
                </div>
                <h4 className="text-lg md:text-xl font-black uppercase italic tracking-tight mb-4 md:mb-6 line-clamp-1">{item.name}</h4>
                <div className="space-y-1.5 md:space-y-2">
                    <div className="h-1 md:h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <div className="flex justify-between text-[8px] md:text-[9px] font-black uppercase tracking-widest opacity-40">
                        <span>Depletion</span>
                        <span>{percentage}%</span>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-3 md:p-4 border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
            <div className="flex justify-between items-baseline mb-2 gap-2">
                <h4 className="text-xs md:text-sm font-bold uppercase tracking-tight line-clamp-1 opacity-80">{item.name}</h4>
                <span className="text-[8px] md:text-[9px] font-mono opacity-30 shrink-0">{item.minted}/{item.supplyLimit}</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full opacity-30 ${getRarityClasses(item.rarity).split(' ')[1]}`} style={{ width: `${percentage}%` }} />
            </div>
        </Card>
    )
}
