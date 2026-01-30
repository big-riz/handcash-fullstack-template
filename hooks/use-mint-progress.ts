import { useEffect, useState } from 'react'

interface MintProgress {
    templateId: string
    minted: number
    supplyLimit: number
    lastUpdate: number
}

// Global state for mint progress updates
const progressListeners = new Set<(progress: MintProgress) => void>()
let progressCache: Record<string, MintProgress> = {}

export function useMintProgress(templateId?: string) {
    const [progress, setProgress] = useState<MintProgress | null>(null)
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        if (!templateId) return

        // Initial fetch
        const fetchProgress = async () => {
            try {
                const response = await fetch(`/api/mint-progress?templateId=${templateId}`)
                if (response.ok) {
                    const data = await response.json()
                    setProgress(data)
                    progressCache[templateId] = data
                }
            } catch (error) {
                console.error('Failed to fetch mint progress:', error)
            }
        }

        fetchProgress()

        // Listen for updates
        const listener = (update: MintProgress) => {
            if (update.templateId === templateId) {
                setIsAnimating(true)
                setProgress(update)
                progressCache[templateId] = update

                // Reset animation after delay
                setTimeout(() => setIsAnimating(false), 1000)
            }
        }

        progressListeners.add(listener)

        // Poll for updates every 60 seconds, skip when tab is hidden
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return
            fetchProgress()
        }, 60000)

        return () => {
            progressListeners.delete(listener)
            clearInterval(interval)
        }
    }, [templateId])

    return { progress, isAnimating }
}

export function usePoolProgress(poolName: string) {
    const [poolItems, setPoolItems] = useState<any[]>([])
    const [totalMinted, setTotalMinted] = useState(0)
    const [totalSupplyLimit, setTotalSupplyLimit] = useState(0)
    const [isAnimating, setIsAnimating] = useState(false)

    const fetchPoolProgress = async () => {
        try {
            const response = await fetch(`/api/mint-progress?pool=${poolName}`)
            if (response.ok) {
                const data = await response.json()
                setPoolItems(data.items || [])

                const minted = data.items.reduce((acc: number, item: any) => acc + item.minted, 0)
                const limit = data.items.reduce((acc: number, item: any) => acc + item.supplyLimit, 0)

                if (minted !== totalMinted) {
                    setIsAnimating(true)
                    setTimeout(() => setIsAnimating(false), 1500)
                }

                setTotalMinted(minted)
                setTotalSupplyLimit(limit)
            }
        } catch (error) {
            console.error('Failed to fetch pool progress:', error)
        }
    }

    useEffect(() => {
        fetchPoolProgress()
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.hidden) return
            fetchPoolProgress()
        }, 60000)
        return () => clearInterval(interval)
    }, [poolName, totalMinted])

    return { poolItems, totalMinted, totalSupplyLimit, isAnimating }
}

// Call this when a mint succeeds to notify all listeners
export function notifyMintProgress(templateId: string, minted: number, supplyLimit: number) {
    const update: MintProgress = {
        templateId,
        minted,
        supplyLimit,
        lastUpdate: Date.now()
    }

    progressCache[templateId] = update
    progressListeners.forEach(listener => listener(update))
}

// Get all cached progress
export function getAllProgress(): Record<string, MintProgress> {
    return progressCache
}
