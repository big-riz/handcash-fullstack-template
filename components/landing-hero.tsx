"use client"

import { Rocket, ShieldCheck, Gift, Star } from "lucide-react"

export function LandingHero() {
  return (
    <div className="relative pt-20 pb-16 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-primary/5 blur-[120px] rounded-[100%] -z-10" />

      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Gift className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Limited Drop: Eastern Treasure</span>
        </div>

        <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter uppercase italic leading-[0.8] animate-in fade-in slide-in-from-top-8 duration-1000">
          Eastern <br />
          <span className="text-primary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">Treasure</span>
        </h1>

        <p className="text-xl md:text-3xl text-foreground max-w-3xl mx-auto font-black mb-12 leading-tight animate-in fade-in duration-1000 delay-300 uppercase italic">
          Own the archive. <span className="text-primary italic">Rule the underground.</span>
          <span className="block mt-4 text-muted-foreground text-base md:text-lg font-medium tracking-normal normal-case not-italic">
            Ultra-rare 3D artifacts and street gear stored on-chain. Each piece is a unique digital asset with full ownership rights and provable scarcity.
          </span>
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">True Ownership</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Secured by HandCash. Your gear stays in your vault, ready to trade, sell, or flex at any time.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Gift className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">Early Game Access</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">As a bonus, collectors gain exclusive access to the Slavic Survivors early-access build to support the project.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">Rarity Locked</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Strict supply caps enforced by smart contracts. Once they're gone, they're gone forever.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
