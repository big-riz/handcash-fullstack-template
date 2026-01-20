"use client"

import { Rocket, ShieldCheck, Gift } from "lucide-react"

export function LandingHero() {
  return (
    <div className="relative pt-20 pb-16 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[500px] bg-primary/5 blur-[120px] rounded-[100%] -z-10" />

      <div className="container mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Rocket className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Mission: Fund the Game</span>
        </div>

        <h1 className="text-6xl md:text-9xl font-black mb-8 tracking-tighter uppercase italic leading-[0.8] animate-in fade-in slide-in-from-top-8 duration-1000">
          Gopnik <br />
          <span className="text-primary drop-shadow-[0_0_30px_rgba(var(--primary),0.3)]">Mint</span>
        </h1>

        <p className="text-xl md:text-3xl text-muted-foreground max-w-3xl mx-auto font-bold mb-12 leading-tight animate-in fade-in duration-1000 delay-300">
          Exclusive street gear for the digital underground.
          <span className="block mt-2 text-foreground/40 text-lg font-medium italic">Funding the next generation of gopnik survival games.</span>
        </p>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Gift className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">Claim Loot</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Unique gopnik collectibles delivered instantly to your HandCash vault.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">Fund Dev</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">100% of proceeds fund milestones for the upcoming survivors-style game.</p>
          </div>

          <div className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Rocket className="w-16 h-16" />
            </div>
            <div className="w-12 h-12 glass rounded-xl flex items-center justify-center mb-6">
              <Rocket className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-black text-xl uppercase italic tracking-tighter mb-3">Early Access</h3>
            <p className="text-muted-foreground text-sm font-medium leading-relaxed">Collectors get first dibs on beta testing and exclusive in-game perks.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
