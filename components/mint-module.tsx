"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, CheckCircle2, AlertCircle, ShoppingBag, RotateCcw, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { usePayments } from "@/hooks/use-payments"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useRef } from "react"
import { toast } from "sonner"
import { getRarityClasses } from "@/lib/rarity-colors"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type MintState = "IDLE" | "PAYING" | "CONFIRMING" | "MINTING" | "SUCCESS" | "ERROR"

interface MintedItem {
    id: string
    name: string
    imageUrl: string
    multimediaUrl?: string
    rarity: string
    origin: string
}

// Cookie helper functions
function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
}

function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return
    const expires = new Date(Date.now() + days * 864e5).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

export function MintModule() {
    const { balance, fetchBalance } = usePayments()
    const [mintState, setMintState] = useState<MintState>("IDLE")
    const [statusText, setStatusText] = useState("")
    const [mintedItem, setMintedItem] = useState<MintedItem | null>(null)
    const [errorMsg, setErrorMsg] = useState("")
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [mintStats, setMintStats] = useState<any>(null)
    const [isLoadingStats, setIsLoadingStats] = useState(true)

    const [shuffledItems, setShuffledItems] = useState<any[]>([])
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, dragFree: false, duration: 20 })

    const PRICE_USD = 0.05
    const PRICE_BSV_EST = 0.000001 // Updated estimate for 5 cents

    const fetchMintStats = async () => {
        setIsLoadingStats(true)
        try {
            const response = await fetch("/api/pool-stats")
            const data = await response.json()
            if (data.success && data.pools) {
                // Find default pool
                const defaultPool = data.pools.find((p: any) => p.poolName === "default")
                if (defaultPool && defaultPool.items) {
                    // Shuffle items
                    const shuffled = [...defaultPool.items].sort(() => Math.random() - 0.5)
                    setShuffledItems(shuffled)
                }
                setMintStats(defaultPool)
            }
        } catch (error) {
            console.error("Failed to fetch mint stats:", error)
        } finally {
            setIsLoadingStats(false)
        }
    }

    // Constant auto-scroll
    useEffect(() => {
        if (!emblaApi || (mintState !== "IDLE" && mintState !== "PAYING")) return

        const interval = setInterval(() => {
            emblaApi.scrollNext()
        }, 2000) // Auto-scroll every 2 seconds

        return () => clearInterval(interval)
    }, [emblaApi, mintState])



    // Wheel of fortune animation during minting
    useEffect(() => {
        if (!emblaApi || mintState !== "MINTING") return

        // Wheel of fortune animation: speed up then slow down
        const spinAnimation = async () => {
            // Phase 1: Speed up (fast scrolling)
            for (let i = 0; i < 15; i++) {
                await new Promise(resolve => setTimeout(resolve, 80))
                emblaApi.scrollNext()
            }

            // Phase 2: Slow down gradually
            const slowdownSteps = [120, 180, 250, 400, 600, 900]
            for (const delay of slowdownSteps) {
                await new Promise(resolve => setTimeout(resolve, delay))
                emblaApi.scrollNext()
            }

            // Phase 3: Final stop
            await new Promise(resolve => setTimeout(resolve, 800))
        }

        spinAnimation()
    }, [emblaApi, mintState])

    useEffect(() => {
        fetchMintStats()
    }, [])

    const handleMintClick = () => {
        setShowConfirmDialog(true)
    }

    const performMint = async () => {
        setShowConfirmDialog(false)

        setMintState("PAYING")
        setStatusText("Creating payment request...")
        setErrorMsg("")

        try {
            setStatusText("Processing payment...")

            const response = await fetch("/api/mint", {
                method: "POST",
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || "Minting failed")
            }

            setStatusText("Minting item...")
            setMintState("MINTING")

            const data = await response.json()

            // Simulate/wait for animation
            await new Promise(r => setTimeout(r, 1500))

            if (data.success) {
                setMintedItem(data.item)
                setMintState("SUCCESS")
                fetchBalance() // Refresh balance
                toast.success("Item minted successfully!")
            } else {
                throw new Error("Minting response invalid")
            }

        } catch (err: any) {
            console.error(err)
            setMintState("ERROR")
            setErrorMsg(err.message || "An unexpected error occurred")
        }
    }

    const reset = () => {
        setMintState("IDLE")
        setMintedItem(null)
        setStatusText("")
        fetchMintStats() // Refresh stats after minting
    }

    return (
        <Card className="rounded-[2.5rem] border-white/10 overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full relative group transition-all duration-500 hover:shadow-primary/10">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10 group-hover:bg-primary/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-3xl -z-10" />

            <div className="p-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="p-responsive">
                {/* Header Area */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-10 gap-4">
                    <div>
                        <h2 className="text-fluid-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Limited Edition</h2>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-fluid-lg md:text-fluid-xl font-black uppercase italic tracking-tighter">Collection Live</span>
                        </div>
                    </div>
                    <Badge className="h-7 md:h-8 px-2.5 md:px-3 rounded-full gap-1.5 bg-primary/10 text-primary border-primary/20 font-bold text-[9px] md:text-[10px] tracking-widest">
                        <Zap className="w-2.5 md:w-3 h-2.5 md:h-3 fill-current" />
                        INSTANT MINT
                    </Badge>
                </div>

                {/* Supply Progress Bar */}
                {mintStats && mintStats.totalSupplyLimit > 0 && (
                    <div className="mb-6 md:mb-8 animate-in fade-in slide-in-from-top-2 duration-1000">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-fluid-xs font-black uppercase tracking-[0.2em] text-primary">Mint Progress</span>
                            <span className="text-fluid-xs font-bold text-muted-foreground uppercase opacity-60">
                                {mintStats.totalMinted} / {mintStats.totalSupplyLimit}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-primary/10 rounded-full border border-primary/5 overflow-hidden p-0.5">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.5)]"
                                style={{ width: `${Math.min(100, (mintStats.totalMinted / mintStats.totalSupplyLimit) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Main Canvas Area */}
                <div className="aspect-square rounded-2xl md:rounded-[2rem] bg-muted/20 border border-border/50 mb-6 md:mb-10 relative flex items-center justify-center overflow-hidden group/canvas">
                    {/* Animated grid background for canvas */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {(mintState === "IDLE" || mintState === "PAYING" || mintState === "MINTING") && shuffledItems.length > 0 && (
                        <div className="absolute inset-0 group/carousel cursor-grab active:cursor-grabbing select-none">
                            <div className="w-full h-full overflow-hidden" ref={emblaRef}>
                                <div className="flex h-full gap-3 md:gap-5">
                                    {/* Create enough duplicates for smooth animation (at least 20 items) */}
                                    {Array.from({ length: Math.max(20, shuffledItems.length * 3) }, (_, i) => shuffledItems[i % shuffledItems.length]).map((item: any, idx: number) => (
                                        <div key={`${item.id}-${idx}`} className="flex-[0_0_100%] min-w-0 h-full flex flex-col items-center justify-center px-2 relative group/item bg-gradient-to-b from-primary/5 via-background to-background select-none">
                                            {/* Accent Glow */}
                                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-0 group-hover/item:opacity-10 transition-opacity duration-1000" />

                                            <div className="relative w-full flex-grow flex items-center justify-center min-h-0 mb-4 md:mb-8">
                                                <div className="absolute -inset-6 md:-inset-10 bg-primary/5 blur-[60px] md:blur-[100px] rounded-full opacity-50" />
                                                <img
                                                    src={item.imageUrl}
                                                    alt="Mystery Item"
                                                    className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 object-cover rounded-2xl md:rounded-[2.5rem] relative z-10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] md:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10 transition-transform duration-1000"
                                                    draggable={false}
                                                />
                                            </div>

                                            {/* Only show details during MINTING state */}
                                            {mintState === "MINTING" && (
                                                <div className="z-20 flex flex-col items-center w-full">
                                                    <Badge className={`mb-3 md:mb-4 px-4 md:px-6 py-1 border rounded-full font-black text-[9px] md:text-[10px] tracking-[0.2em] uppercase ${getRarityClasses(item.rarity)}`}>
                                                        {item.rarity.toUpperCase()}
                                                    </Badge>
                                                    <h3 className="text-fluid-2xl md:text-fluid-3xl font-black text-center tracking-tight uppercase italic opacity-60 group-hover/item:opacity-100 transition-opacity px-4">
                                                        {item.name}
                                                    </h3>
                                                </div>
                                            )}

                                            {/* Mystery placeholder for IDLE and PAYING states */}
                                            {(mintState === "IDLE" || mintState === "PAYING") && (
                                                <div className="z-40 flex flex-col items-center w-full">
                                                    <div className="text-6xl md:text-9xl font-black text-primary/40 animate-pulse">
                                                        ?
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Manual Navigation Hints (Gradients) */}
                            <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-60 transition-opacity duration-500" />
                            <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-background to-transparent pointer-events-none opacity-0 group-hover/carousel:opacity-60 transition-opacity duration-500" />
                        </div>
                    )}



                    {mintState === "SUCCESS" && mintedItem && (
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
                            {/* Rare Glow Effect */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--primary)_0%,_transparent_70%)] opacity-20 animate-pulse-slow" />

                            <div className="relative w-full h-full flex flex-col items-center justify-center p-8">
                                <div className="relative mb-6 w-full flex-grow flex items-center justify-center min-h-0">
                                    <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
                                    {mintedItem.multimediaUrl ? (
                                        <div className="w-full h-full relative z-10 min-h-[300px]">
                                            {/* @ts-ignore */}
                                            <model-viewer
                                                src={mintedItem.multimediaUrl}
                                                poster={mintedItem.imageUrl}
                                                alt={mintedItem.name}
                                                auto-rotate
                                                camera-controls
                                                touch-action="pan-y"
                                                shadow-intensity="1"
                                                class="w-full h-full"
                                                style={{ width: '100%', height: '100%', '--poster-color': 'transparent' }}
                                            >
                                                <div slot="poster" className="w-full h-full flex items-center justify-center">
                                                    <img
                                                        src={mintedItem.imageUrl}
                                                        alt={mintedItem.name}
                                                        className="w-48 h-48 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover border-2 border-white/20"
                                                    />
                                                </div>
                                                {/* @ts-ignore */}
                                            </model-viewer>
                                        </div>
                                    ) : (
                                        <img
                                            src={mintedItem.imageUrl}
                                            alt={mintedItem.name}
                                            className="w-48 h-48 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] object-cover border-2 border-white/20 relative z-10"
                                        />
                                    )}
                                </div>

                                <div className="z-20 flex flex-col items-center">
                                    <Badge className="mb-3 px-6 py-1.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 dark:from-yellow-400 dark:to-amber-500 border-none rounded-full font-black text-xs tracking-[0.2em] shadow-xl text-black">
                                        {mintedItem.rarity.toUpperCase()}
                                    </Badge>

                                    <h3 className="text-3xl font-black text-center tracking-tight mb-2 uppercase italic">{mintedItem.name}</h3>
                                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[10px] font-mono text-muted-foreground font-bold tracking-widest">{mintedItem.origin.slice(0, 12).toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mintState === "ERROR" && (
                        <div className="absolute inset-0 bg-destructive/5 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in-95">
                            <div className="w-20 h-20 glass rounded-full flex items-center justify-center mb-6 border-destructive/20">
                                <AlertCircle className="w-10 h-10 text-destructive" />
                            </div>
                            <p className="font-black text-2xl uppercase italic tracking-tighter text-destructive mb-3">System Error</p>
                            <p className="text-sm font-bold text-muted-foreground mb-8 max-w-[200px]">{errorMsg}</p>
                            <Button
                                variant="outline"
                                className="rounded-2xl px-8 h-12 font-bold border-destructive/20 hover:bg-destructive hover:text-destructive-foreground transition-all"
                                onClick={reset}
                            >
                                RELOAD SYSTEM
                            </Button>
                        </div>
                    )}
                </div>

                {/* Action Section */}
                <div className="relative">
                    {mintState === "IDLE" && (
                        <div className="flex flex-col items-center mb-4 md:mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                            <span className="text-fluid-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">Price per mint</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-fluid-5xl md:text-6xl font-black tracking-tighter text-primary group-hover:scale-105 transition-transform duration-500">${PRICE_USD.toFixed(2)}</span>
                                <span className="text-fluid-lg md:text-xl text-muted-foreground font-bold italic uppercase tracking-wider">USD</span>
                            </div>
                        </div>
                    )}
                    {mintState === "SUCCESS" ? (
                        <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4 duration-500">
                            <Button
                                size="lg"
                                className="w-full rounded-[1.5rem] font-black uppercase italic text-xl h-20 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] hover:shadow-primary/40 hover:-translate-y-1 transition-all group"
                                onClick={reset}
                            >
                                <RotateCcw className="w-6 h-6 mr-3 transition-transform group-hover:rotate-180 duration-500" />
                                Mint Another
                            </Button>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="secondary" className="h-14 rounded-2xl font-bold uppercase tracking-wider text-xs border border-border/50">
                                    Collection
                                </Button>
                                <Button variant="secondary" className="h-14 rounded-2xl font-bold uppercase tracking-wider text-xs border border-border/50">
                                    Share Gear
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Button
                                size="lg"
                                className="w-full rounded-[1.5rem] font-black uppercase italic text-2xl h-20 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] hover:shadow-primary/40 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 transition-all active:scale-[0.98]"
                                onClick={handleMintClick}
                                disabled={mintState !== "IDLE" || !balance}
                            >
                                {mintState === "IDLE" ? "Confirm Mint" : "Processing..."}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Secured</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Low Fee</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.1em]">Verified</span>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent className="rounded-3xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black uppercase italic tracking-tight">
                            Confirm Mint
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-base">
                            You're about to mint a random item for <span className="font-bold text-primary">${PRICE_USD.toFixed(2)} USD</span>.
                            <br />
                            <br />
                            This payment will be deducted from your HandCash wallet balance.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={performMint}
                            className="rounded-2xl bg-primary hover:bg-primary/90"
                        >
                            Confirm & Mint
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card >
    )
}
