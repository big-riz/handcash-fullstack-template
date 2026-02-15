
"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle, ShoppingBag, ArrowRight, ExternalLink } from "lucide-react"
import { getRarityClasses } from "@/lib/rarity-colors"
import { toast } from "sonner"

function MintCompleteContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const intentId = searchParams.get("intentId")

    const [status, setStatus] = useState<"loading" | "pending_payment" | "paid" | "activated" | "failed" | "not_found">("loading")
    const [mintedItem, setMintedItem] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [retryCount, setRetryCount] = useState(0)

    useEffect(() => {
        if (!intentId) {
            setStatus("not_found")
            return
        }

        let isMounted = true
        const checkStatus = async () => {
            try {
                const res = await fetch(`/api/mint/status?intentId=${intentId}`)
                if (!res.ok) {
                    if (res.status === 404) {
                        setStatus("not_found")
                        return
                    }
                    throw new Error("Failed to check status")
                }
                const data = await res.json()
                if (!isMounted) return

                setStatus(data.status)
                if (data.item) {
                    setMintedItem(data.item)
                }

                // If not activated and not failed, poll
                if (data.status !== "activated" && data.status !== "failed" && data.status !== "completed") {
                    setTimeout(() => setRetryCount(prev => prev + 1), 2000)
                }
            } catch (err: any) {
                console.error("Status check error:", err)
                setError(err.message)
                setTimeout(() => setRetryCount(prev => prev + 1), 5000)
            }
        }

        checkStatus()
        return () => { isMounted = false }
    }, [intentId, retryCount])

    if (status === "not_found") {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h1 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Order Not Found</h1>
                <p className="text-muted-foreground mb-8">We couldn't find a record of this mint intent.</p>
                <Button onClick={() => router.push("/")} className="rounded-2xl px-8 h-12 font-bold uppercase italic">
                    Back to Archive
                </Button>
            </div>
        )
    }

    const isSuccess = status === "activated" || status === "completed"

    return (
        <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-12">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--primary)_0%,_transparent_40%)] opacity-10 pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--primary)_0%,_transparent_40%)] opacity-5 pointer-events-none" />

            <div className="max-w-4xl w-full relative z-10">
                {!isSuccess ? (
                    <Card className="glass border-border/50 p-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 animate-pulse" />
                            <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-4">
                            {status === "paid" ? "Fulfilling Mint..." : "Confirming Payment..."}
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md mx-auto">
                            {status === "paid"
                                ? "Your payment was received! We are now minting your randomized collectible to your HandCash wallet."
                                : "We're waiting for HandCash to confirm your payment. This usually takes just a few seconds."}
                        </p>

                        <div className="mt-12 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Real-time Status: {status.replace("_", " ").toUpperCase()}
                        </div>
                    </Card>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        {/* Hero Visual */}
                        <div className="w-full lg:w-1/2 aspect-square relative group">
                            <div className="absolute -inset-10 bg-primary/20 blur-[120px] rounded-full animate-pulse-slow opacity-60" />
                            <Card className="w-full h-full relative z-10 overflow-hidden bg-black/40 border-primary/20 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
                                {mintedItem?.multimediaUrl ? (
                                    <model-viewer
                                        src={mintedItem.multimediaUrl}
                                        poster={mintedItem.imageUrl}
                                        alt={mintedItem.itemName}
                                        auto-rotate
                                        camera-controls
                                        touch-action="pan-y"
                                        shadow-intensity="1"
                                        class="w-full h-full"
                                        style={{ width: "100%", height: "100%", "--poster-color": "transparent" }}
                                    />
                                ) : (
                                    <img
                                        src={mintedItem?.imageUrl}
                                        alt={mintedItem?.itemName}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                                    />
                                )}
                            </Card>
                        </div>

                        {/* Success Details */}
                        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div className="flex items-center gap-3 mb-6 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-500 animate-in slide-in-from-left-4 duration-700">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-bold text-sm uppercase tracking-widest italic">Minting Complete</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-6">
                                Order <span className="text-primary tracking-[-0.05em]">Fulfilled</span>
                            </h1>

                            <Badge className={`mb-6 px-8 py-2 rounded-full font-black text-sm tracking-[0.25em] uppercase border-2 shadow-xl ${getRarityClasses(mintedItem?.rarity || "Rare")}`}>
                                {mintedItem?.rarity || "RARE"}
                            </Badge>

                            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight mb-4">{mintedItem?.itemName}</h2>

                            <p className="text-lg text-muted-foreground mb-10 max-w-md">
                                Your artifact has been minted and is now available in your HandCash wallet.
                                View it in the inventory tab or on the HandCash dashboard.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                                <Button
                                    className="h-16 rounded-2xl font-black uppercase italic text-lg group bg-white text-black hover:bg-white/90 transition-all shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
                                    onClick={() => router.push("/")}
                                >
                                    Done <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-16 rounded-2xl font-black uppercase italic text-lg border-border/50 bg-muted/20 hover:bg-muted/40 transition-all"
                                    onClick={() => window.open(`https://app.handcash.io/inventory`, "_blank")}
                                >
                                    Wallet <ExternalLink className="ml-2 w-5 h-5 opacity-50" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Success Confetti Effect (Conceptual placeholder) */}
            {isSuccess && (
                <div className="fixed inset-0 pointer-events-none z-50">
                    {/* Particles would go here or be triggered via library */}
                </div>
            )}
        </div>
    )
}

export default function MintCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
        }>
            <MintCompleteContent />
        </Suspense>
    )
}
