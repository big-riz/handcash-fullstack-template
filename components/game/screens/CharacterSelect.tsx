import { Button } from "@/components/ui/button"
import { RotateCcw, Lock, ChevronLeft, ChevronRight } from "lucide-react"
import { WORLDS } from "@/components/game/data/worlds"
import { CharacterInfo } from "../types"
import { getItemInfo } from "@/components/game/utils/itemUtils"
import { ItemIcon } from "@/components/game/ui/ItemIcon"
import { ItemTemplate } from "@/lib/item-templates-storage"
import { AudioManager } from "../core/AudioManager"
import { useRef, useState, useEffect } from "react"

interface CharacterSelectProps {
    isMobile: boolean
    characterData: CharacterInfo[]
    unlockedCharacters: Set<string>
    selectedCharacterId: string
    setSelectedCharacterId: (id: string) => void
    setGameState: (state: any) => void
    resetGame: (forReplay?: boolean) => void
    selectedWorldId: string
    itemTemplates: ItemTemplate[]
    audioManager: AudioManager | null
}

export function CharacterSelect({
    isMobile,
    characterData,
    unlockedCharacters,
    selectedCharacterId,
    setSelectedCharacterId,
    setGameState,
    resetGame,
    selectedWorldId,
    itemTemplates,
    audioManager
}: CharacterSelectProps) {
    const playHover = () => audioManager?.playUIHover();
    const playSelect = () => audioManager?.playUISelect();
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
        playHover()
        scrollContainerRef.current.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        })
    }

    return (
        <div className={`absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col items-center ${isMobile ? 'justify-start pt-6 safe-area-inset-top' : 'justify-center'} ${isMobile ? 'p-3' : 'p-8'} z-50 animate-in fade-in zoom-in duration-300 overflow-y-auto scrollbar-hide`}>
            <div className={`${isMobile ? 'mb-4' : 'mb-10'} text-center`}>
                <div className={`flex items-center justify-center ${isMobile ? 'gap-2' : 'gap-4'} mb-2`}>
                    <Button variant="ghost" onClick={() => { playSelect(); setGameState("menu"); }} onMouseEnter={playHover} className={`rounded-full ${isMobile ? 'h-10 w-10 touch-target' : 'h-12 w-12'} border border-white/10 hover:bg-white/10 active:scale-95 text-white/50 hover:text-white`}>
                        <RotateCcw className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
                    </Button>
                    <h2 className={`${isMobile ? 'text-xl' : 'text-4xl'} font-black italic uppercase text-white tracking-tight`}>Choose Your Fighter</h2>
                </div>
                <p className={`text-white/40 font-mono ${isMobile ? 'text-[9px]' : 'text-sm'} tracking-wider md:tracking-widest uppercase px-2`}>Select a hero to brave the {WORLDS.find(w => w.id === selectedWorldId)?.name}</p>
            </div>

            <div className="relative w-full mb-6 md:mb-10">
                {/* Scroll Left Button */}
                {!isMobile && canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        onMouseEnter={playHover}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/80 backdrop-blur-md border-2 border-white/20 hover:border-primary hover:bg-primary/20 rounded-full p-3 transition-all hover:scale-110 active:scale-95 shadow-xl"
                    >
                        <ChevronLeft className="w-8 h-8 text-white" />
                    </button>
                )}

                {/* Scroll Right Button */}
                {!isMobile && canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        onMouseEnter={playHover}
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
                    className="flex items-start gap-4 md:gap-6 overflow-x-auto w-full px-4 md:px-10 py-6 md:py-10 snap-x snap-mandatory scrollbar-hide no-scrollbar scroll-smooth"
                >
                {characterData.map((char, index) => {
                    const isUnlocked = unlockedCharacters.has(char.id)
                    const prevChar = index > 0 ? characterData[index - 1] : null
                    return (
                        <div
                            key={char.id}
                            onClick={() => { if (isUnlocked) { playSelect(); setSelectedCharacterId(char.id); } }}
                            onMouseEnter={playHover}
                            className={`cursor-pointer border-4 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 transition-all relative overflow-hidden group flex flex-col shrink-0 w-[320px] md:w-[420px] h-auto snap-center touch-target
                                        ${selectedCharacterId === char.id
                                    ? 'border-primary bg-primary/10 scale-105 z-10 shadow-[0_0_40px_rgba(255,100,0,0.3)]'
                                    : !isUnlocked
                                        ? 'border-white/5 bg-black/40 grayscale'
                                        : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 active:scale-[1.02]'}`}
                        >
                            <div className="flex-1 flex flex-col items-center text-center justify-center mb-6 relative">
                                <h3 className="font-black italic uppercase text-2xl md:text-3xl text-white mb-2 leading-none">{char.name}</h3>
                                <p className="text-white/60 text-sm font-medium leading-relaxed px-2 mb-4">{char.description}</p>

                                {/* Starting Weapon Badge */}
                                <div className="flex flex-col items-center gap-3 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl mb-4">
                                    <span className="text-xs font-black text-primary uppercase tracking-widest">STARTING WEAPON</span>
                                    {/* Using ItemIcon component here. Note: Original code used renderTemplateIcon("w-16 h-16") */}
                                    <ItemIcon id={char.startingWeapon} className="w-16 h-16" itemTemplates={itemTemplates} />
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

            <div className={`flex flex-col items-center ${isMobile ? 'gap-3 w-full px-4 pb-6 safe-area-inset-bottom' : 'gap-4'}`}>
                {!isMobile && (
                    <div className="flex gap-4">
                        <Button onClick={() => { playSelect(); setGameState("menu"); }} onMouseEnter={playHover} variant="outline" size="lg" className="h-[80px] px-12 text-2xl font-black rounded-[2rem] border-4 border-white/20 hover:border-white text-white hover:bg-white/10 uppercase tracking-[0.2em] transition-all active:scale-95">
                            BACK
                        </Button>
                    </div>
                )}
                <Button
                    onClick={() => { playSelect(); resetGame(false); setGameState("playing"); }}
                    onMouseEnter={playHover}
                    size="lg"
                    disabled={!unlockedCharacters.has(selectedCharacterId)}
                    className={`${isMobile ? 'h-16 px-14 text-xl touch-target w-full' : 'h-[80px] px-24 text-4xl'} font-black rounded-[2rem] shadow-primary/60 shadow-[0_0_60px_rgba(255,100,0,0.5)] bg-primary text-black hover:scale-105 active:scale-95 transition-all uppercase tracking-[0.1em] md:tracking-[0.2em] animate-in slide-in-from-bottom-4 disabled:opacity-20`}
                >
                    BEGIN HUNT
                </Button>
                {isMobile && (
                    <Button
                        onClick={() => setGameState("menu")}
                        variant="outline"
                        size="lg"
                        className="h-12 px-8 text-sm font-black rounded-xl border-2 border-white/20 text-white hover:bg-white/10 active:bg-white/5 uppercase tracking-wider transition-all active:scale-95 w-full touch-target"
                    >
                        BACK
                    </Button>
                )}
            </div>
        </div>
    )
}
