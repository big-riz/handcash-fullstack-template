"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Package, Loader2, Info, Crown, Star, Gem, Award, Shield, Sparkles, PieChart as PieChartIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getRarityClasses, RARITY_COLORS, getRarityTextClass, RarityType } from "@/lib/rarity-colors"
import { usePoolProgress } from "@/hooks/use-mint-progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

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

                        {/* Economics Analysis Charts */}
                        <EconomicsCharts items={displayItems} />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                            {sortedItems.map((item, idx) => (
                                <ItemCard key={item.id || (item as any).templateId || idx} item={item} />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function EconomicsCharts({ items }: { items: MintItem[] }) {
    // Process Rarity Distribution (Number of templates per rarity)
    const rarityDistribution = items.reduce((acc, item) => {
        const rarity = item.rarity.toLowerCase()
        acc[rarity] = (acc[rarity] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const rarityData = Object.entries(rarityDistribution)
        .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: RARITY_COLORS[name as RarityType]?.bg.match(/\[(.*?)\]/)?.[1] || "#ffffff"
        }))
        .sort((a, b) => (RARITY_ORDER[b.name.toLowerCase()] || 0) - (RARITY_ORDER[a.name.toLowerCase()] || 0))

    // Process Supply Distribution (Total supply per rarity)
    const supplyDistribution = items.reduce((acc, item) => {
        const rarity = item.rarity.toLowerCase()
        acc[rarity] = (acc[rarity] || 0) + item.supplyLimit
        return acc
    }, {} as Record<string, number>)

    const supplyData = Object.entries(supplyDistribution)
        .map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            value,
            color: RARITY_COLORS[name as RarityType]?.bg.match(/\[(.*?)\]/)?.[1] || "#ffffff"
        }))
        .sort((a, b) => (RARITY_ORDER[b.name.toLowerCase()] || 0) - (RARITY_ORDER[a.name.toLowerCase()] || 0))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
            <Card className="p-6 md:p-8 border-primary/10 bg-background/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Rarity Diversity
                </h4>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={rarityData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {rarityData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(234, 179, 8, 0.2)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4 opacity-40 text-center">
                    Template variation by rarity tier
                </p>
            </Card>

            <Card className="p-6 md:p-8 border-primary/10 bg-background/40 backdrop-blur-xl rounded-3xl overflow-hidden">
                <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tight mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Supply Distribution
                </h4>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={supplyData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {supplyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} stroke={entry.color} strokeWidth={2} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(234, 179, 8, 0.2)', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontWeight: '900', textTransform: 'uppercase' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                formatter={(value) => <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">{value}</span>}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4 opacity-40 text-center">
                    Total minted capacity per rarity
                </p>
            </Card>
        </div>
    )
}

function ItemCard({ item }: { item: MintItem }) {
    const rarityColor = RARITY_COLORS[item.rarity.toLowerCase() as RarityType] || RARITY_COLORS.common
    const RarityIcon = RARITY_ICONS[item.rarity.toLowerCase()] || Package
    const percentage = item.supplyLimit > 0 ? Math.round((item.minted / item.supplyLimit) * 100) : 0
    const rarityClasses = getRarityClasses(item.rarity)

    return (
        <Card className={`relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 bg-background/40 backdrop-blur-xl border-primary/10 flex flex-col h-[420px] md:h-[480px]`}>
            {/* Background Glow based on rarity */}
            <div className={`absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity ${rarityColor.bg}`} />

            {/* Rarity Header */}
            <div className="absolute top-4 left-4 z-20">
                <Badge className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase italic tracking-[0.15em] border-2 shadow-lg ${rarityClasses}`}>
                    <RarityIcon className="w-3.5 h-3.5 mr-2 inline" />
                    {item.rarity}
                </Badge>
            </div>

            {/* Image Section - The Main Focus */}
            <div className="relative flex-1 flex items-center justify-center p-8 overflow-hidden">
                {/* Image background aura */}
                <div className={`absolute w-40 h-40 rounded-full blur-[80px] opacity-20 ${rarityColor.bg}`} />

                {item.imageUrl ? (
                    <div className="relative z-10 w-full h-full transform group-hover:scale-110 transition-transform duration-700 ease-out">
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                        />
                    </div>
                ) : (
                    <div className="relative z-10 w-32 h-32 text-primary/20 flex items-center justify-center border-2 border-dashed border-primary/10 rounded-3xl">
                        <Package className="w-16 h-16" />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="relative z-10 p-6 pt-0 mt-auto bg-gradient-to-t from-background/80 via-background/40 to-transparent">
                <h4 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-4 line-clamp-1 group-hover:text-primary transition-colors">
                    {item.name}
                </h4>

                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Minted</p>
                        <p className="text-xl md:text-2xl font-black">{item.minted.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Supply</p>
                        <p className="text-xl md:text-2xl font-black">{item.supplyLimit > 0 ? item.supplyLimit.toLocaleString() : "∞"}</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Saturation</span>
                        <span className={`text-sm md:text-base font-black italic ${getRarityTextClass(item.rarity)}`}>{percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden p-[1px]">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${rarityColor.bg} ${rarityColor.glow} ring-1 ring-white/10`}
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Corner Decorative Element */}
            <div className="absolute bottom-0 right-0 w-16 h-16 opacity-5 pointer-events-none overflow-hidden">
                <div className="absolute bottom-[-20%] right-[-20%] w-full h-full rotate-45 bg-primary" />
            </div>
        </Card>
    )
}

