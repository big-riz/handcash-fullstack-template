"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Zap, CheckCircle2, AlertCircle, ShoppingBag, RotateCcw, ShieldCheck } from "lucide-react"
import { usePayments } from "@/hooks/use-payments"
import { toast } from "sonner"

type MintState = "IDLE" | "PAYING" | "CONFIRMING" | "MINTING" | "SUCCESS" | "ERROR"

interface MintedItem {
    id: string
    name: string
    imageUrl: string
    multimediaUrl?: string
    rarity: string
    origin: string
}

export function MintModule() {
    const { balance, fetchBalance } = usePayments()
    const [mintState, setMintState] = useState<MintState>("IDLE")
    const [statusText, setStatusText] = useState("")
    const [mintedItem, setMintedItem] = useState<MintedItem | null>(null)
    const [errorMsg, setErrorMsg] = useState("")

    const PRICE_USD = 0.25
    const PRICE_BSV_EST = 0.000005 // This should ideally be calculated dynamically if possible, but static for display is okay with disclaimer

    const handleMint = async () => {
        // 1. Check Balance locally
        const bsvBalance = balance?.spendableBalances?.items?.find(i => i.currencyCode === "BSV")?.spendableBalance || 0
        // Rough check, strict check happens on backend or better pre-check
        // Assuming 0.25 USD is roughly 0.005 BSV (actually much less, 0.25 is approx 0.00005 BSV at $100/BSV, wait $50/BSV => 0.005. At $50/BSV 1 BSV = $50. $0.25 = 0.005 BSV. At $100 BSV -> 0.0025. At $500k BSV -> ...)
        // Let's rely on the USD amount for UI and let backend fail if insufficient.

        setMintState("PAYING")
        setStatusText("Creating payment request...")
        setErrorMsg("")

        try {
            // 2. Call API
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
                // Trigger generic confetti if available or just rely on the UI state
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
    }

    return (
        <Card className="rounded-[2.5rem] border-white/10 overflow-hidden bg-card/40 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full relative group transition-all duration-500 hover:shadow-primary/10">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -z-10 group-hover:bg-primary/30 transition-colors" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/20 blur-3xl -z-10" />

            <div className="p-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

            <div className="p-8 md:p-10">
                {/* Header / Price Display */}
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">Available Now</h2>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">${PRICE_USD.toFixed(2)}</span>
                            <span className="text-lg text-muted-foreground font-bold italic uppercase tracking-wider">USD</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <Badge className="h-10 px-4 rounded-2xl gap-2 bg-primary text-primary-foreground border-none font-bold text-sm shadow-lg shadow-primary/20">
                            <Zap className="w-4 h-4 fill-current" />
                            INSTANT
                        </Badge>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">No Waiting</span>
                    </div>
                </div>

                {/* Main Canvas Area */}
                <div className="aspect-square rounded-[2rem] bg-muted/20 border border-border/50 mb-10 relative flex items-center justify-center overflow-hidden group/canvas">
                    {/* Animated grid background for canvas */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                    {mintState === "IDLE" && (
                        <div className="text-center p-6 transition-all duration-700 group-hover/canvas:scale-110">
                            <div className="w-32 h-32 glass rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl relative overflow-hidden">
                                <ShoppingBag className="w-12 h-12 text-primary animate-float" />
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
                            </div>
                            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-2">Mystery Gear</h3>
                            <p className="text-sm font-medium text-muted-foreground max-w-[200px] mx-auto opacity-80">
                                Rare & Legendary items
                                waiting to be claimed.
                            </p>
                        </div>
                    )}

                    {(mintState === "PAYING" || mintState === "MINTING") && (
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-xl flex flex-col items-center justify-center z-10 p-10 text-center animate-in fade-in duration-300">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-8" />
                                <ShoppingBag className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4" />
                            </div>
                            <p className="font-black text-2xl uppercase italic tracking-tighter animate-pulse">{statusText}</p>
                            <div className="mt-8 flex gap-3">
                                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${["PAYING", "MINTING"].includes(mintState) ? "bg-primary scale-125 shadow-[0_0_12px_rgba(var(--primary),0.5)]" : "bg-muted"}`} />
                                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${mintState === "MINTING" ? "bg-primary scale-125 shadow-[0_0_12px_rgba(var(--primary),0.5)]" : "bg-muted"}`} />
                                <div className="w-3 h-3 rounded-full bg-muted" />
                            </div>
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

                {/* Action Button */}
                <div className="relative">
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
                        <Button
                            size="lg"
                            className="w-full rounded-[1.5rem] font-black uppercase italic text-2xl h-20 shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] hover:shadow-primary/40 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 transition-all active:scale-[0.98]"
                            onClick={handleMint}
                            disabled={mintState !== "IDLE" || !balance}
                        >
                            {mintState === "IDLE" ? "Confirm Mint" : "Processing..."}
                        </Button>
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
        </Card>
    )
}
