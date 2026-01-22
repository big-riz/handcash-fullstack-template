"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Package, Loader2, Info, Crown, Star, Gem, Award, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRarityClasses, RARITY_COLORS } from "@/lib/rarity-colors"

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
                // Sort items by rarity (rarest first)
                const sortedItems = [...pool.items].sort((a, b) => {
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
                                        <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Minted</span>
                                        <span className="text-fluid-2xl md:text-fluid-3xl font-black">{pool.totalMinted.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Collection Cap</span>
                                        <span className="text-fluid-2xl md:text-fluid-3xl font-black">{pool.totalSupplyLimit > 0 ? pool.totalSupplyLimit.toLocaleString() : "∞"}</span>
                                    </div>
                                    <div className="flex flex-col col-span-2 lg:col-span-1">
                                        <span className="text-fluid-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Depletion</span>
                                        <span className="text-fluid-2xl md:text-fluid-3xl font-black text-primary">
                                            {pool.totalSupplyLimit > 0
                                                ? `${((pool.totalMinted / pool.totalSupplyLimit) * 100).toFixed(1)}%`
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {pool.totalSupplyLimit > 0 && (
                                <div className="mt-6 md:mt-8">
                                    <Progress value={(pool.totalMinted / pool.totalSupplyLimit) * 100} className="h-2 md:h-3 rounded-full bg-primary/20" />
                                </div>
                            )}
                        </Card>

                        {/* Premium Tier Items (Artifact, Legendary, Heirloom) - Full Detail */}
                        {premiumItems.length > 0 && (
                            <div className="mb-8 md:mb-12">
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <Star className="w-5 h-5 md:w-6 md:h-6 text-[#ff8000]" />
                                    <h4 className="text-fluid-xl md:text-fluid-2xl font-black uppercase italic tracking-tight">Premium Collection</h4>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                                    {premiumItems.map((item) => {
                                        const Icon = RARITY_ICONS[item.rarity.toLowerCase()] || Star
                                        const rarityClasses = getRarityClasses(item.rarity)
                                        const depletionPercent = item.supplyLimit > 0 ? (item.minted / item.supplyLimit) * 100 : 0

                                        return (
                                            <Card key={item.id} className={`p-6 md:p-8 card-responsive border-2 ${rarityClasses} flex flex-col group hover:scale-[1.02] transition-all duration-500 relative overflow-hidden`}>
                                                {/* Animated background glow */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br from-current to-transparent pointer-events-none" />

                                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 mb-6 relative z-10">
                                                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl md:rounded-3xl overflow-hidden bg-muted/50 group-hover:scale-110 transition-transform duration-500 shrink-0 border-2 border-current">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Icon className="w-12 h-12 md:w-16 md:h-16 opacity-50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                                                            <Badge className={`${rarityClasses} text-[9px] md:text-[10px] rounded-full uppercase font-black tracking-widest border-2`}>
                                                                {item.rarity}
                                                            </Badge>
                                                        </div>
                                                        <h4 className="text-fluid-xl md:text-fluid-2xl font-black italic uppercase leading-tight group-hover:scale-105 transition-transform origin-left">{item.name}</h4>
                                                        {item.supplyLimit > 0 && (
                                                            <p className="text-fluid-xs text-muted-foreground mt-2 font-bold uppercase tracking-wider">
                                                                Limited Edition • {item.supplyLimit.toLocaleString()} Total
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="space-y-4 md:space-y-6 relative z-10">
                                                    <div className="grid grid-cols-3 gap-3 md:gap-4">
                                                        <div className="flex flex-col p-3 md:p-4 bg-background/50 rounded-xl md:rounded-2xl border border-current/20">
                                                            <span className="text-fluid-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Minted</span>
                                                            <span className="text-fluid-xl md:text-fluid-2xl font-black">{item.minted.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex flex-col p-3 md:p-4 bg-background/50 rounded-xl md:rounded-2xl border border-current/20">
                                                            <span className="text-fluid-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Remaining</span>
                                                            <span className={`text-fluid-xl md:text-fluid-2xl font-black ${item.remaining === 0 ? "text-red-500" : ""}`}>
                                                                {item.remaining.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col p-3 md:p-4 bg-background/50 rounded-xl md:rounded-2xl border border-current/20">
                                                            <span className="text-fluid-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Scarcity</span>
                                                            <span className="text-fluid-xl md:text-fluid-2xl font-black">
                                                                {item.supplyLimit > 0 ? `${depletionPercent.toFixed(0)}%` : "∞"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {item.supplyLimit > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-fluid-xs font-black uppercase tracking-widest opacity-70">
                                                                <span>Mint Progress</span>
                                                                <span>{depletionPercent.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="h-3 md:h-4 w-full bg-background/50 rounded-full overflow-hidden p-0.5 border-2 border-current/30">
                                                                <div
                                                                    className="h-full bg-current rounded-full transition-all duration-1000 shadow-[0_0_20px_currentColor]"
                                                                    style={{ width: `${depletionPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Enhanced Tier Items (Epic, Rare) - Medium Detail */}
                        {enhancedItems.length > 0 && (
                            <div className="mb-8 md:mb-12">
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <Gem className="w-5 h-5 md:w-6 md:h-6 text-[#a335ee]" />
                                    <h4 className="text-fluid-xl md:text-fluid-2xl font-black uppercase italic tracking-tight">Enhanced Collection</h4>
                                </div>
                                <div className="grid-responsive-3">
                                    {enhancedItems.map((item) => {
                                        const Icon = RARITY_ICONS[item.rarity.toLowerCase()] || Gem
                                        const rarityClasses = getRarityClasses(item.rarity)

                                        return (
                                            <Card key={item.id} className={`p-4 md:p-6 card-responsive ${rarityClasses} flex flex-col group hover:border-current transition-all duration-500`}>
                                                <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl overflow-hidden bg-muted/50 group-hover:scale-105 transition-transform duration-500 shrink-0 border border-current/50">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <Icon className="w-8 h-8 md:w-10 md:h-10 opacity-50" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-fluid-base md:text-fluid-lg font-black italic uppercase truncate group-hover:text-current transition-colors">{item.name}</h4>
                                                        <Badge className={`${rarityClasses} text-[9px] md:text-[10px] rounded-full uppercase font-bold tracking-widest mt-1 border`}>
                                                            {item.rarity}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 md:space-y-4">
                                                    <div className="flex justify-between items-end">
                                                        <div className="flex flex-col">
                                                            <span className="text-fluid-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Minted</span>
                                                            <span className="text-fluid-lg md:text-fluid-xl font-black">{item.minted.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-fluid-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Remaining</span>
                                                            <span className={`text-fluid-lg md:text-fluid-xl font-black ${item.remaining === 0 ? "text-red-500" : ""}`}>
                                                                {item.remaining.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {item.supplyLimit > 0 ? (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between text-fluid-xs font-black uppercase tracking-widest opacity-60">
                                                                <span>Progress</span>
                                                                <span>{Math.round((item.minted / item.supplyLimit) * 100)}%</span>
                                                            </div>
                                                            <div className="h-2 md:h-2.5 w-full bg-background/50 rounded-full overflow-hidden p-0.5 border border-current/20">
                                                                <div
                                                                    className="h-full bg-current rounded-full transition-all duration-1000"
                                                                    style={{ width: `${(item.minted / item.supplyLimit) * 100}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 py-2 px-3 bg-current/10 rounded-lg md:rounded-xl border border-current/20">
                                                            <Info className="w-3 h-3 shrink-0" />
                                                            <span className="text-fluid-xs font-black uppercase tracking-widest">Unlimited</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Standard Tier Items (Uncommon, Common) - Compact */}
                        {standardItems.length > 0 && (
                            <div>
                                <div className="flex items-center gap-3 mb-4 md:mb-6">
                                    <Package className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                                    <h4 className="text-fluid-xl md:text-fluid-2xl font-black uppercase italic tracking-tight">Standard Collection</h4>
                                </div>
                                <div className="grid-responsive-4">
                                    {standardItems.map((item) => {
                                        const rarityClasses = getRarityClasses(item.rarity)

                                        return (
                                            <Card key={item.id} className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${rarityClasses} flex flex-col group hover:border-current/50 transition-all duration-300`}>
                                                <div className="flex items-center gap-2 md:gap-3 mb-3">
                                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg md:rounded-xl overflow-hidden bg-muted/50 shrink-0 border border-current/30">
                                                        {item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-black text-xs uppercase">
                                                                ?
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-fluid-sm md:text-fluid-base font-black italic uppercase truncate leading-tight">{item.name}</h4>
                                                        <Badge variant="outline" className="text-[8px] md:text-[9px] rounded-full uppercase font-bold tracking-widest mt-1 opacity-60 border-current/30">
                                                            {item.rarity}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-fluid-xs">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold uppercase tracking-wider text-muted-foreground opacity-60">Minted</span>
                                                        <span className="text-fluid-sm md:text-fluid-base font-black">{item.minted.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex flex-col text-right">
                                                        <span className="font-bold uppercase tracking-wider text-muted-foreground opacity-60">Left</span>
                                                        <span className={`text-fluid-sm md:text-fluid-base font-black ${item.remaining === 0 ? "text-red-500" : ""}`}>
                                                            {typeof item.remaining === 'number' ? item.remaining.toLocaleString() : item.remaining}
                                                        </span>
                                                    </div>
                                                </div>

                                                {item.supplyLimit > 0 && (
                                                    <div className="mt-2 md:mt-3">
                                                        <div className="h-1.5 md:h-2 w-full bg-background/50 rounded-full overflow-hidden border border-current/20">
                                                            <div
                                                                className="h-full bg-current rounded-full transition-all duration-700"
                                                                style={{ width: `${(item.minted / item.supplyLimit) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}

            {pools.length === 0 && (
                <div className="text-center py-12 md:py-20 bg-muted/20 rounded-2xl md:rounded-[3rem] border border-dashed border-border">
                    <Package className="w-12 h-12 md:w-16 md:h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-fluid-sm text-muted-foreground font-black uppercase tracking-widest italic px-4">No economics data available yet.</p>
                </div>
            )}
        </div>
    )
}
