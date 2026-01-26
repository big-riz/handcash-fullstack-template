import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Lock } from "lucide-react"
import { Achievement } from "@/lib/achievement-tracker"

interface AchievementsProps {
    isMobile: boolean
    achievements: Achievement[]
    onBack: () => void
}

const categoryNames = {
    combat: '⚔️ Combat',
    collection: '📦 Collection',
    skill: '🎯 Skill',
    exploration: '🗺️ Exploration',
    challenge: '🏆 Challenge'
}

const categoryColors = {
    combat: 'from-red-600/20 to-red-900/20 border-red-500/30',
    collection: 'from-blue-600/20 to-blue-900/20 border-blue-500/30',
    skill: 'from-purple-600/20 to-purple-900/20 border-purple-500/30',
    exploration: 'from-green-600/20 to-green-900/20 border-green-500/30',
    challenge: 'from-yellow-600/20 to-yellow-900/20 border-yellow-500/30'
}

export function Achievements({ isMobile, achievements, onBack }: AchievementsProps) {
    const categories: Achievement['category'][] = ['combat', 'collection', 'skill', 'exploration', 'challenge']

    const totalAchievements = achievements.length
    const unlockedAchievements = achievements.filter(a => a.isUnlocked).length
    const completionPercentage = totalAchievements > 0 ? (unlockedAchievements / totalAchievements) * 100 : 0

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
                        Achievements
                    </h1>
                    <p className="text-white/60 font-bold tracking-wider uppercase text-sm mt-2">
                        {unlockedAchievements} / {totalAchievements} Unlocked ({completionPercentage.toFixed(1)}%)
                    </p>
                </div>
                <div className={isMobile ? 'w-20' : 'w-28'}></div>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 w-full max-w-4xl mx-auto">
                <div className="w-full h-4 bg-black/80 rounded-full border-2 border-white/20 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(234,179,8,0.6)]"
                        style={{ width: `${completionPercentage}%` }}
                    />
                </div>
            </div>

            {/* Achievement Categories */}
            <div className="space-y-8 max-w-6xl mx-auto w-full">
                {categories.map(category => {
                    const categoryAchievements = achievements.filter(a => a.category === category)
                    const categoryUnlocked = categoryAchievements.filter(a => a.isUnlocked).length

                    return (
                        <div key={category} className="space-y-4">
                            <h2 className="text-2xl font-black italic uppercase text-white flex items-center gap-3">
                                {categoryNames[category]}
                                <span className="text-white/40 text-sm font-normal">
                                    ({categoryUnlocked}/{categoryAchievements.length})
                                </span>
                            </h2>

                            <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
                                {categoryAchievements.map(achievement => (
                                    <div
                                        key={achievement.id}
                                        className={`bg-gradient-to-br ${categoryColors[category]} border-2 ${isMobile ? 'p-4' : 'p-6'} rounded-2xl transition-all ${
                                            achievement.isUnlocked
                                                ? 'hover:scale-105 shadow-lg'
                                                : 'opacity-60 grayscale'
                                        }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className={`${isMobile ? 'text-3xl' : 'text-4xl'} ${achievement.isUnlocked ? '' : 'opacity-30'}`}>
                                                {achievement.isUnlocked ? achievement.icon : <Lock className="w-8 h-8 text-white/30" />}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1">
                                                <h3 className="text-white font-black text-lg mb-1">
                                                    {achievement.name}
                                                </h3>
                                                <p className="text-white/70 text-sm mb-2">
                                                    {achievement.description}
                                                </p>

                                                {/* Progress Bar */}
                                                {!achievement.isUnlocked && achievement.target > 1 && (
                                                    <div className="mt-3">
                                                        <div className="flex justify-between text-xs text-white/50 mb-1">
                                                            <span>Progress</span>
                                                            <span>{Math.floor(achievement.progress)} / {achievement.target}</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all"
                                                                style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Unlocked Date */}
                                                {achievement.isUnlocked && achievement.unlockedAt && (
                                                    <div className="mt-2 text-xs text-white/40">
                                                        Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Trophy Icon */}
            {completionPercentage === 100 && (
                <div className="mt-12 text-center animate-pulse">
                    <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                    <h2 className="text-3xl font-black italic uppercase text-yellow-400">
                        All Achievements Unlocked!
                    </h2>
                </div>
            )}
        </div>
    )
}
