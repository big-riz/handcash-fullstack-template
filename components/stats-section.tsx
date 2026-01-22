"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Package, DollarSign, Sparkles, Loader2, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                <p className="text-muted-foreground font-mono animate-pulse">EXTRACTING METRIC DATA...</p>
            </div>
        );
    }

    return (
        <div className="py-24 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center mb-16">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Mint Economics</h2>
                <div className="h-1.5 w-24 bg-primary mb-6" />
                <p className="text-muted-foreground text-center max-w-xl font-medium">
                    Supply and demand analysis of the Gopnik ecosystem. Real-time depletion metrics per mint.
                </p>
            </div>

            {pools.map((pool) => (
                <div key={pool.poolName} className="mb-20">
                    {/* Pool Header Card */}
                    <Card className="p-8 rounded-[3rem] border-primary/20 bg-primary/5 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <TrendingUp className="w-32 h-32" />
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                            <div>
                                <Badge className="mb-2 bg-primary text-background font-black italic uppercase rounded-full">
                                    Active Mint
                                </Badge>
                                <h3 className="text-4xl font-black italic uppercase tracking-tight">{pool.poolName}</h3>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Total Minted</span>
                                    <span className="text-3xl font-black">{pool.totalMinted.toLocaleString()}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Collection Cap</span>
                                    <span className="text-3xl font-black">{pool.totalSupplyLimit > 0 ? pool.totalSupplyLimit.toLocaleString() : "∞"}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Depletion</span>
                                    <span className="text-3xl font-black text-primary">
                                        {pool.totalSupplyLimit > 0
                                            ? `${((pool.totalMinted / pool.totalSupplyLimit) * 100).toFixed(1)}%`
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {pool.totalSupplyLimit > 0 && (
                            <div className="mt-8">
                                <Progress value={(pool.totalMinted / pool.totalSupplyLimit) * 100} className="h-3 rounded-full bg-primary/20" />
                            </div>
                        )}
                    </Card>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pool.items.map((item) => (
                            <Card key={item.id} className="p-6 rounded-[2.5rem] border-border/50 bg-muted/20 flex flex-col group hover:border-primary/30 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-muted group-hover:scale-105 transition-transform duration-500 shrink-0">
                                        {item.imageUrl ? (
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground font-black text-xs uppercase">
                                                No PKL
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black italic uppercase text-lg truncate group-hover:text-primary transition-colors">{item.name}</h4>
                                        <Badge variant="outline" className="text-[9px] rounded-full uppercase font-bold tracking-widest mt-1 opacity-60">
                                            {item.rarity}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">MINTED</span>
                                            <span className="text-xl font-black">{item.minted.toLocaleString()}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">REMAINING</span>
                                            <span className={`text-xl font-black ${item.remaining === 0 ? "text-red-500" : ""}`}>
                                                {item.remaining.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>

                                    {(item.supplyLimit || 0) > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest opacity-50">
                                                <span>Mint Progress</span>
                                                <span>{Math.round((item.minted / item.supplyLimit) * 100)}%</span>
                                            </div>
                                            <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden p-0.5 border border-white/5">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                                    style={{ width: `${(item.minted / item.supplyLimit) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 py-2 px-3 bg-primary/10 rounded-xl">
                                            <Info className="w-3 h-3 text-primary shrink-0" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Unlimited Recruitment</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ))}

            {pools.length === 0 && (
                <div className="text-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-20" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest italic">No economics data available yet.</p>
                </div>
            )}
        </div>
    )
}
