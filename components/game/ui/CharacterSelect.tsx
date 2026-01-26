import React, { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RotateCcw, Lock, ChevronLeft, ChevronRight } from 'lucide-react'
import characters from '../data/characters'
import { CharacterInfo } from '../types'

interface CharacterSelectProps {
    isMobile: boolean
    gameState: string
    setGameState: (state: any) => void
    selectedCharacterId: string
    setSelectedCharacterId: (id: string) => void
    unlockedCharacters: Set<string>
    onStartGame: () => void
    renderTemplateIcon: (id: string, className?: string, showGlow?: boolean) => React.ReactNode
    getItemInfo: (id: string) => { name: string, desc: string }
}

export function CharacterSelect({
    isMobile,
    gameState,
    setGameState,
    selectedCharacterId,
    setSelectedCharacterId,
    unlockedCharacters,
    onStartGame,
    renderTemplateIcon,
    getItemInfo
}: CharacterSelectProps) {

    // Cast imported data to the interface
    const characterData = characters as unknown as CharacterInfo[]

    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const checkScroll = () => {
        if (!scrollContainerRef.current) return
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
        setCanScrollLeft(scrollLeft > 10)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        if (!scrollContainerRef.current) return
        const scrollAmount = 400
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }

    return (
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center ${isMobile ? 'justify-start pt-4' : 'justify-center'} ${isMobile ? 'p-3' : 'p-8'} z-50 animate-in fade-in zoom-in duration-300`}>
            <div className={`${isMobile ? 'mb-3' : 'mb-10'} text-center`}>
                <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-4'} mb-2`}>
                    <Button variant="ghost" onClick={() => setGameState("menu")} className={`rounded-full ${isMobile ? 'h-10 w-10' : 'h-12 w-12'} border border-white/10 hover:bg-white/10 text-white/50 hover:text-white`}>
                        <RotateCcw className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </Button>
                    <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-black italic uppercase text-white tracking-tight`}>Choose Your Fighter</h2>
                </div>
                <p className={`text-white/40 font-mono ${isMobile ? 'text-[10px]' : 'text-sm'} tracking-widest uppercase`}>Select a hero to brave the night</p>
            </div>

            <div className="relative w-full mb-10">
                {/* Scroll Left Button */}
                {!isMobile && canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/80 backdrop-blur-md border-2 border-white/20 hover:border-primary hover:bg-primary/20 rounded-full p-3 transition-all hover:scale-110 active:scale-95 shadow-xl"
                    >
                        <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                )}

                {/* Scroll Right Button */}
                {!isMobile && canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/80 backdrop-blur-md border-2 border-white/20 hover:border-primary hover:bg-primary/20 rounded-full p-3 transition-all hover:scale-110 active:scale-95 shadow-xl"
                    >
                        <ChevronRight className="w-8 h-8 text-white" />
                    </button>
                )}

                {/* Left Gradient Fade */}
                {canScrollLeft && (
                    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />
                )}

                {/* Right Gradient Fade */}
                {canScrollRight && (
                    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/90 via-black/50 to-transparent z-20 pointer-events-none" />
                )}

                <div
                    ref={scrollContainerRef}
                    onScroll={checkScroll}
                    className="flex items-start gap-6 overflow-x-auto w-full px-10 py-10 snap-x snap-mandatory scrollbar-hide no-scrollbar scroll-smooth"
                >
                {characterData.map((char, index) => {
                    const isUnlocked = unlockedCharacters.has(char.id)
                    const prevChar = index > 0 ? characterData[index - 1] : null
                    return (
                        <div
                            key={char.id}
                            onClick={() => isUnlocked && setSelectedCharacterId(char.id)}
                            className={`cursor-pointer border-4 rounded-[2.5rem] p-6 transition-all relative overflow-hidden group flex flex-col shrink-0 w-[320px] md:w-[420px] h-auto snap-center
                            ${selectedCharacterId === char.id
                                    ? 'border-primary bg-primary/10 scale-105 z-10 shadow-[0_0_40px_rgba(255,100,0,0.3)]'
                                    : !isUnlocked
                                        ? 'border-white/5 bg-black/40 grayscale'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'}`}
                        >
                            <div className="flex-1 flex flex-col items-center text-center justify-center mb-6 relative">
                                <h3 className="font-black italic uppercase text-2xl md:text-3xl text-white mb-2 leading-none">{char.name}</h3>
                                <p className="text-white/60 text-sm font-medium leading-relaxed px-2 mb-4">{char.description}</p>

                                {/* Starting Weapon Badge */}
                                <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl mb-4">
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">STARTING WEAPON</span>
                                    {renderTemplateIcon(char.startingWeapon, "w-16 h-16")}
                                    <span className="text-sm font-bold text-white uppercase text-center leading-tight">
                                        {getItemInfo(char.startingWeapon).name}
                                    </span>
                                </div>
                            </div>

                            {/* Stats List */}
                            <div className="bg-black/40 rounded-3xl p-4 border border-white/5 space-y-2 mb-4">
                                {Object.entries(char.stats || {}).map(([key, val]: [string, any]) => {
                                    const labels: Record<string, string> = {
                                        maxHp: 'Health',
                                        moveSpeed: 'Speed',
                                        might: 'Might',
                                        area: 'Area',
                                        luck: 'Luck',
                                        regen: 'Regen',
                                        cooldownMultiplier: 'Cooldown'
                                    }

                                    let displayValue = "";
                                    let isGood = true;

                                    if (key === 'maxHp') {
                                        displayValue = `${val}`;
                                        isGood = val >= 100;
                                    } else if (key === 'regen') {
                                        displayValue = `${val > 0 ? '+' : ''}${val}/s`;
                                        isGood = val > 0;
                                    } else if (key === 'cooldownMultiplier') {
                                        const reduced = Math.round((1 - val) * 100);
                                        displayValue = reduced === 0 ? '-' : `-${reduced}%`;
                                        isGood = val < 1;
                                    } else {
                                        // Standard multipliers (Might, Speed, Area, Luck)
                                        const percent = Math.round((val - 1) * 100);
                                        displayValue = percent === 0 ? '-' : (percent > 0 ? `+${percent}%` : `${percent}%`);
                                        isGood = val >= 1;
                                    }

                                    return (
                                        <div key={key} className="flex justify-between text-sm items-center">
                                            <span className="uppercase text-white/40 font-black text-[10px] tracking-[0.2em]">{labels[key] || key}</span>
                                            <span className={`font-mono font-black text-xs ${displayValue === '-' ? 'text-white/20' : isGood ? 'text-green-400' : 'text-red-400'}`}>
                                                {displayValue}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Lock Overlay */}
                            {!isUnlocked && (
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center z-20">
                                    <Lock className="w-12 h-12 text-white/20 mb-4" />
                                    <div className="text-white/40 font-black text-xs uppercase tracking-widest leading-loose">
                                        LOCKED<br />
                                        <span className="text-primary">Win a run with {prevChar?.name || 'Boris'}</span><br />
                                        to unlock
                                    </div>
                                </div>
                            )}

                            {selectedCharacterId === char.id && isUnlocked && (
                                <div className="absolute inset-0 border-4 border-primary rounded-[2.5rem] animate-pulse pointer-events-none" />
                            )}
                        </div>
                    )
                })}
                </div>
            </div>

            <div className={`flex flex-col items-center ${isMobile ? 'gap-3' : 'gap-4'}`}>
                {!isMobile && (
                    <div className="flex gap-4">
                        <Button onClick={() => setGameState("menu")} variant="outline" size="lg" className="h-[80px] px-12 text-2xl font-black rounded-[2rem] border-4 border-white/20 hover:border-white text-white hover:bg-white/10 uppercase tracking-[0.2em] transition-all active:scale-95">
                            BACK
                        </Button>
                    </div>
                )}
                <Button
                    onClick={onStartGame}
                    size="lg"
                    disabled={!unlockedCharacters.has(selectedCharacterId)}
                    className={`${isMobile ? 'h-16 px-16 text-2xl' : 'h-[80px] px-24 text-4xl'} font-black rounded-[2rem] shadow-primary/60 shadow-[0_0_60px_rgba(255,100,0,0.5)] bg-primary text-black hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.2em] animate-in slide-in-from-bottom-4 disabled:opacity-20`}
                >
                    BEGIN HUNT
                </Button>
                {isMobile && (
                    <Button
                        onClick={() => setGameState("menu")}
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 text-sm font-black rounded-xl border-2 border-white/20 text-white hover:bg-white/10 uppercase tracking-wider transition-all active:scale-95"
                    >
                        BACK
                    </Button>
                )}
            </div>
        </div>
    )
}
