"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LandingHero } from "@/components/landing-hero"
import { StatsSection } from "@/components/stats-section"
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
              className="relative rounded-full h-14 px-6 text-lg font-black uppercase italic tracking-tighter shadow-2xl transition-all bg-foreground text-background sm:h-20 sm:px-10 sm:text-2xl md:h-24 md:px-12 md:text-3xl md:hover:scale-105"
              onClick={handleConnect}
            >
              <Wallet className="w-5 h-5 mr-3 sm:w-7 sm:h-7 sm:mr-4 md:w-8 md:h-8" />
              Mint Now
            </Button>
          </div>
          <p className="mt-8 text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">
            Powered by HandCash Wallet
          </p>
        </div>

        <div className="container mx-auto px-4 max-w-5xl">
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-border to-transparent mb-24" />
          <StatsSection />
        </div>
      </div>
      <AppFooter />
    </div>
  )
}
