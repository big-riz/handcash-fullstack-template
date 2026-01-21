"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Users, Package, DollarSign, Sparkles, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface StatsType {
    totalItems: number;
    totalMoneySpent: number;
    uniqueMinters: number;
    topItems: Array<{
        itemName: string;
        count: number;
        imageUrl?: string;
        rarity?: string;
    }>;
}

export function TrustSection() {
    const [stats, setStats] = useState<StatsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch("/api/stats");
                const data = await response.json();
                if (data.stats) {
                    setStats(data.stats);
                }
            } catch (error) {
                console.error("Failed to fetch landing stats:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const milestoneGoal = 5000;
    const progress = stats ? Math.min((stats.totalItems / milestoneGoal) * 100, 100) : 0;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary/50" />
                <p className="text-muted-foreground font-mono animate-pulse">CRUNCHING DATA...</p>
            </div>
        );
    }

    return (
        <div className="py-24 animate-in fade-in duration-1000">
            <div className="flex flex-col items-center mb-16">
                <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">Live Progress</h2>
                <div className="h-1.5 w-24 bg-primary mb-6" />
                <p className="text-muted-foreground text-center max-w-xl font-medium">
                    The underworld is expanding. Real-time metrics from the Squat Zone Deux recruitment efforts.
                </p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                <Card className="p-8 rounded-3xl border-border/50 bg-muted/20 flex flex-col items-center text-center group hover:border-primary/50 transition-colors">
                    <div className="p-4 bg-primary/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                        <Package className="w-8 h-8 text-primary" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter mb-1">{stats?.totalItems.toLocaleString() || 0}</span>
                    <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">TOTAL MINTS</span>
                </Card>

                <Card className="p-8 rounded-3xl border-border/50 bg-muted/20 flex flex-col items-center text-center group hover:border-emerald-500/50 transition-colors">
                    <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                        <DollarSign className="w-8 h-8 text-emerald-500" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter mb-1">${stats?.totalMoneySpent.toFixed(2) || "0.00"}</span>
                    <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">TOTAL CONTRIBUTED</span>
                </Card>

                <Card className="p-8 rounded-3xl border-border/50 bg-muted/20 flex flex-col items-center text-center group hover:border-blue-500/50 transition-colors">
                    <div className="p-4 bg-blue-500/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                        <Users className="w-8 h-8 text-blue-500" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter mb-1">{stats?.uniqueMinters || 0}</span>
                    <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">UNIQUE GOPNIKS</span>
                </Card>

                <Card className="p-8 rounded-3xl border-border/50 bg-muted/20 flex flex-col items-center text-center group hover:border-orange-500/50 transition-colors">
                    <div className="p-4 bg-orange-500/10 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-8 h-8 text-orange-500" />
                    </div>
                    <span className="text-4xl font-black tracking-tighter mb-1">{progress.toFixed(1)}%</span>
                    <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground">ALPHA MILESTONE</span>
                </Card>
            </div>

            {/* Top Items Section */}
            {stats && stats.topItems.length > 0 && (
                <div className="mt-20">
                    <h3 className="text-xl font-black uppercase italic tracking-wider mb-8 flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-primary" />
                        Most Wanted Gear
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                        {stats.topItems.map((item, idx) => (
                            <div key={idx} className="relative group rounded-2xl border border-border/40 overflow-hidden bg-muted/10 hover:bg-muted/20 transition-all p-3">
                                <div className="aspect-square rounded-xl overflow-hidden bg-muted/20 mb-3 border border-border/20">
                                    {item.imageUrl && (
                                        <img src={item.imageUrl} alt={item.itemName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-bold uppercase tracking-tighter truncate mb-1">{item.itemName}</p>
                                    <Badge variant="outline" className="text-[9px] rounded-full h-4 bg-background px-1.5 border-primary/20">{item.count} MINTS</Badge>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-24 max-w-3xl mx-auto">
                <div className="flex justify-between items-end mb-4">
                    <div className="flex flex-col">
                        <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-1">RECRUITMENT PROGRESS</span>
                        <span className="text-3xl font-black tracking-tighter">{stats?.totalItems.toLocaleString() || 0} / {milestoneGoal.toLocaleString()}</span>
                    </div>
                    <span className="text-sm font-bold opacity-70 italic">{(stats?.totalItems || 0) < milestoneGoal ? "ALPHA RELEASE INCOMING..." : "ALPHA REACHED"}</span>
                </div>
                <div className="relative h-12 w-full bg-muted/30 rounded-full border border-border/50 p-2 overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-primary/80 via-primary to-primary rounded-full transition-all duration-1000 ease-out flex items-center justify-end px-4 shadow-[0_0_20px_rgba(var(--primary),0.5)]"
                        style={{ width: `${progress}%` }}
                    >
                        {progress > 10 && <span className="text-[10px] font-black italic text-background">PHASE ONE</span>}
                    </div>
                </div>
            </div>
        </div>
    )
}
