"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LandingHero } from "@/components/landing-hero"
import { TrustSection } from "@/components/trust-section"
import { AppFooter } from "@/components/app-footer"
import { useAuth } from "@/lib/auth-context"
import { Wallet } from "lucide-react"

export function LandingContent() {
  const [isMounted, setIsMounted] = useState(false)
  const { login } = useAuth()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleConnect = async () => {
    await login()
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow pb-20">
        <LandingHero />

        <div className="flex flex-col items-center justify-center mb-24 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-primary/50 to-primary rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <Button
              size="lg"
              className="relative rounded-full h-24 px-12 text-3xl font-black uppercase italic tracking-tighter shadow-2xl hover:scale-105 transition-all bg-foreground text-background"
              onClick={handleConnect}
            >
              <Wallet className="w-8 h-8 mr-4" />
              Join the Underground
            </Button>
          </div>
          <p className="mt-8 text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">
            Powered by HandCash Wallet
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent mb-24" />
          <TrustSection />
        </div>
      </div>
      <AppFooter />
    </div>
  )
}

