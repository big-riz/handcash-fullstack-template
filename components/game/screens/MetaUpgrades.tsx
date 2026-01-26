import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, Lock, Award, TrendingUp } from "lucide-react"
import { META_UPGRADES, MetaProgressionStorage } from "@/lib/meta-progression-storage"
import { useState } from "react"

interface MetaUpgradesProps {
    isMobile: boolean
    onBack: () => void
}

const categoryNames = {
    combat: '⚔️ Combat',
    economy: '💰 Economy',
    utility: '🔧 Utility'
}

const categoryColors = {
    combat: 'from-red-600/20 to-red-900/20 border-red-500/30',
    economy: 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30',
    utility: 'from-blue-600/20 to-blue-900/20 border-blue-500/30'
}

export function MetaUpgrades({ isMobile, onBack }: MetaUpgradesProps) {
    const [progress, setProgress] = useState(MetaProgressionStorage.getProgress())
    const categories: ('combat' | 'economy' | 'utility')[] = ['combat', 'economy', 'utility']

    const handlePurchase = (upgradeId: string) => {
        const success = MetaProgressionStorage.purchaseUpgrade(upgradeId)
        if (success) {
            setProgress(MetaProgressionStorage.getProgress())
        }
    }

    const handlePrestige = () => {
        const success = MetaProgressionStorage.prestige()
        if (success) {
            setProgress(MetaProgressionStorage.getProgress())
        }
    }

    const canPrestige = META_UPGRADES.every(upgrade => {
        const level = progress.upgrades[upgrade.id] || 0
        return level >= upgrade.maxLevel
    })

    return (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex flex-col p-6 md:p-12 z-50 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <Button
                    onClick={onBack}
                    variant="outline"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10 rounded-2xl"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <div className="text-center">
                    <h1 className={`${isMobile ? 'text-4xl' : 'text-6xl'} font-black italic uppercase text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.3)]`}>
                        Meta Upgrades
                    </h1>
                    <p className="text-white/60 font-bold tracking-wider uppercase text-sm mt-2">
                        Permanent Power
                    </p>
                </div>
                <div className={isMobile ? 'w-20' : 'w-28'}></div>
            </div>

            {/* Currency Display */}
            <div className="mb-8 flex justify-center gap-6">
                <div className="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-2 border-yellow-500/40 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                    <div className="text-center">
                        <div className="text-yellow-400 text-5xl font-black mb-2">
                            🌻 {progress.sunflowerSeeds.toLocaleString()}
                        </div>
                        <div className="text-white/60 text-sm font-bold uppercase tracking-widest">
                            Sunflower Seeds
                        </div>
                        <div className="text-white/40 text-xs mt-1">
                            Lifetime: {progress.totalSeeds.toLocaleString()}
                        </div>
                    </div>
                </div>

                {progress.prestigeLevel > 0 && (
                    <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40 px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                        <div className="text-center">
                            <div className="text-purple-400 text-5xl font-black mb-2">
                                ⭐ {progress.prestigeLevel}
                            </div>
                            <div className="text-white/60 text-sm font-bold uppercase tracking-widest">
                                Prestige Level
                            </div>
                            <div className="text-white/40 text-xs mt-1">
                                +{((progress.prestigeMultiplier - 1) * 100).toFixed(0)}% Seed Gain
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Prestige Button */}
            {canPrestige && (
                <div className="mb-8 flex justify-center">
                    <Button
                        onClick={handlePrestige}
                        className="h-16 px-12 text-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.6)] uppercase tracking-wider animate-pulse"
                    >
                        <Award className="w-6 h-6 mr-3" />
                        Prestige (+10% Seeds)
                    </Button>
                </div>
            )}

            {/* Upgrade Categories */}
            <div className="space-y-8 max-w-6xl mx-auto w-full">
                {categories.map(category => {
                    const categoryUpgrades = META_UPGRADES.filter(u => u.category === category)

                    return (
                        <div key={category} className="space-y-4">
                            <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
                                {categoryNames[category]}
                            </h2>

                            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
                                {categoryUpgrades.map(upgrade => {
                                    const currentLevel = progress.upgrades[upgrade.id] || 0
                                    const isMaxed = currentLevel >= upgrade.maxLevel
                                    const cost = upgrade.cost * (currentLevel + 1)
                                    const canAfford = progress.sunflowerSeeds >= cost

                                    return (
                                        <div
                                            key={upgrade.id}
                                            className={`bg-gradient-to-br ${categoryColors[category]} border-2 ${isMobile ? 'p-4' : 'p-6'} rounded-2xl transition-all ${
                                                isMaxed ? 'shadow-lg' : canAfford ? 'hover:scale-105' : 'opacity-70'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="text-4xl">{upgrade.icon}</div>
                                                    <div>
                                                        <h3 className="text-white font-black text-lg">
                                                            {upgrade.name}
                                                        </h3>
                                                        <p className="text-white/70 text-sm">
                                                            {upgrade.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Level Display */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="text-white/60 text-sm font-bold">Level:</div>
                                                <div className="flex gap-1">
                                                    {Array.from({ length: upgrade.maxLevel }).map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                                                                i < currentLevel
                                                                    ? 'bg-green-500 border-green-400'
                                                                    : 'bg-black/40 border-white/20'
                                                            }`}
                                                        >
                                                            {i < currentLevel && <Check className="w-4 h-4 text-white" />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Purchase Button */}
                                            {!isMaxed ? (
                                                <Button
                                                    onClick={() => handlePurchase(upgrade.id)}
                                                    disabled={!canAfford}
                                                    className={`w-full ${
                                                        canAfford
                                                            ? 'bg-green-600 hover:bg-green-500'
                                                            : 'bg-gray-600 cursor-not-allowed'
                                                    } text-white font-black rounded-xl uppercase tracking-wider`}
                                                >
                                                    {canAfford ? (
                                                        <>
                                                            <TrendingUp className="w-4 h-4 mr-2" />
                                                            Upgrade ({cost} 🌻)
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Lock className="w-4 h-4 mr-2" />
                                                            Need {cost} 🌻
                                                        </>
                                                    )}
                                                </Button>
                                            ) : (
                                                <div className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-black rounded-xl py-3 text-center uppercase tracking-wider">
                                                    <Check className="w-5 h-5 inline mr-2" />
                                                    Maxed
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Info Panel */}
            <div className="mt-12 text-center text-white/40 text-sm">
                <p>Seeds are earned after each run based on your performance.</p>
                <p className="mt-2">Prestige when all upgrades are maxed to reset and gain a permanent multiplier!</p>
            </div>
        </div>
    )
}
