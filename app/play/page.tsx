"use client"

import { SlavicSurvivors } from "@/components/game/SlavicSurvivors"
import { useAuth } from "@/lib/auth-context"
import { ShieldAlert, RotateCcw } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function PlayPage() {
    const { user, isLoading } = useAuth()
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null)
    const [authReason, setAuthReason] = useState<string | null>(null)
    const [checkingAccess, setCheckingAccess] = useState(false)

    useEffect(() => {
        const checkAccess = async () => {
            if (isLoading) return // Wait for auth to resolve first

            if (!user) {
                setIsAuthorized(false)
                setAuthReason("You must be authenticated to play")
                return
            }

            // Allow localhost bypass
            const hostname = typeof window !== "undefined" ? window.location.hostname : ""
            if (hostname === "localhost" || hostname === "127.0.0.1") {
                setIsAuthorized(true)
                return
            }

            setCheckingAccess(true)
            try {
                const response = await fetch("/api/game/check-access")
                const data = await response.json()

                console.log("[Play Page] Access check response:", data)

                if (data.success && data.authorized) {
                    console.log("[Play Page] ✓ Access granted")
                    setIsAuthorized(true)
                    setAuthReason(null)
                } else {
                    console.log("[Play Page] ✗ Access denied:", data.reason)
                    setIsAuthorized(false)
                    setAuthReason(data.reason || "You do not possess the required collection item")
                }
            } catch (err) {
                console.error("[Play Page] Access check failed:", err)
                setIsAuthorized(false)
                setAuthReason("Failed to verify access. Please try again.")
            } finally {
                setCheckingAccess(false)
            }
        }

        checkAccess()
    }, [user, isLoading])

    const handleRetry = () => {
        setIsAuthorized(null)
        setAuthReason(null)
        window.location.reload()
    }

    const showBlocker = !isLoading && isAuthorized === false

    return (
        <div className="full-viewport overflow-hidden bg-black prevent-pull-refresh">
            <SlavicSurvivors />

            {/* Access Denied Popup */}
            {showBlocker && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center z-[100] animate-in fade-in duration-700">
                    <div className="bg-red-500/10 border-4 border-red-500/20 p-12 rounded-[4rem] max-w-2xl w-full shadow-[0_0_100px_rgba(220,38,38,0.2)] relative overflow-hidden">
                        <div className="absolute -top-24 -left-24 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />
                        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-[80px]" />

                        <div className="mb-8 p-6 bg-red-500/20 rounded-full w-fit mx-auto ring-8 ring-red-500/5">
                            <ShieldAlert className="w-16 h-16 text-red-500" />
                        </div>

                        <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none">
                            ACCESS <span className="text-red-500">DENIED</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-white/60 font-medium mb-10 leading-relaxed uppercase tracking-widest">
                            {authReason || "You do not possess the necessary relic to enter these lands."}
                        </p>

                        <div className="flex flex-col gap-4">
                            {!user ? (
                                <Link
                                    href="/"
                                    className="h-20 text-xl font-black uppercase rounded-3xl border-2 border-white/10 hover:bg-white/5 bg-transparent text-white flex items-center justify-center transition-colors"
                                >
                                    Return to Home & Sign In
                                </Link>
                            ) : (
                                <button
                                    onClick={handleRetry}
                                    disabled={checkingAccess}
                                    className="h-20 text-xl font-black uppercase rounded-3xl border-2 border-white/10 hover:bg-white/5 bg-transparent text-white flex items-center justify-center transition-colors disabled:opacity-50"
                                >
                                    <RotateCcw className="w-6 h-6 mr-3" /> {checkingAccess ? "Checking..." : "Retry Check"}
                                </button>
                            )}
                            <p className="text-xs text-white/20 uppercase tracking-[0.3em] font-mono mt-4">
                                Required: {!user ? "HandCash Authentication" : "Collection Item"}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading state */}
            {(isLoading || (user && isAuthorized === null)) && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[100]">
                    <div className="text-white text-2xl uppercase tracking-widest font-black">
                        {checkingAccess ? "Verifying Access..." : "Loading..."}
                    </div>
                </div>
            )}
        </div>
    )
}
